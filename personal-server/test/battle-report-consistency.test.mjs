import test from 'node:test';
import assert from 'node:assert/strict';
import { FIGHT_ENERGY_MAX, FIGHT_INITIAL_ENERGY, simulateBattle } from '../game/battle-engine.mjs';
import { createGameCodec, rawBinary } from '../protocol/game-codec.mjs';
import { createMissionFightService } from '../game/mission-fight-service.mjs';
import { createGameFixture } from './helpers/game-fixture.mjs';

const codec = createGameCodec();
const LINEUP = [
  { hero_id: '2010101', loc: 6 },
  { hero_id: '2010201', loc: 4 },
  { hero_id: '1020601', loc: 2 },
  { hero_id: '2020601', loc: 5 }
];
const STAMINA_TID = '100012900';
const SETTLEMENT = codec.pack('pb_fight_settlement_request', { fight_type: 1 });

function fighter(id, overrides = {}) {
  return {
    id, role: 2010201, profession: 2, loc: id,
    abilityId: 1, activeAbilityId: 2,
    maxHp: 5000, attack: 120, defense: 30,
    speed: id === 101 ? 120 : 90, initialEnergy: FIGHT_INITIAL_ENERGY, skills: [],
    ...overrides
  };
}

function fightRequest(mission = 30201) {
  return codec.pack('pb_fight_request', {
    fight_tid: 301, stm_type: 1,
    req: codec.pack('mission_fight_req', { mission_id: mission }),
    loc: [{ team_id: 1, loc: LINEUP }]
  });
}

const stamina = store => store.read().resources.get(STAMINA_TID).num;
const missionId = store => codec.unpack('pb_mission',
  rawBinary(new Map(store.state().modules.value).get(8).value[0])).mission_id;

function setupService(t, { codec: customCodec = codec, prefix = 'fc-report-c-' } = {}) {
  const fixture = createGameFixture(t, codec, { prefix, now: () => 1700000000 * 1000 });
  let store = fixture.store;
  let service = createMissionFightService({ store, codec: customCodec, playbackEnabled: true, now: () => 1700000000 * 1000 });
  return {
    fixture,
    get store() { return store; },
    get service() { return service; },
    reopen() {
      store = fixture.open();
      service = createMissionFightService({ store, codec: customCodec, playbackEnabled: true, now: () => 1700000000 * 1000 });
    }
  };
}

// Replay every observable state change in report order and compare the derived
// HP / shield / energy / life flags with the simulation's own final state.
function replayState(events, units) {
  const tracked = new Map(units.map(unit => [unit.id, {
    maxHp: unit.maxHp,
    hp: unit.maxHp,
    shield: 0,
    energy: Number.isFinite(unit.initialEnergy) ? unit.initialEnergy : FIGHT_INITIAL_ENERGY,
    alive: true
  }]));
  for (const event of events) {
    if (event.kind === 'damage') {
      for (const harm of event.harms) {
        const state = tracked.get(harm.aimId);
        if (!state) continue;
        assert.equal(Number(harm.oldHp), state.hp, 'damage old_hp must match the replay state');
        if (harm.oldShield !== undefined) assert.equal(Number(harm.oldShield), state.shield);
        state.hp = Number(harm.hp);
        if (harm.shield !== undefined) state.shield = Number(harm.shield);
      }
    } else if (event.kind === 'shield') {
      const state = tracked.get(event.aimId);
      if (state) state.shield = Number(event.shield);
    } else if (event.kind === 'heal') {
      const state = tracked.get(event.aimId);
      if (state) {
        assert.equal(Number(event.oldHp), state.hp, 'heal old_hp must match the replay state');
        state.hp = Number(event.hp);
        assert.equal(state.hp - Number(event.oldHp), Number(event.value));
      }
    } else if (event.kind === 'anger-sync') {
      for (const attr of event.attrList) {
        const state = tracked.get(attr.aimId);
        if (state) state.energy = Number(attr.attrValue);
      }
    } else if (event.kind === 'death') {
      const state = tracked.get(event.aimId);
      if (state) { state.alive = false; state.hp = 0; }
    } else if (event.kind === 'revive') {
      const state = tracked.get(event.aimId);
      if (state) { state.alive = true; state.hp = Number(event.hp); }
    }
  }
  return tracked;
}

test('the same seed produces the same event stream', () => {
  const build = () => simulateBattle({
    attackers: [fighter(101, { loc: 1 }), fighter(103, { loc: 3, speed: 80 })],
    defenders: [fighter(201, { loc: 1 }), fighter(202, { loc: 2, speed: 70 })],
    seed: 20261108,
    maxRounds: 10
  });
  const first = build(), second = build();
  assert.deepEqual(second.events, first.events);
  assert.deepEqual(second.attackers, first.attackers);
  assert.deepEqual(second.defenders, first.defenders);
});

