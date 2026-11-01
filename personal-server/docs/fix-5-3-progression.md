# 5-3 胜利后不进入下一关问题修复

## 问题描述
用户报告：打完 5-3 关卡胜利后，不进入下一关。

## 根因分析

### MissionTable 数据结构
- 5-3 关卡：section 50203，`assert_jump = 0`（普通关卡）
- 5-4 关卡：section 50204，`assert_jump = 15`，`assert = 153379200003`（有前置条件）
- 5-5 关卡：section 50205，`assert_jump = 0`（普通关卡）

### assert_jump 字段含义
`assert_jump > 0` 的关卡表示有前置条件，可能需要：
- 完成特定任务
- 达到特定等级
- 其他游戏内解锁条件

### 50204 关卡分析
50204 (5-4) 是一个**完全可玩的战斗关卡**：
- ✅ 有敌人配置：`[9003600, 9003400]`
- ✅ 有奖励：`[123002, 201500, 101800]`
- ✅ 不是剧情关（`story: 0`）
- ✅ 普通怪物类型（`monster_type: 0`）
- ❌ 只是有 `assert_jump=15` 的前置条件

### 原有逻辑
`nextMissionId` 函数直接返回排序后的下一个关卡（50204）：
```javascript
function nextMissionId(sections, missionId) {
  const order = missionOrder(sections), position = missionPosition(sections, missionId);
  return position >= 0 && position + 1 < order.length ? Number(order[position + 1][0]) : Number(missionId);
}
```

服务器返回 50204 后，客户端可能检测到 `assert_jump=15` 前置条件不满足，导致无法进入。

## 修复方案（方案3）

**保持服务器逻辑不变，让 5-4 可玩**：
- 服务器忽略 `assert_jump`，正常返回下一个关卡（包括 50204）
- 测试客户端是否真的检查 `assert_jump`
- 如果客户端信任服务器返回的 `mission_id`，就可以正常进入 5-4

## 理由

1. **50204 是完整关卡**：有战斗配置和奖励，跳过会让玩家错过内容
2. **客户端行为未知**：客户端可能只显示但限制进入，也可能完全信任服务器
3. **先测试再决定**：让 5-4 显示在关卡列表，测试是否可以进入
4. **如果确实不可进**：可以后续考虑实现前置条件逻辑或跳过机制

## 测试验证

需要在实际游戏中测试：
1. 打完 5-3 后，客户端是否显示 5-4
2. 5-4 是否可以点击进入
3. 进入 5-4 后战斗是否正常
4. 战斗胜利后是否能正常结算和获得奖励

## 备选方案

如果测试发现 5-4 确实因为客户端检查而无法进入，可以考虑：
- 方案A：实现前置条件逻辑（需要理解 `assert` 和 `assert_jump` 的完整含义）
- 方案B：跳过 `assert_jump > 0` 的关卡（会错过内容）
- 方案C：修改客户端配置（不推荐）

## 其他有 assert_jump 的关卡

- 40207: assert_jump = 2049
- 50201: assert_jump = 410
- 50204: assert_jump = 15
- 70206: assert_jump = 1417
- 70210: assert_jump = 1419
- 80206: assert_jump = 1417
- 90203: assert_jump = 1419

这些关卡都会同样测试验证。
