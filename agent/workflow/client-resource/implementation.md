# 客户端资源：主界面看板娘缺失修复

日期：2026-10-28

状态：隔离客户端 com.jzyx.ps 的看板娘已实机恢复显示（截图见下）。修复依赖应用私有 SharedPreferences，未烘焙进 APK；重装、清数据或换设备后需要重新设置。

## 现象

隔离客户端可以登录并进入 Local Adventurer 大厅，但主界面只有背景，没有看板娘。登录、网络和其他大厅 UI 正常。

## 资源核对

看板娘资源本身没有缺失：

- APK 与更新清单 assets/update.txt 均包含 hero_sl_guangzhixin_new.bundle。
- 设备更新缓存实际存在：

      /storage/emulated/0/Android/data/com.jzyx.ps/files/Updates/Android/sub_first/model/character/hero_sl_guangzhixin_new.bundle

- 文件大小 896,793 字节，MD5 2633e8323d474789a178905ec2e133cc。
- 同目录还有 hero_sl_guangzhixin_new_common.bundle（14,736 字节）和 hero_sl_guangzhixin_new_scommon.bundle（4,321,819 字节）。

因此问题在加载链路，不是资源文件或下载源缺失。

## 根因

PlayerPrefs 中 SubDownloadFinish 默认为 0。UniCore 的远程加载判断在没有完成 sub_first 下载标记时，把 sub_first 资源误判为需要远程加载。

关键代码路径（Assembly.Framework.UniCore.dll）：

- UniCore.UpdatePath.get_SubDownloadFinish：读取 PlayerPrefs.GetInt("SubDownloadFinish", 0)。
- UniCore.RemoteLoadMgr.NeedRemoteLoad：当 SubDownloadFinish=0 且 UpdateMgr.Downloader != 非空时，sub_first 资源进入远程加载分支。
- UniCore.RemoteLoadMgr.LocalExistAsset：本地存在判断未能阻止该分支。
- UniCore.RemoteLoadMgr.AddRemoteLoad：调用 UpdateDownloader.AsyncAssetLackPreCheck。
- UniCore.UpdateDownloader.AsyncAssetLackPreCheck：当前下载器没有匹配任务，返回 IsEmpty。
- UniCore.AssetBundleLoader.LoadAssetBundleInternalAsync：远程加载没有创建 AssetBundleCreateRequest。
- UniCore.AssetLoadOperation.Update / OnFinished：_mRequest 保持 null，等待 6000 帧后超时，随后 LoadFailedByNoAsset 报 MissAsset。

简化时序：

    SubDownloadFinish=0
      -> NeedRemoteLoad(sub_first)=true
      -> AddRemoteLoad()
      -> AsyncAssetLackPreCheck 为空
      -> AddRemoteLoad Error
      -> AssetBundle 请求未创建（_mRequest=null）
      -> 6000 帧超时
      -> load fail by bundle load timeOut
      -> [MissAsset]

## 日志证据

修复前（analysis/experiments/private-server-20261025/p3/client-resource-20261027/latest-Info_current.local-only.log）：

- 2026-10-28 00:09:31：UpdateDownloader AsyncAssetLackPreCheck IsEmpty: Android/sub_first/effects/heros/shenbing_fazhang_scommon.bundle
- 2026-10-28 00:09:31：AddRemoteLoad Error: sub_first/effects/heros/shenbing_fazhang_scommon.bundle
- 2026-10-28 00:11:11：hero_sl_GuangZhiXin_new_talk.prefab load fail by bundle load timeOut
- 2026-10-28 00:11:11：[MissAsset] Failed to load bundle for hero_sl_GuangZhiXin_new_talk.prefab. Should be in bundle sub_first/model/character/hero_sl_guangzhixin_new.bundle.

其中 shenbing_fazhang_scommon.bundle 是触发依赖检查的样本资源；真正导致看板娘缺失的是同一 RemoteLoadMgr 分支上的 hero_sl_guangzhixin_new.bundle。

修复后（analysis/experiments/private-server-20261025/p3/client-resource-20261027/Info-postfix-20261028-004709.local-only.txt）：

- 对 AddRemoteLoad、AsyncAssetLackPreCheck、bundle load timeOut、MissAsset 四个关键词的匹配数为 0。
- 同目录 Update-20261028-postfix.local-only.log 也没有 AddRemoteLoad Error。

## 修复步骤

### 1. 备份原 prefs

