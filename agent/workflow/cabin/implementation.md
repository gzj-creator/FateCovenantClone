# 船舱（Campsite）实现与验收记录

更新时间：2026-11-01（Asia/Shanghai）

分支：feature/system-cabin-20261031

Worktree：F:\projects\FateCovenantClone\.worktree\system-cabin-20261031

状态：模块 114 的登录重建、格子解锁和上阵/替换/下阵已实现；10 个服务测试和 1 个真实临时 TCP 网关测试通过，全量 326/326 通过。尚未部署到实时服务，未操作 ADB、模拟器、APK 或正式数据库，未做客户端界面和用户可玩验收。

## 任务卡状态

原任务卡状态为“待执行”。当前状态：

- [x] 从 CampsiteMgr、CampsiteCmd、protobuf、CampsiteTable 和登录 module 114 提取请求及响应。
- [x] 枚举可见操作及其证据状态。
- [x] 实现有证据的 83201 req_unlock_cell 和 83202 re_place_hero。
- [x] 覆盖防重、资源不足、锁格、越界、事务回滚、SQLite 重开、module 114 登录重建和真实临时 TCP。
- [x] worktree 全量 npm test 通过（326/326）。
- [ ] 真实 APK/UI 验收：未部署，待用户操作。
- [ ] 房间升级、任务、交互、奖励领取、加速等：没有协议证据，保持未实现。

## 范围与结论

船舱是登录模块 114，客户端管理器为 CampsiteMgr，界面目录为 project/campsite。客户端 bundle 中只有 CampsiteCmd.lua.bin 和 CampsiteMgr.lua.bin 引用 req_unlock_cell、re_place_hero 和 CampsiteCmd，因此本轮实现的两个命令就是目前有证据的完整船舱网络操作。

已实现的业务只有：

1. 解锁格子：83201 req_unlock_cell，ETF 参数为 [groupId, cellIndex]。
2. 上阵、替换、下阵：83202 re_place_hero，protobuf pb_campsite_place。
3. 一键上阵使用同一个 83202 请求，在一个事务里提交多个组的 cell/hero 列表。

SlgRoleCampsite、SlgGuildCampsite、SlgRoleCampsiteHandler 等名称属于公会营地或 SLG 模块，已从本功能范围排除；它们不是模块 114 的船舱协议。

## 客户端证据

| 项目 | 证据 |
| --- | --- |
| 模块 114 名称与管理器 | ModuleTable.data.lua.json：ref_name=船舱，lua_module=CampsiteMgr，e_dir=project/campsite |
| 命令号 | Cmd.lua.json：req_unlock_cell=83201，re_place_hero=83202 |
| 请求编码 | CampsiteCmd.lua.bin：req_unlock_cell 使用 EncodeErl；re_place_hero 使用 pb_campsite_place，外层字段为 place_groups |
| 常规与一键构造 | CampsiteMgr.PlaceHero 每次只构造一组、单格、单英雄；OneKeyPlaceHero 通过 GetOneKeyPlace 选择空格和未上阵英雄，再按多组提交 |
| 登录数据结构 | pb_campsite_data.groups_data；pb_campsite_group 含 group_id、cell_states、hero_list |
| 放置请求结构 | pb_campsite_place.place_groups；pb_campsite_place_group 含 group_id、cell_index_list、hero_uid_list |
| 初始格子和槽位 | CampsiteGroup 构造器按 CampsiteTable.Const.TID_CAMPSITE_CONST.max_cell 建立槽位，再以 table.insert(..., 0) 填满；ResetByPb 用 hero_list 整体替换 |
| 配置表 | CampsiteTable.data：max_cell=4，init_cell=3，unlock_id=101500，unlock_count=1000，one_key_count=24；九组解锁等级、阵营、职业和 grid_num 已固化到 cabin-tables.mjs |

## 界面入口到协议的映射

