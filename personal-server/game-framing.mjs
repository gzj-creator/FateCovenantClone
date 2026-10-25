// Static evidence: network DLL SHA-256 da3adac11dd39c975f0a4703f24e7cb98fe12e6189fbff589288881a6215fb83.
// GenHeaderTo 0x06000063 IL_0096..00a7 writes the payload length in network byte order.
// _VerifyStep3 0x060000c2 IL_013e..0154 subtracts the header before encoding length.
// VerifyInfo.TryParse 0x0600008a IL_001e..00cc defines the challenge slices and == 1 flags.
// See analysis/reports/private-client-16448/native-loading/findings.md and network-cil.json.

export const GAME_HEADER_BYTES = 4;
export const SERVER_CHALLENGE_BYTES = 99;
export const MAX_WIRE_PAYLOAD_BYTES = 0xffffffff;
// Local allocation policy, informed by ConnectionParam.MaxSendLength; not a proven receive limit.
export const DEFAULT_MAX_PAYLOAD_BYTES = 65536;

function bytes(value, name) {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${name} must be a Buffer or Uint8Array`);
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
}

function maximum(value) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_WIRE_PAYLOAD_BYTES) {
    throw new RangeError('maxPayloadBytes must be an integer from 0 through 0xffffffff');
  }
  return value;
}

export class GameFramingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GameFramingError';
    this.code = code;
  }
}

export function encodeGameFrame(payload, { maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES } = {}) {
  const body = bytes(payload, 'payload');
  const limit = maximum(maxPayloadBytes);
  if (body.length > limit) throw new GameFramingError('FRAME_TOO_LARGE', 'Payload exceeds maxPayloadBytes');
  const frame = Buffer.allocUnsafe(GAME_HEADER_BYTES + body.length);
  frame.writeUInt32BE(body.length, 0);
  body.copy(frame, GAME_HEADER_BYTES);
  return frame;
}

export class GameFrameDecoder {
  #maximum;
  #header = Buffer.alloc(GAME_HEADER_BYTES);
  #headerUsed = 0;
  #payload = null;
  #payloadUsed = 0;
  #failure = null;

  constructor({ maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES } = {}) {
    this.#maximum = maximum(maxPayloadBytes);
  }

  get bufferedBytes() {
    return this.#headerUsed + this.#payloadUsed;
  }

  push(chunk) {
    if (this.#failure) throw this.#failure;
    const input = bytes(chunk, 'chunk');
    const frames = [];
    let position = 0;
    while (position < input.length) {
      if (this.#payload === null) {
        const count = Math.min(GAME_HEADER_BYTES - this.#headerUsed, input.length - position);
        input.copy(this.#header, this.#headerUsed, position, position + count);
        position += count;
        this.#headerUsed += count;
        if (this.#headerUsed < GAME_HEADER_BYTES) continue;
        const length = this.#header.readUInt32BE(0);
        if (length > this.#maximum) {
          this.#failure = new GameFramingError('FRAME_TOO_LARGE', 'Declared payload exceeds maxPayloadBytes');
          throw this.#failure;
        }
        if (length === 0) {
          frames.push(Buffer.alloc(0));
          this.#headerUsed = 0;
          continue;
        }
        this.#payload = Buffer.allocUnsafe(length);
      }
      const count = Math.min(this.#payload.length - this.#payloadUsed, input.length - position);
      input.copy(this.#payload, this.#payloadUsed, position, position + count);
      position += count;
      this.#payloadUsed += count;
      if (this.#payloadUsed === this.#payload.length) {
        frames.push(this.#payload);
        this.#payload = null;
        this.#payloadUsed = 0;
        this.#headerUsed = 0;
      }
    }
    return frames;
  }

  finish() {
    if (this.#failure) throw this.#failure;
    if (this.bufferedBytes !== 0) {
      this.#failure = new GameFramingError('TRUNCATED_FRAME', 'Stream ended inside a frame');
      throw this.#failure;
    }
  }
}

// Caller supplies the configured token; this helper receives an already-decoded payload.
export function isInitialVerifyPayload(payload, configuredVerifyPayload) {
  return bytes(payload, 'payload').equals(bytes(configuredVerifyPayload, 'configuredVerifyPayload'));
}

function fixedBytes(value, name, length) {
  const result = bytes(value, name);
  if (result.length !== length) throw new RangeError(`${name} must contain exactly ${length} bytes`);
  return result;
}

function flag(value, name) {
  if (value === undefined) return 0;
  if (typeof value !== 'boolean') throw new TypeError(`${name} must be a boolean`);
  return value ? 1 : 0;
}

// This assembles opaque fields only. It does not encrypt or authenticate a challenge.
export function encodeServerChallenge({ serverKey, encryptedServerVerify, serverVerify, clientVerify, packetIv, flags = {} }) {
  if (flags === null || typeof flags !== 'object' || Array.isArray(flags)) throw new TypeError('flags must be an object');
  const payload = Buffer.alloc(SERVER_CHALLENGE_BYTES);
  fixedBytes(serverKey, 'serverKey', 16).copy(payload, 0);
  fixedBytes(encryptedServerVerify, 'encryptedServerVerify', 32).copy(payload, 16);
  fixedBytes(serverVerify, 'serverVerify', 16).copy(payload, 48);
  fixedBytes(clientVerify, 'clientVerify', 16).copy(payload, 64);
  fixedBytes(packetIv, 'packetIv', 16).copy(payload, 80);
  payload[96] = flag(flags.encryptC2S, 'encryptC2S');
  payload[97] = flag(flags.encryptS2C, 'encryptS2C');
  payload[98] = flag(flags.signature, 'signature');
  return payload;
}

// Mirrors the inspected minimum length and literal == 1 behavior; extra bytes are preserved.
export function parseServerChallenge(payload) {
  const source = bytes(payload, 'payload');
  if (source.length < SERVER_CHALLENGE_BYTES) throw new RangeError('Server challenge requires at least 99 bytes');
  const copy = (start, end) => Buffer.from(source.subarray(start, end));
  return {
    serverKey: copy(0, 16),
    encryptedServerVerify: copy(16, 48),
    serverVerify: copy(48, 64),
    clientVerify: copy(64, 80),
    packetIv: copy(80, 96),
    flags: { encryptC2S: source[96] === 1, encryptS2C: source[97] === 1, signature: source[98] === 1 },
    rawFlags: copy(96, 99),
    trailingBytes: copy(99, source.length)
  };
}
