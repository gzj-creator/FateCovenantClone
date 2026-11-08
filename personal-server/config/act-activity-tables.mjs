import { tableAsset } from "../assets.mjs";
import { readGeneratedTables } from "./hero-tables.mjs";

// Activity configuration for the festival / sign-in / limited-target block.
// Every family below is rebuilt from the shipped Lua bundles by
// tools/extract-act-tables.mjs; nothing here is hand-copied from the client.
const SPEC = {
  signAct: ["SignActTable.data.lua.json", ["Const", "SignAct"]],
  loginRewardAct: ["LoginRewardActTable.data.lua.json", ["Award", "LoginRewardAct"]],
  commonSign: ["CommonSignTable.data.lua.json", ["CommonSign", "Const"]],
  festivalSign: ["FestivalSignActTable.data.lua.json", ["FestivalSignAct"]],
  heroSign: ["HeroSignActTable.data.lua.json", ["Award"]],
  collectExchange: ["CollectExchangeActTable.data.lua.json", ["CollectExchangeAward", "CollectExchangeConst"]],
  preheat: ["PreheatActTable.data.lua.json", ["Award", "DailyAward", "PreheatAct"]],
  stockUp: ["StockUpActTable.data.lua.json", ["Version", "DrawAward", "Shop", "VitalityAward", "Gift", "Type"]],
  christmas: ["ChristmasActTable.data.lua.json", ["Period", "DressAward", "DailyAwad", "Dress", "Wish", "WishBigAward", "WishNormalAward", "ShopAward"]],
  springFestival: ["SpringFestivalActTable.data.lua.json", ["Period", "DressAward", "DailyAwad", "Dress", "ShopItem", "ShopAward"]],
  qiXi: ["QiXiActTable.data.lua.json", ["QiXiSign", "QiXiRecharge", "QiXiGiftAward", "QiXiConst"]],
  fiveDayBoss: ["FiveDayBossActTable.data.lua.json", ["Task", "Const", "TimePass", "Medal", "Layer", "Level"]],
  firecracker: ["FirecrackerActTable.data.lua.json", ["Task", "TaskLib", "AccAward", "AccAwardLib", "Round", "Version", "RankAward"]],
  vote: ["VoteActTable.data.lua.json", ["Task", "Group", "Object", "ProgressAward", "Stage", "SubStage", "Guess", "Version", "Config"]],
  question: ["QuestionActTable.data.lua.json", ["Day", "Award", "Lib", "Pile", "Topic"]],
  banquet: ["AnniversaryBanquetActTable.data.lua.json", ["Task", "Process", "Version", "TaskType"]],
  anniversaryGame: ["AnniversaryGameActTable.data.lua.json", ["Award", "AnniversaryGameAct", "Version", "PlayCard"]],
  onesReward: ["OnesRewardTable.data.lua.json", ["OnesReward"]],
  comActDraw: ["ActivityTable.data.lua.json", ["ActDrawAward", "ActDrawAwardLib"]],
  openServerSprint: ["OpenServerSprintTable.data.lua.json", ["SprintTask"]],
  invite: ["InviteActTable.data.lua.json", ["InviteTask", "InviteAct", "InviteConst"]],
  inviteOld: ["InviteOldActTable.data.lua.json", ["InviteOldTask", "InviteOldAct"]],
  roleBack: ["RoleBackTable.data.lua.json", ["New", "Old"]],
  choiceStory: ["ChoiceStoryTable.data.lua.json", ["ChoiceStory", "Chapter", "ChapterPage", "EndingType"]],
  questionnaire: ["QuestionnaireTable.data.lua.json", ["Act", "Questionnaire", "Const", "Question", "Option"]],
  enjoyBlessing: ["EnjoyBlessingActTable.data.lua.json", ["Version", "Purchase", "Recharge", "Rebate", "Show"]],
  festivalMonster: ["FestivalMonsterActTable.data.lua.json", ["FestivalMonsterAct", "Award", "Display"]],
  valentine: ["ValentineDayActTable.data.lua.json", ["ValentineDayAct", "Const", "Content", "Photo"]],
  summer: ["SummerActTable.data.lua.json", [
    "SummerAct", "Task", "TaskProgress", "PveTask", "PvePhase", "PveConst", "PveTower",
    "PvpDayTask", "PvpLevelTask", "PvpPhase", "PvpConst", "MainMission", "SubMission", "ProgressAward",
    "Phase", "PhaseType", "Const", "PveTrailAward", "MSettleAward", "SMSettleAward"
  ]]
};

let cached;
export function readActActivityTables() {
  if (cached) return cached;
  const tables = {};
  for (const [key, [file, names]] of Object.entries(SPEC)) {
    tables[key] = readGeneratedTables(tableAsset(file), names);
  }
  cached = tables;
  return tables;
}

// ActFrameTable/ActType rows name the Lua manager that owns each activity type.
// Sign-in style activities live in the older ActivityTable registry instead, so
// both registries are offered to the resolver.
const MODULE_BY_TYPE = Object.freeze({
  174: "summer",
  178: "anniversaryGame",
  180: "fiveDayBoss",
  1002: "choiceStory",
  1012: "firecracker",
  1020: "firecracker",
  1305: "firecracker",
  1071: "enjoyBlessing",
  1073: "heroSign",
  1301: "banquet"
});

export function activityModuleForType(type) {
  return MODULE_BY_TYPE[Number(type)] ?? null;
}
