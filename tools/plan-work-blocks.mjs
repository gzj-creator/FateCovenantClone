import fs from 'node:fs';
import path from 'node:path';
const planDir = path.resolve('docs/plans/remaining-gameplay-20261106');
const BT = String.fromCharCode(96);
const ROW = new RegExp('^\\| ' + BT + '([A-Z0-9-]+)' + BT + ' \\| (.*?) \\| \\[[^\\]]+\\]\\(([^)]+)\\) \\| (\\d+) \\|$');

const rows = [];
for (const raw of fs.readFileSync(path.join(planDir, 'task-index.md'), 'utf8').split(/\r?\n/)) {
  const m = ROW.exec(raw.trim());
  if (m) rows.push({ id: m[1], name: m[2].trim(), doc: m[3].trim(), cmds: Number(m[4]) });
}
const delivered = new Map();
for (const raw of fs.readFileSync(path.join(planDir, 'execution-status.md'), 'utf8').split(/\r?\n/)) {
  const m = /^\| ([A-Z0-9-]+) \| (.*?) \|/.exec(raw.trim());
  if (m) delivered.set(m[1], m[2]);
}

const PVE = ['BATTLE-FIGHT','BATTLE-REPORT','BATTLE-PEAKTOWER','BATTLE-RANK','BATTLE-GENERALDUNGEON','BATTLE-ELITEMISSION','BATTLE-STARMISSION','BATTLE-COMMONMAP','BATTLE-SOULTRIAL','BATTLE-SCARLETTRIAL','BATTLE-REDCLIFF','BATTLE-CAMPTOWER','BATTLE-TOWERDEFENSE','BATTLE-WORLDBOSS','BATTLE-PITLORD','BATTLE-FAMEHALL','BATTLE-DESTINYPVE'];
const pveSet = new Set(PVE);
const docGroups = (prefix) => rows.filter(r => r.doc.startsWith(prefix));
const halves = (list) => {
  const total = list.reduce((a, r) => a + r.cmds, 0);
  let acc = 0;
  let cut = list.length;
  for (let i = 0; i < list.length; i += 1) { acc += list[i].cmds; if (acc >= total / 2) { cut = i + 1; break; } }
  return [list.slice(0, cut), list.slice(cut)];
};
const [socA, socB] = halves(docGroups('05-'));
const [expA, expB] = halves(docGroups('07-'));

const groups = [
  { id: 'A1', title: '战斗 PVE、战报与共享 CORE 收尾', owner: '本 session（总控）+ 合并门禁', list: docGroups('01-').filter(r => pveSet.has(r.id)) },
  { id: 'A2', title: '战斗 PVP、竞技、锦标赛与三消', owner: '新 agent（子 agent 模式）', list: docGroups('01-').filter(r => !pveSet.has(r.id)) },
  { id: 'B', title: '英雄养成、编队与关系', owner: '新 agent', list: docGroups('02-') },
  { id: 'C', title: '装备、圣器、魔灵、精灵与后期养成', owner: '新 agent', list: docGroups('03-') },
  { id: 'D', title: '物品、商店与日周任务', owner: '新 agent', list: docGroups('04-') },
  { id: 'E1', title: '社交前半：好友、邮件、消息与聊天', owner: '新 agent', list: socA },
  { id: 'E2', title: '社交后半：公会、跨服与协作', owner: '新 agent', list: socB },
  { id: 'F', title: '招募、抽取、翻牌与转盘活动', owner: '新 agent', list: docGroups('06-') },
  { id: 'G1', title: '探索与家园前半', owner: '新 agent', list: expA },
  { id: 'G2', title: '探索与小游戏后半', owner: '新 agent', list: expB },
  { id: 'H', title: '节日、签到、限时目标与协作活动', owner: '新 agent', list: docGroups('08-') },
  { id: 'I', title: '礼包、通行证、基金、返利与拍卖', owner: '新 agent', list: docGroups('09-') },
  { id: 'J', title: '团长、外观、剧情与辅助接口', owner: '新 agent', list: docGroups('10-') },
].filter(g => g.list.length > 0);

