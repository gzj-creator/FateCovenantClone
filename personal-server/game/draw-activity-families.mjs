import { consumeResources, grantResources } from './resources.mjs';
import { activityRows } from '../config/draw-activities-tables.mjs';

const C = Object.freeze({
  magicChooseHero: 60002, magicAchieveAward: 60003, magicHeroStarAward: 60004,
  pinBallAward: 88921, fantasyEquipReset: 88925, fantasyEquipPlay: 88926,
  pyramidDraw: 88941, pyramidTask: 88942,
  admonitionDraw: 88961, admonitionBoxAward: 88962, admonitionAddDrawCount: 88965, admonitionEnter: 88966,
  hundredBonusRandom: 89401, hundredBonusAward: 89402, hundredBonusLog: 89403,
  chessDraw: 91901, chessTask: 91902, chessChooseAward: 91903, chessNewTurn: 91904,
  chessExchange: 91905, chessTurnAward: 91906, raffleAchievement: 92101, heroBlazonDraw: 92201,
  lotteryActDraw: 92301, lotteryActLog: 92302, mysteryWishExchange: 93001, lotteryUse: 93101,
  lotteryExpire: 93102, flipCardTurn: 97201, flipCardDraw: 97301, ticketDrawAward: 97501,
  ticketDrawHistory: 97502, fruitDrawBig: 97901, fruitDraw: 97902, chooseWish: 98101,
  elvesMain: 100901, elvesFruitAct: 100902, elvesDrawAward: 100903,
  capsuleToyDraw: 102301, capsuleToyExchange: 102302, capsuleToyCollect: 102303, capsuleToyProgress: 102304,
  chessRevertTurnAward: 102401, chessRevertSelectGift: 102402, chessRevertNextTurn: 102403,
  puzzleDraw: 103301, puzzleAward: 103302, puzzleChangeTurn: 103303, puzzleTaskAward: 103304, puzzleSelectAward: 103305,
  hoardSetPool: 103501, hoardTask: 103502, hoardPile: 103503,
  thousandDraw: 104501, thousandAward: 104502, praySelect: 104901, prayDraw: 104902,
  cashbackDraw: 105501, cashbackGetTimes: 105502, cashbackServerAward: 105503, cashbackServerProgress: 105504,
  turntableGo: 107901, flopDraw: 109101, flopClaim: 109102, flopTotalClaim: 109103
});

const pairs = value => Array.isArray(value)
  ? value.filter(entry => Array.isArray(entry) && entry.length >= 2)
    .map(entry => [Number(entry[0]), Number(entry[1])])
    .filter(([tid, num]) => Number.isSafeInteger(tid) && tid > 0 && Number.isSafeInteger(num) && num > 0)
  : [];
const tableRows = (activity, name) => [...activityRows(activity, name).values()];
const tableRowsFrom = table => table instanceof Map ? [...table.values()] : Array.isArray(table) ? table : [];
const first = table => tableRowsFrom(table)[0] ?? null;
const res = changes => ({ changes, is_overflow: false });

function packed(codec, schema, value, extra = {}) {
  return { value, data: schema ? codec.pack(schema, value) : Buffer.alloc(0), ...extra };
}

function counterObject(state, key) {
  const value = state.counters[key];
  return value && typeof value === 'object' && !Array.isArray(value) ? value : (state.counters[key] = {});
}

function addCounterMap(state, key, id, delta = 1) {
  const map = counterObject(state, key);
  map[String(id)] = Number(map[String(id)] ?? 0) + delta;
  return map[String(id)];
}

