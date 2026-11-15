import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('HeroLegendTable.data.json.gz');
let defaultCache;

const FAMILIES = Object.freeze([
  'BookBlessStar', 'BookBlessOpen', 'Book', 'BookShowParam', 'BookStage',
  'BookAttr', 'BookStar', 'BookLevel', 'BlessHero'
]);

const EXPECTED_COUNTS = Object.freeze({
  BookBlessStar: 11,
  BookBlessOpen: 3,
  Book: 17,
  BookShowParam: 17,
  BookStage: 4,
  BookAttr: 64,
  BookStar: 6,
  BookLevel: 15,
  BlessHero: 3
});

export const HERO_LEGEND_INITIAL_STAR = 5;
export const HERO_LEGEND_MAX_STAR = 10;
export const HERO_LEGEND_MAX_LEVEL = 15;
export const HERO_LEGEND_MAX_STAGE = 4;
export const HERO_LEGEND_LEVELS_PER_STAGE = 5;
export const HERO_LEGEND_BLESS_SLOTS = 3;

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid HeroLegend ${label}: ${value}`);
  }
  return number;
}

function freezeRows(table, label, expected, { minTid = 1 } = {}) {
  if (!(table instanceof Map)) throw new Error(`HeroLegend ${label} is missing`);
  if (table.size !== expected) {
    throw new Error(`HeroLegend ${label} has ${table.size} rows; expected ${expected}`);
  }
  const rows = new Map();
  for (const [key, value] of table) {
    const tid = integer(value?.tid ?? key, `${label}.tid`, { min: minTid });
    if (rows.has(tid)) throw new Error(`HeroLegend ${label} has duplicate tid ${tid}`);
    rows.set(tid, Object.freeze({ ...value, tid }));
  }
  return rows;
}

function attrPairs(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`HeroLegend ${label} is empty`);
  return Object.freeze(value.map((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`HeroLegend ${label}[${index}] is malformed`);
    return Object.freeze([
      integer(pair[0], `${label}[${index}].id`, { min: 1 }),
      integer(pair[1], `${label}[${index}].value`, { min: 0 })
    ]);
  }));
}

export function readHeroLegendTables(file = defaultPath) {
  if (file === defaultPath && defaultCache) return defaultCache;

  const raw = readGeneratedTables(file, FAMILIES);
  const tables = {};
  for (const name of FAMILIES) {
    tables[name] = freezeRows(raw[name], name, EXPECTED_COUNTS[name], {
      minTid: name === 'BookBlessStar' ? 0 : 1
    });
  }

  for (let tid = 0; tid <= HERO_LEGEND_MAX_STAR; tid += 1) {
    const row = tables.BookBlessStar.get(tid);
    if (!row) throw new Error(`HeroLegend BookBlessStar is missing tid ${tid}`);
    attrPairs(row.attr, `BookBlessStar.${tid}.attr`);
  }
  for (let tid = 1; tid <= HERO_LEGEND_BLESS_SLOTS; tid += 1) {
    const row = tables.BookBlessOpen.get(tid);
    if (!row) throw new Error(`HeroLegend BookBlessOpen is missing slot ${tid}`);
    const expectedStar = tid === 1 ? 6 : tid === 2 ? 8 : 10;
    if (integer(row.need_star, `BookBlessOpen.${tid}.need_star`) !== expectedStar) {
      throw new Error(`HeroLegend BookBlessOpen.${tid}.need_star changed unexpectedly`);
    }
  }

  for (let tid = HERO_LEGEND_INITIAL_STAR; tid <= HERO_LEGEND_MAX_STAR; tid += 1) {
    const row = tables.BookStar.get(tid);
    if (!row) throw new Error(`HeroLegend BookStar is missing star ${tid}`);
    attrPairs(row.attr, `BookStar.${tid}.attr`);
  }
  for (let tid = 1; tid <= HERO_LEGEND_MAX_LEVEL; tid += 1) {
    const row = tables.BookLevel.get(tid);
    if (!row) throw new Error(`HeroLegend BookLevel is missing level ${tid}`);
    integer(row.need_piece, `BookLevel.${tid}.need_piece`, { min: 1 });
    attrPairs(row.attr, `BookLevel.${tid}.attr`);
  }
  for (let tid = 1; tid <= HERO_LEGEND_MAX_STAGE; tid += 1) {
    const row = tables.BookStage.get(tid);
    if (!row) throw new Error(`HeroLegend BookStage is missing stage ${tid}`);
    const expectedLevel = (tid - 1) * HERO_LEGEND_LEVELS_PER_STAGE;
    if (integer(row.need_star, `BookStage.${tid}.need_star`) !== HERO_LEGEND_MAX_STAR
      || integer(row.need_level, `BookStage.${tid}.need_level`) !== expectedLevel) {
      throw new Error(`HeroLegend BookStage.${tid} progression row changed unexpectedly`);
    }
    attrPairs(row.attr, `BookStage.${tid}.attr`);
  }

  const booksByHeroTid = new Map();
  for (const book of tables.Book.values()) {
    if (!Array.isArray(book.bless_hero) || book.bless_hero.length !== HERO_LEGEND_BLESS_SLOTS) {
      throw new Error(`HeroLegend Book.${book.tid}.bless_hero must contain ${HERO_LEGEND_BLESS_SLOTS} slots`);
    }
    const blessHeroes = new Set();
    for (const [index, rawTid] of book.bless_hero.entries()) {
      const tid = integer(rawTid, `Book.${book.tid}.bless_hero[${index}]`, { min: 1 });
      if (blessHeroes.has(tid)) throw new Error(`HeroLegend Book.${book.tid} repeats blessing hero ${tid}`);
      blessHeroes.add(tid);
    }
    integer(book.attr, `Book.${book.tid}.attr`, { min: 1 });
    integer(book.skill, `Book.${book.tid}.skill`, { min: 1 });
    if (!tables.BookShowParam.has(book.tid)) throw new Error(`HeroLegend Book ${book.tid} is missing BookShowParam`);
    if (booksByHeroTid.has(book.tid)) throw new Error(`HeroLegend Book ${book.tid} is duplicated`);
    booksByHeroTid.set(book.tid, book);
  }

  const frozen = Object.freeze({
    source: Object.freeze({
      file: '11036551874206065000-HeroLegendTable.data.lua.bin',
      sha256: '72dcade6f1ca9691858ad39c7e5b7cc849cc9ac195ad129be6958aa966a47575'
    }),
    counts: EXPECTED_COUNTS,
    rows: tables,
    booksByHeroTid,
    bookForHeroTid(tid) { return booksByHeroTid.get(Number(tid)) ?? null; },
    blessOpenForSlot(slot) { return tables.BookBlessOpen.get(Number(slot)) ?? null; },
    blessHeroForSlot(book, slot) {
      const index = Number(slot) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= HERO_LEGEND_BLESS_SLOTS) return null;
      return Number(book.bless_hero[index]);
    },
    levelConfig(level) { return tables.BookLevel.get(Number(level)) ?? null; },
    stageConfig(stage) { return tables.BookStage.get(Number(stage)) ?? null; }
  });
  if (file === defaultPath) defaultCache = frozen;
  return frozen;
}

export { EXPECTED_COUNTS, FAMILIES };
