import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';
import { readGeneratedDump, readHeroTables } from '../personal-server/config/hero-tables.mjs';
import { readMissionTables } from '../personal-server/config/mission-tables.mjs';
import { readJourneyFightTables } from '../personal-server/config/journey-fight-tables.mjs';
import { readGuideTables } from '../personal-server/config/guide-tables.mjs';
import { readFightShard } from './read-fight-shard.mjs';
import { projectDocumentedFeatureRules } from './documented-rule-decisions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/gameplay-operations/appendices');
fs.mkdirSync(out, { recursive: true });
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const sha = name => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
const generatedFiles = [];
const write = (name, value) => {
  fs.writeFileSync(path.join(out, name), value, 'utf8');
  generatedFiles.push({ path: 'docs/gameplay-operations/appendices/' + name,
    sha256: crypto.createHash('sha256').update(value).digest('hex') });
};
const cell = value => String(value ?? '—').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const link = value => `[${cell(value)}](../../../${value})`;
const auditFile = 'personal-server/config/command-dispatch-audit.json';
const inventoryFile = 'docs/plans/remaining-gameplay-20261106/inventory.json';
const featureFile = 'personal-server/config/fun-open-rules.json';
const audit = read(auditFile), inventory = read(inventoryFile), features = read(featureFile);
for (const { path: name, sha256 } of Object.values(audit.source)) {
  if (sha(name).toUpperCase() !== sha256.toUpperCase()) throw new Error(`Stale audit input: ${name}`);
}
const oldByType = new Map(inventory.commands.map(row => [row.type, row]));
const groups = new Map();
for (const row of audit.commands) {
  const old = oldByType.get(row.type);
  if (!old) throw new Error(`Unmapped command ${row.type}`);
  if (!groups.has(row.task)) groups.set(row.task, { task: row.task, title: old.title, plan: old.plan, modules: new Set(), rows: [] });
  const group = groups.get(row.task);
  group.modules.add(row.module); group.rows.push(row);
}
let moduleText = '# 全模块对照目录\n\n重建日期：2026-11-15。路由审计快照为2026-11-14，标题沿用2026-11-06静态目录释义，中文界面名称仍须客户端核对。每一行是协议任务分组，不等同于完整可玩系统；执行规则见[最终R1裁定](../rules/final-rule-register.md)。\n\n';
moduleText += '状态：S=service_route，G=gateway_route，M=multi_owner，U=unrouted；M 表示存在多个声明且只有首个可达，不表示多条业务均已完成。业务证据与 APK 验收见逐模块实施记录。\n\n';
moduleText += '|任务|玩法/功能|协议模块|命令数|S/G/M/U|当前服务所有者|原任务卡|\n|---|---|---|---:|---|---|---|\n';
for (const group of groups.values()) {
  const count = status => group.rows.filter(row => row.status === status).length;
  moduleText += `|${group.task}|${cell(group.title)}|${cell([...group.modules].join(', '))}|${group.rows.length}|${['service_route','gateway_route','multi_owner','unrouted'].map(count).join('/')}|${cell([...new Set(group.rows.map(row => row.reachableOwner).filter(Boolean))].join(', '))}|[历史规则卡](../../plans/remaining-gameplay-20261106/${group.plan})|\n`;
}
write('modules.md', moduleText);
let commandText = '# 全部 1407 条 C2S 命令对照\n\n重建日期：2026-11-15，路由审计快照为2026-11-14。本表覆盖已恢复的静态C2S目录，不证明全部原版内容已取得或业务正确。`responseRuntimeVerification=unverified`是本静态审计口径，不否认独立历史TCP验证；编码冲突为启发式线索，不能批量改编码。执行规则见[最终R1裁定](../rules/final-rule-register.md)。\n\n';
commandText += '|type|命令|任务|路由/所有者|请求：原声明 → 当前识别|响应 schema|审计缺口|\n|---:|---|---|---|---|---|---|\n';
for (const row of audit.commands) {
  commandText += `|${row.type}|${cell(row.name)}|${row.task}|${row.status}/${row.reachableOwner ?? '—'}|${row.requestEncoding} → ${row.runtimeRequestEncoding}${row.requestSchema ? '/' + row.requestSchema : ''}|${cell(row.responseSchema)}|${cell(row.evidenceGaps.join(', '))}|\n`;
}
write('commands.md', commandText);

