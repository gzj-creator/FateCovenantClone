import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readGeneratedDump } from '../personal-server/config/hero-tables.mjs';
import { activityWindow } from '../personal-server/game/activity-calendar.mjs';
import { naturalDay, serverDay } from '../personal-server/game/time.mjs';
import { STAGE_NAMES, clientLegacyWindow, projectLegacyTableStates, projectActFrameFallback } from './documented-activity-time.mjs';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';
import { RULE_BASELINE, policies, domainDecisions, taskOverrides, policiesForText, projectDynamicDecisions } from './documented-rule-decisions.mjs';

// Documentation only. Never opens a game database, server, device or network.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs/gameplay-operations/rules');
const checking = process.argv.includes('--check');
const assets = 'personal-server/assets/tables';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const read = file => fs.readFileSync(path.join(root, file));
const cell = value => String(value ?? '—').replaceAll('|', '&#124;').replaceAll('`', '&#96;').replace(/[\r\n]+/g, ' ').replaceAll('<', '&lt;');
const json = value => JSON.stringify(value);
const code = value => '`' + cell(json(value)) + '`';
const failures = [];
const outputs = [];
function write(file, content) {
  const bytes = Buffer.from(content, 'utf8');
  const target = path.join(output, file);
  if (checking) {
    if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) failures.push(file);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  outputs.push({ path: 'docs/gameplay-operations/rules/' + file, size: bytes.length, sha256: hash(bytes) });
}

function constructors(parsed) {
  if (parsed.tables) return Object.keys(parsed.tables);
  const p = parsed.prototypes?.[parsed.rootPrototype];
  if (!p) return [];
  return [...new Set(p.instructions.flatMap((instruction, index, all) =>
    instruction.name === 'KSTR' && all[index + 1]?.name === 'FNEW'
      ? [p.constants[instruction.d].value] : []))]
    // These are lazy lookup/index helpers, not additional row families.
    .filter(name => !/_(?:List|ValueIndex)$/.test(name));
}
function normalizeRows(parsed, name) {
  if (parsed.prototypes || parsed.tables) return parsed;
  // Several recovered assets retain the extractor's `{source,sha256,families}`
  // envelope while each family already contains decoded rows. Treat that as a
  // row-level dump so the documentation builder can consume the same immutable
  // evidence without rewriting the runtime asset.
  if (parsed.families && typeof parsed.families === 'object' && !Array.isArray(parsed.families)) {
    const tables = {};
    for (const [family, source] of Object.entries(parsed.families)) {
      if (Array.isArray(source)) tables[family] = { rows: source };
      else if (source && Array.isArray(source.rows)) {
        tables[family] = {
          ...(Array.isArray(source.fields) ? { fields: source.fields } : {}),
          rows: source.rows
        };
      } else throw new Error(`Unrecognized rule asset family ${name}.${family}`);
    }
    return { ...parsed, tables };
  }
  if (Array.isArray(parsed.rows)) {
    const family = parsed.table ?? (name === 'ArtifactLevelUp' ? 'LevelUp' : 'Rows');
    return { ...parsed, tables: { [family]: { fields: parsed.fields, rows: parsed.rows } } };
  }
  const entries = Object.entries(parsed);
  if (entries.length && entries.every(([, value]) => value && typeof value === 'object'
    && Object.keys(value).every(key => /^\d+$/.test(key)))) {
    return { tables: Object.fromEntries(entries.map(([key, value]) => [key, Object.values(value)])) };
  }
  throw new Error('Unrecognized rule asset structure: ' + name);
}
function references(value) {
  if (!value || typeof value !== 'object') return 0;
  return (typeof value.reference === 'string' ? 1 : 0)
    + Object.values(value).reduce((sum, child) => sum + references(child), 0);
}
const visual = /^(?:icon|img|image|pic|prefab|model|effect|bg|sound|voice|music|color|position|pos|offset|scale|rotation|camera|animation|anim|font|bubble|tips|help|title|show_name|show_des|des|description|display|hide|ui_|view_)/i;
const ruleField = /(?:cost|price|pay|award|reward|rate|weight|prob|limit|count|num|times|level|^lv|_lv|star|quality|break|ability|skill|attr|power|energy|anger|score|rank|point|exp|step|stage|state|day|time|duration|version|round|turn|pool|lib|group|type|cond|assert|func|open|unlock|target|task|progress|item|money|consume|exchange|convert|reset|refresh|recover|buy|draw|first|last|next|pre_|need|require|free|vip|hero|npc|fight|loc|hp|attack|defense|value|base|talent|gear|reward|selected|wish|fix|init|repeat|random|interval|capacity|speed|select|chance|cap|floor|guarantee|cycle|win|lose|damage|is_|can_|use|max|min)/i;
const meanings = {
  tid: '本表行键；与其他表同值不自动代表同一对象。',
  version: '版本引用；必须按活动类型及其消费者查对应版本表。',
  ref_name: '原配置内部备注名；不等同当前界面本地化名称。',
  func_open: '完整功能开放ID；条件见功能开放附录，不能直接当等级。',
  world_time: '原配置绝对Unix秒；当前本服是否平移另列，不能把平移后的日期写成原值。',
  refer_day: 'ActFrame相对开服日字段，需连同refer_start_time及消费者读取。',
  server_day: '旧Activity相对开服日字段；不是角色创角天数。',
  refer_start_time: '相对日期内的秒偏移原值；18000对应05:00。',
  server_start_time: '旧Activity日期内秒偏移；与server_day组合使用。',
  duration_day: '配置持续天数；0须保留，不能擅自改为1。',
  end_time: '结束日期内秒偏移；不是单独完整时间戳。',
  time_fun: '动态时间函数ID；没有恢复函数时，不能由静态字段断言完整窗口。',
  time_fun_args: '动态时间函数原始参数。',
  server_day_limit: '现有消费者按服龄上限处理；原值和脚本依据分别核对。',
  join_server_day: '服务器资格字段；需同时检查当前服龄与其他开放约束。',
  server_mini_open_limited: '允许参与的服务器开服时间下界原值。',
  server_max_open_limited: '允许参与的服务器开服时间上界原值。',
  state: '旧活动阶段ID数组；与state_end_day/state_end_time逐项配对。',
  state_end_day: '原阶段日期数组；是否累计/分段以对应消费者为准，不能只凭名称推算。',
  state_end_time: '原阶段日内时间数组；0天阶段仍可能有时分窗口。',
  stage: 'ActFrame阶段引用数组；不同于旧Activity.state。',
  stage_duration_day: 'ActFrame各段天数数组，与stage逐项配对。',
  stage_end_time: 'ActFrame阶段结束时间字段原值。',
  price: '原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。',
  reward_tid: '奖励对象ID数组，与reward_count按下标配对。',
  reward_count: '奖励数量数组；不得和另一行的reward_tid交叉配对。',
  award_i: '奖励ID数组，与award_n逐项配对。',
  award_n: '奖励数量数组；零与缺字段分别保留。',
  weight: '原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。',
  rate: '原倍率/概率字段值；具体分母由该表消费者决定。',
  buy_cycle_limit: 'Recharge购买周期引用；不是允许购买次数本身。',
  can_buy_times: '原可购次数字段；0含义必须结合类型处理器，不默认无限。',
  free_item_num: '版本免费道具配置数量；本字段单独不能证明每日发放。',
  table_power: '表中战力，零不能擅自替换常量。'
};
function fieldMeaning(name) {
  if (meanings[name]) return meanings[name];
  if (/^(?:award|reward)(?:_list)?$/.test(name)) return '原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。';
  if (/(?:weight|probability|chance)/i.test(name)) return '权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。';
  if (/(?:cost|consume)/i.test(name)) return '原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。';
  if (/(?:limit|max|min)/i.test(name)) return '原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。';
  if (/(?:award|reward)/i.test(name)) return '奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。';
  return '原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。';
}
function fieldsOf(rows) {
  const fields = new Map();
  for (const row of rows) for (const [key, value] of Object.entries(row)) {
    if (!fields.has(key)) fields.set(key, { count: 0, types: new Set(), example: value });
    const f = fields.get(key);
    f.count++;
    f.types.add(value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value);
  }
  return fields;
}

