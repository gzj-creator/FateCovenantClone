import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, readDoc, writeDoc, toSeconds, etfArgs, decodeCoopRequest
} from './guild-coop-shared.mjs';

// ChannelEntryCmd 102801. Entries are local channel policy, while opening the
// entry records a role session in the cooperation store. It lives in the same
// command family as guild cooperation, but channel entry is available before a
// role joins a guild and must not depend on module 24 membership state.
export const CHANNEL_ENTRY_COMMAND = 102801;
const SCOPE = 'channel_entry';

export function createChannelEntryService({ store, codec, coopTables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  function execute(type, bytes) {
    if (Number(type) !== CHANNEL_ENTRY_COMMAND) throw new GameError(1, 'Unknown channel entry command');
    return Promise.resolve(decodeCoopRequest(codec, null, Number(type), bytes)).then(input => {
      const decodedArgs = etfArgs(input);
      // ChannelEntryMgr.PullEntryData passes nil when it wants the default
      // channel. Atom nil is a value, but it represents the absence of a
      // channel id in this command's request contract.
      const args = decodedArgs.length === 1 && decodedArgs[0] === 'nil' ? [] : decodedArgs;
      if (args.length > 1) throw new GameError(1, 'Channel entry takes at most one parameter');
      const entries = coopTables.channel.entries;
      let entry = entries[0];
      if (args.length === 1) {
        const channelId = Number(args[0]);
        if (!Number.isSafeInteger(channelId) || channelId <= 0) {
          throw new GameError(1, 'Invalid channel entry id');
        }
        entry = entries.find(candidate => Number(candidate.channelId) === channelId);
        if (!entry) throw new GameError(5, `No channel entry is configured for channel ${channelId}`);
      }
      return store.transaction((model, db) => {
        ensureCoopTables(db);
        const at = toSeconds(now);
        const roleId = String(model.state.roleId);
        // Channel policy is global/role-scoped. Keep its state outside any
        // current guild partition so guild changes cannot hide or duplicate
        // the role's channel-entry history.
        const guildId = '0';
        if (!entry) throw new GameError(5, 'No channel entry is configured');
        const doc = readDoc(db, SCOPE, guildId, roleId, 'state') ?? { opens: 0, lastOpen: 0 };
        doc.opens = Number(doc.opens ?? 0) + 1;
        doc.lastOpen = at;
        writeDoc(db, SCOPE, guildId, roleId, 'state', doc, at);
        const value = {
          channel_id: Number(entry.channelId),
          is_open: Boolean(entry.isOpen),
          start_time: Number(entry.startTime ?? 0),
          end_time: Number(entry.endTime ?? 0),
          link_url: String(entry.linkUrl ?? ''),
          server_id_list: [],
          server_open_min_day: Number(entry.minDay ?? 0),
          server_open_max_day: Number(entry.maxDay ?? 0),
          str_channel_id: String(entry.channelId)
        };
        // The original client capture pairs this request with an empty success
        // response. ChannelEntry data is delivered through rev_channel_entry
        // (push 9804); putting pb_channel_entry in the request reply makes the
        // client decode a payload its request callback does not own and can
        // leave hall initialization blocked.
        const result = {
          data: Buffer.alloc(0),
          value: {
            channelId: entry.channelId,
            opens: doc.opens,
            channel: value
          }
        };
        log({ event: 'channel_entry_command', type: CHANNEL_ENTRY_COMMAND, ...result.value });
        return result;
      });
    });
  }
  return { supports: type => Number(type) === CHANNEL_ENTRY_COMMAND, execute, commands: Object.freeze({ entry: CHANNEL_ENTRY_COMMAND }) };
}
