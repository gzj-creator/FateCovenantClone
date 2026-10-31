import { decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import {
  NORSE_RUNE_COMMANDS,
  NORSE_RUNE_EXP_PER_COST_UNIT,
  NORSE_RUNE_MODULE
} from '../config/norse-rune-tables.mjs';

const fail = (code, message) => { throw new GameError(code, message); };
const UINT32_MAX = 0xffffffff;

function normalizeToken(value, tables) {
  const token = Number(value?.token);
  const level = Number(value?.level);
  const quality = Number(value?.quality);
  const config = tables.tokens.get(token);
  if (!config || !Number.isInteger(level) || level < 1 || level > tables.levels.size || !Number.isInteger(quality) || quality < 1 || quality > tables.qualityCount) {
    fail(5, 'Invalid Norse rune token state');
  }
  return { token, level, quality };
}

function normalizeType(value, tables) {
  const type = Number(value?.type);
  const level = Number(value?.level ?? 0);
  if (![1, 2, 3, 4].includes(type) || !Number.isInteger(level) || level < 0 || level > tables.typeMaxLevel) {
    fail(5, 'Invalid Norse rune type state');
  }
  return { type, level };
}

function normalizeState(value, tables) {
  const level = Number(value?.level ?? 1);
  const exp = Number(value?.exp ?? 0);
  if (!tables.levels.has(level) || !Number.isInteger(exp) || exp < 0 || exp > UINT32_MAX) fail(5, 'Invalid Norse rune wish state');

  const tokenList = (value?.token_list ?? []).map(token => normalizeToken(token, tables));
  if (new Set(tokenList.map(token => token.token)).size !== tokenList.length) fail(5, 'Duplicate Norse rune token state');
  tokenList.sort((left, right) => left.token - right.token);

  const byType = new Map();
  for (const type of value?.type_list ?? []) {
    const normalized = normalizeType(type, tables);
    if (byType.has(normalized.type)) fail(5, 'Duplicate Norse rune type state');
    byType.set(normalized.type, normalized);
  }
  const typeList = [1, 2, 3, 4].map(type => byType.get(type) ?? { type, level: 0 });
  const drawToken = value?.draw_token ? normalizeToken(value.draw_token, tables) : undefined;
  return { token_list: tokenList, type_list: typeList, level, exp, draw_token: drawToken };
}

function encodeState(codec, state) {
  const value = {
    token_list: state.token_list,
    type_list: state.type_list,
    level: state.level,
    exp: state.exp
  };
  if (state.draw_token) value.draw_token = state.draw_token;
  return serializedBinary(codec.pack('pb_norse_rune', value));
}

function weightedIndex(weights, random) {
  const sample = random();
  if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) fail(5, 'Invalid Norse rune random source');
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let remaining = sample * total;
  for (let index = 0; index < weights.length; index++) {
    remaining -= weights[index];
    if (remaining < 0) return index;
  }
  return weights.length - 1;
}

function uniformItem(items, random) {
  const sample = random();
  if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) fail(5, 'Invalid Norse rune random source');
  return items[Math.floor(sample * items.length)];
}

function emptyEtfArgument(value) {
  return value === undefined || value === null ||
    (Array.isArray(value) && value.length === 0) ||
    (value && typeof value === 'object' && !Buffer.isBuffer(value) && Object.keys(value).length === 0);
}

function runeTypeArgument(value) {
  const unwrapped = Array.isArray(value) && value.length === 1 ? value[0] : value;
  const type = Number(typeof unwrapped === 'object' && unwrapped !== null ? unwrapped.type : unwrapped);
  if (!Number.isInteger(type) || type < 1 || type > 4) fail(1, 'Invalid Norse rune type request');
  return type;
}

