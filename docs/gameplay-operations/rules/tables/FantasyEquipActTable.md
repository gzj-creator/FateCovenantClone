# FantasyEquipActTable 规则参数

来源：[personal-server/assets/tables/FantasyEquipActTable.data.json.gz](../../../../personal-server/assets/tables/FantasyEquipActTable.data.json.gz)，SHA256：`d86f7aed825a28c6132f83e0de81006615940d44da55d9e35b10a1137d4461c7`。

[完整逐行JSON](FantasyEquipActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|0|decoded-rows|
|[DrawWish](#drawwish)|42|decoded-rows|
|[Draw](#draw)|5|decoded-rows|
|[DrawShow](#drawshow)|13|decoded-rows|
|[Gift](#gift)|5|decoded-rows|
|[GiftRelease](#giftrelease)|0|decoded-rows|
|[Pre](#pre)|5|decoded-rows|
|[PreShow](#preshow)|30|decoded-rows|
|[FantasyEquipTrialDamage](#fantasyequiptrialdamage)|72|decoded-rows|
|[FantasyEquipTrialBless](#fantasyequiptrialbless)|2|decoded-rows|
|[FantasyEquipTrialStar](#fantasyequiptrialstar)|18|decoded-rows|
|[FantasyEquipTrialLevel](#fantasyequiptriallevel)|320|decoded-rows|
|[FantasyEquipTrial](#fantasyequiptrial)|12|decoded-rows|

## Task

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## DrawWish

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|42|本表行键；与其他表同值不自动代表同一对象。|
|new_tag|boolean|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|equip|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{}`|
|1002|`{}`|
|1003|`{}`|
|1004|`{}`|
|1005|`{}`|
|1006|`{}`|
|2001|`{}`|
|2002|`{}`|
|2003|`{}`|
|2004|`{}`|
|2005|`{}`|
|2006|`{}`|
|3001|`{}`|
|3002|`{}`|
|3003|`{}`|
|3004|`{}`|
|3005|`{}`|
|3006|`{}`|
|3007|`{}`|
|3008|`{}`|
|3009|`{}`|
|3010|`{}`|
|3011|`{}`|
|3012|`{}`|
|4001|`{}`|
|4002|`{}`|
|4003|`{}`|
|4004|`{}`|
|4005|`{}`|
|4006|`{}`|
|5001|`{}`|
|5002|`{}`|
|5003|`{}`|
|5004|`{}`|
|5005|`{}`|
|5006|`{}`|
|5007|`{}`|
|5008|`{}`|
|5009|`{}`|
|5010|`{}`|
|5011|`{}`|
|5012|`{}`|

## Draw

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_timeline|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|range|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|probability|number|5|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|draw_lib|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|draw_wish|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guarantee|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"show_timeline":[1200119,1200219,1200319,1200419,1200519,1200619],"probability":11448,"draw_lib":49,"draw_wish":[1001,1002,1003,1004,1005,1006],"guarantee":30}`|
|2|`{"show_timeline":[1200119,1200219,1200319,1200419,1200519,1200619],"probability":11448,"draw_lib":49,"draw_wish":[2001,2002,2003,2004,2005,2006],"guarantee":30}`|
|3|`{"show_timeline":[1200719,1200819,1200919,1201019,1201119,1201219],"probability":13001,"draw_lib":50,"draw_wish":[3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012],"guarantee":30}`|
|4|`{"show_timeline":[1200119,1200219,1200319,1200419,1200519,1200619],"probability":11448,"draw_lib":48,"draw_wish":[2001,2002,2003,2004,2005,2006],"guarantee":30}`|
|5|`{"show_timeline":[1200719,1200819,1200919,1201019,1201119,1201219],"probability":13001,"draw_lib":50,"draw_wish":[3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012],"guarantee":30}`|

## DrawShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|timeline2|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|timeline1|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1200119|`{"timeline2":"timeline_HanShuangZhiWen_zw_chouka2.prefab","timeline1":"timeline_HanShuangZhiWen_zw_chouka1.prefab"}`|
|1200219|`{"timeline2":"timeline_XingHongZhiZhu_zw_chouka2.prefab","timeline1":"timeline_XingHongZhiZhu_zw_chouka1.prefab"}`|
|1200319|`{"timeline2":"timeline_ShenLongJiSi_zw_chouka2.prefab","timeline1":"timeline_ShenLongJiSi_zw_chouka1.prefab"}`|
|1200419|`{"timeline2":"timeline_WanYanZhiZhu_zw_chouka2.prefab","timeline1":"timeline_WanYanZhiZhu_zw_chouka1.prefab"}`|
|1200519|`{"timeline2":"timeline_ShengShenCaiJue_zw_chouka2.prefab","timeline1":"timeline_ShengShenCaiJue_zw_chouka1.prefab"}`|
|1200619|`{"timeline2":"timeline_ValPrincess_zw_chouka2.prefab","timeline1":"timeline_ValPrincess_zw_chouka1.prefab"}`|
|1200719|`{"timeline2":"timeline_ShenDuShengWei_zw_chouka2.prefab","timeline1":"timeline_ShenDuShengWei_zw_chouka1.prefab"}`|
|1200819|`{"timeline2":"timeline_ShengMoYanZi_zw_chouka2.prefab","timeline1":"timeline_ShengMoYanZi_zw_chouka1.prefab"}`|
|1200919|`{"timeline2":"timeline_ZongFengZhiYi_zw_chouka2.prefab","timeline1":"timeline_ZongFengZhiYi_zw_chouka1.prefab"}`|
|1201019|`{"timeline2":"timeline_TianCaiShaoNv_zw_chouka2.prefab","timeline1":"timeline_TianCaiShaoNv_zw_chouka1.prefab"}`|
|1201119|`{"timeline2":"timeline_MoChuLvRen_zw_chouka2.prefab","timeline1":"timeline_MoChuLvRen_zw_chouka1.prefab"}`|
|1201219|`{"timeline2":"timeline_FeiZhiEGui_zw_chouka2.prefab","timeline1":"timeline_FeiZhiEGui_zw_chouka1.prefab"}`|
|1202119|`{"timeline2":"timeline_GuangQiangShouWei_SkinC01_chouka2.prefab","timeline1":"timeline_GuangQiangShouWei_SkinC01_chouka1.prefab"}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|show_rule|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|piece_buy_gift|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"piece_buy_gift":600101}`|
|2|`{"piece_buy_gift":600101}`|
|3|`{"piece_buy_gift":600201}`|
|4|`{"piece_buy_gift":600101}`|
|5|`{"piece_buy_gift":600201}`|

## GiftRelease

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Pre

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|choose_award|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|refresh_time|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_progress|number|5|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"choose_award":[[149002,1],[140002,2],[139002,10]],"refresh_time":2000,"limit_progress":500}`|
|2|`{"choose_award":[[149002,1],[140002,2],[139002,10]],"refresh_time":2000,"limit_progress":500}`|
|3|`{"choose_award":[[149002,1],[140002,2],[139002,10]],"refresh_time":2000,"limit_progress":500}`|
|4|`{"choose_award":[[149002,1],[140002,2],[139002,10]],"refresh_time":2000,"limit_progress":500}`|
|5|`{"choose_award":[[149002,1],[140002,2],[139002,10]],"refresh_time":2000,"limit_progress":500}`|

## PreShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|value|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fantasy_equip|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|version|number|30|版本引用；必须按活动类型及其消费者查对应版本表。|
|weight|number|30|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|small_icon|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"value":100,"version":1,"weight":5}`|
|2|`{"value":100,"version":1,"weight":5}`|
|3|`{"value":300,"version":1,"weight":10}`|
|4|`{"value":200,"version":1,"weight":8}`|
|5|`{"value":100,"version":1,"weight":6}`|
|6|`{"value":150,"version":1,"weight":6}`|
|7|`{"value":100,"version":2,"weight":5}`|
|8|`{"value":100,"version":2,"weight":5}`|
|9|`{"value":300,"version":2,"weight":10}`|
|10|`{"value":200,"version":2,"weight":8}`|
|11|`{"value":100,"version":2,"weight":6}`|
|12|`{"value":150,"version":2,"weight":6}`|
|13|`{"value":150,"version":3,"weight":6}`|
|14|`{"value":200,"version":3,"weight":8}`|
|15|`{"value":100,"version":3,"weight":5}`|
|16|`{"value":300,"version":3,"weight":10}`|
|17|`{"value":100,"version":3,"weight":5}`|
|18|`{"value":100,"version":3,"weight":6}`|
|19|`{"value":100,"version":4,"weight":5}`|
|20|`{"value":100,"version":4,"weight":5}`|
|21|`{"value":300,"version":4,"weight":10}`|
|22|`{"value":200,"version":4,"weight":8}`|
|23|`{"value":100,"version":4,"weight":6}`|
|24|`{"value":150,"version":4,"weight":6}`|
|25|`{"value":150,"version":5,"weight":6}`|
|26|`{"value":200,"version":5,"weight":8}`|
|27|`{"value":100,"version":5,"weight":5}`|
|28|`{"value":300,"version":5,"weight":10}`|
|29|`{"value":100,"version":5,"weight":5}`|
|30|`{"value":100,"version":5,"weight":6}`|

## FantasyEquipTrialDamage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|72|本表行键；与其他表同值不自动代表同一对象。|
|challenge|number|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|damage|number|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|72|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"damage":500000,"award":[[3901900,300],[101500,100]]}`|
|1002|`{"damage":850000,"award":[[3901900,400],[140002,3]]}`|
|1003|`{"damage":1800000,"award":[[3901900,500],[140002,4]]}`|
|1004|`{"damage":2500000,"award":[[3901900,600],[141002,1]]}`|
|1005|`{"damage":4400000,"award":[[3901900,800],[141002,2]]}`|
|1006|`{"damage":7500000,"award":[[3901900,1000],[141002,3]]}`|
|2001|`{"damage":900000,"award":[[3901900,300],[101500,100]]}`|
|2002|`{"damage":1400000,"award":[[3901900,400],[140002,3]]}`|
|2003|`{"damage":2500000,"award":[[3901900,500],[140002,4]]}`|
|2004|`{"damage":3400000,"award":[[3901900,600],[141002,1]]}`|
|2005|`{"damage":4800000,"award":[[3901900,800],[141002,2]]}`|
|2006|`{"damage":5700000,"award":[[3901900,1000],[141002,3]]}`|
|3001|`{"damage":1200000,"award":[[3901900,300],[101500,100]]}`|
|3002|`{"damage":2000000,"award":[[3901900,400],[140002,3]]}`|
|3003|`{"damage":4000000,"award":[[3901900,500],[140002,4]]}`|
|3004|`{"damage":5500000,"award":[[3901900,600],[141002,1]]}`|
|3005|`{"damage":9500000,"award":[[3901900,800],[141002,2]]}`|
|3006|`{"damage":12000000,"award":[[3901900,1000],[141002,3]]}`|
|4001|`{"damage":500000,"award":[[3901900,300],[101500,100]]}`|
|4002|`{"damage":800000,"award":[[3901900,400],[140002,3]]}`|
|4003|`{"damage":1400000,"award":[[3901900,500],[140002,4]]}`|
|4004|`{"damage":2000000,"award":[[3901900,600],[141002,1]]}`|
|4005|`{"damage":3500000,"award":[[3901900,800],[141002,2]]}`|
|4006|`{"damage":6300000,"award":[[3901900,1000],[141002,3]]}`|
|5001|`{"damage":400000,"award":[[3901900,300],[101500,100]]}`|
|5002|`{"damage":600000,"award":[[3901900,400],[140002,3]]}`|
|5003|`{"damage":1800000,"award":[[3901900,500],[140002,4]]}`|
|5004|`{"damage":2700000,"award":[[3901900,600],[141002,1]]}`|
|5005|`{"damage":5200000,"award":[[3901900,800],[141002,2]]}`|
|5006|`{"damage":10000000,"award":[[3901900,1000],[141002,3]]}`|
|6001|`{"damage":700000,"award":[[3901900,300],[101500,100]]}`|
|6002|`{"damage":1100000,"award":[[3901900,400],[140002,3]]}`|
|6003|`{"damage":3000000,"award":[[3901900,500],[140002,4]]}`|
|6004|`{"damage":3700000,"award":[[3901900,600],[141002,1]]}`|
|6005|`{"damage":6800000,"award":[[3901900,800],[141002,2]]}`|
|6006|`{"damage":15000000,"award":[[3901900,1000],[141002,3]]}`|
|7001|`{"damage":700000,"award":[[3901900,300],[101500,100]]}`|
|7002|`{"damage":950000,"award":[[3901900,400],[140002,3]]}`|
|7003|`{"damage":1600000,"award":[[3901900,500],[140002,4]]}`|
|7004|`{"damage":2600000,"award":[[3901900,600],[141002,1]]}`|
|7005|`{"damage":4600000,"award":[[3901900,800],[141002,2]]}`|
|7006|`{"damage":8600000,"award":[[3901900,1000],[141002,3]]}`|
|8001|`{"damage":2400000,"award":[[3901900,300],[101500,100]]}`|
|8002|`{"damage":3400000,"award":[[3901900,400],[140002,3]]}`|
|8003|`{"damage":5000000,"award":[[3901900,500],[140002,4]]}`|
|8004|`{"damage":7000000,"award":[[3901900,600],[141002,1]]}`|
|8005|`{"damage":11000000,"award":[[3901900,800],[141002,2]]}`|
|8006|`{"damage":14000000,"award":[[3901900,1000],[141002,3]]}`|
|9001|`{"damage":1700000,"award":[[3901900,300],[101500,100]]}`|
|9002|`{"damage":2300000,"award":[[3901900,400],[140002,3]]}`|
|9003|`{"damage":8000000,"award":[[3901900,500],[140002,4]]}`|
|9004|`{"damage":12000000,"award":[[3901900,600],[141002,1]]}`|
|9005|`{"damage":16000000,"award":[[3901900,800],[141002,2]]}`|
|9006|`{"damage":18800000,"award":[[3901900,1000],[141002,3]]}`|
|10001|`{"damage":1000000,"award":[[3901900,300],[101500,100]]}`|
|10002|`{"damage":1700000,"award":[[3901900,400],[140002,3]]}`|
|10003|`{"damage":3500000,"award":[[3901900,500],[140002,4]]}`|
|10004|`{"damage":6000000,"award":[[3901900,600],[141002,1]]}`|
|10005|`{"damage":12000000,"award":[[3901900,800],[141002,2]]}`|
|10006|`{"damage":18000000,"award":[[3901900,1000],[141002,3]]}`|
|11001|`{"damage":400000,"award":[[3901900,300],[101500,100]]}`|
|11002|`{"damage":600000,"award":[[3901900,400],[140002,3]]}`|
|11003|`{"damage":1500000,"award":[[3901900,500],[140002,4]]}`|
|11004|`{"damage":2400000,"award":[[3901900,600],[141002,1]]}`|
|11005|`{"damage":4000000,"award":[[3901900,800],[141002,2]]}`|
|11006|`{"damage":8000000,"award":[[3901900,1000],[141002,3]]}`|
|12001|`{"damage":400000,"award":[[3901900,300],[101500,100]]}`|
|12002|`{"damage":600000,"award":[[3901900,400],[140002,3]]}`|
|12003|`{"damage":1400000,"award":[[3901900,500],[140002,4]]}`|
|12004|`{"damage":1800000,"award":[[3901900,600],[141002,1]]}`|
|12005|`{"damage":6000000,"award":[[3901900,800],[141002,2]]}`|
|12006|`{"damage":12000000,"award":[[3901900,1000],[141002,3]]}`|

## FantasyEquipTrialBless

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[2,2000],[13,250]]}`|
|2|`{"attr":[[2,5000],[13,500]]}`|

## FantasyEquipTrialStar

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|150000|`{"attr":[[2,5000],[1,200000]]}`|
|150010|`{"attr":[[2,10000],[1,400000]]}`|
|150020|`{"attr":[[2,15000],[1,600000]]}`|
|150030|`{"attr":[[2,20000],[1,800000]]}`|
|150040|`{"attr":[[2,22500],[1,900000]]}`|
|150050|`{"attr":[[2,25000],[1,1000000]]}`|
|250000|`{"attr":[[2,20000],[1,800000]]}`|
|250010|`{"attr":[[2,30000],[1,1200000]]}`|
|250020|`{"attr":[[2,33000],[1,1320000]]}`|
|250030|`{"attr":[[2,50000],[1,2000000]]}`|
|250040|`{"attr":[[2,55000],[1,2200000]]}`|
|250050|`{"attr":[[2,80000],[1,3200000]]}`|
|360050|`{"attr":[[2,40000],[1,160000]]}`|
|360060|`{"attr":[[2,60000],[1,240000]]}`|
|360070|`{"attr":[[2,66000],[1,264000]]}`|
|360080|`{"attr":[[2,100000],[1,400000]]}`|
|360090|`{"attr":[[2,110000],[1,440000]]}`|
|360100|`{"attr":[[2,160000],[1,640000]]}`|

## FantasyEquipTrialLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|320|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部320行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|130001|`{"attr":[[13,25],[23,0],[2,10000]]}`|
|130002|`{"attr":[[13,50],[23,0],[2,10000]]}`|
|130003|`{"attr":[[13,75],[23,0],[2,10000]]}`|

## FantasyEquipTrial

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_style|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":1,"fight":7900001,"hero":3030501}`|
|2|`{"open_day":1,"fight":7900006,"hero":4030801}`|
|3|`{"open_day":2,"fight":7900002,"hero":1030101}`|
|4|`{"open_day":3,"fight":7900003,"hero":2030201}`|
|5|`{"open_day":4,"fight":7900004,"hero":3030601}`|
|6|`{"open_day":5,"fight":7900005,"hero":4030501}`|
|7|`{"open_day":1,"fight":7900007,"hero":2020601}`|
|8|`{"open_day":1,"fight":7900008,"hero":3020101}`|
|9|`{"open_day":2,"fight":7900009,"hero":1030501}`|
|10|`{"open_day":3,"fight":7900010,"hero":2030301}`|
|11|`{"open_day":4,"fight":7900011,"hero":3030301}`|
|12|`{"open_day":5,"fight":7900012,"hero":4030401}`|