| 界面入口 | Cmd/type | 请求 schema | 响应 | 登录 slot | 配置 | 持久化 |
| --- | --- | --- | --- | --- | --- | --- |
| 船舱格子“解锁” | CampsiteCmd.req_unlock_cell / 83201 | ETF [groupId, cellIndex] | pb_res_to_client，changes 中扣 101500 | module 114 的 pb_campsite_data | Const.init_cell=3、max_cell=4、unlock_id=101500、unlock_count=1000；Group.grid_num | module 114 的 cell_states 加资源 101500 |
| 单格上阵、替换、下阵 | CampsiteCmd.re_place_hero / 83202 | pb_campsite_place，place_groups 内一组 cell_index_list/hero_uid_list | pb_campsite_data，只返回请求涉及的组 | module 114 的 pb_campsite_data | Group.camp、Group.profession、Group.grid_num；Hero 表校验存在性 | module 114 的 hero_list |
| 一键上阵 | CampsiteCmd.re_place_hero / 83202 | 同一个 pb_campsite_place，可含多个组；空组允许 cell_index_list=[]、hero_uid_list=[] | pb_campsite_data，按组返回最新状态 | module 114 的 pb_campsite_data | one_key_count=24 为客户端配置；服务端按组和格数校验 | 与普通上阵同一事务 |
| 登录读取船舱 | 登录 module 114 | 服务端直接编码 pb_campsite_data | 登录 payload 的 module 114 | module 114 | 按角色等级开放组；默认格 1-3 解锁 | SQLite 的 modules 表，无新增表 |

客户端的常规 PlaceHero 请求只有一格一英雄；当前没有动态抓包证明界面会自行提交两格互换。服务端仍支持同一批次内的显式换位或移动，因为 pb_campsite_place 的重复列表允许原子提交，并且只要旧格也在本请求中即可无歧义执行。

## 已实现规则

### 登录重建

- 在登录构造模块之前调用 cabin.ensureLoginState()，按角色等级建立已开放组。
- 42 级建立组 1、2、3、4、9；44 级再建立组 5、6、7、8。
- 新组默认解锁格 1、2、3，cell_states 为 0x70；hero_list 固定输出四个槽位，内容为 ['0','0','0','0']。
- 既有组的已解锁格和已上阵英雄保留，不会被登录重建覆盖。
- 模块 114 直接写 pb_campsite_data 的二进制，不使用 ETF 包装。

### 83201 解锁格子

- groupId 必须存在且当前角色等级达到该组的 unlock_level。
- 只允许 cellIndex 大于 init_cell（3）且不超过 grid_num；当前配置下只有第 4 格。
- 第 4 格已解锁时返回 51902，不重复扣资源。
- 扣 101500 数量 1000；资源不足返回 301，模块 114 和资源均不变化。
- 成功返回 pb_res_to_client，changes 为一条 101500、new_num 和 diff_num=-1000，is_overflow=false。

### 83202 上阵、替换、下阵

- 解码 pb_campsite_place；place_groups 不能为空。
- 每个组的 cell_index_list 与 hero_uid_list 必须等长；组不能重复，同一组内的格子不能重复。
- 组必须已开放；格子必须小于等于 grid_num 且已解锁。
- hero_uid 为 0 表示清除该格；非零 UID 必须存在于当前角色的英雄列表，否则返回 3001。
- 组的 camp 非零时英雄 camp 必须一致；组的 profession 非零时英雄 profession 必须一致，否则返回 51904。
- 同一请求不能让一个英雄出现在两个目标格。若英雄当前所在格也在本请求中，可以原子交换或显式移动；若旧格没有出现在本请求中，返回参数错误，避免悄悄删除未列出的旧位置。
- 批量请求整体校验，任一失败则不写入任何组。
- 成功返回 pb_campsite_data，只包含请求涉及的组，并按 group_id 排序。
- 一键请求可以一次提交多个组；某组为空列表时仍返回该组的最新状态，便于客户端重建完整船舱界面。

### 事务与持久化

- 所有修改通过 game store 的同一个 transaction 提交；成功时模块 114 和资源扣减一起落库。
- 响应编码失败或 SQLite 写入失败会回滚模块 114 和资源状态；两种路径都有独立测试。
- 模块 114 继续保存在既有 modules 表，不新增 SQLite 表，不需要迁移现有角色数据。
- 重开 SQLite 后登录 payload 和界面数据都从持久化模块重新解码。

## 错误码

| 错误码 | 含义 |
| --- | --- |
| 51901 | 非法格或组配置不存在 |
| 51902 | 格子已解锁 |
| 51903 | 格子未解锁 |
| 51904 | 英雄阵营或职业不符合该组 |
| 3001 | 英雄不存在 |
| 301 | 资源不足 |
| 1 | 请求格式、组未开放、重复格或重复英雄等参数错误 |
| 5 | 配置或持久化状态异常 |

## 客户端数据形态与推断边界

