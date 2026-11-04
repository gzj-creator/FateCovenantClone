# 服务端运行资产

本目录保存个人服务器启动、协议编码和登录初始化所需的本地资产。代码通过 `personal-server/assets.mjs` 相对定位这些文件，因此复制整个 `personal-server/` 后仍能启动。

## 目录

- `tables/`：37 个压缩 JSON 表（`.json.gz`）和 2 个 Lua 二进制表（`.bin`），共 39 个文件。
- `protobuf/`：656 个 `.proto.bin` 消息定义，用于游戏网关的 Protobuf 运行时加载。
- `protocol/`：登录和区服 schema、更新清单、握手及封包加密 fixtures。

压缩表仍由调用方按原文件名请求，例如 `GameTable.data.lua.json`。`readAssetBytes` 在文件不存在时会自动读取同名的 `.json.gz`，解压后返回原始 UTF-8 字节。

## 覆盖目录

`FC_ASSET_ROOT` 可指定另一套资产根目录：

```powershell
$env:FC_ASSET_ROOT = 'D:\fc-server-assets'
```

覆盖目录必须保持相同的相对结构和文件名。该变量只改变资产根目录；运行数据目录仍由 `FC_LOCAL_DATA` 控制。

## 维护规则

- 不要在正常部署时直接修改压缩表或 Protobuf 定义；先更新来源证据和生成流程，再整体替换资产。
- 修改 schema 后必须同步更新代码中的 SHA-256 校验值和相关测试。
- `protocol/update-manifest-364110.txt` 必须与当前隔离 APK 接受的版本清单一致。
- 这些文件属于个人服务器的本地兼容资产，不应单独复制到公开客户端构建。