const guideFile = 'analysis/scratchpad/time-temple-20261108/project/424837726185043140-GuideTable.data.lua.bin';
const guide = readGeneratedDump(parseLuaJit(fs.readFileSync(path.join(root, guideFile))), ['Process', 'Award', 'Step', 'Const']);
const deployedGuide = readGuideTables();
for (const [family, rows] of Object.entries(guide)) {
  if (rows.size !== deployedGuide[family].size) throw new Error(`Guide asset row count differs: ${family}`);
  for (const [tid, row] of rows) {
    if (JSON.stringify(row) !== JSON.stringify(deployedGuide[family].get(tid))) throw new Error(`Guide asset row differs: ${family}/${tid}`);
  }
}
const guideJson = Object.fromEntries(Object.entries(guide).map(([key, rows]) => [key, [...rows.values()]]));
write('guide-source-rows.json', JSON.stringify({ source: guideFile, sha256: sha(guideFile), tables: guideJson }, null, 2) + '\n');
let guideFlowText = '# 原版引导全部流程与步骤\n\n2026-11-14静态原表。以下141个Process和718个Step完整列出，条件/事件ID保留原值，未恢复脚本的条件ID不能按名称猜语义。normal/special是原数组分段；keys决定可保存检查点，只有末key代表流程结束。所有其他原字段及常量见[完整JSON](guide-source-rows.json)。\n\n## Process流程\n\n';
guideFlowText += '|Process|类型|正常步骤分段|特殊恢复分段|保存keys|后继Process|触发条件ID|\n|---:|---:|---|---|---|---|---|\n';
for (const row of guide.Process.values()) {
  guideFlowText += `|${row.tid}|${row.guide_type}|${cell(JSON.stringify(row.normal_steps))}|${cell(JSON.stringify(row.special_steps))}|${cell(JSON.stringify(row.keys))}|${cell(JSON.stringify(row.next_process))}|${cell(row.trigger_condition)}|\n`;
}
guideFlowText += '\n## Step步骤\n\n|Step|模块|参数param / ref_int|触发事件 / 条件|完成事件 / 条件|guide_node|操作与展示字段|\n|---:|---|---|---|---|---:|---|\n';
for (const row of guide.Step.values()) {
  const presentation = { need_black_mask: row.need_black_mask, wait_finish_lock: row.wait_finish_lock,
    over_jump: row.over_jump, story: row.story, cartoon_chapter: row.cartoon_chapter,
    finger_tips: row.finger_tips, finger_tips_type: row.finger_tips_type,
    finger_tips_pos: row.finger_tips_pos, bubble: row.bubble, sound: row.sound };
  guideFlowText += `|${row.tid}|${cell(row.step_module?.reference)}|${cell(JSON.stringify(row.param))} / ${row.ref_int_param}|${cell(JSON.stringify(row.trigger_events))} / ${cell(row.trigger_condition)}|${cell(JSON.stringify(row.finish_events))} / ${cell(row.finish_condition)}|${row.guide_node}|\`${cell(JSON.stringify(presentation))}\`|\n`;
}
write('guide-processes-and-steps.md', guideFlowText);
const heroes = readHeroTables();
const heroName = tid => heroes.Hero.get(Number(tid))?.name ?? '';
const guideReferences = new Map();
for (const step of guide.Step.values()) {
  if (!JSON.stringify(step).includes('GuideAwardStep')) continue;
  const award = Number(step.ref_int_param);
  if (!guideReferences.has(award)) guideReferences.set(award, []);
  guideReferences.get(award).push(step.tid);
}
let guideText = '# 原客户端引导配置与奖励\n\n2026-11-14 从本地 LuaJIT 配置读取，并与服务端 GuideTable 资产逐行核对。原表事实、资格恢复和客户端实际到账分别验收。Award1 要求通关10202；Award2 要求通关20201，不能提前用第二名赠角通过2-1。服务端专项已验证发奖、位图、防重和重登，真实 APK 尚未验收。完整 Process/Step/Const 见 [结构化行数据](guide-source-rows.json)。\n\n';
guideText += `来源：${link(guideFile)}；SHA256：\`${sha(guideFile)}\`。\n\n`;
guideText += `Process ${guide.Process.size}，Step ${guide.Step.size}，Award ${guide.Award.size}。\n\n|Award|奖励 tid × 数量|引用 GuideAwardStep|\n|---:|---|---|\n`;
for (const row of guide.Award.values()) {
  const items = (row.award_i ?? []).map((tid, index) => [tid, row.award_n?.[index]]);
  if (items.length !== row.award_n?.length) throw new Error(`Guide award ${row.tid} item/count mismatch`);
  guideText += `|${row.tid}|${cell(items.map(([tid, num]) => `${tid}${heroName(tid) ? '(' + heroName(tid) + ')' : ''} × ${num}`).join('；'))}|${cell((guideReferences.get(Number(row.tid)) ?? []).join(', '))}|\n`;
}
guideText += '\n`ref_int_param` 是领奖 tid；Process 的保存 key 与步骤 ID、触发条件、完成条件必须分别核对。不得仅凭此表把所有奖励在创角时一次性发放。\n';
write('guide-awards.md', guideText);

