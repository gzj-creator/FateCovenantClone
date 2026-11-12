#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function stringConstant(prototype, index) {
  const constant = prototype.constants[index];
  return constant?.type === 'string' ? constant.value : null;
}

function instructionNumber(prototype, instruction) {
  if (instruction.name === 'KSHORT') return (instruction.d << 16) >> 16;
  if (instruction.name === 'KNUM') return prototype.numbers[instruction.d] ?? null;
  return null;
}

function writesRegister(instruction) {
  return !new Set([
    'ISLT', 'ISGE', 'ISLE', 'ISGT', 'ISEQV', 'ISNEV', 'ISEQS', 'ISNES', 'ISEQN', 'ISNEN',
    'ISEQP', 'ISNEP', 'ISTC', 'ISFC', 'IST', 'ISF', 'ISTYPE', 'ISNUM', 'TSETV', 'TSETS',
    'TSETB', 'TSETM', 'TSETR', 'JMP', 'FORI', 'JFORI', 'FORL', 'IFORL', 'JFORL', 'ITERL',
    'IITERL', 'JITERL', 'LOOP', 'ILOOP', 'JLOOP', 'UCLO', 'RETM', 'RET', 'RET0', 'RET1',
    'FUNCF', 'IFUNCF', 'JFUNCF', 'FUNCV', 'IFUNCV', 'JFUNCV', 'FUNCC', 'FUNCCW'
  ]).has(instruction.name);
}

function define(registers, register, value) {
  registers.set(register, value);
}

function clearDestinations(registers, instruction) {
  if (!writesRegister(instruction)) return;
  registers.delete(instruction.a);
  if (instruction.name === 'CALLM' || instruction.name === 'CALLMT') {
    if (instruction.c > 0) for (let index = 1; index < instruction.c; index += 1) registers.delete(instruction.a + index);
  }
}

export function extractFunOpenConstants(parsed) {
  const root = parsed.prototypes[parsed.rootPrototype];
  let tableRegister = null;
  for (let index = 0; index + 1 < root.instructions.length; index += 1) {
    const instruction = root.instructions[index];
    const next = root.instructions[index + 1];
    if (instruction.name === 'TNEW' && next.name === 'GSET') {
      tableRegister = instruction.a;
      break;
    }
  }
  if (tableRegister == null) throw new Error('FunOpenTable root table initialization is missing');

  const registers = new Map();
  const constants = new Map();
  for (const instruction of root.instructions) {
    if (instruction.name === 'KSTR') {
      const value = stringConstant(root, instruction.c);
      if (value != null) define(registers, instruction.a, { kind: 'string', value });
      continue;
    }
    if (instruction.name === 'KSHORT' || instruction.name === 'KNUM') {
      const value = instructionNumber(root, instruction);
      if (Number.isFinite(value)) define(registers, instruction.a, { kind: 'number', value });
      continue;
    }
    if (instruction.name === 'MOV') {
      const value = registers.get(instruction.b);
      if (value) define(registers, instruction.a, value);
      else registers.delete(instruction.a);
      continue;
    }
    if (instruction.name === 'TSETS' && instruction.b === tableRegister) {
      const key = stringConstant(root, instruction.c);
      const value = registers.get(instruction.a);
      if (key?.startsWith('TID_') && value?.kind === 'number' && Number.isSafeInteger(value.value)) {
        constants.set(key, value.value);
      }
      continue;
    }
    if (instruction.name === 'TSETV' && instruction.b === tableRegister) {
      const key = registers.get(instruction.c);
      const value = registers.get(instruction.a);
      if (key?.kind === 'string' && key.value.startsWith('TID_') && value?.kind === 'number' && Number.isSafeInteger(value.value)) {
        constants.set(key.value, value.value);
      }
      continue;
    }
    clearDestinations(registers, instruction);
  }
  return constants;
}