备份文件：

    analysis/experiments/private-server-20261025/p3/client-resource-20261027/prefs-before-subdownload.local-only.xml

修改后文件：

    analysis/experiments/private-server-20261025/p3/client-resource-20261027/prefs-with-subdownload.local-only.xml

### 2. 停止隔离客户端

    adb -s 127.0.0.1:16448 shell am force-stop com.jzyx.ps

### 3. 在 prefs 加入标记

在 /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml 的 </map> 前加入：

    <int name="SubDownloadFinish" value="1" />

只改这一项；不修改 LocalFileCache.txt、不重建 APK、不清应用数据。

### 4. 以应用 UID 写回

先临时放到 /sdcard，再用 root 复制回应用私有目录：

    adb -s 127.0.0.1:16448 push prefs-with-subdownload.local-only.xml /sdcard/
    adb -s 127.0.0.1:16448 shell su -c "cp /sdcard/prefs-with-subdownload.local-only.xml /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml"
    adb -s 127.0.0.1:16448 shell su -c "chown 10042:10042 /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml"
    adb -s 127.0.0.1:16448 shell su -c "chmod 660 /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml"
    adb -s 127.0.0.1:16448 shell su -c "restorecon /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml"

### 5. 重新启动并确认

    adb -s 127.0.0.1:16448 shell monkey -p com.jzyx.ps -c android.intent.category.LAUNCHER 1

设备实测：

- grep 返回第 20 行：<int name="SubDownloadFinish" value="1" />
- ls -lZ 为 u0_a42 u0_a42，mode 660，SELinux 上下文 u:object_r:app_data_file:s0:c42,c256,c512,c768。
- 截图 analysis/experiments/private-server-20261025/p3/kanban-after-subdownload-20261028.png 中看板娘 GuangZhiXin 正常显示。

修复前截图：analysis/experiments/private-server-20261025/p3/kanban-before-20261028.png。

## APK 快照

当前可用快照只保存在项目目录，不提交 Git：

    apk/com.jzyx.ps.v9-working.apk

- 大小：4,185,758,901 字节
- SHA256：1fd5fe0a2e18e9add821efb6c404d9464b5e3609be0e8af605d47bada441b473
- 包名/版本：com.jzyx.ps / 1.55.090365
- 签名：v1/v2/v3 验证通过，证书 CN=FateCovenant Local Test
- 来源：analysis/experiments/private-server-20261025/p3/isolated-local-v8b/com.jzyx.ps.signed.apk

快照说明见 apk/README.md。

## 重装/清数据风险

SubDownloadFinish 在应用私有数据中，不在 APK 内。以下操作会把它重置为 0，看板娘会再次消失：

- adb install 后首次启动（如果没有保留数据）
- 清除应用数据
- 卸载重装
- 换设备

恢复方法就是重新执行上面的 prefs 写入步骤。当前没有把默认值写入 APK 的 IL、smali 或首次启动逻辑，也没有自动修复脚本；这是后续可改进项。

## 未完成与其他风险

- 尚未把 SubDownloadFinish=1 烘焙进 APK；不要把当前快照称为“永久修复”。
- 只验证了主界面看板娘和本次 Info 日志；其他 sub_first 资源（例如 shenbing_fazhang_scommon.bundle）未逐项验证。
- 若后续重新打包/替换资源，必须重新核对更新清单与设备缓存，不能只改 APK。
- 原版 com.jzyx.my 未操作；本修复只针对隔离包 com.jzyx.ps。
- 设备 ADB 必须使用 E:/Mumu/MuMuPlayer/nx_main/adb.exe -s 127.0.0.1:16448；旧 SDK adb 当前会崩溃。

## 相关证据

- analysis/experiments/private-server-20261025/p3/kanban-before-20261028.png
- analysis/experiments/private-server-20261025/p3/kanban-after-subdownload-20261028.png
- analysis/experiments/private-server-20261025/p3/client-resource-20261027/latest-Info_current.local-only.log
- analysis/experiments/private-server-20261025/p3/client-resource-20261027/Info-postfix-20261028-004709.local-only.txt
- analysis/experiments/private-server-20261025/p3/client-resource-20261027/Update-20261028-postfix.local-only.log
- analysis/experiments/private-server-20261025/p3/client-resource-20261027/prefs-before-subdownload.local-only.xml
- analysis/experiments/private-server-20261025/p3/client-resource-20261027/prefs-with-subdownload.local-only.xml