const fightFile = 'personal-server/assets/tables/JourneyFightTable.data.json.gz';
const fight = readJourneyFightTables();
const fightAsset = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, fightFile))));
const rebuiltFight = Object.fromEntries(Object.keys(fight).map(family => [family, new Map()]));
const fightShardFiles = [];
for (const source of fightAsset.sources) {
  const name = 'analysis/scratchpad/time-temple-20261108/project/' + source.name;
  if (sha(name) !== source.sha256) throw new Error(`Changed fight source: ${name}`);
  const family = source.name.match(/-FightTable\.([A-Za-z]+)\./)?.[1];
  if (!rebuiltFight[family]) throw new Error(`Unexpected fight source family: ${name}`);
  const rows = readFightShard(parseLuaJit(fs.readFileSync(path.join(root, name))));
  if (rows.size !== source.rows) throw new Error(`Changed fight source row count: ${name}`);
  for (const [tid, row] of rows) {
    if (rebuiltFight[family].has(tid)) throw new Error(`Duplicate fight row: ${family}/${tid}`);
    rebuiltFight[family].set(tid, row);
    if (JSON.stringify(row) !== JSON.stringify(fight[family].get(tid))) throw new Error(`Fight asset differs: ${family}/${tid}`);
  }
  fightShardFiles.push(name);
}
for (const family of Object.keys(fight)) {
  if (rebuiltFight[family].size !== fight[family].size) throw new Error(`Fight asset row count differs: ${family}`);
}
const sections = readMissionTables().sections;
const selected = [...sections.values()].filter(row => Number(row.tid) < 50000);
const missionRows = selected.map(section => {
  const config = fight.Fight.get(Number(section.fight));
  const teams = (config?.def_team ?? []).map(id => ({ id, ...fight.Team.get(Number(id)) }));
  const attackTeams = (config?.atk_team ?? []).map(id => ({ id, ...fight.Team.get(Number(id)) }));
  return { section, fight: config ?? null, teams, attackTeams };
});
write('early-missions.json', JSON.stringify({ source: fightFile, note: '静态原表及服务端资产逐行一致；atk_team 是否覆盖玩家出战需运行证据，不能仅据预览表断言。is_discard=true 不进入当前主线顺序。', rows: missionRows }, null, 2) + '\n');
let missionText = '# 前四章关卡与原版敌阵对照\n\n2026-11-14 静态取证，已核对 JourneyFightTable 所用全部分片。`Section.enemy` 为地图展示配置；当前服务端普通主线通过 `Section.fight → Fight.def_team → Team → NpcAttr` 生成敌阵，NPC 经 `HeroTable.Npc.relation_hero` 取外观。team_lv 为 NpcAttr 模板键，NPC 显示等级为1，不能套玩家等级。固定攻方引用已提取，其覆盖玩家编队的运行语义尚未证明。弃用节点不进入主线顺序。\n\n';
missionText += '|Section|状态|fight|地图展示 enemy|原表 atk_team|敌方 team|NpcAttr模板键|实际 NPC / 位置|\n|---:|---|---:|---|---|---|---|---|\n';
for (const row of missionRows) {
  const missing = Number(row.section.fight) === 0 ? '无战斗（剧情节点）' : '待补分片';
  const status = row.section.is_discard ? '弃用' : Number(row.section.fight) === 0 ? '剧情' : '战斗';
  missionText += `|${row.section.tid}|${status}|${row.section.fight}|${cell(JSON.stringify(row.section.enemy))}|${cell(row.fight ? JSON.stringify(row.fight.atk_team) : missing)}|${cell(row.fight ? JSON.stringify(row.fight.def_team) : missing)}|${cell(row.teams.map(team => `${team.id}:${JSON.stringify(team.team_lv)}`).join('；'))}|${cell(row.teams.map(team => `${JSON.stringify(team.npc)} / ${JSON.stringify(team.loc)}`).join('；'))}|\n`;
}
missionText += '\n蜜雪儿身份链：NPC `3030500` → `HeroTable.Npc.relation_hero=3030501` → Hero 蜜雪儿。首章末战 `Section10205 → Fight105 → Team105`，位置5，Fighter10505.is_boss=true、view_custom=120。当前已接服务端报告；NPC精确技能、附加属性及客户端验收仍有缺口。首段有效节点是10202→10204→10205→10206→20201，不能把弃用10201/10203重新插回引导。\n';
write('early-missions.md', missionText);