export function findFunOpenGateSites(parsed, funIdByConstant = new Map()) {
  const sites = [];
  for (const prototype of parsed.prototypes) {
    const registers = new Map();
    for (const instruction of prototype.instructions) {
      if (instruction.name === 'GGET') {
        const value = stringConstant(prototype, instruction.d);
        if (value != null) define(registers, instruction.a, { kind: 'global', value });
        continue;
      }
      if (instruction.name === 'TGETS') {
        const source = registers.get(instruction.b);
        const key = stringConstant(prototype, instruction.c);
        if (source?.kind === 'global' && source.value === 'FunOpenMgr' && key === 'IsOpen') {
          define(registers, instruction.a, { kind: 'funOpenIsOpen', definedAt: instruction.pc });
        } else if (source?.kind === 'global' && source.value === 'FunOpenTable' && key?.startsWith('TID_')) {
          define(registers, instruction.a, { kind: 'funId', name: key, funId: funIdByConstant.get(key) ?? null, definedAt: instruction.pc });
        } else {
          define(registers, instruction.a, { kind: 'property', key });
        }
        continue;
      }
      const called = registers.get(instruction.a);
      if (['CALL', 'CALLM', 'CALLMT', 'CALLT'].includes(instruction.name) && called?.kind === 'funOpenIsOpen') {
        const argumentsFound = [...registers.values()].filter(argument => argument.kind === 'funId' && argument.definedAt > called.definedAt);
        sites.push({
          prototype: prototype.index,
          pc: instruction.pc,
          funIds: [...new Set(argumentsFound.map(argument => argument.funId).filter(Number.isSafeInteger))],
          constants: [...new Set(argumentsFound.map(argument => argument.name))],
          unmappedConstants: argumentsFound.filter(argument => !Number.isSafeInteger(argument.funId)).map(argument => argument.name)
        });
        clearDestinations(registers, instruction);
        continue;
      }
      clearDestinations(registers, instruction);
    }
  }
  return sites;
}

export function findCommandSendSites(parsed, commandNames) {
  const sites = [];
  for (const prototype of parsed.prototypes) {
    const registers = new Map();
    let pending = null;
    for (const instruction of prototype.instructions) {
      if (instruction.name === 'GGET') {
        const value = stringConstant(prototype, instruction.d);
        if (value != null) define(registers, instruction.a, value.endsWith('Cmd') ? { kind: 'commandModule', value } : { kind: 'global', value });
        continue;
      }
      if (instruction.name === 'TGETS') {
        const source = registers.get(instruction.b);
        const key = stringConstant(prototype, instruction.c);
        if (source?.kind === 'commandModule' && commandNames.has(key)) {
          const command = { kind: 'commandMethod', module: source.value, name: key };
          define(registers, instruction.a, command);
          pending = { command, register: instruction.a, tgetsPc: instruction.pc };
        } else {
          define(registers, instruction.a, { kind: 'property', key });
        }
        continue;
      }
      if (pending && ['CALL', 'CALLM', 'CALLMT', 'CALLT', 'RET'].includes(instruction.name)) {
        const called = instruction.name.startsWith('CALL') && instruction.a === pending.register;
        const returned = instruction.name === 'RET' && [...Array(Math.max(0, instruction.b))].some((_, index) => instruction.a + index === pending.register);
        if (called || returned) {
          sites.push({
            prototype: prototype.index,
            tgetsPc: pending.tgetsPc,
            callPc: instruction.name === 'RET' ? null : instruction.pc,
            module: pending.command.module,
            name: pending.command.name
          });
          pending = null;
        }
      }
      clearDestinations(registers, instruction);
    }
    for (const [register, value] of [...registers.entries()]) {
      if (value.kind !== 'commandMethod') registers.delete(register);
    }
  }
  return sites;
}

function fileLabel(file) {
  return path.basename(file).replace(/^\d+-/, '').replace(/\.lua\.bin$/, '');
}

function unique(values) {
  return [...new Set(values)];
}

const GENERIC_NAMESPACE_TOKENS = new Set([
  'ACT', 'ACTIVITY', 'AWARD', 'CMD', 'DATA', 'FUN', 'FUNC', 'GET', 'HERO', 'INFO', 'ITEM',
  'GUILD', 'LEVEL', 'LIST', 'LOGIC', 'MGR', 'MISSION', 'OPEN', 'RANK', 'RECEIVE', 'REQ', 'ROLE', 'SEND',
  'SHOP', 'TASK', 'TID', 'USE', 'FIGHT'
]);

const STRONG_WRITE_INTENT = /(^|_)(set|change|edit|save|create|delete|remove|buy|sell|use|draw|claim|award|upgrade|compose|consume|submit|cancel|kick|invite|join|leave|apply|accept|reject)(_|$)/;

