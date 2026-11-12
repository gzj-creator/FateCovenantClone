#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import zlib from 'node:zlib';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';

const COMPARATORS = new Map([
  [3, { name: 'EGreaterThan', operator: '>=' }],
  [4, { name: 'EGreaterThan', operator: '>=' }],
  [5, { name: 'Equals', operator: '==' }],
  [7, { name: 'GreaterThan', operator: '>' }],
  [8, { name: 'ELessThan', operator: '<=' }],
  [9, { name: 'LessThan', operator: '<' }],
  [16, { name: 'NotEquals', operator: '!=' }]
]);

const CONDITION_BY_GETTER = new Map([
  ['GetRoleLv', { type: 'role_level', arg: 'level' }],
  ['GetCreateRoleDays', { type: 'create_day', arg: 'day' }],
  ['GetServerOpenDay', { type: 'server_day', arg: 'day' }]
]);

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
}

function readMaybeGzip(file) {
  const buffer = fs.readFileSync(file);
  return buffer[0] === 0x1f && buffer[1] === 0x8b ? zlib.gunzipSync(buffer) : buffer;
}

function adjacentChild(rootConstants, name) {
  for (let index = 0; index + 1 < rootConstants.length; index += 1) {
    const key = rootConstants[index];
    const value = rootConstants[index + 1];
    if (key?.type === 'string' && key.value === name && value?.type === 'child') return value.prototype;
  }
  return null;
}

export function extractDynamicArgGetters(methodTable) {
  const root = methodTable.prototypes[methodTable.rootPrototype];
  const prototype = adjacentChild(root.constants, 'DynamicArgs');
  if (prototype == null) throw new Error('MethodTable.DynamicArgs prototype is missing');
  const instructions = methodTable.prototypes[prototype].instructions;
  const constants = methodTable.prototypes[prototype].constants;
  const getters = new Map();
  for (let index = 0; index < instructions.length; index += 1) {
    const metadata = instructions[index];
    const table = constants[metadata.c];
    if (metadata.name !== 'TDUP' || table?.type !== 'table' || table.array?.length !== 2 || table.array[0] !== null) continue;
    const key = Number(table.array[1]);
    if (!Number.isSafeInteger(key) || key <= 0) continue;
    for (let lookahead = index + 1; lookahead < Math.min(instructions.length, index + 20); lookahead += 1) {
      const instruction = instructions[lookahead];
      if (instruction.name !== 'TGETS') continue;
      const getter = constants[instruction.c]?.type === 'string' ? constants[instruction.c].value : null;
      if (getter?.startsWith('Get')) {
        if (!getters.has(key)) getters.set(key, getter);
        break;
      }
    }
  }
  return getters;
}

export function indexMethodScripts(methodScript) {
  const root = methodScript.prototypes[methodScript.rootPrototype];
  const scripts = new Map();
  for (let numberIndex = 0; numberIndex + 1 < root.numbers.length; numberIndex += 2) {
    const functionInstruction = root.instructions[6 + numberIndex * 3];
    const parameterInstruction = root.instructions[9 + numberIndex * 3];
    if (functionInstruction?.name !== 'FNEW' || parameterInstruction?.name !== 'TDUP') continue;
    const child = root.constants[functionInstruction.d];
    const parameters = root.constants[parameterInstruction.d];
    if (child?.type !== 'child' || parameters?.type !== 'table') continue;
    const scriptId = Math.floor(root.numbers[numberIndex] / 2);
    if (!Number.isSafeInteger(scriptId)) continue;
    scripts.set(scriptId, {
      prototype: child.prototype,
      dynamicArgs: parameters.array.slice(1).filter(Number.isSafeInteger)
    });
  }
  return scripts;
}

function instructionNumber(prototype, instruction) {
  if (instruction.name === 'KSHORT') return (instruction.d << 16) >> 16;
  if (instruction.name === 'KNUM') return prototype.numbers[instruction.d];
  return null;
}