const documentedFeatures = projectDocumentedFeatureRules(features);
let featureText = '# 功能开放条件全表与当前映射差异\n\n2026-11-15 R1：原条件取证状态与当前业务映射分别列出，已证不等于已解锁或已部署。原脚本955132601007已确证为MissionMgr.GetPassedSection()>=30203；44条引用行的旧“GetPassedSection未映射”不再是原语义未知，当前代码尚未接入仍是实现差异。精确原型/pc/SHA见[取证报告](../../../analysis/scratchpad/activity-schedule-20261115/buyskin175001/report.md#6-功能1514的商业资格已进一步收窄)。\n\n';
featureText += `当前映射ready=${features.summary.ready}、gap=${features.summary.evidenceGap}；文档原条件已核=${documentedFeatures.documentedSummary.conditionsProved}、仍有证据缺口=${documentedFeatures.documentedSummary.remainingGap}。未解条件的新增变更依[最终基线](../12-final-rule-baseline.md#access)按未满足处理，保留必要初始化结构与已确认权益。名人堂1218等级≥32且服龄≥2，模块161；1级实际弹窗未验不销项。1514为通关30203而非角色3级。完整结构见[JSON](feature-rule-decisions.json)。\n\n`;
featureText += '|funId|当前实现状态|原条件文档状态|已核条件（全部须满足）|剩余证据阻断|当前业务配置（原样）|\n|---:|---|---|---|---|---|\n';
for (const row of documentedFeatures.rows) featureText += `|${row.funId}|${cell(row.currentRuntimeRule.status)}|${row.documentedStatus}|\`${cell(JSON.stringify(row.documentedConditions))}\`|\`${cell(JSON.stringify(row.remainingGaps))}\`|\`${cell(JSON.stringify(row.currentRuntimeRule))}\`|\n`;
write('feature-unlocks.md', featureText);
write('feature-rule-decisions.json', JSON.stringify(documentedFeatures, null, 2) + '\n');
const sourcePaths = [...new Set([inventoryFile, auditFile, featureFile, guideFile, fightFile, ...fightShardFiles,
  'personal-server/assets/tables/GuideTable.data.json.gz',
  'personal-server/config/public-server.json', 'personal-server/config/activity-calendar-realm-3.json',
  'personal-server/config/guide-awards.mjs', 'personal-server/config/guide-tables.mjs',
  'personal-server/config/journey-fight-tables.mjs', 'personal-server/config/mission-tables.mjs',
  'personal-server/game/guide-service.mjs', 'personal-server/game/guide-award-repair.mjs',
  'personal-server/scripts/repair-guide-awards.mjs', 'personal-server/game/new-account-state.mjs',
  'personal-server/game/mission-fight-service.mjs', 'personal-server/game/fight-team-resolver.mjs',
  'personal-server/game/feature-service.mjs', 'personal-server/game/gateway.mjs',
  'personal-server/config/skill-database.json', 'personal-server/test/journey-fidelity.test.mjs',
  'tools/read-fight-shard.mjs', 'tools/extract-journey-rules.mjs', 'tools/extract-fun-open-rules.mjs',
  'tools/build-gameplay-doc-evidence.mjs', 'tools/documented-rule-decisions.mjs',
  'analysis/scratchpad/activity-schedule-20261115/buyskin175001/selected-evidence.json',
  'tools/patch-defeat-power-lua.mjs',
  'tools/test-defeat-power-lua.mjs', 'tools/build-defeat-power-bundle.mjs'
])];
const skills = read('personal-server/config/skill-database.json');
const skillRows = skills.heroes.flatMap(hero => hero.skills ?? []);
const manifest = { schemaVersion: 3, snapshotDate: '2026-11-15', auditSnapshotDate: '2026-11-14', baseline: 'R1-20261115',
  codeBaseline: execFileSync('git', ['rev-parse','HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  scope: '当前工作树源码与原表证据快照；不证明线上部署或 APK 验收', commandAudit: audit.summary,
  moduleTaskGroups: groups.size, encoderModules: new Set(audit.commands.map(row => row.module)).size,
  guideCounts: Object.fromEntries(Object.entries(guide).map(([key, rows]) => [key, rows.size])),
  fightShardCounts: Object.fromEntries(Object.entries(fight).map(([family, rows]) => [family, rows.size])), fightSourceShards: fightShardFiles.length,
  skillCounts: { heroes: skills.heroes.length, skillReferences: skillRows.length,
    requiresInvestigation: skillRows.filter(row => row.implementation?.requiresInvestigation).length,
    projectFallback: skillRows.filter(row => row.implementation?.source === 'project-fallback').length },
  featureSummary: features.summary, documentedFeatureSummary: documentedFeatures.documentedSummary,
  earlyMissionRows: missionRows.length, sources: sourcePaths.map(name => ({ path: name, sha256: sha(name) })), generatedFiles: [...generatedFiles] };
write('evidence-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ ...manifest, sources: undefined, generatedFiles: undefined }, null, 2));
