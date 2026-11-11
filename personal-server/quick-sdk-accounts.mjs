import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAPPING_VERSION = 1;

function isCachedExternalIdentity({ uid, token }) {
  // The locked client supplies the cached QuickSDK platform uid/token here.
  // Those credentials identify the external SDK account, so the bridge keeps a
  // stable server identity per uid without persisting the original credential.
  return typeof uid === 'string'
    && typeof token === 'string'
    && uid.length === 12
    && token.length === 12
    && !/[\u0000-\u001f\u007f\s]/.test(uid);
}

function hashUid(uid) {
  return crypto.createHash('sha256').update(uid, 'utf8').digest('hex');
}

function normalizeIdentity(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(label + ' must be an object');
  const userId = value.userId ?? value.accountId;
  const loginCode = value.loginCode ?? userId;
  const nickname = value.nickname ?? '命运旅者';
  if (typeof userId !== 'string' || !userId || userId.length > 512) throw new TypeError(label + ' userId must be a nonempty string');
  if (typeof loginCode !== 'string' || !loginCode || loginCode.length > 512) throw new TypeError(label + ' loginCode must be a nonempty string');
  if (typeof nickname !== 'string' || !nickname) throw new TypeError(label + ' nickname must be a nonempty string');
  return Object.freeze({ userId, loginCode, nickname });
}

function validateMapping(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('QuickSDK identity mapping is malformed');
  if (value.version !== MAPPING_VERSION) throw new Error('Unsupported QuickSDK identity mapping version');
  if (value.primaryUidHash != null && !/^[0-9a-f]{64}$/.test(value.primaryUidHash)) {
    throw new Error('QuickSDK identity mapping has an invalid primary hash');
  }
  if (!Array.isArray(value.identities)) throw new Error('QuickSDK identity mapping has no identities list');
  const seen = new Set();
  const identities = value.identities.map(entry => {
    if (!entry || typeof entry !== 'object' || !/^[0-9a-f]{64}$/.test(entry.uidHash ?? '')) {
      throw new Error('QuickSDK identity mapping has an invalid uid hash');
    }
    if (seen.has(entry.uidHash)) throw new Error('QuickSDK identity mapping has a duplicate uid hash');
    seen.add(entry.uidHash);
    const identity = normalizeIdentity(entry, 'QuickSDK identity mapping entry');
    return Object.freeze({ uidHash: entry.uidHash, accountId: identity.userId, loginCode: identity.loginCode, nickname: identity.nickname });
  });
  return Object.freeze({ version: MAPPING_VERSION, primaryUidHash: value.primaryUidHash ?? null, identities: Object.freeze(identities) });
}

function emptyMapping() {
  return Object.freeze({ version: MAPPING_VERSION, primaryUidHash: null, identities: Object.freeze([]) });
}

function identityFromMapping(entry) {
  return Object.freeze({ userId: entry.accountId, loginCode: entry.loginCode, nickname: entry.nickname });
}

export function createQuickSdkIdentityResolver({
  primaryAccount,
  phoneIdentity,
  mappingPath,
  primaryExternalUid,
  bindFirstIdentityToPrimary = true,
  logger = () => {}
}) {
  const primary = normalizeIdentity(primaryAccount, 'primaryAccount');
  if (typeof phoneIdentity !== 'function') throw new TypeError('phoneIdentity must be a function');
  if (mappingPath != null && (typeof mappingPath !== 'string' || mappingPath.length === 0)) {
    throw new TypeError('mappingPath must be a nonempty string');
  }
  if (typeof bindFirstIdentityToPrimary !== 'boolean') throw new TypeError('bindFirstIdentityToPrimary must be a boolean');
  if (primaryExternalUid != null && !isCachedExternalIdentity({ uid: primaryExternalUid, token: '000000000000' })) {
    throw new TypeError('primaryExternalUid must be a 12-character external identity');
  }
  const resolvedMappingPath = mappingPath == null ? null : path.resolve(mappingPath);
  const configuredPrimaryHash = primaryExternalUid == null ? null : hashUid(primaryExternalUid);
  let mapping = null;

  function readMapping() {
    if (mapping) return mapping;
    if (!resolvedMappingPath) {
      mapping = emptyMapping();
      return mapping;
    }
    try {
      mapping = validateMapping(JSON.parse(fs.readFileSync(resolvedMappingPath, 'utf8')));
    } catch (error) {
      if (error?.code === 'ENOENT') {
        mapping = emptyMapping();
      } else {
        throw new Error('QuickSDK identity mapping is unreadable');
      }
    }
    return mapping;
  }

  function persist(next) {
    const frozen = validateMapping(next);
    if (!resolvedMappingPath) {
      mapping = frozen;
      return;
    }
    fs.mkdirSync(path.dirname(resolvedMappingPath), { recursive: true });
    const temporary = `${resolvedMappingPath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    try {
      const fd = fs.openSync(temporary, 'wx', 0o600);
      try {
        fs.writeFileSync(fd, JSON.stringify(frozen, null, 2) + '\n', 'utf8');
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      fs.renameSync(temporary, resolvedMappingPath);
      fs.chmodSync(resolvedMappingPath, 0o600);
      mapping = frozen;
    } catch (error) {
      try { fs.unlinkSync(temporary); } catch {}
      throw error;
    }
  }

  return ({ uid, token }) => {
    if (uid === primary.userId) return primary;

    const phone = /^local-phone-([0-9]{11})$/.exec(uid ?? '');
    if (phone) return phoneIdentity(phone[1]);

    if (!isCachedExternalIdentity({ uid, token })) throw new Error('Unknown local account identity');
    const uidHash = hashUid(uid);
    const current = readMapping();
    if (configuredPrimaryHash && uidHash === configuredPrimaryHash) {
      if (current.primaryUidHash !== uidHash) persist({ ...current, primaryUidHash: uidHash });
      return primary;
    }
    if (current.primaryUidHash === uidHash) return primary;
    const existing = current.identities.find(entry => entry.uidHash === uidHash);
    if (existing) return identityFromMapping(existing);

    const bindsPrimary = current.identities.length === 0 && bindFirstIdentityToPrimary;
    const identity = bindsPrimary
      ? primary
      : Object.freeze({
          userId: 'local-quick-' + uidHash,
          loginCode: 'quick-' + uidHash,
          nickname: primary.nickname
        });
    persist({
      version: MAPPING_VERSION,
      primaryUidHash: bindsPrimary ? uidHash : current.primaryUidHash,
      identities: [
        ...current.identities,
        {
          uidHash,
          accountId: identity.userId,
          loginCode: identity.loginCode,
          nickname: identity.nickname
        }
      ]
    });
    logger({ event: 'quick_sdk_identity_bound', accountId: identity.userId, boundPrimary: bindsPrimary });
    return identity;
  };
}
