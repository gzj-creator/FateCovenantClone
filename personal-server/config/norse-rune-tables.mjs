// Evidence: project/norse_rune/NorseRuneTable.data and the matching client
// manager. Keep only the rows used by server operation instead of committing the
// generated 864-row TokenAttr presentation table.
const levelRows = [
  [10000, 100, 6], [10000, 100, 12], [22500, 150, 18],
  [22500, 150, 24], [40000, 200, 30], [40000, 200, 36],
  [40000, 200, 36], [40000, 200, 36], [40000, 200, 36],
  [40000, 200, 36], [40000, 200, 36], [40000, 200, 36]
];

// show_weight selects one of the generated QualityWeight rows. The configured
// levels use 6, 12, 18, 24, 30 and 36; each is the sixth row of its six-row
// cycle and therefore resolves to the same evidenced probability vector.
const activeQualityWeights = [4400, 2800, 1600, 800, 400];

export const NORSE_RUNE_MODULE = 156;
export const NORSE_RUNE_COMMANDS = Object.freeze({
  draw: 90201,
  replace: 90202,
  wishLevelUp: 90203,
  runeLevelUp: 90204
});

// The client only receives the authoritative EXP value. These ratios are the
// consistent local-server inference: every configured threshold is reached in
// 10/15/20 draw units when EXP gained equals the spent unit count times ten.
export const NORSE_RUNE_EXP_PER_COST_UNIT = 10;

export function readNorseRuneTables() {
  return {
    levels: new Map(levelRows.map(([needExp, cost, showWeight], index) => [index + 1, {
      level: index + 1,
      needExp,
      currencyTid: 324002,
      cost,
      showWeight
    }])),
    qualityWeights: new Map([
      [1, [690, 200, 80, 20, 10]],
      [2, [280, 400, 250, 50, 20]],
      [3, [270, 200, 400, 80, 50]],
      [4, [170, 200, 200, 350, 80]],
      [5, [50, 100, 250, 300, 300]],
      [6, activeQualityWeights],
      [7, [690, 200, 80, 20, 10]],
      [8, [280, 400, 250, 50, 20]],
      [9, [270, 200, 400, 80, 50]],
      [10, [170, 200, 200, 350, 80]],
      [11, [50, 100, 250, 300, 300]],
      [12, activeQualityWeights],
      [13, [740, 150, 80, 20, 10]],
      [14, [330, 350, 250, 50, 20]],
      [15, [270, 250, 350, 80, 50]],
      [16, [170, 200, 250, 300, 80]],
      [17, [50, 100, 250, 350, 250]],
      [18, activeQualityWeights],
      [19, [740, 150, 80, 20, 10]],
      [20, [330, 350, 250, 50, 20]],
      [21, [270, 250, 350, 80, 50]],
      [22, [170, 200, 250, 300, 80]],
      [23, [50, 100, 250, 350, 250]],
      [24, activeQualityWeights],
      [25, [790, 100, 80, 20, 10]],
      [26, [380, 300, 250, 50, 20]],
      [27, [270, 300, 300, 80, 50]],
      [28, [270, 200, 200, 250, 80]],
      [29, [50, 100, 300, 350, 200]],
      [30, activeQualityWeights],
      [31, [790, 100, 80, 20, 10]],
      [32, [380, 300, 250, 50, 20]],
      [33, [270, 300, 300, 80, 50]],
      [34, [270, 200, 200, 250, 80]],
      [35, [50, 100, 300, 350, 200]],
      [36, activeQualityWeights]
    ]),
    tokens: new Map(Array.from({ length: 12 }, (_, index) => [index + 1, {
      token: index + 1,
      type: Math.floor(index / 3) + 1
    }])),
    qualityCount: activeQualityWeights.length,
    typeMaxLevel: 6
  };
}
