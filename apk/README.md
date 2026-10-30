# 本地测试 APK 快照

本目录保存本机个人服务器联调用的 APK 快照，**不纳入 Git 提交**。完整说明和修复过程见 ../agent/workflow/client-resource/implementation.md。

## 当前可用快照

| 项目 | 值 |
| --- | --- |
| 文件 | apk/com.jzyx.ps.v8b-working.apk |
| 保存日期 | 2026-10-28 |
| 大小 | 4,116,360,373 字节 |
| SHA256 | c33a192cd875fd9cda8e5a25104d49d5b2d4b5325056380efc53dc96de1ef3cf |
| 包名 | com.jzyx.ps |
| 版本 | 1.55.090365（versionCode 362155） |
| 签名 | v1/v2/v3 验证通过；证书 CN=FateCovenant Local Test |
| 来源 | analysis/experiments/private-server-20261025/p3/isolated-local-v8b/com.jzyx.ps.signed.apk |

## 使用条件

- 仅用于本机个人服务器联调，禁止分发或上传；该包基于原客户端修改，包含原游戏资源，不是最终发行包。
- 客户端通过 ADB reverse 连接 127.0.0.1 上的个人服务器；服务端口和实时 PID 以 analysis/experiments/private-server-20261025/p3/runtime.local-only.data/server.local-only.json 为准。
- 主界面看板娘依赖应用私有 SharedPreferences 中的 SubDownloadFinish=1：

      /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml

  该值**没有烘焙进 APK**。重装、清除应用数据或换设备后，需要重新写入；否则 UniCore.RemoteLoadMgr 会把 sub_first 资源误判为远程下载，看板娘会因 hero_sl_GuangZhiXin_new_talk.prefab ... bundle load timeOut / [MissAsset] 消失。
- 写入 prefs 后需保持 owner 10042:10042、mode 660，并执行 restorecon。
- 安装前确认设备和 ADB：

      $adb = 'E:/Mumu/MuMuPlayer/nx_main/adb.exe'
      & $adb -s 127.0.0.1:16448 install -r apk/com.jzyx.ps.v8b-working.apk

## 边界

- 原版 com.jzyx.my 未操作；不要用本快照替换或停启原版客户端。
- LocalFileCache.txt 是设备侧资源缓存，不要为了让快照“看起来可用”而覆盖或清理。
- 重装后若看板娘仍缺失，先检查 prefs 中的 SubDownloadFinish 和对应 bundle 是否存在，再检查服务/更新地址，不要先怀疑美术资源缺失。
