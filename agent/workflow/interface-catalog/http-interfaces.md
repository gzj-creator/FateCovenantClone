# HTTP Interfaces

Snapshot: 2026-10-25T12:03:39.660Z. Status describes immediate payloads; see [coverage](coverage.md) for limits.

O=observed, D=decoded, A=user operation verified, S=static only. Full schemas, shapes, seq and packet references: [interfaces.json](interfaces.json).

## sdk-account

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| POST /user/identityBind | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/phoneAccountBind | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/login | application/x-www-form-urlencoded;charset=UTF-8 | json | S | - |
| POST /user/fpCheckAccount | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/fpCodeSend | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/fpResetPassword | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/modifyPassword | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/modifyPasswordNotPwd | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/gtOneLogin | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/phoneAccountCheck | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/phoneLogin | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/loginReg | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/phoneRegist | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /sms/send | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/thirdLogin | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /user/tokenVerifySdk | application/x-www-form-urlencoded;charset=UTF-8 | json | O D A | recording:protocol-2026-10-25:http:tcp-25:c2s:917 |

## sdk-initialization

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| GET /banner/{gameId}/android-banner.json | URL path parameters | json | S | - |
| GET /banner/{gameId}/{appPackageChannelId}-banner.json | URL path parameters | json | S | - |

## sdk-payment

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| POST /pay/recharge/paytips | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /pay/recharge/orderStatus | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |
| POST /pay/recharge/order | application/x-www-form-urlencoded;charset=UTF-8 | unknown | S | - |

## sdk-runtime-route

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| POST /v2/users/checkLogin | - | - | O D A | recording:protocol-2026-10-25:http:tcp-27:c2s:0 |
| POST /user/userStatus | - | - | O D | recording:protocol-2026-10-25:http:tcp-28:c2s:0 |
| GET /game/notice/get_notice_list | - | - | O D | recording:protocol-2026-10-25:http:tcp-28:c2s:358 |
| GET /game/general/getInformationList | - | - | O D | recording:protocol-2026-10-25:http:tcp-53:c2s:1311 |
| POST /v1/users/updateGameRoleInfo | - | - | O D | recording:protocol-2026-10-25:http:tcp-60:c2s:1548 |

## sdk-telemetry

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| POST /sdk/tracker/log | application/x-www-form-urlencoded;charset=UTF-8 | unknown | O D | recording:protocol-2026-10-25:http:tcp-3:c2s:0 |

## server-list

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| POST /server_list [channel_login_servers] | application/x-www-form-urlencoded | pb_login_servers | O D | recording:protocol-2026-10-25:http:tcp-29:c2s:546 |
| POST /server_list [preferred_login_servers] | application/x-www-form-urlencoded | pb_login_servers | O D A | recording:protocol-2026-10-25:http:tcp-29:c2s:0 |
| POST /server_list [login_server] | application/x-www-form-urlencoded | pb_login_server | S | - |
| POST /server_list [login_server_state] | application/x-www-form-urlencoded | unknown | S | - |

## startup-config

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| GET /version_adr.txt | URL | json | O D | recording:protocol-2026-10-25:http:tcp-10:c2s:0 |
| GET /server_config.txt | URL | json | S | - |
| GET /:numeric-id-1088.html | - | - | O D | recording:protocol-2026-10-25:http:tcp-1:c2s:0 |
| GET /banner/28/368-banner.json | - | - | O | recording:protocol-2026-10-25:http:tcp-23:c2s:0 |
| GET /banner/28/android-banner.json | - | - | O | recording:protocol-2026-10-25:http:tcp-24:c2s:0 |

## telemetry

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| GET /ad/api/active | - | - | O | recording:protocol-2026-10-25:http:tcp-2:c2s:0 |
| GET /sdk/tracker/log | - | - | O D | recording:protocol-2026-10-25:http:tcp-9:c2s:0 |
| POST /ad/api/ip_address// | - | - | O | recording:protocol-2026-10-25:http:tcp-17:c2s:0 |
| POST /ad/api/ip_address/ | - | - | O | recording:protocol-2026-10-25:http:tcp-17:c2s:354 |
| GET /ad/api/register | - | - | O | recording:protocol-2026-10-25:http:tcp-25:c2s:3774 |
| GET /ad/api/login | - | - | O | recording:protocol-2026-10-25:http:tcp-66:c2s:967 |