- hero_list 固定四个槽位来自 CampsiteGroup 构造器：先按 max_cell 创建槽位并以 0 填充，ResetByPb 再用 pb 的 hero_list 整体替换。服务端因此在登录和响应中始终输出四元素列表，避免客户端把空列表解释成没有槽位。
- 默认格 1-3 的 0x70 来自 CampsiteTable 的 init_cell=3 与客户端 BitBlock 位序；本轮没有动态抓到真实模块 114 的非空样本。该值属于客户端构造规则推断，不是已观测的线上数据。
- 若后续拿到真实客户端模块 114 的非空样本，应优先核对初始 cell_states、hero_list 长度和组的排序，再决定是否需要调整。
- 当前未发现独立房间升级、设施任务、交互、奖励领取、加速或时间窗口协议。任务卡里的“时间边界”在本模块没有可实现的证据字段，本轮不做臆造。

## 测试与验证

执行：

    cd personal-server
    node --test test/cabin-service.test.mjs test/gameplay-gateway.test.mjs
    npm test

结果：

- 定向测试 15/15 通过，其中 10 个是 cabin-service 测试，gateway 测试使用真实本地 TCP 帧。
- 全量 npm test：326/326 通过，0 失败。
- cabin-service 覆盖：登录按 42/44 级重建、默认 0x70、SQLite 重开；解锁第 4 格、扣 1000 资源、重复解锁 51902；非法格、未开放组、资源不足；上阵、重复放置、清除；同批原子交换和显式移动；旧格未列出的移动拒绝；阵营/职业/英雄存在/锁格；跨组一键批量原子性；空组批量；格式冲突；响应编码失败和 SQLite 写入失败回滚。
- gameplay-gateway 覆盖：真实握手、登录、模块 114 解码、83201、83202 单格与同批原子交换、SQLite 持久化，并确认两个命令没有落入 unsupported_command。

## 未覆盖与验收边界

- 真实 APK/UI：未部署到实时服务，未重开客户端，未点击船舱界面，未做用户视觉验收。
- 房间/设施升级、船舱任务、交互、奖励领取、加速、时间窗口：没有协议证据，保持未实现，不能把组件测试当作可玩验收。
- 一键自动填充的客户端排序和候选英雄规则只在 CampsiteGroup.GetOneKeyPlace 的客户端代码中确认；服务端接受客户端提交的合法组列表，不单独重算自动选择结果。
- 没有真实客户端抓包证明船舱 UI 会提交两格互换；常规 PlaceHero 按单格发送，OneKeyPlaceHero 只选空格和未上阵英雄。服务端的批次交换语义是按重复列表协议实现的兼容能力，真实界面路径仍需部署后验证。
- 属性汇总、战力展示和红点由客户端计算；服务端只维护格子状态和英雄 UID。
- 本次没有修改 APK，因此没有生成新的 APK 快照，也没有改动 apk/README.md。

## 变更文件

- 新增 personal-server/config/cabin-tables.mjs。
- 新增 personal-server/game/cabin-service.mjs。
- 新增 personal-server/test/cabin-service.test.mjs。
- 修改 personal-server/game/gateway.mjs：登录模块 114、83201/83202 路由和 cabin 服务实例。
- 修改 personal-server/test/gameplay-gateway.test.mjs：真实 TCP 船舱回归测试。

## 证据入口

- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/ModuleTable.data.lua.json
- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/Cmd.lua.json
- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/17660280547921504000-CampsiteCmd.lua.bin（SHA256 7C31706D21A8EE751266DF6D073730A15A241FD4C859A21FE826C9424A291F17）
- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/14788159049002988000-CampsiteMgr.lua.bin（SHA256 8646C3984951F3CFB3C156300AE6682D138CC87C84F41F388131CC55D44C285C）
- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/16755602884360400000-CampsiteGroup.lua.bin（SHA256 C55F8888F3826B5CE3CC20142E9BCF908656E140AB0648D47F93A7E1EC3BE785）
- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/13383511913250537000-CampsiteTable.data.lua.bin（SHA256 F2081ABC4C586E4DF0873462C3BAAC3D182BB425FFF80D88A7D44B86E798C627）
- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/11930896643607702000-campsite.net.proto.bin（SHA256 217D3DFF960717B679892595CDED4E71E436872BC521E3F5121CB2FA4984D862）
- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/16261699344619543000-campsite.db.proto.bin（SHA256 950DD29D26FF2490106118005E6281E29318796D4D2E835155AAA04784519692）

## 发布状态

本分支尚未合并、尚未部署。没有启动或停止实时服务，没有读写正式服务数据库，没有修改 ADB、模拟器、APK 或用户存档。