function directComparison(prototype) {
  const instructions = prototype.instructions;
  if (instructions.length !== 9) return null;
  const expected = [
    ['UGET', 1], ['KSHORT', 3], ['CALL', 1], ['UGET', 3], ['MOV', 5],
    ['KSHORT', 6], ['CALL', 3], ['KSHORT', 4], ['CALLT', 1]
  ];
  for (let index = 0; index < expected.length; index += 1) {
    if (instructions[index].name !== expected[index][0] || instructions[index].a !== expected[index][1]) return null;
  }
  if (instructions[2].c !== 2 || instructions[2].d !== 514
    || instructions[4].c !== 0
    || instructions[6].c !== 3 || instructions[6].d !== 515
    || instructions[8].c !== 3 || instructions[8].d !== 3) return null;
  const methodId = instructionNumber(prototype, instructions[1]);
  const dynamicArg = instructionNumber(prototype, instructions[5]);
  const threshold = instructionNumber(prototype, instructions[7]);
  if (!Number.isSafeInteger(methodId) || !Number.isSafeInteger(dynamicArg) || !Number.isFinite(threshold)) return null;
  return { methodId, dynamicArg, threshold };
}

export function classifyAssertion(scriptId, scripts, methodScript, dynamicArgGetters) {
  const script = scripts.get(scriptId);
  if (!script) return { status: 'evidence_gap', reason: 'script_mapping_missing' };
  const prototype = methodScript.prototypes[script.prototype];
  const result = {
    scriptId,
    prototype: script.prototype,
    dynamicArgs: script.dynamicArgs,
    opcodes: prototype.instructions.map(instruction => instruction.name)
  };
  const comparison = directComparison(prototype);
  if (!comparison) return { ...result, status: 'evidence_gap', reason: 'expression_not_supported' };
  const comparator = COMPARATORS.get(comparison.methodId);
  if (!comparator) return { ...result, status: 'evidence_gap', reason: `unknown_comparator_${comparison.methodId}` };
  const getter = dynamicArgGetters.get(comparison.dynamicArg);
  const condition = getter ? CONDITION_BY_GETTER.get(getter) : null;
  if (!condition) {
    return {
      ...result,
      status: 'evidence_gap',
      reason: getter ? `unmapped_dynamic_arg_${getter}` : `unknown_dynamic_arg_${comparison.dynamicArg}`
    };
  }
  return {
    ...result,
    status: 'ready',
    condition: {
      type: condition.type,
      operator: comparator.operator,
      args: { [condition.arg]: comparison.threshold }
    },
    comparison: {
      methodId: comparison.methodId,
      comparator: comparator.name,
      dynamicArg: comparison.dynamicArg,
      getter,
      threshold: comparison.threshold
    }
  };
}

function missingAssertion(scriptId) {
  return { scriptId, status: 'evidence_gap', reason: 'script_mapping_missing' };
}

