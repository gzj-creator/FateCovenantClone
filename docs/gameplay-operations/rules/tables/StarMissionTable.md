# StarMissionTable 规则参数

来源：[personal-server/assets/tables/StarMissionTable.data.lua.json.gz](../../../../personal-server/assets/tables/StarMissionTable.data.lua.json.gz)，SHA256：`2d3151eacd3b546148959f34ad151d5b61e4a6b598834ffab6b0e71ae6927e48`。

[完整逐行JSON](StarMissionTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[StarMission](#starmission)|1232|decoded-rows|
|[Attr](#attr)|34|decoded-rows|
|[Constant](#constant)|34|decoded-rows|
|[Skill](#skill)|748|decoded-rows|
|[Chapter](#chapter)|5|decoded-rows|
|[ChapterAward](#chapteraward)|462|decoded-rows|
|[Hero](#hero)|36|decoded-rows|

## StarMission

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1232|本表行键；与其他表同值不自动代表同一对象。|
|version|number|1232|版本引用；必须按活动类型及其消费者查对应版本表。|
|chapter|number|1232|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|1232|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lease_hero|number|1232|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_rule|array|1232|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_rule_args|array|1232|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_id|array|1232|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_num|array|1232|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

下列3行用于说明结构；全部1232行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"version":1,"fight_tid":8500011,"lease_hero":1,"star_rule":[0,106,102],"star_rule_args":[{"global":"TableEmpty"},[5],[1]],"award_id":[177002,175002,101500],"award_num":[3,50,100]}`|
|10102|`{"version":1,"fight_tid":8500012,"lease_hero":1,"star_rule":[0,106,102],"star_rule_args":[{"global":"TableEmpty"},[5],[1]],"award_id":[177002,175002,101500],"award_num":[3,50,100]}`|
|10103|`{"version":1,"fight_tid":8500013,"lease_hero":1,"star_rule":[0,106,102],"star_rule_args":[{"global":"TableEmpty"},[5],[1]],"award_id":[177002,175002,101500],"award_num":[3,50,100]}`|

## Attr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|34|本表行键；与其他表同值不自动代表同一对象。|
|level|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|break_level|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"level":50,"break_level":12}`|
|2|`{"level":50,"break_level":12}`|
|3|`{"level":50,"break_level":12}`|
|4|`{"level":50,"break_level":12}`|
|5|`{"level":50,"break_level":12}`|
|6|`{"level":50,"break_level":12}`|
|7|`{"level":50,"break_level":12}`|
|8|`{"level":50,"break_level":12}`|
|9|`{"level":50,"break_level":12}`|
|10|`{"level":50,"break_level":12}`|
|11|`{"level":50,"break_level":12}`|
|12|`{"level":50,"break_level":12}`|
|13|`{"level":50,"break_level":12}`|
|14|`{"level":50,"break_level":12}`|
|15|`{"level":50,"break_level":12}`|
|16|`{"level":50,"break_level":12}`|
|17|`{"level":50,"break_level":12}`|
|18|`{"level":50,"break_level":12}`|
|19|`{"level":50,"break_level":12}`|
|20|`{"level":50,"break_level":12}`|
|21|`{"level":50,"break_level":12}`|
|22|`{"level":50,"break_level":12}`|
|23|`{"level":50,"break_level":12}`|
|24|`{"level":50,"break_level":12}`|
|25|`{"level":50,"break_level":12}`|
|26|`{"level":50,"break_level":12}`|
|27|`{"level":50,"break_level":12}`|
|28|`{"level":50,"break_level":12}`|
|29|`{"level":50,"break_level":12}`|
|30|`{"level":50,"break_level":12}`|
|31|`{"level":50,"break_level":12}`|
|32|`{"level":50,"break_level":12}`|
|33|`{"level":50,"break_level":12}`|
|34|`{"level":50,"break_level":12}`|

## Constant

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|34|本表行键；与其他表同值不自动代表同一对象。|
|lease_tid|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|next_level_pop|boolean|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story|array|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_exchange|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"next_level_pop":false,"res_exchange":0}`|
|2|`{"next_level_pop":false,"res_exchange":0}`|
|3|`{"next_level_pop":false,"res_exchange":0}`|
|4|`{"next_level_pop":false,"res_exchange":0}`|
|5|`{"next_level_pop":false,"res_exchange":0}`|
|6|`{"next_level_pop":false,"res_exchange":0}`|
|7|`{"next_level_pop":false,"res_exchange":0}`|
|8|`{"next_level_pop":false,"res_exchange":0}`|
|9|`{"next_level_pop":false,"res_exchange":0}`|
|10|`{"next_level_pop":false,"res_exchange":0}`|
|11|`{"next_level_pop":false,"res_exchange":0}`|
|12|`{"next_level_pop":false,"res_exchange":0}`|
|13|`{"next_level_pop":false,"res_exchange":0}`|
|14|`{"next_level_pop":false,"res_exchange":0}`|
|15|`{"next_level_pop":false,"res_exchange":0}`|
|16|`{"next_level_pop":false,"res_exchange":0}`|
|17|`{"next_level_pop":false,"res_exchange":0}`|
|18|`{"next_level_pop":false,"res_exchange":0}`|
|19|`{"next_level_pop":false,"res_exchange":0}`|
|20|`{"next_level_pop":false,"res_exchange":0}`|
|21|`{"next_level_pop":false,"res_exchange":0}`|
|22|`{"next_level_pop":false,"res_exchange":0}`|
|23|`{"next_level_pop":false,"res_exchange":34}`|
|24|`{"next_level_pop":false,"res_exchange":34}`|
|25|`{"next_level_pop":false,"res_exchange":34}`|
|26|`{"next_level_pop":false,"res_exchange":34}`|
|27|`{"next_level_pop":false,"res_exchange":34}`|
|28|`{"next_level_pop":false,"res_exchange":34}`|
|29|`{"next_level_pop":false,"res_exchange":34}`|
|30|`{"next_level_pop":false,"res_exchange":34}`|
|31|`{"next_level_pop":false,"res_exchange":34}`|
|32|`{"next_level_pop":false,"res_exchange":34}`|
|33|`{"next_level_pop":false,"res_exchange":34}`|
|34|`{"next_level_pop":false,"res_exchange":34}`|

## Skill

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|748|本表行键；与其他表同值不自动代表同一对象。|
|version|number|748|版本引用；必须按活动类型及其消费者查对应版本表。|
|times|number|748|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|parent_node|object/array|748|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_name|number|748|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_id|number|748|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_num|number|748|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|unlock_ico|string|748|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lock_ico|string|748|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|748|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sp_star|number|748|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部748行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"times":3,"skill_name":15700,"cost_id":177002,"cost_num":2,"unlock_ico":"img_wgmd_icongongji.png","lock_ico":"img_wgmd_icongongji_an.png","attr":[[1,45000],[2,7500],[44,4500]],"sp_star":0}`|
|2|`{"version":1,"times":3,"skill_name":15701,"cost_id":177002,"cost_num":2,"unlock_ico":"img_wgmd_iconshengming.png","lock_ico":"img_wgmd_iconshengming_an.png","attr":[[1,45000],[2,7500],[44,4500]],"sp_star":0}`|
|3|`{"version":1,"times":3,"skill_name":15702,"cost_id":177002,"cost_num":2,"unlock_ico":"img_wgmd_iconshengming.png","lock_ico":"img_wgmd_iconshengming_an.png","attr":[[1,45000],[2,7500],[44,4500]],"sp_star":0}`|

## Chapter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## ChapterAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|462|本表行键；与其他表同值不自动代表同一对象。|
|version|number|462|版本引用；必须按活动类型及其消费者查对应版本表。|
|chapter|number|462|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|462|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|462|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

下列3行用于说明结构；全部462行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"version":1,"star":9,"award":[[175002,150]]}`|
|10102|`{"version":1,"star":15,"award":[[175002,300]]}`|
|10103|`{"version":1,"star":24,"award":[[174002,1]]}`|

## Hero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|version|number|36|版本引用；必须按活动类型及其消费者查对应版本表。|
|hero_tid|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"hero_tid":1040101,"star":5,"level":300}`|
|2|`{"version":1,"hero_tid":4040101,"star":5,"level":300}`|
|3|`{"version":2,"hero_tid":1040101,"star":5,"level":300}`|
|4|`{"version":2,"hero_tid":4040101,"star":5,"level":300}`|
|5|`{"version":3,"hero_tid":4040201,"star":5,"level":300}`|
|6|`{"version":4,"hero_tid":4040201,"star":5,"level":300}`|
|7|`{"version":5,"hero_tid":4040201,"star":5,"level":300}`|
|8|`{"version":6,"hero_tid":4040201,"star":5,"level":300}`|
|9|`{"version":7,"hero_tid":1040101,"star":5,"level":300}`|
|10|`{"version":8,"hero_tid":3040101,"star":5,"level":300}`|
|11|`{"version":9,"hero_tid":3040101,"star":5,"level":300}`|
|12|`{"version":10,"hero_tid":1040101,"star":5,"level":300}`|
|13|`{"version":11,"hero_tid":2040101,"star":5,"level":300}`|
|14|`{"version":12,"hero_tid":1040201,"star":5,"level":300}`|
|15|`{"version":13,"hero_tid":2040101,"star":5,"level":300}`|
|16|`{"version":14,"hero_tid":1040201,"star":5,"level":300}`|
|17|`{"version":15,"hero_tid":4040201,"star":5,"level":300}`|
|18|`{"version":16,"hero_tid":4040301,"star":5,"level":300}`|
|19|`{"version":17,"hero_tid":4040201,"star":5,"level":300}`|
|20|`{"version":18,"hero_tid":3040201,"star":5,"level":300}`|
|21|`{"version":19,"hero_tid":4040401,"star":5,"level":300}`|
|22|`{"version":20,"hero_tid":3040101,"star":5,"level":300}`|
|23|`{"version":21,"hero_tid":4040301,"star":5,"level":300}`|
|24|`{"version":22,"hero_tid":1040301,"star":5,"level":300}`|
|25|`{"version":23,"hero_tid":4040201,"star":5,"level":300}`|
|26|`{"version":24,"hero_tid":3040101,"star":5,"level":300}`|
|27|`{"version":25,"hero_tid":4040301,"star":5,"level":300}`|
|28|`{"version":26,"hero_tid":2040201,"star":5,"level":300}`|
|29|`{"version":27,"hero_tid":4040201,"star":5,"level":300}`|
|30|`{"version":28,"hero_tid":3040101,"star":5,"level":300}`|
|31|`{"version":29,"hero_tid":4040301,"star":5,"level":300}`|
|32|`{"version":30,"hero_tid":2040201,"star":5,"level":300}`|
|33|`{"version":31,"hero_tid":3040101,"star":5,"level":300}`|
|34|`{"version":32,"hero_tid":2040101,"star":5,"level":300}`|
|35|`{"version":33,"hero_tid":1040301,"star":5,"level":300}`|
|36|`{"version":34,"hero_tid":4040301,"star":5,"level":300}`|