const groups = new Map();
for (const file of fs.readdirSync(path.join(root, assets)).filter(file => file.endsWith('.json.gz')).sort()) {
  const name = file.replace(/^\d+-/, '').replace(/\.json\.gz$/, '').replace(/\.(?:data(?:\.lua|\.bytecode)?|rows)$/, '');
  if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name) || name.includes('..')) throw new Error('Unsafe table name: ' + name);
  if (!groups.has(name)) groups.set(name, []);
  const sourcePath = assets + '/' + file;
  const bytes = read(sourcePath);
  const parsed = normalizeRows(JSON.parse(zlib.gunzipSync(bytes)), name);
  groups.get(name).push({ sourcePath, sha256: hash(bytes), parsed,
    priority: parsed.tables ? 0 : file.includes('.bytecode.') ? 2 : 1 });
}
// Newly investigated original tables are documentation inputs. Do not install
// or change game assets merely to document them.
for (const [name, sourcePath] of [
  ['BuySkinActTable', 'analysis/scratchpad/time-temple-20261108/project/1574497428085298200-BuySkinActTable.data.lua.bin'],
  ['CrossTable', 'analysis/scratchpad/time-temple-20261108/project/7484041058600332000-CrossTable.data.lua.bin']
]) {
  if (groups.has(name)) throw new Error('Documentation-only source now has a game asset; resolve source precedence: ' + name);
  const bytes = read(sourcePath);
  groups.set(name, [{ sourcePath, sha256: hash(bytes), parsed: parseLuaJit(bytes), priority: 0 }]);
}
const tables = new Map();
let rowCount = 0, familyCount = 0, unresolvedCount = 0;
for (const [name, variants] of groups) {
  variants.sort((a, b) => a.priority - b.priority || a.sourcePath.localeCompare(b.sourcePath, 'en'));
  const source = variants[0];
  const families = {};
  const familyNames = constructors(source.parsed);
  if (!familyNames.length) throw new Error('No configuration families inventoried: ' + name);
  for (const family of familyNames) {
    try {
      const data = readGeneratedDump(source.parsed, [family])[family];
      const rows = [...data.values()];
      if (rows.some(row => !row || typeof row !== 'object' || Array.isArray(row) || !Object.keys(row).length)) {
        throw new Error('Empty/non-row output; field map not independently recovered');
      }
      rows.sort((a, b) => Number(a.tid ?? 0) - Number(b.tid ?? 0));
      // The output explicitly distinguishes absent fields from configured null/zero.
      const referenceCount = rows.reduce((sum, row) => sum + references(row), 0);
      families[family] = { status: referenceCount ? 'rows-with-external-references' : 'decoded-rows',
        count: rows.length, externalReferenceCount: referenceCount, rows };
      rowCount += rows.length;
    } catch (error) {
      families[family] = { status: 'unresolved', count: null, reason: String(error.message), rows: null };
      unresolvedCount++;
    }
    familyCount++;
  }
  const table = { schemaVersion: 1, table: name, assetPath: source.sourcePath, assetSha256: source.sha256,
    evidence: 'extracted-client-configuration; not original-server runtime verification',
    sourceVariants: variants.map(v => ({ path: v.sourcePath, sha256: v.sha256 })),
    sourceMetadata: source.parsed.sources ?? source.parsed.source ?? null, families };
  tables.set(name, table);
  // One row per line keeps complete values searchable without oversized formatting.
  const familyJson = Object.entries(families).map(([family, info]) => JSON.stringify(family) + ':'
    + JSON.stringify({ ...info, rows: undefined }).replace(/}$/, '') + ',"rows":'
    + (info.rows ? '[\n' + info.rows.map(json).join(',\n') + '\n]' : 'null') + '}').join(',\n');
  const header = JSON.stringify({ ...table, families: undefined }, null, 2).replace(/\n}$/, '');
  write('tables/' + name + '.json', header + ',\n"families":{\n' + familyJson + '\n}\n}\n');
  let text = `# ${name} 规则参数\n\n来源：[${source.sourcePath}](../../../../${source.sourcePath})，SHA256：\`${source.sha256}\`。\n\n[完整逐行JSON](${name}.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。\n\n`;
  text += '|子表|行数|配置恢复状态|\n|---|---:|---|\n';
  for (const [family, info] of Object.entries(families)) text += `|[${cell(family)}](#${family.toLowerCase()})|${info.count ?? '未知'}|${info.status}${info.reason ? '：' + cell(info.reason) : ''}|\n`;
  for (const [family, info] of Object.entries(families)) {
    text += `\n## ${family}\n\n`;
    if (!info.rows) { text += `未恢复：${cell(info.reason)}。不能把解析失败当作原表0行。\n`; continue; }
    if (!info.rows.length) { text += '已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。\n'; continue; }
    text += '|字段|输出类型|有字段行数|含义/解释边界|\n|---|---|---:|---|\n';
    for (const [field, fieldInfo] of fieldsOf(info.rows)) text += `|${cell(field)}|${[...fieldInfo.types].join('/')}|${fieldInfo.count}|${fieldMeaning(field)}|\n`;
    const columns = [...fieldsOf(info.rows).keys()].filter(field => field === 'tid' || field === 'ref_name' || (!visual.test(field) && ruleField.test(field)));
    // The complete rows remain available for every family, including large growth tables.
    const visibleRows = info.rows.length <= 300 ? info.rows : info.rows.slice(0, 3);
    text += `\n${info.rows.length <= 300 ? '以下逐行列出全部' : '下列3行用于说明结构；全部' + info.rows.length + '行见本页完整JSON，不将样例当完整数值表。样例列出'}规则字段；纯表现字段仍保存在JSON。\n\n|tid|规则原值|\n|---:|---|\n`;
    for (const row of visibleRows) text += `|${cell(row.tid)}|${code(Object.fromEntries(columns.filter(k => k !== 'tid' && Object.hasOwn(row, k)).map(k => [k, row[k]])))}|\n`;
  }
  write('tables/' + name + '.md', text);
}

const lookup = (table, family) => tables.get(table)?.families?.[family]?.rows ?? [];
let products = '# 全部商品价格、奖励与限购参数\n\n本表完整列出RechargeTable.Recharge的每一行，包含历史/不同活动版本商品，不代表当前均在售。价格、奖励与购买资格必须同时沿活动/商店版本、Recharge.type处理器及原限制字段解析。钱包只是付款渠道，后台加余额不触发商品购买；代金券发行/领取/抵扣是唯一保留定制的规则。\n\n来源：[RechargeTable及完整JSON](tables/RechargeTable.md)、[RegularGift分组与展示条件](tables/RegularGiftTable.md)、[商业规则册](../activity-rulebooks/commerce-and-benefits.md)、[经济与商店规则](../system-rulebooks/economy-tasks-shops.md)。\n\nprice列保留原整数。pay_type=0的当前现金支付消费者把price解释为分；非现金类型的price/cost_item单位按其处理器确认，不统一除100。can_buy_times=0不在此直接解释成不限购；buy_cycle_limit保留原引用，精确周期/日切与活动独立限购见相应消费者。奖励tid/count逐项配对，缺数量明确标为缺失；展示图标不生成奖励。\n\n|SKU|type / Handle原行|price原值|pay_type / cost_item|次数 / 周期 / effect_level|奖励tid×num|\n|---:|---|---:|---|---|---|\n';
const handles = new Map(lookup('RechargeTable', 'Handle').map(r => [Number(r.tid), r]));
for (const r of lookup('RechargeTable', 'Recharge')) {
  const rewards = (r.reward_tid ?? []).map((id, i) => [id, r.reward_count?.[i] ?? '缺数量']);
  products += `|${r.tid}|${r.type} / ${code(handles.get(Number(r.type)) ?? '缺Handle行')}|${r.price}|${r.pay_type} / ${r.cost_item}|${r.can_buy_times} / ${r.buy_cycle_limit} / ${r.effect_level}|${code(rewards)}|\n`;
}
write('products.md', products);

const groupRows = new Map(lookup('DrawTable', 'Group').map(r => [Number(r.tid), r]));
const drawItems = new Map(lookup('DrawTable', 'Item').map(r => [Number(r.tid), r]));
const resourceItemIds = new Set(lookup('ItemTable', 'Item').map(r => Number(r.tid)));
const heroIds = new Set(lookup('HeroTable', 'Hero').map(r => Number(r.tid)));
const poolRows = lookup('DrawTable', 'LibWeight').map(row => {
  const groups = [...new Set([...(row.weight_group ?? []).map(v => Number(v?.[1])),
    ...(row.guaranteed_group ?? []).map(Number), ...(row.counter_guaranteed_group ?? []).map(Number)])];
  return { row, normalWeightSum: (row.weight_group ?? []).reduce((sum, v) => sum + Number(v?.[0] ?? 0), 0),
    groups: groups.map(id => {
      const group = groupRows.get(id) ?? null;
      return { groupTid: id, group, status: !group ? 'group-row-missing' : !(group.lib_range ?? []).length ? 'lib-range-empty' : 'configured-ranges',
        entries: (group?.lib_range ?? []).map(v => ({ rawTuple: v, secondValueTid: v?.[1] ?? null,
          sameTidDrawItem: drawItems.get(Number(v?.[1])) ?? null,
          sameTidResourceItemExists: resourceItemIds.has(Number(v?.[1])),
          sameTidHeroExists: heroIds.has(Number(v?.[1])) })) };
    }) };
});
write('draw-pools.json', JSON.stringify({ schemaVersion: 1,
  note: 'Raw library/group values, same-tid candidate lookups and arithmetic weight sums only. A same-tid DrawTable.Item row does not prove that a lib_range tuple must dereference it rather than directly award its resource tid. Not verified original-server probability or guarantee algorithm.', rows: poolRows }, null, 2) + '\n');
