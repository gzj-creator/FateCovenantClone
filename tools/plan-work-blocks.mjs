import fs from 'node:fs';
import path from 'node:path';
const BT = String.fromCharCode(96);
const planDir = path.resolve('docs/plans/remaining-gameplay-20261106');
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
const blockOf = (doc) => doc.startsWith('01-') ? 'A' : (/^0[2345]-/.test(doc) ? 'B' : 'C');
rows.forEach((r, i) => { r.no = i + 1; r.block = blockOf(r.doc); });
const blocks = ['A', 'B', 'C'].map((b) => {
  const list = rows.filter((r) => r.block === b);
  return { id: b, from: list[0]?.no, to: list[list.length - 1]?.no, list, cards: list.length, cmds: list.reduce((a, r) => a + r.cmds, 0) };
});
const o = [];
const push = (...xs) => o.push(...xs);
push('# 剩余任务卡：编号与三大块');
push('');
push('2026-11-08 建表。把 01–10 分区文档的全部任务卡按 task-index.md 的原始顺序连续编号，再按分区切成三大块。生成脚本 tools/plan-work-blocks.mjs；命令级拆分见 14-subtask-cards.md。');
push('');
push('## 编号规则');
push('');
push('- 编号即 task-index.md 的表格行序：1 号是 BATTLE-FIGHT，' + rows.length + ' 号是最后一行；卡号只表示派发边界，不表示优先级。');
push('- 分块按分区归属，不拆散同一分区；块内工作量以“缺失命令数”估算。');
push('- 一个块交给一个 agent，块内可自行拆子 agent；合并统一由总控执行，agent 只交付分支。');
push('');
push('## 三大块');
push('');
push('| 块 | 卡号范围 | 分区 | 卡数 | 缺失命令 | 归属 |');
push('| --- | --- | --- | ---: | ---: | --- |');
push('| A | #' + blocks[0].from + '–#' + blocks[0].to + ' | 01-battle.md + 共享 CORE-* 收尾 | ' + blocks[0].cards + ' | ' + blocks[0].cmds + ' | 本 session（总控），兼合并门禁 |');
push('| B | #' + blocks[1].from + '–#' + blocks[1].to + ' | 02 / 03 / 04 / 05 | ' + blocks[1].cards + ' | ' + blocks[1].cmds + ' | 新 agent B（子 agent 模式） |');
push('| C | #' + blocks[2].from + '–#' + blocks[2].to + ' | 06 / 07 / 08 / 09 / 10 | ' + blocks[2].cards + ' | ' + blocks[2].cmds + ' | 新 agent C（子 agent 模式） |');
push('');
push('合计 ' + rows.length + ' 张任务卡 / ' + rows.reduce((a, r) => a + r.cmds, 0) + ' 条缺失命令。B、C 命令量接近，C 卡多、单卡轻，适合短周期子 agent 轮转；B 卡少、05 分区偏重，适合单卡占满一个子 agent。');
push('');
push('## 并行与槽位');
push('');
push('- 平台同时最多 4 条 agent 线程（含总控）。本 session + B + C 已占 3 条，剩 1 槽供两边子 agent 轮转：一次只允许一边开子 agent。');
push('- gateway.mjs 派发区同一时间只允许一条分支修改；冲突由总控合并队列处理，agent 不自行 rebase 主线。');
push('- 13-special-skills（72 张英雄技能卡）在块 A 交付 CORE-ATTR 与 CORE-SKILL-GATES 后，默认交块 C 的 E1–E72 队列。');
push('');
for (const b of blocks) {
  const label = b.id === 'A' ? '（本 session）' : (b.id === 'B' ? '（新 agent B）' : '（新 agent C）');
  push('## 块 ' + b.id + label + '：#' + b.from + '–#' + b.to);
  push('');
  push('| # | 任务卡 | 玩法 | 命令 | 看板 |');
  push('| ---: | --- | --- | ---: | --- |');
  for (const r of b.list) push('| ' + r.no + ' | ' + r.id + ' | ' + r.name + ' | ' + r.cmds + ' | ' + (delivered.get(r.id) || '待领取') + ' |');
  push('');
}
push('## 看板说明');
push('');
push('- “服务端完成”表示实现已合入 main，只剩证据补强、回归与 APK 验收；块内 agent 对这类卡只补缺口，不重写玩法。');
push('- “待领取”表示仍有未路由或未实现命令，按 14 号文档的子卡粒度派发。');
push('');
fs.writeFileSync(path.join(planDir, '15-three-work-blocks.md'), o.join('\n') + '\n');
console.log('cards=' + rows.length + ' ranges=' + blocks.map(b => b.id + ':' + b.from + '-' + b.to + ' ' + b.cards + 'cards/' + b.cmds + 'cmds').join(' '));

