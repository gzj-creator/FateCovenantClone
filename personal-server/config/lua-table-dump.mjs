// Shared helpers for table dumps produced by tools/extract-lua-table.mjs.
//
// Each dump is { source, extractor, tables: { <name>: { fields, rows } } }.
// Rows keep the client column names; the readers below are the only place that
// knows how a client table is shaped.

export function rowsOf(dump, name) {
  const table = dump?.tables?.[name];
  if (!table || !Array.isArray(table.rows)) throw new Error('Missing client table: ' + name);
  return table.rows;
}

export function optionalRowsOf(dump, name) {
  const table = dump?.tables?.[name];
  return table && Array.isArray(table.rows) ? table.rows : [];
}

export function byTid(rows) {
  const map = new Map();
  for (const row of rows) {
    const tid = Number(row?.tid);
    if (Number.isSafeInteger(tid) && tid > 0) map.set(tid, row);
  }
  return map;
}

export function byField(rows, field) {
  const map = new Map();
  for (const row of rows) {
    const key = Number(row?.[field]);
    if (Number.isSafeInteger(key) && key > 0) map.set(key, row);
  }
  return map;
}

// Client tables store an empty award column either as {} (empty literal) or as
// {"global": "TableEmpty"}. Both mean "no reward configured".
export function isEmptyLiteral(value) {
  return value === null || value === undefined
    || (typeof value === 'object' && !Array.isArray(value));
}

// [[tid, count], ...] award column.
export function awardPairs(value, label) {
  if (isEmptyLiteral(value)) return [];
  if (!Array.isArray(value)) throw new Error(label + ' award configuration is invalid');
  return value.map((entry) => {
    if (!Array.isArray(entry) || entry.length < 2) throw new Error(label + ' award configuration is invalid');
    const tid = Number(entry[0]), count = Number(entry[1]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' award configuration is invalid');
    }
    return [tid, count];
  });
}

// Rows that split the same award into an id column and a count column
// (award / award_n pairs, for example AwardLib).
export function splitAward(row, idField, countField, label) {
  const ids = isEmptyLiteral(row?.[idField]) ? [] : row[idField];
  const counts = isEmptyLiteral(row?.[countField]) ? [] : row[countField];
  // Single-column award rows (AwardLib) repeat the id/count per row instead of
  // shipping parallel arrays.
  if (typeof ids === 'number' || typeof counts === 'number') {
    const tid = Number(ids), count = Number(counts);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' award configuration is invalid');
    }
    return [[tid, count]];
  }
  if (!Array.isArray(ids) || !Array.isArray(counts) || ids.length !== counts.length) {
    throw new Error(label + ' award configuration is invalid');
  }
  return ids.map((id, index) => {
    const tid = Number(id), count = Number(counts[index]);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
      throw new Error(label + ' award configuration is invalid');
    }
    return [tid, count];
  });
}

export function integerField(row, field, label, { min = 0, optional = false } = {}) {
  const raw = row?.[field];
  if (optional && (raw === null || raw === undefined)) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min) throw new Error(label + '.' + field + ' is invalid');
  return value;
}
