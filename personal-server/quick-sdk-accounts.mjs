function isCachedExternalIdentity({ uid, token }) {
  // The locked client supplies the cached QuickSDK platform uid/token here.
  // Those credentials identify the APK installation, not a server account.
  return typeof uid === 'string'
    && typeof token === 'string'
    && uid.length === 12
    && token.length === 12;
}

export function createQuickSdkIdentityResolver({ primaryAccount, phoneIdentity }) {
  if (!primaryAccount || typeof primaryAccount !== 'object') throw new TypeError('primaryAccount is required');
  if (typeof phoneIdentity !== 'function') throw new TypeError('phoneIdentity must be a function');

  return ({ uid, token }) => {
    if (uid === primaryAccount.userId) return primaryAccount;

    const phone = /^local-phone-([0-9]{11})$/.exec(uid ?? '');
    if (phone) return phoneIdentity(phone[1]);

    if (isCachedExternalIdentity({ uid, token })) return primaryAccount;

    throw new Error('Unknown local account identity');
  };
}
