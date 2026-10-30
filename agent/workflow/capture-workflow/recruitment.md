# Recruitment Operation Evidence

2026-10-25, active recording `protocol-2026-10-25-r2a`, intended-account flow `tcp-69`. User entered recruitment and asked whether to click everything. Sampling was limited to one completion on the current page, without asking for extra purchases, repeated draws or an exhaustive pass through all pools. User alone operated the UI.

## Measured Operation

The screenshot before the operation shows the specified-adventurer selection page with a Complete Selection button. User selected an entry, clicked that button once and confirmed waiting10 seconds. Although the page appeared to be a separate selection step, this measured completion invoked `draw_hero` immediately. It must not be documented as a selection-only save endpoint. The after screenshot shows a character reveal, including the R-tier Star Child display. Screenshots remain ignored `recruitment-before.local-only.png` and `recruitment-after.local-only.png`.

Before marker `recruitment-page-before-draw`:1599 packets,152/152 immediate game payloads decoded. After marker `recruitment-target-selected`:1619 packets,160/160 immediate game payloads decoded,0 kernel drops; zero game gaps/conflicts/remaining frame bytes and zero packet/schema errors. Saved after revision SHA256 `dfec4300c938e5444e3556c02d106906ca1ae8f71ae6f34e9964184ae1535442`, decode time2026-10-25T11:33:09.873Z. These are checkpoint values while collection remains active.

| Contract | Evidence |
| --- | --- |
| Request | type601, seq69, `game:tcp-69:c2s:2646`, packets1604/1606 |
| Request codec | PB `pb_draw_hero`; present fields `draw_lib`, `specify_item_tid` |
| Response | matching seq69 and requestId, `game:tcp-69:s2c:39307`, packet1608 |
| Response codec | PB `hero_draw_back`; present `res`, `recruit_info` |
| Envelope error | None observed |
| Library comparison | Response `recruit_info.draw_lib` matches request `draw_lib` internally |
| Resources | Two change entries; one negative delta and one positive delta; second contains `extra` |
| Decomposition | No observed `decompose_args` or `pre_args` entries |
| UI outcome | Character reveal screenshot after user-confirmed completion |

Only this one business request occurred after the before checkpoint, apart from heartbeat traffic. Follow-on pushes in packet1610 include count-statistics type2000 and week-hunt-task type9131; they remain observed/decoded, without independent manual-operation acceptance or complete side-effect attribution.

## Shipped Contract And Limits

Request/response declarations are in `12882673578778366000-hero.net.proto.bin`, SHA256 `b013fb97f55cb108e158180e2b6f9e0c980f1d2647a8f2c929c8a1dfbe9b4c42`. The recovered `HeroCmd` encoder prototype2, first source line30, passes `draw_lib`, `draw_type`, `point_draw_num`, `extra_param` and `specify_item_tid` to `pb_draw_hero`. Its binary hash is `a4f06a508683f1af9399e9fa553c7b9ab9f0502694340386fee9731fb1c2a4d2`. The static catalog already links type601 and `hero_draw_back`.

The shipped comment describes `specify_item_tid` as a configured consumption item, not a direct hero UID field. Do not infer the selected-character mapping from that field name. This request omitted `draw_type`, `point_draw_num` and `extra_param`; protobuf default handling and enum semantics must be considered before labelling this single-draw or ten-draw. One user click does not itself establish a draw-count rule.

Resource identities/quantities remain local. The `extra` bytes, item-to-hero interpretation, selected-character mapping, prior/new balance reconciliation, guarantee counters, alternate pools, insufficient-resource paths and persistence after reconnect are unverified. No extra draws are needed merely to enlarge counts.

## Reproduction And Lifecycle

```powershell
node analysis/tools/protocol/inspect-recruitment.mjs analysis/captures/protocol-2026-10-25-r2a
node analysis/tools/protocol/build-interface-catalog.mjs
```

The inspector joins stable request/response references, asserts type/schema/seq/flow and absence of envelope errors, then writes only structural fields, counts and comparison/sign results to `recruitment-check.json`. It does not send traffic or publish scalar account/resource values. The action and references are recorded in `action-evidence.json`; merged references have the recording namespace prefix.

Capture remains active (PID4467/log4488, root=true at acceptance). User may complete or skip the reveal normally and continue guidance. Do not ask for every recruitment option to be clicked. On pause/end, Stop with the explicit r2a directory, preserve/decode/merge, clean the exact owned resources and restore root setting without restarting the user's game.