export function generateFunOpenRules({ funOpenFile, funOpenRawFile, methodScriptFile, methodTableFile }) {
  const funOpenBuffer = readMaybeGzip(funOpenFile);
  const methodScriptBuffer = readMaybeGzip(methodScriptFile);
  const methodTableBuffer = readMaybeGzip(methodTableFile);
  const funOpen = JSON.parse(funOpenBuffer.toString('utf8'));
  const methodScript = parseLuaJit(methodScriptBuffer);
  const methodTable = JSON.parse(methodTableBuffer.toString('utf8'));
  const rows = funOpen.tables?.FunOpen?.rows;
  const targets = funOpen.tables?.Target?.rows;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('FunOpenTable.FunOpen has no rows');
  if (!Array.isArray(targets) || targets.length === 0) throw new Error('FunOpenTable.Target has no rows');

  const scripts = indexMethodScripts(methodScript);
  const dynamicArgGetters = extractDynamicArgGetters(methodTable);
  const targetByTid = new Map(targets.map(row => [Number(row.tid), row]));
  const assertionIds = [...new Set(rows.flatMap(row => Array.isArray(row.asserts) ? row.asserts.map(Number) : []))];
  const assertions = new Map(assertionIds.map(scriptId => [
    scriptId,
    classifyAssertion(scriptId, scripts, methodScript, dynamicArgGetters)
  ]));

  const rules = rows.map(row => {
    const funId = Number(row.tid);
    const target = targetByTid.get(Number(row.target));
    const asserts = Array.isArray(row.asserts) ? row.asserts.map(Number) : [];
    const assertEvidence = asserts.map(scriptId => assertions.get(scriptId) ?? missingAssertion(scriptId));
    const evidenceGap = [];
    if (!target) evidenceGap.push({ reason: `target_${row.target}_missing` });
    else if (target.client_req_to_open !== true) evidenceGap.push({ reason: `target_${row.target}_not_client_requested` });
    if (!Array.isArray(row.asserts)) evidenceGap.push({ reason: 'assert_list_missing_or_table_empty', value: row.asserts });
    else if (asserts.length === 0) evidenceGap.push({ reason: 'assert_list_empty' });
    else if (asserts.length > 1) evidenceGap.push({ reason: 'multiple_assert_combination_unproven' });
    if (asserts.length === 1 && assertEvidence[0].status !== 'ready') {
      evidenceGap.push({ reason: assertEvidence[0].reason ?? 'assert_condition_unproven' });
    }
    const ready = evidenceGap.length === 0 && assertEvidence.length === 1 && assertEvidence[0].status === 'ready';
    return {
      funId,
      target: row.target,
      switch: row.switch,
      sysSwitch: row.sys_switch,
      funName: row.fun_name,
      status: ready ? 'ready' : 'evidence_gap',
      conditions: ready ? [assertEvidence[0].condition] : [],
      asserts,
      ...(ready ? {} : { evidenceGap })
    };
  });

  const readyRules = rules.filter(rule => rule.status === 'ready');
  const sourceNames = file => path.basename(file);
  return {
    schemaVersion: 1,
    generatedBy: 'tools/extract-fun-open-rules.mjs',
    sources: {
      funOpenTable: {
        file: sourceNames(funOpenRawFile ?? funOpenFile),
        sha256: funOpenRawFile ? sha256(fs.readFileSync(funOpenRawFile)) : sha256(funOpenBuffer),
        extractedSha256: sha256(funOpenBuffer),
        rows: rows.length
      },
      methodScript: { file: sourceNames(methodScriptFile), sha256: sha256(methodScriptBuffer), prototypes: methodScript.prototypes.length },
      methodTable: { file: sourceNames(methodTableFile), sha256: sha256(methodTableBuffer), prototypes: methodTable.prototypes.length }
    },
    summary: {
      rules: rules.length,
      ready: readyRules.length,
      evidenceGap: rules.length - readyRules.length,
      uniqueAsserts: assertionIds.length,
      mappedAsserts: assertionIds.filter(scriptId => scripts.has(scriptId)).length,
      readyAsserts: assertionIds.filter(scriptId => assertions.get(scriptId)?.status === 'ready').length,
      dynamicArgs: Object.fromEntries([...dynamicArgGetters.entries()].slice(0, 4))
    },
    assertions: assertionIds.map(scriptId => assertions.get(scriptId)),
    rules
  };
}

function argument(name) {
  const prefix = `--${name}=`;
  const value = process.argv.slice(2).find(entry => entry.startsWith(prefix));
  return value?.slice(prefix.length) ?? null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const funOpenFile = argument('fun-open');
  const funOpenRawFile = argument('fun-open-source');
  const methodScriptFile = argument('method-script');
  const methodTableFile = argument('method-table');
  const outputFile = argument('out');
  if (!funOpenFile || !methodScriptFile || !methodTableFile) {
    console.error('usage: node tools/extract-fun-open-rules.mjs --fun-open=<json|json.gz> --method-script=<lua.bin> --method-table=<json> [--fun-open-source=<lua.bin>] [--out=<json>]');
    process.exit(2);
  }
  const output = `${JSON.stringify(generateFunOpenRules({ funOpenFile, funOpenRawFile, methodScriptFile, methodTableFile }), null, 2)}\n`;
  if (outputFile) {
    fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
    fs.writeFileSync(outputFile, output, 'utf8');
  } else {
    process.stdout.write(output);
  }
}
