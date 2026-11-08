import { GameError } from './hero-progression.mjs';

// ActivityMgr.DecodeErl hands module_login_data to the activity parser as ETF,
// so a protobuf payload stored on an activity entry carries the six byte
// 0x83 0x6d <length> binary header first. The same wrapper is used by the
// group-buy activity and by the task-activity login sync.
export function wrapEtfBinary(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length > 0xffffffff) throw new GameError(5, 'Activity payload is too large');
  const header = Buffer.alloc(6);
  header[0] = 0x83;
  header[1] = 0x6d;
  header.writeUInt32BE(bytes.length, 2);
  return Buffer.concat([header, bytes]);
}
