# GuideTable 规则参数

来源：[personal-server/assets/tables/GuideTable.data.json.gz](../../../../personal-server/assets/tables/GuideTable.data.json.gz)，SHA256：`d938da8b9b11e011ea15bd5a7f42da32f6a280e1fbb1aabccee11dbfe4485632`。

[完整逐行JSON](GuideTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Process](#process)|141|decoded-rows|
|[Step](#step)|718|rows-with-external-references|
|[Award](#award)|16|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[ProcessExclusion](#processexclusion)|12|decoded-rows|

## Process

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|guide_type|number|141|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_steps|array|141|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|next_process|array|141|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_steps|array|141|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|141|本表行键；与其他表同值不自动代表同一对象。|
|keys|array|141|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trigger_condition|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|102|`{"guide_type":1,"normal_steps":[[102002],[102003,102006,102007]],"next_process":[104,113],"special_steps":[[102002],[102003,102006,102007]]}`|
|104|`{"guide_type":1,"normal_steps":[[106001,106002,106003,106004],[106005,106006,106007,106008,106015]],"next_process":[105],"special_steps":[[106001,106002,106003,106004],[106005,106006,106007,106008,106015]]}`|
|105|`{"guide_type":1,"normal_steps":[[107001,107002,107003]],"next_process":[106],"special_steps":[[107001,107002,107003]]}`|
|106|`{"guide_type":1,"normal_steps":[[108001,108002,108003,108004,108005,108006,108007]],"next_process":[107],"special_steps":[[108001,108002,108003,108004,108005,108006,108007]]}`|
|107|`{"guide_type":1,"normal_steps":[[109001]],"next_process":[108,114],"special_steps":[[109001]]}`|
|108|`{"guide_type":1,"normal_steps":[[110001,110002,110003,110004],[110005,110006,110007,110008,110009]],"next_process":[109],"special_steps":[[110001,110002,110003,110004],[110005,110006,110007,110008,110009]]}`|
|109|`{"guide_type":1,"normal_steps":[[114001]],"next_process":[110],"special_steps":[[114001]]}`|
|110|`{"guide_type":1,"normal_steps":[[111001]],"next_process":[111,115],"special_steps":[[111001]]}`|
|111|`{"guide_type":1,"normal_steps":[[112001,112002,112003,112004,112005,112006,112007,112008],[112009,112010]],"next_process":[112],"special_steps":[[112001,112002,112003,112004,112005,112006,112007,112008],[112002,112009,112010]]}`|
|112|`{"guide_type":1,"normal_steps":[[113001,113002]],"next_process":[],"special_steps":[[113001,113002]]}`|
|113|`{"guide_type":1,"normal_steps":[[106001,106002,106003,106004],[106005,106006,106007,106008,106033]],"next_process":[105],"special_steps":[[106001,106002,106003,106004],[106005,106006,106007,106008,106033]],"trigger_condition":773245200113}`|
|114|`{"guide_type":1,"normal_steps":[[110001,110002,110003,110004],[110005,110006,110007,110008,110033]],"next_process":[109],"special_steps":[[110001,110002,110003,110004],[110005,110006,110007,110008,110033]],"trigger_condition":773245200113}`|
|115|`{"guide_type":1,"normal_steps":[[112001,112002,112030,112004,112005,112006,112007,112008],[112031,112032]],"next_process":[112],"special_steps":[[112001,112002,112030,112004,112005,112006,112007,112008],[112002,112030,112031,112032]],"trigger_condition":773245200113}`|
|201|`{"guide_type":2,"normal_steps":[[201001]],"next_process":[],"special_steps":[[201001]],"trigger_condition":955132601005}`|
|205|`{"guide_type":2,"normal_steps":[[235017,12,205001,205002,205003,205004,205005],[205006,205023],[205020,205021]],"next_process":[],"special_steps":[[205003,205004,205005],[205023],[205021]],"trigger_condition":773245200205}`|
|206|`{"guide_type":2,"normal_steps":[[206001,206002,206003],[206004,206005,206006,206007,206008,206009],[206010,206011,206012,206013]],"next_process":[],"special_steps":[[206001,206002,206003],[206005,206006,206007,206008,206009],[206005,206011,206012,206013]],"trigger_condition":773245200206}`|
|207|`{"guide_type":2,"normal_steps":[[207003,207004]],"next_process":[],"special_steps":[[207003,207004]],"trigger_condition":773245200207}`|
|209|`{"guide_type":2,"normal_steps":[[209001,209002,209003,209004,209005,209006,209007]],"next_process":[],"special_steps":[[10,11,209006,209007]],"trigger_condition":773245200209}`|
|210|`{"guide_type":2,"normal_steps":[[210001,5,210002,210003,210004]],"next_process":[],"special_steps":[[4,5,210002,210003,210004]],"trigger_condition":773245200210}`|
|212|`{"guide_type":2,"normal_steps":[[212001,212002,212003,212004,212005,212006,212007]],"next_process":[],"special_steps":[[212004,212005,212006,212007]],"trigger_condition":773245200212}`|
|213|`{"guide_type":2,"normal_steps":[[213010,213011,213012,213013,213002],[213003,213004],[213005]],"next_process":[],"special_steps":[[213012,213013,213002],[213003,213004],[213005]],"trigger_condition":773245200213}`|
|214|`{"guide_type":2,"normal_steps":[[214001,214002,214003,214004]],"next_process":[],"special_steps":[[214001,214003,214004]],"trigger_condition":773245200214}`|
|215|`{"guide_type":2,"normal_steps":[[215001,215002,215003,215004,215005]],"next_process":[],"special_steps":[[215001,215002,215003,215004,215005]],"trigger_condition":773245200215}`|
|217|`{"guide_type":2,"normal_steps":[[217001,217002,217003,217004,217005],[217006,217007]],"next_process":[],"special_steps":[[217001,217002,217003,217004,217005],[217006,217007]],"trigger_condition":773245200217}`|
|218|`{"guide_type":2,"normal_steps":[[218001,218002]],"next_process":[],"special_steps":[[218001,218002]],"trigger_condition":773245200218}`|
|219|`{"guide_type":2,"normal_steps":[[219001]],"next_process":[],"special_steps":[[219001]],"trigger_condition":773245200219}`|
|222|`{"guide_type":2,"normal_steps":[[222001]],"next_process":[],"special_steps":[[222001]],"trigger_condition":773245200222}`|
|226|`{"guide_type":2,"normal_steps":[[226001,226003,226007,226008,226009,226011,226012,226013,226014]],"next_process":[],"special_steps":[[226004,226005,226006,226007,226008,226009,226011,226013,226014]],"trigger_condition":773245200226}`|
|227|`{"guide_type":2,"normal_steps":[[227001,227002,227003,14,227004,227005,227006,227007,227008,227009,227010,227011]],"next_process":[],"special_steps":[[]],"trigger_condition":773245200227}`|
|228|`{"guide_type":2,"normal_steps":[[228001,228007]],"next_process":[],"special_steps":[[228001,228007]],"trigger_condition":773245200228}`|
|234|`{"guide_type":2,"normal_steps":[[234001,234002,234003,234004,234005,234006,234007,234008]],"next_process":[],"special_steps":[[234001,234002,234003,234004,234005,234006,234007,234008]],"trigger_condition":773245200234}`|
|235|`{"guide_type":2,"normal_steps":[[235001,235002,235006,235007,235010,235011,235012,235014,235015]],"next_process":[],"special_steps":[[235001,235002,235006,235007,235010,235011,235012,235014,235015]],"trigger_condition":955132601022}`|
|236|`{"guide_type":2,"normal_steps":[[236001,236002,236003,236004]],"next_process":[],"special_steps":[[236001,236002,236003,236004]],"trigger_condition":773245200236}`|
|237|`{"guide_type":2,"normal_steps":[[237001,237002,237003,237004,237005]],"next_process":[],"special_steps":[[237003,237004,237005]],"trigger_condition":773245200237}`|
|238|`{"guide_type":2,"normal_steps":[[238001,238002,238003,238004,238005,238006]],"next_process":[],"special_steps":[[238002,238003,238004,238005,238006]],"trigger_condition":773245200238}`|
|239|`{"guide_type":2,"normal_steps":[[239001,239002,239003,239004,239005],[239006],[239007,239008,239009]],"next_process":[],"special_steps":[[239002,239003,239004,239005],[4,14,239006],[4,14,239007,239008,239009]],"trigger_condition":773245200239}`|
|241|`{"guide_type":2,"normal_steps":[[241002]],"next_process":[],"special_steps":[[241002]],"trigger_condition":773245200241}`|
|242|`{"guide_type":2,"normal_steps":[[242001,242002,242003]],"next_process":[],"special_steps":[[242001,242002,242003]],"trigger_condition":773245200242}`|
|245|`{"guide_type":2,"normal_steps":[[245001,245002,245003,245004]],"next_process":[],"special_steps":[[245001,245002,245003,245004]],"trigger_condition":773245200245}`|
|249|`{"guide_type":2,"normal_steps":[[249001,249002,249003]],"next_process":[],"special_steps":[[249001,249002,249003]],"trigger_condition":773245200249}`|
|254|`{"guide_type":2,"normal_steps":[[254001,254002,254003,254004]],"next_process":[],"special_steps":[[254001,254002,254003,254004]],"trigger_condition":773245200254}`|
|255|`{"guide_type":2,"normal_steps":[[255001,255002,255003]],"next_process":[],"special_steps":[[255001,255002,255003]],"trigger_condition":773245200255}`|
|256|`{"guide_type":2,"normal_steps":[[256001]],"next_process":[],"special_steps":[[256001]],"trigger_condition":773245200256}`|
|258|`{"guide_type":2,"normal_steps":[[258001,258002,258003,258004,258005,258006]],"next_process":[],"special_steps":[[258001,258003,258004,258005,258006]],"trigger_condition":773245200258}`|
|259|`{"guide_type":2,"normal_steps":[[259001,259002,259003,259004]],"next_process":[],"special_steps":[[259001,259002,259003,259004]],"trigger_condition":773245200259}`|
|262|`{"guide_type":2,"normal_steps":[[262001],[262002,262003,262004,262005,262006,262007,262008]],"next_process":[],"special_steps":[[262001],[262002,262003,262004,262005,262006,262007,262008]],"trigger_condition":773245200262}`|
|263|`{"guide_type":2,"normal_steps":[[263001,263002,263003,263004,263005]],"next_process":[],"special_steps":[[263001,263002,263003,263004,263005]],"trigger_condition":773245200263}`|
|264|`{"guide_type":2,"normal_steps":[[264001,264002,264003,264004,264005,264006,264007,264008]],"next_process":[],"special_steps":[[264001,264002,264003,264004,264005,264006,264007,264008]],"trigger_condition":773245200264}`|
|265|`{"guide_type":2,"normal_steps":[[265001,265002,16,265003,265004,265005,265006,265007]],"next_process":[],"special_steps":[[265001,265002,16,265003,265004,265005,265006,265007]],"trigger_condition":773245200265}`|
|266|`{"guide_type":2,"normal_steps":[[266001,266002,266003]],"next_process":[],"special_steps":[[266001,266002,266003]],"trigger_condition":773245200263}`|
|267|`{"guide_type":2,"normal_steps":[[267001,267002,267003]],"next_process":[],"special_steps":[[267001,267002,267003]],"trigger_condition":773245200267}`|
|268|`{"guide_type":2,"normal_steps":[[268001,268002]],"next_process":[],"special_steps":[[268001,268002]],"trigger_condition":773245200262}`|
|273|`{"guide_type":2,"normal_steps":[[273001,273002,273003,273004]],"next_process":[],"special_steps":[[273001,273002,273003,273004]],"trigger_condition":955132601060}`|
|274|`{"guide_type":2,"normal_steps":[[274001],[274002,274003],[274004,274005]],"next_process":[],"special_steps":[[274001],[274002,274003],[274004,274005]],"trigger_condition":773245200274}`|
|275|`{"guide_type":2,"normal_steps":[[275001]],"next_process":[],"special_steps":[[275001]],"trigger_condition":773245200275}`|
|276|`{"guide_type":2,"normal_steps":[[276001]],"next_process":[],"special_steps":[[276001]],"trigger_condition":773245200275}`|
|277|`{"guide_type":2,"normal_steps":[[277001,277002]],"next_process":[],"special_steps":[[277001,277002]],"trigger_condition":955132601033}`|
|280|`{"guide_type":2,"normal_steps":[[280001,280002,280003,280004,280005,280006]],"next_process":[],"special_steps":[[280001,280002,280003,280004,280005,280006]],"trigger_condition":773245200280}`|
|282|`{"guide_type":2,"normal_steps":[[282001,282002,282003,282004,282005,282006],[282007]],"next_process":[],"special_steps":[[282001,282002,282003,282004,282005,282006],[282007]],"trigger_condition":773245200282}`|
|283|`{"guide_type":2,"normal_steps":[[283001,283002,283003,283004,283005,283006]],"next_process":[],"special_steps":[[283001,283002,283003,283004,283005,283006]],"trigger_condition":773245200283}`|
|284|`{"guide_type":2,"normal_steps":[[284001],[284002,284003]],"next_process":[],"special_steps":[[284001],[284002,284003]],"trigger_condition":773245200280}`|
|286|`{"guide_type":2,"normal_steps":[[286001]],"next_process":[],"special_steps":[[286001]],"trigger_condition":773245200286}`|
|287|`{"guide_type":2,"normal_steps":[[287004]],"next_process":[],"special_steps":[[287004]],"trigger_condition":773245200287}`|
|288|`{"guide_type":2,"normal_steps":[[288001,288002,288003,288004,288005,288006]],"next_process":[],"special_steps":[[288001,288002,288003,288004,288005,288006]],"trigger_condition":773245200288}`|
|289|`{"guide_type":2,"normal_steps":[[289001,289002,289005]],"next_process":[],"special_steps":[[289001,289002,289005]],"trigger_condition":773245200289}`|
|290|`{"guide_type":2,"normal_steps":[[290002,290003,290004,290005]],"next_process":[],"special_steps":[[290002,290003,290004,290005]],"trigger_condition":773245200290}`|
|291|`{"guide_type":2,"normal_steps":[[291004,291005,291006,291007,291008],[291009]],"next_process":[],"special_steps":[[291004,291005,291006,291007,291008],[291009]],"trigger_condition":773245200291}`|
|293|`{"guide_type":2,"normal_steps":[[292001,292002]],"next_process":[],"special_steps":[[292001,292002]],"trigger_condition":773245200293}`|
|294|`{"guide_type":2,"normal_steps":[[294001]],"next_process":[],"special_steps":[[294001]],"trigger_condition":773245200294}`|
|295|`{"guide_type":2,"normal_steps":[[295001]],"next_process":[],"special_steps":[[295001]],"trigger_condition":773245200295}`|
|296|`{"guide_type":2,"normal_steps":[[296001,296002,296003,296004,296005,296006]],"next_process":[],"special_steps":[[296003,296004,296005,296006]],"trigger_condition":773245200296}`|
|297|`{"guide_type":2,"normal_steps":[[297001,297002]],"next_process":[],"special_steps":[[297001,297002]],"trigger_condition":773245200297}`|
|299|`{"guide_type":2,"normal_steps":[[247002,247003,247004,247005,247006,247007,247009]],"next_process":[],"special_steps":[[247002,247003,247004,247005,247006,247007,247009]],"trigger_condition":773245200299}`|
|300|`{"guide_type":2,"normal_steps":[[300008,300001,300002,300003,300004,300005,300006,300007]],"next_process":[],"special_steps":[[300008,300001,300002,300003,300004,300005,300006,300007]],"trigger_condition":773245200300}`|
|320|`{"guide_type":2,"normal_steps":[[320003,320004],[320005]],"next_process":[],"special_steps":[[320003,320004],[320005]],"trigger_condition":773245200320}`|
|321|`{"guide_type":2,"normal_steps":[[321001,321002,321003,321004,321005,321006,321007]],"next_process":[],"special_steps":[[20,321002,321003,321004,321005,321006,321007]],"trigger_condition":773245200321}`|
|322|`{"guide_type":2,"normal_steps":[[322004,322001,322002,322003]],"next_process":[],"special_steps":[[322001,322002,322003]],"trigger_condition":773245200322}`|
|323|`{"guide_type":2,"normal_steps":[[323001]],"next_process":[],"special_steps":[[323001]],"trigger_condition":773245200323}`|
|324|`{"guide_type":2,"normal_steps":[[324001,324002,324003]],"next_process":[],"special_steps":[[324002,324003]],"trigger_condition":773245200324}`|
|325|`{"guide_type":2,"normal_steps":[[325001,325002,325003,325004,325005]],"next_process":[],"special_steps":[[325001,325002,325003,325004,325005]],"trigger_condition":955132601237}`|
|326|`{"guide_type":2,"normal_steps":[[326001,326002,326003]],"next_process":[],"special_steps":[[326001,326002,326003]],"trigger_condition":773245200326}`|
|327|`{"guide_type":2,"normal_steps":[[327005,327001,327002,327003]],"next_process":[],"special_steps":[[327001,327002,327003]],"trigger_condition":773245200327}`|
|328|`{"guide_type":2,"normal_steps":[[328001]],"next_process":[],"special_steps":[[328001]],"trigger_condition":773245200328}`|
|329|`{"guide_type":2,"normal_steps":[[329000,329001,329002,329003,329004,329005,329006,329009,329010]],"next_process":[],"special_steps":[[329003,329004,329005,329006,329009,329010]],"trigger_condition":773245200329}`|
|330|`{"guide_type":2,"normal_steps":[[330001,330002,330003,330004,330005,330006]],"next_process":[],"special_steps":[[20,330003,330004,330005,330006]],"trigger_condition":773245200330}`|
|331|`{"guide_type":2,"normal_steps":[[331001]],"next_process":[],"special_steps":[[331001]],"trigger_condition":773245200331}`|
|332|`{"guide_type":2,"normal_steps":[[332001]],"next_process":[],"special_steps":[[332001]],"trigger_condition":773245200332}`|
|333|`{"guide_type":2,"normal_steps":[[333001,333002,333003,333004,333005]],"next_process":[],"special_steps":[[333001,333002,333003,333004,333005]],"trigger_condition":773245200333}`|
|334|`{"guide_type":2,"normal_steps":[[334001,334002,334003,334004]],"next_process":[],"special_steps":[[334001,334002,334003,334004]],"trigger_condition":773245200334}`|
|335|`{"guide_type":2,"normal_steps":[[335002,335003]],"next_process":[],"special_steps":[[335002,335003]],"trigger_condition":773245200335}`|
|336|`{"guide_type":2,"normal_steps":[[336001,336002,336003]],"next_process":[],"special_steps":[[336001,336002,336003]],"trigger_condition":773245200336}`|
|337|`{"guide_type":2,"normal_steps":[[337001,337002,337003]],"next_process":[],"special_steps":[[337001,337002,337003]],"trigger_condition":773245200337}`|
|339|`{"guide_type":2,"normal_steps":[[339001,339002,339003]],"next_process":[],"special_steps":[[339001,339002,339003]],"trigger_condition":773245200339}`|
|340|`{"guide_type":2,"normal_steps":[[340001,340002]],"next_process":[],"special_steps":[[340001,340002]],"trigger_condition":773245200340}`|
|341|`{"guide_type":2,"normal_steps":[[341001,341002,341003,341004,341005,341006,341007,341008,341009]],"next_process":[],"special_steps":[[341004,341005,341006,341007,341008,341009]],"trigger_condition":773245200341}`|
|342|`{"guide_type":2,"normal_steps":[[342001,342002,342003,342004,342005]],"next_process":[],"special_steps":[[342001,342002,342003,342004,342005]],"trigger_condition":773245200342}`|
|345|`{"guide_type":2,"normal_steps":[[345001,345002,345003,345004,345006,345007]],"next_process":[],"special_steps":[[345001,345002,345003,345004,345006,345007]],"trigger_condition":773245200345}`|
|346|`{"guide_type":2,"normal_steps":[[346001]],"next_process":[],"special_steps":[[346001]],"trigger_condition":773245200345}`|
|347|`{"guide_type":2,"normal_steps":[[347001,347002,347003,347005,347006]],"next_process":[],"special_steps":[[347001,347002,347003,347005,347006]],"trigger_condition":773245200347}`|
|348|`{"guide_type":2,"normal_steps":[[348001]],"next_process":[],"special_steps":[[348001]],"trigger_condition":773245200347}`|
|349|`{"guide_type":2,"normal_steps":[[349001,349002,349003,349004]],"next_process":[],"special_steps":[[349001,349002,349003,349004]],"trigger_condition":773245200349}`|
|350|`{"guide_type":2,"normal_steps":[[350001,350002,350003,350004]],"next_process":[],"special_steps":[[350001,350002,350003,350004]],"trigger_condition":773245200350}`|
|351|`{"guide_type":2,"normal_steps":[[351001,351002,351003,351004,351005,351006,351007,351008,351009,351010]],"next_process":[],"special_steps":[[351005,351006,351007,351008,351009,351010]],"trigger_condition":773245200351}`|
|352|`{"guide_type":2,"normal_steps":[[352001,352002,352003,352004]],"next_process":[],"special_steps":[[352001,352002,352003,352004]],"trigger_condition":773245200351}`|
|353|`{"guide_type":2,"normal_steps":[[353001,353002,353003,353004,353005,353006,353007]],"next_process":[],"special_steps":[[353001,353002,353003,353004,353005,353006,353007]],"trigger_condition":773245200353}`|
|354|`{"guide_type":2,"normal_steps":[[354001,354002]],"next_process":[],"special_steps":[[354001,354002]],"trigger_condition":773245200354}`|
|355|`{"guide_type":2,"normal_steps":[[355001,355002,355003]],"next_process":[],"special_steps":[[355001,355002,355003]],"trigger_condition":773245200355}`|
|356|`{"guide_type":2,"normal_steps":[[356001,356002,356003,356004]],"next_process":[],"special_steps":[[356001,356002,356003,356004]],"trigger_condition":773245200356}`|
|357|`{"guide_type":2,"normal_steps":[[357001,357002,357003,357004,357005,357006,357007,357008,357009,357010,357011,357012,357013,357014,357015]],"next_process":[],"special_steps":[[357001,357002,357003,357004,357005,357006,357007,357008,357009,357010,357011,357012,357013,357014,357015]],"trigger_condition":773245200357}`|
|358|`{"guide_type":2,"normal_steps":[[358001]],"next_process":[],"special_steps":[[358001]],"trigger_condition":773245200358}`|
|360|`{"guide_type":2,"normal_steps":[[360001,360002,360003]],"next_process":[],"special_steps":[[360001,360002,360003]],"trigger_condition":773245200360}`|
|361|`{"guide_type":2,"normal_steps":[[361001,361002,361003]],"next_process":[],"special_steps":[[361001,361002,361003]],"trigger_condition":773245200361}`|
|362|`{"guide_type":2,"normal_steps":[[362001,362002,362003],[362004,362005]],"next_process":[],"special_steps":[[362001,362002,362003],[362004,362005]],"trigger_condition":773245200362}`|
|363|`{"guide_type":2,"normal_steps":[[363001]],"next_process":[],"special_steps":[[363001]],"trigger_condition":773245200363}`|
|364|`{"guide_type":2,"normal_steps":[[364001,364002,364004],[364005,364006]],"next_process":[],"special_steps":[[364001,364002,364004],[364005,364006]],"trigger_condition":773245200364}`|
|365|`{"guide_type":2,"normal_steps":[[364007,364008]],"next_process":[],"special_steps":[[364007,364008]],"trigger_condition":773245200365}`|
|366|`{"guide_type":2,"normal_steps":[[364050,364051,364052,364053,364054,364055,364056],[364057],[364058,364059,364060]],"next_process":[],"special_steps":[[364050,364051,364052,364053,364054,364055,364056],[364057],[364058,364059,364060]],"trigger_condition":773245200366}`|
|367|`{"guide_type":2,"normal_steps":[[364061,364062,364063,364064],[364065,364066,364067,364068]],"next_process":[],"special_steps":[[364061,364062,364063,364064],[364065,364066,364067,364068]],"trigger_condition":773245200366}`|
|368|`{"guide_type":2,"normal_steps":[[364069]],"next_process":[],"special_steps":[[364069]],"trigger_condition":773245200368}`|
|369|`{"guide_type":2,"normal_steps":[[235017,12,205001,205002,205003,205004,205005],[205006,205023],[205020,364070]],"next_process":[],"special_steps":[[205003,205004,205005],[205023],[205020,364070]],"trigger_condition":773245200369}`|
|370|`{"guide_type":2,"normal_steps":[[364071]],"next_process":[],"special_steps":[[364071]],"trigger_condition":773245200368}`|
|1005|`{"guide_type":2,"normal_steps":[[235017,12,205001,205002,205003,205004,205005],[205006,205023],[205020,205021]],"next_process":[],"special_steps":[[205003,205004,205005],[205023],[205020,205021]],"trigger_condition":773245201005}`|
|1027|`{"guide_type":2,"normal_steps":[[227001,227002,227031,227003,227005,227006,227007,227008,227009,227010,227011]],"next_process":[],"special_steps":[[]],"trigger_condition":773245201027}`|
|1039|`{"guide_type":2,"normal_steps":[[239001,239002,239003,239004,239005],[239030,239006],[239007,239008,239009]],"next_process":[],"special_steps":[[239002,239003,239004,239005],[4,239030,239006],[4,239030,239007,239008,239009]],"trigger_condition":773245201039}`|
|1065|`{"guide_type":2,"normal_steps":[[265001,265002,265030,265031,265004,265005,265006,265007]],"next_process":[],"special_steps":[[265001,265002,265030,265031,265004,265005,265006,265007]],"trigger_condition":773245201065}`|
|1088|`{"guide_type":2,"normal_steps":[[288001,288002,288030,288031,288005,288006]],"next_process":[],"special_steps":[[288001,288002,288030,288031,288005,288006]],"trigger_condition":773245201088}`|
|10358|`{"guide_type":2,"normal_steps":[[359001]],"next_process":[],"special_steps":[[359001]],"trigger_condition":773245210358}`|
|10359|`{"guide_type":2,"normal_steps":[[365001,365002],[365003,365004],[365005,365006],[365007],[365008,365009,365010],[365011]],"next_process":[],"special_steps":[[365001,365002],[365003,365004],[365005,365006],[365007],[365008,365009,365010],[365011]],"trigger_condition":773245210359}`|
|10360|`{"guide_type":2,"normal_steps":[[365020,365021],[365022,365023],[365024,365025],[365026,365027],[365028,365029,365030],[365031]],"next_process":[],"special_steps":[[365020,365021],[365022,365023],[365024,365025],[365026,365027],[365028,365029,365030],[365031]],"trigger_condition":773245210360}`|
|10361|`{"guide_type":2,"normal_steps":[[365032,365033,365034,365035,365036],[365037],[365038,365039,365040]],"next_process":[],"special_steps":[[365032,365033,365034,365035,365036],[365037],[365038,365039,365040]],"trigger_condition":773245210361}`|
|10362|`{"guide_type":2,"normal_steps":[[365041,365042,365043,365044],[365045,365046,365047,365048]],"next_process":[],"special_steps":[[365041,365042,365043,365044],[365045,365046,365047,365048]],"trigger_condition":773245210362}`|
|10380|`{"guide_type":2,"normal_steps":[[365060,365080,365061,365062,365063,365070,365071,365072,365073,365074,365064]],"next_process":[],"special_steps":[[365060,365080,365061,365062,365063,365070,365071,365072,365073,365074,365064]],"trigger_condition":773245210380}`|
|10381|`{"guide_type":2,"normal_steps":[[365065]],"next_process":[],"special_steps":[[365065]],"trigger_condition":773245210380}`|
|10382|`{"guide_type":2,"normal_steps":[[365066]],"next_process":[],"special_steps":[[365066]],"trigger_condition":773245210380}`|
|10383|`{"guide_type":2,"normal_steps":[[365067,365068,365069]],"next_process":[],"special_steps":[[365067,365068,365069]],"trigger_condition":773245210380}`|
|10385|`{"guide_type":2,"normal_steps":[[365075,365076]],"next_process":[],"special_steps":[[365075,365076]],"trigger_condition":773245210380}`|
|10390|`{"guide_type":2,"normal_steps":[[365100,365101,365102,365104,365103]],"next_process":[],"special_steps":[[365100,365101,365102,365104,365103]],"trigger_condition":773245210390}`|
|10391|`{"guide_type":2,"normal_steps":[[365105,365106]],"next_process":[],"special_steps":[[365105,365106]],"trigger_condition":773245210391}`|
|10392|`{"guide_type":2,"normal_steps":[[365107,365108,365109]],"next_process":[],"special_steps":[[365107,365108,365109]],"trigger_condition":773245210392}`|
|10393|`{"guide_type":2,"normal_steps":[[365110,365111]],"next_process":[],"special_steps":[[365110,365111]],"trigger_condition":773245210393}`|
|10394|`{"guide_type":2,"normal_steps":[[365112]],"next_process":[],"special_steps":[[365112]],"trigger_condition":773245210394}`|

## Step

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|finger_tips|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|step_module|object|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finish_events|array|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sound|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trigger_condition|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finger_tips_type|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trigger_events|array|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cartoon|string|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ref_int_param|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cartoon_chapter|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|arrow|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_image|string|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_content|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finger_tips_pos|array|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ref_drag|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|param|number/array|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_title|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|718|本表行键；与其他表同值不自动代表同一对象。|
|over_jump|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_black_mask|boolean|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|wait_finish_lock|boolean|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guide_node|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|education|number|718|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finish_condition|number|58|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部718行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"step_module":{"reference":"GuideCommClickStep"},"trigger_condition":688831700001,"finger_tips_type":0,"need_black_mask":false,"wait_finish_lock":false}`|
|2|`{"step_module":{"reference":"GuideCommClickStep"},"trigger_condition":688831700002,"finger_tips_type":0,"need_black_mask":false,"wait_finish_lock":false}`|
|3|`{"step_module":{"reference":"GuideCommClickStep"},"trigger_condition":688831700003,"finger_tips_type":0,"need_black_mask":true,"wait_finish_lock":false}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|award_n|array|16|奖励数量数组；零与缺字段分别保留。|
|fly_dst|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_i|array|16|奖励ID数组，与award_n逐项配对。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_n":[1],"award_i":[1020601]}`|
|2|`{"award_n":[1],"award_i":[2020601]}`|
|3|`{"award_n":[25],"award_i":[1002]}`|
|4|`{"award_n":[1],"award_i":[2002]}`|
|5|`{"award_n":[1],"award_i":[3020201]}`|
|6|`{"award_n":[1],"award_i":[1020301]}`|
|7|`{"award_n":[1],"award_i":[25002]}`|
|8|`{"award_n":[1],"award_i":[25002]}`|
|9|`{"award_n":[4],"award_i":[25002]}`|
|10|`{"award_n":[1,1],"award_i":[2002,3020201]}`|
|11|`{"award_n":[1],"award_i":[200110]}`|
|12|`{"award_n":[1],"award_i":[2020201]}`|
|13|`{"award_n":[666],"award_i":[101500]}`|
|14|`{"award_n":[1],"award_i":[10004100]}`|
|15|`{"award_n":[1],"award_i":[100614400]}`|
|16|`{"award_n":[1,1,1,1],"award_i":[10084600,10034600,10024600,10014600]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fix_lineup|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_guide_role_level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fix_lineup":150201,"fight_guide_role_level":47}`|

## ProcessExclusion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|exclude_id|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|205|`{}`|
|227|`{}`|
|239|`{}`|
|265|`{}`|
|288|`{}`|
|358|`{}`|
|1005|`{}`|
|1027|`{}`|
|1039|`{}`|
|1065|`{}`|
|1088|`{}`|
|10358|`{}`|