export function createNorseRuneService({ store, codec, tables, random = Math.random }) {
  const levelCount = tables.levels.size;

  function readState(model) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(NORSE_RUNE_MODULE);
    if (!module) fail(5, 'Norse rune login module is missing');
    const bytes = rawBinary(module);
    return { modules, state: normalizeState(bytes.length ? codec.unpack('pb_norse_rune', bytes) : undefined, tables) };
  }

  function writeState(model, modules, state) {
    modules.set(NORSE_RUNE_MODULE, encodeState(codec, state));
    model.state.modules.value = [...modules];
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const source = modules.get(NORSE_RUNE_MODULE);
      const state = normalizeState(source && rawBinary(source).length ? codec.unpack('pb_norse_rune', rawBinary(source)) : undefined, tables);
      writeState(model, modules, state);
      return { level: state.level, exp: state.exp, tokenCount: state.token_list.length, typeCount: state.type_list.length };
    });
  }

  function draw() {
    return store.transaction(model => {
      const { modules, state } = readState(model);
      if (state.draw_token) fail(5, 'Norse rune draw already has a pending token');
      const config = tables.levels.get(state.level);
      if (!config) fail(5, 'Norse rune wish level configuration is missing');
      if (state.exp >= config.needExp) fail(5, 'Norse rune wish level upgrade is required before drawing');

      const resource = model.resources.get(String(config.currencyTid));
      if (!resource || BigInt(resource.num ?? 0) < BigInt(config.cost)) fail(301, 'Norse rune draw currency is insufficient');
      const qualityWeights = tables.qualityWeights.get(config.showWeight);
      if (!qualityWeights) fail(5, 'Norse rune probability configuration is missing');

      resource.num = (BigInt(resource.num) - BigInt(config.cost)).toString();
      const quality = weightedIndex(qualityWeights, random) + 1;
      const token = uniformItem([...tables.tokens.keys()], random);
      const hitToken = { token, level: state.level, quality };
      const existing = state.token_list.find(entry => entry.token === token);
      let addToken;
      if (existing) state.draw_token = hitToken;
      else {
        state.token_list.push(hitToken);
        state.token_list.sort((left, right) => left.token - right.token);
        state.draw_token = undefined;
        addToken = hitToken;
      }

      const expGain = config.cost * NORSE_RUNE_EXP_PER_COST_UNIT;
      if (state.exp + expGain > UINT32_MAX) fail(1, 'Norse rune wish EXP limit reached');
      state.exp += expGain;
      writeState(model, modules, state);
      const res = { changes: [{ tid: String(config.currencyTid), new_num: resource.num, diff_num: (-BigInt(config.cost)).toString() }], is_overflow: false };
      const value = { add_token: addToken, exp: state.exp, draw_token: state.draw_token, hit_token: hitToken, res };
      return { schema: 'pb_norse_rune_draw_back', value, data: codec.pack('pb_norse_rune_draw_back', value), expGain };
    });
  }

  function replace() {
    return store.transaction(model => {
      const { modules, state } = readState(model);
      if (!state.draw_token) fail(5, 'Norse rune draw has no pending token');
      const pending = state.draw_token;
      const index = state.token_list.findIndex(entry => entry.token === pending.token);
      if (index < 0) fail(5, 'Pending Norse rune token has no occupied slot');
      state.token_list[index] = pending;
      state.draw_token = undefined;
      writeState(model, modules, state);
      return { schema: 'pb_norse_rune_token', value: pending, data: codec.pack('pb_norse_rune_token', pending) };
    });
  }

  function wishLevelUp() {
    return store.transaction(model => {
      const { modules, state } = readState(model);
      const config = tables.levels.get(state.level);
      if (!config) fail(5, 'Norse rune wish level configuration is missing');
      if (state.level >= levelCount) fail(5, 'Norse rune wish level is already at maximum');
      if (state.exp < config.needExp) fail(5, 'Norse rune wish EXP is insufficient');
      state.level += 1;
      state.exp -= config.needExp;
      writeState(model, modules, state);
      const value = { level: state.level, exp: state.exp, res: { changes: [], is_overflow: false } };
      return { schema: 'pb_norse_rune_wish_level_up_back', value, data: codec.pack('pb_norse_rune_wish_level_up_back', value) };
    });
  }

  function runeLevelUp(typeValue) {
    const type = Number(typeValue);
    if (!Number.isInteger(type) || type < 1 || type > 4) fail(1, 'Invalid Norse rune type request');
    return store.transaction(model => {
      const { modules, state } = readState(model);
      const row = state.type_list.find(entry => entry.type === type);
      if (!row) fail(5, 'Norse rune type state is missing');
      if (row.level >= tables.typeMaxLevel) fail(5, 'Norse rune type is already at maximum');
      const requiredTokens = [...tables.tokens.values()].filter(token => token.type === type);
      const owned = requiredTokens.map(config => state.token_list.find(token => token.token === config.token));
      if (owned.some(token => !token)) fail(5, 'All three Norse rune token variants are required');
      if (!owned.every(token => token.level > row.level)) fail(5, 'Norse rune token level is insufficient');
      row.level += 1;
      writeState(model, modules, state);
      return { schema: 'pb_norse_rune_type', value: row, data: codec.pack('pb_norse_rune_type', row) };
    });
  }

  async function decodeArgument(type, bytes) {
    if (!bytes?.length) return undefined;
    const decoded = await decodeEtf(bytes);
    return decoded?.value ?? decoded;
  }

  return {
    moduleId: NORSE_RUNE_MODULE,
    ensureLoginState,
    draw,
    replace,
    wishLevelUp,
    runeLevelUp,
    supports: type => Object.values(NORSE_RUNE_COMMANDS).includes(type),
    async execute(type, bytes) {
      const value = await decodeArgument(type, bytes);
      if (type === NORSE_RUNE_COMMANDS.draw) {
        if (!emptyEtfArgument(value)) fail(1, 'Invalid Norse rune draw request');
        return draw();
      }
      if (type === NORSE_RUNE_COMMANDS.replace) {
        if (!emptyEtfArgument(value)) fail(1, 'Invalid Norse rune replace request');
        return replace();
      }
      if (type === NORSE_RUNE_COMMANDS.wishLevelUp) {
        if (!emptyEtfArgument(value)) fail(1, 'Invalid Norse rune wish-level request');
        return wishLevelUp();
      }
      if (type === NORSE_RUNE_COMMANDS.runeLevelUp) return runeLevelUp(runeTypeArgument(value));
      fail(1, 'Invalid Norse rune command');
    }
  };
}