export function classifyCommandAccess(command) {
  const name = String(command.name);
  if (STRONG_WRITE_INTENT.test(name)) return 'write';
  const readPattern = /(^get_|^query_|^list_|^search_|^fetch_|^load_|^check_|^preview_|^calc_|^can_|_info$|_list$|_login$|_query$|_snapshot$|_rank$|^sync|^view_)/;
  return readPattern.test(name) ? 'read' : 'write';
}

function namespaceTokens(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(token => token.length > 1 && !GENERIC_NAMESPACE_TOKENS.has(token));
}

function namespaceAffinity(command, fileLabelValue, funConstants) {
  const commandTokens = new Set(namespaceTokens(command.name));
  const sourceTokens = new Set(funConstants.flatMap(constant => namespaceTokens(constant.replace(/^TID_/, ''))));
  return [...commandTokens].filter(token => sourceTokens.has(token)).sort();
}

export function correlateFile({ file, parsed, commandNames, funIdByConstant }) {
  const gates = findFunOpenGateSites(parsed, funIdByConstant);
  const sends = findCommandSendSites(parsed, commandNames);
  const gateIds = unique(gates.flatMap(site => site.funIds));
  const unresolvedGates = gates.flatMap(site => site.unmappedConstants);
  return {
    file,
    label: fileLabel(file),
    prototypes: parsed.prototypes.length,
    gates,
    sends,
    gateIds,
    unresolvedGates
  };
}

function enumerateLuaFiles(root) {
  const files = [];
  const pending = [root];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(file);
      else if (entry.isFile() && entry.name.endsWith('.lua.bin')) files.push(file);
    }
  }
  return files.sort();
}