let counter = 0;
for (const g of groups) for (const r of g.list) { r.no = counter + 1; counter += 1; }

const o = [];
const push = (...xs) => o.push(...xs);
push('# 剩余任务卡：编号与工作块');
push('');
push('2026-11-08 建表。276 张任务卡按“关联玩法放一起、单块任务量适中”切成 ' + groups.length + ' 块，并在块顺序上连续编号 1–276。生成脚本 tools/plan-work-blocks.mjs；命令级子卡见 14-subtask-cards.md。');
push('');
push('## 编号与分块规则');
push('');
push('- 编号按本文件的工作块顺序连续编排（不是 task-index 行序）；任务卡 ID 才是唯一标识，卡号只作派发边界，不表示优先级。');
push('- 同一玩法族放同一块（战斗按 PVE / PVP 拆开，社交按前半/后半拆开，探索按前半/后半拆开），块内不再跨领域。');
push('- 每块 10–60 张卡、40–170 条缺失命令；单块的实施 agent 可自行再拆子卡。');
push('- agent 只交付分支；全部合并由块 A1 的总控执行。13-special-skills 的 E1–E72 在 CORE-ATTR / CORE-SKILL-GATES 完成后进入抽取活动块 F。');
push('');
push('## 工作块总览');
push('');
push('| 块 | 卡号范围 | 内容 | 卡数 | 缺失命令 | 归属 |');
push('| --- | --- | --- | ---: | ---: | --- |');
for (const g of groups) {
  const from = g.list[0].no;
  const to = g.list[g.list.length - 1].no;
  const cmds = g.list.reduce((a, r) => a + r.cmds, 0);
  push('| ' + g.id + ' | #' + from + '–#' + to + ' | ' + g.title + ' | ' + g.list.length + ' | ' + cmds + ' | ' + g.owner + ' |');
}
push('');
push('合计 ' + rows.length + ' 张卡 / ' + rows.reduce((a, r) => a + r.cmds, 0) + ' 条缺失命令。');
push('');
push('## 并行槽位');
push('');
push('- 平台同时最多 4 条 agent 线程（含总控）。总控 + 2 个实施 agent = 3 条，剩余 1 槽给子 agent 轮转；需要第 4 条时才允许短暂开子 agent，其余时间主线程推进。');
push('- gateway.mjs 派发区同一时间只允许一条分支修改；冲突由总控合并队列处理。');
push('');
for (const g of groups) {
  const from = g.list[0].no;
  const to = g.list[g.list.length - 1].no;
  const cmds = g.list.reduce((a, r) => a + r.cmds, 0);
  push('## 块 ' + g.id + '：#' + from + '–#' + to + '（' + g.title + '）');
  push('');
  push('- 归属：' + g.owner + '；卡数 ' + g.list.length + '，缺失命令 ' + cmds + '。');
  push('');
  push('| # | 任务卡 | 玩法 | 命令 | 看板 |');
  push('| ---: | --- | --- | ---: | --- |');
  for (const r of g.list) push('| ' + r.no + ' | ' + r.id + ' | ' + r.name + ' | ' + r.cmds + ' | ' + (delivered.get(r.id) || '待领取') + ' |');
  push('');
}
push('## 看板说明');
push('');
push('- “服务端完成”表示实现已合入 main，只剩证据补强、回归与 APK 验收；块内 agent 只补缺口，不重写玩法。');
push('- “待领取”表示仍有未路由或未实现命令，按 14 号文档的子卡粒度派发。');
push('');
fs.writeFileSync(path.join(planDir, '15-three-work-blocks.md'), o.join('\n') + '\n');
console.log(groups.map(g => g.id + ':' + g.list[0].no + '-' + g.list[g.list.length-1].no + ' ' + g.list.length + 'cards/' + g.list.reduce((a,r)=>a+r.cmds,0)).join(' '));

