# G5 新超凡魔灵服务器内部错误

状态：**未实现业务**；本轮只补充“定位失败命令”的诊断能力，未伪造任何魔灵数据、概率或奖励。

## 证据与排除

- 候选模块：158 `魔灵养成`(`PetDevelopMgr`)、160 `魔灵玩法`(`PetPlayMgr`)、92059 `活动_魔灵投放`；候选命令：90501-90507（PetActivityCmd）、90731-90748（PetCmd）、90901/90902（PetPlayCmd）。
- 登录快照中 module 158 为 3 段空 Buffer、module 160 为空 Buffer，未解码出任何 `pb_pet_*_login` 结构；module 92 的活动列表也不含 92059。
- 运行事件日志中**没有任何** 905xx/907xx/909xx 请求。已观察到的相邻可疑请求为 16005 `req_buy_or_rev_gift`（2026-10-25T15:13:03Z）与 117005 `req_hundred_draw_act_marquee`（多次），二者都不能按中文名认定为“魔灵”。
- 结论：本轮无法把“新超凡魔灵”映射到确定的失败命令；按约定不得凭名称猜测，因此不实现宠物养成/投放/玩法。

## 本轮改动

- `gateway.mjs` 的 `unsupported_command` 事件新增 `payloadHead`（请求体前 64 字节 Base64，仅本机 `events.jsonl`），用于下次复现时精确识别命令与参数。

## 下一步（需用户操作）

1. 用户点击“新超凡魔灵”入口并记录时间点。
2. 在 `runtime.local-only.data/events.jsonl` 中按时间查 `command` 与 `unsupported_command`（含 `payloadHead`）。
3. 只有当命令号、protobuf schema、`PetTable`/`PetDrawNewTable` 配置与登录数据结构都能核对后，才实现对应读取/养成；投放概率、招募概率、奖励未取证前一律拒绝。