export function buildCommandGateReport({ projectRoot, funOpenTableFile, catalogFile }) {
  const funOpenBuffer = fs.readFileSync(funOpenTableFile);
  const catalogBuffer = fs.readFileSync(catalogFile);
  const funOpenTable = parseLuaJit(funOpenBuffer);
  const catalog = JSON.parse(catalogBuffer.toString('utf8'));
  const funIdByConstant = extractFunOpenConstants(funOpenTable);
  const commandNames = new Set(catalog.commands.map(command => command.name));
  const files = [];
  const parseErrors = [];
  for (const file of enumerateLuaFiles(projectRoot)) {
    const buffer = fs.readFileSync(file);
    if (!buffer.includes(Buffer.from('FunOpenMgr'))) continue;
    try {
      const parsed = parseLuaJit(buffer, { allowMultipleRoots: true });
      const correlated = correlateFile({ file, parsed, commandNames, funIdByConstant });
      if (correlated.sends.length || correlated.gates.length || correlated.unresolvedGates.length) files.push({ ...correlated, sha256: sha256(buffer) });
    } catch (error) {
      parseErrors.push({ file: path.relative(projectRoot, file), error: error.message });
    }
  }

  const candidatesByCommand = new Map();
  for (const file of files) {
    for (const send of file.sends) {
      const directIds = unique(file.gates.filter(gate => gate.prototype === send.prototype).flatMap(gate => gate.funIds));
      const candidate = {
        file: path.relative(projectRoot, file.file),
        module: send.module,
        prototype: send.prototype,
        tgetsPc: send.tgetsPc,
        callPc: send.callPc,
        directIds,
        fileIds: file.gateIds
      };
      if (!candidatesByCommand.has(send.name)) candidatesByCommand.set(send.name, []);
      candidatesByCommand.get(send.name).push(candidate);
    }
  }

  const catalogByName = new Map(catalog.commands.map(command => [command.name, command]));
  const constantsByFunId = new Map();
  for (const file of files) {
    for (const gate of file.gates) {
      for (const funId of gate.funIds) {
        if (!constantsByFunId.has(funId)) constantsByFunId.set(funId, new Set());
        for (const constant of gate.constants) constantsByFunId.get(funId).add(constant);
      }
    }
  }
  const constantsFor = funIds => unique(funIds.flatMap(funId => [...(constantsByFunId.get(funId) ?? [])]));
  const rules = [];
  const gaps = [];
  for (const [name, candidates] of [...candidatesByCommand.entries()].sort((left, right) => catalogByName.get(left[0]).type - catalogByName.get(right[0]).type)) {
    const command = catalogByName.get(name);
    const directIds = unique(candidates.flatMap(candidate => candidate.directIds));
    const fileIds = unique(candidates.flatMap(candidate => candidate.fileIds));
    const fileConstants = constantsFor(fileIds);
    let requires = [];
    let evidence = null;
    if (directIds.length === 1 && candidates.some(candidate => candidate.directIds.includes(directIds[0]))) {
      requires = directIds;
      evidence = 'same_prototype';
    } else if (directIds.length === 0 && fileIds.length === 1
      && candidates.some(candidate => namespaceAffinity(command, path.basename(candidate.file).replace(/^\d+-/, '').replace(/\.lua\.bin$/, ''), fileConstants).length)) {
      requires = fileIds;
      evidence = 'same_file_unique';
    }
    if (!requires.length) {
      gaps.push({ type: command.type, name, reason: directIds.length > 1 || fileIds.length > 1 ? 'ambiguous_fun_ids' : 'no_attributable_fun_id', candidates });
      continue;
    }
    const funOpenConstants = constantsFor(requires);
    const affinity = [...new Set(candidates.flatMap(candidate => namespaceAffinity(
      command,
      path.basename(candidate.file).replace(/^\d+-/, '').replace(/\.lua\.bin$/, ''),
      funOpenConstants
    )))].sort();
    rules.push({
      type: command.type,
      name,
      module: command.module,
      requires,
      evidence: {
        scope: evidence,
        funOpenConstants,
        namespaceAffinity: affinity,
        candidates
      }
    });
  }

  const rulesByType = new Map(rules.map(rule => [rule.type, rule]));
  let accessOverrides = 0;
  for (const command of catalog.commands) {
    const access = classifyCommandAccess(command);
    if (access === command.access) continue;
    accessOverrides += 1;
    const evidence = { scope: 'command_name_write_intent', reason: 'strong write verb overrides read suffix/prefix heuristic' };
    if (rulesByType.has(command.type)) {
      rulesByType.get(command.type).access = access;
      rulesByType.get(command.type).evidence.access = evidence;
    } else {
      const rule = { type: command.type, name: command.name, module: command.module, requires: [], access, evidence };
      rules.push(rule);
      rulesByType.set(command.type, rule);
    }
  }
  rules.sort((left, right) => left.type - right.type);

  return {
    schemaVersion: 1,
    generatedBy: 'tools/extract-command-fun-open-gates.mjs',
    sources: {
      funOpenTable: { file: path.basename(funOpenTableFile), sha256: sha256(funOpenBuffer), constants: funIdByConstant.size },
      commandCatalog: { file: path.basename(catalogFile), sha256: sha256(catalogBuffer), commands: catalog.commands.length }
    },
    summary: {
      scannedFiles: enumerateLuaFiles(projectRoot).length,
      funOpenFiles: files.length,
      parseErrors: parseErrors.length,
      commandsWithSends: candidatesByCommand.size,
      commandsWithRule: rules.length,
      directRules: rules.filter(rule => rule.evidence.scope === 'same_prototype').length,
      fileRules: rules.filter(rule => rule.evidence.scope === 'same_file_unique').length,
      accessOverrides,
      commandGaps: gaps.length
    },
    rules,
    gaps,
    parseErrors
  };
}

function argument(name) {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find(entry => entry.startsWith(prefix));
  return value?.slice(prefix.length) ?? null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const projectRoot = argument('project-root');
  const funOpenTableFile = argument('fun-open-table');
  const catalogFile = argument('catalog');
  const outputFile = argument('out');
  const configOut = argument('config-out');
  if (!projectRoot || !funOpenTableFile || !catalogFile) {
    console.error('usage: node tools/extract-command-fun-open-gates.mjs --project-root=<dir> --fun-open-table=<lua.bin> --catalog=<json> [--out=<json>]');
    process.exit(2);
  }
  const report = buildCommandGateReport({ projectRoot, funOpenTableFile, catalogFile });
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, output, 'utf8');
  } else {
    process.stdout.write(output);
  }
  if (configOut) {
    const config = {
      schemaVersion: report.schemaVersion,
      generatedBy: report.generatedBy,
      sources: report.sources,
      summary: report.summary,
      rules: report.rules
    };
    fs.mkdirSync(path.dirname(path.resolve(configOut)), { recursive: true });
    fs.writeFileSync(configOut, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }
}
