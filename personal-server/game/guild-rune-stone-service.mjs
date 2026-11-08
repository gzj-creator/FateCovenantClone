import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, toSeconds, resOf, grantAwards, spendResources,
  asInteger, decodeCoopRequest
} from './guild-coop-shared.mjs';

// GuildRuneStoneCmd 92701-92703. The request already names the concrete item
// tids and slot indexes, so the authoritative inventory stays in the regular
// resource container (ItemGuildRuneStone) and the equipped guild slots are a
// separate per-role document. Compose consumes real stones and produces the
// target rows the client asked for; an unknown or non-rune item is rejected.
export const GUILD_RUNE_STONE_COMMANDS = Object.freeze({ takeOn: 92701, takeOff: 92702, compose: 92703 });

const SCOPE = 'guild_rune_stone';
const REQUEST_SCHEMAS = { 92701: 'pb_guild_rune_stone_take_on_req', 92702: 'pb_guild_rune_stone_take_off_req', 92703: 'pb_guild_rune_stone_compose_req' };

function runeStoneRow(tables, tid) {
  const item = tables.Item?.get(Number(tid));
  const type = item ? tables.Type?.get(Number(item.type)) : null;
  if (!item || type?.obj_class?.reference !== 'ItemGuildRuneStone') throw new GameError(1, 'Item is not a guild rune stone');
  return item;
}

export function createGuildRuneStoneService({ store, codec, tables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.runeStone;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_RUNE_STONE_COMMANDS));

  function slotsDoc(db, context, at) {
    const existing = readDoc(db, SCOPE, context.guildId, context.roleId, 'state');
    if (existing) return existing;
    return writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', { slots: {} }, at);
  }

  function takeOn(input) {
    const runeTid = asInteger(input?.rune_tid, 'rune tid', { min: 1 });
    const operates = Array.isArray(input?.operates) ? input.operates : [];
    if (!operates.length) throw new GameError(1, 'Rune operation list is empty');
    runeStoneRow(tables, runeTid);
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = slotsDoc(db, context, at);
      const changes = [];
      for (const operation of operates) {
        const index = asInteger(operation?.index, 'rune slot index', { min: 1, max: config.maxSlots });
        const tid = asInteger(operation?.tid, 'rune stone tid', { min: 1 });
        runeStoneRow(tables, tid);
        changes.push(...spendResources(model, [[tid, 1]]));
        const previous = Number(doc.slots[index] ?? 0);
        if (previous) changes.push(...grantAwards(model, tables, [[previous, 1]]));
        doc.slots[index] = tid;
      }
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', doc, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { equipped: Object.keys(doc.slots).length } };
    });
  }

  function takeOff(input) {
    const runeTid = asInteger(input?.rune_tid, 'rune tid', { min: 1 });
    const operates = Array.isArray(input?.operates) ? input.operates : [];
    if (!operates.length) throw new GameError(1, 'Rune operation list is empty');
    runeStoneRow(tables, runeTid);
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = slotsDoc(db, context, at);
      const changes = [];
      for (const operation of operates) {
        const index = asInteger(operation?.index, 'rune slot index', { min: 1, max: config.maxSlots });
        const tid = asInteger(operation?.tid, 'rune stone tid', { min: 1 });
        const equipped = Number(doc.slots[index] ?? 0);
        if (!equipped) throw new GameError(5, 'Rune slot is empty');
        if (equipped !== tid) throw new GameError(1, 'Rune slot does not hold the requested stone');
        changes.push(...grantAwards(model, tables, [[tid, 1]]));
        delete doc.slots[index];
      }
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', doc, at);
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { equipped: Object.keys(doc.slots).length } };
    });
  }

  function compose(input) {
    const sources = Array.isArray(input?.sources) ? input.sources : [];
    const targets = Array.isArray(input?.targets) ? input.targets : [];
    if (!sources.length || !targets.length) throw new GameError(1, 'Compose needs sources and targets');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      slotsDoc(db, context, at);
      const changes = [];
      for (const source of sources) {
        const tid = asInteger(source?.key, 'source stone tid', { min: 1 });
        const count = asInteger(source?.value, 'source stone count', { min: 1 });
        runeStoneRow(tables, tid);
        if (count !== config.composeRatio) throw new GameError(1, 'Compose ratio does not match');
        changes.push(...spendResources(model, [[tid, count]]));
      }
      for (const target of targets) {
        const tid = asInteger(target?.key, 'target stone tid', { min: 1 });
        const count = asInteger(target?.value, 'target stone count', { min: 1 });
        runeStoneRow(tables, tid);
        changes.push(...grantAwards(model, tables, [[tid, count]]));
      }
      return { data: codec.pack('pb_res_to_client', resOf(changes)), value: { sources: sources.length, targets: targets.length } };
    });
  }

  const handlers = { 92701: takeOn, 92702: takeOff, 92703: compose };
  async function execute(type, bytes) {
    const command = Number(type);
    const handler = handlers[command];
    if (!handler) throw new GameError(1, 'Unknown guild rune stone command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = handler(input);
    log({ event: 'guild_rune_stone_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_RUNE_STONE_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
