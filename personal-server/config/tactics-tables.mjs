import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('TacticsTable.data.json.gz');
const EXPECTED_COUNTS = Object.freeze({ Attr: 260, Chapter: 4, Node: 52 });
const TACTICS_POINT_ITEM = 2401900;
const CHAPTER_TIDS = Object.freeze([1, 2, 3, 4]);
const CHAPTER_OPEN_NEXT = Object.freeze([30, 48, 54, 0]);
const LEVELS_PER_NODE = 5;

let defaultCache;

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid TacticsTable ${label}`);
  }
  return number;
}

function freezeRows(table, label, expected) {
  if (!(table instanceof Map)) throw new Error(`TacticsTable ${label} is missing`);
  if (table.size !== expected) throw new Error(`TacticsTable ${label} has ${table.size} rows; expected ${expected}`);
  const rows = new Map();
  for (const [key, row] of table) {
    const tid = integer(row?.tid ?? key, `${label}.tid`, { min: 1 });
    if (rows.has(tid)) throw new Error(`TacticsTable ${label} has duplicate tid ${tid}`);
    rows.set(tid, Object.freeze({ ...row, tid }));
  }
  return rows;
}

function freezeAttrRows(source) {
  const rows = freezeRows(source, 'Attr', EXPECTED_COUNTS.Attr);
  for (const row of rows.values()) {
    const costItem = integer(row.sub_item, `Attr.${row.tid}.sub_item`, { min: 1 });
    if (costItem !== TACTICS_POINT_ITEM) {
      throw new Error(`TacticsTable Attr.${row.tid} has unexpected cost item ${costItem}`);
    }
    const cost = integer(row.sub_count, `Attr.${row.tid}.sub_count`, { min: 1, max: 2 });
    if (!Array.isArray(row.attrs) || row.attrs.length === 0) {
      throw new Error(`TacticsTable Attr.${row.tid}.attrs is empty`);
    }
    const attrs = row.attrs.map((pair, index) => {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new Error(`TacticsTable Attr.${row.tid}.attrs[${index}] is malformed`);
      }
      return Object.freeze([
        integer(pair[0], `Attr.${row.tid}.attrs[${index}].id`, { min: 1 }),
        integer(pair[1], `Attr.${row.tid}.attrs[${index}].value`, { min: 1 })
      ]);
    });
    rows.set(row.tid, Object.freeze({ tid: row.tid, costItem, cost, attrs: Object.freeze(attrs), sourceRow: row }));
  }
  return rows;
}

function freezeChapterRows(source) {
  const rows = freezeRows(source, 'Chapter', EXPECTED_COUNTS.Chapter);
  const result = new Map();
  for (const tid of CHAPTER_TIDS) {
    const row = rows.get(tid);
    if (!row) throw new Error(`TacticsTable Chapter is missing tid ${tid}`);
    const openNext = integer(row.open_next, `Chapter.${tid}.open_next`);
    if (openNext !== CHAPTER_OPEN_NEXT[tid - 1]) {
      throw new Error(`TacticsTable Chapter.${tid}.open_next is ${openNext}; expected ${CHAPTER_OPEN_NEXT[tid - 1]}`);
    }
    result.set(tid, Object.freeze({ tid, openNext, sourceRow: row }));
  }
  return result;
}

function freezeNodeRows(source, attrs) {
  const rows = freezeRows(source, 'Node', EXPECTED_COUNTS.Node);
  const result = new Map();
  const referencedAttrs = new Set();
  for (const row of rows.values()) {
    const chapter = integer(row.chapter, `Node.${row.tid}.chapter`, { min: 1, max: 4 });
    const parentNode = integer(row.parent_node, `Node.${row.tid}.parent_node`);
    const openNext = integer(row.open_next, `Node.${row.tid}.open_next`);
    if (!Array.isArray(row.level_attr) || row.level_attr.length !== LEVELS_PER_NODE) {
      throw new Error(`TacticsTable Node.${row.tid}.level_attr must contain ${LEVELS_PER_NODE} levels`);
    }
    const levelAttrs = row.level_attr.map((value, level) => {
      const tid = integer(value, `Node.${row.tid}.level_attr[${level}]`, { min: 1 });
      if (!attrs.has(tid)) throw new Error(`TacticsTable Node.${row.tid} references missing Attr ${tid}`);
      if (referencedAttrs.has(tid)) throw new Error(`TacticsTable Attr ${tid} is referenced by multiple node levels`);
      referencedAttrs.add(tid);
      return tid;
    });
    result.set(row.tid, Object.freeze({
      tid: row.tid,
      chapter,
      parentNode,
      openNext,
      levelAttrs: Object.freeze(levelAttrs),
      sourceRow: row
    }));
  }
  if (referencedAttrs.size !== EXPECTED_COUNTS.Attr) {
    throw new Error('TacticsTable Node levels do not reference every Attr row');
  }
  return result;
}

function buildNodeIndex(nodes, chapters) {
  const rootsByChapter = new Map();
  const children = new Map([...nodes.keys()].map(tid => [tid, []]));
  for (const node of nodes.values()) {
    if (node.chapter < 1 || node.chapter > CHAPTER_TIDS.length) {
      throw new Error(`TacticsTable Node.${node.tid} has an invalid chapter`);
    }
    if (node.parentNode === 0) {
      if (rootsByChapter.has(node.chapter)) {
        throw new Error(`TacticsTable Chapter.${node.chapter} has multiple root nodes`);
      }
      rootsByChapter.set(node.chapter, node);
      continue;
    }
    const parent = nodes.get(node.parentNode);
    if (!parent) throw new Error(`TacticsTable Node.${node.tid} references missing parent ${node.parentNode}`);
    if (parent.chapter !== node.chapter) {
      throw new Error(`TacticsTable Node.${node.tid} crosses chapter through parent ${parent.tid}`);
    }
    children.get(parent.tid).push(node);
  }

  for (const chapter of CHAPTER_TIDS) {
    if (!rootsByChapter.has(chapter) || !chapters.has(chapter)) {
      throw new Error(`TacticsTable Chapter.${chapter} root node is missing`);
    }
  }

  const visited = new Set();
  const visiting = new Set();
  const visit = node => {
    if (visiting.has(node.tid)) throw new Error(`TacticsTable node graph contains a cycle at ${node.tid}`);
    if (visited.has(node.tid)) return;
    visiting.add(node.tid);
    for (const child of children.get(node.tid)) visit(child);
    visiting.delete(node.tid);
    visited.add(node.tid);
  };
  for (const root of rootsByChapter.values()) visit(root);
  if (visited.size !== nodes.size) throw new Error('TacticsTable node graph is not fully reachable from four roots');

  const nodesByChapter = new Map(CHAPTER_TIDS.map(tid => [tid, []]));
  for (const node of nodes.values()) nodesByChapter.get(node.chapter).push(node);
  return { rootsByChapter, children, nodesByChapter };
}

export function readTacticsTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;
  const raw = readGeneratedTables(file, ['Attr', 'Chapter', 'Node']);
  const attrs = freezeAttrRows(raw.Attr);
  const chapters = freezeChapterRows(raw.Chapter);
  const nodes = freezeNodeRows(raw.Node, attrs);
  const { rootsByChapter, children, nodesByChapter } = buildNodeIndex(nodes, chapters);

  const result = Object.freeze({
    source: file instanceof URL ? file.pathname.split('/').pop() : String(file),
    counts: EXPECTED_COUNTS,
    tacticsPointItem: TACTICS_POINT_ITEM,
    chapterTids: CHAPTER_TIDS,
    levelsPerNode: LEVELS_PER_NODE,
    attrs,
    chapters,
    nodes,
    rootsByChapter,
    children,
    nodesByChapter,
    attrForTid(tid) {
      return attrs.get(Number(tid)) ?? null;
    },
    nodeForTid(tid) {
      return nodes.get(Number(tid)) ?? null;
    },
    chapterForTid(tid) {
      return chapters.get(Number(tid)) ?? null;
    },
    rootForChapter(chapterTid) {
      return rootsByChapter.get(Number(chapterTid)) ?? null;
    },
    totalPoints(levels, chapterTid) {
      const chapter = chapters.get(Number(chapterTid));
      if (!chapter) return null;
      let total = 0;
      for (const node of nodesByChapter.get(chapter.tid)) total += Number(levels.get(node.tid) ?? 0);
      return total;
    },
    collectBaseValues(levels) {
      const values = {};
      const add = node => {
        const level = Number(levels.get(node.tid) ?? 0);
        if (level <= 0) return;
        const attrTid = node.levelAttrs[level - 1];
        const attr = attrs.get(attrTid);
        if (!attr) throw new Error(`TacticsTable level ${level} for node ${node.tid} has no Attr row`);
        for (const [attrId, amount] of attr.attrs) values[attrId] = (values[attrId] ?? 0) + amount;
      };
      for (const chapterTid of CHAPTER_TIDS) {
        const walk = node => {
          add(node);
          for (const child of children.get(node.tid)) walk(child);
        };
        walk(rootsByChapter.get(chapterTid));
      }
      return Object.freeze(values);
    }
  });
  if (file === defaultPath) defaultCache = result;
  return result;
}

export { CHAPTER_OPEN_NEXT, CHAPTER_TIDS, EXPECTED_COUNTS, LEVELS_PER_NODE, TACTICS_POINT_ITEM };
