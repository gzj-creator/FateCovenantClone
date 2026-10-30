# SDK 登录前置核对

2026-10-25 21:31更新：v7手机号4位测试验证码、QuickSDK二层及平台userStatus均已由真实APK接受，之后进入本机大厅。当前实现/验证见[实操记录](implementation.md)，以下未验收描述保留为历史。

日期：2026-10-25。SDK初始化已实测通过；SDK账号登录尚未验收。

## 配置、证书与账号

- `assets/quicksdk.xml` 已沿实际加载链解密并解析，26字段的本地导出在 `analysis/experiments/private-server-20261025/p1/config/quicksdk.local-only.*`，不输出值。
- SDK的另一资产 `appInfo` 依赖证书：证书SHA1小写冒号串 → MD5小写hex文本 → 其UTF8字节作为AES256 ECB密钥 → Base64载荷解密与PKCS7去填充。已有原证书推导仍解密失败，不能仅归因于本轮重签。
- 静态入口明确允许appInfo为空时回退外部初始化参数。运行证据证明重签隔离包能完成初始化，但没有单独观测实际分支和所用key。
- 目前配置选择onepass，实际显示手机号入口；已有本机SDK组件支持普通账号登录与续登，手机号检查/短信分支仍需恢复或为隔离包配置自有普通账号入口，不能拿用户真实验证码或凭证试回包。

## 签名与会话

- SDK表单：Java UTF16键排序，未编码参数串追加appKey，删除ASCII空格，UTF8 MD5小写hex，然后URL表单编码。
- SDK登录回包直接JSON；`utfDecode`只是UTF8字符串转换，不是AES或Base64解密。`result`采用类型一致对象。
- `expire_time` 是int32 Unix秒到期时间；SDK缓存判断是当前秒数大于到期时间。普通回调传递 `uid=result.userid`、`token=result.token`。
- SDK token、游戏登录verify_code和游戏节点nodeToken属于不同阶段，不能混用。游戏服仍需验证账号与token，不能任意值都成功。
- 默认签名校验、账号校验、续登与脱敏等13个SDK组件测试通过，不能代替APK登录验收。

## 实测证据

`p2/local-version-response.local-only.log` 的16:40:26有 `QuickUnityInitNotify onSuccess`，16:40:34有 `title: init, message: skd init success`、`Core.JJmassasEventHandle:onInitSuccess()`。截图 `p2/local-version-response.png` 为SDK登录页。

直接来源：`analysis/reports/private-client-16448/android-login/sdk-config-direct-evidence.md`、`README.md`、`sdk-login-contract.json`。签名密钥值、账号与token不写入工作流文档。