export function createDrawFamilies(engine) {
  const { fail, intOf, tx, tables, codec, markClaimed, claimed, drawFromLib, weightedPick, etfNumber, etfArray, activityTables } = engine;
  const handlers = new Map(), modules = new Map();
  const add = (module, types, handler) => {
    for (const type of types) { handlers.set(Number(type), handler); modules.set(Number(type), module); }
  };

  function magicVersion() {
    const activity = activityTables('MagicDrawTable');
    const version = first(activityRows(activity, 'MagicDraw'));
    if (!version) fail(5, 'Magic draw configuration is missing');
    return { activity, version };
  }

  add('magic_draw', [C.magicChooseHero], request => {
    const { activity, version } = magicVersion();
    const id = intOf(etfNumber(request), 'magic draw hero');
    const heroRows = tableRows(activity, 'Hero');
    const selected = heroRows.find(row => Number(row.tid) === id) ?? heroRows.find(row => Number(row.hero) === id);
    if (!selected) fail(1, 'Magic draw hero is not configured');
    return tx('magic_draw', Number(version.tid), ({ state }) => {
      state.selections.hero = Number(selected.tid);
      const value = { data: { draw_hero_tid: String(selected.hero), version: String(version.tid) }, res: res([]) };
      return packed(codec, 'pb_magic_draw_back', value, { value: value.data, heroTid: Number(selected.hero) });
    });
  });

  add('magic_draw', [C.magicAchieveAward], request => {
    const { activity, version } = magicVersion();
    const awardTid = intOf(etfNumber(request), 'magic draw achievement');
    const award = activityRows(activity, 'Award').get(awardTid);
    if (!award) fail(1, 'Magic draw achievement is not configured');
    return tx('magic_draw', Number(version.tid), ({ model, state }) => {
      if (Number(state.counters.draw_count ?? 0) < Number(award.need_count)) fail(311, 'Magic draw achievement is not reached');
      markClaimed(state, 'achievements', awardTid);
      const granted = grantResources(model, pairs(award.item?.map((tid, index) => [tid, award.item_count?.[index]])), tables);
      const value = { data: { version: String(version.tid), draw_count: String(state.counters.draw_count ?? 0) }, res: res(granted.changes) };
      return packed(codec, 'pb_magic_draw_back', value, { value: value.data, awardTid, changes: granted.changes });
    });
  });

  add('magic_draw', [C.magicHeroStarAward], () => {
    fail(5, 'MagicDrawTable.StarRes has no production rows');
  });

  // Three admonition: 88961 consumes a paid draw, 88962 claims one of the
  // configured boxes after all of its draw indices have been opened.
  function admonitionConfig() {
    const activity = activityTables('ThreeAdmonitionTable');
    const config = first(activityRows(activity, 'Const'));
    if (!config) fail(5, 'Three admonition configuration is missing');
    return { activity, config };
  }

  add('three_admonition', [C.admonitionDraw], () => {
    const { activity, config } = admonitionConfig();
    const drawAwards = tableRows(activity, 'DrawAward').sort((a, b) => Number(a.tid) - Number(b.tid));
    if (!drawAwards.length) fail(5, 'Three admonition draw awards are missing');
    return tx('three_admonition', Number(config.tid), ({ model, db, state, at }) => {
      const available = Number(state.counters.draw_count ?? 0);
      if (available < 1) fail(301, 'Three admonition draw count is exhausted');
      consumeResources(model, [[Number(config.draw_cost_item), Number(config.draw_cost_item_num ?? 1)]], 301);
      const opened = Array.isArray(state.selections.indices) ? state.selections.indices : [];
      const candidates = drawAwards.filter(row => !opened.includes(Number(row.tid)));
      const picked = weightedPick(candidates.length ? candidates : drawAwards, () => 1);
      opened.push(Number(picked.tid));
      state.selections.indices = opened;
      state.counters.draw_count = available - 1;
      state.counters.draw_num = Number(state.counters.draw_num ?? 0) + 1;
      const granted = grantResources(model, pairs(picked.award), tables);
      const info = {
        draw_num: state.counters.draw_num, draw_award_states: Buffer.alloc(0),
        box_award_states: Buffer.alloc(0), award_index_list: opened,
        is_enter_act: true, total_win_count: state.counters.total_win_count ?? 0,
        draw_award_index_info: Buffer.alloc(0), act_version: config.tid, act_id: config.tid
      };
      const value = { res: res(granted.changes), new_role_data: info };
      engine.recordLog(db, model.state.roleId, 'three_admonition', config.tid, 'draw', { awardTid: picked.tid }, at);
      return packed(codec, 'pb_three_admonition_draw_ret', value, { value, awardTid: picked.tid, changes: granted.changes });
    });
  });

  add('three_admonition', [C.admonitionBoxAward], request => {
    const { activity, config } = admonitionConfig();
    const boxTid = intOf(etfNumber(request), 'three admonition box');
    const box = activityRows(activity, 'BoxAward').get(boxTid);
    if (!box) fail(1, 'Three admonition box is not configured');
    return tx('three_admonition', Number(config.tid), ({ model, state }) => {
      const opened = new Set((state.selections.indices ?? []).map(Number));
      if ((box.finish_index_list ?? []).some(id => !opened.has(Number(id)))) fail(311, 'Three admonition box requirements are not met');
      markClaimed(state, 'boxes', boxTid);
      const granted = grantResources(model, pairs(box.award), tables);
      const info = {
        draw_num: state.counters.draw_num ?? 0, award_index_list: [...opened], is_enter_act: true,
        total_win_count: state.counters.total_win_count ?? 0, act_version: config.tid, act_id: config.tid
      };
      return packed(codec, 'pb_three_admonition_draw_ret', { res: res(granted.changes), new_role_data: info }, { value: info, boxTid, changes: granted.changes });
    });
  });

  add('three_admonition', [C.admonitionAddDrawCount], request => {
    const { config } = admonitionConfig();
    const times = intOf(request?.times ?? etfNumber(request, 1), 'three admonition draw count');
    return tx('three_admonition', Number(config.tid), ({ model, state }) => {
      const total = Number(state.counters.draw_count ?? 0) + times;
      if (total > Number(config.max_draw_count)) fail(311, 'Three admonition draw count limit is reached');
      const spent = consumeResources(model, [[Number(config.cost_item), Number(config.cost_item_num) * times]], 301);
      state.counters.draw_count = total;
      const value = res(spent.changes);
      return packed(codec, 'pb_res_to_client', value, { value, total });
    });
  });

  add('three_admonition', [C.admonitionEnter], () => tx('three_admonition', 1, ({ state }) => {
    state.counters.total_win_count ??= 0;
    return { value: { entered: true }, data: Buffer.alloc(0) };
  }));

  // The pyramid stores opened positions per round/ceiling. The price follows
  // Version.sub_item and Ceil.sub_num; the product/trans fields describe the
  // exchange shop and are not a second draw price.
  function pyramidConfig() {
    const activity = activityTables('PyramidTable');
    const version = first(activityRows(activity, 'Version'));
    if (!version) fail(5, 'Pyramid configuration is missing');
    return { activity, version, versionId: Number(version.tid) };
  }
  function pyramidInfo(state, version) {
    return {
      version: Number(version.tid), round: Number(state.counters.round ?? 1), ceil: Number(state.counters.ceilIndex ?? 0) + 1,
      award_bin: Buffer.alloc(0), is_over: false
    };
  }

  add('pyramid', [C.pyramidDraw], () => {
    const { activity, version, versionId } = pyramidConfig();
    return tx('pyramid', versionId, ({ model, state }) => {
      const round = Math.max(1, Number(state.counters.round ?? 1));
      const ceilIds = version.round?.[round - 1] ?? [];
      const ceilIndex = Number(state.counters.ceilIndex ?? 0);
      const ceil = activityRows(activity, 'Ceil').get(Number(ceilIds[ceilIndex]));
      if (!ceil) fail(5, 'Pyramid ceiling is not configured');
      const key = `opened:${round}:${ceil.tid}`;
      const opened = new Set(Array.isArray(state.selections[key]) ? state.selections[key].map(Number) : []);
      const awards = (ceil.award ?? []).map(Number);
      const remaining = awards.filter(id => !opened.has(id));
      if (!remaining.length) fail(310, 'Pyramid ceiling is already complete');
      const spent = consumeResources(model, [[Number(version.sub_item), Number(ceil.sub_num)]], 301);
      const awardTid = remaining[Math.min(remaining.length - 1, Math.floor((Number(engine.random()) || 0) * remaining.length))];
      const award = activityRows(activity, 'Award').get(Number(awardTid));
      if (!award) fail(5, 'Pyramid award is not configured');
      opened.add(awardTid); state.selections[key] = [...opened]; state.counters.draw_count = Number(state.counters.draw_count ?? 0) + 1;
      const granted = grantResources(model, [[Number(award.award_item), Number(award.award_num)]], tables);
      let nextCeil = false, nextRound = false;
      if (opened.size >= awards.length) {
        state.counters.ceilIndex = ceilIndex + 1;
        nextCeil = !ceilIds[ceilIndex + 1];
        if (nextCeil) { state.counters.round = round + 1; state.counters.ceilIndex = 0; nextRound = !version.round?.[round]; }
      }
      const value = { info: pyramidInfo(state, version), res: res([...spent.changes, ...granted.changes]),
        is_special: Boolean(award.special), award_index: awards.indexOf(awardTid), is_next_ceil: nextCeil, is_next_round: nextRound };
      return packed(codec, 'pb_pyramid_draw_back', value, { value, awardTid, changes: value.res.changes });
    });
  });

  add('pyramid', [C.pyramidTask], () => {
    fail(5, 'Pyramid task progression events are not authoritative in personal-server');
  });

  // Capsule toys keep per-toy counts so collect recycling and draw history use
  // the same resource numbers. Exchange slots are validated against the table's
  // group/count pattern before anything is spent.
  function capsuleConfig() {
    const activity = activityTables('CapsuleToyTable');
    const config = first(activityRows(activity, 'Const'));
    const version = first(activityRows(activity, 'Version'));
    if (!config || !version) fail(5, 'Capsule toy configuration is missing');
    return { activity, config, version, versionId: Number(version.tid) };
  }
  function capsuleStateInfo(state) {
    const draws = counterObject(state, 'toys');
    return Object.entries(draws).map(([tid, num]) => ({ tid: String(tid), num: String(num) }));
  }

  add('capsule_toy', [C.capsuleToyDraw], () => {
    const { activity, config, version, versionId } = capsuleConfig();
    const pools = (version.pool ?? []).map(Number);
    const outputs = tableRows(activity, 'PoolOutput').filter(row => pools.includes(Number(row.pool)));
    if (!outputs.length) fail(5, 'Capsule toy pool outputs are missing');
    return tx('capsule_toy', versionId, ({ model, state }) => {
      if (Number(state.counters.draw_count ?? 0) >= Number(config.draw_limit_num)) fail(311, 'Capsule toy draw limit is reached');
      const spent = consumeResources(model, [[Number(config.draw_cost_item), Number(config.draw_cost_num)]], 301);
      const picked = weightedPick(outputs, row => row.num);
      const toy = Number(picked.toy), num = Math.max(1, Number(picked.num) || 1);
      const granted = grantResources(model, [[toy, num]], tables);
      addCounterMap(state, 'toys', toy, num);
      state.counters.draw_count = Number(state.counters.draw_count ?? 0) + 1;
      const value = { res: res([...spent.changes, ...granted.changes]), collect_list: [],
        draw_count: String(state.counters.draw_count), day_hit_count: String(state.counters.day_hit_count ?? 0),
        draw_list: capsuleStateInfo(state).map(row => ({ toy: row.tid, num: row.num })) };
      return packed(codec, 'pb_capsule_toy_draw_back', value, { value, toy, changes: value.res.changes });
    });
  });

  add('capsule_toy', [C.capsuleToyExchange], request => {
    const { activity, versionId } = capsuleConfig();
    const input = engine.decode('pb_capsule_toy_exchange_req', request.bytes);
    const exchange = activityRows(activity, 'Exchange').get(Number(input.exchange_tid));
    if (!exchange) fail(1, 'Capsule toy exchange is not configured');
    return tx('capsule_toy', versionId, ({ model, state }) => {
      const used = counterObject(state, 'exchanges');
      if (Number(used[String(exchange.tid)] ?? 0) >= Number(exchange.limit)) fail(311, 'Capsule toy exchange limit is reached');
      const costs = [];
      for (const slot of input.exchange_list ?? []) {
        const index = Number(slot.index ?? 0);
        const expectedGroup = Number(exchange.group?.[index]);
        const expectedNum = Number(exchange.num?.[index]);
        const selected = pairListFromKv(slot.item_list);
        if (!expectedGroup || !expectedNum || selected.length !== 1 || selected[0][1] !== expectedNum) fail(1, 'Invalid capsule exchange slot');
        const toy = activityRows(activity, 'CapsuleToy').get(selected[0][0]);
        if (Number(toy?.type ?? -1) !== expectedGroup) fail(1, 'Capsule exchange item does not match its group');
        costs.push(selected[0]);
      }
      if (costs.length !== (exchange.group ?? []).length) fail(1, 'Capsule exchange slots are incomplete');
      const before = new Map(costs.map(([tid, num]) => [String(tid), model.resources.get(String(tid))?.num]));
      const spent = consumeResources(model, costs, 301);
      for (const [tid, num] of costs) {
        const actual = costs.reduce((sum, entry) => sum + (entry[0] === tid ? entry[1] : 0), 0);
        addCounterMap(state, 'toys', tid, -actual);
      }
      const granted = grantResources(model, pairs(exchange.award_num), tables);
      addCounterMap(state, 'exchanges', exchange.tid);
      const value = res([...spent.changes, ...granted.changes]);
      return packed(codec, 'pb_res_to_client', value, { value, exchangeTid: exchange.tid, before });
    });
  });

  function pairListFromKv(values) {
    return (values ?? []).map(entry => [Number(entry.key), Number(entry.value)]).filter(([key, value]) => key > 0 && value > 0);
  }

  add('capsule_toy', [C.capsuleToyCollect], request => {
    const { activity, versionId } = capsuleConfig();
    const toyTid = intOf(etfNumber(request), 'capsule toy tid');
    const toy = activityRows(activity, 'CapsuleToy').get(toyTid);
    if (!toy) fail(1, 'Capsule toy is not configured');
    return tx('capsule_toy', versionId, ({ model, state }) => {
      markClaimed(state, 'collect', toyTid);
      const spent = consumeResources(model, [[Number(toy.collect_item), Number(toy.collect_count)]], 301);
      const granted = grantResources(model, [[Number(toy.recycle_item), Number(toy.recycle_count)]], tables);
      addCounterMap(state, 'toys', toyTid, -Number(toy.collect_count));
      const value = { res: res([...spent.changes, ...granted.changes]), collect_info: { toy_tid: String(toyTid), is_award: true } };
      return packed(codec, 'pb_capsule_toy_collect_back', value, { value, toyTid });
    });
  });

  add('capsule_toy', [C.capsuleToyProgress], request => {
    const { activity, config, versionId } = capsuleConfig();
    const requested = request.etf === undefined ? [] : etfArray(request);
    return tx('capsule_toy', versionId, ({ model, state }) => {
      const totalCollected = Object.values(counterObject(state, 'toys')).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
      const candidates = tableRows(activity, 'Collect').filter(row => !requested.length || requested.includes(Number(row.tid)));
      const grantable = candidates.filter(row => totalCollected >= Number(row.collect_count) && !claimed(state, 'progress', row.tid));
      if (!grantable.length) fail(311, 'Capsule collection progress has no claimable reward');
      for (const row of grantable) markClaimed(state, 'progress', row.tid);
      const granted = grantResources(model, grantable.map(row => [Number(row.award_item), Number(row.award_count)]), tables);
      const value = { res: res(granted.changes), progress_award: Buffer.alloc(0) };
      return packed(codec, 'pb_capsule_toy_progress_back', value, { value, claimed: grantable.map(row => row.tid) });
    });
  });

  // Chess: the client chooses a board slot. The award sequence is table-driven
  // by FixedAward.turn; a special award closes the board and allows 91904 to
  // create the next round. 91902/91903/91905 have zero production rows.
  function chessConfig(versionId) {
    const activity = activityTables('ChessTable');
    const version = intOf(versionId ?? 1, 'chess activity');
    const params = activityRows(activity, 'Param').get(version);
    if (!params) fail(5, 'Chess activity version is not configured');
    return { activity, version, params };
  }

  add('chess', [C.chessDraw], request => {
    const input = engine.decode('pb_chess_draw_req', request.bytes);
    const { activity, version, params } = chessConfig(input.activity_id);
    const boardSize = Number(params.board_shape?.[0] ?? 0) * Number(params.board_shape?.[1] ?? 0);
    const index = intOf(input.index ?? 0, 'chess index', { min: 0, max: Math.max(0, boardSize - 1) });
    return tx('chess', version, ({ model, state }) => {
      if (state.counters.turn_over) fail(311, 'Chess round is over');
      const opened = Array.isArray(state.selections.opened) ? state.selections.opened : [];
      if (opened.map(entry => Number(entry.index)).includes(index)) fail(310, 'Chess slot is already opened');
      const step = opened.length + 1;
      const award = tableRows(activity, 'FixedAward')
        .filter(row => Number(row.version) === version)
        .sort((a, b) => Number(a.turn) - Number(b.turn))[step - 1];
      if (!award) fail(311, 'Chess round has no remaining fixed award');
      const spent = consumeResources(model, [[Number(params.normal_cost_item), Number(params.normal_cost_num)]], 301);
      const granted = grantResources(model, pairs(award.turn_award), tables);
      opened.push({ index, tid: Number(award.tid) }); state.selections.opened = opened;
      state.counters.draw_times = step;
      // FixedAward.is_special selects the reward presentation; it is not the
      // board-end flag. Param.max_turn owns the number of slots in a round.
      if (opened.length >= Number(params.max_turn)) state.counters.turn_over = 1;
      const returnedAward = { tid: Number(award.award_id), num: Number(award.award_num), index };
      const value = { got_special: Boolean(award.is_special), bomb: false, award: [returnedAward], res_changes: res([...spent.changes, ...granted.changes]) };
      return packed(codec, 'pb_chess_draw_rsp', value, { value, awardTid: award.tid, index, changes: value.res_changes.changes });
    });
  });

  add('chess', [C.chessNewTurn], request => {
    const input = engine.decode('pb_chess_new_turn_req', request.bytes);
    const { version } = chessConfig(input.activity_id);
    return tx('chess', version, ({ state }) => {
      if (!state.counters.turn_over) fail(311, 'Chess round is not over');
      state.counters.round = Number(state.counters.round ?? 1) + 1;
      state.counters.turn = state.counters.round;
      delete state.counters.turn_over;
      state.selections.opened = [];
      const value = { timestamp: Math.floor(engine.seconds()), award: [], turn: state.counters.round, choose_award: 0,
        bomb_pos: [], draw_times: 0, special_award: [], turn_over: false, empty_slot: [], custom_list: [] };
      return packed(codec, 'pb_chess', value, { value, round: state.counters.round });
    });
  });

  add('chess', [C.chessTurnAward], request => {
    const input = engine.decode('pb_chess_turn_award_req', request.bytes);
    const { activity, version } = chessConfig(input.activity_id);
    const turns = (input.turns ?? []).map(Number).filter(value => value > 0);
    if (!turns.length) fail(1, 'Chess turn award list is empty');
    return tx('chess', version, ({ model, state }) => {
      if (Number(state.counters.round ?? 1) < Math.max(...turns)) fail(311, 'Chess turn reward is not reached');
      const fixed = tableRows(activity, 'FixedAward').filter(row => Number(row.version) === version);
      const awards = [];
      for (const turn of turns) {
        markClaimed(state, 'turnAwards', turn);
        const row = fixed.find(entry => Number(entry.turn) === turn);
        if (!row) fail(5, 'Chess turn award configuration is missing');
        awards.push(...pairs(row.turn_award));
      }
      const granted = grantResources(model, awards, tables);
      const value = { turn_got_award: Buffer.alloc(0), res_changes: res(granted.changes) };
      return packed(codec, 'pb_chess_turn_award_rsp', value, { value, turns, changes: granted.changes });
    });
  });

  add('chess', [C.chessTask], () => fail(5, 'ChessTable.Task has zero production rows'));
  add('chess', [C.chessChooseAward], () => fail(5, 'ChessTable.ChooseAward has zero production rows'));
  add('chess', [C.chessExchange], () => fail(5, 'ChessTable.Exchange and ExchangeGroup have zero production rows'));

  // Hundred-times bonus. The client supplies no amount, so free rolls are
  // bounded by HundredBonus.free_num and recharged rolls require the missing
  // payment integration. The three value slots are deterministic from Robot.money.
  function hundredBonusConfig() {
    const activity = activityTables('HundredBonusTable');
    const config = first(activityRows(activity, 'Const'));
    if (!config) fail(5, 'Hundred bonus configuration is missing');
    return { activity, config };
  }
  add('hundred_bonus', [C.hundredBonusRandom], () => {
    return tx('hundred_bonus', 1, ({ state }) => {
      const free = Number(state.counters.freeRolls ?? 0);
      state.counters.freeRolls = free + 1;
      const source = Math.floor(Math.max(0, Math.min(0.999999999, Number(engine.random()) || 0)) * 1000);
      state.selections.values = [source % 10, Math.floor(source / 10) % 10, Math.floor(source / 100) % 10];
      return { value: { values: state.selections.values }, data: Buffer.alloc(0) };
    });
  });
  add('hundred_bonus', [C.hundredBonusAward], request => {
    const { activity } = hundredBonusConfig();
    const tableTid = etfNumber(request, first(activityRows(activity, 'HundredBonus'))?.tid ?? 1);
    const config = activityRows(activity, 'HundredBonus').get(Number(tableTid));
    if (!config) fail(1, 'Hundred bonus table is not configured');
    return tx('hundred_bonus', 1, ({ model, state }) => {
      if (!Array.isArray(state.selections.values)) fail(311, 'Hundred bonus has not been randomized');
      markClaimed(state, 'awards', tableTid);
      const value = Number(state.selections.values.join(''));
      const amount = Math.max(1, Number(config.base_value) * (value % 11));
      const granted = grantResources(model, [[Number(config.bonus), amount]], tables);
      const valueObj = res(granted.changes);
      return packed(codec, 'pb_res_to_client', valueObj, { value: valueObj, tableTid, amount });
    });
  });
  add('hundred_bonus', [C.hundredBonusLog], request => {
    const { activity } = hundredBonusConfig();
    return tx('hundred_bonus', 1, ({ roleId, db }) => {
      const logs = db.prepare("SELECT payload_json FROM draw_activity_logs WHERE module='hundred_bonus' ORDER BY id DESC LIMIT 10").all()
        .map(row => JSON.parse(row.payload_json));
      const value = { log_list: logs.map(entry => ({ role_id: String(roleId), award_num: Number(entry.amount ?? 0) })) };
      return packed(codec, 'pb_hundred_bonus_log_back', value, { value });
    });
  });

  // Raffle achievement is driven by the shared draw_num counter. Commands that
  // feed that counter are outside this block, so an unreached tier fails closed.
  add('raffle_ticket', [C.raffleAchievement], request => {
    const activity = activityTables('RaffleTicketTable');
    const tid = etfNumber(request);
    const achievement = activityRows(activity, 'Achievement').get(intOf(tid, 'raffle achievement'));
    if (!achievement) fail(1, 'Raffle achievement is not configured');
    return tx('raffle_ticket', 1, ({ model, state }) => {
      if (Number(state.counters.draw_num ?? 0) < Number(achievement.condition)) fail(311, 'Raffle achievement is not reached');
      markClaimed(state, 'achievements', tid);
      const granted = grantResources(model, pairs(achievement.award), tables);
      const data = { award_state: Buffer.alloc(0), choose_tid: 0, draw_num: String(state.counters.draw_num ?? 0),
        award_phase_num: String(tid), data_version: 1 };
      return packed(codec, 'pb_raffle_ticket_phase_award_back', { raffle_ticket_data: data, res_change: res(granted.changes) }, { value: data, tid, changes: granted.changes });
    });
  });

  add('hero_blazon', [C.heroBlazonDraw], () => {
    fail(5, 'HeroBlazonDraw libs 3201-3204 resolve to empty DrawTable groups');
  });

  // Lottery activity uses LotteryAct.Lib directly. Its weight is authoritative;
  // the free count and draw item price are applied in the same transaction.
  function lotteryActConfig(request) {
    const activity = activityTables('LotteryActTable');
    const tid = etfNumber(request, first(activityRows(activity, 'LotteryAct'))?.tid ?? 1);
    const config = activityRows(activity, 'LotteryAct').get(intOf(tid, 'lottery activity'));
    if (!config) fail(1, 'Lottery activity is not configured');
    return { activity, config, version: Number(config.tid) };
  }
  add('lottery_act', [C.lotteryActDraw], request => {
    const { activity, config, version } = lotteryActConfig(request);
    return tx('lottery_act', version, ({ model, db, state, roleId, at }) => {
      const drawCount = Number(state.counters.total_draw_count ?? 0);
      const free = drawCount < Number(config.free_num ?? 0);
      const spent = free ? { changes: [] } : consumeResources(model, [[Number(config.draw_item), 1]], 301);
      const normal = (config.normal_lib ?? []).map(id => activityRows(activity, 'Lib').get(Number(id))).filter(Boolean);
      if (!normal.length) fail(5, 'Lottery activity has no normal awards');
      const picked = weightedPick(normal, row => row.weight ?? row.probability);
      const granted = grantResources(model, [[Number(picked.item), Number(picked.num)]], tables);
      state.counters.draw_count = Number(state.counters.draw_count ?? 0) + 1;
      state.counters.total_draw_count = drawCount + 1;
      state.selections.last = Number(picked.tid);
      engine.recordLog(db, roleId, 'lottery_act', version, 'draw', {
        libTid: picked.tid, item: Number(picked.item), num: Number(picked.num), free
      }, at);
      const value = { lib_list: [], res: res([...spent.changes, ...granted.changes]), hit_well_list: [], big_lib_list: [],
        hit_lib_tid_list: [String(picked.tid)], hit_big_lib_tid_list: [] };
      return packed(codec, 'pb_lottery_act_draw_back', value, { value, free, libTid: picked.tid, changes: value.res.changes });
    });
  });
  add('lottery_act', [C.lotteryActLog], request => {
    const { version } = lotteryActConfig(request);
    return tx('lottery_act', version, ({ db, roleId }) => {
      const logs = db.prepare("SELECT payload_json FROM draw_activity_logs WHERE role_id=? AND module='lottery_act' AND version=? ORDER BY id DESC LIMIT 20")
        .all(roleId, version).map(row => JSON.parse(row.payload_json));
      const logList = logs.map(entry => ({ lib_tid: String(entry.libTid), item_tid: String(entry.item), item_num: String(entry.num) }));
      return packed(codec, 'pb_lottery_act_server', { log_list: logList }, { value: { log_list: logList } });
    });
  });

  add('mystery_wish', [C.mysteryWishExchange], request => {
    const activity = activityTables('MysteryWishTable');
    const config = first(activityRows(activity, 'Const'));
    const itemTid = intOf(etfNumber(request), 'mystery wish item');
    const item = activityRows(activity, 'Item').get(itemTid);
    if (!config || !item) fail(1, 'Mystery wish item is not configured');
    return tx('mystery_wish', 1, ({ model, state }) => {
      markClaimed(state, 'exchange', itemTid);
      const spent = consumeResources(model, [[Number(config.cost_item), Number(config.cost_count)]], 301);
      const granted = grantResources(model, [[Number(item.item), Number(item.count)]], tables);
      const valueObj = res([...spent.changes, ...granted.changes]);
      return packed(codec, 'pb_res_to_client', valueObj, { value: valueObj, itemTid, changes: valueObj.changes });
    });
  });

  // Lottery ticket 93101 resolves a concrete Lottery.Item to DrawTable 3901.
  // That generated draw group is empty, so the request is refused rather than
  // issuing a fixed consolation prize.
  add('lottery', [C.lotteryUse], () => fail(5, 'Lottery draw group 3901 has no production awards in DrawTable'));
  add('lottery', [C.lotteryExpire], () => fail(5, 'Lottery expiry settlement requires authoritative period settlement state'));

  add('fruit_draw', [C.fruitDrawBig], request => {
    const activity = activityTables('FruitDrawActTable');
    const input = etfNumber(request);
    const config = activityRows(activity, 'Const').get(intOf(input, 'fruit activity')) ?? first(activityRows(activity, 'Const'));
    if (!config) fail(5, 'Fruit draw configuration is missing');
    const bigRows = tableRows(activity, 'BigCell');
    if (!bigRows.length) fail(5, 'Fruit draw big awards are missing');
    return tx('fruit_draw', Number(config.tid), ({ state }) => {
      const picked = bigRows.find(row => Number(row.tid) === input);
      if (!picked) fail(1, 'Fruit draw big award is not configured');
      state.selections.bigCell = Number(picked.tid);
      const value = { act_id: Number(config.tid), big_award: Number(picked.select_big_item), draw_log_list: [] };
      return packed(codec, 'pb_fruit_draw_big_award_back', value, { value, bigCell: picked.tid });
    });
  });
  add('fruit_draw', [C.fruitDraw], () => fail(5, 'FruitDraw probability 11409 is absent from DrawTable.LibWeight'));

  add('draw_wish', [C.chooseWish], request => {
    const input = engine.decode('pb_role_random_draw_item', request.bytes);
    const lib = intOf(input.draw_lib, 'draw wish lib');
    return tx('draw_wish', lib, ({ state }) => {
      state.selections.wish = Number(input.wish_tid);
      const value = { draw_list: [{ draw_lib: lib, wish_tid: String(input.wish_tid) }] };
      return packed(codec, 'pb_role_random_draw_info', value, { value, lib });
    });
  });

  function elvesActivity() {
    const activity = activityTables('ElvesActTable');
    const config = first(activityRows(activity, 'ElvesAct'));
    if (!config) fail(5, 'Elves activity configuration is missing');
    return { activity, config, version: Number(config.tid) };
  }
  add('elves_act', [C.elvesMain], request => {
    const { activity, config, version } = elvesActivity();
    const tid = intOf(etfNumber(request), 'main elves');
    const allowed = (config.elves ?? []).map(Number);
    if (!allowed.includes(tid)) fail(1, 'Main elves selection is not configured');
    return tx('elves_act', version, ({ state }) => {
      state.selections.mainElves = tid;
      return { value: { cur_elves_tid: String(tid) }, data: Buffer.alloc(0) };
    });
  });
  add('elves_act', [C.elvesFruitAct], request => {
    const { config, version } = elvesActivity();
    const tid = intOf(etfNumber(request), 'elves fruit activity');
    if (!(config.draw_act ?? []).map(Number).includes(tid)) fail(1, 'Elves fruit activity is not configured');
    return tx('elves_act', version, ({ state }) => {
      state.selections.fruitAct = tid;
      return { value: { cur_fruit_draw_act_tid: tid }, data: Buffer.alloc(0) };
    });
  });
  add('elves_act', [C.elvesDrawAward], request => {
    const input = engine.decode('pb_elves_act_draw_award_req', request.bytes);
    const activity = activityTables('ElvesActTable');
    const requested = (input.award_tid ?? []).map(Number);
    if (!requested.length) fail(1, 'Elves award list is empty');
    const version = Number(first(activityRows(activity, 'ElvesAct'))?.tid ?? 1);
    return tx('elves_act', version, ({ model, state }) => {
      const draws = Number(state.counters.draw_num ?? 0);
      const candidates = tableRows(activity, 'DrawAward')
        .filter(row => requested.includes(Number(row.tid)) && Number(row.draw_num) <= draws);
      if (candidates.length !== requested.length) fail(311, 'Elves draw award is not reached');
      for (const row of candidates) markClaimed(state, 'awards', row.tid);
      const granted = grantResources(model, candidates.flatMap(row => pairs(row.draw_award)), tables);
      const value = { res: res(granted.changes), draw_award_data: Buffer.alloc(0) };
      return packed(codec, 'pb_elves_act_draw_award', value, { value, awardTids: requested, changes: granted.changes });
    });
  });

  add('chess_revert', [C.chessRevertTurnAward], () => fail(
    5,
    'Chess revert turn awards require the missing ActActive-to-ActTurn progression mapping'
  ));
  add('chess_revert', [C.chessRevertSelectGift], request => {
    const input = engine.decode('pb_chess_revert_select_gift_req', request.bytes);
    const activity = activityTables('ChessRevertTable');
    const gift = activityRows(activity, 'Gift').get(Number(input.gift_tid));
    if (!gift) fail(1, 'Chess revert gift is not configured');
    const version = Number(gift.version);
    return tx('chess_revert', version, ({ state }) => {
      state.selections['gift:' + gift.tid] = (input.select_idx ?? []).map(Number);
      const value = { gift_tid: String(gift.tid), times: 1, select: {} };
      return packed(codec, 'pb_chess_revert_act_gift', value, { value, giftTid: gift.tid });
    });
  });
  add('chess_revert', [C.chessRevertNextTurn], request => {
    const input = engine.decode('pb_chess_revert_next_turn', request.bytes);
    const activity = activityTables('ChessRevertTable');
    const version = intOf(input.act_id, 'chess revert activity');
    const turnRows = tableRows(activity, 'ActTurn').filter(row => Number(row.version) === version);
    return tx('chess_revert', version, ({ state }) => {
      const next = Number(state.counters.turn ?? 0) + 1;
      if (next > turnRows.length) fail(311, 'Chess revert turn limit is reached');
      state.counters.turn = next;
      const data = { revert_num: Math.max(0, turnRows.length - next), turn_state: Buffer.alloc(0), daily_state: Buffer.alloc(0), recharge_state: Buffer.alloc(0), gifts: [] };
      return packed(codec, 'pb_chess_revert_init', { chess_revert: data, tile_swap: {} }, { value: data, turn: next });
    });
  });

  function puzzleConfig(requestVersion) {
    const activity = activityTables('ChildPuzzleActTable');
    const version = activityRows(activity, 'PuzzleVersion').get(Number(requestVersion)) ?? first(activityRows(activity, 'PuzzleVersion'));
    if (!version) fail(5, 'Child puzzle version is missing');
    return { activity, version, versionId: Number(version.tid) };
  }
  function puzzlePerson(state, version) {
    const turns = Array.isArray(state.selections.turns) ? state.selections.turns : [{ turn: 1, draw_puzzle_id: [], puzzle_award: [] }];
    const current = Number(state.counters.curTurn ?? 1);
    return {
      version: Number(version.tid), cur_turn: current, turn_list: turns,
      draw_times: Number(state.counters.draw_times ?? 0), pile_award: state.claims.pile ?? [],
      left_energy: Number(state.counters.leftEnergy ?? 0), task: [], select_award_index: Number(state.selections.selectAwardIndex ?? 0)
    };
  }
  add('child_puzzle', [C.puzzleDraw], request => {
    const input = engine.decode('pb_puzzle_draw_req', request.bytes);
    const { version, versionId } = puzzleConfig(input.version);
    if (input.buy_draw_item) fail(5, 'Child puzzle direct-purchase draw price is not configured for this version');
    if (!Number(version.draw_lib)) fail(5, 'Child puzzle draw library is not configured');
    return tx('child_puzzle', versionId, ({ model, state }) => {
      const spent = consumeResources(model, [[Number(version.draw_consume_id), Number(version.draw_consume_num)]], 301);
      const drawn = drawFromLib(Number(version.draw_lib), 1);
      const granted = grantResources(model, drawn.awards, tables);
      state.counters.draw_times = Number(state.counters.draw_times ?? 0) + 1;
      state.counters.curTurn ??= 1;
      state.selections.turns ??= [{ turn: 1, draw_puzzle_id: [], puzzle_award: [] }];
      state.selections.turns.find(row => Number(row.turn) === Number(state.counters.curTurn))?.draw_puzzle_id.push(drawn.awards[0][0]);
      const value = { res: res([...spent.changes, ...granted.changes]), puzzle_id: drawn.awards[0][0] };
      return packed(codec, 'pb_puzzle_draw_back', value, { value, libTid: drawn.libTid, changes: value.res.changes });
    });
  });
  add('child_puzzle', [C.puzzleChangeTurn], request => {
    const version = etfNumber(request, 1);
    const { version: config, versionId } = puzzleConfig(version);
    return tx('child_puzzle', versionId, ({ state }) => {
      const current = Number(state.counters.curTurn ?? 1);
      if (current >= Number(config.max_turn)) fail(311, 'Child puzzle turn limit is reached');
      state.counters.curTurn = current + 1;
      state.selections.turns ??= [];
      if (!state.selections.turns.some(row => Number(row.turn) === current + 1)) state.selections.turns.push({ turn: current + 1, draw_puzzle_id: [], puzzle_award: [] });
      const value = puzzlePerson(state, config);
      return packed(codec, 'pb_puzzle_person', value, { value });
    });
  });
  add('child_puzzle', [C.puzzleTaskAward], request => {
    const input = engine.decode('pb_puzzle_task_award_req', request.bytes);
    const activity = activityTables('ChildPuzzleActTable');
    const ids = (input.task_tid_list ?? []).map(Number);
    if (!ids.length) fail(1, 'Child puzzle task list is empty');
    return tx('child_puzzle', 1, ({ model, state }) => {
      const progress = counterObject(state, 'taskProgress');
      const taskRows = ids.map(tid => activityRows(activity, 'PuzzleTask').get(tid));
      if (taskRows.some(row => !row || Number(progress[String(row.tid)] ?? 0) < Number(row.target_count))) fail(311, 'Child puzzle task is not reached');
      for (const row of taskRows) markClaimed(state, 'tasks', row.tid);
      const granted = grantResources(model, taskRows.flatMap(row => pairs(row.award)), tables);
      const version = first(activityRows(activity, 'PuzzleVersion')) ?? {};
      const value = { res: res(granted.changes), person: puzzlePerson(state, version) };
      return packed(codec, 'pb_puzzle_task_award_rsp', value, { value, ids });
    });
  });
  add('child_puzzle', [C.puzzleSelectAward], request => {
    const versionId = 1;
    const { version } = puzzleConfig(versionId);
    const selected = intOf(etfNumber(request), 'puzzle selected award', { min: 0 });
    return tx('child_puzzle', versionId, ({ state }) => {
      state.selections.selectAwardIndex = selected;
      const value = puzzlePerson(state, version);
      return packed(codec, 'pb_puzzle_person', value, { value });
    });
  });
  add('child_puzzle', [C.puzzleAward], () => fail(5, 'Child puzzle line/column completion cannot be derived from the recovered table dump'));

  function hoardConfig(requestVersion) {
    const activity = activityTables('HoardWheelActTable');
    const versionId = intOf(requestVersion ?? first(activityRows(activity, 'Pool'))?.version ?? 1, 'hoard wheel version');
    return { activity, versionId };
  }
  add('hoard_wheel', [C.hoardSetPool], request => {
    const input = engine.decode('pb_hoard_wheel_draw_change_req', request.bytes);
    const { activity, versionId } = hoardConfig(input.version);
    const pool = activityRows(activity, 'Pool').get(Number(input.pool_id));
    if (!pool || !(pool.choose_id ?? []).map(Number).includes(Number(input.prize_id))) fail(1, 'Hoard wheel pool selection is not configured');
    return tx('hoard_wheel', versionId, ({ state }) => {
      state.selections.poolId = Number(pool.tid); state.selections.prizeId = Number(input.prize_id);
      const value = { pool_id: Number(pool.tid), prize_id: Number(input.prize_id) };
      return packed(codec, 'pb_hoard_wheel_pool', value, { value });
    });
  });
  add('hoard_wheel', [C.hoardTask], request => {
    const input = engine.decode('pb_hoard_wheel_task_req', request.bytes);
    const { activity, versionId } = hoardConfig(input.activity_id);
    const task = activityRows(activity, 'Task').get(Number(input.task_id));
    if (!task) fail(1, 'Hoard wheel task is not configured');
    return tx('hoard_wheel', Number(task.version), ({ model, state }) => {
      const progress = counterObject(state, 'taskProgress');
      if (Number(progress[String(task.tid)] ?? 0) < Number(task.task_count)) fail(311, 'Hoard wheel task is not reached');
      markClaimed(state, 'tasks', task.tid);
      const granted = grantResources(model, pairs(task.award), tables);
      const value = res(granted.changes);
      return packed(codec, 'pb_res_to_client', value, { value, taskTid: task.tid });
    });
  });
  add('hoard_wheel', [C.hoardPile], request => {
    const input = engine.decode('pb_hoard_wheel_pile_req', request.bytes);
    const { activity, versionId } = hoardConfig(input.activity_id);
    const ids = (input.pile_id ?? []).map(Number);
    return tx('hoard_wheel', versionId, ({ model, state }) => {
      const draws = Number(state.counters.pile_draw_times ?? 0);
      const claims = ids.map(id => activityRows(activity, 'Pile').get(id));
      if (!claims.length || claims.some(row => !row || Number(row.version) !== versionId || Number(row.draw_times) > draws)) fail(311, 'Hoard wheel pile reward is not reached');
      for (const row of claims) markClaimed(state, 'piles', row.tid);
      const granted = grantResources(model, claims.flatMap(row => pairs(row.award_list)), tables);
      const person = { version: versionId, pool_id: Number(state.selections.poolId ?? 0), pile_draw_times: draws,
        pool_list: Number(state.selections.poolId) ? [{ pool_id: Number(state.selections.poolId), prize_id: Number(state.selections.prizeId ?? 0) }] : [],
        reset_times: 0, daily_award_list: [], period_award_list: [], reset_award_list: [], ref_daily_time: 0, record: {} };
      const value = { res: res(granted.changes), person };
      return packed(codec, 'pb_hoard_wheel_pile_back', value, { value, ids });
    });
  });

  // Pin-ball and pipe-connect activity state must be advanced by minigame
  // sessions. The recovered client assets contain their shop/protocol shape,
  // but not an authoritative server session or task-progress feed, so claims
  // cannot be priced or validated from a request alone.
  add('pin_ball', [C.pinBallAward], () => {
    fail(5, 'PinBall achievements require an authoritative pin-ball session and task-progress feed');
  });
  add('fantasy_equip_act', [C.fantasyEquipReset], () => {
    fail(5, 'Fantasy equipment pipe reset requires an authoritative minigame session');
  });
  add('fantasy_equip_act', [C.fantasyEquipPlay], () => {
    fail(5, 'Fantasy equipment pipe play requires authoritative board generation and settlement rules');
  });

  // Thousand draw keeps the awards until 104502 claims them. The request has
  // only one element type; the corresponding table column selects its draw
  // library and the next tower-layer row advances the round.
  function thousandConfig(type) {
    const activity = activityTables('ThousandDrawTable');
    const rows = tableRows(activity, 'thousandDraw')
      .filter(row => Math.floor(Number(row.tid) / 1000) === type)
      .sort((left, right) => Number(left.tower_layer) - Number(right.tower_layer));
    if (!rows.length) fail(1, 'Thousand draw element type is not configured');
    return { activity, rows };
  }
  function thousandInfo(state, type) {
    const pending = counterObject(state, 'pending');
    const awards = (Array.isArray(pending[String(type)]) ? pending[String(type)] : []).map(entry => ({
      key: Number(entry[0]), value: Number(entry[1])
    }));
    return { round: Number(state.counters.round ?? 1), type_info_list: awards.length ? [{ type, award_list: awards }] : [] };
  }
  function thousandDraw(activity, lib) {
    const group = activityRows(activity, 'Group').get(Number(lib));
    const ranges = pairs(group?.lib_range);
    if (!ranges.length) fail(5, `Thousand draw library ${lib} is not configured`);
    const row = weightedPick(ranges, entry => entry[0]);
    const itemTid = Number(row[1]);
    const items = tableRows(activity, 'Item');
    const item = activityRows(activity, 'Item').get(itemTid) ?? items.find(entry => Number(entry.res) === itemTid);
    const award = item ? [Number(item.res), Number(item.num) * Number(row[2] || 1)] : [itemTid, Number(row[2])];
    if (!Number.isSafeInteger(award[0]) || award[0] <= 0 || !Number.isSafeInteger(award[1]) || award[1] <= 0) {
      fail(5, `Thousand draw library ${lib} contains an invalid award`);
    }
    return { awards: [award], groupId: Number(lib) };
  }
  add('thousand_draw', [C.thousandDraw], request => {
    const input = engine.decode('pb_request_thousand_draw', request.bytes);
    const type = intOf(input.type, 'thousand draw type', { max: 3 });
    const { rows } = thousandConfig(type);
    return tx('thousand_draw', type, ({ state }) => {
      const round = Number(state.counters.round ?? 1);
      const row = rows[(round - 1) % rows.length];
      const lib = Number(type === 1 ? row.one_draw_lib : type === 2 ? row.two_draw_lib : row.three_draw_lib);
      if (!lib) fail(5, `Thousand draw type ${type} has no draw library`);
      const drawn = thousandDraw(activityTables('ThousandDrawTable'), lib);
      const pending = counterObject(state, 'pending');
      pending[String(type)] = [...(Array.isArray(pending[String(type)]) ? pending[String(type)] : []), ...drawn.awards];
      if (Number(state.counters.drawTimes ?? 0) + 1 >= Number(row.total_times)) {
        state.counters.drawTimes = 0;
        state.counters.round = round + 1;
      } else {
        state.counters.drawTimes = Number(state.counters.drawTimes ?? 0) + 1;
      }
      const roleInfo = thousandInfo(state, type);
      return packed(codec, 'pb_response_thousand_draw', { role_info: roleInfo }, {
        value: roleInfo, libTid: drawn.libTid, awards: drawn.awards
      });
    });
  });
  add('thousand_draw', [C.thousandAward], request => {
    const input = engine.decode('pb_request_thousand_award', request.bytes);
    const type = intOf(input.type, 'thousand draw award type', { max: 3 });
    thousandConfig(type);
    return tx('thousand_draw', type, ({ model, state }) => {
      const pending = counterObject(state, 'pending');
      const awards = pairs(pending[String(type)]);
      if (!awards.length) fail(311, 'Thousand draw has no award to claim');
      const granted = grantResources(model, awards, tables);
      delete pending[String(type)];
      const roleInfo = thousandInfo(state, type);
      const value = { role_info: roleInfo, res: res(granted.changes) };
      return packed(codec, 'pb_response_thousand_award', value, {
        value, type, changes: granted.changes
      });
    });
  });

  // Prayer activity: the selected Award row is granted whenever a tier's
  // progress reaches AwardIndex.progress_val. Critical progress is bounded by
  // critical_val and selected using critical_ration (parts per ten thousand).
  function prayConfig(request) {
    const input = engine.decode('pb_pray_act_select_award_req', request.bytes);
    const actTid = intOf(input.act_tid, 'pray activity');
    const activity = activityTables('PrayActTable');
    const act = activityRows(activity, 'PrayAct').get(actTid);
    if (!act) fail(1, 'Pray activity is not configured');
    const indexes = tableRows(activity, 'AwardIndex')
      .filter(row => Number(row.version) === actTid)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
    if (!indexes.length) fail(5, 'Pray activity award indexes are missing');
    return { activity, input, act, actTid, indexes };
  }
  function prayInfo(state, act, indexes) {
    const drawCounts = counterObject(state, 'drawCounts');
    const progress = counterObject(state, 'progress');
    const history = counterObject(state, 'history');
    const selections = state.selections.awards ?? {};
    return {
      act_tid: act.tid,
      pray_list: indexes.map(index => ({
        select_award_tid: Number(selections[String(index.tid)] ?? 0),
        pray_index_tid: Number(index.tid),
        draw_cnt: Number(drawCounts[String(index.tid)] ?? 0),
        progress_value: Number(progress[String(index.tid)] ?? 0),
        pray_award_info_list: selections[String(index.tid)] ? [{
          select_award_tid: Number(selections[String(index.tid)]),
          history_cnt: Number(history[String(selections[String(index.tid)])] ?? 0)
        }] : []
      }))
    };
  }
  add('pray_act', [C.praySelect], request => {
    const { activity, input, actTid, indexes } = prayConfig(request);
    const choices = Array.isArray(input.index_award_list) ? input.index_award_list : [];
    if (!choices.length) fail(1, 'Pray selected award list is empty');
    const selected = {};
    for (const choice of choices) {
      const indexTid = intOf(choice.pray_index_tid, 'pray index');
      const awardTid = intOf(choice.award_tid, 'pray award');
      if (!indexes.some(index => Number(index.tid) === indexTid)) fail(1, 'Pray index is not configured for this activity');
      const award = activityRows(activity, 'Award').get(awardTid);
      if (!award || Number(award.pray_index) !== indexTid) fail(1, 'Pray award does not belong to the selected index');
      selected[String(indexTid)] = awardTid;
    }
    return tx('pray_act', actTid, ({ state, at, db, roleId }) => {
      state.selections.awards = { ...(state.selections.awards ?? {}), ...selected };
      engine.recordLog(db, roleId, 'pray_act', actTid, 'select', selected, at);
      const value = {};
      return packed(codec, 'pb_pray_act_select_award_rsp', value, { value, actTid, selected });
    });
  });
  add('pray_act', [C.prayDraw], request => {
    const drawInput = engine.decode('pb_pray_act_draw_award_req', request.bytes);
    const actTid = intOf(drawInput.act_tid, 'pray activity');
    const activity = activityTables('PrayActTable');
    const act = activityRows(activity, 'PrayAct').get(actTid);
    if (!act) fail(1, 'Pray activity is not configured');
    const indexes = tableRows(activity, 'AwardIndex')
      .filter(row => Number(row.version) === actTid)
      .sort((left, right) => Number(left.tid) - Number(right.tid));
    if (!indexes.length) fail(5, 'Pray activity award indexes are missing');
    const count = intOf(drawInput.cnt, 'pray draw count', { max: 100 });
    return tx('pray_act', actTid, ({ model, state }) => {
      const selections = state.selections.awards ?? {};
      if (!indexes.some(index => selections[String(index.tid)])) fail(311, 'Pray selected award is not configured');
      const spent = consumeResources(model, [[Number(act.consume_tid), Number(act.consume_cnt) * count]], 301);
      const drawCounts = counterObject(state, 'drawCounts');
      const progressMap = counterObject(state, 'progress');
      const history = counterObject(state, 'history');
      const rewards = [], criticalList = [];
      for (let offset = 0; offset < count; offset++) {
        const index = indexes[0];
        const indexTid = Number(index.tid);
        const selectedTid = Number(selections[String(indexTid)]);
        const award = activityRows(activity, 'Award').get(selectedTid);
        if (!award) fail(5, 'Pray selected award is missing');
        const previous = Number(progressMap[String(indexTid)] ?? 0);
        const critical = Number(engine.random()) * 10000 < Number(index.critical_ration);
        const criticalMin = Number(index.critical_val?.[0] ?? index.normal_val);
        const criticalMax = Number(index.critical_val?.[1] ?? criticalMin);
        const gain = critical
          ? criticalMin + Math.floor(Math.max(0, criticalMax - criticalMin + 1) * Number(engine.random()))
          : Number(index.normal_val);
        const threshold = Number(index.progress_val);
        const total = previous + Math.max(1, gain);
        const reached = total >= threshold;
        progressMap[String(indexTid)] = reached ? total - threshold : total;
        drawCounts[String(indexTid)] = Number(drawCounts[String(indexTid)] ?? 0) + 1;
        if (reached) {
          rewards.push(...pairs(award.award));
          history[String(selectedTid)] = Number(history[String(selectedTid)] ?? 0) + 1;
        }
        criticalList.push({
          draw_cnt: Number(drawCounts[String(indexTid)]),
          draw_info: [{ pray_index: indexTid, selected_tid: selectedTid, is_direct: false,
            is_award: reached, is_critical: critical, progress_val: gain }]
        });
      }
      const granted = rewards.length ? grantResources(model, rewards, tables) : { changes: [] };
      const value = {
        pray_act_info: prayInfo(state, act, indexes),
        res: res([...spent.changes, ...granted.changes]),
        draw_critical_list: criticalList
      };
      return packed(codec, 'pb_pray_act_draw_award_rsp', value, { value, actTid, changes: value.res.changes });
    });
  });

  // Flop cards reserve the table-selected award on the reveal. 109102 applies
  // all reservations atomically; 109103 claims cumulative tiers by cond_val.
  function flopConfig(request) {
    const input = engine.decode('pb_flop_card_act_flop_req', request.bytes);
    const activityId = intOf(input.activity_id, 'flop card activity');
    const activity = activityTables('FlopCardActTable');
    const version = activityRows(activity, 'Ver').get(activityId);
    if (!version) fail(1, 'Flop card activity is not configured');
    return { activity, version, activityId, input };
  }
  function flopInfo(activity, state, activityId) {
    const cards = Array.isArray(state.selections.cards) ? state.selections.cards.map(Number) : [];
    const version = activityRows(activity, 'Ver').get(activityId);
    return {
      act_tid: activityId, card_list: cards, flop_count: Number(state.counters.flopCount ?? 0),
      total_count: Number(state.counters.totalCount ?? 0), reward_bits: Buffer.alloc(0),
      round: Number(state.counters.round ?? 1), round_total: Number(state.counters.roundTotal ?? 0),
      round_flop_count: Number(state.counters.roundFlopCount ?? 0),
      limit_flop_card: Number(version?.limit_flop_card ?? cards.length)
    };
  }
  add('flop_card', [C.flopDraw], request => {
    const { activity, version, activityId, input } = flopConfig(request);
    const flopType = intOf(input.flop_type, 'flop card type', { max: pairListFromRaw(version.use_item).length || 3 });
    const cost = pairs(version.use_item).slice(flopType - 1, flopType)[0];
    if (!cost) fail(5, 'Flop card price is not configured for this type');
    return tx('flop_card', activityId, ({ model, state }) => {
      const spent = consumeResources(model, [[cost[0], cost[1]]], 301);
      const nextCount = Number(state.counters.roundFlopCount ?? 0) + 1;
      const rank = tableRows(activity, 'CardHandRank')
        .filter(row => Number(row.version) === activityId && Number(row.same_card_count) === nextCount
          && (row.card_type ?? []).map(Number).includes(flopType))
        .sort((left, right) => Number(left.sort) - Number(right.sort))
        .at(-1);
      if (!rank) fail(5, `Flop card rank for count ${nextCount} is not configured`);
      const group = activityRows(activity, 'AwardGroup').get(Number(rank.award_group));
      const awards = pairs(group?.award);
      const weights = Array.isArray(group?.weight) ? group.weight.map(Number) : [];
      if (!awards.length || awards.length !== weights.length) fail(5, 'Flop card award group is not configured');
      const selected = weightedPick(awards.map((award, index) => ({ award, index })), entry => weights[entry.index]);
      const award = selected.award;
      if (!award) fail(5, 'Flop card award selection failed');
      const pending = Array.isArray(state.selections.pending) ? state.selections.pending : [];
      pending.push([award[0], award[1]]);
      state.selections.pending = pending;
      state.selections.cards = [...(Array.isArray(state.selections.cards) ? state.selections.cards : []), Number(rank.tid)];
      state.counters.flopCount = Number(state.counters.flopCount ?? 0) + 1;
      state.counters.roundFlopCount = nextCount;
      state.counters.totalCount = Number(state.counters.totalCount ?? 0) + 1;
      if (rank.is_jackpot) {
        state.counters.round = Number(state.counters.round ?? 1) + 1;
        state.counters.roundTotal = Number(state.counters.roundTotal ?? 0) + nextCount;
        state.counters.roundFlopCount = 0;
        state.selections.cards = [];
      }
      const actInfo = flopInfo(activity, state, activityId);
      const value = { act_info: actInfo, res: res(spent.changes) };
      return packed(codec, 'pb_flop_card_act_rsp', value, { value, activityId, rankTid: rank.tid, awardTid: award[0] });
    });
  });
  add('flop_card', [C.flopClaim], request => {
    const input = engine.decode('pb_flop_card_act_get_reward_req', request.bytes);
    const activityId = intOf(input.activity_id, 'flop card activity');
    const activity = activityTables('FlopCardActTable');
    if (!activityRows(activity, 'Ver').has(activityId)) fail(1, 'Flop card activity is not configured');
    return tx('flop_card', activityId, ({ model, state }) => {
      const awards = pairs(state.selections.pending);
      if (!awards.length) fail(311, 'Flop card has no pending award');
      const granted = grantResources(model, awards, tables);
      state.selections.pending = [];
      const value = { act_info: flopInfo(activity, state, activityId), res: res(granted.changes) };
      return packed(codec, 'pb_flop_card_act_rsp', value, { value, activityId, changes: granted.changes });
    });
  });
  add('flop_card', [C.flopTotalClaim], request => {
    const input = engine.decode('pb_flop_card_act_get_total_reward_req', request.bytes);
    const activityId = intOf(input.activity_id, 'flop card activity');
    const activity = activityTables('FlopCardActTable');
    const version = activityRows(activity, 'Ver').get(activityId);
    if (!version) fail(1, 'Flop card activity is not configured');
    const ids = (input.reward_tid_list ?? []).map(Number);
    if (!ids.length) fail(1, 'Flop cumulative award list is empty');
    return tx('flop_card', activityId, ({ model, state }) => {
      const rows = ids.map(tid => activityRows(activity, 'AccAward').get(tid));
      if (rows.some(row => !row || Number(row.lib) !== Number(version.acc_award_lib))) fail(1, 'Flop cumulative award is not configured for this activity');
      if (rows.some(row => Number(row.cond_val) > Number(state.counters.totalCount ?? 0))) fail(311, 'Flop cumulative award is not reached');
      for (const row of rows) markClaimed(state, 'totalAwards', row.tid);
      const granted = grantResources(model, rows.flatMap(row => pairs(row.award)), tables);
      const value = { act_info: flopInfo(activity, state, activityId), res: res(granted.changes) };
      return packed(codec, 'pb_flop_card_act_rsp', value, { value, activityId, ids, changes: granted.changes });
    });
  });

  function pairListFromRaw(value) {
    return pairs(value);
  }

  // Flip cards and ticket draws are kept as explicit refusals until the
  // corresponding board/settlement state exists. Returning a valid empty
  // response here would let the APK consume an unearned turn or rank reward.
  add('flip_card', [C.flipCardTurn], request => {
    const input = engine.decode('pb_flip_card_turn_req', request.bytes);
    const activity = activityTables('FlipCardTable');
    const tid = intOf(input.tid, 'flip card activity');
    const version = activityRows(activity, 'Version').get(tid);
    if (!version) fail(1, 'Flip card activity is not configured');
    return tx('flip_card', tid, ({ state }) => {
      state.counters.turns = Number(state.counters.turns ?? 0) + 1;
      const value = { tid, turns: state.counters.turns, award: [] };
      return packed(codec, 'pb_flip_card_date', value, { value, tid, turns: state.counters.turns });
    });
  });
  add('flip_card', [C.flipCardDraw], () => fail(5, 'FlipCardTable has no board award rows; draw settlement is not authoritative'));
  add('ticket_draw', [C.ticketDrawAward], () => fail(5, 'Ticket draw rank settlement requires a server-wide draw result'));
  add('ticket_draw', [C.ticketDrawHistory], () => fail(5, 'Ticket draw history requires a server-wide draw result'));

  add('cashback_draw', [C.cashbackDraw], () => fail(5, 'Cashback round cost has no authoritative recharge currency'));
  add('cashback_draw', [C.cashbackGetTimes], () => fail(5, 'Cashback draw times require the authoritative recharge ledger'));
  add('cashback_draw', [C.cashbackServerAward], () => fail(5, 'Cashback server award progress requires an authoritative server-wide counter'));
  add('cashback_draw', [C.cashbackServerProgress], () => fail(5, 'Cashback server progress requires an authoritative server-wide counter'));

  // Turntable activity. Ver.use_item is the spin price, Award.weight is the
  // table pool and min_num gates the accumulated-spin awards.
  add('turntable', [C.turntableGo], () => {
    const activity = activityTables('TurntableActTable');
    const version = first(activityRows(activity, 'Ver'));
    if (!version) fail(5, 'Turntable activity version is not configured');
    const cost = pairs(version.use_item);
    if (!cost.length) fail(5, 'Turntable activity price is not configured');
    const awards = tableRows(activity, 'Award')
      .filter(row => Number(row.version) === Number(version.tid));
    if (!awards.length) fail(5, 'Turntable activity awards are not configured');
    return tx('turntable', Number(version.tid), ({ model, db, state, at, roleId }) => {
      const spent = consumeResources(model, cost, 301);
      const spins = Number(state.counters.spins ?? 0) + 1;
      const available = awards.filter(row => Number(row.min_num) <= spins);
      const picked = weightedPick(available.length ? available : awards, row => row.weight);
      const granted = grantResources(model, pairs(picked.award), tables);
      state.counters.spins = spins;
      state.counters.noBig = Number(state.counters.noBig ?? 0) + (picked.is_big ? 0 : 1);
      engine.recordLog(db, roleId, 'turntable', version.tid, 'go', { drawTid: picked.tid, spin: spins }, at);
      const actData = { version: version.tid, total_num: spins, no_big_num: state.counters.noBig,
        spins: String(spins), draw_tid: String(picked.tid) };
      const value = { res: res([...spent.changes, ...granted.changes]), draw_tid: String(picked.tid), act_data: actData };
      return packed(codec, 'pb_turntable_act_go_back', value, { value, drawTid: picked.tid, spin: spins, changes: value.res.changes });
    });
  });

  return { handlers, modules };
}