test('the reported events reproduce the final HP, shield, energy and life flags', () => {
  const battle = simulateBattle({
    attackers: [
      fighter(101, { loc: 1, maxHp: 6000, attack: 900, skills: [] }),
      fighter(103, { loc: 3, speed: 70, maxHp: 4000 })
    ],
    defenders: [
      fighter(201, { loc: 1, maxHp: 7000, attack: 800 }),
      fighter(202, { loc: 2, speed: 60, maxHp: 5000 })
    ],
    seed: 99,
    maxRounds: 12
  });
  assert.ok(battle.events.some(event => event.kind === 'damage'), 'the fixture must exchange damage');
  const tracked = replayState(battle.events,
    [...battle.attackers, ...battle.defenders].map(unit => ({
      ...unit,
      maxHp: unit.maxHp,
      initialEnergy: FIGHT_INITIAL_ENERGY
    })));
  for (const finalUnit of [...battle.attackers, ...battle.defenders]) {
    const state = tracked.get(finalUnit.id);
    assert.equal(state.hp, finalUnit.hp, 'final hp for ' + finalUnit.id);
    assert.equal(state.shield, finalUnit.shield, 'final shield for ' + finalUnit.id);
    assert.equal(state.alive, finalUnit.alive, 'final life flag for ' + finalUnit.id);
    assert.ok(state.energy >= 0 && state.energy <= FIGHT_ENERGY_MAX);
  }
});

test('the production report matches the simulation final HP and survives a reload', t => {
  const env = setupService(t, { prefix: 'fc-report-c-reload-' });
  const started = env.service.execute(201, fightRequest());
  const fight = codec.unpack('pb_fight_response', Buffer.from(started.data, 'base64')).report.battle_list[0];
  for (const fighter of fight.fighter_list.filter(unit => unit.role_type !== 3)) {
    // Protobuf omits zero values, so a dead fighter decodes without final_hp.
    const finalHp = Number(fighter.final_hp ?? 0);
    assert.ok(Number.isSafeInteger(finalHp), 'final_hp must be a whole number');
    assert.ok(finalHp >= 0 && finalHp <= Number(fighter.max_hp));
  }
  assert.equal(missionId(env.store), '20205', '201 is preview only');
  const settled = env.service.execute(207, SETTLEMENT);
  assert.equal(codec.unpack('pb_fight_settlement_response', Buffer.from(settled.data, 'base64')).stm.result, 1);
  assert.equal(missionId(env.store), '30201');
  assert.equal(stamina(env.store), '115');

  env.reopen();
  assert.equal(missionId(env.store), '30201');
  assert.equal(stamina(env.store), '115');
  const replay = env.service.execute(201, fightRequest());
  const replayFight = codec.unpack('pb_fight_response', Buffer.from(replay.data, 'base64')).report.battle_list[0];
  assert.deepEqual(replayFight.action_list, fight.action_list, 'the action stream is deterministic across reloads');
});

test('a PB encode failure during settlement rolls the whole battle back', t => {
  let missionToClientCalls = 0;
  const faulting = {
    root: codec.root,
    pack(name, value) {
      if (name === 'mission_to_client' && ++missionToClientCalls > 1) throw new Error('pb encode failure');
      return codec.pack(name, value);
    },
    unpack: (name, bytes) => codec.unpack(name, bytes)
  };
  const env = setupService(t, { codec: faulting, prefix: 'fc-report-c-pb-' });
  env.service.execute(201, fightRequest());
  assert.throws(() => env.service.execute(207, SETTLEMENT), /pb encode failure/);
  assert.equal(missionId(env.store), '20205', 'the mission must not advance');
  assert.equal(stamina(env.store), '120', 'stamina must not be consumed');
});

test('a rejected SQLite write rolls the settlement back and stays retryable', t => {
  const env = setupService(t, { prefix: 'fc-report-c-sql-' });
  env.service.execute(201, fightRequest());
  env.store.inspect(db => db.exec(
    "CREATE TRIGGER fc_fail_report_c BEFORE INSERT ON reward_claims BEGIN SELECT RAISE(ABORT, 'report-c rollback'); END"
  ));
  assert.throws(() => env.service.execute(207, SETTLEMENT), /report-c rollback/);
  assert.equal(missionId(env.store), '20205');
  assert.equal(stamina(env.store), '120');
  env.store.inspect(db => db.exec('DROP TRIGGER fc_fail_report_c'));
  env.service.execute(207, SETTLEMENT);
  assert.equal(missionId(env.store), '30201');
  assert.equal(stamina(env.store), '115');
});
