# P1 HERO-HEROLEASE implementation

Date: 2026-11-13

The server now routes `HeroLeaseCmd` 87201-87205 through
`personal-server/game/hero-lease-service.mjs`:

| type | request | response | behavior |
| ---: | --- | --- | --- |
| 87201 | `pb_lease_hero_place_req` | `pb_role_lease_hero` | Places owned heroes in slots 1-3. |
| 87202 | `pb_lease_hero_lease_req` | `pb_role_lease_hero` | Leases a placement from an existing same-guild role. |
| 87203 | `pb_lease_hero_give_back_req` | `pb_role_lease_hero` | Removes leased snapshots and matching lineup lease fighters. |
| 87204 | `pb_lease_hero_take_back_req` | `pb_role_lease_hero` | Removes the current role's placements. |
| 87205 | `pb_lease_hero_list_req` | `pb_lease_hero_list_rsp` | Lists only real same-guild placements. |

Module 143 retains all seven shipped slots. `func_tid=1` occupies slot zero.
`HeroLeaseTable` supplies the three-placement and three-lease limits,
`lua_module=GuildEmployMgr`, and Hook indexes 1-3. The reader fails startup if
the shipped row counts or limits change.

Lease and owner counter changes commit inside one `BEGIN IMMEDIATE` transaction.
A forced borrower write failure was verified to roll the owner updates back.
`6601 pb_lease_hero_change_notify` is role-targeted to the affected owner.

Verification: targeted tests 6/6 pass, including two real TCP sessions and a
targeted push. The fast suite has 251 tests with pass 249 / fail 0 / skipped 2.
The command audit is 1407 total, 1323 service routes, 18 gateway routes, 6
multi-owner commands and 60 unrouted. No live service, live database, ADB,
emulator or APK was touched.

Remaining evidence gaps: the client business send point for give-back was not
recovered; full fantasy/relic progression is absent from the current captured
hero record; friendship award `401900`, exact cross-day clearing, and whether
take-back revokes already active borrower snapshots remain unproven. The server
therefore does not issue an invented award, reset, or cross-role revocation.
