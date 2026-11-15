# 逐活动阶段时间与转换事件

[完整JSON](activity-phases.json)登记全部1993条活动的阶段原字段、计算输入、结果和阻断，不把原阶段算法与当前排期政策混写。算法逐步说明、原函数/原型/哈希和覆盖优先级见[时间与阶段规则](../activity-rulebooks/time-and-stages.md)。

本次示例开服：2026-11-12T18:00:00+08:00；时间假设：tz=+08:00、Flush偏移=18000秒。tz是本次计算输入，原TimeKit运行时配置才决定原环境的实际时区。GetDayZero按原FlushTime算法，不等同自然午夜。

旧Activity仅对已核SERVER_TIME/WORLD_TIME计算原表fallback；神域/神域阶段及运行时custom实例另需输入。空state按原函数补0/50/99；0天不跳过。ActFrame的整体S/E只来自服务器实例，没有静态fallback；下列两列分别**假设**服务器start_time采用当前activityWindow的未平移/本服平移结果，再运行原GetStageTime。它们用于检查阶段算术，均不证明原服或当前运行实例实际采用这些S/E。权威stage_time_list优先于fallback；stage为空的811行保持未知，182603/182604缺阶段终点数组不补0。

表中只展示内部阶段；旧表NOT_OPEN[0,S)和END[E,4294967295)完整保存在JSON。旧表整体校验不通过时保留候选算术与具体失败项，不展示成可运行阶段。ActFrame阶段与假设总E不一致、零秒段或非连续边界均保留警示，不擅自裁剪。阶段名称是原枚举，是否允许某个业务/领奖还须看本家族消费者，不能仅凭50/60/90套通用门禁。

## 恢复与计算状态

|来源/状态|配置数|
|---|---:|
|ActFrameTable/server-stage-list-required|811|
|ActFrameTable/client-fallback-with-example-instance|69|
|ActFrameTable/incomplete-stage-arrays|2|
|ActFrameTable/no-server-instance|2|
|ActivityTable/client-table-default-running|869|
|ActivityTable/client-table-states|192|
|ActivityTable/divine-or-unknown-time-input-required|48|

## ActFrame：假设实例下的原GetStageTime结果

|活动ID / 版本|原阶段/天数/终点秒数组|未平移示例实例|本服平移示例实例|边界记录|
|---|---|---|---|---|
|62001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62011 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62012 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62021 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62022 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62023 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62024 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62025 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62026 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62027 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62028 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62029 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62030 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62031 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62032 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62033 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62034 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62035 / 19|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62036 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62037 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62038 / 22|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62039 / 23|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62040 / 24|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62041 / 25|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62042 / 26|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62043 / 27|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62044 / 28|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62045 / 29|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62046 / 30|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62047 / 31|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62048 / 32|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62049 / 33|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62050 / 34|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62051 / 35|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62052 / 36|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62053 / 37|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62054 / 38|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62055 / 39|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62056 / 40|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62057 / 41|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|62058 / 42|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93003 / 33|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93004 / 34|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93005 / 35|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93006 / 36|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93007 / 37|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93008 / 38|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93009 / 39|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93010 / 40|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93011 / 47|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93012 / 48|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93013 / 49|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93014 / 61|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93015 / 62|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93016 / 87|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93017 / 88|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93018 / 89|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93019 / 90|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93020 / 91|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93021 / 92|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93022 / 93|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93023 / 92|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93024 / 93|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93025 / 93|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93026 / 94|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93027 / 94|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93028 / 94|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93029 / 94|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93030 / 95|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93031 / 96|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93032 / 97|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93033 / 96|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93034 / 97|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93035 / 99|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93036 / 98|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93037 / 99|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93038 / 99|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93039 / 100|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93040 / 111|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93041 / 112|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93042 / 113|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93043 / 114|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93044 / 115|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93045 / 116|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93046 / 117|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93047 / 118|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93048 / 119|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93049 / 120|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93050 / 119|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93051 / 122|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93052 / 123|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93053 / 124|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93054 / 125|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93055 / 126|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93056 / 127|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93057 / 128|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93058 / 129|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93059 / 130|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93060 / 135|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93061 / 131|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93062 / 132|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93063 / 133|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93064 / 134|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93065 / 136|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93066 / 137|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93067 / 138|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93068 / 139|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93069 / 140|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93070 / 141|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93071 / 142|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93072 / 143|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93073 / 144|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|93074 / 145|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95012 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95015 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95016 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95017 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95018 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95019 / 19|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95020 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95021 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95022 / 22|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95023 / 23|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95024 / 24|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95025 / 25|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95026 / 26|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95027 / 27|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95028 / 28|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95029 / 29|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95030 / 30|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95031 / 31|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95032 / 32|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95033 / 41|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95034 / 42|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95035 / 43|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95036 / 44|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95037 / 45|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95038 / 46|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95039 / 51|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95040 / 52|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95041 / 53|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95042 / 54|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95043 / 55|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95044 / 56|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95045 / 57|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95046 / 58|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95047 / 59|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95048 / 60|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95049 / 63|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95050 / 64|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95051 / 65|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95052 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95053 / 67|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95054 / 68|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95055 / 69|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95056 / 70|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95057 / 71|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95058 / 72|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95059 / 73|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95060 / 74|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95061 / 75|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95062 / 76|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95063 / 77|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95064 / 78|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95065 / 79|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95066 / 80|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95067 / 81|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95068 / 82|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95069 / 83|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95070 / 84|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95071 / 85|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|95072 / 86|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|102201 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|102202 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|102203 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103012 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103015 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103016 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103017 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103018 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103019 / 19|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103020 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103021 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103022 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|103023 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105802 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105803 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105804 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105805 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105806 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105807 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105808 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105809 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105811 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|105812 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106012 / 12|`[[50],[6],[18000]]`|50 进行：2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|50 进行：2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|`[]`|
|106013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106015 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106016 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106017 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106018 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106019 / 19|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106020 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106021 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106022 / 22|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106023 / 23|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106024 / 24|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106025 / 25|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106026 / 26|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106027 / 27|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106028 / 28|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106029 / 29|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106031 / 31|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106033 / 33|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106034 / 34|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106035 / 35|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106036 / 36|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106037 / 37|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106038 / 38|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106039 / 39|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106040 / 40|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106041 / 41|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106042 / 42|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106043 / 43|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106044 / 44|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106045 / 45|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|106046 / 46|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108905 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108906 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108907 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108908 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108909 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108910 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108911 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108912 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|108913 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119001 / 101|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119002 / 102|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119003 / 103|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119004 / 104|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119005 / 105|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119006 / 106|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119007 / 101|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119008 / 102|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119009 / 103|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119010 / 104|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119011 / 105|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119012 / 106|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119013 / 101|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119014 / 102|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119015 / 103|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119016 / 104|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119017 / 105|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119018 / 106|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119019 / 101|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119020 / 102|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119021 / 103|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119022 / 104|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119023 / 105|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|119024 / 106|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|170001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|174001 / 1|`[[10,50,51,52,53,54,90],[2,14,14,14,14,4,3],[18000,18000,18000,18000,18000,18000,18000]]`|10 预热：2025-06-27 05:00:00+08:00 → 2025-06-29 05:00:00+08:00；50 进行：2025-06-29 05:00:00+08:00 → 2025-07-13 05:00:00+08:00；51 进行1：2025-07-13 05:00:00+08:00 → 2025-07-27 05:00:00+08:00；52 进行2：2025-07-27 05:00:00+08:00 → 2025-08-10 05:00:00+08:00；53 进行3：2025-08-10 05:00:00+08:00 → 2025-08-24 05:00:00+08:00；54 进行4：2025-08-24 05:00:00+08:00 → 2025-08-28 05:00:00+08:00；90 公示：2025-08-28 05:00:00+08:00 → 2025-08-31 05:00:00+08:00|10 预热：2025-06-27 05:00:00+08:00 → 2025-06-29 05:00:00+08:00；50 进行：2025-06-29 05:00:00+08:00 → 2025-07-13 05:00:00+08:00；51 进行1：2025-07-13 05:00:00+08:00 → 2025-07-27 05:00:00+08:00；52 进行2：2025-07-27 05:00:00+08:00 → 2025-08-10 05:00:00+08:00；53 进行3：2025-08-10 05:00:00+08:00 → 2025-08-24 05:00:00+08:00；54 进行4：2025-08-24 05:00:00+08:00 → 2025-08-28 05:00:00+08:00；90 公示：2025-08-28 05:00:00+08:00 → 2025-08-31 05:00:00+08:00|`[]`|
|175001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|175002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|175003 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|175004 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|175005 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|175006 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|175007 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176003 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176004 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176005 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176006 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176007 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|176008 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|177001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|177002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|177003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|177004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|177005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|178001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|178002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|178003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|180001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182012 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182014 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182015 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182016 / 22|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182017 / 23|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182018 / 24|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182019 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182020 / 501|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182021 / 25|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182026 / 26|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182028 / 28|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182029 / 29|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182030 / 30|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182031 / 31|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182032 / 32|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182101 / 101|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182203 / 203|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182204 / 204|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182205 / 205|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182206 / 206|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182207 / 207|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182208 / 208|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182209 / 209|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182210 / 210|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182211 / 211|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182212 / 212|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182502 / 502|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182503 / 503|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182504 / 504|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182505 / 505|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182506 / 506|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182507 / 507|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182508 / 508|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182509 / 509|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182510 / 510|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182511 / 511|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182601 / 602|`[[50],[30],[0]]`|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-28 00:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-28 00:00:00+08:00|`[]`|
|182603 / 603|`[[50],[26],[]]`|未生成阶段：incomplete-stage-arrays|未生成阶段：incomplete-stage-arrays|`"incomplete-stage-arrays"`|
|182604 / 604|`[[50],[26],[]]`|未生成阶段：incomplete-stage-arrays|未生成阶段：incomplete-stage-arrays|`"incomplete-stage-arrays"`|
|182605 / 605|`[[50],[30],[0]]`|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|`[]`|
|182606 / 606|`[[50],[30],[0]]`|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|`[]`|
|182607 / 607|`[[50],[15],[0]]`|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-26 00:00:00+08:00|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-26 00:00:00+08:00|`[]`|
|182608 / 608|`[[50],[7],[0]]`|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 00:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 00:00:00+08:00|`[]`|
|182609 / 608|`[[50],[7],[0]]`|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-26 00:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-26 00:00:00+08:00|`[]`|
|182610 / 608|`[[50],[7],[0]]`|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-03 00:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-03 00:00:00+08:00|`[]`|
|182611 / 608|`[[50],[7],[0]]`|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-10 00:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-10 00:00:00+08:00|`[]`|
|182810 / 801|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182811 / 801|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182812 / 801|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182813 / 801|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182814 / 802|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182815 / 803|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182816 / 804|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182817 / 803|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182818 / 805|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|182819 / 802|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183004 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183007 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183012 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183015 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183016 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183017 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183018 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|183019 / 19|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184003 / 102|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184004 / 103|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184005 / 100|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184006 / 101|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184007 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184008 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184009 / 106|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184010 / 107|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184011 / 104|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184012 / 105|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184013 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184014 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184015 / 111|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184016 / 108|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184017 / 109|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184018 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184019 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184020 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184021 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184022 / 601|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184023 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184027 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184028 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184029 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184030 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184031 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184032 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184114 / 110|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184202 / 202|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184205 / 205|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184206 / 206|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184207 / 207|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184208 / 208|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184301 / 301|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184304 / 304|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184305 / 305|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184306 / 306|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184319 / 319|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184320 / 320|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184401 / 401|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184402 / 402|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184403 / 403|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184404 / 404|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184405 / 405|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184406 / 406|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184407 / 407|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184408 / 408|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184409 / 409|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184410 / 410|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184411 / 411|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184501 / 501|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184503 / 510|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184504 / 511|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184505 / 603|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184506 / 604|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184507 / 605|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184702 / 702|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184703 / 703|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184704 / 704|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184705 / 705|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184706 / 706|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184707 / 707|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184708 / 708|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184709 / 709|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184710 / 709|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|184711 / 709|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|185001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|185002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|185018 / 512|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186302 / 302|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186303 / 303|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186307 / 307|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186308 / 308|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186309 / 309|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186310 / 310|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186311 / 311|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186312 / 312|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186313 / 313|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186314 / 314|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186315 / 315|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186316 / 317|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186317 / 316|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186318 / 318|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186319 / 322|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186321 / 321|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186323 / 323|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186324 / 324|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186325 / 325|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186420 / 901|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186421 / 418|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186502 / 502|`[[10,50],[1,5],[18000,18000]]`|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`[]`|
|186503 / 503|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186504 / 504|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186505 / 505|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186506 / 506|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186507 / 507|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186508 / 508|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186509 / 509|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186511 / 513|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186512 / 514|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186513 / 515|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186516 / 516|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186701 / 701|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186702 / 702|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186703 / 703|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186704 / 704|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186801 / 801|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|186802 / 801|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187016 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187017 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187018 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187019 / 403|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187020 / 404|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187021 / 405|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187310 / 310|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187311 / 311|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187312 / 312|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187313 / 313|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187314 / 314|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187315 / 315|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187316 / 317|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187317 / 316|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187319 / 318|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187320 / 320|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187321 / 321|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|187325 / 325|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188044 / 60|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188045 / 61|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188046 / 60|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188047 / 60|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188048 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188049 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188050 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188051 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188052 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188054 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188055 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|188056 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|190001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|200001 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|200002 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|200003 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|200005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1001001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1001002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1001003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1002001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1002002 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1002003 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1002004 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1002005 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1003001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1003002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1003003 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1003004 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1003005 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1003006 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004004 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004005 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004006 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004007 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004008 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004009 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004010 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004011 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004012 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004013 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1004014 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1005001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1006001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1006002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1006003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1006004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1006005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1006006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007001 / 201|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007002 / 202|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007003 / 203|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007005 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007006 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007007 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1007101 / 204|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1008001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1008004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1008005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1008006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009012 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009015 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009023 / 23|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009024 / 24|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009025 / 26|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009030 / 30|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009031 / 31|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009032 / 32|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009033 / 33|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009034 / 34|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009035 / 35|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009036 / 36|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009038 / 38|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009039 / 39|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009040 / 40|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009041 / 41|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009320 / 320|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1009325 / 325|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1012001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1013008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1015002 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1015003 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1015004 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1015005 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1015006 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1016001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1016004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1016005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1016006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1016319 / 319|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017008 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017009 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017010 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017011 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017012 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017013 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017014 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017015 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017016 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017017 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017018 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017019 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017020 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017022 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1017025 / 25|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018012 / 12|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018015 / 15|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018016 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018017 / 16|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018019 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018020 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018021 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1018025 / 25|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019310 / 310|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019311 / 311|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019312 / 312|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019313 / 313|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019314 / 314|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019315 / 315|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019316 / 317|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019317 / 316|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019319 / 318|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019320 / 320|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019321 / 321|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1019325 / 325|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1020010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1021010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023016 / 16|`[[10,50],[1,5],[18000,18000]]`|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`[]`|
|1023017 / 17|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023018 / 18|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023019 / 19|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023020 / 20|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023021 / 21|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023022 / 22|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023023 / 25|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023027 / 27|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023028 / 28|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023220 / 204|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023221 / 205|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023222 / 206|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023223 / 207|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023224 / 208|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023225 / 209|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1023321 / 321|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1024001 / 1|`[[50,90],[3,1],[79200,18000]]`|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-15 22:00:00+08:00；90 公示：2026-11-15 22:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-15 22:00:00+08:00；90 公示：2026-11-15 22:00:00+08:00 → 2026-11-16 05:00:00+08:00|`[]`|
|1024002 / 2|`[[50,90],[3,1],[79200,18000]]`|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-22 22:00:00+08:00；90 公示：2026-11-22 22:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-22 22:00:00+08:00；90 公示：2026-11-22 22:00:00+08:00 → 2026-11-23 05:00:00+08:00|`[]`|
|1024003 / 3|`[[50,90],[3,1],[79200,18000]]`|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-29 22:00:00+08:00；90 公示：2026-11-29 22:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-29 22:00:00+08:00；90 公示：2026-11-29 22:00:00+08:00 → 2026-11-30 05:00:00+08:00|`[]`|
|1024004 / 4|`[[50,90],[3,1],[79200,18000]]`|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-06 22:00:00+08:00；90 公示：2026-12-06 22:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-06 22:00:00+08:00；90 公示：2026-12-06 22:00:00+08:00 → 2026-12-07 05:00:00+08:00|`[]`|
|1033001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1035001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036002 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036003 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036004 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036005 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036006 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036007 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1036008 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1037001 / 10|`[[50,90],[3,1],[79200,18000]]`|未生成阶段：no-server-instance|未生成阶段：no-server-instance|`"no-server-instance"`|
|1037002 / 11|`[[50,90],[3,1],[79200,18000]]`|未生成阶段：no-server-instance|未生成阶段：no-server-instance|`"no-server-instance"`|
|1039002 / 2|`[[10,50],[1,5],[18000,18000]]`|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`[]`|
|1039003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1039004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1039005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1039006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1039007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1039008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1039009 / 9|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-06-18 05:00:00+08:00 → 2026-06-22 21:59:00+08:00；90 公示：2026-06-22 21:59:00+08:00 → 2026-06-22 23:59:00+08:00|50 进行：2026-06-18 05:00:00+08:00 → 2026-06-22 21:59:00+08:00；90 公示：2026-06-22 21:59:00+08:00 → 2026-06-22 23:59:00+08:00|`[]`|
|1039011 / 11|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-07-18 05:00:00+08:00 → 2026-07-22 21:59:00+08:00；90 公示：2026-07-22 21:59:00+08:00 → 2026-07-22 23:59:00+08:00|50 进行：2026-07-18 05:00:00+08:00 → 2026-07-22 21:59:00+08:00；90 公示：2026-07-22 21:59:00+08:00 → 2026-07-22 23:59:00+08:00|`[]`|
|1039012 / 12|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-08-17 05:00:00+08:00 → 2026-08-21 21:59:00+08:00；90 公示：2026-08-21 21:59:00+08:00 → 2026-08-21 23:59:00+08:00|50 进行：2026-08-17 05:00:00+08:00 → 2026-08-21 21:59:00+08:00；90 公示：2026-08-21 21:59:00+08:00 → 2026-08-21 23:59:00+08:00|`[]`|
|1039013 / 13|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 21:59:00+08:00；90 公示：2026-11-16 21:59:00+08:00 → 2026-11-16 23:59:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 21:59:00+08:00；90 公示：2026-11-16 21:59:00+08:00 → 2026-11-16 23:59:00+08:00|`[]`|
|1039014 / 14|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-09-26 05:00:00+08:00 → 2026-09-30 21:59:00+08:00；90 公示：2026-09-30 21:59:00+08:00 → 2026-09-30 23:59:00+08:00|50 进行：2026-09-26 05:00:00+08:00 → 2026-09-30 21:59:00+08:00；90 公示：2026-09-30 21:59:00+08:00 → 2026-09-30 23:59:00+08:00|`[]`|
|1040002 / 2|`[[10,50],[1,5],[18000,18000]]`|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|10 预热：2026-04-03 05:00:00+08:00 → 2026-04-04 05:00:00+08:00；50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`[]`|
|1040003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040012 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040013 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1040014 / 14|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1050001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1050002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1050003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1050004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1050005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1051001 / 1|`[[50,90],[3,1],[79200,18000]]`|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-17 22:00:00+08:00；90 公示：2026-11-17 22:00:00+08:00 → 2026-11-18 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-17 22:00:00+08:00；90 公示：2026-11-17 22:00:00+08:00 → 2026-11-18 05:00:00+08:00|`[]`|
|1051002 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1051003 / 1|`[[50,90],[3,1],[79200,18000]]`|50 进行：2026-05-10 05:00:00+08:00 → 2026-05-13 22:00:00+08:00；90 公示：2026-05-13 22:00:00+08:00 → 2026-05-14 05:00:00+08:00|50 进行：2026-05-10 05:00:00+08:00 → 2026-05-13 22:00:00+08:00；90 公示：2026-05-13 22:00:00+08:00 → 2026-05-14 05:00:00+08:00|`[]`|
|1051004 / 1|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；90 公示：2026-11-16 22:00:00+08:00 → 2026-11-18 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；90 公示：2026-11-16 22:00:00+08:00 → 2026-11-18 05:00:00+08:00|`[]`|
|1051005 / 5|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；90 公示：2026-11-16 22:00:00+08:00 → 2026-11-18 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；90 公示：2026-11-16 22:00:00+08:00 → 2026-11-18 05:00:00+08:00|`[]`|
|1051006 / 1|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-21 22:00:00+08:00；90 公示：2026-11-21 22:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-21 22:00:00+08:00；90 公示：2026-11-21 22:00:00+08:00 → 2026-11-23 05:00:00+08:00|`[]`|
|1051007 / 2|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-29 05:00:00+08:00 → 2026-12-01 22:00:00+08:00；90 公示：2026-12-01 22:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-29 05:00:00+08:00 → 2026-12-01 22:00:00+08:00；90 公示：2026-12-01 22:00:00+08:00 → 2026-12-03 05:00:00+08:00|`[]`|
|1051008 / 7|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-18 05:00:00+08:00 → 2026-11-20 22:00:00+08:00；90 公示：2026-11-20 22:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-18 05:00:00+08:00 → 2026-11-20 22:00:00+08:00；90 公示：2026-11-20 22:00:00+08:00 → 2026-11-22 05:00:00+08:00|`[]`|
|1051009 / 7|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-07-04 05:00:00+08:00 → 2026-07-06 22:00:00+08:00；90 公示：2026-07-06 22:00:00+08:00 → 2026-07-08 05:00:00+08:00|50 进行：2026-07-04 05:00:00+08:00 → 2026-07-06 22:00:00+08:00；90 公示：2026-07-06 22:00:00+08:00 → 2026-07-08 05:00:00+08:00|`[]`|
|1051010 / 1|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-21 22:00:00+08:00；90 公示：2026-11-21 22:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-21 22:00:00+08:00；90 公示：2026-11-21 22:00:00+08:00 → 2026-11-23 05:00:00+08:00|`[]`|
|1051011 / 2|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-29 05:00:00+08:00 → 2026-12-01 22:00:00+08:00；90 公示：2026-12-01 22:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-29 05:00:00+08:00 → 2026-12-01 22:00:00+08:00；90 公示：2026-12-01 22:00:00+08:00 → 2026-12-03 05:00:00+08:00|`[]`|
|1051012 / 10|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-11-22 05:00:00+08:00 → 2026-11-24 22:00:00+08:00；90 公示：2026-11-24 22:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-22 05:00:00+08:00 → 2026-11-24 22:00:00+08:00；90 公示：2026-11-24 22:00:00+08:00 → 2026-11-26 05:00:00+08:00|`[]`|
|1051013 / 11|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-08 22:00:00+08:00；90 公示：2026-12-08 22:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-08 22:00:00+08:00；90 公示：2026-12-08 22:00:00+08:00 → 2026-12-10 05:00:00+08:00|`[]`|
|1051031 / 4|`[[50,90],[3,1],[79200,18000]]`|50 进行：2026-05-04 05:00:00+08:00 → 2026-05-07 22:00:00+08:00；90 公示：2026-05-07 22:00:00+08:00 → 2026-05-08 05:00:00+08:00|50 进行：2026-05-04 05:00:00+08:00 → 2026-05-07 22:00:00+08:00；90 公示：2026-05-07 22:00:00+08:00 → 2026-05-08 05:00:00+08:00|`[]`|
|1051032 / 13|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1051041 / 4|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-05-25 05:00:00+08:00 → 2026-05-27 22:00:00+08:00；90 公示：2026-05-27 22:00:00+08:00 → 2026-05-29 05:00:00+08:00|50 进行：2026-05-25 05:00:00+08:00 → 2026-05-27 22:00:00+08:00；90 公示：2026-05-27 22:00:00+08:00 → 2026-05-29 05:00:00+08:00|`[]`|
|1051051 / 4|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-06-14 05:00:00+08:00 → 2026-06-16 22:00:00+08:00；90 公示：2026-06-16 22:00:00+08:00 → 2026-06-18 05:00:00+08:00|50 进行：2026-06-14 05:00:00+08:00 → 2026-06-16 22:00:00+08:00；90 公示：2026-06-16 22:00:00+08:00 → 2026-06-18 05:00:00+08:00|`[]`|
|1059001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060001 / 29|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060002 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060003 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060004 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060005 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060011 / 37|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060012 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060013 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060014 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1060015 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1065211 / 211|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1065212 / 212|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1065213 / 213|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1065214 / 214|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1074001 / 1|`[[50,90],[4,1],[79200,18000]]`|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；90 公示：2026-07-02 22:00:00+08:00 → 2026-07-03 05:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；90 公示：2026-07-02 22:00:00+08:00 → 2026-07-03 05:00:00+08:00|`[]`|
|1074002 / 2|`[[50,90],[4,1],[79200,18000]]`|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；90 公示：2026-07-02 22:00:00+08:00 → 2026-07-03 05:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；90 公示：2026-07-02 22:00:00+08:00 → 2026-07-03 05:00:00+08:00|`[]`|
|1074003 / 3|`[[50,90],[4,1],[79200,18000]]`|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；90 公示：2026-11-16 22:00:00+08:00 → 2026-11-17 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；90 公示：2026-11-16 22:00:00+08:00 → 2026-11-17 05:00:00+08:00|`[]`|
|1074004 / 4|`[[50,90],[4,1],[79200,18000]]`|50 进行：2026-07-08 05:00:00+08:00 → 2026-07-12 22:00:00+08:00；90 公示：2026-07-12 22:00:00+08:00 → 2026-07-13 05:00:00+08:00|50 进行：2026-07-08 05:00:00+08:00 → 2026-07-12 22:00:00+08:00；90 公示：2026-07-12 22:00:00+08:00 → 2026-07-13 05:00:00+08:00|`[]`|
|1074005 / 5|`[[50,90],[4,1],[79200,18000]]`|50 进行：2026-11-22 05:00:00+08:00 → 2026-11-26 22:00:00+08:00；90 公示：2026-11-26 22:00:00+08:00 → 2026-11-27 05:00:00+08:00|50 进行：2026-11-22 05:00:00+08:00 → 2026-11-26 22:00:00+08:00；90 公示：2026-11-26 22:00:00+08:00 → 2026-11-27 05:00:00+08:00|`[]`|
|1074006 / 6|`[[50,90],[4,1],[79200,18000]]`|50 进行：2026-07-18 05:00:00+08:00 → 2026-07-22 22:00:00+08:00；90 公示：2026-07-22 22:00:00+08:00 → 2026-07-23 05:00:00+08:00|50 进行：2026-07-18 05:00:00+08:00 → 2026-07-22 22:00:00+08:00；90 公示：2026-07-22 22:00:00+08:00 → 2026-07-23 05:00:00+08:00|`[]`|
|1074007 / 7|`[[50,90],[4,1],[79200,18000]]`|50 进行：2026-12-02 05:00:00+08:00 → 2026-12-06 22:00:00+08:00；90 公示：2026-12-06 22:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-02 05:00:00+08:00 → 2026-12-06 22:00:00+08:00；90 公示：2026-12-06 22:00:00+08:00 → 2026-12-07 05:00:00+08:00|`[]`|
|1074008 / 8|`[[50,90],[4,1],[79200,0]]`|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-01 22:00:00+08:00；90 公示：2026-08-01 22:00:00+08:00 → 2026-08-02 00:00:00+08:00|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-01 22:00:00+08:00；90 公示：2026-08-01 22:00:00+08:00 → 2026-08-02 00:00:00+08:00|`[]`|
|1074009 / 9|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-08-27 05:00:00+08:00 → 2026-08-31 21:59:00+08:00；90 公示：2026-08-31 21:59:00+08:00 → 2026-08-31 23:59:00+08:00|50 进行：2026-08-27 05:00:00+08:00 → 2026-08-31 21:59:00+08:00；90 公示：2026-08-31 21:59:00+08:00 → 2026-08-31 23:59:00+08:00|`[]`|
|1074010 / 10|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 21:59:00+08:00；90 公示：2026-12-07 21:59:00+08:00 → 2026-12-07 23:59:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 21:59:00+08:00；90 公示：2026-12-07 21:59:00+08:00 → 2026-12-07 23:59:00+08:00|`[]`|
|1074011 / 11|`[[50,90],[4,0],[79140,86340]]`|50 进行：2026-10-06 05:00:00+08:00 → 2026-10-10 21:59:00+08:00；90 公示：2026-10-10 21:59:00+08:00 → 2026-10-10 23:59:00+08:00|50 进行：2026-10-06 05:00:00+08:00 → 2026-10-10 21:59:00+08:00；90 公示：2026-10-10 21:59:00+08:00 → 2026-10-10 23:59:00+08:00|`[]`|
|1080001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1080002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1080003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1080004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1085001 / 2|`[[50,51,52,53,54,55,90],[4,5,5,5,5,5,1],[79200,79200,79200,79200,79200,79200,0]]`|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；51 进行1：2026-07-02 22:00:00+08:00 → 2026-07-07 22:00:00+08:00；52 进行2：2026-07-07 22:00:00+08:00 → 2026-07-12 22:00:00+08:00；53 进行3：2026-07-12 22:00:00+08:00 → 2026-07-17 22:00:00+08:00；54 进行4：2026-07-17 22:00:00+08:00 → 2026-07-22 22:00:00+08:00；55 进行5：2026-07-22 22:00:00+08:00 → 2026-07-27 22:00:00+08:00；90 公示：2026-07-27 22:00:00+08:00 → 2026-07-28 00:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；51 进行1：2026-07-02 22:00:00+08:00 → 2026-07-07 22:00:00+08:00；52 进行2：2026-07-07 22:00:00+08:00 → 2026-07-12 22:00:00+08:00；53 进行3：2026-07-12 22:00:00+08:00 → 2026-07-17 22:00:00+08:00；54 进行4：2026-07-17 22:00:00+08:00 → 2026-07-22 22:00:00+08:00；55 进行5：2026-07-22 22:00:00+08:00 → 2026-07-27 22:00:00+08:00；90 公示：2026-07-27 22:00:00+08:00 → 2026-07-28 00:00:00+08:00|`[]`|
|1085003 / 3|`[[50,51,52,53,54,90],[4,5,5,5,5,2],[79200,79200,79200,79200,79200,18000]]`|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；51 进行1：2026-07-02 22:00:00+08:00 → 2026-07-07 22:00:00+08:00；52 进行2：2026-07-07 22:00:00+08:00 → 2026-07-12 22:00:00+08:00；53 进行3：2026-07-12 22:00:00+08:00 → 2026-07-17 22:00:00+08:00；54 进行4：2026-07-17 22:00:00+08:00 → 2026-07-22 22:00:00+08:00；90 公示：2026-07-22 22:00:00+08:00 → 2026-07-24 05:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-02 22:00:00+08:00；51 进行1：2026-07-02 22:00:00+08:00 → 2026-07-07 22:00:00+08:00；52 进行2：2026-07-07 22:00:00+08:00 → 2026-07-12 22:00:00+08:00；53 进行3：2026-07-12 22:00:00+08:00 → 2026-07-17 22:00:00+08:00；54 进行4：2026-07-17 22:00:00+08:00 → 2026-07-22 22:00:00+08:00；90 公示：2026-07-22 22:00:00+08:00 → 2026-07-24 05:00:00+08:00|`[]`|
|1085004 / 4|`[[50,51,52,53,54,90],[4,5,5,5,5,2],[79200,79200,79200,79200,79200,18000]]`|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；51 进行1：2026-11-16 22:00:00+08:00 → 2026-11-21 22:00:00+08:00；52 进行2：2026-11-21 22:00:00+08:00 → 2026-11-26 22:00:00+08:00；53 进行3：2026-11-26 22:00:00+08:00 → 2026-12-01 22:00:00+08:00；54 进行4：2026-12-01 22:00:00+08:00 → 2026-12-06 22:00:00+08:00；90 公示：2026-12-06 22:00:00+08:00 → 2026-12-08 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 22:00:00+08:00；51 进行1：2026-11-16 22:00:00+08:00 → 2026-11-21 22:00:00+08:00；52 进行2：2026-11-21 22:00:00+08:00 → 2026-11-26 22:00:00+08:00；53 进行3：2026-11-26 22:00:00+08:00 → 2026-12-01 22:00:00+08:00；54 进行4：2026-12-01 22:00:00+08:00 → 2026-12-06 22:00:00+08:00；90 公示：2026-12-06 22:00:00+08:00 → 2026-12-08 05:00:00+08:00|`[]`|
|1085005 / 5|`[[50,51,52,53,54,55,90],[4,5,5,5,5,5,1],[79200,79200,79200,79200,79200,79200,0]]`|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-01 22:00:00+08:00；51 进行1：2026-08-01 22:00:00+08:00 → 2026-08-06 22:00:00+08:00；52 进行2：2026-08-06 22:00:00+08:00 → 2026-08-11 22:00:00+08:00；53 进行3：2026-08-11 22:00:00+08:00 → 2026-08-16 22:00:00+08:00；54 进行4：2026-08-16 22:00:00+08:00 → 2026-08-21 22:00:00+08:00；55 进行5：2026-08-21 22:00:00+08:00 → 2026-08-26 22:00:00+08:00；90 公示：2026-08-26 22:00:00+08:00 → 2026-08-27 00:00:00+08:00|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-01 22:00:00+08:00；51 进行1：2026-08-01 22:00:00+08:00 → 2026-08-06 22:00:00+08:00；52 进行2：2026-08-06 22:00:00+08:00 → 2026-08-11 22:00:00+08:00；53 进行3：2026-08-11 22:00:00+08:00 → 2026-08-16 22:00:00+08:00；54 进行4：2026-08-16 22:00:00+08:00 → 2026-08-21 22:00:00+08:00；55 进行5：2026-08-21 22:00:00+08:00 → 2026-08-26 22:00:00+08:00；90 公示：2026-08-26 22:00:00+08:00 → 2026-08-27 00:00:00+08:00|`[]`|
|1085006 / 6|`[[50,51,52,90],[4,5,5,1],[79200,79200,79200,0]]`|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-15 22:00:00+08:00；51 进行1：2026-09-15 22:00:00+08:00 → 2026-09-20 22:00:00+08:00；52 进行2：2026-09-20 22:00:00+08:00 → 2026-09-25 22:00:00+08:00；90 公示：2026-09-25 22:00:00+08:00 → 2026-09-26 00:00:00+08:00|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-15 22:00:00+08:00；51 进行1：2026-09-15 22:00:00+08:00 → 2026-09-20 22:00:00+08:00；52 进行2：2026-09-20 22:00:00+08:00 → 2026-09-25 22:00:00+08:00；90 公示：2026-09-25 22:00:00+08:00 → 2026-09-26 00:00:00+08:00|`[]`|
|1085007 / 7|`[[50,90],[6,1],[43200,0]]`|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-18 12:00:00+08:00；90 公示：2026-11-18 12:00:00+08:00 → 2026-11-19 00:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-18 12:00:00+08:00；90 公示：2026-11-18 12:00:00+08:00 → 2026-11-19 00:00:00+08:00|`[]`|
|1085008 / 8|`[[50,90],[6,1],[43200,0]]`|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-25 12:00:00+08:00；90 公示：2026-11-25 12:00:00+08:00 → 2026-11-26 00:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-25 12:00:00+08:00；90 公示：2026-11-25 12:00:00+08:00 → 2026-11-26 00:00:00+08:00|`[]`|
|1085009 / 9|`[[50,90],[6,1],[43200,0]]`|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-02 12:00:00+08:00；90 公示：2026-12-02 12:00:00+08:00 → 2026-12-03 00:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-02 12:00:00+08:00；90 公示：2026-12-02 12:00:00+08:00 → 2026-12-03 00:00:00+08:00|`[]`|
|1085010 / 10|`[[50,90],[6,1],[43200,0]]`|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-09 12:00:00+08:00；90 公示：2026-12-09 12:00:00+08:00 → 2026-12-10 00:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-09 12:00:00+08:00；90 公示：2026-12-09 12:00:00+08:00 → 2026-12-10 00:00:00+08:00|`[]`|
|1088005 / 6|`[[50,90],[2,2],[79200,18000]]`|50 进行：2026-07-04 05:00:00+08:00 → 2026-07-06 22:00:00+08:00；90 公示：2026-07-06 22:00:00+08:00 → 2026-07-08 05:00:00+08:00|50 进行：2026-07-04 05:00:00+08:00 → 2026-07-06 22:00:00+08:00；90 公示：2026-07-06 22:00:00+08:00 → 2026-07-08 05:00:00+08:00|`[]`|
|1088006 / 6|`[[50,90],[2,2],[79200,0]]`|50 进行：2026-07-24 05:00:00+08:00 → 2026-07-26 22:00:00+08:00；90 公示：2026-07-26 22:00:00+08:00 → 2026-07-28 00:00:00+08:00|50 进行：2026-07-24 05:00:00+08:00 → 2026-07-26 22:00:00+08:00；90 公示：2026-07-26 22:00:00+08:00 → 2026-07-28 00:00:00+08:00|`[]`|
|1088008 / 8|`[[50,90],[2,2],[79200,0]]`|50 进行：2026-08-13 05:00:00+08:00 → 2026-08-15 22:00:00+08:00；90 公示：2026-08-15 22:00:00+08:00 → 2026-08-17 00:00:00+08:00|50 进行：2026-08-13 05:00:00+08:00 → 2026-08-15 22:00:00+08:00；90 公示：2026-08-15 22:00:00+08:00 → 2026-08-17 00:00:00+08:00|`[]`|
|1088009 / 9|`[[50,90],[2,2],[79200,0]]`|50 进行：2026-09-02 05:00:00+08:00 → 2026-09-04 22:00:00+08:00；90 公示：2026-09-04 22:00:00+08:00 → 2026-09-06 00:00:00+08:00|50 进行：2026-09-02 05:00:00+08:00 → 2026-09-04 22:00:00+08:00；90 公示：2026-09-04 22:00:00+08:00 → 2026-09-06 00:00:00+08:00|`[]`|
|1088010 / 9|`[[50,90],[2,2],[79200,0]]`|50 进行：2026-09-22 05:00:00+08:00 → 2026-09-24 22:00:00+08:00；90 公示：2026-09-24 22:00:00+08:00 → 2026-09-26 00:00:00+08:00|50 进行：2026-09-22 05:00:00+08:00 → 2026-09-24 22:00:00+08:00；90 公示：2026-09-24 22:00:00+08:00 → 2026-09-26 00:00:00+08:00|`[]`|
|1088011 / 9|`[[50,90],[2,2],[79200,0]]`|50 进行：2026-10-12 05:00:00+08:00 → 2026-10-14 22:00:00+08:00；90 公示：2026-10-14 22:00:00+08:00 → 2026-10-16 00:00:00+08:00|50 进行：2026-10-12 05:00:00+08:00 → 2026-10-14 22:00:00+08:00；90 公示：2026-10-14 22:00:00+08:00 → 2026-10-16 00:00:00+08:00|`[]`|
|1088012 / 9|`[[50,90],[2,2],[79200,0]]`|50 进行：2026-11-01 05:00:00+08:00 → 2026-11-03 22:00:00+08:00；90 公示：2026-11-03 22:00:00+08:00 → 2026-11-05 00:00:00+08:00|50 进行：2026-11-01 05:00:00+08:00 → 2026-11-03 22:00:00+08:00；90 公示：2026-11-03 22:00:00+08:00 → 2026-11-05 00:00:00+08:00|`[]`|
|1088013 / 9|`[[50,90],[2,2],[79200,0]]`|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-23 22:00:00+08:00；90 公示：2026-11-23 22:00:00+08:00 → 2026-11-25 00:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-23 22:00:00+08:00；90 公示：2026-11-23 22:00:00+08:00 → 2026-11-25 00:00:00+08:00|`[]`|
|1095001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1095002 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1095003 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1095004 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1096001 / 1|`[[50,90],[5,29],[18000,18000]]`|50 进行：2026-09-06 05:00:00+08:00 → 2026-09-11 05:00:00+08:00；90 公示：2026-09-11 05:00:00+08:00 → 2026-10-10 05:00:00+08:00|50 进行：2026-09-06 05:00:00+08:00 → 2026-09-11 05:00:00+08:00；90 公示：2026-09-11 05:00:00+08:00 → 2026-10-10 05:00:00+08:00|`[]`|
|1101001 / 1|`[[50,90],[4,0],[79200,86340]]`|50 进行：2026-09-16 05:00:00+08:00 → 2026-09-20 22:00:00+08:00；90 公示：2026-09-20 22:00:00+08:00 → 2026-09-20 23:59:00+08:00|50 进行：2026-09-16 05:00:00+08:00 → 2026-09-20 22:00:00+08:00；90 公示：2026-09-20 22:00:00+08:00 → 2026-09-20 23:59:00+08:00|`[]`|
|1101002 / 2|`[[50,90],[4,0],[79200,86340]]`|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 22:00:00+08:00；90 公示：2026-11-23 22:00:00+08:00 → 2026-11-23 23:59:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 22:00:00+08:00；90 公示：2026-11-23 22:00:00+08:00 → 2026-11-23 23:59:00+08:00|`[]`|
|1102001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102004 / 4|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102005 / 5|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102006 / 6|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102007 / 7|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102008 / 8|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102009 / 9|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1102010 / 10|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1302001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1304001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1369001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1634001 / 1|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1634002 / 2|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1634003 / 3|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841001 / 1001|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841002 / 1004|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841003 / 1004|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841004 / 1004|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841005 / 1002|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841006 / 1003|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841007 / 1005|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841008 / 1003|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841009 / 1006|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1841010 / 1002|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|1880523 / 66|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|
|10210011 / 11|`[[],[],[]]`|未生成阶段：server-stage-list-required|未生成阶段：server-stage-list-required|`"Empty cfg.stage is not a RUNNING fallback; authoritative stage_time_list was not supplied."`|

