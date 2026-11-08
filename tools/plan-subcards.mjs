import fs from 'node:fs';
import path from 'node:path';
const BT = String.fromCharCode(96);

const planDir = path.resolve('docs/plans/remaining-gameplay-20261106');
const sectionFiles = [
  '01-battle.md','02-heroes-lineups.md','03-equipment-development.md','04-items-tasks-shops.md',
  '05-social-guild.md','06-draw-activities.md','07-exploration-minigames.md','08-festivals-tasks.md',
  '09-commerce-benefits.md','10-role-and-supporting.md'
];

const LABELS = new Map([
  ['settlement','结算'],['settle','结算'],['award','奖励领取'],['reward','奖励领取'],['first','首次'],
  ['fight','战斗'],['battle','战斗'],['invite','邀请'],['kick','踢人'],['ready','准备'],['help','助力'],
  ['bot','机器人'],['employ','雇佣'],['member','成员'],['members','成员'],['pos','站位'],['skip','跳过'],
  ['give_up','放弃'],['rank','排行'],['score','积分'],['season','赛季'],['draw','抽取'],['lottery','抽奖'],
  ['box','宝箱'],['gift','礼包'],['shop','商店'],['buy','购买'],['exchange','兑换'],['claim','领取'],
  ['receive','领取'],['star','升星'],['break','突破'],['up_lv','升级'],['level','等级'],['reset','重置'],
  ['unlock','解锁'],['trial','试炼'],['boss','BOSS'],['task','任务'],['sign','签到'],['share','分享'],
  ['history','历史'],['log','记录'],['detail','详情'],['list','列表'],['info','信息'],['choose','选择'],
  ['select','选择'],['refresh','刷新'],['create','创建'],['join','加入'],['exit','退出'],['leave','退出'],
  ['enter','进入'],['open','开启'],['close','关闭'],['delete','删除'],['del','删除'],['remove','删除'],
  ['add','添加'],['set','设置'],['get','查询'],['query','查询'],['team','队伍']
]);
const READ = new Set(['info','list','get','query','detail','history','log','rank','score']);

const MOD_RE = new RegExp('协议模块：' + BT + '([A-Za-z0-9_]+)' + BT + '。未路由 (\\d+)');
const ROW_RE = new RegExp('^\\| (\\d+) \\| ' + BT + '([^' + BT + ']+)' + BT + ' \\| ([^|]*) \\| ([^|]*) \\| ([^|]*) \\|$');

function parseCards(text) {
  const cards = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const head = /^## ([A-Z0-9-]+)：(.+)$/.exec(line);
    if (head) { cur = { id: head[1], title: head[2].trim(), module: '', unrouted: null, rows: [] }; cards.push(cur); continue; }
    if (!cur) continue;
    const mod = MOD_RE.exec(line);
    if (mod) { cur.module = mod[1]; cur.unrouted = Number(mod[2]); continue; }
    const row = ROW_RE.exec(line);
    if (row) cur.rows.push({ type: Number(row[1]), cmd: row[2].trim(), req: row[4].trim() });
  }
  return cards.filter(c => c.rows.length > 0);
}

function family(cmd) {
  const t = cmd.replace(/^req_/, '').split('_');
  const read = t.some(x => READ.has(x));
  for (let i = t.length - 1; i >= 0; i -= 1) if (LABELS.has(t[i])) return { label: LABELS.get(t[i]), read };
  return { label: t[t.length - 1], read };
}

function chunk(card) {
  const rows = [...card.rows].sort((a, b) => a.type - b.type);
  if (rows.length <= 5) return [rows];
  const byLabel = new Map();
  for (const row of rows) {
    const key = family(row.cmd).label;
    if (!byLabel.has(key)) byLabel.set(key, []);
    byLabel.get(key).push(row);
  }
  let groups = [...byLabel.entries()].map(([label, rs]) => ({ label, rows: rs }));
  const mid = rs => rs.reduce((a, r) => a + r.type, 0) / rs.length;
  while (groups.length > 1) {
    const small = groups.filter(g => g.rows.length < 3).sort((a, b) => a.rows.length - b.rows.length)[0];
    if (!small) break;
    let best = null;
    let bestDist = Infinity;
    for (const g of groups) {
      if (g === small || g.rows.length + small.rows.length > 8) continue;
      const d = Math.abs(mid(g.rows) - mid(small.rows));
      if (d < bestDist) { best = g; bestDist = d; }
    }
    if (!best) break;
    best.rows.push(...small.rows);
    best.rows.sort((a, b) => a.type - b.type);
    if (best.label !== small.label) best.label = best.label + '/' + small.label;
    groups = groups.filter(g => g !== small);
  }
  const out = [];
  for (const g of groups) {
    const rs = g.rows.sort((a, b) => a.type - b.type);
    for (let i = 0; i < rs.length; i += 8) out.push(rs.slice(i, i + 8));
  }
  out.sort((a, b) => a[0].type - b[0].type);
  return out;
}

