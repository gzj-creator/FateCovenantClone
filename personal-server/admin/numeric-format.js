// JSON carries large integer quantities as decimal strings. Formatting must not
// convert them back to Number and discard their last digits (fix N3).
const exactInteger = value => {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return 0n;
  try { return BigInt(value ?? 0); } catch { return 0n; }
};

export const quantity = value => exactInteger(value).toLocaleString('zh-CN');

export function money(cents) {
  const value = exactInteger(cents), absolute = value < 0n ? -value : value;
  return (value < 0n ? '-¥ ' : '¥ ')
    + (absolute / 100n).toLocaleString('zh-CN') + '.' + String(absolute % 100n).padStart(2, '0');
}
