export function createPendingRequest(
  payload,
  existing,
  { ignoredKeys = [], signatureData = payload, requestId = () => crypto.randomUUID() } = {}
) {
  const signatureObject = { ...signatureData, ...payload };
  for (const key of ['request_id', ...ignoredKeys]) delete signatureObject[key];
  const signature = JSON.stringify(signatureObject);
  if (existing?.signature === signature) return existing;
  return {
    signature,
    payload: { ...payload, request_id: typeof requestId === 'function' ? requestId() : requestId }
  };
}