function span(rows) {
  const a = rows[0].type, b = rows[rows.length - 1].type;
  return a === b ? String(a) : a + '-' + b;
}

function deliveredMap() {
  const map = new Map();
  const file = path.join(planDir, 'execution-status.md');
  if (!fs.existsSync(file)) return map;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\| ([A-Z0-9-]+) \| (.*?) \|/.exec(raw.trim());
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

const delivered = deliveredMap();
const sections = [];
let tCards = 0, tSub = 0, tCmds = 0;

for (const file of sectionFiles) {
  const cards = parseCards(fs.readFileSync(path.join(planDir, file), 'utf8'));
  let sub = 0, cmds = 0;
  const blocks = [];
  for (const card of cards) {
    const chunks = chunk(card);
    const subs = chunks.map((rows, i) => ({
      id: card.id + '-S' + (i + 1), rows, span: span(rows),
      etf: rows.filter(r => !/protobuf/i.test(r.req)).length,
      pb: rows.filter(r => /protobuf/i.test(r.req)).length,
      reads: rows.filter(r => family(r.cmd).read).length
    }));
    sub += subs.length; cmds += card.rows.length; tCards += 1; tSub += subs.length; tCmds += card.rows.length;
    blocks.push({ card, subs });
  }
  sections.push({ file, count: cards.length, sub, cmds, blocks });
}

const o = [];
const push = (...xs) => o.push(...xs);
push('# 子卡划分（任务卡 → 可独立派发的子卡）');
push('');
push('2026-11-08 建表。把 01–10 分区文档里的任务卡再拆成“一个 agent 能独立完成、独立提交、独立合并”的子卡，供多路并行派发。生成脚本 ' + BT + 'tools/plan-subcards.mjs' + BT + '；分区文档改动后重跑即可同步。');
push('');
push('## 拆分规则');
push('');
push('- 每张任务卡按命令功能族拆分：从命令名取最具体的功能词（settlement/award/fight/invite/member/rank/draw/buy 等），再按 type 连续性合并；单个子卡 3–8 条命令；命令不超过 5 条的任务卡不拆。');
push('- 子卡 ID 形如 ' + BT + 'BATTLE-MARTIALCLUB-S2' + BT + '；分支 ' + BT + 'task/<子卡ID>-YYYYMMDD' + BT + '；worktree ' + BT + '.worktree/gameplay-20261106/<kebab-id>' + BT + '。');
push('- 看板状态取自 ' + BT + 'execution-status.md' + BT + '：标“服务端完成”的卡已有交付，子卡只剩证据补强与回归，不得当新玩法重做。');
push('');
push('## 每张子卡的交付标准');
push('');
push('1. 真实业务：权威状态落 SQLite，资源/奖励真实扣发；schema 或语义无证据的命令 fail closed（明确错误码，不用固定空包销项），并在 implementation.md 登记缺口。');
push('2. 专项测试：服务单测 + 真实临时 loopback TCP（握手 909103 后走真实命令）+ SQLite 重开保持 + PB 编码失败整笔回滚 + SQLite 写入失败整笔回滚。');
push('3. 网关只做增量派发：recruit 在 heroCommandServices 之前，百抽/奖励抽取在通用 activityRead 之前；不删除既有登录同步与派发块。');
push('4. 交付物：' + BT + 'agent/workflow/gameplay-completion/<子卡ID>/implementation.md' + BT + ' + 分支提交；工作树干净、git diff --check 无输出、无删除主线文件。');
push('5. 合并由总控执行（--no-ff）；同一时间只有一条分支改 gateway.mjs 派发区。');
push('');
push('## 汇总');
push('');
push('| 分区 | 任务卡 | 子卡 | 命令 |');
push('| --- | ---: | ---: | ---: |');
for (const s of sections) push('| [' + s.file + '](' + s.file + ') | ' + s.count + ' | ' + s.sub + ' | ' + s.cmds + ' |');
push('| **合计（01–10）** | **' + tCards + '** | **' + tSub + '** | **' + tCmds + '** |');
push('');
push('另有两块不按命令拆：12-shared-gaps.md 的 7 个共享任务（CORE-BATTLE 已拆 A/B/C，CORE-ATTR / CORE-SKILL-GATES / CORE-CABIN 按实施步骤分阶段）；13-special-skills.md 的 72 个英雄技能卡按英雄各自成卡，依赖 CORE-BATTLE / CORE-ATTR / CORE-SKILL-GATES 先行。');
push('');
push('## 派发与归属');
push('');
push('| 归属 | 范围 | 说明 |');
push('| --- | --- | --- |');
push('| 块 A1（本 session，#1–#17） | 01-battle.md 的 PVE/战报卡；12-shared-gaps.md 的 CORE-* 收尾；全部分支的合并门禁与看板 | 战斗与战报是主线热点，需要单一口径；main 只由总控写入 |');
push('| 块 A2（#18–#33） | 01-battle.md 的 PVP/竞技/锦标赛/三消卡 | 按子卡独立 worktree 派发，交付分支后进合并队列 |');
push('| 块 B–J（#34–#276） | 02–10 分区按 11 个工作块切分（英雄、装备、物品、社交前后、抽取、探索前后、节日、商业化、团长辅助） | 按子卡独立 worktree 派发，交付分支后进合并队列 |');
push('');
push('范围定义与编号见 [三大块](15-three-work-blocks.md)；本文件的子卡落在哪一块由所属分区决定。');
push('');
push('并行度：平台同时最多 4 条 agent 线程（含总控），即 3 个实施 agent；同一时间只有 1 个 agent 改 gateway.mjs 派发区，其余子卡先做服务层与测试。');
push('');
push('每个子卡的派发模板：');
push('');
push('1. 从本文件复制子卡行（ID、type 区间、命令列表）。');
push('2. 建 worktree 与分支：git worktree add .worktree/gameplay-20261106/<kebab-id> -b task/<子卡ID>-YYYYMMDD main。');
push('3. 用命令名在 personal-server/game/gateway.mjs、assets/tables、config 中定位现有实现与配置；已有处理路径的子卡只补缺口，不重写。');
push('4. 完成后自检：工作树干净、git merge-base --is-ancestor main HEAD 为 0、git diff --check 无输出、git diff --diff-filter=D --name-only main..HEAD 为空。');
push('5. 向总控交付：分支名、HEAD、改动清单、测试统计与日志路径、fail closed 清单、证据缺口。');
push('');
for (const s of sections) {
  push('## ' + s.file);
  push('');
  for (const b of s.blocks) {
    const st = delivered.has(b.card.id) ? delivered.get(b.card.id) : '待领取';
    push('### ' + b.card.id + '：' + b.card.title);
    push('');
    push('- 协议模块 ' + BT + (b.card.module || '未标注') + BT + '；未路由 ' + (b.card.unrouted ?? '?') + ' 条；子卡 ' + b.subs.length + ' 个；看板状态：' + st);
    push('');
    push('| 子卡 | type 区间 | 命令 | 条数 | etf/pb | 读接口 |');
    push('| --- | --- | --- | ---: | --- | ---: |');
    for (const x of b.subs) {
      push('| ' + BT + x.id + BT + ' | ' + x.span + ' | ' + x.rows.map(r => BT + r.cmd + BT).join('<br>') + ' | ' + x.rows.length + ' | ' + x.etf + '/' + x.pb + ' | ' + x.reads + ' |');
    }
    push('');
  }
}
fs.writeFileSync(path.join(planDir, '14-subtask-cards.md'), o.join('\n') + '\n');
console.log('cards=' + tCards + ' subcards=' + tSub + ' commands=' + tCmds);