## 旧Activity：原表SERVER/WORLD默认阶段

本表假设函数选出的开服时间等于本服输入来计算相对活动；原Func.data_type/cross_type保存在JSON，跨服分支可能需要主服开服时间，未取得该动态输入时不能把示例当实际跨服窗口。WORLD仍用原world_time，不使用当前世界时间平移政策。服务器有效custom窗口可改变S/E和cursorDay基点，因此这仍是无custom覆盖的条件fallback，不能替代真实实例。DIVINE两类逐项登记为需要运行输入。

|活动ID / 版本|原阶段/天数/终点秒数组|原客户端窗口S/E（假设输入）|原客户端阶段|状态与边界记录|
|---|---|---|---|---|
|9001 / 1|`[[],[],[]]`|2026-11-12 00:00:00+08:00 → 2054-03-29 00:00:00+08:00|50 进行：2026-11-12 00:00:00+08:00 → 2054-03-29 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|12003 / 1|`[[50,60,90],[2,0,0],[75600,79200,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-14 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-14 21:00:00+08:00；60 通知/领奖：2026-11-14 21:00:00+08:00 → 2026-11-14 22:00:00+08:00；90 公示：2026-11-14 22:00:00+08:00 → 2026-11-14 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12004 / 2|`[[10,50],[1,4],[18000,18000]]`|2026-11-14 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|10 预热：2026-11-14 05:00:00+08:00 → 2026-11-15 05:00:00+08:00；50 进行：2026-11-15 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12005 / 3|`[[50,60,90],[1,0,0],[75600,79200,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-13 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-13 21:00:00+08:00；60 通知/领奖：2026-11-13 21:00:00+08:00 → 2026-11-13 22:00:00+08:00；90 公示：2026-11-13 22:00:00+08:00 → 2026-11-13 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12006 / 4|`[[50],[3],[18000]]`|2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12007 / 5|`[[50,90],[4,1],[75600,82800]]`|2026-11-17 05:00:00+08:00 → 2026-11-22 23:00:00+08:00|50 进行：2026-11-17 05:00:00+08:00 → 2026-11-21 21:00:00+08:00；90 公示：2026-11-21 21:00:00+08:00 → 2026-11-22 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12008 / 6|`[[50,90],[3,1],[75600,82800]]`|2026-11-22 05:00:00+08:00 → 2026-11-26 23:00:00+08:00|50 进行：2026-11-22 05:00:00+08:00 → 2026-11-25 21:00:00+08:00；90 公示：2026-11-25 21:00:00+08:00 → 2026-11-26 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12009 / 7|`[[50,90],[4,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-17 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 21:00:00+08:00；90 公示：2026-11-16 21:00:00+08:00 → 2026-11-17 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12010 / 8|`[[50,90],[6,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-18 21:00:00+08:00；90 公示：2026-11-18 21:00:00+08:00 → 2026-11-19 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12011 / 9|`[[50,90],[2,1],[75600,82800]]`|2026-11-23 05:00:00+08:00 → 2026-11-26 23:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2026-11-25 21:00:00+08:00；90 公示：2026-11-25 21:00:00+08:00 → 2026-11-26 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12012 / 10|`[[50,60,90],[1,0,0],[75600,79200,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-13 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-13 21:00:00+08:00；60 通知/领奖：2026-11-13 21:00:00+08:00 → 2026-11-13 22:00:00+08:00；90 公示：2026-11-13 22:00:00+08:00 → 2026-11-13 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12013 / 11|`[[50],[3],[18000]]`|2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12014 / 12|`[[50,90],[6,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-18 21:00:00+08:00；90 公示：2026-11-18 21:00:00+08:00 → 2026-11-19 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12015 / 13|`[[50,90],[4,1],[75600,82800]]`|2026-11-21 05:00:00+08:00 → 2026-11-26 23:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-25 21:00:00+08:00；90 公示：2026-11-25 21:00:00+08:00 → 2026-11-26 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12016 / 14|`[[50,60,90],[1,0,0],[75600,79200,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-13 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-13 21:00:00+08:00；60 通知/领奖：2026-11-13 21:00:00+08:00 → 2026-11-13 22:00:00+08:00；90 公示：2026-11-13 22:00:00+08:00 → 2026-11-13 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|12017 / 15|`[[50],[3],[18000]]`|2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13001 / 1|`[[50,60,90],[2,0,0],[75600,79200,82800]]`|2026-11-23 05:00:00+08:00 → 2026-11-25 23:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2026-11-25 21:00:00+08:00；60 通知/领奖：2026-11-25 21:00:00+08:00 → 2026-11-25 22:00:00+08:00；90 公示：2026-11-25 22:00:00+08:00 → 2026-11-25 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13002 / 2|`[[10,50],[1,4],[18000,18000]]`|2026-11-25 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|10 预热：2026-11-25 05:00:00+08:00 → 2026-11-26 05:00:00+08:00；50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13003 / 3|`[[50,60,90],[2,0,0],[75600,79200,82800]]`|2026-12-06 05:00:00+08:00 → 2026-12-08 23:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-08 21:00:00+08:00；60 通知/领奖：2026-12-08 21:00:00+08:00 → 2026-12-08 22:00:00+08:00；90 公示：2026-12-08 22:00:00+08:00 → 2026-12-08 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13004 / 4|`[[10,50],[1,4],[18000,18000]]`|2026-12-08 05:00:00+08:00 → 2026-12-13 05:00:00+08:00|10 预热：2026-12-08 05:00:00+08:00 → 2026-12-09 05:00:00+08:00；50 进行：2026-12-09 05:00:00+08:00 → 2026-12-13 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13005 / 5|`[[50,60,90],[2,0,0],[75600,79200,82800]]`|2026-12-03 05:00:00+08:00 → 2026-12-05 23:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-05 21:00:00+08:00；60 通知/领奖：2026-12-05 21:00:00+08:00 → 2026-12-05 22:00:00+08:00；90 公示：2026-12-05 22:00:00+08:00 → 2026-12-05 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13006 / 6|`[[10,50],[1,4],[18000,18000]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|10 预热：2026-12-05 05:00:00+08:00 → 2026-12-06 05:00:00+08:00；50 进行：2026-12-06 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13007 / 7|`[[50,60,90],[1,0,0],[75600,79200,82800]]`|2026-12-01 05:00:00+08:00 → 2026-12-02 23:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-02 21:00:00+08:00；60 通知/领奖：2026-12-02 21:00:00+08:00 → 2026-12-02 22:00:00+08:00；90 公示：2026-12-02 22:00:00+08:00 → 2026-12-02 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13008 / 8|`[[50],[3],[18000]]`|2026-12-03 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13009 / 9|`[[50,90],[3,1],[75600,82800]]`|2026-12-06 05:00:00+08:00 → 2026-12-10 23:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-09 21:00:00+08:00；90 公示：2026-12-09 21:00:00+08:00 → 2026-12-10 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13010 / 10|`[[50,90],[4,1],[75600,82800]]`|2026-11-26 05:00:00+08:00 → 2026-12-01 23:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 21:00:00+08:00；90 公示：2026-11-30 21:00:00+08:00 → 2026-12-01 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13011 / 11|`[[50,90],[2,1],[75600,82800]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 23:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-09 21:00:00+08:00；90 公示：2026-12-09 21:00:00+08:00 → 2026-12-10 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13012 / 12|`[[50,90],[4,1],[75600,82800]]`|2026-11-26 05:00:00+08:00 → 2026-12-01 23:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 21:00:00+08:00；90 公示：2026-11-30 21:00:00+08:00 → 2026-12-01 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13013 / 13|`[[50,60,90],[1,0,0],[75600,79200,82800]]`|2026-12-01 05:00:00+08:00 → 2026-12-02 23:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-02 21:00:00+08:00；60 通知/领奖：2026-12-02 21:00:00+08:00 → 2026-12-02 22:00:00+08:00；90 公示：2026-12-02 22:00:00+08:00 → 2026-12-02 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13014 / 14|`[[50],[3],[18000]]`|2026-12-03 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13015 / 15|`[[50,90],[4,1],[75600,82800]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 23:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-09 21:00:00+08:00；90 公示：2026-12-09 21:00:00+08:00 → 2026-12-10 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13016 / 16|`[[50,90],[4,1],[75600,82800]]`|2026-11-26 05:00:00+08:00 → 2026-12-01 23:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 21:00:00+08:00；90 公示：2026-11-30 21:00:00+08:00 → 2026-12-01 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13017 / 17|`[[50,60,90],[1,0,0],[75600,79200,82800]]`|2026-12-01 05:00:00+08:00 → 2026-12-02 23:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-02 21:00:00+08:00；60 通知/领奖：2026-12-02 21:00:00+08:00 → 2026-12-02 22:00:00+08:00；90 公示：2026-12-02 22:00:00+08:00 → 2026-12-02 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|13018 / 18|`[[50],[3],[18000]]`|2026-12-03 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|14001 / 1|`[[50,60,90],[2,0,0],[75600,79200,82800]]`|2025-01-17 05:00:00+08:00 → 2025-01-19 23:00:00+08:00|50 进行：2025-01-17 05:00:00+08:00 → 2025-01-19 21:00:00+08:00；60 通知/领奖：2025-01-19 21:00:00+08:00 → 2025-01-19 22:00:00+08:00；90 公示：2025-01-19 22:00:00+08:00 → 2025-01-19 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|14002 / 2|`[[10,50],[1,4],[18000,18000]]`|2025-01-17 05:00:00+08:00 → 2025-01-22 05:00:00+08:00|10 预热：2025-01-17 05:00:00+08:00 → 2025-01-18 05:00:00+08:00；50 进行：2025-01-18 05:00:00+08:00 → 2025-01-22 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|14003 / 3|`[[50,60,90],[2,0,0],[75600,79200,82800]]`|2026-12-31 05:00:00+08:00 → 2027-01-02 23:00:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-02 21:00:00+08:00；60 通知/领奖：2027-01-02 21:00:00+08:00 → 2027-01-02 22:00:00+08:00；90 公示：2027-01-02 22:00:00+08:00 → 2027-01-02 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|14004 / 4|`[[10,50],[1,4],[18000,18000]]`|2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|10 预热：2026-12-31 05:00:00+08:00 → 2027-01-01 05:00:00+08:00；50 进行：2027-01-01 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|15001 / 1|`[[50,60,90],[2,0,0],[75600,79200,82800]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|15002 / 2|`[[10,50],[1,4],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|17001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|18001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|18002 / 2|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|18003 / 3|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|19001 / 1|`[[],[],[]]`|2026-12-14 05:00:00+08:00 → 2054-04-29 05:00:00+08:00|50 进行：2026-12-14 05:00:00+08:00 → 2054-04-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|20001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25007 / 7|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25008 / 8|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25009 / 9|`[[],[],[]]`|2026-12-24 05:00:00+08:00 → 2054-05-10 05:00:00+08:00|50 进行：2026-12-24 05:00:00+08:00 → 2054-05-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25010 / 10|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25011 / 11|`[[],[],[]]`|2026-12-18 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-18 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25012 / 12|`[[],[],[]]`|2026-12-25 05:00:00+08:00 → 2054-05-11 05:00:00+08:00|50 进行：2026-12-25 05:00:00+08:00 → 2054-05-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25013 / 13|`[[],[],[]]`|2026-12-28 05:00:00+08:00 → 2054-05-14 05:00:00+08:00|50 进行：2026-12-28 05:00:00+08:00 → 2054-05-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25014 / 14|`[[],[],[]]`|2026-12-06 05:00:00+08:00 → 2054-04-22 05:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2054-04-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25015 / 15|`[[],[],[]]`|2026-12-06 05:00:00+08:00 → 2054-04-22 05:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2054-04-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25016 / 16|`[[],[],[]]`|2027-01-22 05:00:00+08:00 → 2054-06-08 05:00:00+08:00|50 进行：2027-01-22 05:00:00+08:00 → 2054-06-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25017 / 17|`[[],[],[]]`|2027-02-04 05:00:00+08:00 → 2054-06-21 05:00:00+08:00|50 进行：2027-02-04 05:00:00+08:00 → 2054-06-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25018 / 18|`[[],[],[]]`|2026-12-25 05:00:00+08:00 → 2054-05-11 05:00:00+08:00|50 进行：2026-12-25 05:00:00+08:00 → 2054-05-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25019 / 19|`[[],[],[]]`|2027-01-08 05:00:00+08:00 → 2054-05-25 05:00:00+08:00|50 进行：2027-01-08 05:00:00+08:00 → 2054-05-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25020 / 20|`[[],[],[]]`|2027-02-18 05:00:00+08:00 → 2054-07-05 05:00:00+08:00|50 进行：2027-02-18 05:00:00+08:00 → 2054-07-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25021 / 21|`[[],[],[]]`|2027-02-13 05:00:00+08:00 → 2054-06-30 05:00:00+08:00|50 进行：2027-02-13 05:00:00+08:00 → 2054-06-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25022 / 22|`[[],[],[]]`|2027-01-15 05:00:00+08:00 → 2054-06-01 05:00:00+08:00|50 进行：2027-01-15 05:00:00+08:00 → 2054-06-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25023 / 23|`[[],[],[]]`|2027-01-30 05:00:00+08:00 → 2054-06-16 05:00:00+08:00|50 进行：2027-01-30 05:00:00+08:00 → 2054-06-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25024 / 24|`[[],[],[]]`|2027-01-16 05:00:00+08:00 → 2054-06-02 05:00:00+08:00|50 进行：2027-01-16 05:00:00+08:00 → 2054-06-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25025 / 25|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25026 / 26|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25027 / 27|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25028 / 28|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25029 / 29|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2054-04-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25031 / 31|`[[],[],[]]`|2026-12-30 05:00:00+08:00 → 2054-05-16 05:00:00+08:00|50 进行：2026-12-30 05:00:00+08:00 → 2054-05-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25032 / 32|`[[],[],[]]`|2026-12-30 05:00:00+08:00 → 2054-05-16 05:00:00+08:00|50 进行：2026-12-30 05:00:00+08:00 → 2054-05-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25034 / 34|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2054-04-07 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2054-04-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25036 / 35|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|25038 / 36|`[[],[],[]]`|2025-03-17 05:00:00+08:00 → 2052-08-01 05:00:00+08:00|50 进行：2025-03-17 05:00:00+08:00 → 2052-08-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25039 / 37|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|25040 / 38|`[[],[],[]]`|2025-03-17 05:00:00+08:00 → 2052-08-01 05:00:00+08:00|50 进行：2025-03-17 05:00:00+08:00 → 2052-08-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25041 / 39|`[[],[],[]]`|2025-05-24 05:00:00+08:00 → 2052-10-08 05:00:00+08:00|50 进行：2025-05-24 05:00:00+08:00 → 2052-10-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25042 / 40|`[[],[],[]]`|2025-04-05 05:00:00+08:00 → 2052-08-20 05:00:00+08:00|50 进行：2025-04-05 05:00:00+08:00 → 2052-08-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25043 / 41|`[[],[],[]]`|2027-01-16 05:00:00+08:00 → 2054-06-02 05:00:00+08:00|50 进行：2027-01-16 05:00:00+08:00 → 2054-06-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25044 / 42|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2054-04-06 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2054-04-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25045 / 43|`[[],[],[]]`|2025-05-01 05:00:00+08:00 → 2052-09-15 05:00:00+08:00|50 进行：2025-05-01 05:00:00+08:00 → 2052-09-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25046 / 44|`[[],[],[]]`|2025-05-08 05:00:00+08:00 → 2052-09-22 05:00:00+08:00|50 进行：2025-05-08 05:00:00+08:00 → 2052-09-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25047 / 45|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|25048 / 46|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|25049 / 47|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25050 / 48|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25051 / 49|`[[],[],[]]`|2025-05-24 05:00:00+08:00 → 2052-10-08 05:00:00+08:00|50 进行：2025-05-24 05:00:00+08:00 → 2052-10-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25052 / 51|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25053 / 52|`[[],[],[]]`|2025-06-07 05:00:00+08:00 → 2052-10-22 05:00:00+08:00|50 进行：2025-06-07 05:00:00+08:00 → 2052-10-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25054 / 54|`[[],[],[]]`|2025-09-11 05:00:00+08:00 → 2053-01-26 05:00:00+08:00|50 进行：2025-09-11 05:00:00+08:00 → 2053-01-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25055 / 55|`[[],[],[]]`|2025-07-08 05:00:00+08:00 → 2052-11-22 05:00:00+08:00|50 进行：2025-07-08 05:00:00+08:00 → 2052-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25056 / 56|`[[],[],[]]`|2025-07-24 05:00:00+08:00 → 2052-12-08 05:00:00+08:00|50 进行：2025-07-24 05:00:00+08:00 → 2052-12-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25057 / 57|`[[],[],[]]`|2025-08-07 05:00:00+08:00 → 2052-12-22 05:00:00+08:00|50 进行：2025-08-07 05:00:00+08:00 → 2052-12-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25058 / 58|`[[],[],[]]`|2026-11-13 05:00:00+08:00 → 2054-03-30 05:00:00+08:00|50 进行：2026-11-13 05:00:00+08:00 → 2054-03-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25059 / 59|`[[],[],[]]`|2026-11-23 05:00:00+08:00 → 2054-04-09 05:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2054-04-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25060 / 60|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25061 / 61|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25062 / 62|`[[],[],[]]`|2025-09-16 05:00:00+08:00 → 2053-01-31 05:00:00+08:00|50 进行：2025-09-16 05:00:00+08:00 → 2053-01-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25063 / 63|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2054-04-23 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2054-04-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25064 / 64|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2328-01-11 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2328-01-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25065 / 65|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25066 / 66|`[[],[],[]]`|2025-10-01 05:00:00+08:00 → 2053-02-15 05:00:00+08:00|50 进行：2025-10-01 05:00:00+08:00 → 2053-02-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25067 / 67|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25068 / 68|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25069 / 69|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25070 / 70|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25071 / 71|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25072 / 72|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25073 / 73|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25074 / 74|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25075 / 75|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2054-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25076 / 76|`[[],[],[]]`|2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|50 进行：2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25077 / 78|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25078 / 77|`[[],[],[]]`|2026-11-23 05:00:00+08:00 → 2054-04-09 05:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2054-04-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25079 / 79|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25080 / 80|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25081 / 81|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2054-04-23 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2054-04-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25082 / 82|`[[],[],[]]`|2025-11-30 05:00:00+08:00 → 2053-04-16 05:00:00+08:00|50 进行：2025-11-30 05:00:00+08:00 → 2053-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25083 / 83|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25084 / 84|`[[],[],[]]`|2025-12-15 05:00:00+08:00 → 2053-05-01 05:00:00+08:00|50 进行：2025-12-15 05:00:00+08:00 → 2053-05-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25085 / 85|`[[],[],[]]`|2025-12-30 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|50 进行：2025-12-30 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25086 / 86|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2054-04-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25087 / 87|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2054-04-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25088 / 88|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2054-04-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25089 / 89|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25090 / 90|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2054-04-23 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2054-04-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25091 / 91|`[[],[],[]]`|2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|50 进行：2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25092 / 92|`[[],[],[]]`|2026-02-13 05:00:00+08:00 → 2026-02-18 05:00:00+08:00|50 进行：2026-02-13 05:00:00+08:00 → 2026-02-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25093 / 93|`[[],[],[]]`|2026-03-05 05:00:00+08:00 → 2053-07-20 05:00:00+08:00|50 进行：2026-03-05 05:00:00+08:00 → 2053-07-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25094 / 94|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25095 / 95|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25096 / 96|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25097 / 97|`[[],[],[]]`|2026-03-30 05:00:00+08:00 → 2026-04-04 05:00:00+08:00|50 进行：2026-03-30 05:00:00+08:00 → 2026-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25098 / 91|`[[],[],[]]`|2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25099 / 98|`[[],[],[]]`|2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|50 进行：2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25100 / 99|`[[],[],[]]`|2026-04-29 05:00:00+08:00 → 2053-09-13 05:00:00+08:00|50 进行：2026-04-29 05:00:00+08:00 → 2053-09-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25101 / 100|`[[],[],[]]`|2026-05-14 05:00:00+08:00 → 2026-05-19 05:00:00+08:00|50 进行：2026-05-14 05:00:00+08:00 → 2026-05-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25102 / 101|`[[],[],[]]`|2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|50 进行：2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25103 / 102|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25104 / 103|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2054-04-16 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2054-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25105 / 105|`[[],[],[]]`|2026-06-23 05:00:00+08:00 → 2053-11-07 05:00:00+08:00|50 进行：2026-06-23 05:00:00+08:00 → 2053-11-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25106 / 106|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2054-04-16 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2054-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25107 / 107|`[[],[],[]]`|2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|50 进行：2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25108 / 108|`[[],[],[]]`|2026-08-22 05:00:00+08:00 → 2054-01-06 05:00:00+08:00|50 进行：2026-08-22 05:00:00+08:00 → 2054-01-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25109 / 109|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2081-08-12 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2081-08-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25110 / 110|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-03 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25111 / 111|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25112 / 112|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25113 / 113|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|25114 / 114|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|46001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|46002 / 2|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|46003 / 5|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|46004 / 4|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|53001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53002 / 2|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53003 / 3|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53004 / 4|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53005 / 5|`[[],[],[]]`|2026-12-10 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|50 进行：2026-12-10 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53006 / 6|`[[],[],[]]`|2026-12-17 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-17 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53007 / 7|`[[],[],[]]`|2026-12-24 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|50 进行：2026-12-24 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53008 / 8|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53009 / 9|`[[],[],[]]`|2027-01-07 05:00:00+08:00 → 2027-01-14 05:00:00+08:00|50 进行：2027-01-07 05:00:00+08:00 → 2027-01-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53010 / 10|`[[],[],[]]`|2027-01-14 05:00:00+08:00 → 2027-01-21 05:00:00+08:00|50 进行：2027-01-14 05:00:00+08:00 → 2027-01-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53011 / 11|`[[],[],[]]`|2027-01-21 05:00:00+08:00 → 2027-01-28 05:00:00+08:00|50 进行：2027-01-21 05:00:00+08:00 → 2027-01-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53021 / 21|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53022 / 22|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53023 / 23|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53024 / 24|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53025 / 25|`[[],[],[]]`|2026-12-10 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|50 进行：2026-12-10 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53026 / 26|`[[],[],[]]`|2026-12-17 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-17 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53027 / 27|`[[],[],[]]`|2026-12-24 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|50 进行：2026-12-24 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53028 / 20|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53031 / 31|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53032 / 32|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53033 / 33|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53034 / 34|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53035 / 35|`[[],[],[]]`|2026-12-10 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|50 进行：2026-12-10 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53036 / 36|`[[],[],[]]`|2026-12-17 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-17 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|53037 / 37|`[[],[],[]]`|2026-12-24 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|50 进行：2026-12-24 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56001 / 1|`[[],[],[]]`|2024-10-01 05:00:00+08:00 → 2024-10-09 04:59:00+08:00|50 进行：2024-10-01 05:00:00+08:00 → 2024-10-09 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56002 / 2|`[[],[],[]]`|2024-12-22 05:00:00+08:00 → 2024-12-29 04:59:00+08:00|50 进行：2024-12-22 05:00:00+08:00 → 2024-12-29 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56003 / 3|`[[],[],[]]`|2025-01-25 05:00:00+08:00 → 2025-02-06 04:59:00+08:00|50 进行：2025-01-25 05:00:00+08:00 → 2025-02-06 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56004 / 4|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56005 / 5|`[[],[],[]]`|2025-02-19 05:00:00+08:00 → 2025-02-24 04:59:00+08:00|50 进行：2025-02-19 05:00:00+08:00 → 2025-02-24 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56006 / 6|`[[],[],[]]`|2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56007 / 7|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|56008 / 8|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|56009 / 18|`[[],[],[]]`|2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|50 进行：2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56010 / 10|`[[],[],[]]`|2027-01-02 05:00:00+08:00 → 2027-01-07 04:59:00+08:00|50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56011 / 11|`[[],[],[]]`|2025-04-11 05:00:00+08:00 → 2025-04-16 04:59:00+08:00|50 进行：2025-04-11 05:00:00+08:00 → 2025-04-16 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56012 / 12|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56013 / 13|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-08 04:59:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56014 / 14|`[[],[],[]]`|2025-05-27 05:00:00+08:00 → 2025-06-01 04:59:00+08:00|50 进行：2025-05-27 05:00:00+08:00 → 2025-06-01 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56015 / 15|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56016 / 16|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-05 04:59:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-05 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|56017 / 17|`[[],[],[]]`|2099-11-27 05:00:00+08:00 → 2099-12-02 04:59:00+08:00|50 进行：2099-11-27 05:00:00+08:00 → 2099-12-02 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57001 / 1|`[[],[],[]]`|2024-10-01 05:00:00+08:00 → 2024-10-09 04:59:00+08:00|50 进行：2024-10-01 05:00:00+08:00 → 2024-10-09 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57002 / 2|`[[],[],[]]`|2024-12-22 05:00:00+08:00 → 2024-12-29 04:59:00+08:00|50 进行：2024-12-22 05:00:00+08:00 → 2024-12-29 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57003 / 3|`[[],[],[]]`|2025-01-25 05:00:00+08:00 → 2025-02-06 04:59:00+08:00|50 进行：2025-01-25 05:00:00+08:00 → 2025-02-06 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57004 / 4|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57005 / 5|`[[],[],[]]`|2025-02-19 05:00:00+08:00 → 2025-02-24 04:59:00+08:00|50 进行：2025-02-19 05:00:00+08:00 → 2025-02-24 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57006 / 6|`[[],[],[]]`|2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57007 / 7|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|57008 / 8|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|57009 / 18|`[[],[],[]]`|2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|50 进行：2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57010 / 10|`[[],[],[]]`|2027-01-02 05:00:00+08:00 → 2027-01-07 04:59:00+08:00|50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57011 / 11|`[[],[],[]]`|2025-04-11 05:00:00+08:00 → 2025-04-16 04:59:00+08:00|50 进行：2025-04-11 05:00:00+08:00 → 2025-04-16 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57012 / 12|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57013 / 13|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-08 04:59:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57014 / 14|`[[],[],[]]`|2025-05-27 05:00:00+08:00 → 2025-06-01 04:59:00+08:00|50 进行：2025-05-27 05:00:00+08:00 → 2025-06-01 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57015 / 15|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57016 / 16|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-05 04:59:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-05 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|57017 / 17|`[[],[],[]]`|2099-11-27 05:00:00+08:00 → 2099-12-02 04:59:00+08:00|50 进行：2099-11-27 05:00:00+08:00 → 2099-12-02 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61001 / 1|`[[],[],[]]`|2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61002 / 2|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61003 / 3|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-29 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61004 / 4|`[[],[],[]]`|2026-11-23 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61005 / 5|`[[],[],[]]`|2026-12-02 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|50 进行：2026-12-02 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61006 / 6|`[[],[],[]]`|2026-12-08 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|50 进行：2026-12-08 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61007 / 7|`[[],[],[]]`|2026-12-14 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|50 进行：2026-12-14 05:00:00+08:00 → 2026-12-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61008 / 8|`[[],[],[]]`|2026-12-20 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|50 进行：2026-12-20 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61009 / 9|`[[],[],[]]`|2026-12-26 05:00:00+08:00 → 2026-12-29 05:00:00+08:00|50 进行：2026-12-26 05:00:00+08:00 → 2026-12-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61010 / 10|`[[],[],[]]`|2026-12-06 05:00:00+08:00 → 2026-12-09 05:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61011 / 11|`[[],[],[]]`|2026-11-25 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|50 进行：2026-11-25 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61012 / 12|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61013 / 13|`[[],[],[]]`|2026-12-10 05:00:00+08:00 → 2026-12-12 05:00:00+08:00|50 进行：2026-12-10 05:00:00+08:00 → 2026-12-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61014 / 14|`[[],[],[]]`|2024-10-25 05:00:00+08:00 → 2024-10-28 04:59:00+08:00|50 进行：2024-10-25 05:00:00+08:00 → 2024-10-28 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61015 / 15|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61016 / 16|`[[],[],[]]`|2024-10-25 05:00:00+08:00 → 2024-10-28 04:59:00+08:00|50 进行：2024-10-25 05:00:00+08:00 → 2024-10-28 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61017 / 17|`[[],[],[]]`|2026-12-09 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|50 进行：2026-12-09 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61018 / 18|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2026-12-13 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2026-12-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61019 / 19|`[[],[],[]]`|2024-10-25 05:00:00+08:00 → 2024-10-28 04:59:00+08:00|50 进行：2024-10-25 05:00:00+08:00 → 2024-10-28 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61020 / 20|`[[],[],[]]`|2027-01-01 05:00:00+08:00 → 2027-01-04 05:00:00+08:00|50 进行：2027-01-01 05:00:00+08:00 → 2027-01-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61021 / 21|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61022 / 22|`[[],[],[]]`|2027-01-06 05:00:00+08:00 → 2027-01-09 05:00:00+08:00|50 进行：2027-01-06 05:00:00+08:00 → 2027-01-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61023 / 23|`[[],[],[]]`|2026-11-25 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|50 进行：2026-11-25 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61024 / 24|`[[],[],[]]`|2026-12-09 05:00:00+08:00 → 2026-12-12 05:00:00+08:00|50 进行：2026-12-09 05:00:00+08:00 → 2026-12-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61025 / 25|`[[],[],[]]`|2026-12-15 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|50 进行：2026-12-15 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61026 / 26|`[[],[],[]]`|2027-01-13 05:00:00+08:00 → 2027-01-16 05:00:00+08:00|50 进行：2027-01-13 05:00:00+08:00 → 2027-01-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61027 / 27|`[[],[],[]]`|2026-12-06 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61028 / 28|`[[],[],[]]`|2026-12-16 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|50 进行：2026-12-16 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61029 / 29|`[[],[],[]]`|2027-01-20 05:00:00+08:00 → 2027-01-23 05:00:00+08:00|50 进行：2027-01-20 05:00:00+08:00 → 2027-01-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61030 / 30|`[[],[],[]]`|2027-01-27 05:00:00+08:00 → 2027-01-30 05:00:00+08:00|50 进行：2027-01-27 05:00:00+08:00 → 2027-01-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61031 / 31|`[[],[],[]]`|2027-02-03 05:00:00+08:00 → 2027-02-06 05:00:00+08:00|50 进行：2027-02-03 05:00:00+08:00 → 2027-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61032 / 32|`[[],[],[]]`|2027-02-09 05:00:00+08:00 → 2027-02-12 05:00:00+08:00|50 进行：2027-02-09 05:00:00+08:00 → 2027-02-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61033 / 33|`[[],[],[]]`|2027-02-16 05:00:00+08:00 → 2027-02-19 05:00:00+08:00|50 进行：2027-02-16 05:00:00+08:00 → 2027-02-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61034 / 34|`[[],[],[]]`|2027-02-23 05:00:00+08:00 → 2027-02-26 05:00:00+08:00|50 进行：2027-02-23 05:00:00+08:00 → 2027-02-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61035 / 35|`[[],[],[]]`|2026-12-06 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61036 / 36|`[[],[],[]]`|2027-03-02 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|50 进行：2027-03-02 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61037 / 37|`[[],[],[]]`|2027-03-09 05:00:00+08:00 → 2027-03-12 05:00:00+08:00|50 进行：2027-03-09 05:00:00+08:00 → 2027-03-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61038 / 38|`[[],[],[]]`|2027-03-15 05:00:00+08:00 → 2027-03-18 05:00:00+08:00|50 进行：2027-03-15 05:00:00+08:00 → 2027-03-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61039 / 39|`[[],[],[]]`|2027-03-23 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|50 进行：2027-03-23 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61040 / 40|`[[],[],[]]`|2027-03-30 05:00:00+08:00 → 2027-04-02 05:00:00+08:00|50 进行：2027-03-30 05:00:00+08:00 → 2027-04-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61041 / 41|`[[],[],[]]`|2027-04-06 05:00:00+08:00 → 2027-04-09 05:00:00+08:00|50 进行：2027-04-06 05:00:00+08:00 → 2027-04-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61042 / 42|`[[],[],[]]`|2027-04-13 05:00:00+08:00 → 2027-04-16 05:00:00+08:00|50 进行：2027-04-13 05:00:00+08:00 → 2027-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61043 / 43|`[[],[],[]]`|2027-04-21 05:00:00+08:00 → 2027-04-24 05:00:00+08:00|50 进行：2027-04-21 05:00:00+08:00 → 2027-04-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61044 / 44|`[[],[],[]]`|2027-04-27 05:00:00+08:00 → 2027-04-30 05:00:00+08:00|50 进行：2027-04-27 05:00:00+08:00 → 2027-04-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61045 / 45|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-24 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61046 / 46|`[[],[],[]]`|2027-05-04 05:00:00+08:00 → 2027-05-07 05:00:00+08:00|50 进行：2027-05-04 05:00:00+08:00 → 2027-05-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61047 / 47|`[[],[],[]]`|2027-05-11 05:00:00+08:00 → 2027-05-14 05:00:00+08:00|50 进行：2027-05-11 05:00:00+08:00 → 2027-05-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61048 / 48|`[[],[],[]]`|2027-05-18 05:00:00+08:00 → 2027-05-21 05:00:00+08:00|50 进行：2027-05-18 05:00:00+08:00 → 2027-05-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61049 / 49|`[[],[],[]]`|2027-05-25 05:00:00+08:00 → 2027-05-28 05:00:00+08:00|50 进行：2027-05-25 05:00:00+08:00 → 2027-05-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61050 / 50|`[[],[],[]]`|2027-06-01 05:00:00+08:00 → 2027-06-04 05:00:00+08:00|50 进行：2027-06-01 05:00:00+08:00 → 2027-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61051 / 51|`[[],[],[]]`|2027-06-08 05:00:00+08:00 → 2027-06-11 05:00:00+08:00|50 进行：2027-06-08 05:00:00+08:00 → 2027-06-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61052 / 52|`[[],[],[]]`|2027-06-15 05:00:00+08:00 → 2027-06-18 05:00:00+08:00|50 进行：2027-06-15 05:00:00+08:00 → 2027-06-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61053 / 53|`[[],[],[]]`|2027-06-22 05:00:00+08:00 → 2027-06-25 05:00:00+08:00|50 进行：2027-06-22 05:00:00+08:00 → 2027-06-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61054 / 54|`[[],[],[]]`|2027-06-29 05:00:00+08:00 → 2027-07-02 05:00:00+08:00|50 进行：2027-06-29 05:00:00+08:00 → 2027-07-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61055 / 55|`[[],[],[]]`|2027-07-06 05:00:00+08:00 → 2027-07-09 05:00:00+08:00|50 进行：2027-07-06 05:00:00+08:00 → 2027-07-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61056 / 56|`[[],[],[]]`|2027-07-13 05:00:00+08:00 → 2027-07-16 05:00:00+08:00|50 进行：2027-07-13 05:00:00+08:00 → 2027-07-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61057 / 57|`[[],[],[]]`|2027-07-20 05:00:00+08:00 → 2027-07-23 05:00:00+08:00|50 进行：2027-07-20 05:00:00+08:00 → 2027-07-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61058 / 58|`[[],[],[]]`|2027-07-27 05:00:00+08:00 → 2027-07-30 05:00:00+08:00|50 进行：2027-07-27 05:00:00+08:00 → 2027-07-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61059 / 59|`[[],[],[]]`|2027-08-03 05:00:00+08:00 → 2027-08-06 05:00:00+08:00|50 进行：2027-08-03 05:00:00+08:00 → 2027-08-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61060 / 60|`[[],[],[]]`|2027-08-10 05:00:00+08:00 → 2027-08-13 05:00:00+08:00|50 进行：2027-08-10 05:00:00+08:00 → 2027-08-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61061 / 61|`[[],[],[]]`|2027-08-17 05:00:00+08:00 → 2027-08-20 05:00:00+08:00|50 进行：2027-08-17 05:00:00+08:00 → 2027-08-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61062 / 62|`[[],[],[]]`|2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61063 / 63|`[[],[],[]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61064 / 64|`[[],[],[]]`|2026-11-18 05:00:00+08:00 → 2026-11-21 05:00:00+08:00|50 进行：2026-11-18 05:00:00+08:00 → 2026-11-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61065 / 65|`[[],[],[]]`|2027-08-24 05:00:00+08:00 → 2027-08-27 05:00:00+08:00|50 进行：2027-08-24 05:00:00+08:00 → 2027-08-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61066 / 66|`[[],[],[]]`|2027-08-31 05:00:00+08:00 → 2027-09-03 05:00:00+08:00|50 进行：2027-08-31 05:00:00+08:00 → 2027-09-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61067 / 67|`[[],[],[]]`|2027-09-07 05:00:00+08:00 → 2027-09-10 05:00:00+08:00|50 进行：2027-09-07 05:00:00+08:00 → 2027-09-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61068 / 68|`[[],[],[]]`|2027-09-14 05:00:00+08:00 → 2027-09-17 05:00:00+08:00|50 进行：2027-09-14 05:00:00+08:00 → 2027-09-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61069 / 69|`[[],[],[]]`|2027-09-21 05:00:00+08:00 → 2027-09-24 05:00:00+08:00|50 进行：2027-09-21 05:00:00+08:00 → 2027-09-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|61070 / 70|`[[],[],[]]`|2027-09-28 05:00:00+08:00 → 2027-10-01 05:00:00+08:00|50 进行：2027-09-28 05:00:00+08:00 → 2027-10-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63001 / 1|`[[],[],[]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63002 / 2|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63003 / 3|`[[],[],[]]`|2026-12-24 05:00:00+08:00 → 2026-12-27 05:00:00+08:00|50 进行：2026-12-24 05:00:00+08:00 → 2026-12-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63004 / 4|`[[],[],[]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63005 / 5|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63006 / 6|`[[],[],[]]`|2026-12-24 05:00:00+08:00 → 2026-12-27 05:00:00+08:00|50 进行：2026-12-24 05:00:00+08:00 → 2026-12-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63007 / 7|`[[],[],[]]`|2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|50 进行：2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63008 / 8|`[[],[],[]]`|2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|50 进行：2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63009 / 9|`[[],[],[]]`|2027-02-07 05:00:00+08:00 → 2027-02-10 05:00:00+08:00|50 进行：2027-02-07 05:00:00+08:00 → 2027-02-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63010 / 10|`[[],[],[]]`|2026-12-22 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-22 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63011 / 11|`[[],[],[]]`|2027-02-21 05:00:00+08:00 → 2027-02-24 05:00:00+08:00|50 进行：2027-02-21 05:00:00+08:00 → 2027-02-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63012 / 12|`[[],[],[]]`|2027-02-05 05:00:00+08:00 → 2027-02-08 05:00:00+08:00|50 进行：2027-02-05 05:00:00+08:00 → 2027-02-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63013 / 13|`[[],[],[]]`|2027-02-16 05:00:00+08:00 → 2027-02-19 05:00:00+08:00|50 进行：2027-02-16 05:00:00+08:00 → 2027-02-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63014 / 14|`[[],[],[]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63015 / 15|`[[],[],[]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63016 / 16|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63017 / 17|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63018 / 18|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63019 / 19|`[[],[],[]]`|2026-12-22 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-22 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63020 / 20|`[[],[],[]]`|2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|50 进行：2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63021 / 12|`[[],[],[]]`|2027-02-07 05:00:00+08:00 → 2027-02-10 05:00:00+08:00|50 进行：2027-02-07 05:00:00+08:00 → 2027-02-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63022 / 13|`[[],[],[]]`|2027-02-21 05:00:00+08:00 → 2027-02-24 05:00:00+08:00|50 进行：2027-02-21 05:00:00+08:00 → 2027-02-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63023 / 21|`[[],[],[]]`|2027-03-20 05:00:00+08:00 → 2027-03-23 05:00:00+08:00|50 进行：2027-03-20 05:00:00+08:00 → 2027-03-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63024 / 22|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63025 / 23|`[[],[],[]]`|2026-12-22 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-22 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63026 / 24|`[[],[],[]]`|2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|50 进行：2027-01-17 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63027 / 25|`[[],[],[]]`|2027-02-07 05:00:00+08:00 → 2027-02-10 05:00:00+08:00|50 进行：2027-02-07 05:00:00+08:00 → 2027-02-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63028 / 26|`[[],[],[]]`|2027-02-21 05:00:00+08:00 → 2027-02-24 05:00:00+08:00|50 进行：2027-02-21 05:00:00+08:00 → 2027-02-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63029 / 27|`[[],[],[]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63030 / 28|`[[],[],[]]`|2027-02-16 05:00:00+08:00 → 2027-02-19 05:00:00+08:00|50 进行：2027-02-16 05:00:00+08:00 → 2027-02-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63031 / 22|`[[],[],[]]`|2026-12-02 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|50 进行：2026-12-02 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63032 / 29|`[[],[],[]]`|2027-03-02 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|50 进行：2027-03-02 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63033 / 29|`[[],[],[]]`|2025-03-11 05:00:00+08:00 → 2025-03-14 05:00:00+08:00|50 进行：2025-03-11 05:00:00+08:00 → 2025-03-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63034 / 29|`[[],[],[]]`|2025-03-11 05:00:00+08:00 → 2025-03-14 05:00:00+08:00|50 进行：2025-03-11 05:00:00+08:00 → 2025-03-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63035 / 29|`[[],[],[]]`|2025-03-18 05:00:00+08:00 → 2025-03-21 05:00:00+08:00|50 进行：2025-03-18 05:00:00+08:00 → 2025-03-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|63036 / 30|`[[],[],[]]`|2026-11-15 05:00:00+08:00 → 2026-11-18 05:00:00+08:00|50 进行：2026-11-15 05:00:00+08:00 → 2026-11-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|67001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-13 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|68001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|68002 / 2|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|72001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-15 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|72002 / 2|`[[],[],[]]`|2026-11-15 05:00:00+08:00 → 2026-11-18 05:00:00+08:00|50 进行：2026-11-15 05:00:00+08:00 → 2026-11-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|74001 / 1|`[[10,50],[1,7],[18000,18000]]`|2026-11-27 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|10 预热：2026-11-27 05:00:00+08:00 → 2026-11-28 05:00:00+08:00；50 进行：2026-11-28 05:00:00+08:00 → 2026-12-05 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|74002 / 2|`[[10,50],[1,5],[18000,18000]]`|2026-11-27 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|10 预热：2026-11-27 05:00:00+08:00 → 2026-11-28 05:00:00+08:00；50 进行：2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|74003 / 3|`[[10,50],[1,5],[18000,18000]]`|2026-12-25 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|10 预热：2026-12-25 05:00:00+08:00 → 2026-12-26 05:00:00+08:00；50 进行：2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|74004 / 4|`[[10,50],[1,5],[18000,18000]]`|2026-11-27 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|10 预热：2026-11-27 05:00:00+08:00 → 2026-11-28 05:00:00+08:00；50 进行：2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|74005 / 5|`[[10,50],[1,5],[18000,18000]]`|2026-12-25 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|10 预热：2026-12-25 05:00:00+08:00 → 2026-12-26 05:00:00+08:00；50 进行：2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|75001 / 1|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76001 / 1|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76002 / 2|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76003 / 3|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76004 / 4|`[[],[],[]]`|2027-02-18 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|50 进行：2027-02-18 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76005 / 5|`[[],[],[]]`|2027-02-13 05:00:00+08:00 → 2027-02-18 05:00:00+08:00|50 进行：2027-02-13 05:00:00+08:00 → 2027-02-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76006 / 6|`[[],[],[]]`|2027-02-13 05:00:00+08:00 → 2027-02-13 05:01:00+08:00|50 进行：2027-02-13 05:00:00+08:00 → 2027-02-13 05:01:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76007 / 7|`[[],[],[]]`|2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|50 进行：2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76008 / 8|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76009 / 9|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|76010 / 10|`[[],[],[]]`|2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|50 进行：2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76011 / 10|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|76012 / 10|`[[],[],[]]`|2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|50 进行：2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76013 / 8|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76014 / 11|`[[],[],[]]`|2025-05-01 05:00:00+08:00 → 2025-05-08 05:00:00+08:00|50 进行：2025-05-01 05:00:00+08:00 → 2025-05-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76015 / 12|`[[],[],[]]`|2025-05-08 05:00:00+08:00 → 2025-05-15 05:00:00+08:00|50 进行：2025-05-08 05:00:00+08:00 → 2025-05-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76016 / 13|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|76017 / 14|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|76018 / 7|`[[],[],[]]`|2026-12-18 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|50 进行：2026-12-18 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76019 / 8|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76020 / 15|`[[],[],[]]`|2025-07-09 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|50 进行：2025-07-09 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76021 / 15|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|76022 / 8|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76023 / 17|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76024 / 18|`[[],[],[]]`|2025-09-11 05:00:00+08:00 → 2025-09-16 05:00:00+08:00|50 进行：2025-09-11 05:00:00+08:00 → 2025-09-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76025 / 19|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76026 / 22|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76027 / 23|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76028 / 24|`[[],[],[]]`|2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|50 进行：2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76029 / 25|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76030 / 26|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76031 / 27|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76032 / 28|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76033 / 33|`[[],[],[]]`|2025-12-30 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|50 进行：2025-12-30 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76034 / 29|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76035 / 30|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76036 / 31|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76037 / 32|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76038 / 34|`[[],[],[]]`|2026-02-13 05:00:00+08:00 → 2026-02-18 05:00:00+08:00|50 进行：2026-02-13 05:00:00+08:00 → 2026-02-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76039 / 35|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76040 / 36|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76041 / 37|`[[],[],[]]`|2026-03-30 05:00:00+08:00 → 2026-04-04 05:00:00+08:00|50 进行：2026-03-30 05:00:00+08:00 → 2026-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76042 / 38|`[[],[],[]]`|2026-05-14 05:00:00+08:00 → 2026-05-19 05:00:00+08:00|50 进行：2026-05-14 05:00:00+08:00 → 2026-05-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76043 / 39|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76044 / 40|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76045 / 41|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76046 / 42|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|76047 / 43|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77001 / 1|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77002 / 2|`[[10,50],[1,7],[18000,18000]]`|2026-11-20 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|10 预热：2026-11-20 05:00:00+08:00 → 2026-11-21 05:00:00+08:00；50 进行：2026-11-21 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77003 / 3|`[[10,50],[1,7],[18000,18000]]`|2026-12-10 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|10 预热：2026-12-10 05:00:00+08:00 → 2026-12-11 05:00:00+08:00；50 进行：2026-12-11 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77004 / 4|`[[],[],[]]`|2026-12-18 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-18 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77005 / 5|`[[10,50],[1,5],[18000,18000]]`|2026-11-20 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|10 预热：2026-11-20 05:00:00+08:00 → 2026-11-21 05:00:00+08:00；50 进行：2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77006 / 6|`[[],[],[]]`|2026-12-25 05:00:00+08:00 → 2026-12-28 05:00:00+08:00|50 进行：2026-12-25 05:00:00+08:00 → 2026-12-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77007 / 7|`[[],[],[]]`|2024-11-20 05:00:00+08:00 → 2024-11-23 05:00:00+08:00|50 进行：2024-11-20 05:00:00+08:00 → 2024-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77008 / 8|`[[],[],[]]`|2026-12-28 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|50 进行：2026-12-28 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77009 / 9|`[[],[],[]]`|2024-11-23 05:00:00+08:00 → 2024-11-26 05:00:00+08:00|50 进行：2024-11-23 05:00:00+08:00 → 2024-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77010 / 10|`[[10,50],[1,7],[18000,18000]]`|2026-12-10 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|10 预热：2026-12-10 05:00:00+08:00 → 2026-12-11 05:00:00+08:00；50 进行：2026-12-11 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77011 / 11|`[[],[],[]]`|2026-12-18 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-18 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77012 / 12|`[[],[],[]]`|2027-01-22 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|50 进行：2027-01-22 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77013 / 13|`[[10,50],[1,7],[18000,18000]]`|2027-02-03 05:00:00+08:00 → 2027-02-11 05:00:00+08:00|10 预热：2027-02-03 05:00:00+08:00 → 2027-02-04 05:00:00+08:00；50 进行：2027-02-04 05:00:00+08:00 → 2027-02-11 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77014 / 14|`[[],[],[]]`|2026-12-25 05:00:00+08:00 → 2027-01-01 05:00:00+08:00|50 进行：2026-12-25 05:00:00+08:00 → 2027-01-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77015 / 15|`[[10,50],[1,5],[18000,18000]]`|2027-02-17 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|10 预热：2027-02-17 05:00:00+08:00 → 2027-02-18 05:00:00+08:00；50 进行：2027-02-18 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77016 / 16|`[[10,50],[1,5],[18000,18000]]`|2027-02-12 05:00:00+08:00 → 2027-02-18 05:00:00+08:00|10 预热：2027-02-12 05:00:00+08:00 → 2027-02-13 05:00:00+08:00；50 进行：2027-02-13 05:00:00+08:00 → 2027-02-18 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77017 / 17|`[[],[],[]]`|2027-01-15 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|50 进行：2027-01-15 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77018 / 18|`[[10,50],[1,7],[18000,18000]]`|2027-01-29 05:00:00+08:00 → 2027-02-06 05:00:00+08:00|10 预热：2027-01-29 05:00:00+08:00 → 2027-01-30 05:00:00+08:00；50 进行：2027-01-30 05:00:00+08:00 → 2027-02-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77019 / 19|`[[10,50],[1,7],[18000,18000]]`|2026-12-10 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|10 预热：2026-12-10 05:00:00+08:00 → 2026-12-11 05:00:00+08:00；50 进行：2026-12-11 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77020 / 20|`[[],[],[]]`|2026-12-25 05:00:00+08:00 → 2027-01-01 05:00:00+08:00|50 进行：2026-12-25 05:00:00+08:00 → 2027-01-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77021 / 21|`[[10,50],[1,7],[18000,18000]]`|2025-04-11 05:00:00+08:00 → 2025-04-19 05:00:00+08:00|10 预热：2025-04-11 05:00:00+08:00 → 2025-04-12 05:00:00+08:00；50 进行：2025-04-12 05:00:00+08:00 → 2025-04-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77022 / 22|`[[],[],[]]`|2027-01-15 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|50 进行：2027-01-15 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77023 / 23|`[[10,50],[1,7],[18000,18000]]`|2027-01-29 05:00:00+08:00 → 2027-02-06 05:00:00+08:00|10 预热：2027-01-29 05:00:00+08:00 → 2027-01-30 05:00:00+08:00；50 进行：2027-01-30 05:00:00+08:00 → 2027-02-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77024 / 25|`[[10,50],[0,0],[18000,18060]]`|2027-02-12 05:00:00+08:00 → 2027-02-12 05:01:00+08:00|10 预热：2027-02-12 05:00:00+08:00 → 2027-02-12 05:00:00+08:00；50 进行：2027-02-12 05:00:00+08:00 → 2027-02-12 05:01:00+08:00|`{"status":"client-table-states","warnings":[{"kind":"zero-second-state","stageId":10}]}`|
|77025 / 26|`[[10,50],[1,7],[18000,18000]]`|2026-12-10 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|10 预热：2026-12-10 05:00:00+08:00 → 2026-12-11 05:00:00+08:00；50 进行：2026-12-11 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77026 / 27|`[[10,50],[1,5],[18000,18000]]`|2026-12-25 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|10 预热：2026-12-25 05:00:00+08:00 → 2026-12-26 05:00:00+08:00；50 进行：2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77027 / 28|`[[10,50],[1,7],[18000,18000]]`|2026-12-10 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|10 预热：2026-12-10 05:00:00+08:00 → 2026-12-11 05:00:00+08:00；50 进行：2026-12-11 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77028 / 30|`[[10,50],[1,7],[18000,18000]]`|2027-01-14 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|10 预热：2027-01-14 05:00:00+08:00 → 2027-01-15 05:00:00+08:00；50 进行：2027-01-15 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77029 / 34|`[[10,50],[1,5],[18000,18000]]`|2026-11-20 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|10 预热：2026-11-20 05:00:00+08:00 → 2026-11-21 05:00:00+08:00；50 进行：2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77030 / 35|`[[10,50],[1,5],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|77031 / 36|`[[10,50],[1,5],[18000,18000]]`|2025-03-17 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|10 预热：2025-03-17 05:00:00+08:00 → 2025-03-18 05:00:00+08:00；50 进行：2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77032 / 37|`[[10,50],[1,5],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|77033 / 38|`[[10,50],[1,5],[18000,18000]]`|2025-03-17 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|10 预热：2025-03-17 05:00:00+08:00 → 2025-03-18 05:00:00+08:00；50 进行：2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77034 / 41|`[[10,50],[1,5],[18000,18000]]`|2025-04-18 05:00:00+08:00 → 2025-04-24 05:00:00+08:00|10 预热：2025-04-18 05:00:00+08:00 → 2025-04-19 05:00:00+08:00；50 进行：2025-04-19 05:00:00+08:00 → 2025-04-24 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77035 / 42|`[[10,50],[1,5],[18000,18000]]`|2026-11-19 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|10 预热：2026-11-19 05:00:00+08:00 → 2026-11-20 05:00:00+08:00；50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77036 / 43|`[[10,50],[1,7],[18000,18000]]`|2025-04-30 05:00:00+08:00 → 2025-05-08 05:00:00+08:00|10 预热：2025-04-30 05:00:00+08:00 → 2025-05-01 05:00:00+08:00；50 进行：2025-05-01 05:00:00+08:00 → 2025-05-08 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77037 / 44|`[[],[],[]]`|2025-05-08 05:00:00+08:00 → 2025-05-15 05:00:00+08:00|50 进行：2025-05-08 05:00:00+08:00 → 2025-05-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77038 / 45|`[[10,50],[1,5],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|77039 / 46|`[[10,50],[1,5],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|77040 / 47|`[[10,50],[1,5],[18000,18000]]`|2026-12-02 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|10 预热：2026-12-02 05:00:00+08:00 → 2026-12-03 05:00:00+08:00；50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77041 / 48|`[[10,50],[1,5],[18000,18000]]`|2026-12-17 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|10 预热：2026-12-17 05:00:00+08:00 → 2026-12-18 05:00:00+08:00；50 进行：2026-12-18 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77042 / 49|`[[10,50],[1,5],[18000,18000]]`|2026-12-30 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|10 预热：2026-12-30 05:00:00+08:00 → 2026-12-31 05:00:00+08:00；50 进行：2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77043 / 50|`[[10,50],[1,5],[18000,18000]]`|2027-01-16 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|10 预热：2027-01-16 05:00:00+08:00 → 2027-01-17 05:00:00+08:00；50 进行：2027-01-17 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77044 / 51|`[[10,50],[1,5],[18000,18000]]`|2026-11-19 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|10 预热：2026-11-19 05:00:00+08:00 → 2026-11-20 05:00:00+08:00；50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77045 / 52|`[[10,50],[1,5],[18000,18000]]`|2025-07-08 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|10 预热：2025-07-08 05:00:00+08:00 → 2025-07-09 05:00:00+08:00；50 进行：2025-07-09 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77046 / 53|`[[10,50],[1,5],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|77047 / 54|`[[10,50],[1,5],[18000,18000]]`|2026-11-19 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|10 预热：2026-11-19 05:00:00+08:00 → 2026-11-20 05:00:00+08:00；50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77048 / 55|`[[10,50],[1,3],[18000,18000]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|10 预热：2026-11-12 05:00:00+08:00 → 2026-11-13 05:00:00+08:00；50 进行：2026-11-13 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77049 / 56|`[[10,50],[1,4],[18000,18000]]`|2026-11-18 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|10 预热：2026-11-18 05:00:00+08:00 → 2026-11-19 05:00:00+08:00；50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77050 / 57|`[[10,50],[1,5],[18000,18000]]`|2025-09-10 05:00:00+08:00 → 2025-09-16 05:00:00+08:00|10 预热：2025-09-10 05:00:00+08:00 → 2025-09-11 05:00:00+08:00；50 进行：2025-09-11 05:00:00+08:00 → 2025-09-16 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77051 / 58|`[[10,50],[1,4],[18000,18000]]`|2300-08-26 05:00:00+08:00 → 2300-08-31 05:00:00+08:00|10 预热：2300-08-26 05:00:00+08:00 → 2300-08-27 05:00:00+08:00；50 进行：2300-08-27 05:00:00+08:00 → 2300-08-31 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77052 / 59|`[[10,50],[1,4],[18000,18000]]`|2026-11-25 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|10 预热：2026-11-25 05:00:00+08:00 → 2026-11-26 05:00:00+08:00；50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77053 / 60|`[[10,50],[1,4],[18000,18000]]`|2026-12-02 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|10 预热：2026-12-02 05:00:00+08:00 → 2026-12-03 05:00:00+08:00；50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77054 / 61|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77055 / 62|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77056 / 63|`[[],[],[]]`|2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|50 进行：2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77057 / 64|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77058 / 65|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77059 / 66|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77060 / 67|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77061 / 72|`[[10,50],[5,5],[18000,18000]]`|2025-12-25 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|10 预热：2025-12-25 05:00:00+08:00 → 2025-12-30 05:00:00+08:00；50 进行：2025-12-30 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|77062 / 68|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77063 / 69|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77064 / 70|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77065 / 71|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77066 / 73|`[[],[],[]]`|2026-02-13 05:00:00+08:00 → 2026-02-18 05:00:00+08:00|50 进行：2026-02-13 05:00:00+08:00 → 2026-02-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77067 / 74|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77068 / 75|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77069 / 76|`[[],[],[]]`|2026-03-30 05:00:00+08:00 → 2026-04-04 05:00:00+08:00|50 进行：2026-03-30 05:00:00+08:00 → 2026-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77070 / 77|`[[],[],[]]`|2026-05-14 05:00:00+08:00 → 2026-05-19 05:00:00+08:00|50 进行：2026-05-14 05:00:00+08:00 → 2026-05-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77071 / 78|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77072 / 79|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77073 / 80|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77074 / 81|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|77075 / 82|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|78001 / 1|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|79001 / 1|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|79002 / 2|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81001 / 1|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81002 / 2|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81003 / 3|`[[],[],[]]`|2027-02-18 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|50 进行：2027-02-18 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81004 / 4|`[[],[],[]]`|2027-02-13 05:00:00+08:00 → 2027-02-18 05:00:00+08:00|50 进行：2027-02-13 05:00:00+08:00 → 2027-02-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81005 / 5|`[[],[],[]]`|2027-02-13 05:00:00+08:00 → 2027-02-13 05:01:00+08:00|50 进行：2027-02-13 05:00:00+08:00 → 2027-02-13 05:01:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81006 / 6|`[[],[],[]]`|2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|50 进行：2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81007 / 7|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81008 / 8|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|81009 / 9|`[[],[],[]]`|2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|50 进行：2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81010 / 9|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|81011 / 9|`[[],[],[]]`|2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|50 进行：2025-03-18 05:00:00+08:00 → 2025-03-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81012 / 10|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81013 / 11|`[[],[],[]]`|2025-05-01 05:00:00+08:00 → 2025-05-08 05:00:00+08:00|50 进行：2025-05-01 05:00:00+08:00 → 2025-05-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81014 / 12|`[[],[],[]]`|2025-05-08 05:00:00+08:00 → 2025-05-15 05:00:00+08:00|50 进行：2025-05-08 05:00:00+08:00 → 2025-05-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81015 / 13|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|81016 / 14|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|81017 / 15|`[[],[],[]]`|2026-12-18 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|50 进行：2026-12-18 05:00:00+08:00 → 2026-12-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81018 / 10|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81019 / 16|`[[],[],[]]`|2025-07-09 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|50 进行：2025-07-09 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81020 / 16|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|81021 / 10|`[[],[],[]]`|2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|50 进行：2026-11-20 05:00:00+08:00 → 2026-11-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81022 / 17|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81023 / 18|`[[],[],[]]`|2025-09-11 05:00:00+08:00 → 2025-09-16 05:00:00+08:00|50 进行：2025-09-11 05:00:00+08:00 → 2025-09-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81024 / 19|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-08-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81025 / 20|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81026 / 21|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81027 / 22|`[[],[],[]]`|2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|50 进行：2025-10-31 05:00:00+08:00 → 2025-11-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81028 / 23|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81029 / 24|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81030 / 25|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81031 / 26|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81032 / 27|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81033 / 28|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81034 / 29|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81035 / 30|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81036 / 31|`[[],[],[]]`|2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|50 进行：2026-11-19 05:00:00+08:00 → 2026-11-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81037 / 32|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81038 / 33|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|81039 / 34|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|82001 / 1|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-09-05 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-09-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|83010 / 10|`[[10,50],[1,5],[18000,18000]]`|2027-01-07 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|10 预热：2027-01-07 05:00:00+08:00 → 2027-01-08 05:00:00+08:00；50 进行：2027-01-08 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83011 / 11|`[[10,50],[1,5],[18000,18000]]`|2027-02-24 05:00:00+08:00 → 2027-03-02 05:00:00+08:00|10 预热：2027-02-24 05:00:00+08:00 → 2027-02-25 05:00:00+08:00；50 进行：2027-02-25 05:00:00+08:00 → 2027-03-02 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83012 / 12|`[[10,50],[1,5],[18000,18000]]`|2027-04-18 05:00:00+08:00 → 2027-04-24 05:00:00+08:00|10 预热：2027-04-18 05:00:00+08:00 → 2027-04-19 05:00:00+08:00；50 进行：2027-04-19 05:00:00+08:00 → 2027-04-24 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83013 / 13|`[[10,50],[1,5],[18000,18000]]`|2027-02-08 05:00:00+08:00 → 2027-02-14 05:00:00+08:00|10 预热：2027-02-08 05:00:00+08:00 → 2027-02-09 05:00:00+08:00；50 进行：2027-02-09 05:00:00+08:00 → 2027-02-14 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83014 / 14|`[[10,50],[1,5],[18000,18000]]`|2026-12-04 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|10 预热：2026-12-04 05:00:00+08:00 → 2026-12-05 05:00:00+08:00；50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83015 / 15|`[[10,50],[1,5],[18000,18000]]`|2025-02-28 05:00:00+08:00 → 2025-03-06 05:00:00+08:00|10 预热：2025-02-28 05:00:00+08:00 → 2025-03-01 05:00:00+08:00；50 进行：2025-03-01 05:00:00+08:00 → 2025-03-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83016 / 16|`[[10,50],[1,5],[18000,18000]]`|2025-04-05 05:00:00+08:00 → 2025-04-11 05:00:00+08:00|10 预热：2025-04-05 05:00:00+08:00 → 2025-04-06 05:00:00+08:00；50 进行：2025-04-06 05:00:00+08:00 → 2025-04-11 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83017 / 17|`[[10,50],[1,5],[18000,18000]]`|2026-11-25 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|10 预热：2026-11-25 05:00:00+08:00 → 2026-11-26 05:00:00+08:00；50 进行：2026-11-26 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83018 / 18|`[[10,50],[1,5],[18000,18000]]`|2026-12-24 05:00:00+08:00 → 2026-12-30 05:00:00+08:00|10 预热：2026-12-24 05:00:00+08:00 → 2026-12-25 05:00:00+08:00；50 进行：2026-12-25 05:00:00+08:00 → 2026-12-30 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83019 / 19|`[[10,50],[1,5],[18000,18000]]`|2025-06-06 05:00:00+08:00 → 2025-06-12 05:00:00+08:00|10 预热：2025-06-06 05:00:00+08:00 → 2025-06-07 05:00:00+08:00；50 进行：2025-06-07 05:00:00+08:00 → 2025-06-12 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83020 / 20|`[[10,50],[1,5],[18000,18000]]`|2025-08-06 05:00:00+08:00 → 2025-08-12 05:00:00+08:00|10 预热：2025-08-06 05:00:00+08:00 → 2025-08-07 05:00:00+08:00；50 进行：2025-08-07 05:00:00+08:00 → 2025-08-12 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83021 / 21|`[[10,50],[1,3],[18000,18000]]`|2026-11-22 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|10 预热：2026-11-22 05:00:00+08:00 → 2026-11-23 05:00:00+08:00；50 进行：2026-11-23 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83022 / 22|`[[10,50],[1,5],[18000,18000]]`|2025-09-30 05:00:00+08:00 → 2025-10-06 05:00:00+08:00|10 预热：2025-09-30 05:00:00+08:00 → 2025-10-01 05:00:00+08:00；50 进行：2025-10-01 05:00:00+08:00 → 2025-10-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83023 / 23|`[[],[],[]]`|2026-11-23 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2026-11-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|83024 / 24|`[[50],[5],[18000]]`|2025-12-15 05:00:00+08:00 → 2025-12-20 05:00:00+08:00|50 进行：2025-12-15 05:00:00+08:00 → 2025-12-20 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83025 / 25|`[[50],[5],[18000]]`|2026-03-05 05:00:00+08:00 → 2026-03-10 05:00:00+08:00|50 进行：2026-03-05 05:00:00+08:00 → 2026-03-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83026 / 26|`[[50],[5],[18000]]`|2026-04-29 05:00:00+08:00 → 2026-05-04 05:00:00+08:00|50 进行：2026-04-29 05:00:00+08:00 → 2026-05-04 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83027 / 27|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|83028 / 28|`[[50],[5],[18000]]`|2026-06-23 05:00:00+08:00 → 2026-06-28 05:00:00+08:00|50 进行：2026-06-23 05:00:00+08:00 → 2026-06-28 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83029 / 29|`[[],[],[]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|83030 / 30|`[[50],[5],[18000]]`|2026-08-22 05:00:00+08:00 → 2026-08-27 05:00:00+08:00|50 进行：2026-08-22 05:00:00+08:00 → 2026-08-27 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|83031 / 31|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84001 / 1|`[[],[],[]]`|2027-01-31 05:00:00+08:00 → 2027-02-03 05:00:00+08:00|50 进行：2027-01-31 05:00:00+08:00 → 2027-02-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84002 / 2|`[[],[],[]]`|2027-01-12 05:00:00+08:00 → 2027-01-15 05:00:00+08:00|50 进行：2027-01-12 05:00:00+08:00 → 2027-01-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84003 / 3|`[[],[],[]]`|2027-02-10 05:00:00+08:00 → 2027-02-13 05:00:00+08:00|50 进行：2027-02-10 05:00:00+08:00 → 2027-02-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84004 / 4|`[[],[],[]]`|2027-03-08 05:00:00+08:00 → 2027-03-11 05:00:00+08:00|50 进行：2027-03-08 05:00:00+08:00 → 2027-03-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84005 / 5|`[[],[],[]]`|2027-03-21 05:00:00+08:00 → 2027-03-24 05:00:00+08:00|50 进行：2027-03-21 05:00:00+08:00 → 2027-03-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84006 / 6|`[[],[],[]]`|2027-04-03 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|50 进行：2027-04-03 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84007 / 7|`[[],[],[]]`|2027-04-12 05:00:00+08:00 → 2027-04-15 05:00:00+08:00|50 进行：2027-04-12 05:00:00+08:00 → 2027-04-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84008 / 8|`[[],[],[]]`|2027-04-26 05:00:00+08:00 → 2027-04-29 05:00:00+08:00|50 进行：2027-04-26 05:00:00+08:00 → 2027-04-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84009 / 9|`[[],[],[]]`|2025-03-07 05:00:00+08:00 → 2025-03-10 05:00:00+08:00|50 进行：2025-03-07 05:00:00+08:00 → 2025-03-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84010 / 101|`[[],[],[]]`|2025-03-23 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-23 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84011 / 10|`[[],[],[]]`|2025-04-20 05:00:00+08:00 → 2025-04-23 05:00:00+08:00|50 进行：2025-04-20 05:00:00+08:00 → 2025-04-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84012 / 11|`[[],[],[]]`|2026-12-08 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|50 进行：2026-12-08 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84013 / 12|`[[],[],[]]`|2025-05-10 05:00:00+08:00 → 2025-05-13 05:00:00+08:00|50 进行：2025-05-10 05:00:00+08:00 → 2025-05-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84014 / 13|`[[],[],[]]`|2027-01-05 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|50 进行：2027-01-05 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84015 / 14|`[[],[],[]]`|2027-01-19 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|50 进行：2027-01-19 05:00:00+08:00 → 2027-01-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84016 / 15|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-02 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84017 / 15|`[[],[],[]]`|2025-06-30 05:00:00+08:00 → 2025-07-03 05:00:00+08:00|50 进行：2025-06-30 05:00:00+08:00 → 2025-07-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|84018 / 15|`[[],[],[]]`|2025-08-04 05:00:00+08:00 → 2025-08-07 05:00:00+08:00|50 进行：2025-08-04 05:00:00+08:00 → 2025-08-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|86001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|86002 / 2|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|86003 / 3|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87001 / 1|`[[],[],[]]`|2026-11-24 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|50 进行：2026-11-24 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87002 / 3|`[[],[],[]]`|2026-12-08 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|50 进行：2026-12-08 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87004 / 4|`[[],[],[]]`|2026-11-25 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|50 进行：2026-11-25 05:00:00+08:00 → 2026-11-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87005 / 5|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87006 / 6|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-03 05:00:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87007 / 7|`[[],[],[]]`|2026-11-24 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|50 进行：2026-11-24 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87008 / 8|`[[],[],[]]`|2027-01-26 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|50 进行：2027-01-26 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87009 / 9|`[[],[],[]]`|2027-02-14 05:00:00+08:00 → 2027-02-17 05:00:00+08:00|50 进行：2027-02-14 05:00:00+08:00 → 2027-02-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87010 / 10|`[[],[],[]]`|2027-01-27 05:00:00+08:00 → 2027-01-30 05:00:00+08:00|50 进行：2027-01-27 05:00:00+08:00 → 2027-01-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87011 / 11|`[[],[],[]]`|2027-02-20 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|50 进行：2027-02-20 05:00:00+08:00 → 2027-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87012 / 12|`[[],[],[]]`|2027-03-16 05:00:00+08:00 → 2027-03-19 05:00:00+08:00|50 进行：2027-03-16 05:00:00+08:00 → 2027-03-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87013 / 13|`[[],[],[]]`|2027-04-08 05:00:00+08:00 → 2027-04-11 05:00:00+08:00|50 进行：2027-04-08 05:00:00+08:00 → 2027-04-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|87014 / 14|`[[],[],[]]`|2025-04-08 05:00:00+08:00 → 2025-04-11 05:00:00+08:00|50 进行：2025-04-08 05:00:00+08:00 → 2025-04-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88001 / 1|`[[],[],[]]`|2026-11-18 05:00:00+08:00 → 2026-11-21 04:59:00+08:00|50 进行：2026-11-18 05:00:00+08:00 → 2026-11-21 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88002 / 2|`[[],[],[]]`|2026-12-02 05:00:00+08:00 → 2026-12-05 04:59:00+08:00|50 进行：2026-12-02 05:00:00+08:00 → 2026-12-05 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88003 / 3|`[[],[],[]]`|2026-12-16 05:00:00+08:00 → 2026-12-19 04:59:00+08:00|50 进行：2026-12-16 05:00:00+08:00 → 2026-12-19 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88004 / 4|`[[],[],[]]`|2026-12-28 05:00:00+08:00 → 2026-12-31 04:59:00+08:00|50 进行：2026-12-28 05:00:00+08:00 → 2026-12-31 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88005 / 5|`[[],[],[]]`|2026-11-27 05:00:00+08:00 → 2026-11-30 04:59:00+08:00|50 进行：2026-11-27 05:00:00+08:00 → 2026-11-30 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88006 / 6|`[[],[],[]]`|2027-01-10 05:00:00+08:00 → 2027-01-13 04:59:00+08:00|50 进行：2027-01-10 05:00:00+08:00 → 2027-01-13 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88007 / 7|`[[],[],[]]`|2026-12-12 05:00:00+08:00 → 2026-12-15 04:59:00+08:00|50 进行：2026-12-12 05:00:00+08:00 → 2026-12-15 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88008 / 8|`[[],[],[]]`|2027-01-21 05:00:00+08:00 → 2027-01-24 04:59:00+08:00|50 进行：2027-01-21 05:00:00+08:00 → 2027-01-24 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88009 / 9|`[[],[],[]]`|2027-02-02 05:00:00+08:00 → 2027-02-05 04:59:00+08:00|50 进行：2027-02-02 05:00:00+08:00 → 2027-02-05 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88010 / 10|`[[],[],[]]`|2027-02-10 05:00:00+08:00 → 2027-02-13 04:59:00+08:00|50 进行：2027-02-10 05:00:00+08:00 → 2027-02-13 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88011 / 11|`[[],[],[]]`|2026-12-27 05:00:00+08:00 → 2026-12-30 04:59:00+08:00|50 进行：2026-12-27 05:00:00+08:00 → 2026-12-30 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88012 / 12|`[[],[],[]]`|2027-01-11 05:00:00+08:00 → 2027-01-14 04:59:00+08:00|50 进行：2027-01-11 05:00:00+08:00 → 2027-01-14 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88013 / 13|`[[],[],[]]`|2027-02-24 05:00:00+08:00 → 2027-02-27 04:59:00+08:00|50 进行：2027-02-24 05:00:00+08:00 → 2027-02-27 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88014 / 14|`[[],[],[]]`|2027-02-01 05:00:00+08:00 → 2027-02-04 04:59:00+08:00|50 进行：2027-02-01 05:00:00+08:00 → 2027-02-04 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88015 / 15|`[[],[],[]]`|2027-02-12 05:00:00+08:00 → 2027-02-15 04:59:00+08:00|50 进行：2027-02-12 05:00:00+08:00 → 2027-02-15 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88016 / 16|`[[],[],[]]`|2027-03-11 05:00:00+08:00 → 2027-03-14 04:59:00+08:00|50 进行：2027-03-11 05:00:00+08:00 → 2027-03-14 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88017 / 17|`[[],[],[]]`|2027-02-24 05:00:00+08:00 → 2027-02-27 04:59:00+08:00|50 进行：2027-02-24 05:00:00+08:00 → 2027-02-27 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88018 / 18|`[[],[],[]]`|2027-03-28 05:00:00+08:00 → 2027-03-31 04:59:00+08:00|50 进行：2027-03-28 05:00:00+08:00 → 2027-03-31 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88019 / 19|`[[],[],[]]`|2026-11-29 05:00:00+08:00 → 2026-12-02 04:59:00+08:00|50 进行：2026-11-29 05:00:00+08:00 → 2026-12-02 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88020 / 20|`[[],[],[]]`|2026-11-21 05:00:00+08:00 → 2026-11-24 04:59:00+08:00|50 进行：2026-11-21 05:00:00+08:00 → 2026-11-24 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88021 / 21|`[[],[],[]]`|2026-11-27 05:00:00+08:00 → 2026-11-30 04:59:00+08:00|50 进行：2026-11-27 05:00:00+08:00 → 2026-11-30 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88022 / 22|`[[],[],[]]`|2025-05-06 05:00:00+08:00 → 2025-05-09 04:59:00+08:00|50 进行：2025-05-06 05:00:00+08:00 → 2025-05-09 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88023 / 21|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2026-12-14 04:59:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2026-12-14 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88024 / 21|`[[],[],[]]`|2026-12-25 05:00:00+08:00 → 2026-12-28 04:59:00+08:00|50 进行：2026-12-25 05:00:00+08:00 → 2026-12-28 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88025 / 22|`[[],[],[]]`|2025-05-16 05:00:00+08:00 → 2025-05-19 04:59:00+08:00|50 进行：2025-05-16 05:00:00+08:00 → 2025-05-19 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|88026 / 23|`[[],[],[]]`|2027-01-16 05:00:00+08:00 → 2027-01-19 04:59:00+08:00|50 进行：2027-01-16 05:00:00+08:00 → 2027-01-19 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|89001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|90001 / 1|`[[],[],[]]`|2026-11-23 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|90002 / 2|`[[10,50],[1,5],[18000,18000]]`|2026-11-30 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|10 预热：2026-11-30 05:00:00+08:00 → 2026-12-01 05:00:00+08:00；50 进行：2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|90003 / 3|`[[],[],[]]`|2026-12-06 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|50 进行：2026-12-06 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|90004 / 4|`[[10,50],[1,5],[18000,18000]]`|2026-11-25 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|10 预热：2026-11-25 05:00:00+08:00 → 2026-11-26 05:00:00+08:00；50 进行：2026-11-26 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|90005 / 5|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|90006 / 6|`[[],[],[]]`|2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|90007 / 7|`[[10,50],[1,5],[18000,18000]]`|2026-11-25 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|10 预热：2026-11-25 05:00:00+08:00 → 2026-11-26 05:00:00+08:00；50 进行：2026-11-26 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|90008 / 8|`[[],[],[]]`|2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|90009 / 9|`[[10,50],[1,5],[18000,18000]]`|2026-11-25 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|10 预热：2026-11-25 05:00:00+08:00 → 2026-11-26 05:00:00+08:00；50 进行：2026-11-26 05:00:00+08:00 → 2026-12-01 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|91001 / 1|`[[],[],[]]`|2024-10-01 05:00:00+08:00 → 2024-10-08 04:59:00+08:00|50 进行：2024-10-01 05:00:00+08:00 → 2024-10-08 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91002 / 2|`[[],[],[]]`|2025-01-01 05:00:00+08:00 → 2025-01-04 04:59:00+08:00|50 进行：2025-01-01 05:00:00+08:00 → 2025-01-04 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91003 / 3|`[[],[],[]]`|2025-10-01 05:00:00+08:00 → 2025-10-02 05:00:00+08:00|50 进行：2025-10-01 05:00:00+08:00 → 2025-10-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91004 / 3|`[[],[],[]]`|2025-10-06 05:00:00+08:00 → 2025-10-07 05:00:00+08:00|50 进行：2025-10-06 05:00:00+08:00 → 2025-10-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91005 / 5|`[[],[],[]]`|2026-02-16 05:00:00+08:00 → 2026-02-19 04:59:00+08:00|50 进行：2026-02-16 05:00:00+08:00 → 2026-02-19 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91006 / 6|`[[],[],[]]`|2026-11-15 05:00:00+08:00 → 2026-11-18 04:59:00+08:00|50 进行：2026-11-15 05:00:00+08:00 → 2026-11-18 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91007 / 7|`[[],[],[]]`|2026-05-27 05:00:00+08:00 → 2026-05-30 04:59:00+08:00|50 进行：2026-05-27 05:00:00+08:00 → 2026-05-30 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91008 / 8|`[[],[],[]]`|2026-11-15 05:00:00+08:00 → 2026-11-18 04:59:00+08:00|50 进行：2026-11-15 05:00:00+08:00 → 2026-11-18 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91009 / 9|`[[],[],[]]`|2026-10-01 05:00:00+08:00 → 2026-10-02 05:00:00+08:00|50 进行：2026-10-01 05:00:00+08:00 → 2026-10-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|91010 / 9|`[[],[],[]]`|2026-10-06 05:00:00+08:00 → 2026-10-07 05:00:00+08:00|50 进行：2026-10-06 05:00:00+08:00 → 2026-10-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|92002 / 2|`[[],[],[]]`|2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|96001 / 1|`[[50,60],[5,1],[18000,18000]]`|2026-12-01 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-06 05:00:00+08:00；60 通知/领奖：2026-12-06 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96002 / 2|`[[50,60],[5,1],[18000,18000]]`|2027-01-03 05:00:00+08:00 → 2027-01-09 05:00:00+08:00|50 进行：2027-01-03 05:00:00+08:00 → 2027-01-08 05:00:00+08:00；60 通知/领奖：2027-01-08 05:00:00+08:00 → 2027-01-09 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96003 / 3|`[[50,60],[5,1],[18000,18000]]`|2026-12-19 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00；60 通知/领奖：2026-12-24 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96004 / 4|`[[50,60],[3,1],[18000,18000]]`|2026-12-17 05:00:00+08:00 → 2026-12-21 05:00:00+08:00|50 进行：2026-12-17 05:00:00+08:00 → 2026-12-20 05:00:00+08:00；60 通知/领奖：2026-12-20 05:00:00+08:00 → 2026-12-21 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96005 / 5|`[[50,60],[5,1],[18000,18000]]`|2026-11-26 05:00:00+08:00 → 2026-12-02 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-01 05:00:00+08:00；60 通知/领奖：2026-12-01 05:00:00+08:00 → 2026-12-02 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96006 / 6|`[[50,60],[3,1],[18000,18000]]`|2027-03-01 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|50 进行：2027-03-01 05:00:00+08:00 → 2027-03-04 05:00:00+08:00；60 通知/领奖：2027-03-04 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96007 / 7|`[[50,60],[3,1],[18000,18000]]`|2027-01-04 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|50 进行：2027-01-04 05:00:00+08:00 → 2027-01-07 05:00:00+08:00；60 通知/领奖：2027-01-07 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96008 / 8|`[[50,60],[3,1],[18000,18000]]`|2027-03-22 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|50 进行：2027-03-22 05:00:00+08:00 → 2027-03-25 05:00:00+08:00；60 通知/领奖：2027-03-25 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|96009 / 9|`[[50,60],[3,1],[18000,18000]]`|2027-04-02 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|50 进行：2027-04-02 05:00:00+08:00 → 2027-04-05 05:00:00+08:00；60 通知/领奖：2027-04-05 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|98001 / 1|`[[],[],[]]`|2026-12-01 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-12-01 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98002 / 2|`[[],[],[]]`|2027-01-03 05:00:00+08:00 → 2027-01-09 05:00:00+08:00|50 进行：2027-01-03 05:00:00+08:00 → 2027-01-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98003 / 3|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98004 / 4|`[[],[],[]]`|2026-12-17 05:00:00+08:00 → 2026-12-21 05:00:00+08:00|50 进行：2026-12-17 05:00:00+08:00 → 2026-12-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98005 / 5|`[[],[],[]]`|2026-11-26 05:00:00+08:00 → 2026-12-02 05:00:00+08:00|50 进行：2026-11-26 05:00:00+08:00 → 2026-12-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98006 / 6|`[[],[],[]]`|2027-03-01 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|50 进行：2027-03-01 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98007 / 7|`[[],[],[]]`|2027-01-04 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|50 进行：2027-01-04 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98008 / 8|`[[],[],[]]`|2027-03-22 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|50 进行：2027-03-22 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|98009 / 9|`[[],[],[]]`|2027-04-02 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|50 进行：2027-04-02 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|99001 / 1|`[[10,50],[1,5],[18000,18000]]`|2027-01-13 05:00:00+08:00 → 2027-01-19 05:00:00+08:00|10 预热：2027-01-13 05:00:00+08:00 → 2027-01-14 05:00:00+08:00；50 进行：2027-01-14 05:00:00+08:00 → 2027-01-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99002 / 2|`[[10,50],[1,5],[18000,18000]]`|2026-12-18 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|10 预热：2026-12-18 05:00:00+08:00 → 2026-12-19 05:00:00+08:00；50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99003 / 3|`[[10,50],[1,5],[18000,18000]]`|2027-02-10 05:00:00+08:00 → 2027-02-16 05:00:00+08:00|10 预热：2027-02-10 05:00:00+08:00 → 2027-02-11 05:00:00+08:00；50 进行：2027-02-11 05:00:00+08:00 → 2027-02-16 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99004 / 4|`[[10,50],[1,5],[18000,18000]]`|2027-01-23 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|10 预热：2027-01-23 05:00:00+08:00 → 2027-01-24 05:00:00+08:00；50 进行：2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99005 / 5|`[[10,50],[1,5],[18000,18000]]`|2026-12-18 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|10 预热：2026-12-18 05:00:00+08:00 → 2026-12-19 05:00:00+08:00；50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99006 / 6|`[[10,50],[1,5],[18000,18000]]`|2027-01-23 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|10 预热：2027-01-23 05:00:00+08:00 → 2027-01-24 05:00:00+08:00；50 进行：2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99007 / 7|`[[10,50],[1,5],[18000,18000]]`|2026-12-18 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|10 预热：2026-12-18 05:00:00+08:00 → 2026-12-19 05:00:00+08:00；50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99008 / 8|`[[10,50],[1,5],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|99009 / 9|`[[10,50],[1,5],[18000,18000]]`|2026-12-10 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|10 预热：2026-12-10 05:00:00+08:00 → 2026-12-11 05:00:00+08:00；50 进行：2026-12-11 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99010 / 10|`[[10,50],[1,5],[18000,18000]]`|2025-05-23 05:00:00+08:00 → 2025-05-29 05:00:00+08:00|10 预热：2025-05-23 05:00:00+08:00 → 2025-05-24 05:00:00+08:00；50 进行：2025-05-24 05:00:00+08:00 → 2025-05-29 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99011 / 11|`[[10,50],[1,5],[18000,18000]]`|2027-01-07 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|10 预热：2027-01-07 05:00:00+08:00 → 2027-01-08 05:00:00+08:00；50 进行：2027-01-08 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99012 / 12|`[[10,50],[1,5],[18000,18000]]`|2025-07-23 05:00:00+08:00 → 2025-07-29 05:00:00+08:00|10 预热：2025-07-23 05:00:00+08:00 → 2025-07-24 05:00:00+08:00；50 进行：2025-07-24 05:00:00+08:00 → 2025-07-29 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99013 / 13|`[[10,50],[1,5],[18000,18000]]`|2025-09-15 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|10 预热：2025-09-15 05:00:00+08:00 → 2025-09-16 05:00:00+08:00；50 进行：2025-09-16 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99014 / 14|`[[10,50],[1,3],[18000,18000]]`|2026-12-06 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|10 预热：2026-12-06 05:00:00+08:00 → 2026-12-07 05:00:00+08:00；50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99015 / 15|`[[50],[3],[18000]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99016 / 16|`[[50],[5],[18000]]`|2025-11-30 05:00:00+08:00 → 2025-12-05 05:00:00+08:00|50 进行：2025-11-30 05:00:00+08:00 → 2025-12-05 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99017 / 17|`[[50],[3],[18000]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99018 / 18|`[[50],[5],[18000]]`|2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|50 进行：2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99019 / 19|`[[50],[3],[18000]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99020 / 20|`[[50],[5],[18000]]`|2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99021 / 21|`[[50],[5],[18000]]`|2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|50 进行：2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99022 / 22|`[[50],[5],[18000]]`|2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|50 进行：2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99025 / 25|`[[50],[5],[18000]]`|2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|50 进行：2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|99026 / 26|`[[50],[5],[18000]]`|2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|100001 / 1|`[[],[],[]]`|2027-01-14 05:00:00+08:00 → 2027-01-19 05:00:00+08:00|50 进行：2027-01-14 05:00:00+08:00 → 2027-01-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100002 / 2|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100003 / 3|`[[],[],[]]`|2027-02-11 05:00:00+08:00 → 2027-02-16 05:00:00+08:00|50 进行：2027-02-11 05:00:00+08:00 → 2027-02-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100004 / 4|`[[],[],[]]`|2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|50 进行：2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100005 / 5|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100006 / 6|`[[],[],[]]`|2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|50 进行：2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100007 / 7|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100008 / 8|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|100009 / 7|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100010 / 8|`[[],[],[]]`|2025-05-24 05:00:00+08:00 → 2025-05-29 05:00:00+08:00|50 进行：2025-05-24 05:00:00+08:00 → 2025-05-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100011 / 6|`[[],[],[]]`|2027-01-08 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|50 进行：2027-01-08 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100012 / 8|`[[],[],[]]`|2025-07-24 05:00:00+08:00 → 2025-07-29 05:00:00+08:00|50 进行：2025-07-24 05:00:00+08:00 → 2025-07-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100013 / 8|`[[],[],[]]`|2025-09-16 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|50 进行：2025-09-16 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100014 / 8|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100015 / 8|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100016 / 8|`[[],[],[]]`|2025-11-30 05:00:00+08:00 → 2025-12-05 05:00:00+08:00|50 进行：2025-11-30 05:00:00+08:00 → 2025-12-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100017 / 8|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100018 / 8|`[[],[],[]]`|2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|50 进行：2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100019 / 8|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100020 / 8|`[[],[],[]]`|2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100021 / 8|`[[],[],[]]`|2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|50 进行：2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100022 / 9|`[[],[],[]]`|2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|50 进行：2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100025 / 9|`[[],[],[]]`|2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|50 进行：2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|100026 / 9|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101001 / 1|`[[],[],[]]`|2027-01-14 05:00:00+08:00 → 2027-01-19 05:00:00+08:00|50 进行：2027-01-14 05:00:00+08:00 → 2027-01-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101002 / 2|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101003 / 3|`[[],[],[]]`|2027-02-11 05:00:00+08:00 → 2027-02-16 05:00:00+08:00|50 进行：2027-02-11 05:00:00+08:00 → 2027-02-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101004 / 4|`[[],[],[]]`|2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|50 进行：2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101005 / 5|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101006 / 6|`[[],[],[]]`|2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|50 进行：2027-01-24 05:00:00+08:00 → 2027-01-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101007 / 7|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101008 / 8|`[[],[],[]]`|2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|50 进行：2026-12-19 05:00:00+08:00 → 2026-12-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101009 / 9|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|101010 / 7|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101011 / 8|`[[],[],[]]`|2026-12-11 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|50 进行：2026-12-11 05:00:00+08:00 → 2026-12-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101012 / 10|`[[],[],[]]`|2025-05-24 05:00:00+08:00 → 2025-05-29 05:00:00+08:00|50 进行：2025-05-24 05:00:00+08:00 → 2025-05-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101013 / 6|`[[],[],[]]`|2027-01-08 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|50 进行：2027-01-08 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101014 / 11|`[[],[],[]]`|2025-07-24 05:00:00+08:00 → 2025-07-29 05:00:00+08:00|50 进行：2025-07-24 05:00:00+08:00 → 2025-07-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101015 / 12|`[[],[],[]]`|2025-09-16 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|50 进行：2025-09-16 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101016 / 13|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101017 / 14|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101018 / 15|`[[],[],[]]`|2025-11-30 05:00:00+08:00 → 2025-12-05 05:00:00+08:00|50 进行：2025-11-30 05:00:00+08:00 → 2025-12-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101019 / 16|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101020 / 17|`[[],[],[]]`|2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|50 进行：2026-02-18 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101021 / 18|`[[],[],[]]`|2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-07 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101022 / 19|`[[],[],[]]`|2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101023 / 20|`[[],[],[]]`|2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|50 进行：2026-04-19 05:00:00+08:00 → 2026-04-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101024 / 21|`[[],[],[]]`|2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|50 进行：2026-06-03 05:00:00+08:00 → 2026-06-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101025 / 25|`[[],[],[]]`|2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|50 进行：2026-08-02 05:00:00+08:00 → 2026-08-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|101026 / 26|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-04-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102001 / 1|`[[10,50],[1,5],[18000,18000]]`|2026-11-27 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|10 预热：2026-11-27 05:00:00+08:00 → 2026-11-28 05:00:00+08:00；50 进行：2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102002 / 2|`[[10,50],[1,5],[18000,18000]]`|2026-12-25 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|10 预热：2026-12-25 05:00:00+08:00 → 2026-12-26 05:00:00+08:00；50 进行：2026-12-26 05:00:00+08:00 → 2026-12-31 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102003 / 3|`[[10,50],[1,5],[18000,18000]]`|2027-01-27 05:00:00+08:00 → 2027-02-02 05:00:00+08:00|10 预热：2027-01-27 05:00:00+08:00 → 2027-01-28 05:00:00+08:00；50 进行：2027-01-28 05:00:00+08:00 → 2027-02-02 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102004 / 4|`[[10,50],[1,5],[18000,18000]]`|2027-01-01 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|10 预热：2027-01-01 05:00:00+08:00 → 2027-01-02 05:00:00+08:00；50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102005 / 5|`[[10,50],[1,5],[18000,18000]]`|2027-02-06 05:00:00+08:00 → 2027-02-12 05:00:00+08:00|10 预热：2027-02-06 05:00:00+08:00 → 2027-02-07 05:00:00+08:00；50 进行：2027-02-07 05:00:00+08:00 → 2027-02-12 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102006 / 6|`[[10,50],[1,5],[18000,18000]]`|2027-03-04 05:00:00+08:00 → 2027-03-10 05:00:00+08:00|10 预热：2027-03-04 05:00:00+08:00 → 2027-03-05 05:00:00+08:00；50 进行：2027-03-05 05:00:00+08:00 → 2027-03-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102007 / 7|`[[10,50],[1,5],[18000,18000]]`|2026-11-27 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|10 预热：2026-11-27 05:00:00+08:00 → 2026-11-28 05:00:00+08:00；50 进行：2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102008 / 8|`[[10,50],[1,5],[18000,18000]]`|2027-01-01 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|10 预热：2027-01-01 05:00:00+08:00 → 2027-01-02 05:00:00+08:00；50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102009 / 9|`[[10,50],[1,5],[18000,18000]]`|2027-03-11 05:00:00+08:00 → 2027-03-17 05:00:00+08:00|10 预热：2027-03-11 05:00:00+08:00 → 2027-03-12 05:00:00+08:00；50 进行：2027-03-12 05:00:00+08:00 → 2027-03-17 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102010 / 10|`[[10,50],[1,5],[18000,18000]]`|2027-04-03 05:00:00+08:00 → 2027-04-09 05:00:00+08:00|10 预热：2027-04-03 05:00:00+08:00 → 2027-04-04 05:00:00+08:00；50 进行：2027-04-04 05:00:00+08:00 → 2027-04-09 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102011 / 11|`[[10,50],[1,5],[18000,18000]]`|2026-11-27 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|10 预热：2026-11-27 05:00:00+08:00 → 2026-11-28 05:00:00+08:00；50 进行：2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102012 / 12|`[[10,50],[1,5],[18000,18000]]`|2027-01-01 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|10 预热：2027-01-01 05:00:00+08:00 → 2027-01-02 05:00:00+08:00；50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102013 / 13|`[[10,50],[1,5],[18000,18000]]`|2027-02-06 05:00:00+08:00 → 2027-02-12 05:00:00+08:00|10 预热：2027-02-06 05:00:00+08:00 → 2027-02-07 05:00:00+08:00；50 进行：2027-02-07 05:00:00+08:00 → 2027-02-12 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102014 / 14|`[[10,50],[1,5],[18000,18000]]`|2027-03-04 05:00:00+08:00 → 2027-03-10 05:00:00+08:00|10 预热：2027-03-04 05:00:00+08:00 → 2027-03-05 05:00:00+08:00；50 进行：2027-03-05 05:00:00+08:00 → 2027-03-10 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102015 / 15|`[[10,50],[1,5],[18000,18000]]`|2027-03-11 05:00:00+08:00 → 2027-03-17 05:00:00+08:00|10 预热：2027-03-11 05:00:00+08:00 → 2027-03-12 05:00:00+08:00；50 进行：2027-03-12 05:00:00+08:00 → 2027-03-17 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102016 / 16|`[[10,50],[1,5],[18000,18000]]`|2027-04-03 05:00:00+08:00 → 2027-04-09 05:00:00+08:00|10 预热：2027-04-03 05:00:00+08:00 → 2027-04-04 05:00:00+08:00；50 进行：2027-04-04 05:00:00+08:00 → 2027-04-09 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102017 / 17|`[[10,50],[1,5],[18000,18000]]`|2027-01-30 05:00:00+08:00 → 2027-02-05 05:00:00+08:00|10 预热：2027-01-30 05:00:00+08:00 → 2027-01-31 05:00:00+08:00；50 进行：2027-01-31 05:00:00+08:00 → 2027-02-05 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102018 / 18|`[[10,50],[1,5],[18000,18000]]`|2025-04-13 05:00:00+08:00 → 2025-04-19 05:00:00+08:00|10 预热：2025-04-13 05:00:00+08:00 → 2025-04-14 05:00:00+08:00；50 进行：2025-04-14 05:00:00+08:00 → 2025-04-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102019 / 19|`[[10,50],[1,5],[18000,18000]]`|2026-11-27 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|10 预热：2026-11-27 05:00:00+08:00 → 2026-11-28 05:00:00+08:00；50 进行：2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102020 / 20|`[[10,50],[1,5],[18000,18000]]`|2026-12-27 05:00:00+08:00 → 2027-01-02 05:00:00+08:00|10 预热：2026-12-27 05:00:00+08:00 → 2026-12-28 05:00:00+08:00；50 进行：2026-12-28 05:00:00+08:00 → 2027-01-02 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102021 / 21|`[[10,50],[1,5],[18000,18000]]`|2027-01-15 05:00:00+08:00 → 2027-01-21 05:00:00+08:00|10 预热：2027-01-15 05:00:00+08:00 → 2027-01-16 05:00:00+08:00；50 进行：2027-01-16 05:00:00+08:00 → 2027-01-21 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102022 / 22|`[[10,50],[1,5],[18000,18000]]`|2025-05-16 05:00:00+08:00 → 2025-05-22 05:00:00+08:00|10 预热：2025-05-16 05:00:00+08:00 → 2025-05-17 05:00:00+08:00；50 进行：2025-05-17 05:00:00+08:00 → 2025-05-22 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102023 / 23|`[[10,50],[1,5],[18000,18000]]`|2025-06-20 05:00:00+08:00 → 2025-06-26 05:00:00+08:00|10 预热：2025-06-20 05:00:00+08:00 → 2025-06-21 05:00:00+08:00；50 进行：2025-06-21 05:00:00+08:00 → 2025-06-26 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102024 / 24|`[[10,50],[1,5],[18000,18000]]`|2025-07-15 05:00:00+08:00 → 2025-07-21 05:00:00+08:00|10 预热：2025-07-15 05:00:00+08:00 → 2025-07-16 05:00:00+08:00；50 进行：2025-07-16 05:00:00+08:00 → 2025-07-21 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102025 / 25|`[[10,50],[1,3],[18000,18000]]`|2026-11-16 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|10 预热：2026-11-16 05:00:00+08:00 → 2026-11-17 05:00:00+08:00；50 进行：2026-11-17 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102026 / 26|`[[10,50],[1,3],[18000,18000]]`|2026-11-15 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|10 预热：2026-11-15 05:00:00+08:00 → 2026-11-16 05:00:00+08:00；50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102027 / 27|`[[],[],[]]`|2025-11-15 05:00:00+08:00 → 2025-11-20 05:00:00+08:00|50 进行：2025-11-15 05:00:00+08:00 → 2025-11-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102028 / 28|`[[50],[3],[18000]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102029 / 29|`[[50],[3],[18000]]`|2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-16 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102030 / 30|`[[],[],[]]`|2026-01-14 05:00:00+08:00 → 2026-01-19 05:00:00+08:00|50 进行：2026-01-14 05:00:00+08:00 → 2026-01-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102031 / 31|`[[],[],[]]`|2026-03-20 05:00:00+08:00 → 2026-03-25 05:00:00+08:00|50 进行：2026-03-20 05:00:00+08:00 → 2026-03-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102032 / 32|`[[50],[3],[18000]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|102033 / 33|`[[],[],[]]`|2026-05-09 05:00:00+08:00 → 2026-05-14 05:00:00+08:00|50 进行：2026-05-09 05:00:00+08:00 → 2026-05-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102034 / 34|`[[],[],[]]`|2026-06-13 05:00:00+08:00 → 2026-06-18 05:00:00+08:00|50 进行：2026-06-13 05:00:00+08:00 → 2026-06-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102035 / 35|`[[],[],[]]`|2026-07-13 05:00:00+08:00 → 2026-07-18 05:00:00+08:00|50 进行：2026-07-13 05:00:00+08:00 → 2026-07-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102036 / 36|`[[],[],[]]`|2026-08-12 05:00:00+08:00 → 2026-08-17 05:00:00+08:00|50 进行：2026-08-12 05:00:00+08:00 → 2026-08-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102037 / 37|`[[],[],[]]`|2026-11-14 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|102038 / 38|`[[],[],[]]`|2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-28 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104001 / 1|`[[],[],[]]`|2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|50 进行：2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104002 / 2|`[[],[],[]]`|2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|50 进行：2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104003 / 3|`[[],[],[]]`|2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|50 进行：2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104004 / 4|`[[],[],[]]`|2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|50 进行：2024-12-15 05:00:00+08:00 → 2024-12-24 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104005 / 1|`[[],[],[]]`|2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|50 进行：2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104006 / 2|`[[],[],[]]`|2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|50 进行：2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104007 / 3|`[[],[],[]]`|2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|50 进行：2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104008 / 4|`[[],[],[]]`|2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|50 进行：2025-01-12 05:00:00+08:00 → 2025-01-21 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104009 / 1|`[[],[],[]]`|2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|50 进行：2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104010 / 2|`[[],[],[]]`|2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|50 进行：2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104011 / 3|`[[],[],[]]`|2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|50 进行：2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104012 / 4|`[[],[],[]]`|2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|50 进行：2025-01-26 05:00:00+08:00 → 2025-02-04 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104013 / 1|`[[],[],[]]`|2026-12-08 05:00:00+08:00 → 2026-12-17 22:00:00+08:00|50 进行：2026-12-08 05:00:00+08:00 → 2026-12-17 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104014 / 2|`[[],[],[]]`|2026-12-25 05:00:00+08:00 → 2027-01-03 22:00:00+08:00|50 进行：2026-12-25 05:00:00+08:00 → 2027-01-03 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104015 / 3|`[[],[],[]]`|2027-01-14 05:00:00+08:00 → 2027-01-23 22:00:00+08:00|50 进行：2027-01-14 05:00:00+08:00 → 2027-01-23 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104016 / 5|`[[],[],[]]`|2025-04-07 05:00:00+08:00 → 2025-04-16 22:00:00+08:00|50 进行：2025-04-07 05:00:00+08:00 → 2025-04-16 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104017 / 1|`[[],[],[]]`|2026-12-17 05:00:00+08:00 → 2026-12-26 22:00:00+08:00|50 进行：2026-12-17 05:00:00+08:00 → 2026-12-26 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104018 / 2|`[[],[],[]]`|2026-12-30 05:00:00+08:00 → 2027-01-08 22:00:00+08:00|50 进行：2026-12-30 05:00:00+08:00 → 2027-01-08 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104019 / 3|`[[],[],[]]`|2027-01-16 05:00:00+08:00 → 2027-01-25 22:00:00+08:00|50 进行：2027-01-16 05:00:00+08:00 → 2027-01-25 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104020 / 5|`[[],[],[]]`|2025-07-18 05:00:00+08:00 → 2025-07-27 22:00:00+08:00|50 进行：2025-07-18 05:00:00+08:00 → 2025-07-27 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|104021 / 5|`[[],[],[]]`|2025-08-21 05:00:00+08:00 → 2025-08-30 22:00:00+08:00|50 进行：2025-08-21 05:00:00+08:00 → 2025-08-30 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|105001 / 1|`[[],[],[]]`|2024-12-22 05:00:00+08:00 → 2024-12-31 05:00:00+08:00|50 进行：2024-12-22 05:00:00+08:00 → 2024-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107001 / 1|`[[],[],[]]`|2024-12-24 05:00:00+08:00 → 2024-12-29 05:00:00+08:00|50 进行：2024-12-24 05:00:00+08:00 → 2024-12-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107002 / 2|`[[],[],[]]`|2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107003 / 3|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107004 / 4|`[[],[],[]]`|2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|50 进行：2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107005 / 5|`[[],[],[]]`|2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107006 / 6|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|107007 / 7|`[[],[],[]]`|2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107008 / 8|`[[],[],[]]`|2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|50 进行：2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107009 / 9|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107010 / 10|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107011 / 11|`[[],[],[]]`|2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|50 进行：2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107012 / 12|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|107013 / 13|`[[],[],[]]`|2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|50 进行：2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|108001 / 1|`[[],[],[]]`|2024-12-24 05:00:00+08:00 → 2024-12-31 05:00:00+08:00|50 进行：2024-12-24 05:00:00+08:00 → 2024-12-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|108002 / 2|`[[],[],[]]`|2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|109001 / 1|`[[],[],[]]`|2054-03-28 05:00:00+08:00 → 2054-03-31 05:00:00+08:00|50 进行：2054-03-28 05:00:00+08:00 → 2054-03-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110001 / 1|`[[],[],[]]`|2026-12-13 05:00:00+08:00 → 2026-12-20 05:00:00+08:00|50 进行：2026-12-13 05:00:00+08:00 → 2026-12-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110002 / 2|`[[],[],[]]`|2026-12-27 05:00:00+08:00 → 2027-01-03 05:00:00+08:00|50 进行：2026-12-27 05:00:00+08:00 → 2027-01-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110003 / 3|`[[],[],[]]`|2027-01-11 05:00:00+08:00 → 2027-01-18 05:00:00+08:00|50 进行：2027-01-11 05:00:00+08:00 → 2027-01-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110004 / 4|`[[],[],[]]`|2027-01-25 05:00:00+08:00 → 2027-02-01 05:00:00+08:00|50 进行：2027-01-25 05:00:00+08:00 → 2027-02-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110005 / 5|`[[],[],[]]`|2027-02-01 05:00:00+08:00 → 2027-02-08 05:00:00+08:00|50 进行：2027-02-01 05:00:00+08:00 → 2027-02-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110006 / 6|`[[],[],[]]`|2027-02-08 05:00:00+08:00 → 2027-02-15 05:00:00+08:00|50 进行：2027-02-08 05:00:00+08:00 → 2027-02-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110007 / 7|`[[],[],[]]`|2027-02-15 05:00:00+08:00 → 2027-02-22 05:00:00+08:00|50 进行：2027-02-15 05:00:00+08:00 → 2027-02-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110008 / 8|`[[],[],[]]`|2027-02-22 05:00:00+08:00 → 2027-03-01 05:00:00+08:00|50 进行：2027-02-22 05:00:00+08:00 → 2027-03-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110009 / 9|`[[],[],[]]`|2027-03-01 05:00:00+08:00 → 2027-03-08 05:00:00+08:00|50 进行：2027-03-01 05:00:00+08:00 → 2027-03-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110010 / 10|`[[],[],[]]`|2027-03-08 05:00:00+08:00 → 2027-03-15 05:00:00+08:00|50 进行：2027-03-08 05:00:00+08:00 → 2027-03-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110011 / 11|`[[],[],[]]`|2025-01-03 05:00:00+08:00 → 2025-01-10 04:59:00+08:00|50 进行：2025-01-03 05:00:00+08:00 → 2025-01-10 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110012 / 12|`[[],[],[]]`|2025-01-03 05:00:00+08:00 → 2025-01-09 04:59:00+08:00|50 进行：2025-01-03 05:00:00+08:00 → 2025-01-09 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110013 / 13|`[[],[],[]]`|2025-01-03 05:00:00+08:00 → 2025-01-08 04:59:00+08:00|50 进行：2025-01-03 05:00:00+08:00 → 2025-01-08 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110014 / 14|`[[],[],[]]`|2025-01-03 05:00:00+08:00 → 2025-01-07 04:59:00+08:00|50 进行：2025-01-03 05:00:00+08:00 → 2025-01-07 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110015 / 15|`[[],[],[]]`|2025-01-03 05:00:00+08:00 → 2025-01-06 04:59:00+08:00|50 进行：2025-01-03 05:00:00+08:00 → 2025-01-06 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110016 / 16|`[[],[],[]]`|2025-01-03 05:00:00+08:00 → 2025-01-05 04:59:00+08:00|50 进行：2025-01-03 05:00:00+08:00 → 2025-01-05 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110017 / 17|`[[],[],[]]`|2025-01-03 05:00:00+08:00 → 2025-01-04 04:59:00+08:00|50 进行：2025-01-03 05:00:00+08:00 → 2025-01-04 04:59:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110018 / 18|`[[],[],[]]`|2026-12-13 05:00:00+08:00 → 2026-12-20 05:00:00+08:00|50 进行：2026-12-13 05:00:00+08:00 → 2026-12-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110019 / 19|`[[],[],[]]`|2026-12-27 05:00:00+08:00 → 2027-01-03 05:00:00+08:00|50 进行：2026-12-27 05:00:00+08:00 → 2027-01-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110020 / 20|`[[],[],[]]`|2027-01-11 05:00:00+08:00 → 2027-01-18 05:00:00+08:00|50 进行：2027-01-11 05:00:00+08:00 → 2027-01-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110021 / 21|`[[],[],[]]`|2027-01-25 05:00:00+08:00 → 2027-02-01 05:00:00+08:00|50 进行：2027-01-25 05:00:00+08:00 → 2027-02-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110022 / 22|`[[],[],[]]`|2027-02-01 05:00:00+08:00 → 2027-02-08 05:00:00+08:00|50 进行：2027-02-01 05:00:00+08:00 → 2027-02-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110023 / 23|`[[],[],[]]`|2027-02-08 05:00:00+08:00 → 2027-02-15 05:00:00+08:00|50 进行：2027-02-08 05:00:00+08:00 → 2027-02-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110024 / 24|`[[],[],[]]`|2027-02-15 05:00:00+08:00 → 2027-02-22 05:00:00+08:00|50 进行：2027-02-15 05:00:00+08:00 → 2027-02-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110025 / 25|`[[],[],[]]`|2027-02-22 05:00:00+08:00 → 2027-03-01 05:00:00+08:00|50 进行：2027-02-22 05:00:00+08:00 → 2027-03-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110026 / 26|`[[],[],[]]`|2027-03-01 05:00:00+08:00 → 2027-03-08 05:00:00+08:00|50 进行：2027-03-01 05:00:00+08:00 → 2027-03-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110027 / 27|`[[],[],[]]`|2027-03-08 05:00:00+08:00 → 2027-03-15 05:00:00+08:00|50 进行：2027-03-08 05:00:00+08:00 → 2027-03-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110028 / 28|`[[],[],[]]`|2027-03-15 05:00:00+08:00 → 2027-03-22 05:00:00+08:00|50 进行：2027-03-15 05:00:00+08:00 → 2027-03-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110029 / 29|`[[],[],[]]`|2027-03-22 05:00:00+08:00 → 2027-03-29 05:00:00+08:00|50 进行：2027-03-22 05:00:00+08:00 → 2027-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110030 / 30|`[[],[],[]]`|2027-03-29 05:00:00+08:00 → 2027-04-05 05:00:00+08:00|50 进行：2027-03-29 05:00:00+08:00 → 2027-04-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110031 / 31|`[[],[],[]]`|2027-04-05 05:00:00+08:00 → 2027-04-12 05:00:00+08:00|50 进行：2027-04-05 05:00:00+08:00 → 2027-04-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110032 / 32|`[[],[],[]]`|2027-04-12 05:00:00+08:00 → 2027-04-19 05:00:00+08:00|50 进行：2027-04-12 05:00:00+08:00 → 2027-04-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110033 / 33|`[[],[],[]]`|2027-04-19 05:00:00+08:00 → 2027-04-26 05:00:00+08:00|50 进行：2027-04-19 05:00:00+08:00 → 2027-04-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110034 / 34|`[[],[],[]]`|2027-04-26 05:00:00+08:00 → 2027-05-03 05:00:00+08:00|50 进行：2027-04-26 05:00:00+08:00 → 2027-05-03 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110035 / 35|`[[],[],[]]`|2027-05-03 05:00:00+08:00 → 2027-05-10 05:00:00+08:00|50 进行：2027-05-03 05:00:00+08:00 → 2027-05-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110036 / 36|`[[],[],[]]`|2027-05-10 05:00:00+08:00 → 2027-05-17 05:00:00+08:00|50 进行：2027-05-10 05:00:00+08:00 → 2027-05-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110037 / 33|`[[],[],[]]`|2027-05-17 05:00:00+08:00 → 2027-05-24 05:00:00+08:00|50 进行：2027-05-17 05:00:00+08:00 → 2027-05-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110038 / 34|`[[],[],[]]`|2027-05-24 05:00:00+08:00 → 2027-05-31 05:00:00+08:00|50 进行：2027-05-24 05:00:00+08:00 → 2027-05-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110039 / 35|`[[],[],[]]`|2027-05-31 05:00:00+08:00 → 2027-06-07 05:00:00+08:00|50 进行：2027-05-31 05:00:00+08:00 → 2027-06-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110040 / 36|`[[],[],[]]`|2027-06-07 05:00:00+08:00 → 2027-06-14 05:00:00+08:00|50 进行：2027-06-07 05:00:00+08:00 → 2027-06-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110041 / 35|`[[],[],[]]`|2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|50 进行：2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110042 / 36|`[[],[],[]]`|2025-04-07 05:00:00+08:00 → 2025-04-14 05:00:00+08:00|50 进行：2025-04-07 05:00:00+08:00 → 2025-04-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110043 / 33|`[[],[],[]]`|2025-04-14 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|50 进行：2025-04-14 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110044 / 34|`[[],[],[]]`|2025-04-21 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|50 进行：2025-04-21 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110045 / 35|`[[],[],[]]`|2025-04-28 05:00:00+08:00 → 2025-05-05 05:00:00+08:00|50 进行：2025-04-28 05:00:00+08:00 → 2025-05-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110046 / 36|`[[],[],[]]`|2025-05-05 05:00:00+08:00 → 2025-05-12 05:00:00+08:00|50 进行：2025-05-05 05:00:00+08:00 → 2025-05-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110047 / 33|`[[],[],[]]`|2025-05-12 05:00:00+08:00 → 2025-05-19 05:00:00+08:00|50 进行：2025-05-12 05:00:00+08:00 → 2025-05-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110048 / 34|`[[],[],[]]`|2025-05-19 05:00:00+08:00 → 2025-05-26 05:00:00+08:00|50 进行：2025-05-19 05:00:00+08:00 → 2025-05-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110049 / 35|`[[],[],[]]`|2025-05-26 05:00:00+08:00 → 2025-06-02 05:00:00+08:00|50 进行：2025-05-26 05:00:00+08:00 → 2025-06-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110050 / 36|`[[],[],[]]`|2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|50 进行：2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110051 / 33|`[[],[],[]]`|2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|50 进行：2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110052 / 34|`[[],[],[]]`|2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|50 进行：2025-03-31 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110053 / 18|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|110054 / 19|`[[],[],[]]`|2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|50 进行：2300-08-26 05:00:00+08:00 → 2300-09-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|111001 / 1|`[[],[],[]]`|2025-01-16 05:00:00+08:00 → 2025-01-22 05:00:00+08:00|50 进行：2025-01-16 05:00:00+08:00 → 2025-01-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|111002 / 2|`[[],[],[]]`|2026-12-30 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|50 进行：2026-12-30 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|112001 / 1|`[[],[],[]]`|2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|113001 / 1|`[[],[],[]]`|2025-01-25 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-25 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|113002 / 2|`[[],[],[]]`|2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|114001 / 1|`[[],[],[]]`|2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|114002 / 2|`[[],[],[]]`|2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|114003 / 3|`[[],[],[]]`|2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-28 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115001 / 1|`[[],[],[]]`|2025-01-25 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-25 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115002 / 2|`[[],[],[]]`|2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115003 / 3|`[[50],[6],[18000]]`|2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|50 进行：2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|115004 / 4|`[[],[],[]]`|2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|50 进行：2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115005 / 5|`[[],[],[]]`|2026-02-13 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|50 进行：2026-02-13 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115006 / 6|`[[],[],[]]`|2026-02-13 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|50 进行：2026-02-13 05:00:00+08:00 → 2026-02-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115007 / 7|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115008 / 8|`[[],[],[]]`|2026-05-26 05:00:00+08:00 → 2026-05-31 05:00:00+08:00|50 进行：2026-05-26 05:00:00+08:00 → 2026-05-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115009 / 9|`[[],[],[]]`|2026-05-26 05:00:00+08:00 → 2026-05-31 05:00:00+08:00|50 进行：2026-05-26 05:00:00+08:00 → 2026-05-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|115010 / 10|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|116001 / 1|`[[],[],[]]`|2025-01-25 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|50 进行：2025-01-25 05:00:00+08:00 → 2025-02-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|117001 / 1|`[[],[],[]]`|2026-11-15 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|50 进行：2026-11-15 05:00:00+08:00 → 2026-11-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|118001 / 1|`[[10,50],[1,3],[18000,18000]]`|2024-12-22 05:00:00+08:00 → 2024-12-26 05:00:00+08:00|10 预热：2024-12-22 05:00:00+08:00 → 2024-12-23 05:00:00+08:00；50 进行：2024-12-23 05:00:00+08:00 → 2024-12-26 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|118002 / 2|`[[10,50],[1,3],[18000,18000]]`|2025-01-25 05:00:00+08:00 → 2025-01-29 05:00:00+08:00|10 预热：2025-01-25 05:00:00+08:00 → 2025-01-26 05:00:00+08:00；50 进行：2025-01-26 05:00:00+08:00 → 2025-01-29 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|118003 / 3|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|120001 / 10|`[[50,60],[3,1],[18000,18000]]`|2027-03-01 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|50 进行：2027-03-01 05:00:00+08:00 → 2027-03-04 05:00:00+08:00；60 通知/领奖：2027-03-04 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|120002 / 11|`[[50,60],[3,1],[18000,18000]]`|2027-01-04 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|50 进行：2027-01-04 05:00:00+08:00 → 2027-01-07 05:00:00+08:00；60 通知/领奖：2027-01-07 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|120003 / 12|`[[50,60],[3,1],[18000,18000]]`|2027-03-22 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|50 进行：2027-03-22 05:00:00+08:00 → 2027-03-25 05:00:00+08:00；60 通知/领奖：2027-03-25 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|120004 / 13|`[[50,60],[3,1],[18000,18000]]`|2027-04-02 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|50 进行：2027-04-02 05:00:00+08:00 → 2027-04-05 05:00:00+08:00；60 通知/领奖：2027-04-05 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|121001 / 10|`[[],[],[]]`|2027-03-01 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|50 进行：2027-03-01 05:00:00+08:00 → 2027-03-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|121002 / 11|`[[],[],[]]`|2027-01-04 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|50 进行：2027-01-04 05:00:00+08:00 → 2027-01-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|121003 / 12|`[[],[],[]]`|2027-03-22 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|50 进行：2027-03-22 05:00:00+08:00 → 2027-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|121004 / 13|`[[],[],[]]`|2027-04-02 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|50 进行：2027-04-02 05:00:00+08:00 → 2027-04-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|122001 / 1|`[[],[],[]]`|2025-02-12 05:00:00+08:00 → 2025-02-15 05:00:00+08:00|50 进行：2025-02-12 05:00:00+08:00 → 2025-02-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|123001 / 1|`[[],[],[]]`|2025-02-13 05:00:00+08:00 → 2025-02-16 05:00:00+08:00|50 进行：2025-02-13 05:00:00+08:00 → 2025-02-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|123002 / 2|`[[],[],[]]`|2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|50 进行：2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132001 / 1|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132002 / 2|`[[],[],[]]`|2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|50 进行：2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132003 / 3|`[[],[],[]]`|2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132004 / 4|`[[],[],[]]`|2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|50 进行：2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132005 / 5|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132006 / 6|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132007 / 7|`[[],[],[]]`|2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|50 进行：2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132008 / 8|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|132009 / 9|`[[],[],[]]`|2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|50 进行：2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135001 / 1|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135002 / 2|`[[],[],[]]`|2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|50 进行：2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135003 / 3|`[[],[],[]]`|2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135004 / 4|`[[],[],[]]`|2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|50 进行：2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135005 / 5|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135006 / 6|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135007 / 7|`[[],[],[]]`|2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|50 进行：2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135008 / 8|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135009 / 9|`[[],[],[]]`|2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|50 进行：2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135010 / 10|`[[],[],[]]`|2026-05-19 05:00:00+08:00 → 2026-05-24 05:00:00+08:00|50 进行：2026-05-19 05:00:00+08:00 → 2026-05-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135011 / 11|`[[],[],[]]`|2026-06-28 05:00:00+08:00 → 2026-07-28 00:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-28 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135012 / 12|`[[],[],[]]`|2026-06-28 05:00:00+08:00 → 2026-07-23 05:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135013 / 13|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|135014 / 14|`[[],[],[]]`|2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138001 / 1|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138002 / 2|`[[],[],[]]`|2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|50 进行：2025-02-19 05:00:00+08:00 → 2025-02-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138003 / 3|`[[],[],[]]`|2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138004 / 4|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|138005 / 5|`[[],[],[]]`|2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|50 进行：2027-01-02 05:00:00+08:00 → 2027-01-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138006 / 6|`[[],[],[]]`|2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|50 进行：2025-04-11 05:00:00+08:00 → 2025-04-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138007 / 7|`[[],[],[]]`|2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|50 进行：2026-12-05 05:00:00+08:00 → 2026-12-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138008 / 8|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138009 / 9|`[[],[],[]]`|2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|50 进行：2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138010 / 10|`[[],[],[]]`|2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|50 进行：2025-05-27 05:00:00+08:00 → 2025-06-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138011 / 11|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138012 / 12|`[[],[],[]]`|2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|50 进行：2026-12-31 05:00:00+08:00 → 2027-01-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138013 / 13|`[[],[],[]]`|2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|50 进行：2099-11-27 05:00:00+08:00 → 2099-12-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138014 / 14|`[[],[],[]]`|2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|50 进行：2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|138015 / 15|`[[],[],[]]`|2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|50 进行：2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|150001 / 1|`[[],[],[]]`|2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|150002 / 2|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|150003 / 3|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|150005 / 5|`[[],[],[]]`|2025-09-09 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|50 进行：2025-09-09 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|151001 / 1|`[[],[],[]]`|2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|151002 / 2|`[[],[],[]]`|2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|50 进行：2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152001 / 1|`[[],[],[]]`|2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-16 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152002 / 2|`[[],[],[]]`|2026-11-13 05:00:00+08:00 → 2026-11-18 05:00:00+08:00|50 进行：2026-11-13 05:00:00+08:00 → 2026-11-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152003 / 3|`[[],[],[]]`|2025-04-04 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|50 进行：2025-04-04 05:00:00+08:00 → 2025-04-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152004 / 4|`[[],[],[]]`|2025-04-11 05:00:00+08:00 → 2025-04-14 05:00:00+08:00|50 进行：2025-04-11 05:00:00+08:00 → 2025-04-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152005 / 5|`[[],[],[]]`|2025-04-18 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|50 进行：2025-04-18 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152006 / 6|`[[],[],[]]`|2025-04-25 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|50 进行：2025-04-25 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152007 / 7|`[[],[],[]]`|2025-05-01 05:00:00+08:00 → 2025-05-04 05:00:00+08:00|50 进行：2025-05-01 05:00:00+08:00 → 2025-05-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152008 / 8|`[[],[],[]]`|2025-05-09 05:00:00+08:00 → 2025-05-12 05:00:00+08:00|50 进行：2025-05-09 05:00:00+08:00 → 2025-05-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152009 / 9|`[[],[],[]]`|2025-05-16 05:00:00+08:00 → 2025-05-19 05:00:00+08:00|50 进行：2025-05-16 05:00:00+08:00 → 2025-05-19 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152010 / 10|`[[],[],[]]`|2025-05-23 05:00:00+08:00 → 2025-05-26 05:00:00+08:00|50 进行：2025-05-23 05:00:00+08:00 → 2025-05-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152011 / 11|`[[],[],[]]`|2025-06-04 05:00:00+08:00 → 2025-06-07 05:00:00+08:00|50 进行：2025-06-04 05:00:00+08:00 → 2025-06-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152012 / 3|`[[],[],[]]`|2025-06-26 05:00:00+08:00 → 2025-06-29 05:00:00+08:00|50 进行：2025-06-26 05:00:00+08:00 → 2025-06-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152013 / 4|`[[],[],[]]`|2025-06-26 05:00:00+08:00 → 2025-06-29 05:00:00+08:00|50 进行：2025-06-26 05:00:00+08:00 → 2025-06-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152014 / 5|`[[],[],[]]`|2025-07-30 05:00:00+08:00 → 2025-08-02 05:00:00+08:00|50 进行：2025-07-30 05:00:00+08:00 → 2025-08-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152015 / 6|`[[],[],[]]`|2025-07-30 05:00:00+08:00 → 2025-08-02 05:00:00+08:00|50 进行：2025-07-30 05:00:00+08:00 → 2025-08-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152016 / 7|`[[],[],[]]`|2025-08-11 05:00:00+08:00 → 2025-08-14 05:00:00+08:00|50 进行：2025-08-11 05:00:00+08:00 → 2025-08-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|152017 / 8|`[[],[],[]]`|2025-08-11 05:00:00+08:00 → 2025-08-14 05:00:00+08:00|50 进行：2025-08-11 05:00:00+08:00 → 2025-08-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|153001 / 1|`[[],[],[]]`|2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|50 进行：2025-03-14 05:00:00+08:00 → 2025-03-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|153002 / 2|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|153003 / 3|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|153005 / 5|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|153007 / 7|`[[],[],[]]`|2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|50 进行：2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|153008 / 8|`[[],[],[]]`|2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|50 进行：2025-10-01 05:00:00+08:00 → 2025-10-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|154001 / 1|`[[10,50],[1,4],[18000,18000]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|154002 / 2|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|155001 / 1|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|156001 / 1|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|156002 / 2|`[[],[],[]]`|2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|50 进行：2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156003 / 3|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156005 / 5|`[[],[],[]]`|2025-11-10 05:00:00+08:00 → 2025-11-15 05:00:00+08:00|50 进行：2025-11-10 05:00:00+08:00 → 2025-11-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156006 / 6|`[[],[],[]]`|2025-12-10 05:00:00+08:00 → 2025-12-15 05:00:00+08:00|50 进行：2025-12-10 05:00:00+08:00 → 2025-12-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156019 / 19|`[[],[],[]]`|2026-06-28 05:00:00+08:00 → 2026-07-28 00:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-28 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156020 / 20|`[[],[],[]]`|2026-06-28 05:00:00+08:00 → 2026-07-23 05:00:00+08:00|50 进行：2026-06-28 05:00:00+08:00 → 2026-07-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156021 / 21|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-12-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156022 / 22|`[[],[],[]]`|2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|50 进行：2026-07-28 05:00:00+08:00 → 2026-08-27 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156023 / 23|`[[],[],[]]`|2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156024 / 24|`[[],[],[]]`|2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156025 / 25|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|156026 / 26|`[[],[],[]]`|2026-10-01 05:00:00+08:00 → 2026-10-11 00:00:00+08:00|50 进行：2026-10-01 05:00:00+08:00 → 2026-10-11 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|157001 / 1|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|158001 / 1|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|159001 / 1|`[[10,50],[1,5],[18000,18000]]`|2026-11-15 05:00:00+08:00 → 2026-11-21 05:00:00+08:00|10 预热：2026-11-15 05:00:00+08:00 → 2026-11-16 05:00:00+08:00；50 进行：2026-11-16 05:00:00+08:00 → 2026-11-21 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159002 / 2|`[[10,50],[1,5],[18000,18000]]`|2025-04-25 05:00:00+08:00 → 2025-05-01 05:00:00+08:00|10 预热：2025-04-25 05:00:00+08:00 → 2025-04-26 05:00:00+08:00；50 进行：2025-04-26 05:00:00+08:00 → 2025-05-01 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159003 / 3|`[[10,50],[1,5],[18000,18000]]`|2026-12-05 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|10 预热：2026-12-05 05:00:00+08:00 → 2026-12-06 05:00:00+08:00；50 进行：2026-12-06 05:00:00+08:00 → 2026-12-11 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159004 / 4|`[[10,50],[1,5],[18000,18000]]`|2026-12-21 05:00:00+08:00 → 2026-12-27 05:00:00+08:00|10 预热：2026-12-21 05:00:00+08:00 → 2026-12-22 05:00:00+08:00；50 进行：2026-12-22 05:00:00+08:00 → 2026-12-27 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159005 / 5|`[[10,50],[1,5],[18000,18000]]`|2025-06-13 05:00:00+08:00 → 2025-06-19 05:00:00+08:00|10 预热：2025-06-13 05:00:00+08:00 → 2025-06-14 05:00:00+08:00；50 进行：2025-06-14 05:00:00+08:00 → 2025-06-19 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159006 / 6|`[[10,50],[1,5],[18000,18000]]`|2027-01-12 05:00:00+08:00 → 2027-01-18 05:00:00+08:00|10 预热：2027-01-12 05:00:00+08:00 → 2027-01-13 05:00:00+08:00；50 进行：2027-01-13 05:00:00+08:00 → 2027-01-18 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159007 / 7|`[[],[],[]]`|2025-06-22 05:00:00+08:00 → 2025-06-27 05:00:00+08:00|50 进行：2025-06-22 05:00:00+08:00 → 2025-06-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|159008 / 8|`[[10,50],[1,5],[18000,18000]]`|2025-08-21 05:00:00+08:00 → 2025-08-27 05:00:00+08:00|10 预热：2025-08-21 05:00:00+08:00 → 2025-08-22 05:00:00+08:00；50 进行：2025-08-22 05:00:00+08:00 → 2025-08-27 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159009 / 9|`[[],[],[]]`|2026-11-29 05:00:00+08:00 → 2026-12-02 05:00:00+08:00|50 进行：2026-11-29 05:00:00+08:00 → 2026-12-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|159010 / 10|`[[50],[5],[18000]]`|2025-10-16 05:00:00+08:00 → 2025-10-21 05:00:00+08:00|50 进行：2025-10-16 05:00:00+08:00 → 2025-10-21 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159011 / 11|`[[50],[3],[18000]]`|2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|50 进行：2026-11-30 05:00:00+08:00 → 2026-12-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159012 / 12|`[[50],[5],[18000]]`|2026-01-29 05:00:00+08:00 → 2026-02-03 05:00:00+08:00|50 进行：2026-01-29 05:00:00+08:00 → 2026-02-03 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159013 / 13|`[[50],[5],[18000]]`|2026-04-09 05:00:00+08:00 → 2026-04-14 05:00:00+08:00|50 进行：2026-04-09 05:00:00+08:00 → 2026-04-14 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|159014 / 14|`[[50],[5],[18000]]`|2026-07-03 05:00:00+08:00 → 2026-07-08 05:00:00+08:00|50 进行：2026-07-03 05:00:00+08:00 → 2026-07-08 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|160001 / 1|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|160002 / 2|`[[],[],[]]`|2025-04-16 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|50 进行：2025-04-16 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|160011 / 3|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|160012 / 4|`[[],[],[]]`|2025-04-23 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|50 进行：2025-04-23 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|160021 / 5|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|160022 / 6|`[[],[],[]]`|2025-04-30 05:00:00+08:00 → 2025-05-05 05:00:00+08:00|50 进行：2025-04-30 05:00:00+08:00 → 2025-05-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161001 / 1|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|161002 / 1|`[[],[],[]]`|2025-04-16 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|50 进行：2025-04-16 05:00:00+08:00 → 2025-04-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161011 / 2|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|161012 / 2|`[[],[],[]]`|2025-04-23 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|50 进行：2025-04-23 05:00:00+08:00 → 2025-04-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161021 / 3|`[[],[],[]]`|运行输入待补|未生成阶段：divine-or-unknown-time-input-required|`{"status":"divine-or-unknown-time-input-required"}`|
|161022 / 3|`[[],[],[]]`|2025-04-30 05:00:00+08:00 → 2025-05-05 05:00:00+08:00|50 进行：2025-04-30 05:00:00+08:00 → 2025-05-05 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161033 / 4|`[[],[],[]]`|2025-09-01 05:00:00+08:00 → 2025-09-06 05:00:00+08:00|50 进行：2025-09-01 05:00:00+08:00 → 2025-09-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161034 / 5|`[[],[],[]]`|2025-09-21 05:00:00+08:00 → 2025-09-26 05:00:00+08:00|50 进行：2025-09-21 05:00:00+08:00 → 2025-09-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161035 / 6|`[[],[],[]]`|2025-10-11 05:00:00+08:00 → 2025-10-16 05:00:00+08:00|50 进行：2025-10-11 05:00:00+08:00 → 2025-10-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161036 / 7|`[[],[],[]]`|2025-11-20 05:00:00+08:00 → 2025-11-25 05:00:00+08:00|50 进行：2025-11-20 05:00:00+08:00 → 2025-11-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|161037 / 8|`[[],[],[]]`|2026-03-10 05:00:00+08:00 → 2026-03-15 05:00:00+08:00|50 进行：2026-03-10 05:00:00+08:00 → 2026-03-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162001 / 1|`[[],[],[]]`|2026-11-27 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|50 进行：2026-11-27 05:00:00+08:00 → 2026-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162002 / 1|`[[],[],[]]`|2026-12-18 05:00:00+08:00 → 2026-12-21 05:00:00+08:00|50 进行：2026-12-18 05:00:00+08:00 → 2026-12-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162003 / 1|`[[],[],[]]`|2027-01-08 05:00:00+08:00 → 2027-01-11 05:00:00+08:00|50 进行：2027-01-08 05:00:00+08:00 → 2027-01-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162004 / 1|`[[],[],[]]`|2025-05-24 05:00:00+08:00 → 2025-05-27 05:00:00+08:00|50 进行：2025-05-24 05:00:00+08:00 → 2025-05-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162005 / 1|`[[],[],[]]`|2025-06-07 05:00:00+08:00 → 2025-06-10 05:00:00+08:00|50 进行：2025-06-07 05:00:00+08:00 → 2025-06-10 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162006 / 1|`[[],[],[]]`|2025-06-19 05:00:00+08:00 → 2025-06-22 05:00:00+08:00|50 进行：2025-06-19 05:00:00+08:00 → 2025-06-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162007 / 1|`[[],[],[]]`|2025-07-14 05:00:00+08:00 → 2025-07-17 05:00:00+08:00|50 进行：2025-07-14 05:00:00+08:00 → 2025-07-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|162008 / 1|`[[],[],[]]`|2025-07-28 05:00:00+08:00 → 2025-07-31 05:00:00+08:00|50 进行：2025-07-28 05:00:00+08:00 → 2025-07-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|163001 / 1|`[[],[],[]]`|2026-11-18 05:00:00+08:00 → 2026-11-21 05:00:00+08:00|50 进行：2026-11-18 05:00:00+08:00 → 2026-11-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|163002 / 2|`[[],[],[]]`|2026-12-15 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|50 进行：2026-12-15 05:00:00+08:00 → 2026-12-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|163003 / 2|`[[],[],[]]`|2027-01-14 05:00:00+08:00 → 2027-01-17 05:00:00+08:00|50 进行：2027-01-14 05:00:00+08:00 → 2027-01-17 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|163011 / 2|`[[],[],[]]`|2025-04-29 05:00:00+08:00 → 2025-05-02 05:00:00+08:00|50 进行：2025-04-29 05:00:00+08:00 → 2025-05-02 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|163012 / 2|`[[],[],[]]`|2025-05-20 05:00:00+08:00 → 2025-05-23 05:00:00+08:00|50 进行：2025-05-20 05:00:00+08:00 → 2025-05-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|163013 / 2|`[[],[],[]]`|2025-06-12 05:00:00+08:00 → 2025-06-15 05:00:00+08:00|50 进行：2025-06-12 05:00:00+08:00 → 2025-06-15 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|163014 / 2|`[[],[],[]]`|2025-07-21 05:00:00+08:00 → 2025-07-24 05:00:00+08:00|50 进行：2025-07-21 05:00:00+08:00 → 2025-07-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|164001 / 1|`[[50],[6],[18000]]`|2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|50 进行：2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|165001 / 1|`[[50],[6],[18000]]`|2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|50 进行：2025-04-30 05:00:00+08:00 → 2025-05-06 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|166001 / 1|`[[],[],[]]`|2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|50 进行：2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|167001 / 1|`[[50,90],[7,2],[18000,18000]]`|2025-05-18 05:00:00+08:00 → 2025-05-27 05:00:00+08:00|50 进行：2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00；90 公示：2025-05-25 05:00:00+08:00 → 2025-05-27 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|168001 / 1|`[[50,90],[7,2],[18000,18000]]`|2025-05-18 05:00:00+08:00 → 2025-05-27 05:00:00+08:00|50 进行：2025-05-18 05:00:00+08:00 → 2025-05-25 05:00:00+08:00；90 公示：2025-05-25 05:00:00+08:00 → 2025-05-27 05:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|169001 / 1|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|171001 / 1|`[[],[],[]]`|2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|50 进行：2025-05-30 05:00:00+08:00 → 2025-06-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|171002 / 2|`[[],[],[]]`|2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|50 进行：2025-09-11 05:00:00+08:00 → 2025-09-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172001 / 1|`[[],[],[]]`|2026-12-23 05:00:00+08:00 → 2026-12-30 05:00:00+08:00|50 进行：2026-12-23 05:00:00+08:00 → 2026-12-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172002 / 2|`[[],[],[]]`|2026-12-30 05:00:00+08:00 → 2027-01-06 05:00:00+08:00|50 进行：2026-12-30 05:00:00+08:00 → 2027-01-06 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172003 / 3|`[[],[],[]]`|2027-01-13 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|50 进行：2027-01-13 05:00:00+08:00 → 2027-01-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172004 / 4|`[[],[],[]]`|2027-01-20 05:00:00+08:00 → 2027-01-27 05:00:00+08:00|50 进行：2027-01-20 05:00:00+08:00 → 2027-01-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172005 / 5|`[[],[],[]]`|2025-06-02 05:00:00+08:00 → 2025-06-09 05:00:00+08:00|50 进行：2025-06-02 05:00:00+08:00 → 2025-06-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172006 / 6|`[[],[],[]]`|2025-06-09 05:00:00+08:00 → 2025-06-16 05:00:00+08:00|50 进行：2025-06-09 05:00:00+08:00 → 2025-06-16 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172007 / 7|`[[],[],[]]`|2025-06-16 05:00:00+08:00 → 2025-06-23 05:00:00+08:00|50 进行：2025-06-16 05:00:00+08:00 → 2025-06-23 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172008 / 8|`[[],[],[]]`|2025-06-23 05:00:00+08:00 → 2025-06-30 05:00:00+08:00|50 进行：2025-06-23 05:00:00+08:00 → 2025-06-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172009 / 5|`[[],[],[]]`|2025-06-30 05:00:00+08:00 → 2025-07-07 05:00:00+08:00|50 进行：2025-06-30 05:00:00+08:00 → 2025-07-07 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172010 / 9|`[[],[],[]]`|2027-01-06 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|50 进行：2027-01-06 05:00:00+08:00 → 2027-01-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172011 / 6|`[[],[],[]]`|2025-07-07 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|50 进行：2025-07-07 05:00:00+08:00 → 2025-07-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172012 / 10|`[[],[],[]]`|2025-07-14 05:00:00+08:00 → 2025-07-21 05:00:00+08:00|50 进行：2025-07-14 05:00:00+08:00 → 2025-07-21 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172013 / 8|`[[],[],[]]`|2025-07-21 05:00:00+08:00 → 2025-07-28 05:00:00+08:00|50 进行：2025-07-21 05:00:00+08:00 → 2025-07-28 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172014 / 5|`[[],[],[]]`|2025-07-28 05:00:00+08:00 → 2025-08-04 05:00:00+08:00|50 进行：2025-07-28 05:00:00+08:00 → 2025-08-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172015 / 6|`[[],[],[]]`|2025-08-04 05:00:00+08:00 → 2025-08-11 05:00:00+08:00|50 进行：2025-08-04 05:00:00+08:00 → 2025-08-11 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172016 / 11|`[[],[],[]]`|2025-08-17 05:00:00+08:00 → 2025-08-22 05:00:00+08:00|50 进行：2025-08-17 05:00:00+08:00 → 2025-08-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172017 / 12|`[[],[],[]]`|2025-08-27 05:00:00+08:00 → 2025-09-01 05:00:00+08:00|50 进行：2025-08-27 05:00:00+08:00 → 2025-09-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172018 / 13|`[[],[],[]]`|2025-10-21 05:00:00+08:00 → 2025-10-26 05:00:00+08:00|50 进行：2025-10-21 05:00:00+08:00 → 2025-10-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172019 / 14|`[[],[],[]]`|2025-10-26 05:00:00+08:00 → 2025-10-31 05:00:00+08:00|50 进行：2025-10-26 05:00:00+08:00 → 2025-10-31 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172020 / 15|`[[],[],[]]`|2025-11-25 05:00:00+08:00 → 2025-11-30 05:00:00+08:00|50 进行：2025-11-25 05:00:00+08:00 → 2025-11-30 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172021 / 16|`[[],[],[]]`|2025-12-20 05:00:00+08:00 → 2025-12-25 05:00:00+08:00|50 进行：2025-12-20 05:00:00+08:00 → 2025-12-25 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172022 / 17|`[[],[],[]]`|2026-01-09 05:00:00+08:00 → 2026-01-14 05:00:00+08:00|50 进行：2026-01-09 05:00:00+08:00 → 2026-01-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172023 / 19|`[[],[],[]]`|2026-01-19 05:00:00+08:00 → 2026-01-24 05:00:00+08:00|50 进行：2026-01-19 05:00:00+08:00 → 2026-01-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172024 / 20|`[[],[],[]]`|2026-02-03 05:00:00+08:00 → 2026-02-08 05:00:00+08:00|50 进行：2026-02-03 05:00:00+08:00 → 2026-02-08 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172025 / 21|`[[],[],[]]`|2026-02-08 05:00:00+08:00 → 2026-02-13 05:00:00+08:00|50 进行：2026-02-08 05:00:00+08:00 → 2026-02-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|172026 / 24|`[[],[],[]]`|2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|50 进行：2026-04-04 05:00:00+08:00 → 2026-04-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|173001 / 1|`[[],[],[]]`|2025-06-13 05:00:00+08:00 → 2025-06-24 05:00:00+08:00|50 进行：2025-06-13 05:00:00+08:00 → 2025-06-24 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|173002 / 2|`[[],[],[]]`|2025-09-09 05:00:00+08:00 → 2025-09-22 05:00:00+08:00|50 进行：2025-09-09 05:00:00+08:00 → 2025-09-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179001 / 1|`[[],[],[]]`|2025-08-29 05:00:00+08:00 → 2025-09-01 05:00:00+08:00|50 进行：2025-08-29 05:00:00+08:00 → 2025-09-01 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179002 / 2|`[[],[],[]]`|2025-12-25 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|50 进行：2025-12-25 05:00:00+08:00 → 2026-01-04 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179003 / 3|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179004 / 4|`[[],[],[]]`|2026-03-10 05:00:00+08:00 → 2026-03-20 05:00:00+08:00|50 进行：2026-03-10 05:00:00+08:00 → 2026-03-20 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179005 / 5|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179006 / 6|`[[],[],[]]`|2026-04-29 05:00:00+08:00 → 2026-05-09 05:00:00+08:00|50 进行：2026-04-29 05:00:00+08:00 → 2026-05-09 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179007 / 7|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179008 / 8|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-27 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179009 / 9|`[[],[],[]]`|2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|179010 / 10|`[[],[],[]]`|2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-26 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|180008 / 8|`[[50,90],[9,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-21 21:00:00+08:00；90 公示：2026-11-21 21:00:00+08:00 → 2026-11-22 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|180009 / 9|`[[50,90],[9,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-21 21:00:00+08:00；90 公示：2026-11-21 21:00:00+08:00 → 2026-11-22 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|180010 / 10|`[[50,90],[9,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-21 21:00:00+08:00；90 公示：2026-11-21 21:00:00+08:00 → 2026-11-22 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|180011 / 11|`[[50,90],[10,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-23 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 21:00:00+08:00；90 公示：2026-11-22 21:00:00+08:00 → 2026-11-23 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|180012 / 12|`[[50,90],[9,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-21 21:00:00+08:00；90 公示：2026-11-21 21:00:00+08:00 → 2026-11-22 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|180013 / 13|`[[50,90],[9,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-21 21:00:00+08:00；90 公示：2026-11-21 21:00:00+08:00 → 2026-11-22 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|180014 / 14|`[[50,90],[10,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-23 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 21:00:00+08:00；90 公示：2026-11-22 21:00:00+08:00 → 2026-11-23 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|180015 / 15|`[[50,90],[14,1],[75600,82800]]`|2026-11-12 05:00:00+08:00 → 2026-11-27 23:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-26 21:00:00+08:00；90 公示：2026-11-26 21:00:00+08:00 → 2026-11-27 23:00:00+08:00|`{"status":"client-table-states","warnings":[]}`|
|181001 / 1|`[[],[],[]]`|2025-10-20 10:00:00+08:00 → 2025-11-03 00:00:00+08:00|50 进行：2025-10-20 10:00:00+08:00 → 2025-11-03 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181002 / 1|`[[],[],[]]`|2025-11-03 10:00:00+08:00 → 2025-11-17 00:00:00+08:00|50 进行：2025-11-03 10:00:00+08:00 → 2025-11-17 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181003 / 1|`[[],[],[]]`|2025-11-17 10:00:00+08:00 → 2025-12-01 00:00:00+08:00|50 进行：2025-11-17 10:00:00+08:00 → 2025-12-01 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181004 / 1|`[[],[],[]]`|2025-12-01 10:00:00+08:00 → 2025-12-15 00:00:00+08:00|50 进行：2025-12-01 10:00:00+08:00 → 2025-12-15 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181005 / 1|`[[],[],[]]`|2025-12-15 10:00:00+08:00 → 2025-12-29 00:00:00+08:00|50 进行：2025-12-15 10:00:00+08:00 → 2025-12-29 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181006 / 2|`[[],[],[]]`|2025-12-29 10:00:00+08:00 → 2026-01-12 00:00:00+08:00|50 进行：2025-12-29 10:00:00+08:00 → 2026-01-12 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181007 / 2|`[[],[],[]]`|2026-01-12 10:00:00+08:00 → 2026-01-26 00:00:00+08:00|50 进行：2026-01-12 10:00:00+08:00 → 2026-01-26 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181008 / 3|`[[],[],[]]`|2026-01-26 10:00:00+08:00 → 2026-02-09 00:00:00+08:00|50 进行：2026-01-26 10:00:00+08:00 → 2026-02-09 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181009 / 3|`[[],[],[]]`|2026-02-09 10:00:00+08:00 → 2026-02-23 00:00:00+08:00|50 进行：2026-02-09 10:00:00+08:00 → 2026-02-23 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181010 / 3|`[[],[],[]]`|2026-02-23 10:00:00+08:00 → 2026-03-09 00:00:00+08:00|50 进行：2026-02-23 10:00:00+08:00 → 2026-03-09 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181011 / 3|`[[],[],[]]`|2026-03-09 10:00:00+08:00 → 2026-03-23 00:00:00+08:00|50 进行：2026-03-09 10:00:00+08:00 → 2026-03-23 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181012 / 3|`[[],[],[]]`|2026-03-23 10:00:00+08:00 → 2026-04-06 00:00:00+08:00|50 进行：2026-03-23 10:00:00+08:00 → 2026-04-06 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181013 / 3|`[[],[],[]]`|2026-04-06 10:00:00+08:00 → 2026-04-20 00:00:00+08:00|50 进行：2026-04-06 10:00:00+08:00 → 2026-04-20 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181014 / 3|`[[],[],[]]`|2026-04-20 10:00:00+08:00 → 2026-05-04 00:00:00+08:00|50 进行：2026-04-20 10:00:00+08:00 → 2026-05-04 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181015 / 3|`[[],[],[]]`|2026-05-04 10:00:00+08:00 → 2026-05-18 00:00:00+08:00|50 进行：2026-05-04 10:00:00+08:00 → 2026-05-18 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181016 / 3|`[[],[],[]]`|2026-05-18 10:00:00+08:00 → 2026-06-01 00:00:00+08:00|50 进行：2026-05-18 10:00:00+08:00 → 2026-06-01 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181017 / 3|`[[],[],[]]`|2026-06-01 10:00:00+08:00 → 2026-06-15 00:00:00+08:00|50 进行：2026-06-01 10:00:00+08:00 → 2026-06-15 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181018 / 4|`[[],[],[]]`|2026-06-15 10:00:00+08:00 → 2026-06-29 00:00:00+08:00|50 进行：2026-06-15 10:00:00+08:00 → 2026-06-29 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181019 / 4|`[[],[],[]]`|2026-06-29 10:00:00+08:00 → 2026-07-13 00:00:00+08:00|50 进行：2026-06-29 10:00:00+08:00 → 2026-07-13 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181020 / 4|`[[],[],[]]`|2026-07-13 10:00:00+08:00 → 2026-07-27 00:00:00+08:00|50 进行：2026-07-13 10:00:00+08:00 → 2026-07-27 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181021 / 4|`[[],[],[]]`|2026-07-27 10:00:00+08:00 → 2026-08-10 00:00:00+08:00|50 进行：2026-07-27 10:00:00+08:00 → 2026-08-10 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181022 / 4|`[[],[],[]]`|2026-08-10 10:00:00+08:00 → 2026-08-24 00:00:00+08:00|50 进行：2026-08-10 10:00:00+08:00 → 2026-08-24 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181023 / 4|`[[],[],[]]`|2026-08-24 10:00:00+08:00 → 2026-09-07 00:00:00+08:00|50 进行：2026-08-24 10:00:00+08:00 → 2026-09-07 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181024 / 4|`[[],[],[]]`|2026-09-07 10:00:00+08:00 → 2026-09-21 00:00:00+08:00|50 进行：2026-09-07 10:00:00+08:00 → 2026-09-21 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181025 / 4|`[[],[],[]]`|2026-09-21 10:00:00+08:00 → 2026-10-05 00:00:00+08:00|50 进行：2026-09-21 10:00:00+08:00 → 2026-10-05 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181026 / 4|`[[],[],[]]`|2026-10-05 10:00:00+08:00 → 2026-10-19 00:00:00+08:00|50 进行：2026-10-05 10:00:00+08:00 → 2026-10-19 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181027 / 4|`[[],[],[]]`|2026-10-19 10:00:00+08:00 → 2026-11-02 00:00:00+08:00|50 进行：2026-10-19 10:00:00+08:00 → 2026-11-02 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181028 / 4|`[[],[],[]]`|2026-11-02 10:00:00+08:00 → 2026-11-16 00:00:00+08:00|50 进行：2026-11-02 10:00:00+08:00 → 2026-11-16 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181029 / 4|`[[],[],[]]`|2026-11-16 10:00:00+08:00 → 2026-11-30 00:00:00+08:00|50 进行：2026-11-16 10:00:00+08:00 → 2026-11-30 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|181030 / 4|`[[],[],[]]`|2026-11-30 10:00:00+08:00 → 2026-12-14 00:00:00+08:00|50 进行：2026-11-30 10:00:00+08:00 → 2026-12-14 00:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|188001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-12-12 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-12-12 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|188002 / 2|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|188003 / 3|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-22 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|189001 / 1|`[[],[],[]]`|2025-12-25 05:00:00+08:00 → 2026-02-14 05:00:00+08:00|50 进行：2025-12-25 05:00:00+08:00 → 2026-02-14 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|189002 / 2|`[[],[],[]]`|2026-03-10 05:00:00+08:00 → 2026-03-29 05:00:00+08:00|50 进行：2026-03-10 05:00:00+08:00 → 2026-03-29 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|189003 / 3|`[[],[],[]]`|2026-04-29 05:00:00+08:00 → 2026-05-18 05:00:00+08:00|50 进行：2026-04-29 05:00:00+08:00 → 2026-05-18 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190001 / 1|`[[],[],[]]`|2026-11-17 05:00:00+08:00 → 2026-11-21 22:00:00+08:00|50 进行：2026-11-17 05:00:00+08:00 → 2026-11-21 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190002 / 2|`[[],[],[]]`|2026-11-24 05:00:00+08:00 → 2026-11-28 22:00:00+08:00|50 进行：2026-11-24 05:00:00+08:00 → 2026-11-28 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190003 / 2|`[[],[],[]]`|2026-11-14 05:00:00+08:00 → 2026-11-18 22:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-18 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190004 / 2|`[[],[],[]]`|2026-11-23 05:00:00+08:00 → 2026-11-27 22:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2026-11-27 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190005 / 3|`[[],[],[]]`|2026-12-02 05:00:00+08:00 → 2026-12-06 22:00:00+08:00|50 进行：2026-12-02 05:00:00+08:00 → 2026-12-06 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190006 / 6|`[[],[],[]]`|2026-11-27 05:00:00+08:00 → 2026-12-01 22:00:00+08:00|50 进行：2026-11-27 05:00:00+08:00 → 2026-12-01 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190007 / 6|`[[],[],[]]`|2026-07-13 05:00:00+08:00 → 2026-07-17 22:00:00+08:00|50 进行：2026-07-13 05:00:00+08:00 → 2026-07-17 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190009 / 2|`[[],[],[]]`|2026-11-14 05:00:00+08:00 → 2026-11-18 22:00:00+08:00|50 进行：2026-11-14 05:00:00+08:00 → 2026-11-18 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190010 / 2|`[[],[],[]]`|2026-11-23 05:00:00+08:00 → 2026-11-27 22:00:00+08:00|50 进行：2026-11-23 05:00:00+08:00 → 2026-11-27 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190011 / 3|`[[],[],[]]`|2026-12-02 05:00:00+08:00 → 2026-12-06 22:00:00+08:00|50 进行：2026-12-02 05:00:00+08:00 → 2026-12-06 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190012 / 9|`[[],[],[]]`|2026-11-15 05:00:00+08:00 → 2026-11-19 22:00:00+08:00|50 进行：2026-11-15 05:00:00+08:00 → 2026-11-19 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|190013 / 10|`[[],[],[]]`|2026-11-29 05:00:00+08:00 → 2026-12-03 22:00:00+08:00|50 进行：2026-11-29 05:00:00+08:00 → 2026-12-03 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|191003 / 3|`[[],[],[]]`|2026-12-03 05:00:00+08:00 → 2026-12-07 22:00:00+08:00|50 进行：2026-12-03 05:00:00+08:00 → 2026-12-07 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193001 / 4|`[[],[],[]]`|2026-01-29 05:00:00+08:00 → 2026-02-02 22:00:00+08:00|50 进行：2026-01-29 05:00:00+08:00 → 2026-02-02 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193002 / 4|`[[],[],[]]`|2026-02-13 05:00:00+08:00 → 2026-02-17 22:00:00+08:00|50 进行：2026-02-13 05:00:00+08:00 → 2026-02-17 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193003 / 4|`[[],[],[]]`|2026-02-28 05:00:00+08:00 → 2026-03-04 22:00:00+08:00|50 进行：2026-02-28 05:00:00+08:00 → 2026-03-04 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193004 / 4|`[[],[],[]]`|2026-01-15 05:00:00+08:00 → 2026-01-19 22:00:00+08:00|50 进行：2026-01-15 05:00:00+08:00 → 2026-01-19 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193005 / 4|`[[],[],[]]`|2026-03-30 05:00:00+08:00 → 2026-04-03 22:00:00+08:00|50 进行：2026-03-30 05:00:00+08:00 → 2026-04-03 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193006 / 4|`[[],[],[]]`|2026-03-15 05:00:00+08:00 → 2026-03-19 22:00:00+08:00|50 进行：2026-03-15 05:00:00+08:00 → 2026-03-19 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193007 / 4|`[[],[],[]]`|2026-04-14 05:00:00+08:00 → 2026-04-18 22:00:00+08:00|50 进行：2026-04-14 05:00:00+08:00 → 2026-04-18 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193008 / 4|`[[],[],[]]`|2026-04-24 05:00:00+08:00 → 2026-04-28 22:00:00+08:00|50 进行：2026-04-24 05:00:00+08:00 → 2026-04-28 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193009 / 4|`[[],[],[]]`|2026-05-14 05:00:00+08:00 → 2026-05-18 22:00:00+08:00|50 进行：2026-05-14 05:00:00+08:00 → 2026-05-18 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193010 / 4|`[[],[],[]]`|2026-06-03 05:00:00+08:00 → 2026-06-07 22:00:00+08:00|50 进行：2026-06-03 05:00:00+08:00 → 2026-06-07 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193011 / 4|`[[],[],[]]`|2026-06-23 05:00:00+08:00 → 2026-06-27 22:00:00+08:00|50 进行：2026-06-23 05:00:00+08:00 → 2026-06-27 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193012 / 5|`[[],[],[]]`|2026-07-13 05:00:00+08:00 → 2026-07-17 22:00:00+08:00|50 进行：2026-07-13 05:00:00+08:00 → 2026-07-17 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193013 / 7|`[[],[],[]]`|2026-08-02 05:00:00+08:00 → 2026-08-06 22:00:00+08:00|50 进行：2026-08-02 05:00:00+08:00 → 2026-08-06 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193014 / 7|`[[],[],[]]`|2026-08-22 05:00:00+08:00 → 2026-08-26 22:00:00+08:00|50 进行：2026-08-22 05:00:00+08:00 → 2026-08-26 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193015 / 8|`[[],[],[]]`|2026-08-22 05:00:00+08:00 → 2026-08-26 22:00:00+08:00|50 进行：2026-08-22 05:00:00+08:00 → 2026-08-26 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193016 / 8|`[[],[],[]]`|2026-09-11 05:00:00+08:00 → 2026-09-15 22:00:00+08:00|50 进行：2026-09-11 05:00:00+08:00 → 2026-09-15 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193017 / 8|`[[],[],[]]`|2026-10-01 05:00:00+08:00 → 2026-10-05 22:00:00+08:00|50 进行：2026-10-01 05:00:00+08:00 → 2026-10-05 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193018 / 8|`[[],[],[]]`|2026-10-21 05:00:00+08:00 → 2026-10-25 22:00:00+08:00|50 进行：2026-10-21 05:00:00+08:00 → 2026-10-25 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|193019 / 8|`[[],[],[]]`|2026-11-10 05:00:00+08:00 → 2026-11-14 22:00:00+08:00|50 进行：2026-11-10 05:00:00+08:00 → 2026-11-14 22:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|
|196001 / 1|`[[],[],[]]`|2026-11-12 05:00:00+08:00 → 2026-11-13 05:00:00+08:00|50 进行：2026-11-12 05:00:00+08:00 → 2026-11-13 05:00:00+08:00|`{"status":"client-table-default-running","warnings":[]}`|

## 如何进入运营日历

[前90天检查表](activity-calendar.md)按自然日期列出阶段终点及相邻配置转换事件。旧表事件来自上述原表fallback；ActFrame事件来自假设本服S的示例，两类分列。空stage、缺数组和神域动态窗口不会被自动补成运行。事件不检查服龄资格、弃用/互斥、个人功能或实际instance存在，不能据此批量发布全部历史活动。
