import { tableAsset } from '../assets.mjs';
import { readGeneratedTables } from './hero-tables.mjs';

const defaultPath = tableAsset('HeroTable.data.lua.json');
let defaultCache;

const EXPECTED_COUNTS = Object.freeze({
  FavourIntimacyBase: 16,
  FavourIntimacyItem: 4,
  FavourIntimacyLevel: 50,
  FavourIntimacyConst: 1,
  FavourIntimacyCycle: 2,
  FavourIntimacyCharm: 30,
  StoryChapter: 16,
  StoryChapterPage: 86,
  StoryChapterChoice: 80,
  StoryChapterPageShow: 202
});

const names = [
  'FavourIntimacyBase',
  'FavourIntimacyItem',
  'FavourIntimacyLevel',
  'FavourIntimacyConst',
  'FavourIntimacyCycle',
  'FavourIntimacyCharm',
  'StoryChapter',
  'StoryChapterPage',
  'StoryChapterChoice',
  'StoryChapterPageShow'
];

export function readFavourIntimacyTables(file = defaultPath) {
  if (file !== defaultPath) {
    const tables = readGeneratedTables(file, names);
    return withCounts(tables);
  }
  defaultCache ??= withCounts(readGeneratedTables(file, names));
  return defaultCache;
}

function withCounts(tables) {
  const counts = Object.freeze(Object.fromEntries(names.map(name => [name, tables[name]?.size ?? -1])));
  for (const name of names) {
    if (!(tables[name] instanceof Map) || tables[name].size !== EXPECTED_COUNTS[name]) {
      throw new Error(`Hero favour-intimacy ${name} has ${tables[name]?.size ?? 'no'} rows; expected ${EXPECTED_COUNTS[name]}`);
    }
  }

  const choicesByStory = new Map();
  for (const choice of tables.StoryChapterChoice.values()) {
    const story = Number(choice.story), index = Number(choice.index), tid = Number(choice.tid), level = Number(choice.intimacy_level);
    if (![story, index, tid, level].every(Number.isSafeInteger) || story <= 0 || index <= 0 || tid <= 0 || level <= 0) {
      throw new Error('Hero favour-intimacy StoryChapterChoice has invalid numeric semantics');
    }
    if (!choicesByStory.has(story)) choicesByStory.set(story, []);
    choicesByStory.get(story).push(Object.freeze({ ...choice, story, index, tid, intimacy_level: level }));
  }
  for (const story of choicesByStory.keys()) {
    const choices = choicesByStory.get(story).sort((left, right) => left.index - right.index);
    if (choices.length !== 5 || choices.some((choice, offset) => choice.index !== offset + 1)) {
      throw new Error(`Hero favour-intimacy StoryChapterChoice story ${story} is not the original five-page sequence`);
    }
    choicesByStory.set(story, Object.freeze(choices));
  }

  const pageStory = new Map();
  const terminalPagesByChoice = new Map();
  for (const story of choicesByStory.keys()) {
    for (const choice of choicesByStory.get(story)) {
      const pages = [...tables.StoryChapterPage.values()].filter(page => Number(page.chapter) === choice.tid);
      const terminalPages = pages.filter(page => Number(page.endingType) > 0 && Array.isArray(page.award) && page.award.length > 0);
      if (!terminalPages.length) {
        throw new Error(`Hero favour-intimacy story ${story} choice ${choice.tid} has no terminal award page`);
      }
      terminalPagesByChoice.set(choice.tid, Object.freeze(terminalPages));
      for (const page of pages) {
        if (pageStory.has(Number(page.tid))) throw new Error(`Hero favour-intimacy StoryChapterPage ${page.tid} is duplicated`);
        pageStory.set(Number(page.tid), story);
      }
    }
  }
  for (const base of tables.FavourIntimacyBase.values()) {
    if (!choicesByStory.has(Number(base.hero_story))) {
      throw new Error(`Hero favour-intimacy ${base.hero_tid} references an unknown story ${base.hero_story}`);
    }
  }

  return Object.assign(tables, {
    counts,
    choicesByStory,
    terminalPagesByChoice,
    pageStory,
    storyForHero(heroTid) {
      const story = Number(tables.FavourIntimacyBase.get(Number(heroTid))?.hero_story);
      return Number.isSafeInteger(story) ? story : null;
    },
    choiceForStoryIndex(story, index) {
      return choicesByStory.get(Number(story))?.find(choice => choice.index === Number(index)) ?? null;
    }
  });
}

export { EXPECTED_COUNTS as FAVOUR_INTIMACY_EXPECTED_COUNTS };