let pools = '# 奖池、权重、候选与保底参数\n\n逐库列出DrawTable.LibWeight原参数、Group及同tid候选查询，完整原值见[JSON](draw-pools.json)与[原表](tables/DrawTable.md)。同一活动需先按本版本找到库ID，不能从名称或展示概率ID借库。\n\nweight_group原形状在现有消费者中为[权重,groupTid]。Group.lib_range在现有消费者中使用[权重,目标tid,数量]；JSON逐项保存完整rawTuple，并同时查询是否有同tid的DrawTable.Item、ItemTable.Item或HeroTable.Hero。查到同tid不证明必须解引用DrawTable.Item：当前[item-box](../../../personal-server/game/item-box-service.mjs)把目标直接当资源，[draw-activity](../../../personal-server/game/draw-activity-service.mjs)却在存在DrawTable.Item时改用其res并乘num。这两个当前消费者不能互相作为原版语义证据，需逐族继续核原调用链，不能把普通资源tid缺DrawTable.Item一律误报缺奖。\n\n下表sum只是weight_group数组权重求和；不能仅凭w/sum公告真实概率：保底权重、候选门槛、自选过滤、首抽、反保底、服务器覆盖和多次抽取状态均可能改变有效分布。guaranteed_weight、max_draw_num、reset_guaranteed_top_num及against_guaranteed_group_num保留原值，不在文档生成器猜出保底次数。Item.weight与Group.lib_range内部权重也不能混为同一层。\n\nGroup缺行或lib_range为空分别标记；它们不能被空成功、等权所有英雄或邻库替代。神灵/圣器/幻武reader有独立来源时按其规则册和分片证据补链，不修改此原表。\n\n|库ID|普通组[权重,组] / 数组求和|保底相关原字段|各组候选恢复情况|\n|---:|---|---|---|\n';
for (const p of poolRows) {
  const guarantee = Object.fromEntries(Object.entries(p.row).filter(([k]) => k !== 'tid' && k !== 'weight_group'));
  pools += `|${p.row.tid}|${code(p.row.weight_group)} / ${p.normalWeightSum}|${code(guarantee)}|${cell(p.groups.map(g => g.groupTid + ':' + g.status + (g.group?.lib_range?.length ? '(' + g.group.lib_range.length + ')' : '')).join('; '))}|\n`;
}
write('draw-pools.md', pools);
const inventoryPath = 'docs/plans/remaining-gameplay-20261106/inventory.json';
const inventory = JSON.parse(read(inventoryPath));
const ruleBooks = {
  '01': '../system-rulebooks/modes-guild-social.md',
  '02': '../system-rulebooks/heroes-equipment.md',
  '03': '../system-rulebooks/heroes-equipment.md',
  '04': '../system-rulebooks/economy-tasks-shops.md',
  '05': '../system-rulebooks/modes-guild-social.md',
  '06': '../activity-rulebooks/draw-and-recruit.md',
  '07': '../activity-rulebooks/exploration-and-minigames.md',
  '08': '../activity-rulebooks/festivals-and-social.md',
  '09': '../activity-rulebooks/commerce-and-benefits.md',
  '10': '../system-rulebooks/onboarding-combat.md'
};
const modules = new Map();
for (const command of inventory.commands) {
  if (!modules.has(command.task)) modules.set(command.task, { task: command.task, title: command.title,
    plan: command.plan, rulebook: ruleBooks[command.plan?.slice(0, 2)], commands: [] });
  modules.get(command.task).commands.push({ type: command.type, name: command.name, schemas: command.schemas });
}
if ([...modules.values()].some(v => !v.rulebook)) throw new Error('Unmapped rulebook domain');
for (const module of modules.values()) {
  const contents = read('docs/gameplay-operations/rules/' + module.rulebook).toString('utf8');
  const heading = [...contents.matchAll(/^#{1,6}\s+(.+)$/gm)]
    .map(match => match[1].trim()).find(text => text.startsWith(module.task) && /^[\s:：]/.test(text.slice(module.task.length)));
  const taskRow = contents.split(/\r?\n/).find(line => line.startsWith('|') && line.includes('`' + module.task + '`'));
  const explicitRule = taskRow?.match(/\]\(#([^)]+)\)/)?.[1];
  const headingRule = heading?.toLowerCase().replace(/[`*~]/g, '')
    .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-');
  const anchor = explicitRule ?? headingRule;
  if (!anchor) throw new Error('Missing specific rule section for task: ' + module.task);
  module.rulebookFile = module.rulebook;
  module.ruleSection = anchor;
  module.rulebook += '#' + anchor;
}
let moduleIndex = '# 规则册与全部协议任务对应表\n\n每个协议任务均分配到详细规则册；表内共用同一规则册的任务仍按自己的配置、版本和状态区分。原目录覆盖1407条命令、297个协议任务分组；2026-11-06实施任务卡276张使用另一种粒度，不能混作相同分母。本文不沿用历史计划中的实现状态。\n\n主线/战斗共享规则另见[新手与战斗](../system-rulebooks/onboarding-combat.md)，每条命令的当前路由/schema见[命令附录](../appendices/commands.md)。规则册描述了可核规则、当前行为及具体缺口，分配到文档不等于全部原版动态规则已经恢复。\n\n|任务|功能|全部命令type|详细规则册|原始任务卡|\n|---|---|---|---|---|\n';
for (const m of modules.values()) moduleIndex += `|${m.task}|${cell(m.title)}|${m.commands.map(c => c.type).join(', ')}|[规则正文](${m.rulebook})|[历史卡](../../plans/remaining-gameplay-20261106/${m.plan})|\n`;
write('module-rule-index.md', moduleIndex);
write('module-rule-index.json', JSON.stringify({ schemaVersion: 1, source: inventoryPath,
  sourceSha256: hash(read(inventoryPath)), moduleCount: modules.size, commandCount: inventory.commands.length,
  groups: [...modules.values()] }, null, 2) + '\n');

const taskDecisionSources = [
  'analysis/scratchpad/activity-schedule-20261115/instances/decisions.json',
  'analysis/scratchpad/activity-schedule-20261115/buyskin175001/decisions.json'
];
const investigatedTaskDecisions = new Map();
for (const file of taskDecisionSources) {
  for (const entry of JSON.parse(read(file)).groups) {
    if (!modules.has(entry.task) || investigatedTaskDecisions.has(entry.task) || typeof entry.decision !== 'string' || !entry.decision.trim()) {
      throw new Error('Invalid/duplicate investigated task decision: ' + entry.task);
    }
    investigatedTaskDecisions.set(entry.task, { decision: entry.decision, source: file });
  }
}
if (investigatedTaskDecisions.size !== modules.size) throw new Error('Every task needs an explicit investigated decision');
for (const task of Object.keys(taskOverrides)) if (!modules.has(task)) throw new Error('Unknown task override: ' + task);
const rulebookSources = [...new Set([...modules.values()].map(m => 'docs/gameplay-operations/rules/' + m.rulebookFile))];
const debtMarker = /待(?:证|核|恢复|确认|补|解|查)|未(?:恢复|证明|证实|确证|核|闭合|确定|建立|解|接|取得|定位)|尚(?:无|未|须|需|待)|缺(?:少|失|口|表|行|必要)|未知|本地(?:常|推)|兼容(?:算法|数值|矩阵|实现|值)|仍(?:须|需)/;
const evidenceNotes = [];
for (const file of rulebookSources) {
  let offset = 0;
  for (const [index, line] of read(file).toString('utf8').split(/\r?\n/).entries()) {
    if (debtMarker.test(line) && !/^\s*#/.test(line)) {
      const domain = [...modules.values()].find(m => 'docs/gameplay-operations/rules/' + m.rulebookFile === file).plan.slice(0, 2);
      evidenceNotes.push({ noteId: 'R1-NOTE-' + String(evidenceNotes.length + 1).padStart(4, '0'), source: file,
        line: index + 1, sourceText: line, sourceTextSha256: hash(line),
        policyIds: policiesForText(line, domain),
        executionState: 'decided-by-r1; source-evidence-qualification-preserved' });
    }
    offset += line.length + 1;
  }
}
const finalGroups = [...modules.values()].map(m => {
  const domain = m.plan.slice(0, 2), investigation = investigatedTaskDecisions.get(m.task);
  const source = 'docs/gameplay-operations/rules/' + m.rulebookFile;
  const taskNotes = evidenceNotes.filter(note => note.source === source);
  const decision = (taskOverrides[m.task] ?? investigation.decision)
    .replace(/C0/g, 'R1-ROLLOVER旧币冻结').replace(/C1/g, 'R1-ROLLOVER确定旧权益交付');
  return { task: m.task, title: m.title, commandTypes: m.commands.map(c => c.type), rulebook: m.rulebook,
    baseline: RULE_BASELINE, decisionId: RULE_BASELINE + '/' + m.task,
    executionDecision: decision, domainDecision: domainDecisions[domain],
    policyIds: policiesForText(decision + '\n' + taskNotes.map(note => note.sourceText).join('\n'), domain),
    identity: 'original-rule-when-evidenced; explicit-r1-reconstruction-or-branch-restriction-otherwise',
    completionClaim: 'No claim of complete original-algorithm recovery or implementation acceptance is made by this register.',
    evidenceNotes: taskNotes.map(note => note.noteId), evidenceNotesScope: 'shared-source-rulebook; task-specific execution decision applies above these qualifications',
    source: investigation.source, specificOverride: Object.hasOwn(taskOverrides, m.task),
    investigationStatus: Object.hasOwn(taskOverrides, m.task) ? 'superseded-by-reviewed-task-override' : 'task-suggestion-adopted-under-final-r1-policies',
    rulebookSha256: hash(read(source)) };
});
write('final-rule-register.json', JSON.stringify({ schemaVersion: 1, baseline: RULE_BASELINE,
  executionState: 'decided-for-implementation; no business change or deployment in this task',
  note: 'R1 fixes execution, not the identity of missing original evidence. Restrictions apply to specific ungrounded mutations, not whole families. Source evidence qualifications remain literal and traceable.',
  investigationDefaultsAdopted: false,
  priority: ['same-version-proved-original-evidence', 'reviewed-task-override', 'adopted-specific-task-suggestion-with-final-r1-policies'],
  moduleCount: finalGroups.length, commandCount: inventory.commands.length,
  sources: taskDecisionSources.map(p => ({ path: p, sha256: hash(read(p)) })),
  rulebookSources: rulebookSources.map(p => ({ path: p, sha256: hash(read(p)) })),
  policies, evidenceNoteCount: evidenceNotes.length, evidenceNotes, groups: finalGroups }, null, 2) + '\n');
let finalRegister = '# 全部297任务的最终实施裁定\n\n版本：' + RULE_BASELINE + '。本表为全部1407条命令指定唯一实施基调，不能再由后续agent自行选择重置、推测奖池、补邮件或放宽门槛。原表和原消费者已证部分按其指定版本执行；缺原证据的具体分支执行本表及政策，不把推定写成原版事实。**这不是297项玩法已经完成或上线的声明。**\n\n';
finalRegister += '主基线：[12 最终规则基线](../12-final-rule-baseline.md)；四项时间：[动态排期专项](dynamic-schedule-decisions.md)；原始事实：[全部原表](tables/README.md)。[完整JSON](final-rule-register.json)保留每任务全部命令、具体源节、调查裁定、政策、源SHA及逐句证据限定。\n\n## 政策字典\n\n';
for (const policy of policies) finalRegister += `<a id="${policy.id.toLowerCase()}"></a>\n### ${policy.id} ${policy.title}\n\n身份：${policy.identity}。${policy.action} [主基线对应规则](../12-final-rule-baseline.md#${policy.anchor})。\n\n`;
finalRegister += '## 逐任务唯一裁定\n\n每行裁定和对应规则正文共同构成任务输入；源码当前行为仅是差异参照。具体原行完整且已有证据时按原行，不因共享政策把整族关闭。领取任务必须记录此处decisionId和原配置/源码指纹。\n\n|任务 / 功能|命令type|唯一执行裁定|原规则正文|适用政策|\n|---|---|---|---|---|\n';
for (const entry of finalGroups) finalRegister += `|<a id="${entry.task.toLowerCase()}"></a>${entry.task} / ${cell(entry.title)}|${entry.commandTypes.join(', ')}|${cell(entry.executionDecision)}|[具体规则](${entry.rulebook})|${entry.policyIds.map(id => `[${id}](#${id.toLowerCase()})`).join('、')}|\n`;
finalRegister += `\n## 证据限定与追溯\n\n八份领域规则册中${evidenceNotes.length}条含证据限定/兼容/缺口的原文已逐句登记在JSON.evidenceNotes，全部绑定R1执行政策；文字限定不被删除成“原版已恢复”。这些原文可能描述证据不足或当前实现差异，不能直接当发布权限。两份调查的逐任务裁定已覆盖139系统组与158活动族，主线程的具体裁定优先；共享政策约束所有任务。\n\n`; 
finalRegister += '两份analysis调查是建议快照，defaults没有整体采纳。无证均匀抽样、猜概率/金额分母、正式世界日期平移等建议已被本表覆盖；不要把调查JSON或旧正文当前行为当另一份有效规范。C0/C1旧简称已在本表展开为R1-ROLLOVER旧币冻结/确定旧权益交付。逐任务明确的非原版时间、次数等推定须标R1；共享政策不授权猜原价、原奖、随机分布或必要资格。\n\n';
finalRegister += '明确受限的具体动作必须返回可识别业务失败且不扣费、不造成功状态；真实读取、合法穿脱、已确认权益与可独立完成的固定奖继续执行。兼容R1只许可文中列明的既有兼容公式/非经济常量，不能因此许可未经依据的新商品价、奖励、概率或养成成本。新原证据通过R版本升级和实例迁移引入，不让同一实例混用新旧规则。\n';
write('final-rule-register.md', finalRegister);
const actTypes = new Map(lookup('ActFrameTable', 'ActType').map(row => [Number(row.tid), row]));
const legacyFunctions = new Map(lookup('ActivityTable', 'Func').map(row => [Number(row.tid), row]));
const configPath = 'personal-server/config/activity-calendar-realm-3.json';
const calendar = JSON.parse(read(configPath));
const openedAt = Date.parse(calendar.serverOpenedAt) / 1000;
const referenceAt = Date.parse(calendar.activityReferenceOpenedAt) / 1000;
if (!(openedAt > 0 && referenceAt > 0)) throw new Error('Invalid calendar dates');
const formatTime = at => at ? new Date((at + 28800) * 1000).toISOString().slice(0, 19).replace('T', ' ') + '+08:00' : '—';
const calendarInputs = [configPath, 'personal-server/game/activity-calendar.mjs', 'personal-server/game/activity-lifecycle.mjs',
  'personal-server/game/time.mjs', 'tools/documented-activity-time.mjs', 'tools/documented-rule-decisions.mjs',
  'personal-server/config/hero-tables.mjs', 'personal-server/assets.mjs',
  'docs/gameplay-operations/activity-rulebooks/time-and-stages.md'];
const activityRows = [
  ...lookup('ActFrameTable', 'Act').map(row => ({ sourceTable: 'ActFrameTable', sourceFamily: 'Act', row })),
  ...lookup('ActivityTable', 'Activity').map(row => ({ sourceTable: 'ActivityTable', sourceFamily: 'Activity', row }))
].map(entry => {
  const { row } = entry;
  const type = (entry.sourceTable === 'ActFrameTable' ? actTypes.get(Number(row.type)) : legacyFunctions.get(Number(row.func))) ?? null;
  return { ...entry, type, unshiftedImplementationWindow: activityWindow(row, openedAt, null),
    currentCalculatedWindow: activityWindow(row, openedAt, referenceAt),
    originalDynamicFunctionUnresolved: Number(row.time_fun) > 0,
    originalTimeKind: Number(row.world_time) > 0 ? 'absolute-world-time' : Number(row.refer_day ?? row.server_day) > 0 ? 'server-day' : 'dynamic-or-missing',
    visibilityUnverified: true };
});
if (activityRows.length < 1000) throw new Error('Incomplete activity registry');
const dynamicDecisions = projectDynamicDecisions(activityRows, openedAt, { realmId: '3', groupId: 'r1-local-singleton:3' });
const dynamicById = new Map(dynamicDecisions.map(entry => [entry.actId, entry]));
for (const entry of activityRows) {
  const decision = entry.sourceTable === 'ActFrameTable' ? dynamicById.get(Number(entry.row.tid)) : null;
  if (decision) entry.reconstructionDecision = { baseline: RULE_BASELINE, decisionId: decision.decisionId,
    identity: decision.identity, decidedFirstInstance: decision.decidedFirstInstance };
}
const decisionEvidencePaths = [
  'analysis/scratchpad/activity-schedule-20261115/method461/report.md',
  'analysis/scratchpad/activity-schedule-20261115/method461/method-461-462-evidence.json',
  'analysis/scratchpad/activity-schedule-20261115/method461/exact-time-fun-scan.json',
  'analysis/scratchpad/activity-schedule-20261115/method461/client-time-chain.json',
  'analysis/scratchpad/activity-schedule-20261115/buyskin175001/report.md',
  'analysis/scratchpad/activity-schedule-20261115/buyskin175001/selected-evidence.json',
  'analysis/scratchpad/activity-schedule-20261115/instances/report.md',
  'analysis/scratchpad/activity-schedule-20261115/instances/source-manifest.json'
];
const skinItems = lookup('BuySkinActTable', 'BuySkinAct').filter(row => Number(row.version) === 1).map(row => ({ row,
  product: lookup('RechargeTable', 'Recharge').find(product => Number(product.tid) === Number(row.gift)) }));
write('dynamic-schedule-decisions.json', JSON.stringify({ schemaVersion: 1, baseline: RULE_BASELINE,
  executionStatus: 'decided-for-implementation; not deployed',
  originalServerSchedulerRecovered: false, authoritativeOriginalInstancesObserved: false,
  timeInputPriority: ['verified-current-authoritative-instance', 'frozen-verified-instance-snapshot', 'versioned-r1-explicit-calendar'],
  conflictPolicy: 'New dream instances choose v11 from opening day 90; keep frozen older instances, defer the new start to the first 05:00 at/after their end. No same-scope/type overlap.',
  recurrencePolicy: 'Finite explicit R1 list: exactly one first occurrence per listed activity; no implicit recurrence. Later releases must add separately versioned occurrences before creating more instances.',
  sources: decisionEvidencePaths.map(p => ({ path: p, sha256: hash(read(p)) })),
  serverOpeningInput: calendar.serverOpenedAt, exampleGroupPolicy: 'real local singleton; not an observed original cross group',
  rows: dynamicDecisions, buySkinVersion1: skinItems }, null, 2) + '\n');
let dynamicDoc = '# 四项动态活动的最终排期裁定\n\n版本：' + RULE_BASELINE + '。原表/原消费者已证结论与本项目推定分别列出；实现agent直接执行下列唯一口径。这里已经确定执行方案，不再以“待恢复消费者”作为排期结论。原461服务器代码及四项原下发实例未取得，不能称本次已复原原服隐藏调度器。完整整数秒、原字段、阶段和来源SHA见[JSON](dynamic-schedule-decisions.json)。\n\n';
dynamicDoc += '## 1. 统一输入、覆盖和适用范围\n\nActFrame整体S/E直接取服务器下发，客户端不从time_fun计算整体窗口；stage_time_list同ID覆盖优先。原ActType.data_type=0/1/2分别为个人/服务器/跨服，不能从CREATE_TIME名字推断作用域。四项原始配置不改写。已验证的权威实例优先，已产生业务的实例冻结，只有尚未创建实例采用R1推定。\n\n';
dynamicDoc += '默认时区UTC+8、05:00业务日。461三项使用真实cross-group的主服开服时间作为R1服龄锚点；原跨服分组缺失返回0的事实保留，不能称原函数自动回退本服。单逻辑区部署由R1显式建立本服真实单服组，主服=self，以本服开服时间为锚点。下列具体日期均为该单服组示例，非原跨服组观测。\n\n';
dynamicDoc += '设D=86400、B1=DayBegin(group.masterOpenedAt)，推定首期S=B1+(A−1)D；推定整体E=DayZero(S+duration_day×D)+end_time。只有首参A参与这项裁定；[1,0]保持不透明，不解释周一、偏移或复发周期。DayBegin/DayZero的原05:00语义见[时间规则](../activity-rulebooks/time-and-stages.md)。整体E公式是R1采用旧工具形式补齐新实例的政策，不是取得了461函数。\n\n';
dynamicDoc += 'R1组服龄日固定为floor((DayBegin(now)−DayBegin(masterOpenedAt))/D)+1，且now必须已到实际masterOpenedAt才允许建实例。不要复用当前serverDay针对午夜/05:00前开服的特殊分支；例如00:00开服到当日04:59:59仍是组day1，05:00已是组day2。原开服门槛的serverDay与本项推定组日龄分别存字段。每期键包含baseline、scope及真实scopeId、actId、version、occurrenceId和S，跨组同起点不能共用实例键。\n\n';
dynamicDoc += '## 2. 四项唯一执行口径\n\n|ID / 版本 / 作用域|原证据|最终执行裁定|显式首期示例（UTC+8）|\n|---|---|---|---|\n';
for (const decision of dynamicDecisions) dynamicDoc += `|${decision.actId} / ${decision.version} / ${decision.scope}|${cell(decision.originalFact)}|${cell(decision.decision)} **复刻推定**|${formatTime(decision.decidedFirstInstance.start)} → ${formatTime(decision.decidedFirstInstance.end)}|\n`;
dynamicDoc += '\n## 3. 175001：夏日直购皮肤\n\n';
dynamicDoc += '采用父174001**整体initS/initE**，包含父10预热阶段；不是从父50段再晚2天起算。SummerPreheat.skin_jump_func=2082，原跳转2082固定传入175001、检查1514和BuySkin.IsRunning；商品第1/3/17/31/45日与父预热及50/51/52/53起点对应，构成此推定依据。服务端显式下发子50=[父initS,父initE)，保留原空stage与duration0，不能把0解释永久。\n\n';
dynamicDoc += '正式world_time不平移：原父期2025-06-27 05:00至2025-08-31 05:00，2026新服不因开服自动重开。历史回放可单独声明一条统一时间映射，父子和解锁日同移；没有声明回放则保持过期。晚创角共用当前剩余窗口，不补已过日奖、不重新起65天。功能1514原断言确证PassedSection>=30203，另有sys_switch92098；拥有皮肤不能重复付费，不要求先拥有对应英雄。\n\n';
dynamicDoc += '|条目|皮肤 / SKU|解锁活动日|免费日（含两端）|免费奖励/日|原现金价（分）|原付款奖励|原限购|\n|---:|---|---:|---|---|---:|---|---|\n';
for (const { row, product } of skinItems) dynamicDoc += `|${row.tid}|${row.skin} / ${row.gift}|${row.unlock_day}|${row.unlock_day}–${row.unlock_day + row.con_time - 1}|${code(row.award_list)}|${product.price}|${code(product.reward_tid.map((id, i) => [id, product.reward_count[i]]))}|每角色每期${product.can_buy_times}次；cycle=${product.buy_cycle_limit}|\n`;
dynamicDoc += '\ncon_time只约束免费日奖；商品解锁后可购至子E，不能3天后自行下架。每item_id每05:00业务日一次，免费领取没有“先买皮肤”要求；重叠窗口分别领取。五SKU均32800分=¥328、每期各1次；cycle5原枚举EVERY_CYCLE，不是每日。免费日奖过期不新增补领权益；已提交领取丢回包、已付订单未交付按原账本幂等完成，永久皮肤不随父期删除。原表完整13行见[BuySkinActTable](tables/BuySkinActTable.md)，此处只列175001/version1的五行。\n\n';
dynamicDoc += '## 4. 461三项：阶段、切代与后续期\n\n|ID|阶段|明确窗口（UTC+8示例）|依据身份|\n|---:|---|---|---|\n';
for (const decision of dynamicDecisions.filter(d => d.actId !== 175001)) for (const stage of decision.decidedFirstInstance.stages) dynamicDoc += `|${decision.actId}|${stage.stageId}|${formatTime(stage.start)} → ${formatTime(stage.end)}|${stage.source === 'client-fallback' ? '原客户端分段算法；输入S属R1推定' : 'R1显式阶段推定'}|\n`;
dynamicDoc += '\n梦境50段结束后禁止新挑战/抢夺；90是公示，不能当第4天继续游玩或自动补邮件。v10断言确证为DynamicArg462<=90，getter含义未取得；R1把462代理为同组主服服龄，在新建实例时检查，已开始实例不因年龄跨界重算。day90起新建梦境采用v11；同scopeId同type只有一个生效期。若旧期已冻结且跨越day90，新S取max(候选S,旧E)当时或之后的首个05:00；旧E恰05:00可同刻接续，旧E为22:00则次日05:00开始。新期按新S重算4天窗口，旧期照原冻结终点结束。\n\n';
dynamicDoc += 'R1实例清单就上述首期，不从14天/4天持续长度或[1,0]发明复发。首期结束后没有第二条目即不再新建；这是本版本确定行为，不是无限期开放或等待运行时猜测。以后新增期必须在新版本日历列明occurrence_id/S/E/stage_time_list、scope、锚点和证据身份，先校验互斥再创建。调度、结算、订单及pending以该实例键防重，不能用同type新版本覆盖历史期。\n\n';
dynamicDoc += '## 5. 已完成的取证与事实边界\n\n32/64位十个Lua bundle共22604 TextAsset有界复核，精确time_fun/time_fun_args仅见ActFrame字段schema，未发现客户端可执行消费者；UI相似字段是time_func/time_func_param。MethodScript没有脚本461；同号DynamicArgs461/462均无lua_interface，不能据同号宣称命名空间相同。原登录pb_act_server_data→ActivityEntityMgr→Activity链只消费下发窗口。原seed及离线旧fixture没有四项实例，fixture不是额外原服样本；Cross.Stage3的79日与龙息有静态关联，但没有证明461尾参。\n\n';
dynamicDoc += '逐pc、源SHA与检索边界：[461/462报告](../../../analysis/scratchpad/activity-schedule-20261115/method461/report.md)、[皮肤消费者报告](../../../analysis/scratchpad/activity-schedule-20261115/buyskin175001/report.md)、[本地实例与跨服锚点报告](../../../analysis/scratchpad/activity-schedule-20261115/instances/report.md)。[最终基线](../12-final-rule-baseline.md)及[全部任务裁定](final-rule-register.md)为实施入口。本文是文档与离线排期裁定，未部署服务或完成APK验收。\n';
write('dynamic-schedule-decisions.md', dynamicDoc);
write('activities.json', JSON.stringify({ schemaVersion: 2, snapshotDate: '2026-11-15', baseline: RULE_BASELINE,
  serverOpeningInput: calendar.serverOpenedAt, referenceOpeningInput: calendar.activityReferenceOpenedAt,
  note: 'Raw original rows are separate from both current implementation window projections. The unshifted projection preserves absolute world_time, but uses the current server function, not the original client FlushTime algorithm. Neither projection includes live overrides, module switches, eligibility or authoritative original-server windows.', rows: activityRows }, null, 2) + '\n');

const timeAssumptions = { timezoneOffsetSeconds: 28800, flushOffsetSeconds: 18000 };
const phaseRows = activityRows.map(entry => {
  const { row } = entry;
  const common = { sourceTable: entry.sourceTable, actId: row.tid, refName: row.ref_name, version: row.version };
  if (entry.sourceTable === 'ActivityTable') {
    const window = clientLegacyWindow(row, openedAt, timeAssumptions);
    return { ...common, functionConfiguration: entry.type,
    openingInputAssumption: 'Where an opening time is needed, assume the function-selected opening time equals serverOpeningInput. Master-server opening and divine runtime inputs were not read.',
    originalFields: { time_type: row.time_type, state: row.state,
      state_end_day: row.state_end_day, state_end_time: row.state_end_time },
    clientTableFallback: projectLegacyTableStates(row, window, timeAssumptions) };
  }
  return { ...common, originalFields: { time_type: row.time_type, stage: row.stage,
    stage_duration_day: row.stage_duration_day, stage_end_time: row.stage_end_time },
  unshiftedExample: projectActFrameFallback(row, entry.unshiftedImplementationWindow, timeAssumptions),
  currentPolicyExample: projectActFrameFallback(row, entry.currentCalculatedWindow, timeAssumptions) };
});
const phaseSummary = {};
for (const row of phaseRows) {
  const key = row.sourceTable + '/' + (row.clientTableFallback ?? row.currentPolicyExample).status;
  phaseSummary[key] = (phaseSummary[key] ?? 0) + 1;
}
const phaseEvents = [];
for (const row of phaseRows) {
  const projection = row.clientTableFallback ?? row.currentPolicyExample;
  const phases = projection.phases;
  for (let i = 0; i < phases.length; i++) {
    const current = phases[i], next = phases[i + 1];
    if ([0, 99].includes(current.stageId)) continue;
    phaseEvents.push({ sourceTable: row.sourceTable, actId: row.actId,
      basis: row.clientTableFallback ? 'original-legacy-table-fallback' : 'actframe-example-instance-fallback',
      at: current.end, fromStage: current.stageId,
      toStage: next?.start === current.end ? next.stageId : null });
  }
}
write('activity-phases.json', JSON.stringify({ schemaVersion: 1, serverOpeningInput: calendar.serverOpenedAt,
  assumptions: timeAssumptions,
  note: 'Legacy SERVER/WORLD calculations reproduce saved client table fallback without runtime overrides. ActFrame has no original static instance fallback: both example projections assume server.start_time from the current server window function. Actual stage_time_list, eligibility and live instances were not read. Empty ActFrame stage arrays remain unknown.',
  summary: phaseSummary, rows: phaseRows, events: phaseEvents }, null, 2) + '\n');
function showPhases(projection) {
  const parts = projection.phases.filter(p => ![0, 99].includes(p.stageId))
    .map(p => `${p.stageId} ${STAGE_NAMES[p.stageId] ?? ''}：${formatTime(p.start)} → ${formatTime(p.end)}`);
  return parts.length ? parts.join('；') : '未生成阶段：' + projection.status;
}
let phaseDoc = '# 逐活动阶段时间与转换事件\n\n[完整JSON](activity-phases.json)登记全部1993条活动的阶段原字段、计算输入、结果和阻断，不把原阶段算法与当前排期政策混写。算法逐步说明、原函数/原型/哈希和覆盖优先级见[时间与阶段规则](../activity-rulebooks/time-and-stages.md)。\n\n';
phaseDoc += `本次示例开服：${calendar.serverOpenedAt}；时间假设：tz=+08:00、Flush偏移=18000秒。tz是本次计算输入，原TimeKit运行时配置才决定原环境的实际时区。GetDayZero按原FlushTime算法，不等同自然午夜。\n\n`;
phaseDoc += '旧Activity仅对已核SERVER_TIME/WORLD_TIME计算原表fallback；神域/神域阶段及运行时custom实例另需输入。空state按原函数补0/50/99；0天不跳过。ActFrame的整体S/E只来自服务器实例，没有静态fallback；下列两列分别**假设**服务器start_time采用当前activityWindow的未平移/本服平移结果，再运行原GetStageTime。它们用于检查阶段算术，均不证明原服或当前运行实例实际采用这些S/E。权威stage_time_list优先于fallback；stage为空的811行保持未知，182603/182604缺阶段终点数组不补0。\n\n';
phaseDoc += '表中只展示内部阶段；旧表NOT_OPEN[0,S)和END[E,4294967295)完整保存在JSON。旧表整体校验不通过时保留候选算术与具体失败项，不展示成可运行阶段。ActFrame阶段与假设总E不一致、零秒段或非连续边界均保留警示，不擅自裁剪。阶段名称是原枚举，是否允许某个业务/领奖还须看本家族消费者，不能仅凭50/60/90套通用门禁。\n\n## 恢复与计算状态\n\n|来源/状态|配置数|\n|---|---:|\n';
for (const [key, count] of Object.entries(phaseSummary)) phaseDoc += `|${key}|${count}|\n`;
phaseDoc += '\n## ActFrame：假设实例下的原GetStageTime结果\n\n|活动ID / 版本|原阶段/天数/终点秒数组|未平移示例实例|本服平移示例实例|边界记录|\n|---|---|---|---|---|\n';
for (const row of phaseRows.filter(v => v.sourceTable === 'ActFrameTable')) {
  phaseDoc += `|${row.actId} / ${row.version}|${code([row.originalFields.stage, row.originalFields.stage_duration_day, row.originalFields.stage_end_time])}|${cell(showPhases(row.unshiftedExample))}|${cell(showPhases(row.currentPolicyExample))}|${code(row.currentPolicyExample.warnings ?? row.currentPolicyExample.reason ?? row.currentPolicyExample.status)}|\n`;
}
phaseDoc += '\n## 旧Activity：原表SERVER/WORLD默认阶段\n\n本表假设函数选出的开服时间等于本服输入来计算相对活动；原Func.data_type/cross_type保存在JSON，跨服分支可能需要主服开服时间，未取得该动态输入时不能把示例当实际跨服窗口。WORLD仍用原world_time，不使用当前世界时间平移政策。服务器有效custom窗口可改变S/E和cursorDay基点，因此这仍是无custom覆盖的条件fallback，不能替代真实实例。DIVINE两类逐项登记为需要运行输入。\n\n|活动ID / 版本|原阶段/天数/终点秒数组|原客户端窗口S/E（假设输入）|原客户端阶段|状态与边界记录|\n|---|---|---|---|---|\n';
for (const row of phaseRows.filter(v => v.sourceTable === 'ActivityTable')) {
  const p = row.clientTableFallback;
  phaseDoc += `|${row.actId} / ${row.version}|${code([row.originalFields.state, row.originalFields.state_end_day, row.originalFields.state_end_time])}|${p.window ? formatTime(p.window.start) + ' → ' + formatTime(p.window.end) : '运行输入待补'}|${cell(showPhases(p))}|${code({ status: p.status, warnings: p.warnings, validationIssues: p.validationIssues })}|\n`;
}
phaseDoc += '\n## 如何进入运营日历\n\n[前90天检查表](activity-calendar.md)按自然日期列出阶段终点及相邻配置转换事件。旧表事件来自上述原表fallback；ActFrame事件来自假设本服S的示例，两类分列。空stage、缺数组和神域动态窗口不会被自动补成运行。事件不检查服龄资格、弃用/互斥、个人功能或实际instance存在，不能据此批量发布全部历史活动。\n';
write('activity-phases.md', phaseDoc);

let activities = '# 逐活动ID、版本与完整开放配置\n\n[完整逐活动JSON](activities.json)逐项保留原配置行、ActType，以及当前窗口函数的未平移/本服平移两种示例投影。活动名取ref_name；名称相近不代表共享版本或奖池。每条原行的全部字段见对应表JSON；玩法流程见[活动规则册](../activity-rulebooks/README.md)。\n\n两列时间都调用当前activityWindow，不是已核原客户端窗口算法。未平移列保留world_time原绝对起点，相对开服活动则使用本服开服输入；本服列另应用参考服平移政策。原客户端FlushTime.GetDayZero在05:00前取前一业务日对应的午夜，与当前函数的自然午夜不同，不能混称。原阶段算法、阶段覆盖与精确端点见[时间规则](../activity-rulebooks/time-and-stages.md)和[逐活动阶段示例](activity-phases.md)。time_fun、服务端自定义窗口、模块开关、功能开放、互斥、弃用、跨服状态和角色资格仍须独立满足。因此下表是规则参数，不能直接作为全部活动应同时上线的白名单。\n\n';
const typeGroups = new Map();
for (const entry of activityRows) {
  const key = entry.sourceTable + '/' + (entry.row.type ?? entry.row.func);
  if (!typeGroups.has(key)) typeGroups.set(key, []);
  typeGroups.get(key).push(entry);
}
activities += '|来源/类型|原内部名/管理器|活动配置数|\n|---|---|---:|\n';
for (const [key, entries] of typeGroups) activities += `|[${key}](#${key.toLowerCase().replaceAll('/', '')})|${cell(entries[0].type?.ref_name ?? '旧Activity.func；按消费者定位')} / ${cell(entries[0].type?.lua_module?.reference ?? '—')}|${entries.length}|\n`;
for (const [key, entries] of typeGroups) {
  activities += `\n## ${key}\n\n`;
  const type = entries[0].type;
  if (type) activities += `类型完整原值：${code(type)}。\n\n`;
  activities += '|活动ID / 原名|版本|原时间字段|阶段与资格字段|当前函数未平移示例|当前函数本服平移示例|\n|---|---:|---|---|---|---|\n';
  for (const entry of entries) {
    const r = entry.row;
    const timeFields = ['time_type','world_time','refer_day','server_day','refer_start_time','server_start_time','duration_day','end_time','time_fun','time_fun_args'];
    const stageFields = ['stage','stage_duration_day','stage_end_time','state','state_end_day','state_end_time','join_server_day','server_day_limit','server_mini_open_limited','server_max_open_limited','server_limited_type','world_limit_day','world_limit_state','discard_time'];
    const pick = keys => Object.fromEntries(keys.filter(k => Object.hasOwn(r, k)).map(k => [k, r[k]]));
    const original = entry.unshiftedImplementationWindow, current = entry.currentCalculatedWindow;
    activities += `|${r.tid} / ${cell(r.ref_name)}|${r.version}|${code(pick(timeFields))}|${code(pick(stageFields))}|${original ? formatTime(original.start) + ' → ' + formatTime(original.end) : '当前函数无静态投影'}|${current ? formatTime(current.start) + ' → ' + formatTime(current.end) + ' / ' + current.kind : '当前函数无窗口'}${entry.reconstructionDecision ? '；执行见[明确R1裁定](dynamic-schedule-decisions.md)' : ''}|\n`;
  }
}
write('activities.md', activities);

const originalRelative = activityRows.filter(v => v.originalTimeKind === 'server-day' && !v.originalDynamicFunctionUnresolved);
const candidateWindows = activityRows.filter(v => v.currentCalculatedWindow && !v.originalDynamicFunctionUnresolved);
let schedule = '# 开服前90天排期参数与逐日检查表\n\n这是由完整原配置和本服当前纯时间算法生成的可复查排期参数，**不是已核原服全活动运营日历，也不是可直接force_open的清单**。原配置中可能同时存在不同年代、投放对象和互斥版本。服务器资格、功能/模块开关、服务端排期、世界限制、discard_time与当前实例须另核；生成器不读线上状态。\n\n';
schedule += `本服输入：${calendar.serverOpenedAt}；参考服：${calendar.activityReferenceOpenedAt}；模式：${calendar.mode}。来源：[配置](../../../${configPath})、[时间函数](../../../personal-server/game/time.mjs)、[窗口计算](../../../personal-server/game/activity-calendar.mjs)、[生命周期](../../../personal-server/game/activity-lifecycle.mjs)。\n\n`;
schedule += '## 时间口径与使用方法\n\n1. 开服业务日按当前time.serverDay计算。日内05:00为业务日切，00:00为自然日切；开服18:00不能按满24小时才到次日。原FlushTime.GetDayZero的特殊对齐见[时间规则](../activity-rulebooks/time-and-stages.md)，不能与本服naturalDay混用。\n2. 原refer_day/server_day与world_time分别登记。正式执行已经裁定世界活动保留原绝对日期；当前代码的平移列只作实现差异核对，不能作为发布输入。历史回放须声明单独统一时间轴。\n3. 原state_end_day/state_end_time与ActFrame.stage数组不混用；原阶段算法在显式示例S/E下的结果见[逐活动阶段](activity-phases.md)，0天不自动表示无阶段，空stage不自动补进行期。四项专项明确的R1显式50段是推定输入。\n4. 下列“窗口覆盖”仅指当前窗口start≤检查时刻<end，未检查业务资格；数量不等于界面可见数、可玩数或已实现数。\n5. 完整原字段及当前函数投影见[JSON](activities.json)。四项执行方案已定，见[动态排期裁定](dynamic-schedule-decisions.md)；末列是唯一R1推定首期事件，和左侧当前实现投影分开。\n\n';
schedule += '## 第1—90天\n\n每天按本服输入计算；第1天检查时刻是实际开服时刻，其后检查05:00。新增ID按该检查时刻所在自然日期列出，即第1天含实际开服前的配置起点；不表示玩家在开服前可进入。左侧两列阶段事件按原客户端阶段算法计算，旧表采用原表S/E，ActFrame采用假设本服S，均不是实际运营发布清单。末列另列R1四项已定首期：默认真实单服组示例，首期后不隐式复发；175001遵从父世界绝对窗口，不在2026新服自动重开。完整输入和边界记录见[逐活动阶段](activity-phases.md)及[动态专项](dynamic-schedule-decisions.md)。\n\n|开服日|检查时刻|原相对配置中当天开始的ID（当前函数）|当前本服计算中当天开始的ID（含平移）|窗口覆盖配置数|旧Activity原表fallback阶段事件|ActFrame假设本服S阶段事件|R1四项实例事件（推定）|\n|---:|---|---|---|---:|---|---|---|\n';
for (let day = 1; day <= 90; day++) {
  const at = day === 1 ? openedAt : naturalDay(openedAt) + (day - 1) * 86400 + 18000;
  if (serverDay(openedAt, at) !== day) throw new Error('Server-day projection mismatch: ' + day);
  const lower = naturalDay(at), upper = lower + 86400;
  const started = rows => rows.filter(v => v.currentCalculatedWindow?.start >= lower && v.currentCalculatedWindow.start < upper).map(v => v.sourceTable + ':' + v.row.tid);
  const events = basis => phaseEvents.filter(e => e.basis === basis && e.at >= lower && e.at < upper)
    .sort((a, b) => a.at - b.at || a.actId - b.actId)
    .map(e => `${e.actId} ${formatTime(e.at).slice(11, 19)} ${e.fromStage}终点${e.toStage == null ? '' : '→' + e.toStage}`).join('；');
  const decisionEvents = [];
  for (const decision of dynamicDecisions) {
    const instance = decision.decidedFirstInstance;
    for (const [time, description] of [[instance.start, '开始'], ...instance.stages.map(s => [s.end, s.stageId + '终点'])]) {
      if (time >= lower && time < upper) decisionEvents.push({ time, text: `${decision.actId} ${formatTime(time).slice(11, 19)} ${description}` });
    }
  }
  schedule += `|${day}|${formatTime(at)}|${cell(started(originalRelative).join(', '))}|${cell(started(candidateWindows).join(', '))}|${candidateWindows.filter(v => v.currentCalculatedWindow.start <= at && at < v.currentCalculatedWindow.end).length}|${cell(events('original-legacy-table-fallback'))}|${cell(events('actframe-example-instance-fallback'))}|${cell(decisionEvents.sort((a,b) => a.time - b.time).map(e => e.text).join('；'))}|\n`;
}
schedule += '\n## 四项动态排期已定\n\n以下取代旧版“不能静态给出完整排期”表。原服务器隐藏函数未取得的事实仍保留，但实施行为已经固定；原证据与推定身份见[专项正文](dynamic-schedule-decisions.md)。\n\n|来源|ID|原名|原time_fun|唯一R1执行方案|\n|---|---:|---|---:|---|\n';
for (const decision of dynamicDecisions) schedule += `|ActFrameTable|${decision.actId}|${cell(activityRows.find(v => v.sourceTable === 'ActFrameTable' && Number(v.row.tid) === decision.actId).row.ref_name)}|${decision.rawTimeFields.time_fun}|${cell(decision.decision)}|\n`;
write('activity-calendar.md', schedule);

let index = '# 全量规则配置与数值索引\n\n本目录是现有客户端提取资产的逐字段、逐行事实账册。与[系统规则册](../../system-rulebooks/README.md)、[活动规则册](../../activity-rulebooks/README.md)配合使用；表值、消费者语义与原服运行证据分别记录。外部脚本符号不执行，不自动解释为已恢复规则。\n\n';
index += '|原表|已登记子表|已恢复行数|未恢复子表|完整数值|\n|---|---:|---:|---:|---|\n';
for (const [name, table] of tables) index += `|[${name}](${name}.md)|${Object.keys(table.families).length}|${Object.values(table.families).reduce((n, f) => n + (f.count ?? 0), 0)}|${Object.values(table.families).filter(f => f.status === 'unresolved').length}|[全部行](${name}.json)|\n`;
index += '\n没有资产的玩法不生成虚构配置。Guild、部分排行榜/跨服、概率服务端覆盖等保留[原证据债务](../unresolved.md)，执行按[最终基线](../../12-final-rule-baseline.md)和[逐任务裁定](../final-rule-register.md)；四项动态排期已在[专项](../dynamic-schedule-decisions.md)固定。相同原表的资产变体记录在JSON.sourceVariants，选定源及SHA256分别保存，不以一个变体替代其他版本。\n';
index += '\n专题数值索引：[全部商品的价格/奖励/限购参数](../products.md)、[奖池权重/候选/保底参数](../draw-pools.md)、[297个协议任务与详细规则册对应表](../module-rule-index.md)。\n';
write('tables/README.md', index);

let unresolved = '# 原证据债务与已定执行方案\n\n版本：' + RULE_BASELINE + '。本文记录原版证据的边界，不再将执行方式留给实现者选择。实施统一按[最终基线](../12-final-rule-baseline.md)、[全部任务裁定](final-rule-register.md)和[动态排期](dynamic-schedule-decisions.md)。每项原证据债务只能用同版原表/消费者或已保存实测证据关闭；文档推定和业务测试通过不能冒充原证据。\n\n## 配置解释失败\n\n以下根索引解析失败时，不借邻行、不当空奖；必要成本/产出缺行仅拒绝该变更，已有可证独立动作仍执行。\n\n|资产|子表|具体阻断|\n|---|---|---|\n';
for (const [name, table] of tables) for (const [family, info] of Object.entries(table.families)) if (info.status === 'unresolved') unresolved += `|[${name}](tables/${name}.md)|${family}|${cell(info.reason)}|\n`;
unresolved += '\n上述是具体资产根索引的解析阻断，不表示整个相关功能没有任何数值。ArtifactTable.LevelUp另有[ArtifactLevelUp独立分片](tables/ArtifactLevelUp.md)，已恢复3005行；HeroTable.NpcAttr另有[HeroTableNpcAttr独立分片](tables/HeroTableNpcAttr.md)。同名根索引与分片的版本/来源仍须对应，不能混成任意互换的行。TaskTable.CommonTask根索引仍未恢复。\n';
unresolved += '\n## 跨系统原证据债务及唯一执行决定\n\n|范围|尚未取得的原版证据|本版固定行为|关闭原证据债务所需材料|\n|---|---|---|---|\n|战斗与技能|原基础伤害/防御分母、部分速度/怒气生成、被动门槛、固定攻方91102和NPC能力|仅[锁版兼容R1](../12-final-rule-baseline.md#battle)及明确白名单继续；缺必要敌阵/技能的对应特殊挑战不新结算|同版完整消费者与可对照原战报；不借玩家全部后期被动|\n|招募与活动随机|空lib_range、隐藏覆盖、部分心愿/保底及版本切池|[R1-RNG](final-rule-register.md#r1-rng)：必要链缺失的具体消耗抽取拒绝，独立固定奖及合法pending保留|精确原候选和抽取/保底消费者；展示概率不足以关闭|\n|运营排期|原461服务器实现及四项目标实例未取得|[四项唯一方案](dynamic-schedule-decisions.md)：175001父期继承；组day29/79/90首期；不自动复发；正式world_time保留绝对日期|同版原时间函数或可信原下发实例，新增证据须升级R版本；不再讨论是否默认平移|\n|活动结算|部分家族原邮件、回收/兑换和同分消费者|[R1-ROLLOVER](final-rule-register.md#r1-rollover)旧币冻结/确定权益保留；[R1-RANK](final-rule-register.md#r1-rank)固定同分键；不编邮件|具体家族原配置与消费者；框架枚举不能证明原政策|\n|公会与多人|未取得的Guild配置、部分匹配/榜奖/拍卖关系|[R1-SHARED](final-rule-register.md#r1-shared)：真实空榜/单服组，缺必要链仅拒绝该新变更，不造对手|同版原表及真实多人结果证据|\n|初始与功能|原全量初始档案、303条功能配置仍有证据缺口、1级实际弹窗入口|[原条件文档](../appendices/feature-unlocks.md)已核220条；当前映射177/346另列。缺证条件按未满足；不全开/全清旧位，不提前赠角|对应初始模块、MethodScript及界面触发链；955132601007和1514不再算语义未知|\n|实现一致性|当前all-open/平移/阶段过滤/删模块等与目标有差异|按[R1](../12-final-rule-baseline.md)修复，保留必要初始化结构；当前源码不是另一套发布规则|实现agent逐项组件/TCP/存档/APK验收；本轮不修改业务消除差异|\n';
write('unresolved.md', unresolved);

const summary = { sourceAssets: [...groups.values()].reduce((n, v) => n + v.length, 0), tableDocuments: tables.size,
  registeredFamilies: familyCount, recoveredRows: rowCount, unresolvedFamilies: unresolvedCount,
  activityRows: activityRows.length, activityTypes: typeGroups.size, activityPhaseRows: phaseRows.length,
  moduleGroups: modules.size, commandCount: inventory.commands.length,
  products: lookup('RechargeTable', 'Recharge').length, drawLibraries: poolRows.length, calendarDays: 90 };
const documentationInputs = [...new Set(['docs/README.md', 'docs/gameplay-operations/README.md', 'docs/gameplay-operations/11-project-roadmap.md',
  'docs/gameplay-operations/08-operations-runbook.md', 'docs/gameplay-operations/rules/worked-examples.md',
  'AGENTS.md', 'personal-server/README.md', 'agent/workflow/rule-baseline-20261115/implementation.md',
  'docs/gameplay-operations/appendices/evidence-manifest.json',
  'docs/gameplay-operations/appendices/feature-unlocks.md', 'docs/gameplay-operations/appendices/feature-rule-decisions.json',
  ...fs.readdirSync(path.join(root, 'docs/plans/remaining-gameplay-20261106')).filter(name => name.endsWith('.md'))
    .map(name => 'docs/plans/remaining-gameplay-20261106/' + name),
  'docs/08-activity-fix-checklist.md', 'docs/09-system-completion-plan.md', 'docs/10-store-product-flow-remediation-plan.md',
  ...fs.readdirSync(path.join(root, 'docs/gameplay-operations')).filter(name => /^\d+-.+\.md$/.test(name))
    .map(name => 'docs/gameplay-operations/' + name),
  ...['README', 'onboarding-combat', 'heroes-equipment', 'economy-tasks-shops', 'modes-guild-social']
    .map(name => 'docs/gameplay-operations/system-rulebooks/' + name + '.md'),
  ...['README', 'draw-and-recruit', 'exploration-and-minigames', 'festivals-and-social', 'commerce-and-benefits']
    .map(name => 'docs/gameplay-operations/activity-rulebooks/' + name + '.md')])];
const timeEvidenceInputs = [
  'analysis/scratchpad/time-temple-20261108/project/16510616264917154000-ActivityTimeUtil.lua.bin',
  'analysis/scratchpad/time-temple-20261108/project/17268122440433684000-Activity.lua.bin',
  'analysis/scratchpad/time-temple-20261108/project/6615133135189614000-ActivityTable.lua.bin',
  'analysis/scratchpad/time-temple-20261108/project/11089512760612760000-ActFrameTable.lua.bin',
  'analysis/scratchpad/game-rules-20261114/time-assets/2608048538802469000-FlushTime.lua.bin',
  'analysis/scratchpad/game-rules-20261114/time-assets/3862134482850994700-TimeKit.lua.bin',
  'analysis/scratchpad/game-rules-20261114/time-assets/424803492374703360-FlushTimeTable.lua.bin',
  'analysis/scratchpad/game-rules-20261114/time-stage-evidence.json'
];
const decisionInputs = [...new Set([...decisionEvidencePaths, ...taskDecisionSources,
  'analysis/scratchpad/activity-schedule-20261115/buyskin175001/decisions.md',
  'analysis/scratchpad/activity-schedule-20261115/buyskin175001/decision-sources.json',
  'analysis/scratchpad/activity-schedule-20261115/instances/decisions.md',
  'analysis/scratchpad/activity-schedule-20261115/instances/decision-source-manifest.json',
  'analysis/scratchpad/activity-schedule-20261115/method461/assets/manifest.json',
  'analysis/scratchpad/activity-schedule-20261115/buyskin175001/source-manifest.json',
  'tools/verify-detailed-rule-docs.mjs', 'tools/build-gameplay-doc-evidence.mjs',
  'analysis/scratchpad/activity-schedule-20261115/normalize-doc-status.mjs'
])];
const manifest = { schemaVersion: 2, snapshotDate: '2026-11-15', baseline: RULE_BASELINE, scope: 'documentation and extracted configuration only',
  generator: { path: 'tools/build-detailed-rule-docs.mjs', sha256: hash(read('tools/build-detailed-rule-docs.mjs')) },
  inventory: { path: inventoryPath, sha256: hash(read(inventoryPath)) },
  summary, sources: [...groups.values()].flat().map(v => ({ path: v.sourcePath, sha256: v.sha256 })),
  projectionSources: calendarInputs.map(p => ({ path: p, sha256: hash(read(p)) })),
  documentationSources: documentationInputs.map(p => ({ path: p, sha256: hash(read(p)) })),
  decisionSources: decisionInputs.map(p => ({ path: p, sha256: hash(read(p)) })),
  evidenceSources: timeEvidenceInputs.map(p => ({ path: p, sha256: hash(read(p)) })), generatedFiles: outputs };
write('README.md', `# 详细规则、数值与活动排期

2026-11-15，最终执行基线${RULE_BASELINE}。先读[唯一基线](../12-final-rule-baseline.md)、[全部297任务裁定](final-rule-register.md)与[四项动态排期](dynamic-schedule-decisions.md)。原证据债务不再作为执行选项；调查defaults未整体采纳，审核覆盖与最终政策优先。除代金券发放/领取/面值/抵扣保留定制，其余玩法与运营以同版原配置和消费者为准。

## 阅读顺序

1. [系统规则册](../system-rulebooks/README.md)：139个协议任务的创角、战斗、英雄装备、资源任务商店与社交公会。
2. [活动规则册](../activity-rulebooks/README.md)：158个家族的流程、资格、消耗发奖、概率/保底、限购、排名和结算。
3. [逐活动ID与版本](activities.md)：${activityRows.length}条原配置、当前实现投影及四项R1决定分别保存。
4. [原时间算法](../activity-rulebooks/time-and-stages.md)和[逐活动阶段](activity-phases.md)：两种框架分别计算，列输入与阻断；空stage不自动补进行期，R1专项的显式阶段另列推定身份。
5. [前90天排期](activity-calendar.md)：原相对候选、当前实现差异与R1首期分列，含阶段转换。正式世界日期保留原值，当前平移列不作发布规则。
6. [完整数值表](tables/README.md)：${tables.size}份表文档、${familyCount}个子表登记、${rowCount}行原配置，完整JSON不截断。
7. [商品](products.md)、[奖池](draw-pools.md)、[297任务/1407命令对应](module-rule-index.md)与[查规则示例](worked-examples.md)。
8. [原证据债务与已定行为](unresolved.md)：${unresolvedCount}个根索引解析阻断（部分有独立分片），各项均绑定R1执行政策。
9. [统一规划](../11-project-roadmap.md)与[运营手册](../08-operations-runbook.md)：实施依赖、阶段验收与逐期操作。

## 数值如何使用

活动ID、版本、表行tid、功能ID、命令type和物品ID属于不同空间，不能因数字相同互换。沿规则册关联到本版本，再读JSON的families.<子表>.rows；不借邻期、同名活动或邻近品质补行。现金分、倍率分母、百分比和普通权重分别由对应消费者证明。

每份表页列源路径、SHA256、字段类型和恢复状态。reference只是外部符号，解析失败不能写成原表为空。原规则、R1推定、当前代码、组件验证和APK验收分别记录；文档覆盖不表示原服隐藏算法或全部玩法已恢复。

## 重建与校验

项目根目录PowerShell执行：

\`\`\`powershell
node tools/build-gameplay-doc-evidence.mjs
node tools/build-detailed-rule-docs.mjs
node tools/build-detailed-rule-docs.mjs --check
node tools/verify-detailed-rule-docs.mjs
\`\`\`

工具仅写文档，不打开数据库、启动服务或操作设备。[manifest](manifest.json)记录原表、原型说明、手写规则、两份调查、审核覆盖、功能条件差异及生成结果的SHA256。旧调查中的正文快照哈希作为历史记录保留，不冒充当前文件指纹。
`);
write('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
if (failures.length) throw new Error('Detailed rule documentation is stale: ' + failures.join(', '));
console.log(JSON.stringify({ ...summary, files: outputs.length, mode: checking ? 'checked' : 'written' }, null, 2));
