// Local policy tables for the E2 social-cooperation block.
//
// Evidence boundary: every request/response schema in this block comes from the
// shipped protobuf descriptors (assets/protobuf/guild_*.proto.bin,
// slg_map.net.proto.bin, channel_entry_db.proto.bin) and every command number,
// name and encoding comes from the static interface catalog. The client tables
// that would pin the original boss HP ladders, damage-milestone rewards, claim
// limits, prices and reset windows (GuildBossTable, GuildJointTable,
// GuildGVGTable, GuildNationTable, GuildBargainTable, GuildExpeditionTable,
// GuildHuntTable, GuildAuctionTable) are not part of that recovered set, so the
// numbers in this file are this server's explicit policy. Item tids are real
// rows of ItemTable (101500 diamond, 3002 essence card) so every grant goes
// through the production resource handlers.

const DIAMOND = 101500;
const ESSENCE = 3002;

function awards(pairs) {
  return pairs.map(([tid, count]) => [Number(tid), Number(count)]);
}

export function readGuildCoopTables() {
  return {
    boss: {
      stages: [
        { tid: 1, maxHp: '300000' },
        { tid: 2, maxHp: '900000' },
        { tid: 3, maxHp: '2400000' }
      ],
      skillPercent: 6,
      skillCooldown: 60,
      attackCooldown: 10,
      damageAwards: [
        { idx: 1, damage: '4000', items: awards([[DIAMOND, 20]]) },
        { idx: 2, damage: '12000', items: awards([[DIAMOND, 40]]) },
        { idx: 3, damage: '30000', items: awards([[DIAMOND, 80], [ESSENCE, 1]]) }
      ],
      skillUseAwards: [
        { idx: 1, uses: 1, items: awards([[ESSENCE, 1]]) },
        { idx: 2, uses: 3, items: awards([[DIAMOND, 30]]) }
      ],
      onlineAwards: [
        { idx: 1, seconds: 60, items: awards([[DIAMOND, 10]]) },
        { idx: 2, seconds: 300, items: awards([[DIAMOND, 20]]) }
      ],
      boxes: [
        { idx: 1, items: awards([[DIAMOND, 30]]) },
        { idx: 2, items: awards([[ESSENCE, 2]]) }
      ],
      dailyFreeSkillItem: { tid: ESSENCE, count: 1 },
      skillItems: { [ESSENCE]: { price: 20, count: 1 } }
    },
    joint: {
      periodSeconds: 3 * 86400,
      attackPercent: 3,
      attackPower: '400000',
      boxesPerKill: 2,
      boxAwards: awards([[DIAMOND, 15], [ESSENCE, 1]]),
      taskAwards: [
        { tid: 1, group: 1, need: 1, items: awards([[DIAMOND, 20]]) },
        { tid: 2, group: 1, need: 2, items: awards([[ESSENCE, 1]]) }
      ],
      lodeSeconds: 300,
      lodeAwards: awards([[DIAMOND, 10]]),
      rankAwards: [
        { rank: 1, items: awards([[DIAMOND, 60]]) },
        { rank: 2, items: awards([[DIAMOND, 30]]) },
        { rank: 3, items: awards([[DIAMOND, 15]]) }
      ],
      nodes: [
        { node: 1, maxHp: '300000', kind: 'monster' },
        { node: 2, maxHp: '500000', kind: 'monster' },
        { node: 3, maxHp: '800000', kind: 'monster' }
      ],
      doorHp: '600000',
      pioneerSlots: 3
    },
    gvg: {
      periodSeconds: 7 * 86400,
      attackPercent: 3,
      monsterHp: '500000',
      blockHp: '800000',
      holdSeconds: 600,
      holdScorePerMinute: 10,
      lodeSeconds: 300,
      boxAwards: awards([[DIAMOND, 12]]),
      lodeAwards: awards([[DIAMOND, 8]]),
      taskAwards: [
        { tid: 1, group: 1, need: 1, items: awards([[DIAMOND, 20]]) }
      ],
      nodes: [
        { node: 1, monsterHp: '400000' },
        { node: 2, monsterHp: '700000' }
      ],
      guardHp: '600000',
      teamCount: 2
    },
    runeStone: {
      // GuildRuneStoneCmd carries explicit item operations (sources/targets),
      // so compose consumes real ItemGuildRuneStone rows and produces the next
      // level of the same family. The merge ratio is local policy.
      composeRatio: 3,
      maxSlots: 6
    },
    vote: {
      durationSeconds: 86400,
      candidateCount: 3,
      reward: awards([[DIAMOND, 10]])
    },
    slg: {
      maxBlocksPerRequest: 64
    },
    nation: {
      seasonSeconds: 14 * 86400,
      buildSeconds: 120,
      soldierSeconds: 60,
      studySeconds: 300,
      marchSeconds: 90,
      cityHp: 10000,
      coreHp: 20000,
      repairSeconds: 600,
      protectSeconds: 1800,
      fireSeconds: 600,
      buildCost: awards([[DIAMOND, 20]]),
      soldierCost: awards([[DIAMOND, 10]]),
      studyCost: awards([[DIAMOND, 30]]),
      queueUnlockCost: awards([[DIAMOND, 50]]),
      marchSpeedCost: 5,
      soldierSpeedCost: 5,
      studySpeedCost: 10,
      donatePointPerDiamond: 10,
      assistGuildPoints: 10,
      strongholdAwards: [
        { tid: 1, items: awards([[DIAMOND, 40]]) },
        { tid: 2, items: awards([[DIAMOND, 60]]) }
      ],
      battleAward: awards([[ESSENCE, 1]]),
      honorAward: awards([[DIAMOND, 30]]),
      captureAward: awards([[DIAMOND, 50]]),
      taskAwards: [
        { tid: 1, need: 1, items: awards([[DIAMOND, 10]]) },
        { tid: 2, need: 2, items: awards([[DIAMOND, 20]]) }
      ],
      phaseAward: awards([[DIAMOND, 40]]),
      soldierTypes: [1, 2, 3],
      buildTids: [1, 2, 3, 4],
      teamSlots: 2,
      assistMax: 5,
      assistSeconds: 3600,
      musterSeconds: 300
    },
    bargain: {
      durationSeconds: 86400,
      maxBargainers: 5,
      startPrice: 1000,
      step: 80,
      floor: 200,
      gifts: {
        1: { items: awards([[DIAMOND, 100], [ESSENCE, 2]]) },
        2: { items: awards([[DIAMOND, 60]]) }
      }
    },
    expedition: {
      periodSeconds: 7 * 86400,
      roundSeconds: 86400,
      cityIds: [1, 2, 3],
      buildSlots: 3,
      inspireCost: 20,
      declareCost: 50,
      guessCost: 10,
      likeAward: awards([[DIAMOND, 5]]),
      fightPercent: 3,
      posCount: 4
    },
    hunt: {
      roundSeconds: 3 * 86400,
      supportCost: 10,
      supportAward: awards([[DIAMOND, 5]]),
      stages: [
        { stage: 1, boss: 1, level: 1, hp: '600000' },
        { stage: 2, boss: 2, level: 1, hp: '1200000' }
      ],
      monsters: 3
    },
    crusade: {
      note: 'GuildCrusadeCmd:105805 response schema pb_guild_crusade_rank_rsp is not present in the shipped protobuf bundle'
    },
    auction: {
      durationSeconds: 3600,
      bonus: 10,
      items: [
        { uid: 1, resTid: 101500, count: 200, startPrice: 50 },
        { uid: 2, resTid: ESSENCE, count: 2, startPrice: 80 }
      ],
      wishLimit: 2
    },
    channel: {
      entries: [
        { channelId: 1, isOpen: true, linkUrl: '', minDay: 1, maxDay: 0 },
        { channelId: 2, isOpen: true, linkUrl: '', minDay: 1, maxDay: 0 }
      ]
    }
  };
}
