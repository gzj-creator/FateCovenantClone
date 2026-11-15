# HeroTable 规则参数

来源：[personal-server/assets/tables/HeroTable.data.lua.json.gz](../../../../personal-server/assets/tables/HeroTable.data.lua.json.gz)，SHA256：`03e95433be6d5af3d0aa17fb0c4d4224e67e7f342b502fdc3a3b65abf27f2561`。

[完整逐行JSON](HeroTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[NpcAttr](#npcattr)|未知|unresolved：Empty/non-row output; field map not independently recovered|
|[NpcAttrRatio](#npcattrratio)|66|decoded-rows|
|[Npc_Ability](#npc_ability)|333|decoded-rows|
|[NpcFightCustom](#npcfightcustom)|1|decoded-rows|
|[Npc](#npc)|333|decoded-rows|
|[Hero](#hero)|337|decoded-rows|
|[AttrPlayWeaken](#attrplayweaken)|28|decoded-rows|
|[AttrType](#attrtype)|284|decoded-rows|
|[AttrTransform](#attrtransform)|6|decoded-rows|
|[Puppet](#puppet)|104|decoded-rows|
|[Diff](#diff)|68|decoded-rows|
|[LegendStrategy](#legendstrategy)|49|decoded-rows|
|[StrategyWebLineup](#strategyweblineup)|2|decoded-rows|
|[StrategyConst](#strategyconst)|1|decoded-rows|
|[Strategy](#strategy)|3|decoded-rows|
|[StrategyLineup](#strategylineup)|62|decoded-rows|
|[StrategyDrawLineup](#strategydrawlineup)|6|decoded-rows|
|[StrategyNewConst](#strategynewconst)|2|decoded-rows|
|[StrategyNew](#strategynew)|8|decoded-rows|
|[StrategyLineupType](#strategylineuptype)|18|decoded-rows|
|[StrategyType](#strategytype)|3|decoded-rows|
|[RoleSpecialStyle](#rolespecialstyle)|4|decoded-rows|
|[WarRuneStyle](#warrunestyle)|4|decoded-rows|
|[RoleStyle](#rolestyle)|545|rows-with-external-references|
|[DrawLuckyConst](#drawluckyconst)|1|decoded-rows|
|[DrawLuckyShare](#drawluckyshare)|3|decoded-rows|
|[LuckyRankAward](#luckyrankaward)|5|decoded-rows|
|[DrawLuckyPrefix](#drawluckyprefix)|0|decoded-rows|
|[DrawLuckyRange](#drawluckyrange)|386|decoded-rows|
|[DrawExchangeSlotType](#drawexchangeslottype)|2|decoded-rows|
|[DrawExchangeSlot](#drawexchangeslot)|3|decoded-rows|
|[DrawExchangeParam](#drawexchangeparam)|1|decoded-rows|
|[DrawExchangeHero](#drawexchangehero)|27|decoded-rows|
|[DrawExchangeLineup](#drawexchangelineup)|4|decoded-rows|
|[NormalDrawExchangeLineup](#normaldrawexchangelineup)|4|decoded-rows|
|[Star](#star)|12|decoded-rows|
|[ShowHeroLegendHotParam](#showherolegendhotparam)|2|decoded-rows|
|[ShowWorldBossParam](#showworldbossparam)|3|decoded-rows|
|[ShowRoleParam](#showroleparam)|1|decoded-rows|
|[ShowFiveDayBossParam](#showfivedaybossparam)|5|decoded-rows|
|[ShowHelpUpParam](#showhelpupparam)|4|decoded-rows|
|[ShowMartialClubParam](#showmartialclubparam)|1|decoded-rows|
|[ShowArtifactParam](#showartifactparam)|22|decoded-rows|
|[ShowArtifactHandbookParam](#showartifacthandbookparam)|22|decoded-rows|
|[ShowArtifactForgeParam](#showartifactforgeparam)|22|decoded-rows|
|[ArtifactSkinParam](#artifactskinparam)|0|decoded-rows|
|[ShowArtifactDrawParam](#showartifactdrawparam)|10|decoded-rows|
|[ShowArtifactTrialsParam](#showartifacttrialsparam)|22|decoded-rows|
|[ShowArtifactFlyUpParam](#showartifactflyupparam)|22|decoded-rows|
|[ShowArtifactAcquireParam](#showartifactacquireparam)|22|decoded-rows|
|[ChristmasSkinParam](#christmasskinparam)|2|decoded-rows|
|[ShowWaterGunParam](#showwatergunparam)|4|decoded-rows|
|[ShowWarRuneMainParam](#showwarrunemainparam)|4|decoded-rows|
|[ShowWarRuneSecondFormParam](#showwarrunesecondformparam)|4|decoded-rows|
|[ShowWarRuneActiveParam](#showwarruneactiveparam)|4|decoded-rows|
|[ShowFantasyEquipBookParam](#showfantasyequipbookparam)|8|decoded-rows|
|[ShowFantasyEquipParam](#showfantasyequipparam)|37|decoded-rows|
|[ShowFantasyEquipBlessParam](#showfantasyequipblessparam)|39|decoded-rows|
|[ShowFantasyEquipDrawParam](#showfantasyequipdrawparam)|33|decoded-rows|
|[ShowFantasyEquipDemigodParam](#showfantasyequipdemigodparam)|28|decoded-rows|
|[ShowGetNewFantasyEquipParam](#showgetnewfantasyequipparam)|13|decoded-rows|
|[ShowFantasyEquipTrialParam](#showfantasyequiptrialparam)|33|decoded-rows|
|[ShowHeroDrawParam](#showherodrawparam)|4|decoded-rows|
|[ShowScarletTrailParam](#showscarlettrailparam)|17|decoded-rows|
|[ShowRankParam](#showrankparam)|3|decoded-rows|
|[RoleShowParamMap](#roleshowparammap)|121|rows-with-external-references|
|[ShowHundredDrawParam](#showhundreddrawparam)|4|decoded-rows|
|[DivineEmbryoShowParam](#divineembryoshowparam)|13|decoded-rows|
|[ShowElvesDevelopParam](#showelvesdevelopparam)|30|decoded-rows|
|[ShowElvesRaiseStarParam](#showelvesraisestarparam)|30|decoded-rows|
|[ShowElvesRaiseStarSuccessParam](#showelvesraisestarsuccessparam)|30|decoded-rows|
|[ShowElvesMutantParam](#showelvesmutantparam)|2|decoded-rows|
|[ShowElvesMutantSuccessParam](#showelvesmutantsuccessparam)|1|decoded-rows|
|[ShowElvesBookParam](#showelvesbookparam)|30|decoded-rows|
|[ShowElvesActParam](#showelvesactparam)|19|decoded-rows|
|[ShowElvesHelpParam](#showelveshelpparam)|30|decoded-rows|
|[ShowElvesDrawParam](#showelvesdrawparam)|19|decoded-rows|
|[ShowElvesSkinParam](#showelvesskinparam)|30|decoded-rows|
|[ShowElvesGetParam](#showelvesgetparam)|30|decoded-rows|
|[ShowFightResultParam](#showfightresultparam)|151|decoded-rows|
|[DownShowParam](#downshowparam)|1|decoded-rows|
|[ShowUpStarParam](#showupstarparam)|86|decoded-rows|
|[ShowParam](#showparam)|135|decoded-rows|
|[ReforgeParam](#reforgeparam)|83|decoded-rows|
|[ShowBreachParam](#showbreachparam)|81|decoded-rows|
|[DefaultShowParam](#defaultshowparam)|3|decoded-rows|
|[FashionHeroStyleParam](#fashionherostyleparam)|4|decoded-rows|
|[ShowFavorParam](#showfavorparam)|76|decoded-rows|
|[ShowPetDevelopBookParam](#showpetdevelopbookparam)|19|decoded-rows|
|[ShowPetDevelopParam](#showpetdevelopparam)|19|decoded-rows|
|[ShowPetRaiseStarParam](#showpetraisestarparam)|19|decoded-rows|
|[ShowPetRaiseStarSuccessParam](#showpetraisestarsuccessparam)|19|decoded-rows|
|[ShowPetUpgradeParam](#showpetupgradeparam)|19|decoded-rows|
|[ShowPetMutantParam](#showpetmutantparam)|2|decoded-rows|
|[ShowPetBookParam](#showpetbookparam)|19|decoded-rows|
|[ShowPetChallengeParam](#showpetchallengeparam)|19|decoded-rows|
|[ShowPetDisplayParam](#showpetdisplayparam)|19|decoded-rows|
|[ShowPetActParam](#showpetactparam)|6|decoded-rows|
|[ShowPetHelpParam](#showpethelpparam)|19|decoded-rows|
|[ShowPetGetParam](#showpetgetparam)|18|decoded-rows|
|[ShowEliteBossPreviewParam](#showelitebosspreviewparam)|4|decoded-rows|
|[MasteryGroup](#masterygroup)|20|decoded-rows|
|[MasteryLevel](#masterylevel)|1400|decoded-rows|
|[MasteryConst](#masteryconst)|1|decoded-rows|
|[MasteryMat](#masterymat)|3|decoded-rows|
|[MasteryBreak](#masterybreak)|100|decoded-rows|
|[Mastery](#mastery)|77|decoded-rows|
|[Develop](#develop)|6|rows-with-external-references|
|[DevelopInfoShare](#developinfoshare)|1|decoded-rows|
|[ExchangeParam](#exchangeparam)|1|decoded-rows|
|[ExchangeCost](#exchangecost)|3|decoded-rows|
|[ExchangeLib](#exchangelib)|0|decoded-rows|
|[DevelopConst](#developconst)|1|decoded-rows|
|[UpStarCost](#upstarcost)|50|decoded-rows|
|[UpStarStone](#upstarstone)|21|decoded-rows|
|[UpLevel](#uplevel)|299|decoded-rows|
|[UpStageTalent](#upstagetalent)|3927|decoded-rows|
|[UpStage](#upstage)|50|decoded-rows|
|[TrialTask](#trialtask)|180|decoded-rows|
|[StoryTalk](#storytalk)|51|decoded-rows|
|[HighStarAddAttr](#highstaraddattr)|390|decoded-rows|
|[StarAddAttr](#staraddattr)|97|decoded-rows|
|[StarAttrType](#starattrtype)|4|decoded-rows|
|[BaseAttrNew](#baseattrnew)|203|decoded-rows|
|[BattleAttr](#battleattr)|77|decoded-rows|
|[BreakAddAttr](#breakaddattr)|51|decoded-rows|
|[FavourIntimacyLevel](#favourintimacylevel)|50|decoded-rows|
|[FavourIntimacyItem](#favourintimacyitem)|4|decoded-rows|
|[FavourIntimacyContentGroup](#favourintimacycontentgroup)|28|decoded-rows|
|[FavourIntimacyContent](#favourintimacycontent)|510|decoded-rows|
|[FavourIntimacyCycle](#favourintimacycycle)|2|decoded-rows|
|[FavourIntimacyBase](#favourintimacybase)|16|decoded-rows|
|[FavourIntimacyPhoto](#favourintimacyphoto)|0|decoded-rows|
|[FavourIntimacyChat](#favourintimacychat)|16|decoded-rows|
|[FavourIntimacyConst](#favourintimacyconst)|1|decoded-rows|
|[FavourIntimacyCharm](#favourintimacycharm)|30|decoded-rows|
|[Position](#position)|253|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[DrawAchievementAward](#drawachievementaward)|1|decoded-rows|
|[DrawAchievementLib](#drawachievementlib)|102|decoded-rows|
|[DrawCheck](#drawcheck)|2|decoded-rows|
|[DrawSpecifyHeroShow](#drawspecifyheroshow)|1|decoded-rows|
|[DrawShow](#drawshow)|28|decoded-rows|
|[DrawConst](#drawconst)|1|decoded-rows|
|[Draw](#draw)|898|rows-with-external-references|
|[DrawNumLimit](#drawnumlimit)|9|decoded-rows|
|[DrawProgAward](#drawprogaward)|0|decoded-rows|
|[DrawExtAward](#drawextaward)|5|decoded-rows|
|[DrawServerSplit](#drawserversplit)|1|decoded-rows|
|[NormalDrawWishCell](#normaldrawwishcell)|3|decoded-rows|
|[Guaranteed](#guaranteed)|66|decoded-rows|
|[DrawVideo](#drawvideo)|7|decoded-rows|
|[FilterOff](#filteroff)|2|decoded-rows|
|[VisitConst](#visitconst)|1|decoded-rows|
|[Visit](#visit)|3|decoded-rows|
|[VisitUnlock](#visitunlock)|59|decoded-rows|
|[StarPendant](#starpendant)|6|decoded-rows|
|[Pendant](#pendant)|2|decoded-rows|
|[PendantPartType](#pendantparttype)|1|decoded-rows|
|[StoryChapterEndingType](#storychapterendingtype)|4|decoded-rows|
|[StoryChapterChoice](#storychapterchoice)|80|decoded-rows|
|[StoryChapterPage](#storychapterpage)|86|decoded-rows|
|[StoryChapterPageShow](#storychapterpageshow)|202|decoded-rows|
|[StoryChapter](#storychapter)|16|decoded-rows|
|[ReforgeAttr](#reforgeattr)|25|decoded-rows|
|[ReforgeConst](#reforgeconst)|1|decoded-rows|
|[Reforge](#reforge)|76|decoded-rows|
|[SchoolChooseConst](#schoolchooseconst)|1|decoded-rows|
|[SchoolChoose](#schoolchoose)|4|decoded-rows|
|[PotentialCount](#potentialcount)|5|decoded-rows|
|[PotentialGroup](#potentialgroup)|20|decoded-rows|
|[Potential](#potential)|4|decoded-rows|
|[LegendHotTalk](#legendhottalk)|33|decoded-rows|
|[CommentParam](#commentparam)|1|decoded-rows|
|[CommentInit](#commentinit)|66|decoded-rows|
|[RentRule](#rentrule)|1|decoded-rows|
|[Rent](#rent)|1|decoded-rows|
|[Rare](#rare)|9|decoded-rows|
|[IntimacyDate](#intimacydate)|0|decoded-rows|
|[FetterEffectLineup](#fettereffectlineup)|61|decoded-rows|
|[FetterShow](#fettershow)|22|decoded-rows|
|[FetterEffectNormal](#fettereffectnormal)|3|decoded-rows|
|[FetterEffectCondition](#fettereffectcondition)|8|rows-with-external-references|
|[Fetter](#fetter)|79|decoded-rows|
|[FetterEffectDragon](#fettereffectdragon)|90|decoded-rows|
|[GetWay](#getway)|6|decoded-rows|
|[Quality](#quality)|5|decoded-rows|
|[HeadAward](#headaward)|77|decoded-rows|
|[Sex](#sex)|2|decoded-rows|
|[AbilityLevel](#abilitylevel)|55|decoded-rows|
|[Ability](#ability)|77|decoded-rows|
|[From](#from)|5|decoded-rows|
|[Cell](#cell)|6|decoded-rows|
|[Sort](#sort)|2|decoded-rows|
|[Profession](#profession)|5|decoded-rows|
|[Camp](#camp)|12|decoded-rows|
|[AllFavourLevel](#allfavourlevel)|400|decoded-rows|
|[PlaygroundUnlock](#playgroundunlock)|52|decoded-rows|
|[PlaygroundAward](#playgroundaward)|3|decoded-rows|
|[FavourConst](#favourconst)|1|decoded-rows|
|[FavourBubble](#favourbubble)|53|decoded-rows|
|[FavourGift](#favourgift)|3|decoded-rows|
|[FavourBreak](#favourbreak)|3|decoded-rows|
|[FavourLevel](#favourlevel)|13|decoded-rows|
|[FavourRedShow](#favourredshow)|2|decoded-rows|
|[ResolveHandler](#resolvehandler)|1|decoded-rows|
|[Return](#return)|6|decoded-rows|
|[CustomCamp](#customcamp)|0|decoded-rows|
|[Prop](#prop)|0|decoded-rows|
|[RoleSound](#rolesound)|158|decoded-rows|
|[RouseConst](#rouseconst)|1|decoded-rows|
|[RouseStar](#rousestar)|5|decoded-rows|
|[RouseActive](#rouseactive)|0|decoded-rows|
|[TeamSuggestGroupType](#teamsuggestgrouptype)|4|decoded-rows|
|[TeamSuggestShow](#teamsuggestshow)|12|decoded-rows|
|[TeamSuggestConst](#teamsuggestconst)|1|decoded-rows|
|[TeamSuggestAward](#teamsuggestaward)|30|decoded-rows|
|[TeamSuggestType](#teamsuggesttype)|4|decoded-rows|
|[TeamSuggest](#teamsuggest)|12|decoded-rows|
|[TeamSuggestTeamType](#teamsuggestteamtype)|3|decoded-rows|
|[TeamSuggestFirstTeam](#teamsuggestfirstteam)|2|decoded-rows|
|[TeamGenreCycleOld](#teamgenrecycleold)|88|decoded-rows|
|[TeamGenreCycle](#teamgenrecycle)|73|decoded-rows|
|[StrategyTeamGenre](#strategyteamgenre)|10|decoded-rows|
|[TeamGenreConst](#teamgenreconst)|1|decoded-rows|
|[TeamGenreShow](#teamgenreshow)|76|decoded-rows|
|[TeamGenreAward](#teamgenreaward)|6|decoded-rows|
|[TeamGenreAwardOld](#teamgenreawardold)|6|decoded-rows|
|[TeamGenreType](#teamgenretype)|37|decoded-rows|
|[TeamGenre](#teamgenre)|151|decoded-rows|
|[HandbookCampConstant](#handbookcampconstant)|5|decoded-rows|
|[HandbookConstant](#handbookconstant)|1|decoded-rows|
|[Handbook](#handbook)|48|decoded-rows|
|[HandbookLineUpEffect](#handbooklineupeffect)|5|decoded-rows|
|[HandbookPrefabConfig](#handbookprefabconfig)|77|decoded-rows|
|[HandbookStylePos](#handbookstylepos)|79|decoded-rows|

## NpcAttr

未恢复：Empty/non-row output; field map not independently recovered。不能把解析失败当作原表0行。

## NpcAttrRatio

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|66|本表行键；与其他表同值不自动代表同一对象。|
|attr_list|array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1010200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1020100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1020200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1020300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1020400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1020500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1020600|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1030100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1030200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1030300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1030400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1030500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1030600|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1030700|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1040100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|1040200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2010100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2010200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2020100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2020200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2020300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2020400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2020500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2020600|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2030100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2030200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2030300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2030400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2030500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2030600|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2030700|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|2040100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3010100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3010200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3010300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3020100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3020200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3020300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3020400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3020500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3030100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3030200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3030300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3030400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3030500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3030600|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3030700|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|3040100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4010100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4010200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4010300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4020100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4020200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4020300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4020400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4020500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4030100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4030200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4030300|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4030400|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4030500|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4030600|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4030800|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4040100|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|
|4040200|`{"attr_list":[[1,10000],[2,10000],[24,10000],[25,10000],[11,10000],[12,10000]]}`|

## Npc_Ability

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|ability|array|333|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|soul_ab|number|333|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|profession_ab|number|333|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|333|本表行键；与其他表同值不自动代表同一对象。|

下列3行用于说明结构；全部333行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010100|`{"ability":[1101010101,2101010112,3101010111,3101010121,3101010131,3101010141,3101010151,4101010161]}`|
|1010200|`{"ability":[1101020101,2101020112,3101020111,3101020121,3101020131,3101020141,3101020151,4101020161]}`|
|1020100|`{"ability":[1102010101,2102010112,3102010111,3102010121,3102010131,3102010141,3102010151,4102010161]}`|

## NpcFightCustom

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|elite_scale|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|elite_blood_height|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Npc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|soul_fetter_lv|number|333|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relation_hero|number|333|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_elite|boolean|333|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|333|本表行键；与其他表同值不自动代表同一对象。|
|soul_fetter_idx|number|333|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部333行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010100|`{"soul_fetter_lv":0,"relation_hero":1010101,"is_elite":true}`|
|1010200|`{"soul_fetter_lv":0,"relation_hero":1010201,"is_elite":true}`|
|1020100|`{"soul_fetter_lv":0,"relation_hero":1020101,"is_elite":true}`|

## Hero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|is_guards|boolean|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|profession|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_name|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lucky_value|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|index|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_way|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|not_in_guide|boolean|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|nick_name|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name_get_way|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sex|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|archive_id|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_star|number|337|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|description|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|aptitude|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_rare|boolean|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|337|本表行键；与其他表同值不自动代表同一对象。|
|recommend_lineup|array|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chip|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_position|array|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_puppet|boolean|337|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部337行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"is_guards":false,"lucky_value":110,"talent":1,"star":0,"max_star":10,"quality":30,"is_rare":false,"hero_position":[10250],"is_puppet":false}`|
|1010201|`{"is_guards":false,"lucky_value":120,"talent":1,"star":0,"max_star":10,"quality":30,"is_rare":false,"hero_position":[10233,10230],"is_puppet":false}`|
|1020101|`{"is_guards":false,"lucky_value":200,"talent":2,"star":0,"max_star":10,"quality":40,"is_rare":false,"hero_position":[10100,10214],"is_puppet":false}`|

## AttrPlayWeaken

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|136|`{}`|
|137|`{}`|
|138|`{}`|
|139|`{}`|
|140|`{}`|
|141|`{}`|
|142|`{}`|
|143|`{}`|
|144|`{}`|
|145|`{}`|
|146|`{}`|
|147|`{}`|
|148|`{}`|
|149|`{}`|
|150|`{}`|
|151|`{}`|
|152|`{}`|
|153|`{}`|
|154|`{}`|
|155|`{}`|
|156|`{}`|
|157|`{}`|
|158|`{}`|
|159|`{}`|
|160|`{}`|
|161|`{}`|
|162|`{}`|
|163|`{}`|

## AttrType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tips_icon|string|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_dark_icon|string|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|detail_des|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dark_icon|string|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pvx|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|value_type|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|284|本表行键；与其他表同值不自动代表同一对象。|
|strength_attr_icon|string|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_rang|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_attr|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_type|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_icon|string|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_icon|string|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|align_des|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exchange|array|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_show|boolean|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_factor|number|284|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"bg_small_shengmingbai.png","fight_attr":24,"show_type":0,"attr_icon":"img_ty_icon_shengming.png","exchange":[],"is_show":true}`|
|2|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":2,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[],"is_show":true}`|
|5|`{"attr_dark_icon":"bg_small_shengmingcheng.png","value_type":1,"strength_attr_icon":"bg_small_shengmingbai.png","fight_attr":25,"show_type":1,"attr_icon":"bg_small_shengmingcheng.png","exchange":[],"is_show":false}`|
|6|`{"attr_dark_icon":"bg_small_gongjicheng.png","value_type":1,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":3,"show_type":1,"attr_icon":"bg_small_gongjicheng.png","exchange":[],"is_show":false}`|
|9|`{"attr_dark_icon":"bg_small_gedang.png","value_type":1,"strength_attr_icon":"bg_small_hujiabai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_gedang.png","exchange":[],"is_show":true}`|
|10|`{"attr_dark_icon":"bg_small_chuantou.png","value_type":1,"strength_attr_icon":"bg_small_jingzhunbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_chuantou.png","exchange":[],"is_show":true}`|
|11|`{"attr_dark_icon":"bg_small_baoji.png","value_type":1,"strength_attr_icon":"bg_small_baojibai.png","fight_attr":29,"show_type":1,"attr_icon":"bg_small_baoji.png","exchange":[],"is_show":true}`|
|12|`{"attr_dark_icon":"bg_small_baoshangcheng.png","value_type":1,"strength_attr_icon":"bg_small_baoshangbai.png","fight_attr":30,"show_type":1,"attr_icon":"bg_small_baoshangcheng.png","exchange":[],"is_show":true}`|
|13|`{"attr_dark_icon":"bg_small_jiagongcheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":42,"show_type":1,"attr_icon":"bg_small_jiagongcheng.png","exchange":[],"is_show":true}`|
|14|`{"attr_dark_icon":"bg_small_gongjicheng.png","value_type":1,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_gongjicheng.png","exchange":[],"is_show":false}`|
|15|`{"attr_dark_icon":"bg_small_fangbaocheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":31,"show_type":1,"attr_icon":"bg_small_fangbaocheng.png","exchange":[],"is_show":false}`|
|16|`{"attr_dark_icon":"bg_small_jiagongcheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":32,"show_type":1,"attr_icon":"bg_small_jiagongcheng.png","exchange":[],"is_show":false}`|
|17|`{"attr_dark_icon":"bg_small_mingzhong.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":38,"show_type":1,"attr_icon":"bg_small_mingzhong.png","exchange":[],"is_show":false}`|
|18|`{"attr_dark_icon":"bg_small_duoshan.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":39,"show_type":1,"attr_icon":"bg_small_duoshan.png","exchange":[],"is_show":false}`|
|19|`{"attr_dark_icon":"bg_small_bisha.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_bisha.png","exchange":[],"is_show":false}`|
|20|`{"attr_dark_icon":"bg_small_jianren.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_jianren.png","exchange":[],"is_show":false}`|
|21|`{"attr_dark_icon":"bg_small_zhiliaotish.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":52,"show_type":1,"attr_icon":"bg_small_zhiliaotish.png","exchange":[],"is_show":false}`|
|22|`{"attr_dark_icon":"bg_small_shoushangtis.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":53,"show_type":1,"attr_icon":"bg_small_shoushangtis.png","exchange":[],"is_show":false}`|
|23|`{"attr_dark_icon":"bg_small_shanghaijiamm.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":47,"show_type":1,"attr_icon":"bg_small_shanghaijiamm.png","exchange":[],"is_show":false}`|
|24|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":8,"show_type":0,"attr_icon":"img_ty_icon_fangyu.png","exchange":[],"is_show":false}`|
|25|`{"attr_dark_icon":"bg_small_shanghaijiamm.png","value_type":0,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":13,"show_type":0,"attr_icon":"img_icon_sx_shanghaijianmian.png","exchange":[],"is_show":false}`|
|26|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":9,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|27|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":14,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|28|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":93,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|29|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":94,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|30|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":95,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|31|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":97,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|32|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":98,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|33|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":78,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|34|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":79,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|35|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_jianrenss.png","fight_attr":70,"show_type":1,"attr_icon":"img_ty_icon_fangyu.png","exchange":[],"is_show":false}`|
|36|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_jianrenss.png","fight_attr":71,"show_type":1,"attr_icon":"img_ty_icon_fangyu.png","exchange":[],"is_show":false}`|
|37|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_jianrenss.png","fight_attr":72,"show_type":1,"attr_icon":"img_ty_icon_fangyu.png","exchange":[],"is_show":false}`|
|38|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_jianrenss.png","fight_attr":73,"show_type":1,"attr_icon":"img_ty_icon_fangyu.png","exchange":[],"is_show":false}`|
|39|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_gongjiss.png","fight_attr":74,"show_type":1,"attr_icon":"img_ty_icon_gongji.png","exchange":[],"is_show":false}`|
|40|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_gongjiss.png","fight_attr":75,"show_type":1,"attr_icon":"img_ty_icon_gongji.png","exchange":[],"is_show":false}`|
|41|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_gongjiss.png","fight_attr":76,"show_type":1,"attr_icon":"img_ty_icon_gongji.png","exchange":[],"is_show":false}`|
|42|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"icon_shenzhuang_gongjiss.png","fight_attr":77,"show_type":1,"attr_icon":"img_ty_icon_gongji.png","exchange":[],"is_show":false}`|
|43|`{"attr_dark_icon":"img_ty_icon_jiashuxing2.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"img_ty_icon_jiashuxing.png","exchange":[5,6,26,27],"is_show":false}`|
|44|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24,25],"is_show":false}`|
|45|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":18,"show_type":1,"attr_icon":"","exchange":[26,27],"is_show":false}`|
|46|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13,23],"is_show":false}`|
|47|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":67,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|48|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":40,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|49|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":41,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|50|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":36,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|51|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":37,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|52|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":33,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|53|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":32,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|54|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":43,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|55|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":48,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|56|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":80,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|57|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":20,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|58|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":21,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|59|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":83,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|60|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":84,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|61|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":85,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|62|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":86,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|63|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":89,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|64|`{"attr_dark_icon":"bg_small_gongjicheng.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"bg_small_gongjicheng.png","exchange":[2],"is_show":true}`|
|65|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":44,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|66|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":45,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|67|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":49,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|68|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":50,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|69|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[2],"is_show":true}`|
|70|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":1,"attr_icon":"img_ty_icon_gongji.png","exchange":[6],"is_show":true}`|
|71|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":102,"show_type":1,"attr_icon":"","exchange":[21],"is_show":false}`|
|72|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[35,36,37,38],"is_show":false}`|
|73|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[39,40,41,42],"is_show":false}`|
|74|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":91,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|75|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":92,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|76|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":17,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|77|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[2],"is_show":true}`|
|78|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":1,"attr_icon":"img_ty_icon_gongji.png","exchange":[6],"is_show":true}`|
|79|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":103,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|80|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":104,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|81|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":105,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|82|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":107,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|83|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":108,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|84|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":110,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|85|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":111,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|86|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[84],"is_show":false}`|
|87|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[85],"is_show":false}`|
|88|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":112,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|89|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|90|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|91|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[2],"is_show":true}`|
|92|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":1,"attr_icon":"img_ty_icon_gongji.png","exchange":[6],"is_show":true}`|
|93|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":116,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|94|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":117,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|95|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":118,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|96|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":119,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|97|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":120,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|98|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|99|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":122,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|100|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|101|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|102|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|103|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|104|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|105|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|106|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|107|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|108|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|121|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":124,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|122|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":125,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|123|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":126,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|124|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":127,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|131|`{"attr_dark_icon":"bg_small_jiagongcheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":130,"show_type":1,"attr_icon":"bg_small_jiagongcheng.png","exchange":[],"is_show":false}`|
|132|`{"attr_dark_icon":"bg_small_shanghaijiamm.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":131,"show_type":1,"attr_icon":"bg_small_shanghaijiamm.png","exchange":[],"is_show":false}`|
|133|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":133,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|134|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":91,"show_type":1,"attr_icon":"","exchange":[74],"is_show":false}`|
|135|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":92,"show_type":1,"attr_icon":"","exchange":[75],"is_show":false}`|
|136|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|137|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|138|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|139|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|140|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|141|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|142|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|143|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|144|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|145|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|146|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|147|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|148|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|149|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|150|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|151|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|152|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|153|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|154|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|155|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|156|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|157|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|158|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|159|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|160|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|161|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|162|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|163|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|169|`{"attr_dark_icon":"bg_small_mingzhong.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":88,"show_type":1,"attr_icon":"bg_small_mingzhong.png","exchange":[],"is_show":false}`|
|170|`{"attr_dark_icon":"bg_small_mingzhong.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":87,"show_type":1,"attr_icon":"bg_small_mingzhong.png","exchange":[],"is_show":false}`|
|171|`{"attr_dark_icon":"bg_small_jianren.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":81,"show_type":1,"attr_icon":"bg_small_jianren.png","exchange":[],"is_show":false}`|
|172|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":143,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|173|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":144,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|174|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":145,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|175|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":146,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|176|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":147,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|177|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":148,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|178|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":156,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|179|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":157,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|180|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":158,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|181|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":159,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|182|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":160,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|183|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":161,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|184|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":162,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|185|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":163,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|186|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":170,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|187|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":171,"show_type":1,"attr_icon":"","exchange":[],"is_show":false}`|
|188|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":191,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|189|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":190,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|201|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"bg_small_shengmingbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_shengming.png","exchange":[1],"is_show":false}`|
|202|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"img_ty_icon_gongji2.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji2.png","exchange":[2],"is_show":false}`|
|203|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24],"is_show":false}`|
|204|`{"attr_dark_icon":"img_icon_sx_shanghaijianmian.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[25],"is_show":false}`|
|205|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"img_icon_sx_shengming.png","exchange":[5],"is_show":false}`|
|206|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"img_icon_sx_gongji.png","exchange":[6],"is_show":false}`|
|207|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"img_ty_icon_fangyu.png","exchange":[26],"is_show":false}`|
|208|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"img_ty_icon_fangyu.png","exchange":[27],"is_show":false}`|
|209|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"img_icon_sx_fangyu.png","exchange":[24,25],"is_show":false}`|
|210|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"img_icon_sx_fangyu.png","exchange":[26,27],"is_show":false}`|
|211|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[5,6,26,27],"is_show":false}`|
|212|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13],"is_show":false}`|
|213|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[23],"is_show":false}`|
|214|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[11],"is_show":false}`|
|215|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[15],"is_show":false}`|
|216|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[17],"is_show":false}`|
|217|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[18],"is_show":false}`|
|218|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[21],"is_show":false}`|
|219|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[22],"is_show":false}`|
|220|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[60],"is_show":false}`|
|221|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[59],"is_show":false}`|
|222|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[57],"is_show":false}`|
|223|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[58],"is_show":false}`|
|224|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[34],"is_show":false}`|
|225|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[33],"is_show":false}`|
|226|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[66],"is_show":false}`|
|227|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[68],"is_show":false}`|
|228|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[74],"is_show":false}`|
|229|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[75],"is_show":false}`|
|230|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[65],"is_show":false}`|
|301|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[1],"is_show":false}`|
|302|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[2],"is_show":false}`|
|303|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24,25],"is_show":false}`|
|304|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[6],"is_show":false}`|
|305|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13],"is_show":false}`|
|306|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[23],"is_show":false}`|
|307|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[11],"is_show":false}`|
|308|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[15],"is_show":false}`|
|309|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[66],"is_show":false}`|
|310|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[68],"is_show":false}`|
|311|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24],"is_show":false}`|
|312|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[25],"is_show":false}`|
|313|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[60],"is_show":false}`|
|314|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[59],"is_show":false}`|
|315|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[84],"is_show":false}`|
|316|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[85],"is_show":false}`|
|317|`{"attr_dark_icon":"bg_small_baoshangcheng.png","value_type":1,"strength_attr_icon":"bg_small_baoshangbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_baoshangcheng.png","exchange":[12],"is_show":true}`|
|318|`{"attr_dark_icon":"bg_small_jiagongcheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_jiagongcheng.png","exchange":[16],"is_show":false}`|
|401|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[1],"is_show":false}`|
|402|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[2],"is_show":false}`|
|403|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24,25],"is_show":false}`|
|404|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[5],"is_show":false}`|
|405|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[23],"is_show":false}`|
|406|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13],"is_show":false}`|
|407|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[11],"is_show":false}`|
|408|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[15],"is_show":false}`|
|409|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[66],"is_show":false}`|
|410|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[68],"is_show":false}`|
|411|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24],"is_show":false}`|
|412|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[25],"is_show":false}`|
|413|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[60],"is_show":false}`|
|414|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[59],"is_show":false}`|
|415|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[84],"is_show":false}`|
|416|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[85],"is_show":false}`|
|417|`{"attr_dark_icon":"bg_small_baoshangcheng.png","value_type":1,"strength_attr_icon":"bg_small_baoshangbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_baoshangcheng.png","exchange":[12],"is_show":true}`|
|418|`{"attr_dark_icon":"bg_small_jiagongcheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_jiagongcheng.png","exchange":[16],"is_show":false}`|
|501|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"bg_small_shengmingbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_shengming.png","exchange":[1],"is_show":false}`|
|502|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[2],"is_show":false}`|
|503|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_fangyu.png","exchange":[24,25],"is_show":false}`|
|504|`{"attr_dark_icon":"bg_small_mingzhong.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_mingzhong.png","exchange":[17],"is_show":false}`|
|505|`{"attr_dark_icon":"bg_small_jiagongcheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_jiagongcheng.png","exchange":[13],"is_show":false}`|
|506|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"bg_small_shengmingbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_shengming.png","exchange":[1],"is_show":false}`|
|507|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[2],"is_show":false}`|
|508|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_fangyu.png","exchange":[24,25],"is_show":false}`|
|509|`{"attr_dark_icon":"bg_small_fangbaocheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_fangbaocheng.png","exchange":[15],"is_show":false}`|
|510|`{"attr_dark_icon":"bg_small_shanghaijiamm.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_shanghaijiamm.png","exchange":[23],"is_show":false}`|
|511|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"bg_small_shengmingbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_shengming.png","exchange":[1],"is_show":false}`|
|512|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[2],"is_show":false}`|
|513|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_fangyu.png","exchange":[24,25],"is_show":false}`|
|514|`{"attr_dark_icon":"bg_small_duoshan.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_duoshan.png","exchange":[18],"is_show":false}`|
|515|`{"attr_dark_icon":"bg_small_jiagongcheng.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_jiagongcheng.png","exchange":[23],"is_show":false}`|
|516|`{"attr_dark_icon":"img_ty_icon_shengming2.png","value_type":0,"strength_attr_icon":"bg_small_shengmingbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_shengming.png","exchange":[1],"is_show":false}`|
|517|`{"attr_dark_icon":"img_ty_icon_gongji2.png","value_type":0,"strength_attr_icon":"bg_small_gongjibai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_gongji.png","exchange":[2],"is_show":false}`|
|518|`{"attr_dark_icon":"img_ty_icon_fangyu2.png","value_type":0,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":0,"attr_icon":"img_ty_icon_fangyu.png","exchange":[24,25],"is_show":false}`|
|519|`{"attr_dark_icon":"bg_small_baoji.png","value_type":1,"strength_attr_icon":"bg_small_baojibai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_baoji.png","exchange":[11],"is_show":false}`|
|520|`{"attr_dark_icon":"bg_small_shanghaijiamm.png","value_type":1,"strength_attr_icon":"bg_small_jiagongbai.png","fight_attr":0,"show_type":1,"attr_icon":"bg_small_shanghaijiamm.png","exchange":[13],"is_show":false}`|
|601|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[1],"is_show":false}`|
|602|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[2],"is_show":false}`|
|603|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24,25],"is_show":false}`|
|604|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[5],"is_show":false}`|
|605|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[6],"is_show":false}`|
|606|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[26,27],"is_show":false}`|
|607|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13],"is_show":false}`|
|608|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[23],"is_show":false}`|
|609|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[1],"is_show":false}`|
|610|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[2],"is_show":false}`|
|611|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24,25],"is_show":false}`|
|612|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[5],"is_show":false}`|
|613|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[6],"is_show":false}`|
|614|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[26,27],"is_show":false}`|
|615|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13],"is_show":false}`|
|616|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[23],"is_show":false}`|
|617|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[1],"is_show":false}`|
|618|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[2],"is_show":false}`|
|619|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24,25],"is_show":false}`|
|620|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[5],"is_show":false}`|
|621|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[6],"is_show":false}`|
|622|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[26,27],"is_show":false}`|
|623|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13],"is_show":false}`|
|624|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[23],"is_show":false}`|
|625|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[1],"is_show":false}`|
|626|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[2],"is_show":false}`|
|627|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":0,"show_type":0,"attr_icon":"","exchange":[24,25],"is_show":false}`|
|628|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[5],"is_show":false}`|
|629|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[6],"is_show":false}`|
|630|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[26,27],"is_show":false}`|
|631|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[13],"is_show":false}`|
|632|`{"attr_dark_icon":"","value_type":1,"strength_attr_icon":"","fight_attr":0,"show_type":1,"attr_icon":"","exchange":[23],"is_show":false}`|
|701|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":149,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|702|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":150,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|703|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":151,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|
|704|`{"attr_dark_icon":"","value_type":0,"strength_attr_icon":"","fight_attr":152,"show_type":0,"attr_icon":"","exchange":[],"is_show":false}`|

## AttrTransform

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|value_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|86|`{"value_type":1}`|
|87|`{"value_type":1}`|
|315|`{"value_type":1}`|
|316|`{"value_type":1}`|
|415|`{"value_type":1}`|
|416|`{"value_type":1}`|

## Puppet

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|role_show_loc|undefined|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc_offset|array|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc_rotate|array|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_show_loc|undefined|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|104|本表行键；与其他表同值不自动代表同一对象。|
|ui_show_scale|undefined|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_dark_offset|number|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_scale|number|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attack_range|number|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|string|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_show_rotation|undefined|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_show_scale|undefined|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_show_rotation|undefined|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_in_anim|array|104|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":0.9,"attack_range":0}`|
|2|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|3|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|4|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|5|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|6|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|7|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|8|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|9|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":0.7,"attack_range":0}`|
|10|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|11|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|12|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|13|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|14|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|15|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|16|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|17|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|18|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|19|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|20|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|21|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|23|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|24|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|25|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|26|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|27|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|28|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|29|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|30|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|31|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|32|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|33|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|34|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|35|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|36|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|37|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|38|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|39|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|40|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|41|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|42|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|43|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|44|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|45|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|46|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|47|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|48|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|49|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|50|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|51|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|52|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|53|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|54|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|55|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|56|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|57|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|58|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|59|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|60|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|61|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|62|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|63|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|64|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|65|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|66|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|67|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|68|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|69|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|70|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|71|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|72|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|73|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|74|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|75|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|76|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|77|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|78|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|79|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|80|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|81|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|82|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|83|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|84|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|85|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|86|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|87|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|88|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|89|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|90|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|91|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|92|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|93|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|94|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|95|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|96|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|97|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|98|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|99|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|100|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|101|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|102|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|103|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|104|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|
|105|`{"loc_offset":[null,null,null,null,null],"loc_rotate":[null,null,null,null,null],"fight_dark_offset":0,"fight_scale":1,"attack_range":0}`|

## Diff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|diff_item|number|68|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|68|本表行键；与其他表同值不自动代表同一对象。|
|skill|number|68|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attrs|array|68|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|diff_num|number|68|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_desc|array|68|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|diff_name|number|68|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"diff_item":533002,"skill":6910001014,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000141,3000000142,3000000143]}`|
|1010201|`{"diff_item":534002,"skill":6910001015,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000151,3000000152,3000000153]}`|
|1020101|`{"diff_item":528002,"skill":6910001009,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000091,3000000092,3000000093]}`|
|1020201|`{"diff_item":529002,"skill":6910001010,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000101,3000000102,3000000103]}`|
|1020301|`{"diff_item":530002,"skill":6910001011,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000111,3000000112,3000000113]}`|
|1020401|`{"diff_item":531002,"skill":6910001012,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000121,3000000122,3000000123]}`|
|1020501|`{"diff_item":532002,"skill":6910001013,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000131,3000000132,3000000133]}`|
|1030101|`{"diff_item":521002,"skill":6910001003,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000031,3000000032,3000000033]}`|
|1030201|`{"diff_item":522002,"skill":6910001004,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000041,3000000042,3000000043]}`|
|1030301|`{"diff_item":523002,"skill":6910001005,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000051,3000000052,3000000053]}`|
|1030401|`{"diff_item":525002,"skill":6910001006,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000061,3000000062,3000000063]}`|
|1030501|`{"diff_item":526002,"skill":6910001007,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000071,3000000072,3000000073]}`|
|1030601|`{"diff_item":527002,"skill":6910001008,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000081,3000000082,3000000083]}`|
|1030701|`{"diff_item":595002,"skill":6910001059,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000591,3000000592,3000000593]}`|
|1040101|`{"diff_item":519002,"skill":6910001001,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000011,3000000012,3000000013]}`|
|1040201|`{"diff_item":2001302,"skill":6910001063,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000631,3000000632,3000000633]}`|
|1040301|`{"diff_item":2001702,"skill":6910001067,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000671,3000000672,3000000673]}`|
|2010101|`{"diff_item":546002,"skill":6910001027,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000271,3000000272,3000000273]}`|
|2010201|`{"diff_item":547002,"skill":6910001028,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000281,3000000282,3000000283]}`|
|2020101|`{"diff_item":541002,"skill":6910001022,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000221,3000000222,3000000223]}`|
|2020201|`{"diff_item":542002,"skill":6910001023,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000231,3000000232,3000000233]}`|
|2020301|`{"diff_item":543002,"skill":6910001024,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000241,3000000242,3000000243]}`|
|2020401|`{"diff_item":544002,"skill":6910001025,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000251,3000000252,3000000253]}`|
|2020501|`{"diff_item":545002,"skill":6910001026,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000261,3000000262,3000000263]}`|
|2030101|`{"diff_item":535002,"skill":6910001016,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000161,3000000162,3000000163]}`|
|2030201|`{"diff_item":536002,"skill":6910001017,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000171,3000000172,3000000173]}`|
|2030301|`{"diff_item":537002,"skill":6910001018,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000181,3000000182,3000000183]}`|
|2030401|`{"diff_item":538002,"skill":6910001019,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000191,3000000192,3000000193]}`|
|2030501|`{"diff_item":539002,"skill":6910001020,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000201,3000000202,3000000203]}`|
|2030601|`{"diff_item":540002,"skill":6910001021,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000211,3000000212,3000000213]}`|
|2030701|`{"diff_item":2001102,"skill":6910001061,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000611,3000000612,3000000613]}`|
|2040101|`{"diff_item":2001202,"skill":6910001062,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000621,3000000622,3000000623]}`|
|2040201|`{"diff_item":2001802,"skill":6910001100,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000991,3000000992,3000000993]}`|
|3010101|`{"diff_item":559002,"skill":6910001040,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000401,3000000402,3000000403]}`|
|3010201|`{"diff_item":560002,"skill":6910001041,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000411,3000000412,3000000413]}`|
|3010301|`{"diff_item":561002,"skill":6910001042,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000421,3000000422,3000000423]}`|
|3020101|`{"diff_item":554002,"skill":6910001035,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000351,3000000352,3000000353]}`|
|3020201|`{"diff_item":555002,"skill":6910001036,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000361,3000000362,3000000363]}`|
|3020301|`{"diff_item":556002,"skill":6910001037,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000371,3000000372,3000000373]}`|
|3020401|`{"diff_item":557002,"skill":6910001038,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000381,3000000382,3000000383]}`|
|3020501|`{"diff_item":558002,"skill":6910001039,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000391,3000000392,3000000393]}`|
|3030201|`{"diff_item":548002,"skill":6910001029,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000291,3000000292,3000000293]}`|
|3030301|`{"diff_item":549002,"skill":6910001030,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000301,3000000302,3000000303]}`|
|3030401|`{"diff_item":550002,"skill":6910001031,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000311,3000000312,3000000313]}`|
|3030501|`{"diff_item":551002,"skill":6910001032,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000321,3000000322,3000000323]}`|
|3030601|`{"diff_item":552002,"skill":6910001033,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000331,3000000332,3000000333]}`|
|3030701|`{"diff_item":553002,"skill":6910001034,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000341,3000000342,3000000343]}`|
|3040101|`{"diff_item":2001002,"skill":6910001060,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000601,3000000602,3000000603]}`|
|3040201|`{"diff_item":2001402,"skill":6910001064,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000641,3000000642,3000000643]}`|
|4010101|`{"diff_item":575002,"skill":6910001056,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000561,3000000562,3000000563]}`|
|4010201|`{"diff_item":576002,"skill":6910001057,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000571,3000000572,3000000573]}`|
|4010301|`{"diff_item":577002,"skill":6910001058,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000581,3000000582,3000000583]}`|
|4020101|`{"diff_item":570002,"skill":6910001051,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000511,3000000512,3000000513]}`|
|4020201|`{"diff_item":571002,"skill":6910001052,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000521,3000000522,3000000523]}`|
|4020301|`{"diff_item":572002,"skill":6910001053,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000531,3000000532,3000000533]}`|
|4020401|`{"diff_item":573002,"skill":6910001054,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000541,3000000542,3000000543]}`|
|4020501|`{"diff_item":574002,"skill":6910001055,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000551,3000000552,3000000553]}`|
|4030101|`{"diff_item":562002,"skill":6910001043,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000431,3000000432,3000000433]}`|
|4030201|`{"diff_item":563002,"skill":6910001044,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000441,3000000442,3000000443]}`|
|4030301|`{"diff_item":564002,"skill":6910001045,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000451,3000000452,3000000453]}`|
|4030401|`{"diff_item":565002,"skill":6910001046,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000461,3000000462,3000000463]}`|
|4030501|`{"diff_item":566002,"skill":6910001047,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000471,3000000472,3000000473]}`|
|4030601|`{"diff_item":567002,"skill":6910001048,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000481,3000000482,3000000483]}`|
|4030801|`{"diff_item":569002,"skill":6910001050,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000501,3000000502,3000000503]}`|
|4040101|`{"diff_item":520002,"skill":6910001002,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000021,3000000022,3000000023]}`|
|4040201|`{"diff_item":568002,"skill":6910001049,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000491,3000000492,3000000493]}`|
|4040301|`{"diff_item":2001502,"skill":6910001065,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000651,3000000652,3000000653]}`|
|4040401|`{"diff_item":2001602,"skill":6910001065,"attrs":[[5,200],[6,200],[26,200],[27,200]],"diff_num":10,"skill_desc":[3000000651,3000000652,3000000653]}`|

## LegendStrategy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|type_icon|string|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|team_icon|string|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_icon|array|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cur_hero|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|49|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_str|array|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_name|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_bg|array|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fetter_hero|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040101,"hero":[[1040101,true],[1030101,false],[1030501,false],[1030401,false],[3030501,false],[4030101,false]],"fetter_hero":1020101}`|
|2|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040101,"hero":[[1040101,true],[2030201,false],[2030301,false],[2030401,false],[3030501,false],[2030101,false]],"fetter_hero":2020201}`|
|3|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040101,"hero":[[1040101,true],[3030601,false],[3030201,false],[3030301,false],[3030401,false],[3030501,false]],"fetter_hero":1020101}`|
|4|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040101,"hero":[[1040101,true],[4030501,false],[4030401,false],[4030201,false],[4030101,false],[3030501,false]],"fetter_hero":2020201}`|
|5|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040101,"hero":[[1040101,true],[4030801,false],[3030501,false],[2020601,false],[1020601,false],[2010201,false]],"fetter_hero":2020201}`|
|6|`{"type_icon":"img_sp_dashenzhengrong.png","cur_hero":4040101,"hero":[[4040101,true],[2030201,false],[2030301,false],[2030401,false],[3030501,false],[2030101,false]],"fetter_hero":2020301}`|
|7|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040101,"hero":[[4040101,true],[2030201,false],[2030301,false],[3030501,false],[2030501,false],[2020401,false]],"fetter_hero":2020301}`|
|8|`{"type_icon":"img_sp_dashenzhengrong.png","cur_hero":4040101,"hero":[[4040101,true],[4030501,false],[4030401,false],[4030201,false],[4030101,false],[3030501,false]],"fetter_hero":4020401}`|
|9|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040101,"hero":[[4040101,true],[4030501,false],[4030401,false],[3030501,false],[2030501,false],[4020101,false]],"fetter_hero":4020401}`|
|10|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040201,"hero":[[4040201,true],[1040101,false],[1030101,false],[1030601,false],[1030401,false],[3030501,false]],"fetter_hero":3020501}`|
|11|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040201,"hero":[[4040201,true],[1040101,false],[2030201,false],[2030301,false],[3030501,false],[4030601,false]],"fetter_hero":3020501}`|
|12|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040201,"hero":[[4040201,true],[1040101,false],[3030301,false],[3030601,false],[3030201,false],[3030501,false]],"fetter_hero":4020501}`|
|13|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040201,"hero":[[4040201,true],[1040101,false],[4030501,false],[4030401,false],[4030601,false],[3030501,false]],"fetter_hero":3020501}`|
|14|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040101,"hero":[[3040101,true],[1040101,false],[1030101,false],[1030601,false],[2030601,false],[3030501,false]],"fetter_hero":1020401}`|
|15|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040101,"hero":[[3040101,true],[1040101,false],[2030201,false],[2030301,false],[2030601,false],[4030601,false]],"fetter_hero":1020401}`|
|16|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040101,"hero":[[3040101,true],[1040101,false],[3030301,false],[3030601,false],[3030701,false],[3030501,false]],"fetter_hero":3020201}`|
|17|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040101,"hero":[[3040101,true],[1040101,false],[4030501,false],[4030401,false],[4030601,false],[2030601,false]],"fetter_hero":1020401}`|
|18|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040101,"hero":[[2040101,true],[1030401,false],[1030101,false],[1030601,false],[2030601,false],[3030501,false]],"fetter_hero":2030101}`|
|19|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040101,"hero":[[2040101,true],[2030401,false],[2030201,false],[2030301,false],[2030601,false],[4030601,false]],"fetter_hero":2030101}`|
|20|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040101,"hero":[[2040101,true],[3030201,false],[3030301,false],[3030601,false],[3030701,false],[3030501,false]],"fetter_hero":2030501}`|
|21|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040101,"hero":[[2040101,true],[4030101,false],[4030501,false],[4030401,false],[4030601,false],[2030601,false]],"fetter_hero":2030501}`|
|22|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040201,"hero":[[1040201,true],[1030401,false],[1030101,false],[1030601,false],[2030601,false],[3030501,false]],"fetter_hero":1030301}`|
|23|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040201,"hero":[[1040201,true],[2030401,false],[2030201,false],[2030301,false],[2030601,false],[4030601,false]],"fetter_hero":1030201}`|
|24|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040201,"hero":[[1040201,true],[3030201,false],[3030301,false],[3030601,false],[3030701,false],[3030501,false]],"fetter_hero":1030301}`|
|25|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040201,"hero":[[1040201,true],[4030101,false],[4030501,false],[4030401,false],[4030601,false],[2030601,false]],"fetter_hero":1030201}`|
|26|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040201,"hero":[[3040201,true],[1040101,false],[1030101,false],[1030601,false],[2030601,false],[3030501,false]],"fetter_hero":1020401}`|
|27|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040201,"hero":[[3040201,true],[1040101,false],[2030201,false],[2030301,false],[2030601,false],[4030601,false]],"fetter_hero":1020401}`|
|28|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040201,"hero":[[3040201,true],[1040101,false],[3030301,false],[3030601,false],[3030701,false],[3030501,false]],"fetter_hero":3020201}`|
|29|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":3040201,"hero":[[3040201,true],[1040101,false],[4030501,false],[4030401,false],[4030601,false],[2030601,false]],"fetter_hero":1020401}`|
|30|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040301,"hero":[[4040301,true],[3040101,false],[4030501,false],[4030401,false],[1030601,false],[1030101,false]],"fetter_hero":4030301}`|
|31|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040301,"hero":[[4040301,true],[3040101,false],[4030501,false],[4030401,false],[2030301,false],[2030201,false]],"fetter_hero":4030301}`|
|32|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040301,"hero":[[4040301,true],[3040101,false],[4030501,false],[4030401,false],[3030701,false],[4030601,false]],"fetter_hero":4030201}`|
|33|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":4040301,"hero":[[4040301,true],[4040201,false],[4030501,false],[4030401,false],[4030101,false],[4030601,false]],"fetter_hero":4030201}`|
|34|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040301,"hero":[[1040301,true],[1040201,false],[1030101,false],[1030601,false],[2030601,false],[3030501,false]],"fetter_hero":1020501}`|
|35|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040301,"hero":[[1040301,true],[2040101,false],[2030201,false],[2030301,false],[2030601,false],[4030601,false]],"fetter_hero":1020201}`|
|36|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040301,"hero":[[1040301,true],[3040201,false],[3030301,false],[3030601,false],[3030701,false],[3030501,false]],"fetter_hero":1020201}`|
|37|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":1040301,"hero":[[1040301,true],[4040301,false],[4030501,false],[4030401,false],[4030601,false],[2030601,false]],"fetter_hero":1020501}`|
|38|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040101,"hero":[[5040101,true],[1040301,false],[1040201,false],[1030601,false],[1030101,false],[3030501,false]],"fetter_hero":2020401}`|
|39|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040101,"hero":[[5040101,true],[2040101,false],[3040101,false],[2030201,false],[2030301,false],[2030601,false]],"fetter_hero":2020401}`|
|40|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040101,"hero":[[5040101,true],[3040201,false],[3040101,false],[3030601,false],[3030701,false],[3030501,false]],"fetter_hero":2020401}`|
|41|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040101,"hero":[[5040101,true],[4040301,false],[3040101,false],[4030501,false],[4030401,false],[4030601,false]],"fetter_hero":2020401}`|
|42|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040201,"hero":[[5040201,true],[5040101,false],[1040301,false],[1040201,false],[1030601,false],[1030101,false]],"fetter_hero":4020201}`|
|43|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040201,"hero":[[5040201,true],[5040101,false],[2040101,false],[2030201,false],[2030301,false],[2030601,false]],"fetter_hero":4020201}`|
|44|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040201,"hero":[[5040201,true],[5040101,false],[3040201,false],[3030601,false],[3030701,false],[3030501,false]],"fetter_hero":4020201}`|
|45|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":5040201,"hero":[[5040201,true],[5040101,false],[4040301,false],[4030501,false],[4030401,false],[4030601,false]],"fetter_hero":4020201}`|
|900|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040201,"hero":[[2040201,true],[1030101,false],[1030501,false],[1030401,false],[3030501,false],[4030101,false]],"fetter_hero":1020101}`|
|901|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040201,"hero":[[2040201,true],[2030201,false],[2030301,false],[2030401,false],[3030501,false],[2030101,false]],"fetter_hero":2020201}`|
|902|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040201,"hero":[[2040201,true],[3030601,false],[3030201,false],[3030301,false],[3030401,false],[3030501,false]],"fetter_hero":1020101}`|
|903|`{"type_icon":"img_sp_dashenzhengrongremen.png","cur_hero":2040201,"hero":[[2040201,true],[4030501,false],[4030401,false],[4030201,false],[4030101,false],[3030501,false]],"fetter_hero":2020201}`|

## StrategyWebLineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|address|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## StrategyConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|default_lineup|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_show_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"recommend_show_time":5}`|

## Strategy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|relation_rank|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"relation_rank":31}`|
|2|`{"relation_rank":2}`|
|3|`{"relation_rank":1}`|

## StrategyLineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|dec|number|62|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|popularity|number|62|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|62|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|62|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|62|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_common|boolean|62|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":[[3030501,true],[2030501,true],[1020601,false],[2020601,false],[4010301,false],[3010201,false]],"is_common":false}`|
|2|`{"hero":[[3030501,true],[2030501,true],[1020601,false],[2020601,false],[3020101,false],[1010201,false]],"is_common":false}`|
|3|`{"hero":[[2030201,true],[2030301,true],[3030501,true],[1020601,false],[2020601,false],[2020401,false]],"is_common":false}`|
|4|`{"hero":[[4030501,true],[4030401,true],[3030501,true],[1020601,false],[2020601,false],[4020101,false]],"is_common":false}`|
|5|`{"hero":[[1030101,true],[1030501,true],[3030501,true],[1020601,false],[2020601,false],[1020401,false]],"is_common":false}`|
|6|`{"hero":[[3030601,true],[3030201,true],[3030501,true],[1020601,false],[2020601,false],[3020101,false]],"is_common":false}`|
|7|`{"hero":[[2030201,true],[2030301,true],[3030501,true],[2030401,false],[2030501,false],[2030101,false]],"is_common":false}`|
|8|`{"hero":[[1030101,true],[1030501,true],[3030501,true],[1030401,false],[4030101,false],[4030201,false]],"is_common":false}`|
|9|`{"hero":[[4030501,true],[4030401,true],[3030501,true],[4030101,false],[4030201,false],[1030401,false]],"is_common":false}`|
|10|`{"hero":[[3030601,true],[3030301,true],[3030501,true],[3030401,false],[3030201,false],[1030501,false]],"is_common":false}`|
|11|`{"hero":[[3030501,true],[2020601,true],[1020201,false],[3020501,false],[1010101,false],[1010201,false]],"is_common":false}`|
|12|`{"hero":[[1030501,true],[4030101,true],[1020401,false],[1020501,false],[1020201,false],[4010201,false]],"is_common":false}`|
|13|`{"hero":[[4030101,true],[4030201,true],[2030101,true],[1020101,false],[3020201,false],[4010301,false]],"is_common":false}`|
|14|`{"hero":[[1030101,true],[1030501,true],[1020101,false],[1020301,false],[1020201,false],[1020501,false]],"is_common":false}`|
|15|`{"hero":[[2030201,true],[2030301,true],[2020301,false],[2020501,false],[2010201,false],[2010101,false]],"is_common":false}`|
|16|`{"hero":[[4030501,true],[4030401,true],[3030501,false],[4030101,false],[4030201,false],[2030101,false]],"is_common":false}`|
|17|`{"hero":[[3030601,true],[3030401,true],[3020301,false],[3020201,false],[3020401,false],[3020501,false]],"is_common":false}`|
|18|`{"hero":[[1030301,true],[2030201,true],[1030201,false],[2030301,false],[4030101,false],[4030201,false]],"is_common":false}`|
|19|`{"hero":[[3030601,true],[3030301,true],[3030501,true],[3030401,false],[3030201,false],[4030301,false]],"is_common":false}`|
|20|`{"hero":[[1030101,true],[1030501,true],[3030501,true],[1020601,false],[2020601,false],[1020401,false]],"is_common":false}`|
|21|`{"hero":[[2030201,true],[2030301,true],[3030501,true],[1020601,false],[2020601,false],[2020401,false]],"is_common":false}`|
|22|`{"hero":[[4030501,true],[4030401,true],[3030501,true],[1020601,false],[2020601,false],[4020101,false]],"is_common":false}`|
|23|`{"hero":[[3030601,true],[3030201,true],[3030501,true],[1020601,false],[2020601,false],[3020101,false]],"is_common":false}`|
|24|`{"hero":[[3030501,true],[2020601,true],[1020601,false],[1020101,false],[2020201,false],[3010301,false]],"is_common":false}`|
|25|`{"hero":[[3030501,true],[4030801,true],[2020601,true],[1020601,false],[2020501,false],[2020301,false]],"is_common":false}`|
|26|`{"hero":[[3030501,true],[2020601,true],[1020601,false],[1020101,false],[3020501,false],[3020401,false]],"is_common":false}`|
|27|`{"hero":[[3030501,true],[2020601,true],[1020601,false],[1020101,false],[3010101,false],[2020101,false]],"is_common":false}`|
|28|`{"hero":[[4030801,true],[3030501,true],[2020601,true],[1020601,false],[3020201,false],[3020301,false]],"is_common":false}`|
|29|`{"hero":[[4030801,true],[3030501,true],[2020601,true],[1020601,false],[4020301,false],[4020201,false]],"is_common":false}`|
|30|`{"hero":[[4030801,true],[3030501,true],[2020601,true],[1020601,false],[4020501,false],[4020401,false]],"is_common":false}`|
|31|`{"hero":[[4030801,true],[3030501,true],[2020601,true],[1020601,false],[4010101,false],[4010201,false]],"is_common":false}`|
|32|`{"hero":[[1040101,true],[4030601,true],[4030501,true],[4030401,false],[3030501,false],[1030401,false]],"is_common":false}`|
|33|`{"hero":[[3030601,true],[3030401,true],[3030301,true],[4030601,true],[3030201,false],[1030501,false]],"is_common":false}`|
|34|`{"hero":[[2030201,true],[2030301,true],[4040201,true],[2030401,true],[3030501,false],[2030501,false]],"is_common":false}`|
|35|`{"hero":[[4030501,true],[4030401,true],[4040201,true],[4030101,false],[4030201,false],[4020101,false]],"is_common":false}`|
|36|`{"hero":[[4040101,true],[2030201,false],[2030301,false],[2030401,false],[3030501,false],[2030101,false]],"is_common":false}`|
|37|`{"hero":[[1040101,true],[1030101,false],[1030501,false],[3030501,false],[1030401,false],[4030101,false]],"is_common":false}`|
|38|`{"hero":[[4040101,true],[4030501,false],[4030401,false],[4030101,false],[4030201,false],[2030101,false]],"is_common":false}`|
|39|`{"hero":[[1040101,true],[4030501,false],[4030401,false],[3030501,false],[4030201,false],[4030101,false]],"is_common":false}`|
|40|`{"hero":[[4030801,true],[3030501,true],[2020601,false],[1020601,false],[2010201,false],[2010101,false]],"is_common":false}`|
|41|`{"hero":[[1040101,true],[1030601,true],[1030101,false],[1030501,false],[3030501,false],[1030401,false]],"is_common":false}`|
|42|`{"hero":[[1040101,true],[3030701,true],[3030601,true],[1030601,false],[3030301,false],[3030501,false]],"is_common":false}`|
|43|`{"hero":[[1040101,true],[2030601,true],[3030701,true],[3030501,false],[1030601,false],[1030101,false]],"is_common":false}`|
|44|`{"hero":[[4040201,true],[1040101,true],[2030601,false],[3030701,false],[1030601,false],[3030501,false]],"is_common":false}`|
|45|`{"hero":[[1040101,true],[1030701,true],[1030101,false],[1030601,false],[3030701,false],[2030601,false]],"is_common":false}`|
|46|`{"hero":[[3040101,true],[3030701,true],[3030501,false],[3030601,false],[1040101,false],[2030601,false]],"is_common":false}`|
|47|`{"hero":[[2030701,true],[2030601,true],[1030701,false],[4030601,false],[2030301,false],[2030201,false]],"is_common":false}`|
|48|`{"hero":[[2040101,true],[2030601,true],[2030701,true],[2030401,false],[2030301,false],[2030201,false]],"is_common":false}`|
|49|`{"hero":[[1040201,true],[1030701,true],[1030101,false],[1030601,false],[1040101,false],[1030501,false]],"is_common":false}`|
|50|`{"hero":[[3040201,true],[3040101,true],[3030701,true],[3030401,false],[3030601,false],[3030201,false]],"is_common":false}`|
|51|`{"hero":[[4040301,true],[4040201,true],[4030501,true],[4030401,false],[4030101,false],[4030601,false]],"is_common":false}`|
|52|`{"hero":[[4040401,true],[4040301,true],[4030501,true],[4030401,false],[4030101,false],[4030601,false]],"is_common":false}`|
|53|`{"hero":[[1040301,true],[1040201,true],[1030101,false],[1030601,false],[1030701,false],[1030501,false]],"is_common":false}`|
|54|`{"hero":[[5040101,true],[5040201,true],[2040101,true],[2030601,false],[2030301,false],[2030201,false]],"is_common":false}`|
|55|`{"hero":[[2040201,true],[2030501,true],[3030501,true],[2030201,false],[2030301,false],[2030401,false]],"is_common":false}`|
|56|`{"hero":[[5040201,true],[2040201,true],[1040101,true],[2030601,false],[2030301,false],[2030201,false]],"is_common":false}`|
|57|`{"hero":[[5040301,true],[5040101,true],[5040201,true],[1040301,false],[3040101,false],[2030301,false]],"is_common":false}`|
|58|`{"hero":[[5040401,true],[5040301,true],[5040101,true],[5040201,false],[1040301,false],[2040101,false]],"is_common":false}`|
|59|`{"hero":[[5040501,true],[5040301,true],[5040401,true],[5040101,false],[5040201,false],[1040301,false]],"is_common":false}`|
|60|`{"hero":[[5040501,true],[5040301,true],[5040401,true],[5040101,false],[5040201,false],[5040601,false]],"is_common":false}`|
|61|`{"hero":[[5040501,true],[5040301,true],[5040401,true],[5040701,true],[5040101,false],[5040601,false]],"is_common":false}`|
|99|`{"hero":[[4030801,true],[3030501,true],[2020601,true],[1020601,false],[1020101,false],[3010201,false]],"is_common":true}`|

## StrategyDrawLineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|lineup|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1}`|
|2|`{"type":2}`|
|3|`{"type":3}`|
|4|`{"type":3}`|
|5|`{"type":3}`|
|6|`{"type":3}`|

## StrategyNewConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|lineup_tips|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4030601|`{}`|
|4040201|`{}`|

## StrategyNew

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|last_hero|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cur_hero|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dec|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"last_hero":[[4030601,true],[4040201,false],[1030101,false],[1030201,false],[1030501,false],[3030501,false]],"cur_hero":4030601,"hero":[[1030101,false],[1030201,false],[1030501,false],[3030501,false],[2030501,false],[3020101,false]]}`|
|2|`{"last_hero":[[4030601,true],[4040201,false],[2030201,false],[2030301,false],[2030401,false],[3030501,false]],"cur_hero":4030601,"hero":[[2030201,false],[2030301,false],[2030401,false],[3030501,false],[2030501,false],[2020501,false]]}`|
|3|`{"last_hero":[[4030601,true],[4040201,false],[3030601,false],[3030301,false],[3030401,false],[3030201,false]],"cur_hero":4030601,"hero":[[3030601,false],[3030301,false],[3030401,false],[3030201,false],[3030501,false],[2030501,false]]}`|
|4|`{"last_hero":[[4030601,true],[4040201,false],[4030501,false],[4030401,false],[4030101,false],[4030201,false]],"cur_hero":4030601,"hero":[[4030501,false],[4030401,false],[4030101,false],[4030201,false],[3030501,false],[2030501,false]]}`|
|5|`{"last_hero":[[4040201,true],[4030601,false],[4030501,false],[4030401,false],[4030101,false],[4030201,false]],"cur_hero":4040201,"hero":[[4030501,false],[4030401,false],[4030101,false],[4030201,false],[3030501,false],[2030501,false]]}`|
|6|`{"last_hero":[[4040201,true],[4030601,false],[2030201,false],[2030301,false],[2030401,false],[3030501,false]],"cur_hero":4040201,"hero":[[2030201,false],[2030301,false],[2030401,false],[3030501,false],[2030501,false],[2020501,false]]}`|
|7|`{"last_hero":[[4040201,true],[4030601,false],[3030601,false],[3030301,false],[3030401,false],[3030201,false]],"cur_hero":4040201,"hero":[[3030601,false],[3030301,false],[3030401,false],[3030201,false],[3030501,false],[2030501,false]]}`|
|8|`{"last_hero":[[4040201,true],[4030601,false],[1030101,false],[1030201,false],[1030501,false],[3030501,false]],"cur_hero":4040201,"hero":[[1030101,false],[1030201,false],[1030501,false],[3030501,false],[2030501,false],[3020101,false]]}`|

## StrategyLineupType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|bg|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|

## StrategyType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## RoleSpecialStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|effect|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|values|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|args|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|material|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"values":[]}`|
|2|`{"values":[]}`|
|3|`{"values":[]}`|
|4|`{"values":[]}`|

## WarRuneStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|style3|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style1|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style2|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2100116|`{}`|
|2100216|`{}`|
|2100316|`{}`|
|2100416|`{}`|

## RoleStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|mission_loc_offset|undefined|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_loc_offset|undefined|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_figure|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collection_figure|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ko_stay_duration|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_effect|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_dark_offset|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_enter_effect_duration|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_ignore_puppet|boolean|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_enter_show_anim|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|first_charge_icon|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ko_duration|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fresnel_range|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|carnival_scale|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pendant|array|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_style|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_result_ani|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_scale|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ko_offset|undefined|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_icon|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|puppet|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_prompt|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pendant_prefab|array|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_show_offset|undefined|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ko_back_duration|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_icon|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_style|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|custom_hit_parse_func|undefined/object|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_puppet|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|545|本表行键；与其他表同值不自动代表同一对象。|
|guide_effect|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_style|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_scale|number|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_pet_offset|undefined|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_enter_effect|string|545|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部545行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10000|`{"ko_stay_duration":0,"fight_dark_offset":0,"fight_enter_effect_duration":0,"can_ignore_puppet":false,"fight_enter_show_anim":"","first_charge_icon":"","ko_duration":0,"fight_result_ani":"","fight_prompt":0,"ko_back_duration":0,"fight_scale":0,"fight_enter_effect":""}`|
|10001|`{"ko_stay_duration":0,"fight_dark_offset":0,"fight_enter_effect_duration":0,"can_ignore_puppet":false,"fight_enter_show_anim":"","first_charge_icon":"","ko_duration":0,"fight_result_ani":"","fight_prompt":0,"ko_back_duration":0,"fight_scale":0,"fight_enter_effect":""}`|
|10002|`{"ko_stay_duration":0,"fight_dark_offset":0,"fight_enter_effect_duration":0,"can_ignore_puppet":false,"fight_enter_show_anim":"","first_charge_icon":"","ko_duration":0,"fight_result_ani":"","fight_prompt":0,"ko_back_duration":0,"fight_scale":0,"fight_enter_effect":""}`|

## DrawLuckyConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cut_luck_value|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_talent|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_envelope_drop|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_libs|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|red_envelope_threshold|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cut_luck_value":450,"show_talent":13,"draw_libs":[2,3,1]}`|

## DrawLuckyShare

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|value_range|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|confirm_des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"value_range":[0,600]}`|
|2|`{"value_range":[601,1500]}`|
|3|`{"value_range":[1501,9999]}`|

## LuckyRankAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rank_range|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[201500,1]],"rank_range":[1,1]}`|
|2|`{"award":[[201500,1]],"rank_range":[2,2]}`|
|3|`{"award":[[201500,1]],"rank_range":[3,3]}`|
|4|`{"award":[[201500,1]],"rank_range":[4,10]}`|
|5|`{"award":[[201500,1]],"rank_range":[11,20]}`|

## DrawLuckyPrefix

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## DrawLuckyRange

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|value_range|array|386|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|386|本表行键；与其他表同值不自动代表同一对象。|
|rate|number|386|原倍率/概率字段值；具体分母由该表消费者决定。|

下列3行用于说明结构；全部386行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"value_range":[1,809],"rate":2100}`|
|2|`{"value_range":[810,819],"rate":2120}`|
|3|`{"value_range":[820,829],"rate":2140}`|

## DrawExchangeSlotType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## DrawExchangeSlot

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|params_cond_desc|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_title|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|slot_type|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition|undefined/number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_cond_desc|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"params_cond_desc":[],"slot_type":1,"txt_cond_desc":0}`|
|2|`{"params_cond_desc":[],"slot_type":1,"txt_cond_desc":0}`|
|3|`{"params_cond_desc":[100],"slot_type":2,"condition":419271000003,"txt_cond_desc":60934}`|

## DrawExchangeParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fun_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fun_proggress_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fun_open":1128,"fun_proggress_award":1128}`|

## DrawExchangeHero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|27|本表行键；与其他表同值不自动代表同一对象。|
|slot_type|number|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1030101|`{"slot_type":1}`|
|1030201|`{"slot_type":1}`|
|1030301|`{"slot_type":1}`|
|1030401|`{"slot_type":1}`|
|1030501|`{"slot_type":1}`|
|1030601|`{"slot_type":1}`|
|1030701|`{"slot_type":1}`|
|2030101|`{"slot_type":1}`|
|2030201|`{"slot_type":1}`|
|2030301|`{"slot_type":1}`|
|2030401|`{"slot_type":1}`|
|2030501|`{"slot_type":1}`|
|2030601|`{"slot_type":1}`|
|2030701|`{"slot_type":1}`|
|2040201|`{"slot_type":2}`|
|3030201|`{"slot_type":1}`|
|3030301|`{"slot_type":1}`|
|3030401|`{"slot_type":1}`|
|3030501|`{"slot_type":1}`|
|3030601|`{"slot_type":1}`|
|3030701|`{"slot_type":1}`|
|4030101|`{"slot_type":1}`|
|4030201|`{"slot_type":1}`|
|4030301|`{"slot_type":1}`|
|4030401|`{"slot_type":1}`|
|4030501|`{"slot_type":1}`|
|4030601|`{"slot_type":1}`|

## DrawExchangeLineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition_show|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relation_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_txt|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_recommend|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|popularity|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":[1030101,1030501,2040201],"relation_type":1,"is_recommend":false}`|
|2|`{"hero":[2030201,2030301,2040201],"relation_type":2,"is_recommend":false}`|
|3|`{"hero":[3030601,3030201,2040201],"relation_type":3,"is_recommend":false}`|
|4|`{"hero":[4030501,4030401,2040201],"relation_type":4,"is_recommend":true}`|

## NormalDrawExchangeLineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|title_txt|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_recommend|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|popularity|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relation_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_recommend":false,"hero":[1030101,1030501],"relation_type":1}`|
|2|`{"is_recommend":false,"hero":[2030201,2030301],"relation_type":2}`|
|3|`{"is_recommend":false,"hero":[3030601,3030201],"relation_type":3}`|
|4|`{"is_recommend":true,"hero":[4030501,4030401],"relation_type":4}`|

## Star

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|small_border|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_border|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|

## ShowHeroLegendHotParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1040101|`{}`|
|4040101|`{}`|

## ShowWorldBossParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|800001|`{}`|
|800002|`{}`|
|800003|`{}`|

## ShowRoleParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2010101|`{}`|

## ShowFiveDayBossParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1030501|`{}`|
|2030301|`{}`|
|3030201|`{}`|
|3030501|`{}`|
|4030401|`{}`|

## ShowHelpUpParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400010|`{}`|
|400074|`{}`|
|400076|`{}`|
|400077|`{}`|

## ShowMartialClubParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1020601|`{}`|

## ShowArtifactParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400001|`{}`|
|400002|`{}`|
|400003|`{}`|
|400004|`{}`|
|400005|`{}`|
|400006|`{}`|
|400007|`{}`|
|400011|`{}`|
|400017|`{}`|
|400029|`{}`|
|400033|`{}`|
|400040|`{}`|
|400057|`{}`|
|400058|`{}`|
|400059|`{}`|
|400060|`{}`|
|400061|`{}`|
|400062|`{}`|
|400066|`{}`|
|400068|`{}`|
|400072|`{}`|
|400073|`{}`|

## ShowArtifactHandbookParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400001|`{}`|
|400002|`{}`|
|400003|`{}`|
|400004|`{}`|
|400005|`{}`|
|400006|`{}`|
|400007|`{}`|
|400011|`{}`|
|400017|`{}`|
|400029|`{}`|
|400033|`{}`|
|400040|`{}`|
|400057|`{}`|
|400058|`{}`|
|400059|`{}`|
|400060|`{}`|
|400061|`{}`|
|400062|`{}`|
|400066|`{}`|
|400068|`{}`|
|400072|`{}`|
|400073|`{}`|

## ShowArtifactForgeParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400001|`{}`|
|400002|`{}`|
|400003|`{}`|
|400004|`{}`|
|400005|`{}`|
|400006|`{}`|
|400007|`{}`|
|400011|`{}`|
|400017|`{}`|
|400029|`{}`|
|400033|`{}`|
|400040|`{}`|
|400057|`{}`|
|400058|`{}`|
|400059|`{}`|
|400060|`{}`|
|400061|`{}`|
|400062|`{}`|
|400066|`{}`|
|400068|`{}`|
|400072|`{}`|
|400073|`{}`|

## ArtifactSkinParam

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## ShowArtifactDrawParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400007|`{}`|
|400017|`{}`|
|400029|`{}`|
|400033|`{}`|
|400040|`{}`|
|400062|`{}`|
|400066|`{}`|
|400068|`{}`|
|400072|`{}`|
|400073|`{}`|

## ShowArtifactTrialsParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400001|`{}`|
|400002|`{}`|
|400003|`{}`|
|400004|`{}`|
|400005|`{}`|
|400006|`{}`|
|400007|`{}`|
|400011|`{}`|
|400017|`{}`|
|400029|`{}`|
|400033|`{}`|
|400040|`{}`|
|400057|`{}`|
|400058|`{}`|
|400059|`{}`|
|400060|`{}`|
|400061|`{}`|
|400062|`{}`|
|400066|`{}`|
|400068|`{}`|
|400072|`{}`|
|400073|`{}`|

## ShowArtifactFlyUpParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400001|`{}`|
|400002|`{}`|
|400003|`{}`|
|400004|`{}`|
|400005|`{}`|
|400006|`{}`|
|400007|`{}`|
|400011|`{}`|
|400017|`{}`|
|400029|`{}`|
|400033|`{}`|
|400040|`{}`|
|400057|`{}`|
|400058|`{}`|
|400059|`{}`|
|400060|`{}`|
|400061|`{}`|
|400062|`{}`|
|400066|`{}`|
|400068|`{}`|
|400072|`{}`|
|400073|`{}`|

## ShowArtifactAcquireParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|400001|`{}`|
|400002|`{}`|
|400003|`{}`|
|400004|`{}`|
|400005|`{}`|
|400006|`{}`|
|400007|`{}`|
|400011|`{}`|
|400017|`{}`|
|400029|`{}`|
|400033|`{}`|
|400040|`{}`|
|400057|`{}`|
|400058|`{}`|
|400059|`{}`|
|400060|`{}`|
|400061|`{}`|
|400062|`{}`|
|400066|`{}`|
|400068|`{}`|
|400072|`{}`|
|400073|`{}`|

## ChristmasSkinParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|104010101|`{}`|
|303050104|`{}`|

## ShowWaterGunParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|700001|`{}`|
|700002|`{}`|
|700003|`{}`|
|700004|`{}`|

## ShowWarRuneMainParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc_active|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2100116|`{}`|
|2100216|`{}`|
|2100316|`{}`|
|2100416|`{}`|

## ShowWarRuneSecondFormParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2100116|`{}`|
|2100216|`{}`|
|2100316|`{}`|
|2100416|`{}`|

## ShowWarRuneActiveParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2100116|`{}`|
|2100216|`{}`|
|2100316|`{}`|
|2100416|`{}`|

## ShowFantasyEquipBookParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4030502|`{}`|
|4030602|`{}`|
|4030702|`{}`|
|4030802|`{}`|
|4030902|`{}`|
|4031002|`{}`|
|4031102|`{}`|
|4031202|`{}`|

## ShowFantasyEquipParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|37|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|700001|`{}`|
|700002|`{}`|
|700003|`{}`|
|700004|`{}`|
|700101|`{}`|
|700102|`{}`|
|700103|`{}`|
|701005|`{}`|
|701007|`{}`|
|701008|`{}`|
|701009|`{}`|
|701010|`{}`|
|701011|`{}`|
|701012|`{}`|
|701013|`{}`|
|701014|`{}`|
|701015|`{}`|
|701016|`{}`|
|701017|`{}`|
|701018|`{}`|
|701019|`{}`|
|701020|`{}`|
|701022|`{}`|
|701023|`{}`|
|701026|`{}`|
|701027|`{}`|
|701028|`{}`|
|701029|`{}`|
|701030|`{}`|
|4030502|`{}`|
|4030602|`{}`|
|4030702|`{}`|
|4030802|`{}`|
|4030902|`{}`|
|4031002|`{}`|
|4031102|`{}`|
|4031202|`{}`|

## ShowFantasyEquipBlessParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|39|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|39|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|39|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|39|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|39|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|39|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|700001|`{}`|
|700002|`{}`|
|700003|`{}`|
|700004|`{}`|
|700102|`{}`|
|700103|`{}`|
|701005|`{}`|
|701007|`{}`|
|701008|`{}`|
|701009|`{}`|
|701010|`{}`|
|701011|`{}`|
|701012|`{}`|
|701013|`{}`|
|701014|`{}`|
|701015|`{}`|
|701016|`{}`|
|701017|`{}`|
|701018|`{}`|
|701019|`{}`|
|701020|`{}`|
|701021|`{}`|
|701022|`{}`|
|701023|`{}`|
|701024|`{}`|
|701025|`{}`|
|701026|`{}`|
|701027|`{}`|
|701028|`{}`|
|701029|`{}`|
|701030|`{}`|
|4030502|`{}`|
|4030602|`{}`|
|4030702|`{}`|
|4030802|`{}`|
|4030902|`{}`|
|4031002|`{}`|
|4031102|`{}`|
|4031202|`{}`|

## ShowFantasyEquipDrawParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|33|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|700005|`{}`|
|700006|`{}`|
|700007|`{}`|
|700008|`{}`|
|700009|`{}`|
|700011|`{}`|
|700012|`{}`|
|700013|`{}`|
|700014|`{}`|
|700015|`{}`|
|700016|`{}`|
|700017|`{}`|
|700018|`{}`|
|700019|`{}`|
|700024|`{}`|
|700026|`{}`|
|700027|`{}`|
|700029|`{}`|
|700030|`{}`|
|4030502|`{}`|
|4030602|`{}`|
|4030702|`{}`|
|4030802|`{}`|
|4030902|`{}`|
|4031002|`{}`|
|4031102|`{}`|
|4031202|`{}`|
|103010103|`{}`|
|203020103|`{}`|
|303050101|`{}`|
|303060103|`{}`|
|403050103|`{}`|
|403080103|`{}`|

## ShowFantasyEquipDemigodParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|700001|`{}`|
|700002|`{}`|
|700003|`{}`|
|700004|`{}`|
|700005|`{}`|
|700006|`{}`|
|700007|`{}`|
|700008|`{}`|
|700009|`{}`|
|700011|`{}`|
|700012|`{}`|
|700013|`{}`|
|700014|`{}`|
|700015|`{}`|
|700016|`{}`|
|700017|`{}`|
|700018|`{}`|
|700019|`{}`|
|700020|`{}`|
|700022|`{}`|
|700023|`{}`|
|700024|`{}`|
|700026|`{}`|
|700027|`{}`|
|700030|`{}`|
|700101|`{}`|
|700102|`{}`|
|700103|`{}`|

## ShowGetNewFantasyEquipParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|700005|`{}`|
|700006|`{}`|
|700007|`{}`|
|700009|`{}`|
|701008|`{}`|
|4030502|`{}`|
|4030602|`{}`|
|4030702|`{}`|
|4030802|`{}`|
|4030902|`{}`|
|4031002|`{}`|
|4031102|`{}`|
|4031202|`{}`|

## ShowFantasyEquipTrialParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|33|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|701005|`{}`|
|701007|`{}`|
|701008|`{}`|
|701009|`{}`|
|701011|`{}`|
|701012|`{}`|
|701013|`{}`|
|701014|`{}`|
|701015|`{}`|
|701016|`{}`|
|701017|`{}`|
|701018|`{}`|
|701019|`{}`|
|701020|`{}`|
|701021|`{}`|
|701022|`{}`|
|701023|`{}`|
|701024|`{}`|
|701025|`{}`|
|701026|`{}`|
|701027|`{}`|
|701028|`{}`|
|701029|`{}`|
|701030|`{}`|
|2030501|`{}`|
|4030502|`{}`|
|4030602|`{}`|
|4030702|`{}`|
|4030802|`{}`|
|4030902|`{}`|
|4031002|`{}`|
|4031102|`{}`|
|4031202|`{}`|

## ShowHeroDrawParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1040101|`{}`|
|4030601|`{}`|
|4040101|`{}`|
|4040201|`{}`|

## ShowScarletTrailParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|17|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1040101|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3040201|`{}`|
|4030601|`{}`|
|4040101|`{}`|
|4040201|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040101|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040401|`{}`|
|5040501|`{}`|
|5040601|`{}`|

## ShowRankParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3040101|`{}`|
|304030101|`{}`|
|304030102|`{}`|

## RoleShowParamMap

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|config_interface|object/undefined|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|121|本表行键；与其他表同值不自动代表同一对象。|
|bg|string|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|16|`{}`|
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|
|25|`{}`|
|27|`{}`|
|28|`{}`|
|29|`{}`|
|30|`{}`|
|31|`{}`|
|32|`{}`|
|33|`{}`|
|34|`{}`|
|35|`{}`|
|36|`{}`|
|37|`{}`|
|38|`{}`|
|39|`{}`|
|40|`{}`|
|41|`{}`|
|42|`{}`|
|43|`{}`|
|44|`{}`|
|45|`{}`|
|46|`{}`|
|47|`{}`|
|48|`{}`|
|49|`{}`|
|50|`{}`|
|51|`{}`|
|52|`{}`|
|53|`{}`|
|54|`{}`|
|55|`{}`|
|56|`{}`|
|57|`{}`|
|58|`{}`|
|59|`{}`|
|60|`{}`|
|61|`{}`|
|62|`{}`|
|63|`{}`|
|64|`{}`|
|65|`{}`|
|66|`{}`|
|67|`{}`|
|68|`{}`|
|69|`{}`|
|70|`{}`|
|71|`{}`|
|72|`{}`|
|73|`{}`|
|74|`{}`|
|75|`{}`|
|76|`{}`|
|77|`{}`|
|78|`{}`|
|79|`{}`|
|80|`{}`|
|81|`{}`|
|82|`{}`|
|83|`{}`|
|84|`{}`|
|85|`{}`|
|86|`{}`|
|87|`{}`|
|88|`{}`|
|89|`{}`|
|90|`{}`|
|91|`{}`|
|92|`{}`|
|93|`{}`|
|94|`{}`|
|95|`{}`|
|96|`{}`|
|97|`{}`|
|100|`{}`|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|511|`{}`|
|512|`{}`|
|513|`{}`|
|514|`{}`|
|515|`{}`|
|516|`{}`|
|517|`{}`|
|518|`{}`|
|1040101|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2030601|`{}`|
|2030701|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3030701|`{}`|
|3040101|`{}`|
|3040201|`{}`|
|4030601|`{}`|
|4040201|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040101|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040401|`{}`|
|5040501|`{}`|
|5040601|`{}`|
|5040701|`{}`|

## ShowHundredDrawParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500016|`{}`|
|500020|`{}`|
|900117|`{}`|
|4031202|`{}`|

## DivineEmbryoShowParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500004|`{}`|
|500007|`{}`|
|500008|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|1030601|`{}`|
|1030701|`{}`|
|1040101|`{}`|
|2030601|`{}`|
|3030701|`{}`|
|4030601|`{}`|
|4040201|`{}`|

## ShowElvesDevelopParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900103|`{}`|
|900105|`{}`|
|900106|`{}`|
|900107|`{}`|
|900109|`{}`|
|900110|`{}`|
|900111|`{}`|
|900112|`{}`|
|900113|`{}`|
|900114|`{}`|
|900115|`{}`|
|900116|`{}`|
|900117|`{}`|
|900118|`{}`|
|900119|`{}`|
|900120|`{}`|
|900121|`{}`|
|900122|`{}`|
|900123|`{}`|
|900124|`{}`|
|900125|`{}`|
|900126|`{}`|

## ShowElvesRaiseStarParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900103|`{}`|
|900105|`{}`|
|900106|`{}`|
|900107|`{}`|
|900109|`{}`|
|900110|`{}`|
|900111|`{}`|
|900112|`{}`|
|900113|`{}`|
|900114|`{}`|
|900115|`{}`|
|900116|`{}`|
|900117|`{}`|
|900118|`{}`|
|900119|`{}`|
|900120|`{}`|
|900121|`{}`|
|900122|`{}`|
|900123|`{}`|
|900124|`{}`|
|900125|`{}`|
|900126|`{}`|

## ShowElvesRaiseStarSuccessParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900103|`{}`|
|900105|`{}`|
|900106|`{}`|
|900107|`{}`|
|900109|`{}`|
|900110|`{}`|
|900111|`{}`|
|900112|`{}`|
|900113|`{}`|
|900114|`{}`|
|900115|`{}`|
|900116|`{}`|
|900117|`{}`|
|900118|`{}`|
|900119|`{}`|
|900120|`{}`|
|900121|`{}`|
|900122|`{}`|
|900123|`{}`|
|900124|`{}`|
|900125|`{}`|
|900126|`{}`|

## ShowElvesMutantParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900002|`{}`|
|900105|`{}`|

## ShowElvesMutantSuccessParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900105|`{}`|

## ShowElvesBookParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900103|`{}`|
|900105|`{}`|
|900106|`{}`|
|900107|`{}`|
|900109|`{}`|
|900110|`{}`|
|900111|`{}`|
|900112|`{}`|
|900113|`{}`|
|900114|`{}`|
|900115|`{}`|
|900116|`{}`|
|900117|`{}`|
|900118|`{}`|
|900119|`{}`|
|900120|`{}`|
|900121|`{}`|
|900122|`{}`|
|900123|`{}`|
|900124|`{}`|
|900125|`{}`|
|900126|`{}`|

## ShowElvesActParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900105|`{}`|
|900106|`{}`|
|900109|`{}`|
|900111|`{}`|
|900113|`{}`|
|900115|`{}`|
|900117|`{}`|
|900119|`{}`|
|900121|`{}`|
|900123|`{}`|
|900124|`{}`|

## ShowElvesHelpParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|left_cell_pos|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|self_bg_scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|right_cell_pos|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900103|`{}`|
|900105|`{}`|
|900106|`{}`|
|900107|`{}`|
|900109|`{}`|
|900110|`{}`|
|900111|`{}`|
|900112|`{}`|
|900113|`{}`|
|900114|`{}`|
|900115|`{}`|
|900116|`{}`|
|900117|`{}`|
|900118|`{}`|
|900119|`{}`|
|900120|`{}`|
|900121|`{}`|
|900122|`{}`|
|900123|`{}`|
|900124|`{}`|
|900125|`{}`|
|900126|`{}`|

## ShowElvesDrawParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900105|`{}`|
|900106|`{}`|
|900109|`{}`|
|900111|`{}`|
|900113|`{}`|
|900115|`{}`|
|900117|`{}`|
|900119|`{}`|
|900121|`{}`|
|900123|`{}`|
|900125|`{}`|

## ShowElvesSkinParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900103|`{}`|
|900105|`{}`|
|900106|`{}`|
|900107|`{}`|
|900109|`{}`|
|900110|`{}`|
|900111|`{}`|
|900112|`{}`|
|900113|`{}`|
|900114|`{}`|
|900115|`{}`|
|900116|`{}`|
|900117|`{}`|
|900118|`{}`|
|900119|`{}`|
|900120|`{}`|
|900121|`{}`|
|900122|`{}`|
|900123|`{}`|
|900124|`{}`|
|900125|`{}`|
|900126|`{}`|

## ShowElvesGetParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|900001|`{}`|
|900002|`{}`|
|900003|`{}`|
|900004|`{}`|
|900005|`{}`|
|900006|`{}`|
|900101|`{}`|
|900102|`{}`|
|900103|`{}`|
|900105|`{}`|
|900106|`{}`|
|900107|`{}`|
|900109|`{}`|
|900110|`{}`|
|900111|`{}`|
|900112|`{}`|
|900113|`{}`|
|900114|`{}`|
|900115|`{}`|
|900116|`{}`|
|900117|`{}`|
|900118|`{}`|
|900119|`{}`|
|900120|`{}`|
|900121|`{}`|
|900122|`{}`|
|900123|`{}`|
|900124|`{}`|
|900125|`{}`|
|900126|`{}`|

## ShowFightResultParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|151|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|701007|`{}`|
|701013|`{}`|
|701014|`{}`|
|701015|`{}`|
|701016|`{}`|
|701017|`{}`|
|701024|`{}`|
|701025|`{}`|
|701026|`{}`|
|701027|`{}`|
|701029|`{}`|
|701030|`{}`|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|1030601|`{}`|
|1030701|`{}`|
|1040101|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030402|`{}`|
|2030501|`{}`|
|2030601|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030502|`{}`|
|3030601|`{}`|
|3030701|`{}`|
|3040101|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030202|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4030601|`{}`|
|4030801|`{}`|
|4040101|`{}`|
|4040201|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040701|`{}`|
|102060101|`{}`|
|104020101|`{}`|
|104030101|`{}`|
|116040101|`{}`|
|117020101|`{}`|
|202050101|`{}`|
|203060101|`{}`|
|204010101|`{}`|
|204020101|`{}`|
|216020102|`{}`|
|216040101|`{}`|
|216050101|`{}`|
|217020101|`{}`|
|217020102|`{}`|
|217020103|`{}`|
|217020104|`{}`|
|217020106|`{}`|
|217020107|`{}`|
|303020104|`{}`|
|303020105|`{}`|
|303020106|`{}`|
|303050103|`{}`|
|303050104|`{}`|
|303050110|`{}`|
|303050111|`{}`|
|303050112|`{}`|
|303050113|`{}`|
|303050114|`{}`|
|303060104|`{}`|
|303060105|`{}`|
|303060106|`{}`|
|303060107|`{}`|
|303060108|`{}`|
|303070101|`{}`|
|304020101|`{}`|
|316020101|`{}`|
|316020102|`{}`|
|316040101|`{}`|
|403040102|`{}`|
|403040103|`{}`|
|403040104|`{}`|
|403060103|`{}`|
|403080101|`{}`|
|404020101|`{}`|
|404020102|`{}`|
|417010102|`{}`|
|417020102|`{}`|
|417020103|`{}`|
|417020104|`{}`|
|417020105|`{}`|
|417020106|`{}`|
|417020107|`{}`|
|417030102|`{}`|
|517010102|`{}`|
|517020102|`{}`|
|517030101|`{}`|
|517030102|`{}`|
|517050102|`{}`|
|517050103|`{}`|
|517050104|`{}`|
|517050105|`{}`|
|517050107|`{}`|
|517050108|`{}`|
|518020101|`{}`|

## DownShowParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1040101|`{}`|

## ShowUpStarParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|86|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|1040101|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|2030601|`{}`|
|2030701|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4040101|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040601|`{}`|
|5040701|`{}`|
|102060101|`{}`|
|116040101|`{}`|
|117020101|`{}`|
|202050101|`{}`|
|203060101|`{}`|
|216020102|`{}`|
|216040101|`{}`|
|216050101|`{}`|
|217020101|`{}`|
|417010102|`{}`|
|417020102|`{}`|
|417030102|`{}`|
|505060101|`{}`|
|517010102|`{}`|
|517020102|`{}`|
|517030101|`{}`|
|517030102|`{}`|
|517050102|`{}`|
|518020101|`{}`|

## ShowParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|135|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|135|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|135|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|135|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|135|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|135|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|300003|`{}`|
|400001|`{}`|
|400002|`{}`|
|400003|`{}`|
|400004|`{}`|
|400005|`{}`|
|400006|`{}`|
|400007|`{}`|
|400028|`{}`|
|701013|`{}`|
|701016|`{}`|
|701027|`{}`|
|701029|`{}`|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|1030502|`{}`|
|1030701|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|2030601|`{}`|
|2030701|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030302|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|3040101|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030202|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4030601|`{}`|
|4030801|`{}`|
|4040101|`{}`|
|4040201|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040501|`{}`|
|5040601|`{}`|
|5040701|`{}`|
|102060101|`{}`|
|104020101|`{}`|
|104030101|`{}`|
|116040101|`{}`|
|117020101|`{}`|
|202050101|`{}`|
|203060101|`{}`|
|204020101|`{}`|
|216020102|`{}`|
|216040101|`{}`|
|216050101|`{}`|
|217020101|`{}`|
|217020106|`{}`|
|217020107|`{}`|
|303020104|`{}`|
|303020105|`{}`|
|303020106|`{}`|
|303050110|`{}`|
|303050111|`{}`|
|303050112|`{}`|
|303050113|`{}`|
|303050114|`{}`|
|303060107|`{}`|
|303060108|`{}`|
|304020101|`{}`|
|403040102|`{}`|
|403040103|`{}`|
|403040104|`{}`|
|403060103|`{}`|
|404020101|`{}`|
|404020102|`{}`|
|404030101|`{}`|
|404040101|`{}`|
|417010102|`{}`|
|417020102|`{}`|
|417020106|`{}`|
|417020107|`{}`|
|417030102|`{}`|
|505060101|`{}`|
|517010102|`{}`|
|517020102|`{}`|
|517030101|`{}`|
|517030102|`{}`|
|517050102|`{}`|
|517050107|`{}`|
|517050108|`{}`|
|518020101|`{}`|

## ReforgeParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|83|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|83|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|83|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|83|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|83|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|83|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|1040101|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|2030601|`{}`|
|2030701|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4040101|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|102060101|`{}`|
|116040101|`{}`|
|117020101|`{}`|
|202050101|`{}`|
|203060101|`{}`|
|216020102|`{}`|
|216040101|`{}`|
|216050101|`{}`|
|217020101|`{}`|
|417010102|`{}`|
|417020102|`{}`|
|417030102|`{}`|
|517010102|`{}`|
|517020102|`{}`|
|517030101|`{}`|
|517030102|`{}`|
|517050102|`{}`|
|518020101|`{}`|

## ShowBreachParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|81|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|2030701|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4040101|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040701|`{}`|
|102060101|`{}`|
|116040101|`{}`|
|117020101|`{}`|
|202050101|`{}`|
|216020102|`{}`|
|216040101|`{}`|
|216050101|`{}`|
|217020101|`{}`|
|417010102|`{}`|
|417020102|`{}`|
|417030102|`{}`|
|517010102|`{}`|
|517020102|`{}`|
|517030101|`{}`|
|517030102|`{}`|
|517050102|`{}`|
|518020101|`{}`|

## DefaultShowParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5040601|`{}`|
|5040701|`{}`|
|505060101|`{}`|

## FashionHeroStyleParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1020201|`{}`|
|2010101|`{}`|
|104010101|`{}`|
|116040101|`{}`|

## ShowFavorParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|76|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030202|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4040101|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|102060101|`{}`|
|116040101|`{}`|
|117020101|`{}`|
|202050101|`{}`|
|216020102|`{}`|
|216040101|`{}`|
|216050101|`{}`|
|217020101|`{}`|
|316020101|`{}`|
|316020102|`{}`|
|417010102|`{}`|
|417020102|`{}`|
|417030102|`{}`|
|517010102|`{}`|
|517020102|`{}`|
|517030101|`{}`|
|517030102|`{}`|
|517050102|`{}`|
|518020101|`{}`|

## ShowPetDevelopBookParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetDevelopParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetRaiseStarParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetRaiseStarSuccessParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetUpgradeParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetMutantParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500006|`{}`|
|500011|`{}`|

## ShowPetBookParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetChallengeParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetDisplayParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetActParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetHelpParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|camera_rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|rotation_left|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation_right|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg_scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|model_slot_pos|array|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_bg|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|undefined|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500005|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowPetGetParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500001|`{}`|
|500002|`{}`|
|500003|`{}`|
|500004|`{}`|
|500006|`{}`|
|500007|`{}`|
|500008|`{}`|
|500009|`{}`|
|500011|`{}`|
|500012|`{}`|
|500013|`{}`|
|500014|`{}`|
|500015|`{}`|
|500016|`{}`|
|500017|`{}`|
|500018|`{}`|
|500019|`{}`|
|500020|`{}`|

## ShowEliteBossPreviewParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_rotation|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|scale|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|9002700|`{}`|
|9402700|`{}`|
|9402800|`{}`|
|9402900|`{}`|

## MasteryGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|level_range|array|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|break_range|array|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"level_range":[1001,1002,1003,1004,1005,1006,1007,1008,1009,1010,1011,1012,1013,1014,1015,1016,1017,1018,1019,1020,1021,1022,1023,1024,1025,1026,1027,1028,1029,1030,1031,1032,1033,1034,1035,1036,1037,1038,1039,1040,1041,1042,1043,1044,1045,1046,1047,1048,1049,1050,1051,1052,1053,1054,1055,1056,1057,1058,1059,1060,1061,1062,1063,1064,1065,1066,1067,1068,1069,1070],"break_range":[1001,1002,1003,1004,1005]}`|
|2|`{"level_range":[2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070],"break_range":[2001,2002,2003,2004,2005]}`|
|3|`{"level_range":[3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012,3013,3014,3015,3016,3017,3018,3019,3020,3021,3022,3023,3024,3025,3026,3027,3028,3029,3030,3031,3032,3033,3034,3035,3036,3037,3038,3039,3040,3041,3042,3043,3044,3045,3046,3047,3048,3049,3050,3051,3052,3053,3054,3055,3056,3057,3058,3059,3060,3061,3062,3063,3064,3065,3066,3067,3068,3069,3070],"break_range":[3001,3002,3003,3004,3005]}`|
|4|`{"level_range":[4001,4002,4003,4004,4005,4006,4007,4008,4009,4010,4011,4012,4013,4014,4015,4016,4017,4018,4019,4020,4021,4022,4023,4024,4025,4026,4027,4028,4029,4030,4031,4032,4033,4034,4035,4036,4037,4038,4039,4040,4041,4042,4043,4044,4045,4046,4047,4048,4049,4050,4051,4052,4053,4054,4055,4056,4057,4058,4059,4060,4061,4062,4063,4064,4065,4066,4067,4068,4069,4070],"break_range":[4001,4002,4003,4004,4005]}`|
|5|`{"level_range":[5001,5002,5003,5004,5005,5006,5007,5008,5009,5010,5011,5012,5013,5014,5015,5016,5017,5018,5019,5020,5021,5022,5023,5024,5025,5026,5027,5028,5029,5030,5031,5032,5033,5034,5035,5036,5037,5038,5039,5040,5041,5042,5043,5044,5045,5046,5047,5048,5049,5050,5051,5052,5053,5054,5055,5056,5057,5058,5059,5060,5061,5062,5063,5064,5065,5066,5067,5068,5069,5070],"break_range":[5001,5002,5003,5004,5005]}`|
|6|`{"level_range":[6001,6002,6003,6004,6005,6006,6007,6008,6009,6010,6011,6012,6013,6014,6015,6016,6017,6018,6019,6020,6021,6022,6023,6024,6025,6026,6027,6028,6029,6030,6031,6032,6033,6034,6035,6036,6037,6038,6039,6040,6041,6042,6043,6044,6045,6046,6047,6048,6049,6050,6051,6052,6053,6054,6055,6056,6057,6058,6059,6060,6061,6062,6063,6064,6065,6066,6067,6068,6069,6070],"break_range":[6001,6002,6003,6004,6005]}`|
|7|`{"level_range":[7001,7002,7003,7004,7005,7006,7007,7008,7009,7010,7011,7012,7013,7014,7015,7016,7017,7018,7019,7020,7021,7022,7023,7024,7025,7026,7027,7028,7029,7030,7031,7032,7033,7034,7035,7036,7037,7038,7039,7040,7041,7042,7043,7044,7045,7046,7047,7048,7049,7050,7051,7052,7053,7054,7055,7056,7057,7058,7059,7060,7061,7062,7063,7064,7065,7066,7067,7068,7069,7070],"break_range":[7001,7002,7003,7004,7005]}`|
|8|`{"level_range":[8001,8002,8003,8004,8005,8006,8007,8008,8009,8010,8011,8012,8013,8014,8015,8016,8017,8018,8019,8020,8021,8022,8023,8024,8025,8026,8027,8028,8029,8030,8031,8032,8033,8034,8035,8036,8037,8038,8039,8040,8041,8042,8043,8044,8045,8046,8047,8048,8049,8050,8051,8052,8053,8054,8055,8056,8057,8058,8059,8060,8061,8062,8063,8064,8065,8066,8067,8068,8069,8070],"break_range":[8001,8002,8003,8004,8005]}`|
|9|`{"level_range":[9001,9002,9003,9004,9005,9006,9007,9008,9009,9010,9011,9012,9013,9014,9015,9016,9017,9018,9019,9020,9021,9022,9023,9024,9025,9026,9027,9028,9029,9030,9031,9032,9033,9034,9035,9036,9037,9038,9039,9040,9041,9042,9043,9044,9045,9046,9047,9048,9049,9050,9051,9052,9053,9054,9055,9056,9057,9058,9059,9060,9061,9062,9063,9064,9065,9066,9067,9068,9069,9070],"break_range":[9001,9002,9003,9004,9005]}`|
|10|`{"level_range":[10001,10002,10003,10004,10005,10006,10007,10008,10009,10010,10011,10012,10013,10014,10015,10016,10017,10018,10019,10020,10021,10022,10023,10024,10025,10026,10027,10028,10029,10030,10031,10032,10033,10034,10035,10036,10037,10038,10039,10040,10041,10042,10043,10044,10045,10046,10047,10048,10049,10050,10051,10052,10053,10054,10055,10056,10057,10058,10059,10060,10061,10062,10063,10064,10065,10066,10067,10068,10069,10070],"break_range":[10001,10002,10003,10004,10005]}`|
|11|`{"level_range":[11001,11002,11003,11004,11005,11006,11007,11008,11009,11010,11011,11012,11013,11014,11015,11016,11017,11018,11019,11020,11021,11022,11023,11024,11025,11026,11027,11028,11029,11030,11031,11032,11033,11034,11035,11036,11037,11038,11039,11040,11041,11042,11043,11044,11045,11046,11047,11048,11049,11050,11051,11052,11053,11054,11055,11056,11057,11058,11059,11060,11061,11062,11063,11064,11065,11066,11067,11068,11069,11070],"break_range":[11001,11002,11003,11004,11005]}`|
|12|`{"level_range":[12001,12002,12003,12004,12005,12006,12007,12008,12009,12010,12011,12012,12013,12014,12015,12016,12017,12018,12019,12020,12021,12022,12023,12024,12025,12026,12027,12028,12029,12030,12031,12032,12033,12034,12035,12036,12037,12038,12039,12040,12041,12042,12043,12044,12045,12046,12047,12048,12049,12050,12051,12052,12053,12054,12055,12056,12057,12058,12059,12060,12061,12062,12063,12064,12065,12066,12067,12068,12069,12070],"break_range":[12001,12002,12003,12004,12005]}`|
|13|`{"level_range":[13001,13002,13003,13004,13005,13006,13007,13008,13009,13010,13011,13012,13013,13014,13015,13016,13017,13018,13019,13020,13021,13022,13023,13024,13025,13026,13027,13028,13029,13030,13031,13032,13033,13034,13035,13036,13037,13038,13039,13040,13041,13042,13043,13044,13045,13046,13047,13048,13049,13050,13051,13052,13053,13054,13055,13056,13057,13058,13059,13060,13061,13062,13063,13064,13065,13066,13067,13068,13069,13070],"break_range":[13001,13002,13003,13004,13005]}`|
|14|`{"level_range":[14001,14002,14003,14004,14005,14006,14007,14008,14009,14010,14011,14012,14013,14014,14015,14016,14017,14018,14019,14020,14021,14022,14023,14024,14025,14026,14027,14028,14029,14030,14031,14032,14033,14034,14035,14036,14037,14038,14039,14040,14041,14042,14043,14044,14045,14046,14047,14048,14049,14050,14051,14052,14053,14054,14055,14056,14057,14058,14059,14060,14061,14062,14063,14064,14065,14066,14067,14068,14069,14070],"break_range":[14001,14002,14003,14004,14005]}`|
|15|`{"level_range":[15001,15002,15003,15004,15005,15006,15007,15008,15009,15010,15011,15012,15013,15014,15015,15016,15017,15018,15019,15020,15021,15022,15023,15024,15025,15026,15027,15028,15029,15030,15031,15032,15033,15034,15035,15036,15037,15038,15039,15040,15041,15042,15043,15044,15045,15046,15047,15048,15049,15050,15051,15052,15053,15054,15055,15056,15057,15058,15059,15060,15061,15062,15063,15064,15065,15066,15067,15068,15069,15070],"break_range":[15001,15002,15003,15004,15005]}`|
|16|`{"level_range":[16001,16002,16003,16004,16005,16006,16007,16008,16009,16010,16011,16012,16013,16014,16015,16016,16017,16018,16019,16020,16021,16022,16023,16024,16025,16026,16027,16028,16029,16030,16031,16032,16033,16034,16035,16036,16037,16038,16039,16040,16041,16042,16043,16044,16045,16046,16047,16048,16049,16050,16051,16052,16053,16054,16055,16056,16057,16058,16059,16060,16061,16062,16063,16064,16065,16066,16067,16068,16069,16070],"break_range":[16001,16002,16003,16004,16005]}`|
|17|`{"level_range":[17001,17002,17003,17004,17005,17006,17007,17008,17009,17010,17011,17012,17013,17014,17015,17016,17017,17018,17019,17020,17021,17022,17023,17024,17025,17026,17027,17028,17029,17030,17031,17032,17033,17034,17035,17036,17037,17038,17039,17040,17041,17042,17043,17044,17045,17046,17047,17048,17049,17050,17051,17052,17053,17054,17055,17056,17057,17058,17059,17060,17061,17062,17063,17064,17065,17066,17067,17068,17069,17070],"break_range":[17001,17002,17003,17004,17005]}`|
|18|`{"level_range":[18001,18002,18003,18004,18005,18006,18007,18008,18009,18010,18011,18012,18013,18014,18015,18016,18017,18018,18019,18020,18021,18022,18023,18024,18025,18026,18027,18028,18029,18030,18031,18032,18033,18034,18035,18036,18037,18038,18039,18040,18041,18042,18043,18044,18045,18046,18047,18048,18049,18050,18051,18052,18053,18054,18055,18056,18057,18058,18059,18060,18061,18062,18063,18064,18065,18066,18067,18068,18069,18070],"break_range":[18001,18002,18003,18004,18005]}`|
|19|`{"level_range":[19001,19002,19003,19004,19005,19006,19007,19008,19009,19010,19011,19012,19013,19014,19015,19016,19017,19018,19019,19020,19021,19022,19023,19024,19025,19026,19027,19028,19029,19030,19031,19032,19033,19034,19035,19036,19037,19038,19039,19040,19041,19042,19043,19044,19045,19046,19047,19048,19049,19050,19051,19052,19053,19054,19055,19056,19057,19058,19059,19060,19061,19062,19063,19064,19065,19066,19067,19068,19069,19070],"break_range":[19001,19002,19003,19004,19005]}`|
|20|`{"level_range":[20001,20002,20003,20004,20005,20006,20007,20008,20009,20010,20011,20012,20013,20014,20015,20016,20017,20018,20019,20020,20021,20022,20023,20024,20025,20026,20027,20028,20029,20030,20031,20032,20033,20034,20035,20036,20037,20038,20039,20040,20041,20042,20043,20044,20045,20046,20047,20048,20049,20050,20051,20052,20053,20054,20055,20056,20057,20058,20059,20060,20061,20062,20063,20064,20065,20066,20067,20068,20069,20070],"break_range":[20001,20002,20003,20004,20005]}`|

## MasteryLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1400|本表行键；与其他表同值不自动代表同一对象。|
|chip|number|1400|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_res|array|1400|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|attr|array|1400|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1400行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"cost_res":[[474002,10]],"attr":[[1,3600]]}`|
|1002|`{"cost_res":[[474002,15]],"attr":[[2,1080]]}`|
|1003|`{"cost_res":[[474002,20]],"attr":[[44,936]]}`|

## MasteryConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|cost_res|array|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|unlock_star|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_res":[[101500,500]],"unlock_star":10}`|

## MasteryMat

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|max_break|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_lv|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|474002|`{"max_break":3,"max_lv":40}`|
|475002|`{"max_break":4,"max_lv":60}`|
|476002|`{"max_break":5,"max_lv":70}`|

## MasteryBreak

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|chip|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mastery_break|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|100|本表行键；与其他表同值不自动代表同一对象。|
|cost_res|array|100|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|mastery_level_limit|number|100|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"mastery_break":1,"attr":[[1,8640],[2,1440],[24,864],[25,864]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|1002|`{"mastery_break":2,"attr":[[1,19440],[2,3240],[24,1944],[25,1944]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|1003|`{"mastery_break":3,"attr":[[1,30240],[2,5040],[24,3024],[25,3024]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|1004|`{"mastery_break":4,"attr":[[1,55440],[2,9240],[24,5544],[25,5544]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|1005|`{"mastery_break":5,"attr":[[1,80640],[2,13440],[24,8064],[25,8064]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|2001|`{"mastery_break":1,"attr":[[1,8640],[2,1728],[24,864],[25,864]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|2002|`{"mastery_break":2,"attr":[[1,19440],[2,3888],[24,1944],[25,1944]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|2003|`{"mastery_break":3,"attr":[[1,30240],[2,6048],[24,3024],[25,3024]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|2004|`{"mastery_break":4,"attr":[[1,55440],[2,11088],[24,5544],[25,5544]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|2005|`{"mastery_break":5,"attr":[[1,80640],[2,16128],[24,8064],[25,8064]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|3001|`{"mastery_break":1,"attr":[[1,9504],[2,1296],[24,960],[25,960]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|3002|`{"mastery_break":2,"attr":[[1,21384],[2,2916],[24,2160],[25,2160]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|3003|`{"mastery_break":3,"attr":[[1,33264],[2,4536],[24,3360],[25,3360]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|3004|`{"mastery_break":4,"attr":[[1,60984],[2,8316],[24,6160],[25,6160]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|3005|`{"mastery_break":5,"attr":[[1,88704],[2,12096],[24,8960],[25,8960]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|4001|`{"mastery_break":1,"attr":[[1,9072],[2,1344],[24,960],[25,960]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|4002|`{"mastery_break":2,"attr":[[1,20412],[2,3024],[24,2160],[25,2160]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|4003|`{"mastery_break":3,"attr":[[1,31752],[2,4704],[24,3360],[25,3360]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|4004|`{"mastery_break":4,"attr":[[1,58212],[2,8624],[24,6160],[25,6160]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|4005|`{"mastery_break":5,"attr":[[1,84672],[2,12544],[24,8960],[25,8960]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|5001|`{"mastery_break":1,"attr":[[1,8640],[2,1440],[24,864],[25,864]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|5002|`{"mastery_break":2,"attr":[[1,19440],[2,3240],[24,1944],[25,1944]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|5003|`{"mastery_break":3,"attr":[[1,30240],[2,5040],[24,3024],[25,3024]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|5004|`{"mastery_break":4,"attr":[[1,55440],[2,9240],[24,5544],[25,5544]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|5005|`{"mastery_break":5,"attr":[[1,80640],[2,13440],[24,8064],[25,8064]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|6001|`{"mastery_break":1,"attr":[[1,8640],[2,1728],[24,864],[25,864]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|6002|`{"mastery_break":2,"attr":[[1,19440],[2,3888],[24,1944],[25,1944]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|6003|`{"mastery_break":3,"attr":[[1,30240],[2,6048],[24,3024],[25,3024]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|6004|`{"mastery_break":4,"attr":[[1,55440],[2,11088],[24,5544],[25,5544]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|6005|`{"mastery_break":5,"attr":[[1,80640],[2,16128],[24,8064],[25,8064]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|7001|`{"mastery_break":1,"attr":[[1,9504],[2,1296],[24,960],[25,960]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|7002|`{"mastery_break":2,"attr":[[1,21384],[2,2916],[24,2160],[25,2160]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|7003|`{"mastery_break":3,"attr":[[1,33264],[2,4536],[24,3360],[25,3360]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|7004|`{"mastery_break":4,"attr":[[1,60984],[2,8316],[24,6160],[25,6160]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|7005|`{"mastery_break":5,"attr":[[1,88704],[2,12096],[24,8960],[25,8960]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|8001|`{"mastery_break":1,"attr":[[1,9072],[2,1344],[24,960],[25,960]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|8002|`{"mastery_break":2,"attr":[[1,20412],[2,3024],[24,2160],[25,2160]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|8003|`{"mastery_break":3,"attr":[[1,31752],[2,4704],[24,3360],[25,3360]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|8004|`{"mastery_break":4,"attr":[[1,58212],[2,8624],[24,6160],[25,6160]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|8005|`{"mastery_break":5,"attr":[[1,84672],[2,12544],[24,8960],[25,8960]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|9001|`{"mastery_break":1,"attr":[[1,34560],[2,5760],[24,3456],[25,3456]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|9002|`{"mastery_break":2,"attr":[[1,77760],[2,12960],[24,7776],[25,7776]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|9003|`{"mastery_break":3,"attr":[[1,120960],[2,20160],[24,12096],[25,12096]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|9004|`{"mastery_break":4,"attr":[[1,221760],[2,36960],[24,22176],[25,22176]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|9005|`{"mastery_break":5,"attr":[[1,322560],[2,53760],[24,32256],[25,32256]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|10001|`{"mastery_break":1,"attr":[[1,34560],[2,6912],[24,3456],[25,3456]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|10002|`{"mastery_break":2,"attr":[[1,77760],[2,15552],[24,7776],[25,7776]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|10003|`{"mastery_break":3,"attr":[[1,120960],[2,24192],[24,12096],[25,12096]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|10004|`{"mastery_break":4,"attr":[[1,221760],[2,44352],[24,22176],[25,22176]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|10005|`{"mastery_break":5,"attr":[[1,322560],[2,64512],[24,32256],[25,32256]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|11001|`{"mastery_break":1,"attr":[[1,38016],[2,5184],[24,3840],[25,3840]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|11002|`{"mastery_break":2,"attr":[[1,85536],[2,11664],[24,8640],[25,8640]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|11003|`{"mastery_break":3,"attr":[[1,133056],[2,18144],[24,13440],[25,13440]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|11004|`{"mastery_break":4,"attr":[[1,243936],[2,33264],[24,24640],[25,24640]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|11005|`{"mastery_break":5,"attr":[[1,354816],[2,48384],[24,35840],[25,35840]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|12001|`{"mastery_break":1,"attr":[[1,36288],[2,5376],[24,3840],[25,3840]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|12002|`{"mastery_break":2,"attr":[[1,81648],[2,12096],[24,8640],[25,8640]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|12003|`{"mastery_break":3,"attr":[[1,127008],[2,18816],[24,13440],[25,13440]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|12004|`{"mastery_break":4,"attr":[[1,232848],[2,34496],[24,24640],[25,24640]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|12005|`{"mastery_break":5,"attr":[[1,338688],[2,50176],[24,35840],[25,35840]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|13001|`{"mastery_break":1,"attr":[[1,86400],[2,14400],[24,8640],[25,8640]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|13002|`{"mastery_break":2,"attr":[[1,194400],[2,32400],[24,19440],[25,19440]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|13003|`{"mastery_break":3,"attr":[[1,302400],[2,50400],[24,30240],[25,30240]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|13004|`{"mastery_break":4,"attr":[[1,554400],[2,92400],[24,55440],[25,55440]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|13005|`{"mastery_break":5,"attr":[[1,806400],[2,134400],[24,80640],[25,80640]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|14001|`{"mastery_break":1,"attr":[[1,86400],[2,17280],[24,8640],[25,8640]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|14002|`{"mastery_break":2,"attr":[[1,194400],[2,38880],[24,19440],[25,19440]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|14003|`{"mastery_break":3,"attr":[[1,302400],[2,60480],[24,30240],[25,30240]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|14004|`{"mastery_break":4,"attr":[[1,554400],[2,110880],[24,55440],[25,55440]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|14005|`{"mastery_break":5,"attr":[[1,806400],[2,161280],[24,80640],[25,80640]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|15001|`{"mastery_break":1,"attr":[[1,95040],[2,12960],[24,9600],[25,9600]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|15002|`{"mastery_break":2,"attr":[[1,213840],[2,29160],[24,21600],[25,21600]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|15003|`{"mastery_break":3,"attr":[[1,332640],[2,45360],[24,33600],[25,33600]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|15004|`{"mastery_break":4,"attr":[[1,609840],[2,83160],[24,61600],[25,61600]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|15005|`{"mastery_break":5,"attr":[[1,887040],[2,120960],[24,89600],[25,89600]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|16001|`{"mastery_break":1,"attr":[[1,90720],[2,13440],[24,9600],[25,9600]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|16002|`{"mastery_break":2,"attr":[[1,204120],[2,30240],[24,21600],[25,21600]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|16003|`{"mastery_break":3,"attr":[[1,317520],[2,47040],[24,33600],[25,33600]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|16004|`{"mastery_break":4,"attr":[[1,582120],[2,86240],[24,61600],[25,61600]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|16005|`{"mastery_break":5,"attr":[[1,846720],[2,125440],[24,89600],[25,89600]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|17001|`{"mastery_break":1,"attr":[[1,103680],[2,17280],[24,10368],[25,10368]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|17002|`{"mastery_break":2,"attr":[[1,233280],[2,38880],[24,23328],[25,23328]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|17003|`{"mastery_break":3,"attr":[[1,362880],[2,60480],[24,36288],[25,36288]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|17004|`{"mastery_break":4,"attr":[[1,665280],[2,110880],[24,66528],[25,66528]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|17005|`{"mastery_break":5,"attr":[[1,967680],[2,161280],[24,96768],[25,96768]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|18001|`{"mastery_break":1,"attr":[[1,103680],[2,20736],[24,10368],[25,10368]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|18002|`{"mastery_break":2,"attr":[[1,233280],[2,46656],[24,23328],[25,23328]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|18003|`{"mastery_break":3,"attr":[[1,362880],[2,72576],[24,36288],[25,36288]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|18004|`{"mastery_break":4,"attr":[[1,665280],[2,133056],[24,66528],[25,66528]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|18005|`{"mastery_break":5,"attr":[[1,967680],[2,193536],[24,96768],[25,96768]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|19001|`{"mastery_break":1,"attr":[[1,114048],[2,15552],[24,11520],[25,11520]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|19002|`{"mastery_break":2,"attr":[[1,256608],[2,34992],[24,25920],[25,25920]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|19003|`{"mastery_break":3,"attr":[[1,399168],[2,54432],[24,40320],[25,40320]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|19004|`{"mastery_break":4,"attr":[[1,731808],[2,99792],[24,73920],[25,73920]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|19005|`{"mastery_break":5,"attr":[[1,1064448],[2,145152],[24,107520],[25,107520]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|
|20001|`{"mastery_break":1,"attr":[[1,108864],[2,16128],[24,11520],[25,11520]],"cost_res":[[476002,3]],"mastery_level_limit":10}`|
|20002|`{"mastery_break":2,"attr":[[1,244944],[2,36288],[24,25920],[25,25920]],"cost_res":[[476002,6]],"mastery_level_limit":20}`|
|20003|`{"mastery_break":3,"attr":[[1,381024],[2,56448],[24,40320],[25,40320]],"cost_res":[[476002,12]],"mastery_level_limit":30}`|
|20004|`{"mastery_break":4,"attr":[[1,698544],[2,103488],[24,73920],[25,73920]],"cost_res":[[476002,24]],"mastery_level_limit":50}`|
|20005|`{"mastery_break":5,"attr":[[1,1016064],[2,150528],[24,107520],[25,107520]],"cost_res":[[476002,50]],"mastery_level_limit":70}`|

## Mastery

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|77|本表行键；与其他表同值不自动代表同一对象。|
|mastery_group|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"mastery_group":4}`|
|1010201|`{"mastery_group":1}`|
|1020101|`{"mastery_group":8}`|
|1020201|`{"mastery_group":6}`|
|1020301|`{"mastery_group":6}`|
|1020401|`{"mastery_group":7}`|
|1020501|`{"mastery_group":7}`|
|1020601|`{"mastery_group":7}`|
|1030101|`{"mastery_group":11}`|
|1030201|`{"mastery_group":12}`|
|1030301|`{"mastery_group":10}`|
|1030401|`{"mastery_group":12}`|
|1030501|`{"mastery_group":11}`|
|1030601|`{"mastery_group":10}`|
|1030701|`{"mastery_group":11}`|
|1040101|`{"mastery_group":16}`|
|1040201|`{"mastery_group":15}`|
|1040301|`{"mastery_group":16}`|
|2010101|`{"mastery_group":2}`|
|2010201|`{"mastery_group":2}`|
|2020101|`{"mastery_group":7}`|
|2020201|`{"mastery_group":6}`|
|2020301|`{"mastery_group":5}`|
|2020401|`{"mastery_group":5}`|
|2020501|`{"mastery_group":8}`|
|2020601|`{"mastery_group":5}`|
|2030101|`{"mastery_group":12}`|
|2030201|`{"mastery_group":9}`|
|2030301|`{"mastery_group":9}`|
|2030401|`{"mastery_group":9}`|
|2030501|`{"mastery_group":9}`|
|2030601|`{"mastery_group":12}`|
|2030701|`{"mastery_group":9}`|
|2040101|`{"mastery_group":13}`|
|2040201|`{"mastery_group":14}`|
|3010101|`{"mastery_group":1}`|
|3010201|`{"mastery_group":4}`|
|3010301|`{"mastery_group":1}`|
|3020101|`{"mastery_group":7}`|
|3020201|`{"mastery_group":8}`|
|3020301|`{"mastery_group":7}`|
|3020401|`{"mastery_group":7}`|
|3020501|`{"mastery_group":5}`|
|3030201|`{"mastery_group":11}`|
|3030301|`{"mastery_group":10}`|
|3030401|`{"mastery_group":11}`|
|3030501|`{"mastery_group":9}`|
|3030601|`{"mastery_group":10}`|
|3030701|`{"mastery_group":10}`|
|3040101|`{"mastery_group":13}`|
|3040201|`{"mastery_group":14}`|
|4010101|`{"mastery_group":2}`|
|4010201|`{"mastery_group":3}`|
|4010301|`{"mastery_group":4}`|
|4020101|`{"mastery_group":8}`|
|4020201|`{"mastery_group":5}`|
|4020301|`{"mastery_group":5}`|
|4020401|`{"mastery_group":8}`|
|4020501|`{"mastery_group":5}`|
|4030101|`{"mastery_group":12}`|
|4030201|`{"mastery_group":12}`|
|4030301|`{"mastery_group":10}`|
|4030401|`{"mastery_group":12}`|
|4030501|`{"mastery_group":10}`|
|4030601|`{"mastery_group":12}`|
|4030801|`{"mastery_group":12}`|
|4040101|`{"mastery_group":14}`|
|4040201|`{"mastery_group":9}`|
|4040301|`{"mastery_group":14}`|
|4040401|`{"mastery_group":16}`|
|5040101|`{"mastery_group":17}`|
|5040201|`{"mastery_group":16}`|
|5040301|`{"mastery_group":17}`|
|5040401|`{"mastery_group":20}`|
|5040501|`{"mastery_group":19}`|
|5040601|`{"mastery_group":18}`|
|5040701|`{"mastery_group":17}`|

## Develop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|lua_interface|object|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_parse_interface|object|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|6|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|

## DevelopInfoShare

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|share_type|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|share_chat_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"share_type":[1,2,8,9,10],"share_chat_type":2}`|

## ExchangeParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|add_score|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|change_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"add_score":30,"max_num":1500,"change_num":10}`|

## ExchangeCost

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|res|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_cost|number|3|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|light_dark_cost|number|3|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|15|`{"normal_cost":25,"light_dark_cost":35}`|
|16|`{"normal_cost":35,"light_dark_cost":45}`|
|17|`{"normal_cost":45,"light_dark_cost":55}`|

## ExchangeLib

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## DevelopConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hero_lv_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|keep_trial_type|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero_lv_rate":1,"keep_trial_type":[6702]}`|

## UpStarCost

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|piece_num|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|compose_need_num|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_need_num|number|50|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|stone_num|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|50|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3000|`{"piece_num":5,"compose_need_num":20,"max_need_num":2220,"stone_num":0}`|
|3001|`{"piece_num":5,"compose_need_num":20,"max_need_num":2190,"stone_num":0}`|
|3002|`{"piece_num":10,"compose_need_num":20,"max_need_num":2160,"stone_num":0}`|
|3003|`{"piece_num":15,"compose_need_num":20,"max_need_num":2100,"stone_num":0}`|
|3004|`{"piece_num":25,"compose_need_num":20,"max_need_num":1590,"stone_num":0}`|
|3005|`{"piece_num":240,"compose_need_num":20,"max_need_num":1440,"stone_num":2}`|
|3006|`{"piece_num":240,"compose_need_num":20,"max_need_num":1200,"stone_num":2}`|
|3007|`{"piece_num":240,"compose_need_num":20,"max_need_num":960,"stone_num":3}`|
|3008|`{"piece_num":360,"compose_need_num":20,"max_need_num":720,"stone_num":4}`|
|3009|`{"piece_num":360,"compose_need_num":20,"max_need_num":360,"stone_num":5}`|
|4000|`{"piece_num":10,"compose_need_num":30,"max_need_num":2190,"stone_num":0}`|
|4001|`{"piece_num":10,"compose_need_num":30,"max_need_num":2130,"stone_num":0}`|
|4002|`{"piece_num":15,"compose_need_num":30,"max_need_num":2070,"stone_num":0}`|
|4003|`{"piece_num":20,"compose_need_num":30,"max_need_num":1980,"stone_num":0}`|
|4004|`{"piece_num":30,"compose_need_num":30,"max_need_num":1620,"stone_num":0}`|
|4005|`{"piece_num":240,"compose_need_num":30,"max_need_num":1440,"stone_num":2}`|
|4006|`{"piece_num":240,"compose_need_num":30,"max_need_num":1200,"stone_num":2}`|
|4007|`{"piece_num":240,"compose_need_num":30,"max_need_num":960,"stone_num":3}`|
|4008|`{"piece_num":360,"compose_need_num":30,"max_need_num":720,"stone_num":4}`|
|4009|`{"piece_num":360,"compose_need_num":30,"max_need_num":360,"stone_num":5}`|
|5000|`{"piece_num":10,"compose_need_num":60,"max_need_num":1500,"stone_num":0}`|
|5001|`{"piece_num":10,"compose_need_num":60,"max_need_num":1440,"stone_num":0}`|
|5002|`{"piece_num":20,"compose_need_num":60,"max_need_num":1380,"stone_num":0}`|
|5003|`{"piece_num":30,"compose_need_num":60,"max_need_num":1260,"stone_num":0}`|
|5004|`{"piece_num":40,"compose_need_num":60,"max_need_num":1080,"stone_num":0}`|
|5005|`{"piece_num":120,"compose_need_num":60,"max_need_num":840,"stone_num":2}`|
|5006|`{"piece_num":120,"compose_need_num":60,"max_need_num":720,"stone_num":2}`|
|5007|`{"piece_num":180,"compose_need_num":60,"max_need_num":600,"stone_num":3}`|
|5008|`{"piece_num":180,"compose_need_num":60,"max_need_num":420,"stone_num":4}`|
|5009|`{"piece_num":240,"compose_need_num":60,"max_need_num":240,"stone_num":5}`|
|6000|`{"piece_num":10,"compose_need_num":80,"max_need_num":1940,"stone_num":0}`|
|6001|`{"piece_num":10,"compose_need_num":80,"max_need_num":1880,"stone_num":0}`|
|6002|`{"piece_num":20,"compose_need_num":80,"max_need_num":1820,"stone_num":0}`|
|6003|`{"piece_num":30,"compose_need_num":80,"max_need_num":1700,"stone_num":0}`|
|6004|`{"piece_num":40,"compose_need_num":80,"max_need_num":1520,"stone_num":0}`|
|6005|`{"piece_num":160,"compose_need_num":80,"max_need_num":1280,"stone_num":2}`|
|6006|`{"piece_num":160,"compose_need_num":80,"max_need_num":1120,"stone_num":2}`|
|6007|`{"piece_num":240,"compose_need_num":80,"max_need_num":960,"stone_num":3}`|
|6008|`{"piece_num":320,"compose_need_num":80,"max_need_num":720,"stone_num":4}`|
|6009|`{"piece_num":400,"compose_need_num":80,"max_need_num":400,"stone_num":5}`|
|7000|`{"piece_num":10,"compose_need_num":80,"max_need_num":1940,"stone_num":0}`|
|7001|`{"piece_num":10,"compose_need_num":80,"max_need_num":1880,"stone_num":0}`|
|7002|`{"piece_num":20,"compose_need_num":80,"max_need_num":1820,"stone_num":0}`|
|7003|`{"piece_num":30,"compose_need_num":80,"max_need_num":1700,"stone_num":0}`|
|7004|`{"piece_num":40,"compose_need_num":80,"max_need_num":1520,"stone_num":0}`|
|7005|`{"piece_num":160,"compose_need_num":80,"max_need_num":1280,"stone_num":5}`|
|7006|`{"piece_num":160,"compose_need_num":80,"max_need_num":1120,"stone_num":5}`|
|7007|`{"piece_num":240,"compose_need_num":80,"max_need_num":960,"stone_num":10}`|
|7008|`{"piece_num":320,"compose_need_num":80,"max_need_num":720,"stone_num":10}`|
|7009|`{"piece_num":400,"compose_need_num":80,"max_need_num":400,"stone_num":20}`|

## UpStarStone

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|item|array|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1030|`{"item":[650002,651002,22002]}`|
|1040|`{"item":[649002,651002,22002]}`|
|1050|`{"item":[651002,22002]}`|
|1060|`{"item":[651002,22002]}`|
|2030|`{"item":[650002,652002,22002]}`|
|2040|`{"item":[649002,652002,22002]}`|
|2050|`{"item":[652002,22002]}`|
|2060|`{"item":[652002,22002]}`|
|3030|`{"item":[650002,653002,22002]}`|
|3040|`{"item":[649002,653002,22002]}`|
|3050|`{"item":[653002,22002]}`|
|3060|`{"item":[653002,22002]}`|
|4030|`{"item":[650002,654002,22002]}`|
|4040|`{"item":[649002,654002,22002]}`|
|4050|`{"item":[654002,22002]}`|
|4060|`{"item":[654002,22002]}`|
|9030|`{"item":[650002,821502,22002]}`|
|9040|`{"item":[649002,821502,22002]}`|
|9050|`{"item":[821502,22002]}`|
|9060|`{"item":[821502,22002]}`|
|9070|`{"item":[821502,22002]}`|

## UpLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|is_up_stage|boolean|299|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|299|本表行键；与其他表同值不自动代表同一对象。|
|cost_item|array|299|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_up_stage":false,"cost_item":[[101800,110]]}`|
|2|`{"is_up_stage":false,"cost_item":[[101800,150]]}`|
|3|`{"is_up_stage":false,"cost_item":[[101800,190]]}`|
|4|`{"is_up_stage":false,"cost_item":[[101800,230]]}`|
|5|`{"is_up_stage":false,"cost_item":[[101800,270]]}`|
|6|`{"is_up_stage":false,"cost_item":[[101800,320]]}`|
|7|`{"is_up_stage":false,"cost_item":[[101800,360]]}`|
|8|`{"is_up_stage":false,"cost_item":[[101800,400]]}`|
|9|`{"is_up_stage":false,"cost_item":[[101800,440]]}`|
|10|`{"is_up_stage":false,"cost_item":[[101800,480]]}`|
|11|`{"is_up_stage":false,"cost_item":[[101800,530]]}`|
|12|`{"is_up_stage":false,"cost_item":[[101800,570]]}`|
|13|`{"is_up_stage":false,"cost_item":[[101800,610]]}`|
|14|`{"is_up_stage":false,"cost_item":[[101800,660]]}`|
|15|`{"is_up_stage":false,"cost_item":[[101800,700]]}`|
|16|`{"is_up_stage":false,"cost_item":[[101800,740]]}`|
|17|`{"is_up_stage":false,"cost_item":[[101800,780]]}`|
|18|`{"is_up_stage":false,"cost_item":[[101800,830]]}`|
|19|`{"is_up_stage":false,"cost_item":[[101800,870]]}`|
|20|`{"is_up_stage":false,"cost_item":[[101800,910]]}`|
|21|`{"is_up_stage":false,"cost_item":[[101800,960]]}`|
|22|`{"is_up_stage":false,"cost_item":[[101800,1010]]}`|
|23|`{"is_up_stage":false,"cost_item":[[101800,1540]]}`|
|24|`{"is_up_stage":false,"cost_item":[[101800,2080]]}`|
|25|`{"is_up_stage":false,"cost_item":[[101800,2610]]}`|
|26|`{"is_up_stage":false,"cost_item":[[101800,3150]]}`|
|27|`{"is_up_stage":false,"cost_item":[[101800,3680]]}`|
|28|`{"is_up_stage":false,"cost_item":[[101800,4220]]}`|
|29|`{"is_up_stage":false,"cost_item":[[101800,4750]]}`|
|30|`{"is_up_stage":false,"cost_item":[[101800,5290]]}`|
|31|`{"is_up_stage":false,"cost_item":[[101800,5880]]}`|
|32|`{"is_up_stage":false,"cost_item":[[101800,6420]]}`|
|33|`{"is_up_stage":false,"cost_item":[[101800,6960]]}`|
|34|`{"is_up_stage":false,"cost_item":[[101800,7500]]}`|
|35|`{"is_up_stage":false,"cost_item":[[101800,8040]]}`|
|36|`{"is_up_stage":false,"cost_item":[[101800,8580]]}`|
|37|`{"is_up_stage":false,"cost_item":[[101800,9120]]}`|
|38|`{"is_up_stage":false,"cost_item":[[101800,9660]]}`|
|39|`{"is_up_stage":false,"cost_item":[[101800,10200]]}`|
|40|`{"is_up_stage":false,"cost_item":[[101800,10700]]}`|
|41|`{"is_up_stage":false,"cost_item":[[101800,11400]]}`|
|42|`{"is_up_stage":false,"cost_item":[[101800,11900]]}`|
|43|`{"is_up_stage":false,"cost_item":[[101800,12500]]}`|
|44|`{"is_up_stage":false,"cost_item":[[101800,13000]]}`|
|45|`{"is_up_stage":false,"cost_item":[[101800,13600]]}`|
|46|`{"is_up_stage":false,"cost_item":[[101800,14100]]}`|
|47|`{"is_up_stage":false,"cost_item":[[101800,14600]]}`|
|48|`{"is_up_stage":false,"cost_item":[[101800,15200]]}`|
|49|`{"is_up_stage":false,"cost_item":[[101800,15700]]}`|
|50|`{"is_up_stage":false,"cost_item":[[101800,17500]]}`|
|51|`{"is_up_stage":false,"cost_item":[[101800,19400]]}`|
|52|`{"is_up_stage":false,"cost_item":[[101800,23100]]}`|
|53|`{"is_up_stage":false,"cost_item":[[101800,27100]]}`|
|54|`{"is_up_stage":false,"cost_item":[[101800,31400]]}`|
|55|`{"is_up_stage":false,"cost_item":[[101800,36100]]}`|
|56|`{"is_up_stage":false,"cost_item":[[101800,41000]]}`|
|57|`{"is_up_stage":false,"cost_item":[[101800,46300]]}`|
|58|`{"is_up_stage":false,"cost_item":[[101800,51900]]}`|
|59|`{"is_up_stage":false,"cost_item":[[101800,57800]]}`|
|60|`{"is_up_stage":false,"cost_item":[[101800,64100]]}`|
|61|`{"is_up_stage":false,"cost_item":[[101800,70600]]}`|
|62|`{"is_up_stage":false,"cost_item":[[101800,77500]]}`|
|63|`{"is_up_stage":false,"cost_item":[[101800,84700]]}`|
|64|`{"is_up_stage":false,"cost_item":[[101800,92300]]}`|
|65|`{"is_up_stage":false,"cost_item":[[101800,100000]]}`|
|66|`{"is_up_stage":false,"cost_item":[[101800,108000]]}`|
|67|`{"is_up_stage":false,"cost_item":[[101800,117000]]}`|
|68|`{"is_up_stage":false,"cost_item":[[101800,126000]]}`|
|69|`{"is_up_stage":false,"cost_item":[[101800,135000]]}`|
|70|`{"is_up_stage":false,"cost_item":[[101800,144000]]}`|
|71|`{"is_up_stage":false,"cost_item":[[101800,154000]]}`|
|72|`{"is_up_stage":false,"cost_item":[[101800,164000]]}`|
|73|`{"is_up_stage":false,"cost_item":[[101800,174000]]}`|
|74|`{"is_up_stage":false,"cost_item":[[101800,185000]]}`|
|75|`{"is_up_stage":false,"cost_item":[[101800,196000]]}`|
|76|`{"is_up_stage":false,"cost_item":[[101800,208000]]}`|
|77|`{"is_up_stage":false,"cost_item":[[101800,219000]]}`|
|78|`{"is_up_stage":false,"cost_item":[[101800,231000]]}`|
|79|`{"is_up_stage":false,"cost_item":[[101800,244000]]}`|
|80|`{"is_up_stage":false,"cost_item":[[101800,259000]]}`|
|81|`{"is_up_stage":false,"cost_item":[[101800,276000]]}`|
|82|`{"is_up_stage":false,"cost_item":[[101800,292000]]}`|
|83|`{"is_up_stage":false,"cost_item":[[101800,310000]]}`|
|84|`{"is_up_stage":false,"cost_item":[[101800,328000]]}`|
|85|`{"is_up_stage":false,"cost_item":[[101800,346000]]}`|
|86|`{"is_up_stage":false,"cost_item":[[101800,365000]]}`|
|87|`{"is_up_stage":false,"cost_item":[[101800,384000]]}`|
|88|`{"is_up_stage":false,"cost_item":[[101800,403000]]}`|
|89|`{"is_up_stage":false,"cost_item":[[101800,424000]]}`|
|90|`{"is_up_stage":false,"cost_item":[[101800,444000]]}`|
|91|`{"is_up_stage":false,"cost_item":[[101800,465000]]}`|
|92|`{"is_up_stage":false,"cost_item":[[101800,487000]]}`|
|93|`{"is_up_stage":false,"cost_item":[[101800,509000]]}`|
|94|`{"is_up_stage":false,"cost_item":[[101800,532000]]}`|
|95|`{"is_up_stage":false,"cost_item":[[101800,555000]]}`|
|96|`{"is_up_stage":false,"cost_item":[[101800,578000]]}`|
|97|`{"is_up_stage":false,"cost_item":[[101800,602000]]}`|
|98|`{"is_up_stage":false,"cost_item":[[101800,627000]]}`|
|99|`{"is_up_stage":false,"cost_item":[[101800,652000]]}`|
|100|`{"is_up_stage":false,"cost_item":[[101800,677000]]}`|
|101|`{"is_up_stage":false,"cost_item":[[101800,703000]]}`|
|102|`{"is_up_stage":false,"cost_item":[[101800,729000]]}`|
|103|`{"is_up_stage":false,"cost_item":[[101800,756000]]}`|
|104|`{"is_up_stage":false,"cost_item":[[101800,784000]]}`|
|105|`{"is_up_stage":false,"cost_item":[[101800,811000]]}`|
|106|`{"is_up_stage":false,"cost_item":[[101800,840000]]}`|
|107|`{"is_up_stage":false,"cost_item":[[101800,869000]]}`|
|108|`{"is_up_stage":false,"cost_item":[[101800,898000]]}`|
|109|`{"is_up_stage":false,"cost_item":[[101800,928000]]}`|
|110|`{"is_up_stage":false,"cost_item":[[101800,958000]]}`|
|111|`{"is_up_stage":false,"cost_item":[[101800,989000]]}`|
|112|`{"is_up_stage":false,"cost_item":[[101800,1020000]]}`|
|113|`{"is_up_stage":false,"cost_item":[[101800,1051000]]}`|
|114|`{"is_up_stage":false,"cost_item":[[101800,1084000]]}`|
|115|`{"is_up_stage":false,"cost_item":[[101800,1116000]]}`|
|116|`{"is_up_stage":false,"cost_item":[[101800,1149000]]}`|
|117|`{"is_up_stage":false,"cost_item":[[101800,1183000]]}`|
|118|`{"is_up_stage":false,"cost_item":[[101800,1217000]]}`|
|119|`{"is_up_stage":false,"cost_item":[[101800,1252000]]}`|
|120|`{"is_up_stage":false,"cost_item":[[101800,1287000]]}`|
|121|`{"is_up_stage":false,"cost_item":[[101800,1314000]]}`|
|122|`{"is_up_stage":false,"cost_item":[[101800,1342000]]}`|
|123|`{"is_up_stage":false,"cost_item":[[101800,1370000]]}`|
|124|`{"is_up_stage":false,"cost_item":[[101800,1398000]]}`|
|125|`{"is_up_stage":false,"cost_item":[[101800,1426000]]}`|
|126|`{"is_up_stage":false,"cost_item":[[101800,1454000]]}`|
|127|`{"is_up_stage":false,"cost_item":[[101800,1483000]]}`|
|128|`{"is_up_stage":false,"cost_item":[[101800,1512000]]}`|
|129|`{"is_up_stage":false,"cost_item":[[101800,1542000]]}`|
|130|`{"is_up_stage":false,"cost_item":[[101800,1571000]]}`|
|131|`{"is_up_stage":false,"cost_item":[[101800,1601000]]}`|
|132|`{"is_up_stage":false,"cost_item":[[101800,1631000]]}`|
|133|`{"is_up_stage":false,"cost_item":[[101800,1661000]]}`|
|134|`{"is_up_stage":false,"cost_item":[[101800,1692000]]}`|
|135|`{"is_up_stage":false,"cost_item":[[101800,1722000]]}`|
|136|`{"is_up_stage":false,"cost_item":[[101800,1753000]]}`|
|137|`{"is_up_stage":false,"cost_item":[[101800,1785000]]}`|
|138|`{"is_up_stage":false,"cost_item":[[101800,1816000]]}`|
|139|`{"is_up_stage":false,"cost_item":[[101800,1848000]]}`|
|140|`{"is_up_stage":false,"cost_item":[[101800,1880000]]}`|
|141|`{"is_up_stage":false,"cost_item":[[101800,1912000]]}`|
|142|`{"is_up_stage":false,"cost_item":[[101800,1944000]]}`|
|143|`{"is_up_stage":false,"cost_item":[[101800,1977000]]}`|
|144|`{"is_up_stage":false,"cost_item":[[101800,2010000]]}`|
|145|`{"is_up_stage":false,"cost_item":[[101800,2043000]]}`|
|146|`{"is_up_stage":false,"cost_item":[[101800,2076000]]}`|
|147|`{"is_up_stage":false,"cost_item":[[101800,2110000]]}`|
|148|`{"is_up_stage":false,"cost_item":[[101800,2144000]]}`|
|149|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|150|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|151|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|152|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|153|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|154|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|155|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|156|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|157|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|158|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|159|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|160|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|161|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|162|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|163|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|164|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|165|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|166|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|167|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|168|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|169|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|170|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|171|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|172|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|173|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|174|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|175|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|176|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|177|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|178|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|179|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|180|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|181|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|182|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|183|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|184|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|185|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|186|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|187|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|188|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|189|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|190|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|191|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|192|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|193|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|194|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|195|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|196|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|197|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|198|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|199|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|200|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|201|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|202|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|203|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|204|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|205|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|206|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|207|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|208|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|209|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|210|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|211|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|212|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|213|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|214|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|215|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|216|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|217|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|218|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|219|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|220|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|221|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|222|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|223|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|224|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|225|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|226|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|227|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|228|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|229|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|230|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|231|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|232|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|233|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|234|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|235|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|236|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|237|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|238|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|239|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|240|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|241|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|242|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|243|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|244|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|245|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|246|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|247|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|248|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|249|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|250|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|251|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|252|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|253|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|254|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|255|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|256|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|257|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|258|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|259|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|260|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|261|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|262|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|263|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|264|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|265|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|266|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|267|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|268|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|269|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|270|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|271|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|272|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|273|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|274|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|275|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|276|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|277|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|278|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|279|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|280|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|281|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|282|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|283|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|284|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|285|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|286|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|287|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|288|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|289|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|290|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|291|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|292|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|293|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|294|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|295|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|296|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|297|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|298|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|
|299|`{"is_up_stage":false,"cost_item":[[101800,2178000]]}`|

## UpStageTalent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|potential_skill|number|3927|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|3927|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|number|3927|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|3927|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3927|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|3927|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部3927行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101010100|`{"potential_skill":0,"skill":0,"attr":[]}`|
|101010101|`{"potential_skill":120001005,"skill":0,"attr":[]}`|
|101010102|`{"potential_skill":0,"skill":0,"attr":[[5,500]]}`|

## UpStage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost_item|array|50|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|50|本表行键；与其他表同值不自动代表同一对象。|
|need_hero_lv|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"cost_item":[[201500,3000],[122802,2]],"need_hero_lv":1}`|
|1|`{"cost_item":[[201500,6000],[123002,5],[123102,5]],"need_hero_lv":17}`|
|2|`{"cost_item":[[201500,12000],[123202,10],[123302,10],[123402,10]],"need_hero_lv":22}`|
|3|`{"cost_item":[[201500,24000],[123602,20],[123702,20],[123802,10],[123902,10]],"need_hero_lv":26}`|
|4|`{"cost_item":[[201500,48000],[124002,40],[124102,40],[124202,20],[124302,20]],"need_hero_lv":35}`|
|5|`{"cost_item":[[201500,84000],[124402,50],[124502,50],[124602,30],[124702,30]],"need_hero_lv":45}`|
|6|`{"cost_item":[[201500,120000],[124802,60],[124902,60],[125002,40],[125102,40]],"need_hero_lv":50}`|
|7|`{"cost_item":[[201500,156000],[125202,70],[125302,70],[125402,50],[125502,50]],"need_hero_lv":60}`|
|8|`{"cost_item":[[201500,204000],[125602,80],[125702,80],[125802,60],[125902,60]],"need_hero_lv":65}`|
|9|`{"cost_item":[[201500,252000],[126002,90],[126102,90],[126202,70],[126302,70]],"need_hero_lv":70}`|
|10|`{"cost_item":[[201500,320000],[126402,100],[126502,100],[126602,80],[126702,80]],"need_hero_lv":75}`|
|11|`{"cost_item":[[201500,380000],[126802,110],[126902,110],[127002,90],[127102,90]],"need_hero_lv":80}`|
|12|`{"cost_item":[[201500,440000],[127202,120],[127302,120],[127402,100],[127502,100]],"need_hero_lv":85}`|
|13|`{"cost_item":[[201500,500000],[127602,130],[127702,130],[127802,110],[127902,110]],"need_hero_lv":90}`|
|14|`{"cost_item":[[201500,560000],[128002,140],[128102,140],[128202,120],[128302,120]],"need_hero_lv":95}`|
|15|`{"cost_item":[[201500,620000],[128402,200],[128502,200],[128602,160],[128702,160]],"need_hero_lv":100}`|
|16|`{"cost_item":[[201500,740000],[128802,260],[128902,260],[129002,220],[129102,220]],"need_hero_lv":105}`|
|17|`{"cost_item":[[201500,900000],[129202,320],[129302,320],[129402,280],[129502,280]],"need_hero_lv":110}`|
|18|`{"cost_item":[[201500,1200000],[129602,380],[129702,380],[129802,340],[129902,340]],"need_hero_lv":115}`|
|19|`{"cost_item":[[201500,1500000],[130002,480],[130102,480],[130202,420],[130302,420]],"need_hero_lv":120}`|
|20|`{"cost_item":[[201500,1500000],[130002,570],[130102,570],[130202,510],[130302,510]],"need_hero_lv":126}`|
|21|`{"cost_item":[[201500,1500000],[130002,570],[130102,570],[130202,510],[130302,510]],"need_hero_lv":132}`|
|22|`{"cost_item":[[201500,1500000],[130002,570],[130102,570],[130202,510],[130302,510]],"need_hero_lv":138}`|
|23|`{"cost_item":[[201500,1500000],[130002,570],[130102,570],[130202,510],[130302,510]],"need_hero_lv":144}`|
|24|`{"cost_item":[[201500,1500000],[130002,570],[130102,570],[130202,510],[130302,510]],"need_hero_lv":150}`|
|25|`{"cost_item":[[201500,3000000],[130002,1000],[130102,1000],[130202,1000],[130302,1000]],"need_hero_lv":156}`|
|26|`{"cost_item":[[201500,4500000],[130002,1500],[130102,1500],[130202,1500],[130302,1500]],"need_hero_lv":162}`|
|27|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":168}`|
|28|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":174}`|
|29|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":180}`|
|30|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":186}`|
|31|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":192}`|
|32|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":198}`|
|33|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":204}`|
|34|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":210}`|
|35|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":216}`|
|36|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":222}`|
|37|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":228}`|
|38|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":234}`|
|39|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":240}`|
|40|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":246}`|
|41|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":252}`|
|42|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":258}`|
|43|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":264}`|
|44|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":270}`|
|45|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":276}`|
|46|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":282}`|
|47|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":288}`|
|48|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":294}`|
|49|`{"cost_item":[[201500,4500000],[130002,2000],[130102,2000],[130202,2000],[130302,2000]],"need_hero_lv":300}`|

## TrialTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|180|本表行键；与其他表同值不自动代表同一对象。|
|task|array|180|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101010130|`{"task":[[6702,3]]}`|
|101010140|`{"task":[[6702,4]]}`|
|101010150|`{"task":[[6702,5]]}`|
|101020130|`{"task":[[6702,3]]}`|
|101020140|`{"task":[[6702,4]]}`|
|101020150|`{"task":[[6702,5]]}`|
|102010130|`{"task":[[6702,3]]}`|
|102010140|`{"task":[[6702,4]]}`|
|102010150|`{"task":[[6702,5]]}`|
|102020130|`{"task":[[6702,3]]}`|
|102020140|`{"task":[[6702,4]]}`|
|102020150|`{"task":[[6702,5]]}`|
|102030130|`{"task":[[6702,3]]}`|
|102030140|`{"task":[[6702,4]]}`|
|102030150|`{"task":[[6702,5]]}`|
|102040130|`{"task":[[6702,3]]}`|
|102040140|`{"task":[[6702,4]]}`|
|102040150|`{"task":[[6702,5]]}`|
|102050130|`{"task":[[6702,3]]}`|
|102050140|`{"task":[[6702,4]]}`|
|102050150|`{"task":[[6702,5]]}`|
|102060130|`{"task":[[6702,3]]}`|
|102060140|`{"task":[[6702,4]]}`|
|102060150|`{"task":[[6702,5]]}`|
|103010130|`{"task":[[6702,3]]}`|
|103010140|`{"task":[[6702,4]]}`|
|103010150|`{"task":[[6702,5]]}`|
|103020130|`{"task":[[6702,3]]}`|
|103020140|`{"task":[[6702,4]]}`|
|103020150|`{"task":[[6702,5]]}`|
|103030130|`{"task":[[6702,3]]}`|
|103030140|`{"task":[[6702,4]]}`|
|103030150|`{"task":[[6702,5]]}`|
|103040130|`{"task":[[6702,3]]}`|
|103040140|`{"task":[[6702,4]]}`|
|103040150|`{"task":[[6702,5]]}`|
|103050130|`{"task":[[6702,3]]}`|
|103050140|`{"task":[[6702,4]]}`|
|103050150|`{"task":[[6702,5]]}`|
|103060130|`{"task":[[6702,3]]}`|
|103060140|`{"task":[[6702,4]]}`|
|103060150|`{"task":[[6702,5]]}`|
|103070130|`{"task":[[6702,3]]}`|
|103070140|`{"task":[[6702,4]]}`|
|103070150|`{"task":[[6702,5]]}`|
|201010130|`{"task":[[6702,3]]}`|
|201010140|`{"task":[[6702,4]]}`|
|201010150|`{"task":[[6702,5]]}`|
|201020130|`{"task":[[6702,3]]}`|
|201020140|`{"task":[[6702,4]]}`|
|201020150|`{"task":[[6702,5]]}`|
|202010130|`{"task":[[6702,3]]}`|
|202010140|`{"task":[[6702,4]]}`|
|202010150|`{"task":[[6702,5]]}`|
|202020130|`{"task":[[6702,3]]}`|
|202020140|`{"task":[[6702,4]]}`|
|202020150|`{"task":[[6702,5]]}`|
|202030130|`{"task":[[6702,3]]}`|
|202030140|`{"task":[[6702,4]]}`|
|202030150|`{"task":[[6702,5]]}`|
|202040130|`{"task":[[6702,3]]}`|
|202040140|`{"task":[[6702,4]]}`|
|202040150|`{"task":[[6702,5]]}`|
|202050130|`{"task":[[6702,3]]}`|
|202050140|`{"task":[[6702,4]]}`|
|202050150|`{"task":[[6702,5]]}`|
|202060130|`{"task":[[6702,3]]}`|
|202060140|`{"task":[[6702,4]]}`|
|202060150|`{"task":[[6702,5]]}`|
|203010130|`{"task":[[6702,3]]}`|
|203010140|`{"task":[[6702,4]]}`|
|203010150|`{"task":[[6702,5]]}`|
|203020130|`{"task":[[6702,3]]}`|
|203020140|`{"task":[[6702,4]]}`|
|203020150|`{"task":[[6702,5]]}`|
|203030130|`{"task":[[6702,3]]}`|
|203030140|`{"task":[[6702,4]]}`|
|203030150|`{"task":[[6702,5]]}`|
|203040130|`{"task":[[6702,3]]}`|
|203040140|`{"task":[[6702,4]]}`|
|203040150|`{"task":[[6702,5]]}`|
|203050130|`{"task":[[6702,3]]}`|
|203050140|`{"task":[[6702,4]]}`|
|203050150|`{"task":[[6702,5]]}`|
|203060130|`{"task":[[6702,3]]}`|
|203060140|`{"task":[[6702,4]]}`|
|203060150|`{"task":[[6702,5]]}`|
|203070130|`{"task":[[6702,3]]}`|
|203070140|`{"task":[[6702,4]]}`|
|203070150|`{"task":[[6702,5]]}`|
|301010130|`{"task":[[6702,3]]}`|
|301010140|`{"task":[[6702,4]]}`|
|301010150|`{"task":[[6702,5]]}`|
|301020130|`{"task":[[6702,3]]}`|
|301020140|`{"task":[[6702,4]]}`|
|301020150|`{"task":[[6702,5]]}`|
|301030130|`{"task":[[6702,3]]}`|
|301030140|`{"task":[[6702,4]]}`|
|301030150|`{"task":[[6702,5]]}`|
|302010130|`{"task":[[6702,3]]}`|
|302010140|`{"task":[[6702,4]]}`|
|302010150|`{"task":[[6702,5]]}`|
|302020130|`{"task":[[6702,3]]}`|
|302020140|`{"task":[[6702,4]]}`|
|302020150|`{"task":[[6702,5]]}`|
|302030130|`{"task":[[6702,3]]}`|
|302030140|`{"task":[[6702,4]]}`|
|302030150|`{"task":[[6702,5]]}`|
|302040130|`{"task":[[6702,3]]}`|
|302040140|`{"task":[[6702,4]]}`|
|302040150|`{"task":[[6702,5]]}`|
|302050130|`{"task":[[6702,3]]}`|
|302050140|`{"task":[[6702,4]]}`|
|302050150|`{"task":[[6702,5]]}`|
|303020130|`{"task":[[6702,3]]}`|
|303020140|`{"task":[[6702,4]]}`|
|303020150|`{"task":[[6702,5]]}`|
|303030130|`{"task":[[6702,3]]}`|
|303030140|`{"task":[[6702,4]]}`|
|303030150|`{"task":[[6702,5]]}`|
|303040130|`{"task":[[6702,3]]}`|
|303040140|`{"task":[[6702,4]]}`|
|303040150|`{"task":[[6702,5]]}`|
|303050130|`{"task":[[6702,3]]}`|
|303050140|`{"task":[[6702,4]]}`|
|303050150|`{"task":[[6702,5]]}`|
|303060130|`{"task":[[6702,3]]}`|
|303060140|`{"task":[[6702,4]]}`|
|303060150|`{"task":[[6702,5]]}`|
|303070130|`{"task":[[6702,3]]}`|
|303070140|`{"task":[[6702,4]]}`|
|303070150|`{"task":[[6702,5]]}`|
|401010130|`{"task":[[6702,3]]}`|
|401010140|`{"task":[[6702,4]]}`|
|401010150|`{"task":[[6702,5]]}`|
|401020130|`{"task":[[6702,3]]}`|
|401020140|`{"task":[[6702,4]]}`|
|401020150|`{"task":[[6702,5]]}`|
|401030130|`{"task":[[6702,3]]}`|
|401030140|`{"task":[[6702,4]]}`|
|401030150|`{"task":[[6702,5]]}`|
|402010130|`{"task":[[6702,3]]}`|
|402010140|`{"task":[[6702,4]]}`|
|402010150|`{"task":[[6702,5]]}`|
|402020130|`{"task":[[6702,3]]}`|
|402020140|`{"task":[[6702,4]]}`|
|402020150|`{"task":[[6702,5]]}`|
|402030130|`{"task":[[6702,3]]}`|
|402030140|`{"task":[[6702,4]]}`|
|402030150|`{"task":[[6702,5]]}`|
|402040130|`{"task":[[6702,3]]}`|
|402040140|`{"task":[[6702,4]]}`|
|402040150|`{"task":[[6702,5]]}`|
|402050130|`{"task":[[6702,3]]}`|
|402050140|`{"task":[[6702,4]]}`|
|402050150|`{"task":[[6702,5]]}`|
|403010130|`{"task":[[6702,3]]}`|
|403010140|`{"task":[[6702,4]]}`|
|403010150|`{"task":[[6702,5]]}`|
|403020130|`{"task":[[6702,3]]}`|
|403020140|`{"task":[[6702,4]]}`|
|403020150|`{"task":[[6702,5]]}`|
|403030130|`{"task":[[6702,3]]}`|
|403030140|`{"task":[[6702,4]]}`|
|403030150|`{"task":[[6702,5]]}`|
|403040130|`{"task":[[6702,3]]}`|
|403040140|`{"task":[[6702,4]]}`|
|403040150|`{"task":[[6702,5]]}`|
|403050130|`{"task":[[6702,3]]}`|
|403050140|`{"task":[[6702,4]]}`|
|403050150|`{"task":[[6702,5]]}`|
|403060130|`{"task":[[6702,3]]}`|
|403060140|`{"task":[[6702,4]]}`|
|403060150|`{"task":[[6702,5]]}`|
|403080130|`{"task":[[6702,3]]}`|
|403080140|`{"task":[[6702,4]]}`|
|403080150|`{"task":[[6702,5]]}`|
|404070130|`{"task":[[6702,3]]}`|
|404070140|`{"task":[[6702,4]]}`|
|404070150|`{"task":[[6702,5]]}`|

## StoryTalk

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|across_story|number|51|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|51|本表行键；与其他表同值不自动代表同一对象。|
|playground_story|number|51|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|invite_story|number|51|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"playground_story":0}`|
|1010201|`{"playground_story":0}`|
|1020101|`{"playground_story":0}`|
|1020201|`{"playground_story":0}`|
|1020301|`{"playground_story":0}`|
|1020401|`{"playground_story":0}`|
|1020501|`{"playground_story":0}`|
|1020601|`{"playground_story":0}`|
|1030101|`{"playground_story":0}`|
|1030201|`{"playground_story":0}`|
|1030301|`{"playground_story":0}`|
|1030401|`{"playground_story":0}`|
|1030501|`{"playground_story":0}`|
|2010101|`{"playground_story":0}`|
|2010201|`{"playground_story":0}`|
|2020101|`{"playground_story":0}`|
|2020201|`{"playground_story":0}`|
|2020301|`{"playground_story":0}`|
|2020401|`{"playground_story":0}`|
|2020501|`{"playground_story":0}`|
|2020601|`{"playground_story":0}`|
|2030101|`{"playground_story":0}`|
|2030201|`{"playground_story":0}`|
|2030301|`{"playground_story":0}`|
|2030401|`{"playground_story":0}`|
|2030501|`{"playground_story":0}`|
|3010101|`{"playground_story":0}`|
|3010201|`{"playground_story":0}`|
|3010301|`{"playground_story":0}`|
|3020101|`{"playground_story":0}`|
|3020201|`{"playground_story":0}`|
|3020301|`{"playground_story":0}`|
|3020401|`{"playground_story":0}`|
|3020501|`{"playground_story":0}`|
|3030201|`{"playground_story":0}`|
|3030301|`{"playground_story":0}`|
|3030401|`{"playground_story":0}`|
|3030501|`{"playground_story":0}`|
|4010101|`{"playground_story":0}`|
|4010201|`{"playground_story":0}`|
|4010301|`{"playground_story":0}`|
|4020101|`{"playground_story":0}`|
|4020201|`{"playground_story":0}`|
|4020301|`{"playground_story":0}`|
|4020401|`{"playground_story":0}`|
|4020501|`{"playground_story":0}`|
|4030101|`{"playground_story":0}`|
|4030201|`{"playground_story":0}`|
|4030301|`{"playground_story":0}`|
|4030401|`{"playground_story":0}`|
|4030501|`{"playground_story":0}`|

## HighStarAddAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|390|本表行键；与其他表同值不自动代表同一对象。|
|hp|number|390|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|magic_def|number|390|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attack|number|390|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|physical_def|number|390|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部390行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101010106|`{"hp":800,"attack":800}`|
|101010107|`{"hp":1600,"attack":1600}`|
|101010108|`{"hp":2400,"attack":2400}`|

## StarAddAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|magic_def|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|magic_def_sum_add|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attack_sum_add|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|physical_def_sum_add|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|97|本表行键；与其他表同值不自动代表同一对象。|
|hp_sum_add|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hp|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attack|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|physical_def|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3000|`{"attack_sum_add":0,"hp_sum_add":0,"hp":0,"attack":0}`|
|3001|`{"attack_sum_add":0,"hp_sum_add":600,"hp":600,"attack":0}`|
|3002|`{"attack_sum_add":100,"hp_sum_add":600,"hp":0,"attack":100}`|
|3003|`{"attack_sum_add":100,"hp_sum_add":600,"hp":0,"attack":0}`|
|3004|`{"attack_sum_add":100,"hp_sum_add":600,"hp":0,"attack":0}`|
|3005|`{"attack_sum_add":100,"hp_sum_add":1200,"hp":600,"attack":0}`|
|4000|`{"attack_sum_add":0,"hp_sum_add":0,"hp":0,"attack":0}`|
|4001|`{"attack_sum_add":0,"hp_sum_add":840,"hp":840,"attack":0}`|
|4002|`{"attack_sum_add":140,"hp_sum_add":840,"hp":0,"attack":140}`|
|4003|`{"attack_sum_add":140,"hp_sum_add":840,"hp":0,"attack":0}`|
|4004|`{"attack_sum_add":140,"hp_sum_add":840,"hp":0,"attack":0}`|
|4005|`{"attack_sum_add":140,"hp_sum_add":1680,"hp":840,"attack":0}`|
|5000|`{"attack_sum_add":0,"hp_sum_add":0,"hp":0,"attack":0}`|
|5001|`{"attack_sum_add":0,"hp_sum_add":2400,"hp":2400,"attack":0}`|
|5002|`{"attack_sum_add":400,"hp_sum_add":2400,"hp":0,"attack":400}`|
|5003|`{"attack_sum_add":400,"hp_sum_add":2400,"hp":0,"attack":0}`|
|5004|`{"attack_sum_add":400,"hp_sum_add":2400,"hp":0,"attack":0}`|
|5005|`{"attack_sum_add":400,"hp_sum_add":4800,"hp":2400,"attack":0}`|
|13000|`{"attack_sum_add":200,"hp_sum_add":1200,"hp":0,"attack":100}`|
|13001|`{"attack_sum_add":200,"hp_sum_add":2400,"hp":1200,"attack":0}`|
|13002|`{"attack_sum_add":400,"hp_sum_add":2400,"hp":0,"attack":200}`|
|13003|`{"attack_sum_add":400,"hp_sum_add":2400,"hp":0,"attack":0}`|
|13004|`{"attack_sum_add":400,"hp_sum_add":2400,"hp":0,"attack":0}`|
|13005|`{"attack_sum_add":400,"hp_sum_add":3600,"hp":1200,"attack":0}`|
|14000|`{"attack_sum_add":280,"hp_sum_add":1680,"hp":0,"attack":140}`|
|14001|`{"attack_sum_add":280,"hp_sum_add":3360,"hp":1680,"attack":0}`|
|14002|`{"attack_sum_add":560,"hp_sum_add":3360,"hp":0,"attack":280}`|
|14003|`{"attack_sum_add":560,"hp_sum_add":3360,"hp":0,"attack":0}`|
|14004|`{"attack_sum_add":560,"hp_sum_add":3360,"hp":0,"attack":0}`|
|14005|`{"attack_sum_add":560,"hp_sum_add":5040,"hp":1680,"attack":0}`|
|15000|`{"attack_sum_add":800,"hp_sum_add":4800,"hp":0,"attack":400}`|
|15001|`{"attack_sum_add":800,"hp_sum_add":9600,"hp":4800,"attack":0}`|
|15002|`{"attack_sum_add":1600,"hp_sum_add":9600,"hp":0,"attack":800}`|
|15003|`{"attack_sum_add":1600,"hp_sum_add":9600,"hp":0,"attack":0}`|
|15004|`{"attack_sum_add":1600,"hp_sum_add":9600,"hp":0,"attack":0}`|
|15005|`{"attack_sum_add":1600,"hp_sum_add":14400,"hp":4800,"attack":0}`|
|23000|`{"attack_sum_add":600,"hp_sum_add":3600,"hp":0,"attack":200}`|
|23001|`{"attack_sum_add":600,"hp_sum_add":5400,"hp":1800,"attack":0}`|
|23002|`{"attack_sum_add":900,"hp_sum_add":5400,"hp":0,"attack":300}`|
|23003|`{"attack_sum_add":900,"hp_sum_add":5400,"hp":0,"attack":0}`|
|23004|`{"attack_sum_add":900,"hp_sum_add":5400,"hp":0,"attack":0}`|
|23005|`{"attack_sum_add":900,"hp_sum_add":7200,"hp":1800,"attack":0}`|
|24000|`{"attack_sum_add":840,"hp_sum_add":5040,"hp":0,"attack":280}`|
|24001|`{"attack_sum_add":840,"hp_sum_add":7560,"hp":2520,"attack":0}`|
|24002|`{"attack_sum_add":1260,"hp_sum_add":7560,"hp":0,"attack":420}`|
|24003|`{"attack_sum_add":1260,"hp_sum_add":7560,"hp":0,"attack":0}`|
|24004|`{"attack_sum_add":1260,"hp_sum_add":7560,"hp":0,"attack":0}`|
|24005|`{"attack_sum_add":1260,"hp_sum_add":10080,"hp":2520,"attack":0}`|
|25000|`{"attack_sum_add":2400,"hp_sum_add":14400,"hp":0,"attack":800}`|
|25001|`{"attack_sum_add":2400,"hp_sum_add":21600,"hp":7200,"attack":0}`|
|25002|`{"attack_sum_add":3600,"hp_sum_add":21600,"hp":0,"attack":1200}`|
|25003|`{"attack_sum_add":3600,"hp_sum_add":21600,"hp":0,"attack":0}`|
|25004|`{"attack_sum_add":3600,"hp_sum_add":21600,"hp":0,"attack":0}`|
|25005|`{"attack_sum_add":3600,"hp_sum_add":28800,"hp":7200,"attack":0}`|
|33000|`{"attack_sum_add":1200,"hp_sum_add":7200,"hp":0,"attack":300}`|
|33001|`{"attack_sum_add":1200,"hp_sum_add":9600,"hp":2400,"attack":0}`|
|33002|`{"attack_sum_add":1600,"hp_sum_add":9600,"hp":0,"attack":400}`|
|33003|`{"attack_sum_add":1600,"hp_sum_add":9600,"hp":0,"attack":0}`|
|33004|`{"attack_sum_add":1600,"hp_sum_add":9600,"hp":0,"attack":0}`|
|33005|`{"attack_sum_add":1600,"hp_sum_add":12000,"hp":2400,"attack":0}`|
|34000|`{"attack_sum_add":1680,"hp_sum_add":10080,"hp":0,"attack":420}`|
|34001|`{"attack_sum_add":1680,"hp_sum_add":13440,"hp":3360,"attack":0}`|
|34002|`{"attack_sum_add":2240,"hp_sum_add":13440,"hp":0,"attack":560}`|
|34003|`{"attack_sum_add":2240,"hp_sum_add":13440,"hp":0,"attack":0}`|
|34004|`{"attack_sum_add":2240,"hp_sum_add":13440,"hp":0,"attack":0}`|
|34005|`{"attack_sum_add":2240,"hp_sum_add":16800,"hp":3360,"attack":0}`|
|35000|`{"attack_sum_add":4800,"hp_sum_add":28800,"hp":0,"attack":1200}`|
|35001|`{"attack_sum_add":4800,"hp_sum_add":38400,"hp":9600,"attack":0}`|
|35002|`{"attack_sum_add":6400,"hp_sum_add":38400,"hp":0,"attack":1600}`|
|35003|`{"attack_sum_add":6400,"hp_sum_add":38400,"hp":0,"attack":0}`|
|35004|`{"attack_sum_add":6400,"hp_sum_add":38400,"hp":0,"attack":0}`|
|35005|`{"attack_sum_add":6400,"hp_sum_add":48000,"hp":9600,"attack":0}`|
|43000|`{"attack_sum_add":2000,"hp_sum_add":12000,"hp":0,"attack":400}`|
|43001|`{"attack_sum_add":2000,"hp_sum_add":15600,"hp":3600,"attack":0}`|
|43002|`{"attack_sum_add":2600,"hp_sum_add":15600,"hp":0,"attack":600}`|
|43003|`{"attack_sum_add":2600,"hp_sum_add":15600,"hp":0,"attack":0}`|
|43004|`{"attack_sum_add":2600,"hp_sum_add":15600,"hp":0,"attack":0}`|
|43005|`{"attack_sum_add":2600,"hp_sum_add":19200,"hp":3600,"attack":0}`|
|44000|`{"attack_sum_add":2800,"hp_sum_add":16800,"hp":0,"attack":560}`|
|44001|`{"attack_sum_add":2800,"hp_sum_add":21840,"hp":5040,"attack":0}`|
|44002|`{"attack_sum_add":3640,"hp_sum_add":21840,"hp":0,"attack":840}`|
|44003|`{"attack_sum_add":3640,"hp_sum_add":21840,"hp":0,"attack":0}`|
|44004|`{"attack_sum_add":3640,"hp_sum_add":21840,"hp":0,"attack":0}`|
|44005|`{"attack_sum_add":3640,"hp_sum_add":26880,"hp":5040,"attack":0}`|
|45000|`{"attack_sum_add":8000,"hp_sum_add":48000,"hp":0,"attack":1600}`|
|45001|`{"attack_sum_add":8000,"hp_sum_add":62400,"hp":14400,"attack":0}`|
|45002|`{"attack_sum_add":10400,"hp_sum_add":62400,"hp":0,"attack":2400}`|
|45003|`{"attack_sum_add":10400,"hp_sum_add":62400,"hp":0,"attack":0}`|
|45004|`{"attack_sum_add":10400,"hp_sum_add":62400,"hp":0,"attack":0}`|
|45005|`{"attack_sum_add":10400,"hp_sum_add":76800,"hp":14400,"attack":0}`|
|53000|`{"attack_sum_add":3200,"hp_sum_add":19200,"hp":0,"attack":600}`|
|54000|`{"attack_sum_add":4480,"hp_sum_add":26880,"hp":0,"attack":840}`|
|55000|`{"attack_sum_add":12800,"hp_sum_add":76800,"hp":0,"attack":2400}`|
|56000|`{"attack_sum_add":12800,"hp_sum_add":76800,"hp":0,"attack":2400}`|
|56010|`{"attack_sum_add":12800,"hp_sum_add":76800,"hp":0,"attack":2400}`|
|56020|`{"attack_sum_add":15360,"hp_sum_add":92160,"hp":0,"attack":2400}`|
|57000|`{"attack_sum_add":12800,"hp_sum_add":76800,"hp":0,"attack":2400}`|

## StarAttrType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|attr_already_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_already_bj|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|attr_not_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_not_bj|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr_already_icon":"img_yxsx_sx_jineng2.png","attr_already_bj":"img_yxtp_dangqian.png","attr_not_icon":"img_yxsx_sx_jineng3.png","attr_not_bj":"img_yxtp_weijiesuo.png"}`|
|2|`{"attr_already_icon":"img_yxsx_sx_jineng7.png","attr_already_bj":"img_yxtp_dangqian.png","attr_not_icon":"img_yxsx_sx_jineng8.png","attr_not_bj":"img_yxtp_weijiesuo.png"}`|
|24|`{"attr_already_icon":"img_yxsx_sx_jineng1.png","attr_already_bj":"img_yxtp_dangqian.png","attr_not_icon":"img_yxsx_sx_jineng10.png","attr_not_bj":"img_yxtp_weijiesuo.png"}`|
|25|`{"attr_already_icon":"img_yxsx_sx_fangyu.png","attr_already_bj":"img_yxtp_dangqian.png","attr_not_icon":"img_yxsx_sx_fangyu2.png","attr_not_bj":"img_yxtp_weijiesuo.png"}`|

## BaseAttrNew

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|crit_harm|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hp_grow|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|magic_def|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|203|本表行键；与其他表同值不自动代表同一对象。|
|attack_grow|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|magic_def_grow|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hp|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|physical_def_grow|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attack|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|physical_def|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit|number|203|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101010130|`{"power":0,"hp_grow":19000,"attack_grow":2600,"attr":[[189,10000],[188,10000]],"hp":315,"attack":48}`|
|101010140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|101010150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|101010160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|101020130|`{"power":0,"hp_grow":18000,"attack_grow":3000,"attr":[[189,10000],[188,10000]],"hp":300,"attack":50}`|
|101020140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|101020150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|101020160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|102010140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|102010150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|102010160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|102020140|`{"power":0,"hp_grow":24000,"attack_grow":4600,"attr":[[189,10000],[188,10000]],"hp":420,"attack":77}`|
|102020150|`{"power":0,"hp_grow":36000,"attack_grow":7200,"attr":[[189,10000],[188,10000]],"hp":600,"attack":110}`|
|102020160|`{"power":0,"hp_grow":72000,"attack_grow":14400,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":220}`|
|102030140|`{"power":0,"hp_grow":24000,"attack_grow":4600,"attr":[[189,10000],[188,10000]],"hp":420,"attack":77}`|
|102030150|`{"power":0,"hp_grow":36000,"attack_grow":7200,"attr":[[189,10000],[188,10000]],"hp":600,"attack":110}`|
|102030160|`{"power":0,"hp_grow":72000,"attack_grow":14400,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":220}`|
|102040140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|102040150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|102040160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|102050140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|102050150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|102050160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|102060140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|102060150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|102060160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|103010150|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|103010160|`{"power":0,"hp_grow":158400,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":2640,"attack":360}`|
|103020150|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|103020160|`{"power":0,"hp_grow":151200,"attack_grow":22400,"attr":[[189,10000],[188,10000]],"hp":2520,"attack":380}`|
|103030150|`{"power":0,"hp_grow":72000,"attack_grow":14400,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":220}`|
|103030160|`{"power":0,"hp_grow":144000,"attack_grow":28800,"attr":[[189,10000],[188,10000]],"hp":2400,"attack":440}`|
|103040150|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|103040160|`{"power":0,"hp_grow":151200,"attack_grow":22400,"attr":[[189,10000],[188,10000]],"hp":2520,"attack":380}`|
|103050150|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|103050160|`{"power":0,"hp_grow":158400,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":2640,"attack":360}`|
|103060150|`{"power":0,"hp_grow":108000,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":330}`|
|103060160|`{"power":0,"hp_grow":216000,"attack_grow":43200,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":660}`|
|103070150|`{"power":0,"hp_grow":108000,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":330}`|
|103070160|`{"power":0,"hp_grow":216000,"attack_grow":43200,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":660}`|
|104010150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|104010160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|104020150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|104020160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|104030150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|104030160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|201010130|`{"power":0,"hp_grow":18000,"attack_grow":3400,"attr":[[189,10000],[188,10000]],"hp":300,"attack":55}`|
|201010140|`{"power":0,"hp_grow":24000,"attack_grow":4600,"attr":[[189,10000],[188,10000]],"hp":420,"attack":77}`|
|201010150|`{"power":0,"hp_grow":36000,"attack_grow":7200,"attr":[[189,10000],[188,10000]],"hp":600,"attack":110}`|
|201010160|`{"power":0,"hp_grow":72000,"attack_grow":14400,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":220}`|
|201020130|`{"power":0,"hp_grow":18000,"attack_grow":3400,"attr":[[189,10000],[188,10000]],"hp":300,"attack":55}`|
|201020140|`{"power":0,"hp_grow":24000,"attack_grow":4600,"attr":[[189,10000],[188,10000]],"hp":420,"attack":77}`|
|201020150|`{"power":0,"hp_grow":36000,"attack_grow":7200,"attr":[[189,10000],[188,10000]],"hp":600,"attack":110}`|
|201020160|`{"power":0,"hp_grow":72000,"attack_grow":14400,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":220}`|
|202010140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|202010150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|202010160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|202020140|`{"power":0,"hp_grow":24000,"attack_grow":4600,"attr":[[189,10000],[188,10000]],"hp":420,"attack":77}`|
|202020150|`{"power":0,"hp_grow":36000,"attack_grow":7200,"attr":[[189,10000],[188,10000]],"hp":600,"attack":110}`|
|202020160|`{"power":0,"hp_grow":72000,"attack_grow":14400,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":220}`|
|202030140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|202030150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|202030160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|202040140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|202040150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|202040160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|202050140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|202050150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|202050160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|202060140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|202060150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|202060160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|203010150|`{"power":0,"hp_grow":113400,"attack_grow":16800,"attr":[[189,10000],[188,10000]],"hp":1890,"attack":285}`|
|203010160|`{"power":0,"hp_grow":226800,"attack_grow":33600,"attr":[[189,10000],[188,10000]],"hp":3780,"attack":570}`|
|203020150|`{"power":0,"hp_grow":108000,"attack_grow":18000,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":300}`|
|203020160|`{"power":0,"hp_grow":216000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":600}`|
|203030150|`{"power":0,"hp_grow":108000,"attack_grow":18000,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":300}`|
|203030160|`{"power":0,"hp_grow":216000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":600}`|
|203040150|`{"power":0,"hp_grow":108000,"attack_grow":18000,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":300}`|
|203040160|`{"power":0,"hp_grow":216000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":600}`|
|203050150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|203050160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|203060150|`{"power":0,"hp_grow":113400,"attack_grow":16800,"attr":[[189,10000],[188,10000]],"hp":1890,"attack":285}`|
|203060160|`{"power":0,"hp_grow":226800,"attack_grow":33600,"attr":[[189,10000],[188,10000]],"hp":3780,"attack":570}`|
|203070150|`{"power":0,"hp_grow":108000,"attack_grow":18000,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":300}`|
|203070160|`{"power":0,"hp_grow":216000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":600}`|
|204010150|`{"power":0,"hp_grow":360000,"attack_grow":60000,"attr":[[189,10000],[188,10000]],"hp":6000,"attack":1000}`|
|204010160|`{"power":0,"hp_grow":360000,"attack_grow":60000,"attr":[[189,10000],[188,10000]],"hp":6000,"attack":1000}`|
|204020150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|204020160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|301010130|`{"power":0,"hp_grow":18000,"attack_grow":3000,"attr":[[189,10000],[188,10000]],"hp":300,"attack":50}`|
|301010140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|301010150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|301010160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|301020130|`{"power":0,"hp_grow":19000,"attack_grow":2600,"attr":[[189,10000],[188,10000]],"hp":315,"attack":48}`|
|301020140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|301020150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|301020160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|301030130|`{"power":0,"hp_grow":18000,"attack_grow":3000,"attr":[[189,10000],[188,10000]],"hp":300,"attack":50}`|
|301030140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|301030150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|301030160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|302010140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|302010150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|302010160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|302020140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|302020150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|302020160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|302030140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|302030150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|302030160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|302040140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|302040150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|302040160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|302050140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|302050150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|302050160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|303020150|`{"power":0,"hp_grow":118800,"attack_grow":16200,"attr":[[189,10000],[188,10000]],"hp":1980,"attack":270}`|
|303020160|`{"power":0,"hp_grow":237600,"attack_grow":32400,"attr":[[189,10000],[188,10000]],"hp":3960,"attack":540}`|
|303030150|`{"power":0,"hp_grow":108000,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":330}`|
|303030160|`{"power":0,"hp_grow":216000,"attack_grow":43200,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":660}`|
|303040150|`{"power":0,"hp_grow":118800,"attack_grow":16200,"attr":[[189,10000],[188,10000]],"hp":1980,"attack":270}`|
|303040160|`{"power":0,"hp_grow":237600,"attack_grow":32400,"attr":[[189,10000],[188,10000]],"hp":3960,"attack":540}`|
|303050150|`{"power":0,"hp_grow":108000,"attack_grow":18000,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":300}`|
|303050160|`{"power":0,"hp_grow":216000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":600}`|
|303060150|`{"power":0,"hp_grow":108000,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":330}`|
|303060160|`{"power":0,"hp_grow":216000,"attack_grow":43200,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":660}`|
|303070150|`{"power":0,"hp_grow":108000,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":330}`|
|303070160|`{"power":0,"hp_grow":216000,"attack_grow":43200,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":660}`|
|304010150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|304010160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|304020150|`{"power":0,"hp_grow":180000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3000,"attack":550}`|
|304020160|`{"power":0,"hp_grow":360000,"attack_grow":72000,"attr":[[189,10000],[188,10000]],"hp":6000,"attack":1100}`|
|401010130|`{"power":0,"hp_grow":18000,"attack_grow":3400,"attr":[[189,10000],[188,10000]],"hp":300,"attack":55}`|
|401010140|`{"power":0,"hp_grow":24000,"attack_grow":4600,"attr":[[189,10000],[188,10000]],"hp":420,"attack":77}`|
|401010150|`{"power":0,"hp_grow":36000,"attack_grow":7200,"attr":[[189,10000],[188,10000]],"hp":600,"attack":110}`|
|401010160|`{"power":0,"hp_grow":72000,"attack_grow":14400,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":220}`|
|401020130|`{"power":0,"hp_grow":19800,"attack_grow":2800,"attr":[[189,10000],[188,10000]],"hp":330,"attack":45}`|
|401020140|`{"power":0,"hp_grow":26400,"attack_grow":3600,"attr":[[189,10000],[188,10000]],"hp":462,"attack":63}`|
|401020150|`{"power":0,"hp_grow":39600,"attack_grow":5400,"attr":[[189,10000],[188,10000]],"hp":660,"attack":90}`|
|401020160|`{"power":0,"hp_grow":79200,"attack_grow":10800,"attr":[[189,10000],[188,10000]],"hp":1320,"attack":180}`|
|401030130|`{"power":0,"hp_grow":19000,"attack_grow":2600,"attr":[[189,10000],[188,10000]],"hp":315,"attack":48}`|
|401030140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|401030150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|401030160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|402010140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|402010150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|402010160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|402020140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|402020150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|402020160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|402030140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|402030150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|402030160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|402040140|`{"power":0,"hp_grow":25200,"attack_grow":3800,"attr":[[189,10000],[188,10000]],"hp":440,"attack":66}`|
|402040150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|402040160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|402050140|`{"power":0,"hp_grow":24000,"attack_grow":4000,"attr":[[189,10000],[188,10000]],"hp":420,"attack":70}`|
|402050150|`{"power":0,"hp_grow":36000,"attack_grow":6000,"attr":[[189,10000],[188,10000]],"hp":600,"attack":100}`|
|402050160|`{"power":0,"hp_grow":72000,"attack_grow":12000,"attr":[[189,10000],[188,10000]],"hp":1200,"attack":200}`|
|403010150|`{"power":0,"hp_grow":113400,"attack_grow":16800,"attr":[[189,10000],[188,10000]],"hp":1890,"attack":285}`|
|403010160|`{"power":0,"hp_grow":226800,"attack_grow":33600,"attr":[[189,10000],[188,10000]],"hp":3780,"attack":570}`|
|403020150|`{"power":0,"hp_grow":113400,"attack_grow":16800,"attr":[[189,10000],[188,10000]],"hp":1890,"attack":285}`|
|403020160|`{"power":0,"hp_grow":226800,"attack_grow":33600,"attr":[[189,10000],[188,10000]],"hp":3780,"attack":570}`|
|403030150|`{"power":0,"hp_grow":108000,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":330}`|
|403030160|`{"power":0,"hp_grow":216000,"attack_grow":43200,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":660}`|
|403040150|`{"power":0,"hp_grow":113400,"attack_grow":16800,"attr":[[189,10000],[188,10000]],"hp":1890,"attack":285}`|
|403040160|`{"power":0,"hp_grow":226800,"attack_grow":33600,"attr":[[189,10000],[188,10000]],"hp":3780,"attack":570}`|
|403050150|`{"power":0,"hp_grow":108000,"attack_grow":21600,"attr":[[189,10000],[188,10000]],"hp":1800,"attack":330}`|
|403050160|`{"power":0,"hp_grow":216000,"attack_grow":43200,"attr":[[189,10000],[188,10000]],"hp":3600,"attack":660}`|
|403060150|`{"power":0,"hp_grow":113400,"attack_grow":16800,"attr":[[189,10000],[188,10000]],"hp":1890,"attack":285}`|
|403060160|`{"power":0,"hp_grow":226800,"attack_grow":33600,"attr":[[189,10000],[188,10000]],"hp":3780,"attack":570}`|
|403080150|`{"power":0,"hp_grow":37800,"attack_grow":5600,"attr":[[189,10000],[188,10000]],"hp":630,"attack":95}`|
|403080160|`{"power":0,"hp_grow":75600,"attack_grow":11200,"attr":[[189,10000],[188,10000]],"hp":1260,"attack":190}`|
|404010150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|404010160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|404020150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|404020160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|404030150|`{"power":0,"hp_grow":180000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3000,"attack":550}`|
|404030160|`{"power":0,"hp_grow":360000,"attack_grow":72000,"attr":[[189,10000],[188,10000]],"hp":6000,"attack":1100}`|
|404040150|`{"power":0,"hp_grow":180000,"attack_grow":36000,"attr":[[189,10000],[188,10000]],"hp":3000,"attack":550}`|
|404040160|`{"power":0,"hp_grow":360000,"attack_grow":72000,"attr":[[189,10000],[188,10000]],"hp":6000,"attack":1100}`|
|504010150|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504010160|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504010170|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504020150|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|504020160|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|504020170|`{"power":0,"hp_grow":396000,"attack_grow":54000,"attr":[[189,10000],[188,10000]],"hp":6600,"attack":900}`|
|504030150|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504030160|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504030170|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504040150|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504040160|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504040170|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504050150|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504050160|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504050170|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504060150|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504060160|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504060170|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504070150|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504070160|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|
|504070170|`{"power":0,"hp_grow":475200,"attack_grow":64800,"attr":[[189,10000],[188,10000]],"hp":8000,"attack":1080}`|

## BattleAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|77|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1010201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1020101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1020201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1020301|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1020401|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1020501|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1020601|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|1030101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1030201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1030301|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1030401|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1030501|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1030601|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1030701|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1040101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1040201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|1040301|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2010101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2010201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2020101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2020201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2020301|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2020401|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2020501|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2020601|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|2030101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2030201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2030301|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2030401|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2030501|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2030601|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2030701|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2040101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|2040201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3010101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3010201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3010301|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3020101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3020201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3020301|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3020401|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3020501|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|3030201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3030301|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3030401|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3030501|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3030601|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3030701|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3040101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|3040201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4010101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4010201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4010301|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4020101|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4020201|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4020301|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4020401|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4020501|`{"attr":[[1,180],[2,30],[24,18],[25,18]]}`|
|4030101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4030201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4030301|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4030401|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4030501|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4030601|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4030801|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4040101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4040201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4040301|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|4040401|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|5040101|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|5040201|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|5040301|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|5040401|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|5040501|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|5040601|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|
|5040701|`{"attr":[[1,900],[2,150],[24,45],[25,45]]}`|

## BreakAddAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|51|本表行键；与其他表同值不自动代表同一对象。|
|hp|number|51|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|magic_def|number|51|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attack|number|51|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|physical_def|number|51|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"hp":0,"attack":0}`|
|1|`{"hp":12000,"attack":2000}`|
|2|`{"hp":30000,"attack":5000}`|
|3|`{"hp":48000,"attack":8000}`|
|4|`{"hp":84000,"attack":14000}`|
|5|`{"hp":120000,"attack":20000}`|
|6|`{"hp":156000,"attack":26000}`|
|7|`{"hp":210000,"attack":35000}`|
|8|`{"hp":264000,"attack":44000}`|
|9|`{"hp":336000,"attack":56000}`|
|10|`{"hp":408000,"attack":68000}`|
|11|`{"hp":464400,"attack":77400}`|
|12|`{"hp":561600,"attack":93600}`|
|13|`{"hp":691200,"attack":115200}`|
|14|`{"hp":729600,"attack":121600}`|
|15|`{"hp":844800,"attack":140800}`|
|16|`{"hp":988800,"attack":164800}`|
|17|`{"hp":991200,"attack":165200}`|
|18|`{"hp":1117200,"attack":186200}`|
|19|`{"hp":1195200,"attack":199200}`|
|20|`{"hp":1243200,"attack":207200}`|
|21|`{"hp":1323000,"attack":220500}`|
|22|`{"hp":1449000,"attack":241500}`|
|23|`{"hp":1575000,"attack":262500}`|
|24|`{"hp":1701000,"attack":283500}`|
|25|`{"hp":1827000,"attack":304500}`|
|26|`{"hp":1953000,"attack":325500}`|
|27|`{"hp":2079000,"attack":346500}`|
|28|`{"hp":2205000,"attack":367500}`|
|29|`{"hp":2331000,"attack":388500}`|
|30|`{"hp":2457000,"attack":409500}`|
|31|`{"hp":2583000,"attack":430500}`|
|32|`{"hp":2709000,"attack":451500}`|
|33|`{"hp":2835000,"attack":472500}`|
|34|`{"hp":2961000,"attack":493500}`|
|35|`{"hp":3087000,"attack":514500}`|
|36|`{"hp":3213000,"attack":535500}`|
|37|`{"hp":3339000,"attack":556500}`|
|38|`{"hp":3465000,"attack":577500}`|
|39|`{"hp":3591000,"attack":598500}`|
|40|`{"hp":3717000,"attack":619500}`|
|41|`{"hp":3843000,"attack":640500}`|
|42|`{"hp":3969000,"attack":661500}`|
|43|`{"hp":4095000,"attack":682500}`|
|44|`{"hp":4221000,"attack":703500}`|
|45|`{"hp":4347000,"attack":724500}`|
|46|`{"hp":4473000,"attack":745500}`|
|47|`{"hp":4599000,"attack":766500}`|
|48|`{"hp":4725000,"attack":787500}`|
|49|`{"hp":4851000,"attack":808500}`|
|50|`{"hp":4977000,"attack":829500}`|

## FavourIntimacyLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|attr|array|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_date_award|number|50|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|50|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|extra_attr|array|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_res|string|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_intimacy|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|date_award|array|50|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|date_times|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_des|number|50|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|power|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|date_chip_num|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chip_num|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|—|`{"attr":[],"show_date_award":0,"award":[],"extra_attr":[],"need_intimacy":700,"date_award":[[101500,50],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":0,"chip_num":0,"level":1}`|
|—|`{"attr":[],"show_date_award":1,"award":[],"extra_attr":[],"need_intimacy":800,"date_award":[[101500,70],[710002,1],[830602,1]],"date_times":1,"award_des":688115,"power":0,"date_chip_num":1,"chip_num":0,"level":2}`|
|—|`{"attr":[],"show_date_award":0,"award":[[101500,150],[101500,150],[22002,1]],"extra_attr":[],"need_intimacy":1000,"date_award":[[101500,70],[710002,1],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":1,"chip_num":0,"level":3}`|
|—|`{"attr":[[201,105000],[202,15750],[203,2100],[204,2100]],"show_date_award":0,"award":[],"extra_attr":[],"need_intimacy":1000,"date_award":[[101500,70],[710002,1],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":1,"chip_num":0,"level":4}`|
|—|`{"attr":[[201,105000],[202,15750],[203,2100],[204,2100]],"show_date_award":0,"award":[[101500,150],[101500,150],[22002,1]],"extra_attr":[],"need_intimacy":1000,"date_award":[[101500,70],[710002,1],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":1,"chip_num":0,"level":5}`|
|—|`{"attr":[[201,105000],[202,15750],[203,2100],[204,2100]],"show_date_award":0,"award":[],"extra_attr":[[1,110000],[2,16500],[24,2200],[25,2200]],"need_intimacy":1000,"date_award":[[101500,70],[710002,1],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":1,"chip_num":0,"level":6}`|
|—|`{"attr":[[201,105000],[202,15750],[203,2100],[204,2100]],"show_date_award":1,"award":[],"extra_attr":[[1,110000],[2,16500],[24,2200],[25,2200]],"need_intimacy":1000,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":688117,"power":0,"date_chip_num":2,"chip_num":0,"level":7}`|
|—|`{"attr":[[201,225000],[202,33750],[203,4500],[204,4500]],"show_date_award":0,"award":[],"extra_attr":[[1,110000],[2,16500],[24,2200],[25,2200]],"need_intimacy":1000,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":8}`|
|—|`{"attr":[[201,225000],[202,33750],[203,4500],[204,4500]],"show_date_award":0,"award":[],"extra_attr":[[1,170000],[2,25500],[24,3400],[25,3400]],"need_intimacy":1500,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":9}`|
|—|`{"attr":[[201,225000],[202,33750],[203,4500],[204,4500]],"show_date_award":0,"award":[[101500,250],[101500,250],[22002,2]],"extra_attr":[[1,170000],[2,25500],[24,3400],[25,3400]],"need_intimacy":1500,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":10}`|
|—|`{"attr":[[201,315000],[202,47250],[203,6300],[204,6300]],"show_date_award":0,"award":[],"extra_attr":[[1,170000],[2,25500],[24,3400],[25,3400]],"need_intimacy":1500,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":11}`|
|—|`{"attr":[[201,315000],[202,47250],[203,6300],[204,6300]],"show_date_award":0,"award":[[101500,250],[101500,250],[201500,50000]],"extra_attr":[[1,170000],[2,25500],[24,3400],[25,3400]],"need_intimacy":2000,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":12}`|
|—|`{"attr":[[201,315000],[202,47250],[203,6300],[204,6300]],"show_date_award":0,"award":[],"extra_attr":[[1,250000],[2,37500],[24,5000],[25,5000]],"need_intimacy":2000,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":13}`|
|—|`{"attr":[[201,315000],[202,47250],[203,6300],[204,6300]],"show_date_award":0,"award":[[101500,250],[101500,250],[201500,50000]],"extra_attr":[[1,250000],[2,37500],[24,5000],[25,5000]],"need_intimacy":2000,"date_award":[[101500,100],[710002,2],[830602,1]],"date_times":1,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":14}`|
|—|`{"attr":[[201,315000],[202,47250],[203,6300],[204,6300]],"show_date_award":0,"award":[],"extra_attr":[[1,250000],[2,37500],[24,5000],[25,5000]],"need_intimacy":2000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":688119,"power":0,"date_chip_num":2,"chip_num":0,"level":15}`|
|—|`{"attr":[[201,495000],[202,74250],[203,9900],[204,9900]],"show_date_award":0,"award":[],"extra_attr":[[1,250000],[2,37500],[24,5000],[25,5000]],"need_intimacy":3000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":16}`|
|—|`{"attr":[[201,495000],[202,74250],[203,9900],[204,9900]],"show_date_award":0,"award":[[101500,400],[101500,400],[201500,100000]],"extra_attr":[[1,250000],[2,37500],[24,5000],[25,5000]],"need_intimacy":2000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":17}`|
|—|`{"attr":[[201,495000],[202,74250],[203,9900],[204,9900]],"show_date_award":0,"award":[],"extra_attr":[[1,390000],[2,58500],[24,7800],[25,7800]],"need_intimacy":3000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":18}`|
|—|`{"attr":[[201,495000],[202,74250],[203,9900],[204,9900]],"show_date_award":0,"award":[[101500,400],[101500,400],[201500,100000]],"extra_attr":[[1,390000],[2,58500],[24,7800],[25,7800]],"need_intimacy":3000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":19}`|
|—|`{"attr":[[201,495000],[202,74250],[203,9900],[204,9900]],"show_date_award":0,"award":[[101500,500],[101500,500]],"extra_attr":[[1,390000],[2,58500],[24,7800],[25,7800]],"need_intimacy":4000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":80,"level":20}`|
|—|`{"attr":[[201,750000],[202,112500],[203,15000],[204,15000]],"show_date_award":0,"award":[],"extra_attr":[[1,390000],[2,58500],[24,7800],[25,7800]],"need_intimacy":4000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":21}`|
|—|`{"attr":[[201,750000],[202,112500],[203,15000],[204,15000]],"show_date_award":0,"award":[[101500,400],[101500,400],[201500,100000]],"extra_attr":[[1,390000],[2,58500],[24,7800],[25,7800]],"need_intimacy":4000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":22}`|
|—|`{"attr":[[201,750000],[202,112500],[203,15000],[204,15000]],"show_date_award":0,"award":[],"extra_attr":[[1,600000],[2,90000],[24,12000],[25,12000]],"need_intimacy":4000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":23}`|
|—|`{"attr":[[201,750000],[202,112500],[203,15000],[204,15000]],"show_date_award":0,"award":[[101500,400],[101500,400],[201500,100000]],"extra_attr":[[1,600000],[2,90000],[24,12000],[25,12000]],"need_intimacy":4000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":24}`|
|—|`{"attr":[[201,750000],[202,112500],[203,15000],[204,15000]],"show_date_award":0,"award":[[101500,750],[101500,750],[22002,3]],"extra_attr":[[1,600000],[2,90000],[24,12000],[25,12000]],"need_intimacy":4000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":25}`|
|—|`{"attr":[[201,1125000],[202,168750],[203,22500],[204,22500]],"show_date_award":0,"award":[],"extra_attr":[[1,600000],[2,90000],[24,12000],[25,12000]],"need_intimacy":5000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":26}`|
|—|`{"attr":[[201,1125000],[202,168750],[203,22500],[204,22500]],"show_date_award":0,"award":[[101500,500],[101500,500],[201500,150000]],"extra_attr":[[1,600000],[2,90000],[24,12000],[25,12000]],"need_intimacy":5000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":27}`|
|—|`{"attr":[[201,1125000],[202,168750],[203,22500],[204,22500]],"show_date_award":0,"award":[],"extra_attr":[[1,850000],[2,127500],[24,17000],[25,17000]],"need_intimacy":5000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":28}`|
|—|`{"attr":[[201,1125000],[202,168750],[203,22500],[204,22500]],"show_date_award":0,"award":[[101500,500],[101500,500],[201500,150000]],"extra_attr":[[1,850000],[2,127500],[24,17000],[25,17000]],"need_intimacy":7000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":29}`|
|—|`{"attr":[[201,1125000],[202,168750],[203,22500],[204,22500]],"show_date_award":0,"award":[[101500,750],[101500,750],[22002,3]],"extra_attr":[[1,850000],[2,127500],[24,17000],[25,17000]],"need_intimacy":7000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":30}`|
|—|`{"attr":[[201,1500000],[202,225000],[203,30000],[204,30000]],"show_date_award":0,"award":[],"extra_attr":[[1,850000],[2,127500],[24,17000],[25,17000]],"need_intimacy":7000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":31}`|
|—|`{"attr":[[201,1500000],[202,225000],[203,30000],[204,30000]],"show_date_award":0,"award":[[101500,600],[101500,600],[201500,200000]],"extra_attr":[[1,850000],[2,127500],[24,17000],[25,17000]],"need_intimacy":7000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":32}`|
|—|`{"attr":[[201,1500000],[202,225000],[203,30000],[204,30000]],"show_date_award":0,"award":[],"extra_attr":[[1,1100000],[2,165000],[24,22000],[25,22000]],"need_intimacy":7000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":33}`|
|—|`{"attr":[[201,1500000],[202,225000],[203,30000],[204,30000]],"show_date_award":0,"award":[[101500,600],[101500,600],[201500,200000]],"extra_attr":[[1,1100000],[2,165000],[24,22000],[25,22000]],"need_intimacy":10000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":34}`|
|—|`{"attr":[[201,1500000],[202,225000],[203,30000],[204,30000]],"show_date_award":0,"award":[[101500,1000],[101500,1000],[22002,4]],"extra_attr":[[1,1100000],[2,165000],[24,22000],[25,22000]],"need_intimacy":10000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":35}`|
|—|`{"attr":[[201,1875000],[202,281250],[203,37500],[204,37500]],"show_date_award":0,"award":[],"extra_attr":[[1,1100000],[2,165000],[24,22000],[25,22000]],"need_intimacy":10000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":36}`|
|—|`{"attr":[[201,1875000],[202,281250],[203,37500],[204,37500]],"show_date_award":0,"award":[[101500,750],[101500,750],[201500,300000]],"extra_attr":[[1,1100000],[2,165000],[24,22000],[25,22000]],"need_intimacy":10000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":37}`|
|—|`{"attr":[[201,1875000],[202,281250],[203,37500],[204,37500]],"show_date_award":0,"award":[],"extra_attr":[[1,1350000],[2,202500],[24,27000],[25,27000]],"need_intimacy":10000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":38}`|
|—|`{"attr":[[201,1875000],[202,281250],[203,37500],[204,37500]],"show_date_award":0,"award":[[101500,750],[101500,750],[201500,300000]],"extra_attr":[[1,1350000],[2,202500],[24,27000],[25,27000]],"need_intimacy":15000,"date_award":[[101500,150],[710002,3],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":2,"chip_num":0,"level":39}`|
|—|`{"attr":[[201,1875000],[202,281250],[203,37500],[204,37500]],"show_date_award":1,"award":[],"extra_attr":[[1,1350000],[2,202500],[24,27000],[25,27000]],"need_intimacy":16000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":688122,"power":0,"date_chip_num":3,"chip_num":0,"level":40}`|
|—|`{"attr":[[201,2250000],[202,337500],[203,45000],[204,45000]],"show_date_award":0,"award":[],"extra_attr":[[1,1350000],[2,202500],[24,27000],[25,27000]],"need_intimacy":17000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":41}`|
|—|`{"attr":[[201,2250000],[202,337500],[203,45000],[204,45000]],"show_date_award":0,"award":[[101500,900],[101500,900],[201500,500000]],"extra_attr":[[1,1350000],[2,202500],[24,27000],[25,27000]],"need_intimacy":18000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":42}`|
|—|`{"attr":[[201,2250000],[202,337500],[203,45000],[204,45000]],"show_date_award":0,"award":[],"extra_attr":[[1,1600000],[2,240000],[24,32000],[25,32000]],"need_intimacy":19000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":43}`|
|—|`{"attr":[[201,2250000],[202,337500],[203,45000],[204,45000]],"show_date_award":0,"award":[[101500,900],[101500,900],[201500,500000]],"extra_attr":[[1,1600000],[2,240000],[24,32000],[25,32000]],"need_intimacy":20000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":44}`|
|—|`{"attr":[[201,2550000],[202,382500],[203,51000],[204,51000]],"show_date_award":0,"award":[],"extra_attr":[[1,1600000],[2,240000],[24,32000],[25,32000]],"need_intimacy":21000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":45}`|
|—|`{"attr":[[201,2550000],[202,382500],[203,51000],[204,51000]],"show_date_award":0,"award":[],"extra_attr":[[1,1750000],[2,262500],[24,35000],[25,35000]],"need_intimacy":22000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":46}`|
|—|`{"attr":[[201,2550000],[202,382500],[203,51000],[204,51000]],"show_date_award":0,"award":[[101500,900],[101500,900],[201500,500000]],"extra_attr":[[1,1750000],[2,262500],[24,35000],[25,35000]],"need_intimacy":23000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":47}`|
|—|`{"attr":[[201,2775000],[202,416250],[203,55500],[204,55500]],"show_date_award":0,"award":[],"extra_attr":[[1,1750000],[2,262500],[24,35000],[25,35000]],"need_intimacy":24000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":48}`|
|—|`{"attr":[[201,2775000],[202,416250],[203,55500],[204,55500]],"show_date_award":0,"award":[[101500,900],[101500,900],[201500,500000]],"extra_attr":[[1,1750000],[2,262500],[24,35000],[25,35000]],"need_intimacy":25000,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":49}`|
|—|`{"attr":[[201,2775000],[202,416250],[203,55500],[204,55500]],"show_date_award":0,"award":[[101500,1500],[101500,1500],[22002,5]],"extra_attr":[[1,1750000],[2,262500],[24,35000],[25,35000]],"need_intimacy":0,"date_award":[[101500,200],[710002,5],[830602,1]],"date_times":2,"award_des":0,"power":0,"date_chip_num":3,"chip_num":0,"level":50}`|

## FavourIntimacyItem

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|item_tid|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_intimacy|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|—|`{"item_tid":830502}`|
|—|`{"item_tid":830602}`|
|—|`{"item_tid":830702}`|
|—|`{"item_tid":830802}`|

## FavourIntimacyContentGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|chat_content|array|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|
|25|`{}`|
|26|`{}`|
|27|`{}`|
|28|`{}`|

## FavourIntimacyContent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|sender_type|number|510|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|content_voice|number|510|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|content_award_cover|string|510|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|content_text|number|510|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|510|本表行键；与其他表同值不自动代表同一对象。|
|content_type|number|510|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|content_pic|number|510|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部510行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5000|`{"sender_type":1,"content_award_cover":"","content_type":0}`|
|5001|`{"sender_type":2,"content_award_cover":"","content_type":0}`|
|5002|`{"sender_type":1,"content_award_cover":"","content_type":0}`|

## FavourIntimacyCycle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## FavourIntimacyBase

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|hero_meixuan|string|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_story|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_entry_time|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_date|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_tid|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|—|`{"hero_meixuan":"pic_hgd_xy.png","hero_story":1,"show_entry_time":1785272400,"hero_date":1,"hero_tid":4040301}`|
|—|`{"hero_meixuan":"pic_hgd_mfsn.png","hero_story":2,"show_entry_time":1785272400,"hero_date":2,"hero_tid":5040601}`|
|—|`{"hero_meixuan":"pic_hgd_qqj.png","hero_story":5,"show_entry_time":1785272400,"hero_date":3,"hero_tid":5040301}`|
|—|`{"hero_meixuan":"pic_hgd_jjsn.png","hero_story":4,"show_entry_time":1785272400,"hero_date":4,"hero_tid":5040401}`|
|—|`{"hero_meixuan":"pic_hgd_susu.png","hero_story":15,"show_entry_time":1785272400,"hero_date":5,"hero_tid":5040201}`|
|—|`{"hero_meixuan":"pic_hgd_anhunshi.png","hero_story":3,"show_entry_time":1785272400,"hero_date":6,"hero_tid":1040301}`|
|—|`{"hero_meixuan":"pic_hgd_aniesi.png","hero_story":6,"show_entry_time":1785272400,"hero_date":7,"hero_tid":3040201}`|
|—|`{"hero_meixuan":"pic_hgd_sheniang.png","hero_story":7,"show_entry_time":1785272400,"hero_date":8,"hero_tid":5040101}`|
|—|`{"hero_meixuan":"pic_hgd_aimili.png","hero_story":8,"show_entry_time":1785272400,"hero_date":9,"hero_tid":1040201}`|
|—|`{"hero_meixuan":"pic_hgd_yiwa.png","hero_story":9,"show_entry_time":1785272400,"hero_date":10,"hero_tid":3040101}`|
|—|`{"hero_meixuan":"pic_hgd_jin.png","hero_story":10,"show_entry_time":1785272400,"hero_date":11,"hero_tid":5040501}`|
|—|`{"hero_meixuan":"pic_hgd_misa.png","hero_story":11,"show_entry_time":1785272400,"hero_date":12,"hero_tid":1040101}`|
|—|`{"hero_meixuan":"pic_hgd_chixiao.png","hero_story":12,"show_entry_time":1785272400,"hero_date":13,"hero_tid":2040101}`|
|—|`{"hero_meixuan":"pic_hgd_sanshu.png","hero_story":13,"show_entry_time":1785272400,"hero_date":14,"hero_tid":4040201}`|
|—|`{"hero_meixuan":"pic_hgd_tutupf.png","hero_story":14,"show_entry_time":1785272400,"hero_date":15,"hero_tid":2040201}`|
|—|`{"hero_meixuan":"pic_hgd_chaofanmixueer.png","hero_story":16,"show_entry_time":1789074000,"hero_date":16,"hero_tid":5040701}`|

## FavourIntimacyPhoto

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## FavourIntimacyChat

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|chat_content_group|array|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chat_title|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chat_npc|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"chat_content_group":[1,2,3],"chat_npc":119708}`|
|2|`{"chat_content_group":[4,5,6],"chat_npc":124708}`|
|3|`{"chat_content_group":[7,8],"chat_npc":121608}`|
|4|`{"chat_content_group":[9,10],"chat_npc":123908}`|
|5|`{"chat_content_group":[11,12],"chat_npc":123008}`|
|6|`{"chat_content_group":[13,14],"chat_npc":121908}`|
|7|`{"chat_content_group":[15,16],"chat_npc":119608}`|
|8|`{"chat_content_group":[17,18],"chat_npc":122908}`|
|9|`{"chat_content_group":[19],"chat_npc":116408}`|
|10|`{"chat_content_group":[20],"chat_npc":113608}`|
|11|`{"chat_content_group":[21],"chat_npc":124308}`|
|12|`{"chat_content_group":[22],"chat_npc":107908}`|
|13|`{"chat_content_group":[23],"chat_npc":116308}`|
|14|`{"chat_content_group":[24],"chat_npc":107708}`|
|15|`{"chat_content_group":[25],"chat_npc":122308}`|
|16|`{"chat_content_group":[26,27,28],"chat_npc":125208}`|

## FavourIntimacyConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|user_date_cycle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|user_date_times_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hero_date_cycle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"user_date_cycle":2,"user_date_times_limit":30,"hero_date_cycle":1}`|

## FavourIntimacyCharm

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|attr|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_attr|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_intimacy|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|—|`{"attr":[[201,0],[202,0],[203,0],[204,0]],"extra_attr":[],"power":0,"need_intimacy":2500,"level":1}`|
|—|`{"attr":[[201,35000],[202,5250],[203,700],[204,700]],"extra_attr":[],"power":0,"need_intimacy":2500,"level":2}`|
|—|`{"attr":[[201,40000],[202,6000],[203,800],[204,800]],"extra_attr":[],"power":0,"need_intimacy":3000,"level":3}`|
|—|`{"attr":[[201,55000],[202,8250],[203,1100],[204,1100]],"extra_attr":[],"power":0,"need_intimacy":3000,"level":4}`|
|—|`{"attr":[[201,70000],[202,10500],[203,1400],[204,1400]],"extra_attr":[],"power":0,"need_intimacy":3500,"level":5}`|
|—|`{"attr":[[201,90000],[202,13500],[203,1800],[204,1800]],"extra_attr":[],"power":0,"need_intimacy":4500,"level":6}`|
|—|`{"attr":[[201,110000],[202,16500],[203,2200],[204,2200]],"extra_attr":[],"power":0,"need_intimacy":6000,"level":7}`|
|—|`{"attr":[[201,130000],[202,19500],[203,2600],[204,2600]],"extra_attr":[],"power":0,"need_intimacy":6000,"level":8}`|
|—|`{"attr":[[201,150000],[202,22500],[203,3000],[204,3000]],"extra_attr":[],"power":0,"need_intimacy":6000,"level":9}`|
|—|`{"attr":[[201,170000],[202,25500],[203,3400],[204,3400]],"extra_attr":[],"power":0,"need_intimacy":11000,"level":10}`|
|—|`{"attr":[[201,190000],[202,28500],[203,3800],[204,3800]],"extra_attr":[],"power":0,"need_intimacy":12000,"level":11}`|
|—|`{"attr":[[201,230000],[202,34500],[203,4600],[204,4600]],"extra_attr":[],"power":0,"need_intimacy":15000,"level":12}`|
|—|`{"attr":[[201,260000],[202,39000],[203,5200],[204,5200]],"extra_attr":[],"power":0,"need_intimacy":25000,"level":13}`|
|—|`{"attr":[[201,300000],[202,45000],[203,6000],[204,6000]],"extra_attr":[],"power":0,"need_intimacy":25000,"level":14}`|
|—|`{"attr":[[201,400000],[202,60000],[203,8000],[204,8000]],"extra_attr":[],"power":0,"need_intimacy":25000,"level":15}`|
|—|`{"attr":[[201,500000],[202,75000],[203,10000],[204,10000]],"extra_attr":[],"power":0,"need_intimacy":50000,"level":16}`|
|—|`{"attr":[[201,600000],[202,90000],[203,12000],[204,12000]],"extra_attr":[],"power":0,"need_intimacy":50000,"level":17}`|
|—|`{"attr":[[201,700000],[202,105000],[203,14000],[204,14000]],"extra_attr":[],"power":0,"need_intimacy":50000,"level":18}`|
|—|`{"attr":[[201,800000],[202,120000],[203,16000],[204,16000]],"extra_attr":[],"power":0,"need_intimacy":75000,"level":19}`|
|—|`{"attr":[[201,900000],[202,135000],[203,18000],[204,18000]],"extra_attr":[],"power":0,"need_intimacy":85000,"level":20}`|
|—|`{"attr":[[201,1000000],[202,150000],[203,20000],[204,20000]],"extra_attr":[],"power":0,"need_intimacy":115000,"level":21}`|
|—|`{"attr":[[201,1100000],[202,165000],[203,22000],[204,22000]],"extra_attr":[],"power":0,"need_intimacy":115000,"level":22}`|
|—|`{"attr":[[201,1200000],[202,180000],[203,24000],[204,24000]],"extra_attr":[],"power":0,"need_intimacy":115000,"level":23}`|
|—|`{"attr":[[201,1300000],[202,195000],[203,26000],[204,26000]],"extra_attr":[],"power":0,"need_intimacy":195000,"level":24}`|
|—|`{"attr":[[201,1400000],[202,210000],[203,28000],[204,28000]],"extra_attr":[],"power":0,"need_intimacy":200000,"level":25}`|
|—|`{"attr":[[201,1700000],[202,255000],[203,34000],[204,34000]],"extra_attr":[],"power":0,"need_intimacy":200000,"level":26}`|
|—|`{"attr":[[201,2000000],[202,300000],[203,40000],[204,40000]],"extra_attr":[],"power":0,"need_intimacy":200000,"level":27}`|
|—|`{"attr":[[201,2300000],[202,345000],[203,46000],[204,46000]],"extra_attr":[],"power":0,"need_intimacy":400000,"level":28}`|
|—|`{"attr":[[201,2600000],[202,390000],[203,52000],[204,52000]],"extra_attr":[],"power":0,"need_intimacy":550000,"level":29}`|
|—|`{"attr":[[201,3000000],[202,450000],[203,60000],[204,60000]],"extra_attr":[],"power":0,"need_intimacy":0,"level":30}`|

## Position

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|253|本表行键；与其他表同值不自动代表同一对象。|
|show_bg|number|253|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|253|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{}`|
|10002|`{}`|
|10003|`{}`|
|10004|`{}`|
|10005|`{}`|
|10006|`{}`|
|10007|`{}`|
|10008|`{}`|
|10009|`{}`|
|10010|`{}`|
|10011|`{}`|
|10012|`{}`|
|10013|`{}`|
|10014|`{}`|
|10015|`{}`|
|10016|`{}`|
|10017|`{}`|
|10018|`{}`|
|10019|`{}`|
|10020|`{}`|
|10021|`{}`|
|10022|`{}`|
|10023|`{}`|
|10024|`{}`|
|10025|`{}`|
|10026|`{}`|
|10027|`{}`|
|10028|`{}`|
|10029|`{}`|
|10030|`{}`|
|10031|`{}`|
|10032|`{}`|
|10033|`{}`|
|10034|`{}`|
|10035|`{}`|
|10036|`{}`|
|10037|`{}`|
|10038|`{}`|
|10039|`{}`|
|10040|`{}`|
|10041|`{}`|
|10042|`{}`|
|10043|`{}`|
|10044|`{}`|
|10045|`{}`|
|10046|`{}`|
|10047|`{}`|
|10048|`{}`|
|10049|`{}`|
|10050|`{}`|
|10051|`{}`|
|10052|`{}`|
|10053|`{}`|
|10054|`{}`|
|10055|`{}`|
|10056|`{}`|
|10057|`{}`|
|10058|`{}`|
|10059|`{}`|
|10060|`{}`|
|10061|`{}`|
|10062|`{}`|
|10063|`{}`|
|10064|`{}`|
|10065|`{}`|
|10066|`{}`|
|10067|`{}`|
|10068|`{}`|
|10069|`{}`|
|10070|`{}`|
|10071|`{}`|
|10072|`{}`|
|10073|`{}`|
|10074|`{}`|
|10075|`{}`|
|10076|`{}`|
|10077|`{}`|
|10078|`{}`|
|10079|`{}`|
|10080|`{}`|
|10081|`{}`|
|10082|`{}`|
|10083|`{}`|
|10084|`{}`|
|10085|`{}`|
|10086|`{}`|
|10087|`{}`|
|10088|`{}`|
|10089|`{}`|
|10090|`{}`|
|10091|`{}`|
|10092|`{}`|
|10093|`{}`|
|10094|`{}`|
|10095|`{}`|
|10096|`{}`|
|10097|`{}`|
|10098|`{}`|
|10099|`{}`|
|10100|`{}`|
|10101|`{}`|
|10102|`{}`|
|10103|`{}`|
|10104|`{}`|
|10105|`{}`|
|10106|`{}`|
|10107|`{}`|
|10108|`{}`|
|10109|`{}`|
|10110|`{}`|
|10112|`{}`|
|10113|`{}`|
|10114|`{}`|
|10115|`{}`|
|10116|`{}`|
|10117|`{}`|
|10118|`{}`|
|10119|`{}`|
|10120|`{}`|
|10121|`{}`|
|10122|`{}`|
|10123|`{}`|
|10124|`{}`|
|10125|`{}`|
|10126|`{}`|
|10127|`{}`|
|10128|`{}`|
|10129|`{}`|
|10130|`{}`|
|10131|`{}`|
|10132|`{}`|
|10133|`{}`|
|10134|`{}`|
|10135|`{}`|
|10136|`{}`|
|10137|`{}`|
|10138|`{}`|
|10139|`{}`|
|10140|`{}`|
|10141|`{}`|
|10142|`{}`|
|10143|`{}`|
|10144|`{}`|
|10145|`{}`|
|10146|`{}`|
|10147|`{}`|
|10148|`{}`|
|10149|`{}`|
|10150|`{}`|
|10151|`{}`|
|10152|`{}`|
|10153|`{}`|
|10154|`{}`|
|10155|`{}`|
|10156|`{}`|
|10157|`{}`|
|10158|`{}`|
|10159|`{}`|
|10160|`{}`|
|10161|`{}`|
|10162|`{}`|
|10163|`{}`|
|10164|`{}`|
|10165|`{}`|
|10166|`{}`|
|10167|`{}`|
|10168|`{}`|
|10169|`{}`|
|10170|`{}`|
|10171|`{}`|
|10172|`{}`|
|10173|`{}`|
|10174|`{}`|
|10175|`{}`|
|10176|`{}`|
|10177|`{}`|
|10178|`{}`|
|10179|`{}`|
|10180|`{}`|
|10181|`{}`|
|10182|`{}`|
|10183|`{}`|
|10184|`{}`|
|10185|`{}`|
|10186|`{}`|
|10187|`{}`|
|10188|`{}`|
|10189|`{}`|
|10190|`{}`|
|10191|`{}`|
|10192|`{}`|
|10193|`{}`|
|10194|`{}`|
|10195|`{}`|
|10196|`{}`|
|10197|`{}`|
|10198|`{}`|
|10199|`{}`|
|10200|`{}`|
|10201|`{}`|
|10202|`{}`|
|10203|`{}`|
|10204|`{}`|
|10205|`{}`|
|10206|`{}`|
|10207|`{}`|
|10208|`{}`|
|10209|`{}`|
|10210|`{}`|
|10211|`{}`|
|10212|`{}`|
|10213|`{}`|
|10214|`{}`|
|10215|`{}`|
|10216|`{}`|
|10217|`{}`|
|10218|`{}`|
|10219|`{}`|
|10220|`{}`|
|10221|`{}`|
|10222|`{}`|
|10223|`{}`|
|10224|`{}`|
|10225|`{}`|
|10226|`{}`|
|10227|`{}`|
|10228|`{}`|
|10229|`{}`|
|10230|`{}`|
|10231|`{}`|
|10232|`{}`|
|10233|`{}`|
|10234|`{}`|
|10235|`{}`|
|10236|`{}`|
|10237|`{}`|
|10238|`{}`|
|10239|`{}`|
|10240|`{}`|
|10241|`{}`|
|10242|`{}`|
|10243|`{}`|
|10244|`{}`|
|10245|`{}`|
|10246|`{}`|
|10247|`{}`|
|10248|`{}`|
|10249|`{}`|
|10250|`{}`|
|10251|`{}`|
|10252|`{}`|
|10253|`{}`|
|10254|`{}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_red_lv|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|show_strategy_need_talent|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_sp_max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|ignore_lv|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|req_ref_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|one_key_up_show_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"show_red_lv":3,"show_strategy_need_talent":13,"lineup_sp_max_num":6,"ignore_lv":20,"req_ref_interval":300,"one_key_up_show_count":200}`|

## DrawAchievementAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|item_title_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_lib|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|init_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|add_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{"item_title_name":670816,"award_lib":[2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040,2041,2042,2043,2044,2045,2046,2047,2048,2049,2050,2051,2052,2053,2054,2055,2056,2057,2058,2059,2060,2061,2062,2063,2064,2065,2066,2067,2068,2069,2070,2071,2072,2073,2074,2075,2076,2077,2078,2079,2080,2081,2082,2083,2084,2085,2086,2087,2088,2089,2090,2091,2092,2093,2094,2095,2096,2097,2098,2099,2100,2101,2102],"init_count":15,"add_count":5}`|

## DrawAchievementLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|102|本表行键；与其他表同值不自动代表同一对象。|
|draw_num|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_award|array|102|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_big|boolean|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2001|`{"draw_num":20,"draw_award":[[391002,400]],"is_big":false}`|
|2002|`{"draw_num":40,"draw_award":[[392002,10]],"is_big":false}`|
|2003|`{"draw_num":60,"draw_award":[[101500,500]],"is_big":false}`|
|2004|`{"draw_num":100,"draw_award":[[426002,60]],"is_big":true}`|
|2005|`{"draw_num":150,"draw_award":[[101500,500]],"is_big":false}`|
|2006|`{"draw_num":200,"draw_award":[[426002,60]],"is_big":true}`|
|2007|`{"draw_num":250,"draw_award":[[101500,500]],"is_big":false}`|
|2008|`{"draw_num":300,"draw_award":[[426002,30]],"is_big":true}`|
|2009|`{"draw_num":350,"draw_award":[[22002,1]],"is_big":true}`|
|2010|`{"draw_num":400,"draw_award":[[426002,30]],"is_big":true}`|
|2011|`{"draw_num":450,"draw_award":[[101500,500]],"is_big":false}`|
|2012|`{"draw_num":500,"draw_award":[[426002,30]],"is_big":true}`|
|2013|`{"draw_num":550,"draw_award":[[101500,500]],"is_big":false}`|
|2014|`{"draw_num":600,"draw_award":[[22002,1]],"is_big":true}`|
|2015|`{"draw_num":650,"draw_award":[[101500,500]],"is_big":false}`|
|2016|`{"draw_num":700,"draw_award":[[426002,30]],"is_big":true}`|
|2017|`{"draw_num":750,"draw_award":[[101500,500]],"is_big":false}`|
|2018|`{"draw_num":800,"draw_award":[[22002,1]],"is_big":true}`|
|2019|`{"draw_num":850,"draw_award":[[101500,500]],"is_big":false}`|
|2020|`{"draw_num":900,"draw_award":[[426002,30]],"is_big":true}`|
|2021|`{"draw_num":950,"draw_award":[[101500,500]],"is_big":false}`|
|2022|`{"draw_num":1000,"draw_award":[[22002,1]],"is_big":true}`|
|2023|`{"draw_num":1050,"draw_award":[[101500,500]],"is_big":false}`|
|2024|`{"draw_num":1100,"draw_award":[[426002,30]],"is_big":true}`|
|2025|`{"draw_num":1150,"draw_award":[[101500,500]],"is_big":false}`|
|2026|`{"draw_num":1200,"draw_award":[[161200,1]],"is_big":true}`|
|2027|`{"draw_num":1250,"draw_award":[[101500,500]],"is_big":false}`|
|2028|`{"draw_num":1300,"draw_award":[[2921200,30]],"is_big":true}`|
|2029|`{"draw_num":1350,"draw_award":[[101500,500]],"is_big":false}`|
|2030|`{"draw_num":1400,"draw_award":[[161200,1]],"is_big":true}`|
|2031|`{"draw_num":1450,"draw_award":[[101500,500]],"is_big":false}`|
|2032|`{"draw_num":1500,"draw_award":[[2921200,30]],"is_big":true}`|
|2033|`{"draw_num":1550,"draw_award":[[101500,500]],"is_big":false}`|
|2034|`{"draw_num":1600,"draw_award":[[161200,1]],"is_big":true}`|
|2035|`{"draw_num":1650,"draw_award":[[101500,500]],"is_big":false}`|
|2036|`{"draw_num":1700,"draw_award":[[2921200,30]],"is_big":true}`|
|2037|`{"draw_num":1750,"draw_award":[[101500,500]],"is_big":false}`|
|2038|`{"draw_num":1800,"draw_award":[[161200,1]],"is_big":true}`|
|2039|`{"draw_num":1850,"draw_award":[[101500,500]],"is_big":false}`|
|2040|`{"draw_num":1900,"draw_award":[[2921200,30]],"is_big":true}`|
|2041|`{"draw_num":1950,"draw_award":[[101500,500]],"is_big":false}`|
|2042|`{"draw_num":2000,"draw_award":[[161200,1]],"is_big":true}`|
|2043|`{"draw_num":2050,"draw_award":[[101500,500]],"is_big":false}`|
|2044|`{"draw_num":2100,"draw_award":[[2921200,30]],"is_big":true}`|
|2045|`{"draw_num":2150,"draw_award":[[101500,500]],"is_big":false}`|
|2046|`{"draw_num":2200,"draw_award":[[161200,1]],"is_big":true}`|
|2047|`{"draw_num":2250,"draw_award":[[101500,500]],"is_big":false}`|
|2048|`{"draw_num":2300,"draw_award":[[2921200,30]],"is_big":true}`|
|2049|`{"draw_num":2350,"draw_award":[[101500,500]],"is_big":false}`|
|2050|`{"draw_num":2400,"draw_award":[[161200,1]],"is_big":true}`|
|2051|`{"draw_num":2450,"draw_award":[[101500,500]],"is_big":false}`|
|2052|`{"draw_num":2500,"draw_award":[[2921200,30]],"is_big":true}`|
|2053|`{"draw_num":2550,"draw_award":[[101500,500]],"is_big":false}`|
|2054|`{"draw_num":2600,"draw_award":[[161200,1]],"is_big":true}`|
|2055|`{"draw_num":2650,"draw_award":[[101500,500]],"is_big":false}`|
|2056|`{"draw_num":2700,"draw_award":[[2921200,30]],"is_big":true}`|
|2057|`{"draw_num":2750,"draw_award":[[101500,500]],"is_big":false}`|
|2058|`{"draw_num":2800,"draw_award":[[161200,1]],"is_big":true}`|
|2059|`{"draw_num":2850,"draw_award":[[101500,500]],"is_big":false}`|
|2060|`{"draw_num":2900,"draw_award":[[2921200,30]],"is_big":true}`|
|2061|`{"draw_num":2950,"draw_award":[[101500,500]],"is_big":false}`|
|2062|`{"draw_num":3000,"draw_award":[[161200,1]],"is_big":true}`|
|2063|`{"draw_num":3050,"draw_award":[[101500,500]],"is_big":false}`|
|2064|`{"draw_num":3100,"draw_award":[[2921200,30]],"is_big":true}`|
|2065|`{"draw_num":3150,"draw_award":[[101500,500]],"is_big":false}`|
|2066|`{"draw_num":3200,"draw_award":[[161200,1]],"is_big":true}`|
|2067|`{"draw_num":3250,"draw_award":[[101500,500]],"is_big":false}`|
|2068|`{"draw_num":3300,"draw_award":[[2921200,30]],"is_big":true}`|
|2069|`{"draw_num":3350,"draw_award":[[101500,500]],"is_big":false}`|
|2070|`{"draw_num":3400,"draw_award":[[161200,1]],"is_big":true}`|
|2071|`{"draw_num":3450,"draw_award":[[101500,500]],"is_big":false}`|
|2072|`{"draw_num":3500,"draw_award":[[2921200,30]],"is_big":true}`|
|2073|`{"draw_num":3550,"draw_award":[[101500,500]],"is_big":false}`|
|2074|`{"draw_num":3600,"draw_award":[[161200,1]],"is_big":true}`|
|2075|`{"draw_num":3650,"draw_award":[[101500,500]],"is_big":false}`|
|2076|`{"draw_num":3700,"draw_award":[[2921200,30]],"is_big":true}`|
|2077|`{"draw_num":3750,"draw_award":[[101500,500]],"is_big":false}`|
|2078|`{"draw_num":3800,"draw_award":[[161200,1]],"is_big":true}`|
|2079|`{"draw_num":3850,"draw_award":[[101500,500]],"is_big":false}`|
|2080|`{"draw_num":3900,"draw_award":[[2921200,30]],"is_big":true}`|
|2081|`{"draw_num":3950,"draw_award":[[101500,500]],"is_big":false}`|
|2082|`{"draw_num":4000,"draw_award":[[161200,1]],"is_big":true}`|
|2083|`{"draw_num":4050,"draw_award":[[101500,500]],"is_big":false}`|
|2084|`{"draw_num":4100,"draw_award":[[2921200,30]],"is_big":true}`|
|2085|`{"draw_num":4150,"draw_award":[[101500,500]],"is_big":false}`|
|2086|`{"draw_num":4200,"draw_award":[[161200,1]],"is_big":true}`|
|2087|`{"draw_num":4250,"draw_award":[[101500,500]],"is_big":false}`|
|2088|`{"draw_num":4300,"draw_award":[[2921200,30]],"is_big":true}`|
|2089|`{"draw_num":4350,"draw_award":[[101500,500]],"is_big":false}`|
|2090|`{"draw_num":4400,"draw_award":[[161200,1]],"is_big":true}`|
|2091|`{"draw_num":4450,"draw_award":[[101500,500]],"is_big":false}`|
|2092|`{"draw_num":4500,"draw_award":[[2921200,30]],"is_big":true}`|
|2093|`{"draw_num":4550,"draw_award":[[101500,500]],"is_big":false}`|
|2094|`{"draw_num":4600,"draw_award":[[161200,1]],"is_big":true}`|
|2095|`{"draw_num":4650,"draw_award":[[101500,500]],"is_big":false}`|
|2096|`{"draw_num":4700,"draw_award":[[2921200,30]],"is_big":true}`|
|2097|`{"draw_num":4750,"draw_award":[[101500,500]],"is_big":false}`|
|2098|`{"draw_num":4800,"draw_award":[[161200,1]],"is_big":true}`|
|2099|`{"draw_num":4850,"draw_award":[[101500,500]],"is_big":false}`|
|2100|`{"draw_num":4900,"draw_award":[[2921200,30]],"is_big":true}`|
|2101|`{"draw_num":4950,"draw_award":[[101500,500]],"is_big":false}`|
|2102|`{"draw_num":5000,"draw_award":[[161200,1]],"is_big":true}`|

## DrawCheck

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|check_func|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"check_func":"CheckNewHeroLegendOverflowBuyGift"}`|
|2|`{"check_func":"CheckNewHeroLegendOverflowBuyGift"}`|

## DrawSpecifyHeroShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|display_hero|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## DrawShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|display_hero|array|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_result_hide_diamond|boolean|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_form_hide_diamond|boolean|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_img|array|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|help_tid|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|2|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|3|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":false,"hero_img":[]}`|
|10|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|20|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|21|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|22|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|51|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|52|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|68|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|69|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|71|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|72|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|76|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|77|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|78|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|116|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|117|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|118|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|119|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|120|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|121|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|168|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|169|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|182|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|191|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|
|226|`{"draw_result_hide_diamond":false,"draw_form_hide_diamond":false,"hero_img":[]}`|
|229|`{"draw_result_hide_diamond":true,"draw_form_hide_diamond":true,"hero_img":[]}`|

## DrawConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|magic_buy_price|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_draw_chip_rule_stamp|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_buy_daily_max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|normal_buy_cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|normal_buy_price|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|magic_buy_daily_max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|magic_buy_cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|draw_bubble_tip|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_buy_max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|magic_buy_max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"magic_buy_price":800,"new_draw_chip_rule_stamp":1694638799,"normal_buy_daily_max_num":1200,"normal_buy_cost_item":101500,"normal_buy_price":250,"magic_buy_daily_max_num":60,"magic_buy_cost_item":101500,"draw_bubble_tip":[11,200],"normal_buy_max_num":8000,"magic_buy_max_num":600}`|

## Draw

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|red_extra|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|no_hero|boolean|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_draw_check_func|undefined/object|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_draw_count|number|898|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|common_draw|boolean|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|spc_cost_item|number|898|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|period_days|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_draw_any_num|boolean|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|most_use_free|boolean|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_most|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_check|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|custom_red|boolean|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_one|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item_count|array|898|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|daily_free_count|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item|array|898|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|custom_cal_draw_count|undefined/object|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_text|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guaranteed|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|898|本表行键；与其他表同值不自动代表同一对象。|
|draw_type|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_range|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fun_open|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_flower_can_draw|boolean|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|most_draw_count|number|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|spc_cost_item_count|number|898|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|group_weight|number|898|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|is_record_by_type|boolean|898|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部898行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"no_hero":false,"max_draw_count":0,"common_draw":true,"spc_cost_item":0,"period_days":0,"can_draw_any_num":false,"most_use_free":false,"draw_check":0,"cost_item_count":[1],"daily_free_count":0,"cost_item":[2002],"guaranteed":1,"draw_type":1000,"unlock_range":1,"fun_open":1046,"txt_flower_can_draw":false,"most_draw_count":10,"spc_cost_item_count":0,"group_weight":101,"is_record_by_type":false}`|
|2|`{"no_hero":false,"max_draw_count":0,"common_draw":true,"spc_cost_item":0,"period_days":0,"can_draw_any_num":false,"most_use_free":false,"draw_check":0,"cost_item_count":[1],"daily_free_count":0,"cost_item":[3002],"guaranteed":2,"draw_type":1001,"unlock_range":23,"fun_open":1243,"txt_flower_can_draw":false,"most_draw_count":10,"spc_cost_item_count":0,"group_weight":102,"is_record_by_type":false}`|
|3|`{"no_hero":false,"max_draw_count":0,"common_draw":false,"spc_cost_item":0,"period_days":0,"can_draw_any_num":false,"most_use_free":false,"draw_check":0,"cost_item_count":[100],"daily_free_count":0,"cost_item":[401900],"guaranteed":85,"draw_type":1002,"unlock_range":1,"fun_open":0,"txt_flower_can_draw":false,"most_draw_count":10,"spc_cost_item_count":0,"group_weight":103,"is_record_by_type":false}`|

## DrawNumLimit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|max_overlay_num|number|9|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|daily_limit_draw_num|number|9|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{"max_overlay_num":0,"daily_limit_draw_num":1000000}`|
|10|`{"max_overlay_num":0,"daily_limit_draw_num":10000}`|
|53|`{"max_overlay_num":0,"daily_limit_draw_num":10000}`|
|116|`{"max_overlay_num":1000,"daily_limit_draw_num":100}`|
|117|`{"max_overlay_num":1000,"daily_limit_draw_num":100}`|
|118|`{"max_overlay_num":1000,"daily_limit_draw_num":100}`|
|119|`{"max_overlay_num":1000,"daily_limit_draw_num":100}`|
|120|`{"max_overlay_num":1000,"daily_limit_draw_num":100}`|
|121|`{"max_overlay_num":1000,"daily_limit_draw_num":100}`|

## DrawProgAward

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## DrawExtAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|random_ext_award|number|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|ext_award|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|53|`{"random_ext_award":0,"ext_award":[[4701900,15]]}`|
|158|`{"random_ext_award":0,"ext_award":[[7101900,40]]}`|
|159|`{"random_ext_award":0,"ext_award":[[7101900,40]]}`|
|160|`{"random_ext_award":0,"ext_award":[[7101900,40]]}`|
|161|`{"random_ext_award":0,"ext_award":[[7101900,40]]}`|

## DrawServerSplit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|server1|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|server2|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## NormalDrawWishCell

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cond_desc_params|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_extra_wish|boolean|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_cond|undefined/number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|cond_desc|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cond_desc_params":[100],"group":1,"is_extra_wish":false,"cond_desc":60934,"condition":955132601228}`|
|2|`{"cond_desc_params":[300,10000],"group":1,"is_extra_wish":false,"cond_desc":670771,"condition":306289200002}`|
|3|`{"cond_desc_params":[50000],"group":2,"is_extra_wish":true,"show_cond":306289200002,"cond_desc":670778,"condition":955132601241}`|

## Guaranteed

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|guaranteed_special|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|66|本表行键；与其他表同值不自动代表同一对象。|
|guaranteed_extra_group|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guaranteed_num|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guaranteed_extra|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"guaranteed_special":1,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|2|`{"guaranteed_special":2,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|3|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":300,"guaranteed_extra":0}`|
|10|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|21|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|23|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":360,"guaranteed_extra":0}`|
|25|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|26|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":0,"guaranteed_extra":0}`|
|27|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":0,"guaranteed_extra":0}`|
|28|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|29|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|53|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":35,"guaranteed_extra":0}`|
|54|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|55|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|57|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|58|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":10,"guaranteed_extra":0}`|
|59|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|60|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|68|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|70|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|71|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|72|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|73|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|74|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":700,"guaranteed_extra":0}`|
|75|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":250,"guaranteed_extra":0}`|
|77|`{"guaranteed_special":0,"guaranteed_extra_group":49042,"guaranteed_num":40,"guaranteed_extra":82}`|
|78|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":250,"guaranteed_extra":0}`|
|79|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":150,"guaranteed_extra":0}`|
|80|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":100,"guaranteed_extra":0}`|
|81|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":90,"guaranteed_extra":0}`|
|82|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":80,"guaranteed_extra":0}`|
|83|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|84|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|85|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":200,"guaranteed_extra":0}`|
|86|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|87|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|88|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|89|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|90|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":25,"guaranteed_extra":0}`|
|91|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|92|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|93|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|94|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":400,"guaranteed_extra":0}`|
|95|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":130,"guaranteed_extra":0}`|
|96|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":200,"guaranteed_extra":0}`|
|97|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":200,"guaranteed_extra":0}`|
|98|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":100,"guaranteed_extra":0}`|
|99|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":400,"guaranteed_extra":0}`|
|100|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":400,"guaranteed_extra":0}`|
|101|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|102|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":60,"guaranteed_extra":0}`|
|103|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":40,"guaranteed_extra":0}`|
|104|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":60,"guaranteed_extra":0}`|
|105|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|106|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|107|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|108|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|109|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|110|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|111|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|112|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|113|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|114|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":30,"guaranteed_extra":0}`|
|115|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|116|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":50,"guaranteed_extra":0}`|
|117|`{"guaranteed_special":0,"guaranteed_extra_group":0,"guaranteed_num":100,"guaranteed_extra":0}`|

## DrawVideo

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|video_path|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|

## FilterOff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|item|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":[474002,475002,476002]}`|
|2|`{"item":[474002,475002,476002]}`|

## VisitConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|meet_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"meet_times":1,"day_times":3}`|

## Visit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|chip_num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|30|`{"chip_num":10}`|
|40|`{"chip_num":10}`|
|50|`{"chip_num":5}`|

## VisitUnlock

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|unlock_asset|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_pass|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|59|本表行键；与其他表同值不自动代表同一对象。|
|unlock_player_lv|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_day_show|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"unlock_asset":703622010101,"unlock_pass":80210,"unlock_player_lv":1,"server_day_show":1}`|
|1010201|`{"unlock_asset":703622010201,"unlock_pass":60210,"unlock_player_lv":1,"server_day_show":1}`|
|1020101|`{"unlock_asset":703625020201,"unlock_pass":130210,"unlock_player_lv":1,"server_day_show":1}`|
|1020201|`{"unlock_asset":703622020201,"unlock_pass":210210,"unlock_player_lv":1,"server_day_show":1}`|
|1020301|`{"unlock_asset":703622020301,"unlock_pass":200210,"unlock_player_lv":1,"server_day_show":1}`|
|1020401|`{"unlock_asset":703622020401,"unlock_pass":120210,"unlock_player_lv":1,"server_day_show":1}`|
|1020501|`{"unlock_asset":703622020501,"unlock_pass":160210,"unlock_player_lv":1,"server_day_show":1}`|
|1020601|`{"unlock_asset":703622020601,"unlock_pass":100210,"unlock_player_lv":1,"server_day_show":1}`|
|1030101|`{"unlock_asset":703622030101,"unlock_pass":240210,"unlock_player_lv":1,"server_day_show":1}`|
|1030201|`{"unlock_asset":703622030201,"unlock_pass":280210,"unlock_player_lv":1,"server_day_show":1}`|
|1030301|`{"unlock_asset":703622030301,"unlock_pass":390210,"unlock_player_lv":1,"server_day_show":1}`|
|1030401|`{"unlock_asset":703622030401,"unlock_pass":340210,"unlock_player_lv":1,"server_day_show":1}`|
|1030501|`{"unlock_asset":703622030501,"unlock_pass":290210,"unlock_player_lv":1,"server_day_show":1}`|
|1030601|`{"unlock_asset":703622030601,"unlock_pass":420210,"unlock_player_lv":1,"server_day_show":1}`|
|1030701|`{"unlock_asset":703622030701,"unlock_pass":460210,"unlock_player_lv":1,"server_day_show":1}`|
|2010101|`{"unlock_asset":703622010201,"unlock_pass":60210,"unlock_player_lv":1,"server_day_show":1}`|
|2010201|`{"unlock_asset":703622010201,"unlock_pass":60210,"unlock_player_lv":1,"server_day_show":1}`|
|2020101|`{"unlock_asset":703623020101,"unlock_pass":190210,"unlock_player_lv":1,"server_day_show":1}`|
|2020201|`{"unlock_asset":703622020301,"unlock_pass":200210,"unlock_player_lv":1,"server_day_show":1}`|
|2020301|`{"unlock_asset":703623020301,"unlock_pass":170210,"unlock_player_lv":1,"server_day_show":1}`|
|2020401|`{"unlock_asset":703624020101,"unlock_pass":110210,"unlock_player_lv":1,"server_day_show":1}`|
|2020501|`{"unlock_asset":703623020501,"unlock_pass":150210,"unlock_player_lv":1,"server_day_show":1}`|
|2020601|`{"unlock_asset":703622020601,"unlock_pass":100210,"unlock_player_lv":1,"server_day_show":1}`|
|2030101|`{"unlock_asset":703623030101,"unlock_pass":400210,"unlock_player_lv":1,"server_day_show":1}`|
|2030201|`{"unlock_asset":703623030201,"unlock_pass":230210,"unlock_player_lv":1,"server_day_show":1}`|
|2030301|`{"unlock_asset":703623030301,"unlock_pass":330210,"unlock_player_lv":1,"server_day_show":1}`|
|2030401|`{"unlock_asset":703625030801,"unlock_pass":220210,"unlock_player_lv":1,"server_day_show":1}`|
|2030501|`{"unlock_asset":703623030501,"unlock_pass":270210,"unlock_player_lv":1,"server_day_show":1}`|
|2030601|`{"unlock_asset":703623030601,"unlock_pass":450210,"unlock_player_lv":1,"server_day_show":1}`|
|2030701|`{"unlock_asset":703623030701,"unlock_pass":470210,"unlock_player_lv":1,"server_day_show":1}`|
|3010101|`{"unlock_asset":703622010101,"unlock_pass":80210,"unlock_player_lv":1,"server_day_show":1}`|
|3010201|`{"unlock_asset":703622010201,"unlock_pass":60210,"unlock_player_lv":1,"server_day_show":1}`|
|3010301|`{"unlock_asset":703624010301,"unlock_pass":70210,"unlock_player_lv":1,"server_day_show":1}`|
|3020101|`{"unlock_asset":703624020101,"unlock_pass":110210,"unlock_player_lv":1,"server_day_show":1}`|
|3020201|`{"unlock_asset":703623020101,"unlock_pass":190210,"unlock_player_lv":1,"server_day_show":1}`|
|3020301|`{"unlock_asset":703622020501,"unlock_pass":160210,"unlock_player_lv":1,"server_day_show":1}`|
|3020401|`{"unlock_asset":703622020201,"unlock_pass":210210,"unlock_player_lv":1,"server_day_show":1}`|
|3020501|`{"unlock_asset":703624020501,"unlock_pass":140210,"unlock_player_lv":1,"server_day_show":1}`|
|3030201|`{"unlock_asset":703624030201,"unlock_pass":370210,"unlock_player_lv":1,"server_day_show":1}`|
|3030301|`{"unlock_asset":703624030301,"unlock_pass":320210,"unlock_player_lv":1,"server_day_show":1}`|
|3030401|`{"unlock_asset":703624030401,"unlock_pass":310210,"unlock_player_lv":1,"server_day_show":1}`|
|3030501|`{"unlock_asset":703624030501,"unlock_pass":180210,"unlock_player_lv":1,"server_day_show":2}`|
|3030601|`{"unlock_asset":703624030601,"unlock_pass":260210,"unlock_player_lv":1,"server_day_show":1}`|
|3030701|`{"unlock_asset":703624030701,"unlock_pass":440210,"unlock_player_lv":1,"server_day_show":1}`|
|4010101|`{"unlock_asset":703624010301,"unlock_pass":70210,"unlock_player_lv":1,"server_day_show":1}`|
|4010201|`{"unlock_asset":703622010201,"unlock_pass":60210,"unlock_player_lv":1,"server_day_show":1}`|
|4010301|`{"unlock_asset":703625010301,"unlock_pass":90210,"unlock_player_lv":1,"server_day_show":1}`|
|4020101|`{"unlock_asset":703622020401,"unlock_pass":120210,"unlock_player_lv":1,"server_day_show":1}`|
|4020201|`{"unlock_asset":703625020201,"unlock_pass":130210,"unlock_player_lv":1,"server_day_show":1}`|
|4020301|`{"unlock_asset":703624020501,"unlock_pass":140210,"unlock_player_lv":1,"server_day_show":1}`|
|4020401|`{"unlock_asset":703623020301,"unlock_pass":170210,"unlock_player_lv":1,"server_day_show":1}`|
|4020501|`{"unlock_asset":703623020501,"unlock_pass":150210,"unlock_player_lv":1,"server_day_show":1}`|
|4030101|`{"unlock_asset":703625030101,"unlock_pass":300210,"unlock_player_lv":1,"server_day_show":1}`|
|4030201|`{"unlock_asset":703625030201,"unlock_pass":410210,"unlock_player_lv":1,"server_day_show":1}`|
|4030301|`{"unlock_asset":703625030301,"unlock_pass":380210,"unlock_player_lv":1,"server_day_show":1}`|
|4030401|`{"unlock_asset":703625030401,"unlock_pass":360210,"unlock_player_lv":1,"server_day_show":1}`|
|4030501|`{"unlock_asset":703625030501,"unlock_pass":250210,"unlock_player_lv":1,"server_day_show":1}`|
|4030601|`{"unlock_asset":703625030601,"unlock_pass":430210,"unlock_player_lv":1,"server_day_show":1}`|
|4030801|`{"unlock_asset":703625030801,"unlock_pass":220210,"unlock_player_lv":1,"server_day_show":1}`|

## StarPendant

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|style_name|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pendant|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style_change|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":5040701,"star":5}`|
|2|`{"hero":5040701,"star":6}`|
|3|`{"hero":5040701,"star":7}`|
|4|`{"hero":5040701,"star":8}`|
|5|`{"hero":5040701,"star":9}`|
|6|`{"hero":5040701,"star":10}`|

## Pendant

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|unlock_star|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|part_type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|unlock_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_style_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_star":6,"part_type":1,"fight_prefab":"hero_ChaoFanMiXueEr_cb01.prefab","unlock_item":0}`|
|2|`{"unlock_star":8,"part_type":1,"fight_prefab":"hero_ChaoFanMiXueEr_cb01_tx.prefab","unlock_item":0}`|

## PendantPartType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## StoryChapterEndingType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## StoryChapterChoice

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|index|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg|string|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lock_des|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|intimacy_level|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|80|本表行键；与其他表同值不自动代表同一对象。|
|title|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lock_des":7800010,"intimacy_level":1}`|
|2|`{"lock_des":7800011,"intimacy_level":2}`|
|3|`{"lock_des":7800045,"intimacy_level":3}`|
|4|`{"lock_des":7800046,"intimacy_level":5}`|
|5|`{"lock_des":7800047,"intimacy_level":7}`|
|6|`{"lock_des":7800010,"intimacy_level":1}`|
|7|`{"lock_des":7800011,"intimacy_level":2}`|
|8|`{"lock_des":7800045,"intimacy_level":3}`|
|9|`{"lock_des":7800046,"intimacy_level":5}`|
|10|`{"lock_des":7800047,"intimacy_level":7}`|
|11|`{"lock_des":7800010,"intimacy_level":1}`|
|12|`{"lock_des":7800011,"intimacy_level":2}`|
|13|`{"lock_des":7800045,"intimacy_level":3}`|
|14|`{"lock_des":7800046,"intimacy_level":5}`|
|15|`{"lock_des":7800047,"intimacy_level":7}`|
|16|`{"lock_des":7800010,"intimacy_level":1}`|
|17|`{"lock_des":7800011,"intimacy_level":2}`|
|18|`{"lock_des":7800045,"intimacy_level":3}`|
|19|`{"lock_des":7800046,"intimacy_level":5}`|
|20|`{"lock_des":7800047,"intimacy_level":7}`|
|21|`{"lock_des":7800010,"intimacy_level":1}`|
|22|`{"lock_des":7800011,"intimacy_level":2}`|
|23|`{"lock_des":7800045,"intimacy_level":3}`|
|24|`{"lock_des":7800046,"intimacy_level":5}`|
|25|`{"lock_des":7800047,"intimacy_level":7}`|
|26|`{"lock_des":7800010,"intimacy_level":1}`|
|27|`{"lock_des":7800011,"intimacy_level":2}`|
|28|`{"lock_des":7800045,"intimacy_level":3}`|
|29|`{"lock_des":7800046,"intimacy_level":5}`|
|30|`{"lock_des":7800047,"intimacy_level":7}`|
|31|`{"lock_des":7800010,"intimacy_level":1}`|
|32|`{"lock_des":7800011,"intimacy_level":2}`|
|33|`{"lock_des":7800045,"intimacy_level":3}`|
|34|`{"lock_des":7800046,"intimacy_level":5}`|
|35|`{"lock_des":7800047,"intimacy_level":7}`|
|36|`{"lock_des":7800010,"intimacy_level":1}`|
|37|`{"lock_des":7800011,"intimacy_level":2}`|
|38|`{"lock_des":7800045,"intimacy_level":3}`|
|39|`{"lock_des":7800046,"intimacy_level":5}`|
|40|`{"lock_des":7800047,"intimacy_level":7}`|
|41|`{"lock_des":7800010,"intimacy_level":1}`|
|42|`{"lock_des":7800011,"intimacy_level":2}`|
|43|`{"lock_des":7800045,"intimacy_level":3}`|
|44|`{"lock_des":7800046,"intimacy_level":5}`|
|45|`{"lock_des":7800047,"intimacy_level":7}`|
|46|`{"lock_des":7800010,"intimacy_level":1}`|
|47|`{"lock_des":7800011,"intimacy_level":2}`|
|48|`{"lock_des":7800045,"intimacy_level":3}`|
|49|`{"lock_des":7800046,"intimacy_level":5}`|
|50|`{"lock_des":7800047,"intimacy_level":7}`|
|51|`{"lock_des":7800010,"intimacy_level":1}`|
|52|`{"lock_des":7800011,"intimacy_level":2}`|
|53|`{"lock_des":7800045,"intimacy_level":3}`|
|54|`{"lock_des":7800046,"intimacy_level":5}`|
|55|`{"lock_des":7800047,"intimacy_level":7}`|
|56|`{"lock_des":7800010,"intimacy_level":1}`|
|57|`{"lock_des":7800011,"intimacy_level":2}`|
|58|`{"lock_des":7800045,"intimacy_level":3}`|
|59|`{"lock_des":7800046,"intimacy_level":5}`|
|60|`{"lock_des":7800047,"intimacy_level":7}`|
|61|`{"lock_des":7800010,"intimacy_level":1}`|
|62|`{"lock_des":7800011,"intimacy_level":2}`|
|63|`{"lock_des":7800045,"intimacy_level":3}`|
|64|`{"lock_des":7800046,"intimacy_level":5}`|
|65|`{"lock_des":7800047,"intimacy_level":7}`|
|66|`{"lock_des":7800010,"intimacy_level":1}`|
|67|`{"lock_des":7800011,"intimacy_level":2}`|
|68|`{"lock_des":7800045,"intimacy_level":3}`|
|69|`{"lock_des":7800046,"intimacy_level":5}`|
|70|`{"lock_des":7800047,"intimacy_level":7}`|
|71|`{"lock_des":7800010,"intimacy_level":1}`|
|72|`{"lock_des":7800011,"intimacy_level":2}`|
|73|`{"lock_des":7800045,"intimacy_level":3}`|
|74|`{"lock_des":7800046,"intimacy_level":5}`|
|75|`{"lock_des":7800047,"intimacy_level":7}`|
|76|`{"lock_des":7800010,"intimacy_level":1}`|
|77|`{"lock_des":7800011,"intimacy_level":2}`|
|78|`{"lock_des":7800045,"intimacy_level":3}`|
|79|`{"lock_des":7800046,"intimacy_level":5}`|
|80|`{"lock_des":7800047,"intimacy_level":7}`|

## StoryChapterPage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|choice|array|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chapter|number|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|86|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|endingType|number|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|86|本表行键；与其他表同值不自动代表同一对象。|
|title|number|86|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|2|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|3|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|4|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|5|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|6|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|7|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|8|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|9|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|10|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|11|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|12|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|13|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|14|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|15|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|16|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|17|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|18|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|19|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|20|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|21|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|22|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|23|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|24|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|25|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|26|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|27|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|28|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|29|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|30|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|31|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|32|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|33|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|34|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|35|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|36|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|37|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|38|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|39|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|40|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|41|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|42|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|43|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|44|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|45|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|46|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|47|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|48|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|49|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|50|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|51|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|52|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|53|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|54|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|55|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|56|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|57|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|58|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|59|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|60|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|61|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|62|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|63|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|64|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|65|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|66|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|67|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|68|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|69|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|70|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|71|`{"award":[],"endingType":0}`|
|72|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|73|`{"award":[[5022002,1]],"endingType":2}`|
|74|`{"award":[],"endingType":0}`|
|75|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|76|`{"award":[[5020002,1]],"endingType":2}`|
|77|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|78|`{"award":[],"endingType":0}`|
|79|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|80|`{"award":[[5021002,1]],"endingType":2}`|
|81|`{"award":[[101500,200],[101500,300]],"endingType":1}`|
|82|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|83|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|84|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|85|`{"award":[[101500,200],[101500,200]],"endingType":1}`|
|86|`{"award":[[101500,200],[101500,200]],"endingType":1}`|

## StoryChapterPageShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|desc|number|202|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|202|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img|array|202|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|202|本表行键；与其他表同值不自动代表同一对象。|
|page|number|202|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|
|25|`{}`|
|26|`{}`|
|27|`{}`|
|28|`{}`|
|29|`{}`|
|30|`{}`|
|31|`{}`|
|32|`{}`|
|33|`{}`|
|34|`{}`|
|35|`{}`|
|36|`{}`|
|37|`{}`|
|38|`{}`|
|39|`{}`|
|40|`{}`|
|41|`{}`|
|42|`{}`|
|43|`{}`|
|44|`{}`|
|45|`{}`|
|46|`{}`|
|47|`{}`|
|48|`{}`|
|49|`{}`|
|50|`{}`|
|51|`{}`|
|52|`{}`|
|53|`{}`|
|54|`{}`|
|55|`{}`|
|56|`{}`|
|57|`{}`|
|58|`{}`|
|59|`{}`|
|60|`{}`|
|61|`{}`|
|62|`{}`|
|63|`{}`|
|64|`{}`|
|65|`{}`|
|66|`{}`|
|67|`{}`|
|68|`{}`|
|69|`{}`|
|70|`{}`|
|71|`{}`|
|72|`{}`|
|73|`{}`|
|74|`{}`|
|75|`{}`|
|76|`{}`|
|77|`{}`|
|78|`{}`|
|79|`{}`|
|80|`{}`|
|81|`{}`|
|82|`{}`|
|83|`{}`|
|84|`{}`|
|85|`{}`|
|86|`{}`|
|87|`{}`|
|88|`{}`|
|89|`{}`|
|90|`{}`|
|91|`{}`|
|92|`{}`|
|93|`{}`|
|94|`{}`|
|95|`{}`|
|96|`{}`|
|97|`{}`|
|98|`{}`|
|99|`{}`|
|100|`{}`|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|
|107|`{}`|
|108|`{}`|
|109|`{}`|
|110|`{}`|
|111|`{}`|
|112|`{}`|
|113|`{}`|
|114|`{}`|
|115|`{}`|
|116|`{}`|
|117|`{}`|
|118|`{}`|
|119|`{}`|
|120|`{}`|
|121|`{}`|
|122|`{}`|
|123|`{}`|
|124|`{}`|
|125|`{}`|
|126|`{}`|
|127|`{}`|
|128|`{}`|
|129|`{}`|
|130|`{}`|
|131|`{}`|
|132|`{}`|
|133|`{}`|
|134|`{}`|
|135|`{}`|
|136|`{}`|
|137|`{}`|
|138|`{}`|
|139|`{}`|
|140|`{}`|
|141|`{}`|
|142|`{}`|
|143|`{}`|
|144|`{}`|
|145|`{}`|
|146|`{}`|
|147|`{}`|
|148|`{}`|
|149|`{}`|
|150|`{}`|
|151|`{}`|
|152|`{}`|
|153|`{}`|
|154|`{}`|
|155|`{}`|
|156|`{}`|
|157|`{}`|
|158|`{}`|
|159|`{}`|
|160|`{}`|
|161|`{}`|
|162|`{}`|
|163|`{}`|
|164|`{}`|
|165|`{}`|
|166|`{}`|
|167|`{}`|
|168|`{}`|
|169|`{}`|
|170|`{}`|
|171|`{}`|
|172|`{}`|
|173|`{}`|
|174|`{}`|
|175|`{}`|
|176|`{}`|
|177|`{}`|
|178|`{}`|
|179|`{}`|
|180|`{}`|
|181|`{}`|
|182|`{}`|
|183|`{}`|
|184|`{}`|
|185|`{}`|
|186|`{}`|
|187|`{}`|
|188|`{}`|
|189|`{}`|
|190|`{}`|
|191|`{}`|
|192|`{}`|
|193|`{}`|
|194|`{}`|
|195|`{}`|
|196|`{}`|
|197|`{}`|
|198|`{}`|
|199|`{}`|
|200|`{}`|
|201|`{}`|
|202|`{}`|

## StoryChapter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|

## ReforgeAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|array|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|25|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|tid|number|25|本表行键；与其他表同值不自动代表同一对象。|
|val_range|array|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5|`{"score":250,"quality":[[1500,20],[2100,30],[2700,40],[3000,50]],"weight":858}`|
|6|`{"score":250,"quality":[[1500,20],[2100,30],[2700,40],[3000,50]],"weight":857}`|
|11|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":857}`|
|12|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":500}`|
|15|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":857}`|
|16|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":500}`|
|17|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":857}`|
|18|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":857}`|
|21|`{"score":250,"quality":[[1400,30],[1800,40],[2000,50]],"weight":150}`|
|34|`{"score":250,"quality":[[1050,30],[1350,40],[1500,50]],"weight":150}`|
|45|`{"score":250,"quality":[[1500,20],[2100,30],[2700,40],[3000,50]],"weight":857}`|
|56|`{"score":250,"quality":[[1050,30],[1350,40],[1500,50]],"weight":150}`|
|59|`{"score":250,"quality":[[2100,30],[2700,40],[3000,50]],"weight":150}`|
|60|`{"score":250,"quality":[[2100,30],[2700,40],[3000,50]],"weight":150}`|
|61|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":500}`|
|62|`{"score":250,"quality":[[1000,20],[1400,30],[1800,40],[2000,50]],"weight":500}`|
|65|`{"score":250,"quality":[[2100,30],[2700,40],[3000,50]],"weight":150}`|
|66|`{"score":250,"quality":[[1400,30],[1800,40],[2000,50]],"weight":150}`|
|67|`{"score":250,"quality":[[2100,30],[2700,40],[3000,50]],"weight":150}`|
|68|`{"score":250,"quality":[[1400,30],[1800,40],[2000,50]],"weight":150}`|
|134|`{"score":250,"quality":[[1350,40],[1500,50]],"weight":100}`|
|135|`{"score":250,"quality":[[1350,40],[1500,50]],"weight":100}`|
|169|`{"score":250,"quality":[[1400,30],[1800,40],[2000,50]],"weight":150}`|
|170|`{"score":250,"quality":[[1400,30],[1800,40],[2000,50]],"weight":150}`|
|171|`{"score":250,"quality":[[1400,30],[1800,40],[2000,50]],"weight":150}`|

## ReforgeConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|attr_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|calc_score_m|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|lock_price_ratio|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_score|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|reforge_quality|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_currency_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|min_red_score|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_val_rate|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|cost_currency_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_item":710002,"cost_num":10,"attr_count":4,"calc_score_m":1.5,"lock_price_ratio":[25000,60000],"max_score":1000,"reforge_quality":60,"cost_currency_num":100,"min_red_score":300,"max_val_rate":1000,"cost_currency_item":401500}`|

## Reforge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|recommend_attr|array|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|76|本表行键；与其他表同值不自动代表同一对象。|
|skill|array|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"recommend_attr":[135,61,68,169,60,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|1010201|`{"recommend_attr":[134,59,62,17,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|1020101|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|1020201|`{"recommend_attr":[135,61,68,169,60,5],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|1020301|`{"recommend_attr":[134,65,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|1020401|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1020501|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1020601|`{"recommend_attr":[135,171,16,15,5,45],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1030101|`{"recommend_attr":[134,171,169,62,60,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1030201|`{"recommend_attr":[135,170,68,169,60,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|1030301|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|1030401|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|1030501|`{"recommend_attr":[135,171,16,15,5,45],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1030601|`{"recommend_attr":[134,171,169,62,60,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1030701|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1040101|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|1040201|`{"recommend_attr":[134,171,169,62,60,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|1040301|`{"recommend_attr":[134,66,6,171,21,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|2010101|`{"recommend_attr":[134,65,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|2010201|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|2020101|`{"recommend_attr":[135,16,15,18,45,6],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|2020201|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|2020301|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2020401|`{"recommend_attr":[134,61,12,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2020501|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|2020601|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2030101|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|2030201|`{"recommend_attr":[134,61,12,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2030301|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2030401|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2030501|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2030601|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|2030701|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|2040101|`{"recommend_attr":[134,61,12,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|2040201|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|3010101|`{"recommend_attr":[134,61,12,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|3010201|`{"recommend_attr":[135,66,60,169,62,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|3010301|`{"recommend_attr":[134,61,12,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|3020101|`{"recommend_attr":[135,171,16,15,5,45],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|3020201|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|3020301|`{"recommend_attr":[135,16,15,18,45,6],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|3020401|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|3020501|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|3030201|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|3030301|`{"recommend_attr":[134,59,62,17,62,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|3030401|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|3030501|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|3030601|`{"recommend_attr":[134,59,62,17,62,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|3030701|`{"recommend_attr":[134,59,12,17,62,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|3040101|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|3040201|`{"recommend_attr":[134,59,12,17,62,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|4010101|`{"recommend_attr":[134,59,62,17,62,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|4010201|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|4010301|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|4020101|`{"recommend_attr":[135,61,68,169,60,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|4020201|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|4020301|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|4020401|`{"recommend_attr":[135,61,68,169,60,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|4020501|`{"recommend_attr":[134,66,12,11,62,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|4030101|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|4030201|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|4030301|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|4030401|`{"recommend_attr":[135,170,68,169,60,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|4030501|`{"recommend_attr":[134,65,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|4030601|`{"recommend_attr":[135,170,68,169,60,5],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|4030801|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|4040201|`{"recommend_attr":[134,66,12,11,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|4040301|`{"recommend_attr":[134,12,11,66,17,6],"skill":[[500,39001101],[600,39001201],[700,39001301]]}`|
|4040401|`{"recommend_attr":[135,171,169,62,60,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|5040101|`{"recommend_attr":[134,66,6,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|5040201|`{"recommend_attr":[135,21,68,169,5,45],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|5040301|`{"recommend_attr":[134,66,6,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|5040401|`{"recommend_attr":[135,21,68,169,15,5],"skill":[[500,39003101],[600,39003201],[700,39003301]]}`|
|5040501|`{"recommend_attr":[135,68,16,15,18,5],"skill":[[500,39002101],[600,39002201],[700,39002301]]}`|
|5040601|`{"recommend_attr":[135,66,6,11,17,6],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|
|5040701|`{"recommend_attr":[135,66,68,169,17,45],"skill":[[500,39004101],[600,39004201],[700,39004301]]}`|

## SchoolChooseConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hit|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## SchoolChoose

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|partner|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fix_hero|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":200,"fix_hero":1030101}`|
|2|`{"type":100,"fix_hero":2030201}`|
|3|`{"type":400,"fix_hero":3030601}`|
|4|`{"type":300,"fix_hero":4030501}`|

## PotentialCount

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|hero_break_lv|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero_break_lv":3}`|
|2|`{"hero_break_lv":5}`|
|3|`{"hero_break_lv":8}`|
|4|`{"hero_break_lv":12}`|
|5|`{"hero_break_lv":18}`|

## PotentialGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|ability|array|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"ability":[120000001,120000002,120000003]}`|
|2|`{"ability":[120000004,120000005,120000006]}`|
|3|`{"ability":[120000007,120000008,120000009]}`|
|4|`{"ability":[120000010,120000011,120000012]}`|
|5|`{"ability":[120000013,120000014,120000015]}`|
|6|`{"ability":[120000016,120000017,120000018]}`|
|7|`{"ability":[120000019,120000020,120000021]}`|
|8|`{"ability":[120000022,120000023,120000024]}`|
|9|`{"ability":[120000025,120000026,120000027]}`|
|10|`{"ability":[120000028,120000029,120000030]}`|
|11|`{"ability":[120000031,120000032,120000033]}`|
|12|`{"ability":[120000034,120000035,120000036]}`|
|13|`{"ability":[120000037,120000038,120000039]}`|
|14|`{"ability":[120000040,120000041,120000042]}`|
|15|`{"ability":[120000043,120000044,120000045]}`|
|16|`{"ability":[120000046,120000047,120000048]}`|
|17|`{"ability":[120000049,120000050,120000051]}`|
|18|`{"ability":[120000052,120000053,120000054]}`|
|19|`{"ability":[120000055,120000056,120000057]}`|
|20|`{"ability":[120000058,120000059,120000060]}`|

## Potential

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|potential_group|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"potential_group":[1,2,3,4,5]}`|
|2|`{"potential_group":[6,7,8,9,10]}`|
|3|`{"potential_group":[11,12,13,14,15]}`|
|4|`{"potential_group":[16,17,18,19,20]}`|

## LegendHotTalk

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|name|array|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|comment|array|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|like_count|array|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|33|本表行键；与其他表同值不自动代表同一对象。|
|icon|array|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"like_count":[946,336,17,8,1,2,4,6,2,2,3,1,2,1,1,2,6,7,2,2,1,2,2,2,2,1,2,2,1,3,2,5,2,6,8,7,7,2,4,3]}`|
|2|`{"like_count":[972,258,10,3,3,2,7,3,4,8,2,2,9,2,6,7,1,2,3,3,4,2,5,3,4,3,6,3,5,1,5,7,3,4,3,3,5,2,3,3]}`|
|3|`{"like_count":[1031,358,9,5,2,8,4,5,7,8,3,1,6,1,2,8,3,5,3,6,7,7,2,2,5,2,7,5,2,2,2,4,3,5,4,4,6,9,2,9]}`|
|4|`{"like_count":[1153,459,11,6,4,2,3,2,2,4,6,2,8,6,3,4,2,8,4,7,2,1,5,7,3,5,4,6,4,1,7,3,5,3,9,4,5,2,6,2]}`|
|5|`{"like_count":[890,160,19,7,3,2,1,1,3,5,9,7,8,9,6,5,4,5,4,3,3,4,5,6,4,3,2,2,1,1,4,4,5,5,2,9,9,8,5,6]}`|
|6|`{"like_count":[890,160,19,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7]}`|
|7|`{"like_count":[1154,461,13,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8]}`|
|8|`{"like_count":[855,262,14,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]}`|
|9|`{"like_count":[1069,163,15,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]}`|
|10|`{"like_count":[890,160,19,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7]}`|
|11|`{"like_count":[1154,461,13,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8]}`|
|12|`{"like_count":[855,262,14,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]}`|
|13|`{"like_count":[1069,163,15,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]}`|
|14|`{"like_count":[820,262,20,3,5,8,7,3,3,8]}`|
|15|`{"like_count":[1236,501,18,9,9,7,3,2,7,9]}`|
|16|`{"like_count":[920,352,32,12,4,3,1,1,8,4]}`|
|17|`{"like_count":[1178,235,25,7,1,5,7,7,9,7]}`|
|18|`{"like_count":[820,262,20,3,5,8,7,3,3,8]}`|
|19|`{"like_count":[1236,501,18,9,9,7,3,2,7,9]}`|
|20|`{"like_count":[920,352,32,12,4,3,1,1,8,4]}`|
|21|`{"like_count":[1178,235,25,7,1,5,7,7,9,7]}`|
|22|`{"like_count":[820,262,20,3,5,8,7,3,3,8]}`|
|23|`{"like_count":[1236,501,18,9,9,7,3,2,7,9]}`|
|24|`{"like_count":[920,352,32,12,4,3,1,1,8,4]}`|
|25|`{"like_count":[1178,235,25,7,1,5,7,7,9,7]}`|
|26|`{"like_count":[1178,352,25,3,1]}`|
|27|`{"like_count":[820,235,20,9,5]}`|
|28|`{"like_count":[1236,262,18,12,9]}`|
|29|`{"like_count":[920,501,32,7,4]}`|
|30|`{"like_count":[1178,352,25,3,1]}`|
|31|`{"like_count":[820,235,20,9,5]}`|
|32|`{"like_count":[1236,262,18,12,9]}`|
|33|`{"like_count":[920,501,32,7,4]}`|

## CommentParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cache_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hot_comment_condition|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_like_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_comment_cap|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_score_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|is_show|boolean|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cache_time":14400,"hot_comment_condition":100,"show_count":15,"max_like_count":20,"max_comment_cap":200,"max_score_count":2,"is_show":true}`|

## CommentInit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_score|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|comment|array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|like_count|array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_person_count|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|66|本表行键；与其他表同值不自动代表同一对象。|
|name|array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100113|`{"score":[],"init_score":0,"like_count":[542,54,9,2],"score_person_count":0}`|
|200113|`{"score":[],"init_score":0,"like_count":[465,23,5,5],"score_person_count":0}`|
|200213|`{"score":[],"init_score":0,"like_count":[398,19,3,3],"score_person_count":0}`|
|300113|`{"score":[],"init_score":0,"like_count":[612,76,6,1],"score_person_count":0}`|
|300213|`{"score":[],"init_score":0,"like_count":[442,55,5,2],"score_person_count":0}`|
|1010101|`{"score":[0],"init_score":0,"like_count":[136,36,17,8],"score_person_count":0}`|
|1010201|`{"score":[0,0],"init_score":0,"like_count":[147,58,9,9],"score_person_count":0}`|
|1020101|`{"score":[0,0,0],"init_score":0,"like_count":[147,61,18,7],"score_person_count":0}`|
|1020201|`{"score":[0,0,0],"init_score":0,"like_count":[244,51,24,7],"score_person_count":0}`|
|1020301|`{"score":[0,0,0],"init_score":0,"like_count":[228,34,16,8],"score_person_count":0}`|
|1020401|`{"score":[0,0,0],"init_score":0,"like_count":[366,36,12,9],"score_person_count":0}`|
|1020501|`{"score":[0,0,0],"init_score":0,"like_count":[374,36,17,7],"score_person_count":0}`|
|1020601|`{"score":[0,0,0],"init_score":0,"like_count":[644,166,130,95],"score_person_count":0}`|
|1030101|`{"score":[0,0,0],"init_score":0,"like_count":[632,103,75,36],"score_person_count":0}`|
|1030201|`{"score":[0,0,0],"init_score":0,"like_count":[589,132,68,44],"score_person_count":0}`|
|1030301|`{"score":[0,0,0],"init_score":0,"like_count":[546,126,59,56],"score_person_count":0}`|
|1030401|`{"score":[0,0,0],"init_score":0,"like_count":[602,225,95,73],"score_person_count":0}`|
|1030501|`{"score":[0,0,0],"init_score":0,"like_count":[593,156,88,66],"score_person_count":0}`|
|1030601|`{"score":[0,0,0],"init_score":0,"like_count":[654,238,112,23],"score_person_count":0}`|
|1040101|`{"score":[0,0,0],"init_score":0,"like_count":[786,322,116,54],"score_person_count":0}`|
|2010101|`{"score":[0,0],"init_score":0,"like_count":[244,66,25,7],"score_person_count":0}`|
|2010201|`{"score":[0,0,0],"init_score":0,"like_count":[228,61,18,6],"score_person_count":0}`|
|2020101|`{"score":[0,0,0],"init_score":0,"like_count":[346,58,9,6],"score_person_count":0}`|
|2020201|`{"score":[0,0,0],"init_score":0,"like_count":[228,66,25,7],"score_person_count":0}`|
|2020301|`{"score":[0,0,0],"init_score":0,"like_count":[332,61,18,7],"score_person_count":0}`|
|2020401|`{"score":[0,0,0],"init_score":0,"like_count":[136,51,24,8],"score_person_count":0}`|
|2020501|`{"score":[0,0,0],"init_score":0,"like_count":[147,34,16,9],"score_person_count":0}`|
|2020601|`{"score":[0,0,0],"init_score":0,"like_count":[452,66,22,9],"score_person_count":0}`|
|2030101|`{"score":[0,0,0],"init_score":0,"like_count":[610,166,75,70],"score_person_count":0}`|
|2030201|`{"score":[0,0,0],"init_score":0,"like_count":[632,203,90,72],"score_person_count":0}`|
|2030301|`{"score":[0,0,0],"init_score":0,"like_count":[574,124,88,58],"score_person_count":0}`|
|2030401|`{"score":[0,0,0],"init_score":0,"like_count":[527,156,74,53],"score_person_count":0}`|
|2030501|`{"score":[0,0,0],"init_score":0,"like_count":[580,130,91,57],"score_person_count":0}`|
|2030601|`{"score":[0,0,0],"init_score":0,"like_count":[445,238,127,4],"score_person_count":0}`|
|2040101|`{"score":[0,0,0],"init_score":0,"like_count":[920,356,210,8],"score_person_count":0}`|
|3010101|`{"score":[0,0,0],"init_score":0,"like_count":[366,51,24,7],"score_person_count":0}`|
|3010201|`{"score":[0,0,0],"init_score":0,"like_count":[374,34,16,7],"score_person_count":0}`|
|3010301|`{"score":[0,0,0],"init_score":0,"like_count":[346,36,12,8],"score_person_count":0}`|
|3020101|`{"score":[0,0,0],"init_score":0,"like_count":[244,36,12,7],"score_person_count":0}`|
|3020201|`{"score":[0,0,0],"init_score":0,"like_count":[228,36,17,6],"score_person_count":0}`|
|3020301|`{"score":[0,0,0],"init_score":0,"like_count":[366,58,9,7],"score_person_count":0}`|
|3020401|`{"score":[0,0,0],"init_score":0,"like_count":[374,66,25,7],"score_person_count":0}`|
|3020501|`{"score":[0,0,0],"init_score":0,"like_count":[346,61,18,8],"score_person_count":0}`|
|3030201|`{"score":[0,0,0],"init_score":0,"like_count":[521,98,85,48],"score_person_count":0}`|
|3030301|`{"score":[0,0,0],"init_score":0,"like_count":[584,105,89,50],"score_person_count":0}`|
|3030401|`{"score":[0,0,0],"init_score":0,"like_count":[601,207,102,80],"score_person_count":0}`|
|3030501|`{"score":[0,0,0],"init_score":0,"like_count":[654,237,110,85],"score_person_count":0}`|
|3030601|`{"score":[0,0,0],"init_score":0,"like_count":[631,221,104,90],"score_person_count":0}`|
|3030701|`{"score":[0,0,0],"init_score":0,"like_count":[584,237,106,5],"score_person_count":0}`|
|3040101|`{"score":[0,0,0],"init_score":0,"like_count":[920,356,210,8],"score_person_count":0}`|
|4010101|`{"score":[0,0,0],"init_score":0,"like_count":[228,36,17,9],"score_person_count":0}`|
|4010201|`{"score":[0,0,0],"init_score":0,"like_count":[332,58,9,7],"score_person_count":0}`|
|4010301|`{"score":[0,0,0],"init_score":0,"like_count":[136,66,25,6],"score_person_count":0}`|
|4020101|`{"score":[0,0,0],"init_score":0,"like_count":[228,51,24,9],"score_person_count":0}`|
|4020201|`{"score":[0,0,0],"init_score":0,"like_count":[332,34,16,7],"score_person_count":0}`|
|4020301|`{"score":[0,0,0],"init_score":0,"like_count":[346,36,12,6],"score_person_count":0}`|
|4020401|`{"score":[0,0,0],"init_score":0,"like_count":[228,61,16,7],"score_person_count":0}`|
|4020501|`{"score":[0,0,0],"init_score":0,"like_count":[332,51,12,7],"score_person_count":0}`|
|4030101|`{"score":[0,0,0],"init_score":0,"like_count":[620,210,120,88],"score_person_count":0}`|
|4030201|`{"score":[0,0,0],"init_score":0,"like_count":[602,218,112,80],"score_person_count":0}`|
|4030301|`{"score":[0,0,0],"init_score":0,"like_count":[589,204,106,70],"score_person_count":0}`|
|4030401|`{"score":[0,0,0],"init_score":0,"like_count":[598,208,120,75],"score_person_count":0}`|
|4030501|`{"score":[0,0,0],"init_score":0,"like_count":[621,187,125,85],"score_person_count":0}`|
|4030601|`{"score":[0,0,0],"init_score":0,"like_count":[228,51,24,9],"score_person_count":0}`|
|4030801|`{"score":[0,0,0],"init_score":0,"like_count":[689,203,130,101],"score_person_count":0}`|
|4040201|`{"score":[0,0,0],"init_score":0,"like_count":[832,342,219,3],"score_person_count":0}`|

## RentRule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|max_num_one_fight|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|fun_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|flush_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_fight_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fail_count|boolean|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3|`{"max_num_one_fight":1,"fun_open":1056,"flush_type":0,"max_fight_num":1,"fail_count":true}`|

## Rent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|single_max_rent_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|cache_flush_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|flush_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|rent_power_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rent_check|boolean|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_fight|boolean|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reset_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|min_lv|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|min_star|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|lua_module|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_rent_out_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_rent_in_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{"single_max_rent_num":0,"cache_flush_time":60,"flush_type":0,"rent_power_rate":1.2,"is_fight":false,"reset_type":1,"min_lv":0,"min_star":5,"max_rent_out_num":0,"max_rent_in_num":5}`|

## Rare

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|affect_skill|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|skill|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|old_quality_idx|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|old_skill_desc|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_skill_desc|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_quality_idx|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|aptitude|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1030101|`{"affect_skill":3,"skill":6103010109,"old_quality_idx":2,"old_skill_desc":676878,"extra_skill_desc":676879,"new_quality_idx":3}`|
|1030501|`{"affect_skill":3,"skill":6103030103,"old_quality_idx":2,"old_skill_desc":678146,"extra_skill_desc":678147,"new_quality_idx":3}`|
|2030201|`{"affect_skill":3,"skill":6203020109,"old_quality_idx":2,"old_skill_desc":676843,"extra_skill_desc":676844,"new_quality_idx":3}`|
|2030301|`{"affect_skill":3,"skill":6203030106,"old_quality_idx":2,"old_skill_desc":677572,"extra_skill_desc":677573,"new_quality_idx":3}`|
|3030201|`{"affect_skill":3,"skill":6303020105,"old_quality_idx":2,"old_skill_desc":678443,"extra_skill_desc":678444,"new_quality_idx":3}`|
|3030501|`{"affect_skill":3,"skill":6401030108,"old_quality_idx":2,"old_skill_desc":676173,"extra_skill_desc":676174,"new_quality_idx":3}`|
|3030601|`{"affect_skill":3,"skill":6303060111,"old_quality_idx":2,"old_skill_desc":677475,"extra_skill_desc":677476,"new_quality_idx":3}`|
|4030401|`{"affect_skill":3,"skill":6403040106,"old_quality_idx":2,"old_skill_desc":677765,"extra_skill_desc":677766,"new_quality_idx":3}`|
|4030501|`{"affect_skill":3,"skill":6403050105,"old_quality_idx":2,"old_skill_desc":677312,"extra_skill_desc":677313,"new_quality_idx":3}`|

## IntimacyDate

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## FetterEffectLineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lineup_name|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fantasy_condition_desc|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ability|array|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|61|本表行键；与其他表同值不自动代表同一对象。|
|eff_range|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition_desc|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fantasy_desc|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"fantasy_condition_desc":0,"ability":[5101010101,5101010102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|1010201|`{"fantasy_condition_desc":0,"ability":[5101020101,5101020102],"condition_desc":59838,"power":0,"attr":[[13,2000]]}`|
|1020101|`{"fantasy_condition_desc":0,"ability":[5102010101,5102010102],"condition_desc":59839,"power":0,"attr":[[15,2500]]}`|
|1020201|`{"fantasy_condition_desc":0,"ability":[5102020101,5102020102],"condition_desc":59838,"power":0,"attr":[[13,2000]]}`|
|1020301|`{"fantasy_condition_desc":0,"ability":[5102030101,5102030102],"condition_desc":59838,"power":0,"attr":[[11,2500]]}`|
|1020401|`{"fantasy_condition_desc":0,"ability":[5102040101,5102040102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|1020501|`{"fantasy_condition_desc":0,"ability":[5102050101,5102050102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|1020601|`{"fantasy_condition_desc":0,"ability":[5101040101,5101040102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|1030101|`{"fantasy_condition_desc":0,"ability":[5103010101,5103010102],"condition_desc":59838,"power":0,"attr":[[29,3500]]}`|
|1030201|`{"fantasy_condition_desc":0,"ability":[5103020101,5103020102],"condition_desc":59838,"power":0,"attr":[[11,2500]]}`|
|1030301|`{"fantasy_condition_desc":0,"ability":[5103030101,5103030102],"condition_desc":59841,"power":0,"attr":[[13,2000]]}`|
|1030401|`{"fantasy_condition_desc":0,"ability":[5103040101,5103040102],"condition_desc":59840,"power":0,"attr":[[15,2500]]}`|
|1030501|`{"fantasy_condition_desc":0,"ability":[5103050101,5103050102],"condition_desc":59838,"power":0,"attr":[[15,2500]]}`|
|1030601|`{"fantasy_condition_desc":0,"ability":[5103060101,5103060102],"condition_desc":59850,"power":0,"attr":[[23,2000]]}`|
|1030701|`{"fantasy_condition_desc":0,"ability":[5103070101,5103070102],"condition_desc":59841,"power":0,"attr":[[23,2000]]}`|
|2010101|`{"fantasy_condition_desc":0,"ability":[5201010101,5201010102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|2010201|`{"fantasy_condition_desc":0,"ability":[5201020101,5201020102],"condition_desc":59838,"power":0,"attr":[[13,2000]]}`|
|2020101|`{"fantasy_condition_desc":0,"ability":[5202010101,5202010102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|2020201|`{"fantasy_condition_desc":0,"ability":[5202020101,5202020102],"condition_desc":59838,"power":0,"attr":[[12,3500]]}`|
|2020301|`{"fantasy_condition_desc":0,"ability":[5202030101,5202030102],"condition_desc":59838,"power":0,"attr":[[11,2500]]}`|
|2020401|`{"fantasy_condition_desc":0,"ability":[5202040101,5202040102],"condition_desc":59845,"power":0,"attr":[[11,2500]]}`|
|2020501|`{"fantasy_condition_desc":0,"ability":[5202050101,5202050102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|2020601|`{"fantasy_condition_desc":0,"ability":[5202060101,5202060102],"condition_desc":59838,"power":0,"attr":[[11,2500]]}`|
|2030101|`{"fantasy_condition_desc":0,"ability":[5203010101,5203010102],"condition_desc":59838,"power":0,"attr":[[60,5000]]}`|
|2030201|`{"fantasy_condition_desc":0,"ability":[5203020101,5203020102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|2030301|`{"fantasy_condition_desc":0,"ability":[5203030101,5203030102],"condition_desc":59838,"power":0,"attr":[[11,2500]]}`|
|2030401|`{"fantasy_condition_desc":0,"ability":[5203040101,5203040102],"condition_desc":59844,"power":0,"attr":[[57,1500]]}`|
|2030501|`{"fantasy_condition_desc":0,"ability":[5203050101,5203050102],"condition_desc":59838,"power":0,"attr":[[11,2500]]}`|
|2030601|`{"fantasy_condition_desc":0,"ability":[5203060101,5203060102],"condition_desc":59846,"power":0,"attr":[[23,2000]]}`|
|2030701|`{"fantasy_condition_desc":0,"ability":[5203070101,5203070102],"condition_desc":59838,"power":0,"attr":[[66,1500]]}`|
|3010101|`{"fantasy_condition_desc":0,"ability":[5301010101,5301010102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|3010201|`{"fantasy_condition_desc":0,"ability":[5301020101,5301020102],"condition_desc":59851,"power":0,"attr":[[23,2000]]}`|
|3010301|`{"fantasy_condition_desc":0,"ability":[5301030101,5301030102],"condition_desc":59838,"power":0,"attr":[[11,2500]]}`|
|3020101|`{"fantasy_condition_desc":0,"ability":[5302010101,5302010102],"condition_desc":59847,"power":0,"attr":[[23,2000]]}`|
|3020201|`{"fantasy_condition_desc":0,"ability":[5302020101,5302020102],"condition_desc":59838,"power":0,"attr":[[21,2500]]}`|
|3020301|`{"fantasy_condition_desc":0,"ability":[5302030101,5302030102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|3020401|`{"fantasy_condition_desc":0,"ability":[5302040101,5302040102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|3020501|`{"fantasy_condition_desc":0,"ability":[5302050101,5302050102],"condition_desc":59838,"power":0,"attr":[[57,1500]]}`|
|3030201|`{"fantasy_condition_desc":0,"ability":[5303020101,5303020102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|3030301|`{"fantasy_condition_desc":0,"ability":[5303030101,5303030102],"condition_desc":59838,"power":0,"attr":[[13,2000]]}`|
|3030401|`{"fantasy_condition_desc":0,"ability":[5303040101,5303040102],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|3030501|`{"fantasy_condition_desc":0,"ability":[5303050101,5303050102],"condition_desc":59846,"power":0,"attr":[]}`|
|3030601|`{"fantasy_condition_desc":0,"ability":[5303060101,5303060102],"condition_desc":59838,"power":0,"attr":[[13,2000]]}`|
|3030701|`{"fantasy_condition_desc":0,"ability":[5303070101,5303070102],"condition_desc":59847,"power":0,"attr":[[23,2000]]}`|
|4010101|`{"fantasy_condition_desc":0,"ability":[5401010101,5401010102],"condition_desc":59838,"power":0,"attr":[[13,2000]]}`|
|4010201|`{"fantasy_condition_desc":0,"ability":[5401020101,5401020102],"condition_desc":59838,"power":0,"attr":[[15,2500]]}`|
|4010301|`{"fantasy_condition_desc":0,"ability":[5401030101,5401030102],"condition_desc":59851,"power":0,"attr":[[15,2500]]}`|
|4020101|`{"fantasy_condition_desc":0,"ability":[5402010101,5402010102],"condition_desc":59850,"power":0,"attr":[[23,2000]]}`|
|4020201|`{"fantasy_condition_desc":0,"ability":[5402020101,5402020102],"condition_desc":59838,"power":0,"attr":[[12,3500]]}`|
|4020301|`{"fantasy_condition_desc":0,"ability":[5402030101,5402030102],"condition_desc":59838,"power":0,"attr":[[57,1500]]}`|
|4020401|`{"fantasy_condition_desc":0,"ability":[5402040101,5402040102],"condition_desc":59838,"power":0,"attr":[]}`|
|4020501|`{"fantasy_condition_desc":0,"ability":[5402050101,5402050102],"condition_desc":59838,"power":0,"attr":[]}`|
|4030101|`{"fantasy_condition_desc":0,"ability":[5403010101,5403010102],"condition_desc":59838,"power":0,"attr":[[21,2500]]}`|
|4030201|`{"fantasy_condition_desc":0,"ability":[5403020101,5403020102],"condition_desc":59838,"power":0,"attr":[[15,2500]]}`|
|4030301|`{"fantasy_condition_desc":0,"ability":[5403030101,5403030102],"condition_desc":59849,"power":0,"attr":[[13,2000]]}`|
|4030401|`{"fantasy_condition_desc":0,"ability":[5403040101,5403040102],"condition_desc":59838,"power":0,"attr":[[15,2500]]}`|
|4030501|`{"fantasy_condition_desc":0,"ability":[5403050101,5403050102],"condition_desc":59838,"power":0,"attr":[[57,1500]]}`|
|4030601|`{"fantasy_condition_desc":0,"ability":[5403060101,5403060102],"condition_desc":59840,"power":0,"attr":[[15,2500]]}`|
|4030801|`{"fantasy_condition_desc":0,"ability":[5403080101,5403080102],"condition_desc":59852,"power":0,"attr":[[60,5000]]}`|
|9005500|`{"fantasy_condition_desc":0,"ability":[900550002],"condition_desc":59838,"power":0,"attr":[[23,2000]]}`|
|9005600|`{"fantasy_condition_desc":0,"ability":[900560002],"condition_desc":59838,"power":0,"attr":[[13,2000]]}`|

## FetterShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|img_small_bg|string|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|img_strip_bg|string|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relevance|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_corner|string|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg|string|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|

## FetterEffectNormal

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|des|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|30|`{"attr":[[5,700],[6,700],[26,700],[27,700]]}`|
|40|`{"attr":[[5,1000],[6,1000],[26,1000],[27,1000]]}`|
|50|`{"attr":[[5,1600],[6,1600],[26,1600],[27,1600]]}`|

## FetterEffectCondition

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|c_module|object|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_analyze|undefined/object|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|201|`{}`|
|202|`{}`|
|203|`{}`|
|204|`{}`|
|205|`{}`|
|206|`{}`|
|207|`{}`|

## Fetter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fantasy_lineup_args|number/array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_condition|number|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_args|array/number|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_show_params|number/array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|79|本表行键；与其他表同值不自动代表同一对象。|
|gather_args|array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fantasy_lineup_show_params|number/array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gather_name|array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dragon|array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gather_condition|array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fantasy_lineup_condition|number|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1010201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1020101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1020201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1020301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1020401|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1020501|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1020601|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1030101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1030201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1030301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1030401|`{"lineup_condition":203,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1030501|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1030601|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1030701|`{"lineup_condition":203,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1040101|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1040201|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|1040301|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2010101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2010201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2020101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2020201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2020301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2020401|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2020501|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2020601|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":204}`|
|2030101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2030201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2030301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2030401|`{"lineup_condition":203,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2030501|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2030601|`{"lineup_condition":202,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2030701|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2040101|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|2040201|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3010101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3010201|`{"lineup_condition":202,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3010301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3020101|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3020201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3020301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3020401|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3020501|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3030201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3030301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3030401|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3030501|`{"lineup_condition":202,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3030601|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3030701|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3040101|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|3040201|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4010101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4010201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4010301|`{"lineup_condition":202,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4020101|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4020201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4020301|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4020401|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4020501|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4030101|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4030201|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4030301|`{"lineup_condition":203,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4030401|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4030501|`{"lineup_condition":201,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4030601|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4030801|`{"lineup_condition":204,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":204}`|
|4040101|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4040201|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4040301|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|4040401|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|5040101|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|5040201|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|5040301|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|5040401|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|5040501|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|5040601|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|5040701|`{"lineup_condition":0,"gather_condition":[101,101,101,101],"fantasy_lineup_condition":0}`|
|9005500|`{"lineup_condition":201,"gather_condition":[],"fantasy_lineup_condition":0}`|
|9005600|`{"lineup_condition":201,"gather_condition":[],"fantasy_lineup_condition":0}`|

## FetterEffectDragon

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|ability|array|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_name|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|90|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|102010100|`{"ability":[5104010102],"power":0,"attr":[[15,2500]]}`|
|102010105|`{"ability":[5104010103],"power":0,"attr":[[15,3000]]}`|
|102010110|`{"ability":[5104010104],"power":0,"attr":[[15,3500]]}`|
|102020100|`{"ability":[5104030105],"power":0,"attr":[[11,2500]]}`|
|102020105|`{"ability":[5104030106],"power":0,"attr":[[11,3000]]}`|
|102020110|`{"ability":[5104030107],"power":0,"attr":[[11,3500]]}`|
|102030100|`{"ability":[5404040105],"power":0,"attr":[[15,2500]]}`|
|102030105|`{"ability":[5404040106],"power":0,"attr":[[15,3000]]}`|
|102030110|`{"ability":[5404040107],"power":0,"attr":[[15,3500]]}`|
|102040100|`{"ability":[5304010105],"power":0,"attr":[[11,1500]]}`|
|102040105|`{"ability":[5304010106],"power":0,"attr":[[11,2000]]}`|
|102040110|`{"ability":[5304010107],"power":0,"attr":[[11,2500]]}`|
|102050100|`{"ability":[5104030102],"power":0,"attr":[[15,2500]]}`|
|102050105|`{"ability":[5104030103],"power":0,"attr":[[15,3000]]}`|
|102050110|`{"ability":[5104030104],"power":0,"attr":[[15,3500]]}`|
|103020100|`{"ability":[5104020102],"power":0,"attr":[[11,2500]]}`|
|103020105|`{"ability":[5104020103],"power":0,"attr":[[11,3000]]}`|
|103020110|`{"ability":[5104020104],"power":0,"attr":[[11,3500]]}`|
|103030100|`{"ability":[5104020105],"power":0,"attr":[[23,2000]]}`|
|103030105|`{"ability":[5104020106],"power":0,"attr":[[23,2500]]}`|
|103030110|`{"ability":[5104020107],"power":0,"attr":[[23,3000]]}`|
|202010100|`{"ability":[5204020102],"power":0,"attr":[[11,2500]]}`|
|202010105|`{"ability":[5204020103],"power":0,"attr":[[11,3000]]}`|
|202010110|`{"ability":[5204020104],"power":0,"attr":[[11,3500]]}`|
|202020100|`{"ability":[5104010105],"power":0,"attr":[[23,2000]]}`|
|202020105|`{"ability":[5104010106],"power":0,"attr":[[23,2500]]}`|
|202020110|`{"ability":[5104010107],"power":0,"attr":[[23,3000]]}`|
|202030100|`{"ability":[5204020105],"power":0,"attr":[[13,2500]]}`|
|202030105|`{"ability":[5204020106],"power":0,"attr":[[13,3000]]}`|
|202030110|`{"ability":[5204020107],"power":0,"attr":[[13,3500]]}`|
|202040100|`{"ability":[5504010102],"power":0,"attr":[[54,0],[66,0]]}`|
|202040105|`{"ability":[5504010103],"power":0,"attr":[[54,0],[66,0]]}`|
|202040110|`{"ability":[5504010104],"power":0,"attr":[[54,0],[66,0]]}`|
|202050100|`{"ability":[5504030102],"power":0,"attr":[[54,0],[66,0]]}`|
|202050105|`{"ability":[5504030103],"power":0,"attr":[[54,0],[66,0]]}`|
|202050110|`{"ability":[5504030104],"power":0,"attr":[[54,0],[66,0]]}`|
|202060100|`{"ability":[5304010102],"power":0,"attr":[[13,1000]]}`|
|202060105|`{"ability":[5304010103],"power":0,"attr":[[13,1500]]}`|
|202060110|`{"ability":[5304010104],"power":0,"attr":[[13,3000]]}`|
|203010100|`{"ability":[5204010102],"power":0,"attr":[[11,2500]]}`|
|203010105|`{"ability":[5204010103],"power":0,"attr":[[11,3000]]}`|
|203010110|`{"ability":[5204010104],"power":0,"attr":[[11,3500]]}`|
|203040100|`{"ability":[5504050102],"power":0,"attr":[[54,0],[66,0]]}`|
|203040105|`{"ability":[5504050103],"power":0,"attr":[[54,0],[66,0]]}`|
|203040110|`{"ability":[5504050104],"power":0,"attr":[[54,0],[66,0]]}`|
|203050100|`{"ability":[5204010105],"power":0,"attr":[[13,2000]]}`|
|203050105|`{"ability":[5204010106],"power":0,"attr":[[13,2500]]}`|
|203050110|`{"ability":[5204010107],"power":0,"attr":[[13,3000]]}`|
|302010100|`{"ability":[5504040102],"power":0,"attr":[[54,0],[66,0]]}`|
|302010105|`{"ability":[5504040103],"power":0,"attr":[[54,0],[66,0]]}`|
|302010110|`{"ability":[5504040104],"power":0,"attr":[[54,0],[66,0]]}`|
|302020100|`{"ability":[5304010102],"power":0,"attr":[[13,1200]]}`|
|302020105|`{"ability":[5304010103],"power":0,"attr":[[13,1500]]}`|
|302020110|`{"ability":[5304010104],"power":0,"attr":[[13,1800]]}`|
|302030100|`{"ability":[5404010102],"power":0,"attr":[[11,2500]]}`|
|302030105|`{"ability":[5404010103],"power":0,"attr":[[11,3000]]}`|
|302030110|`{"ability":[5404010104],"power":0,"attr":[[11,3500]]}`|
|302050100|`{"ability":[5404020102],"power":0,"attr":[[13,2000]]}`|
|302050105|`{"ability":[5404020103],"power":0,"attr":[[13,2500]]}`|
|302050110|`{"ability":[5404020104],"power":0,"attr":[[13,3000]]}`|
|303030100|`{"ability":[5304020102],"power":0,"attr":[[11,2500]]}`|
|303030105|`{"ability":[5304020103],"power":0,"attr":[[11,3000]]}`|
|303030110|`{"ability":[5304020104],"power":0,"attr":[[11,3500]]}`|
|303040100|`{"ability":[5304020105],"power":0,"attr":[[15,2500]]}`|
|303040105|`{"ability":[5304020106],"power":0,"attr":[[15,3000]]}`|
|303040110|`{"ability":[5304020107],"power":0,"attr":[[15,3500]]}`|
|303050100|`{"ability":[5504070102],"power":0,"attr":[[54,0],[66,0]]}`|
|303050105|`{"ability":[5504070103],"power":0,"attr":[[54,0],[66,0]]}`|
|303050110|`{"ability":[5504070104],"power":0,"attr":[[54,0],[66,0]]}`|
|303060100|`{"ability":[5504060102],"power":0,"attr":[[54,0],[66,0]]}`|
|303060105|`{"ability":[5504060103],"power":0,"attr":[[54,0],[66,0]]}`|
|303060110|`{"ability":[5504060104],"power":0,"attr":[[54,0],[66,0]]}`|
|402020100|`{"ability":[5504020102],"power":0,"attr":[[54,0],[66,0]]}`|
|402020105|`{"ability":[5504020103],"power":0,"attr":[[54,0],[66,0]]}`|
|402020110|`{"ability":[5504020104],"power":0,"attr":[[54,0],[66,0]]}`|
|402030100|`{"ability":[5404040102],"power":0,"attr":[[11,2500]]}`|
|402030105|`{"ability":[5404040103],"power":0,"attr":[[11,3000]]}`|
|402030110|`{"ability":[5404040104],"power":0,"attr":[[11,3500]]}`|
|402040100|`{"ability":[5404010105],"power":0,"attr":[[13,2000]]}`|
|402040105|`{"ability":[5404010106],"power":0,"attr":[[13,2500]]}`|
|402040110|`{"ability":[5404010107],"power":0,"attr":[[13,3000]]}`|
|402050100|`{"ability":[5404020105],"power":0,"attr":[[11,2500]]}`|
|402050105|`{"ability":[5404020106],"power":0,"attr":[[11,3000]]}`|
|402050110|`{"ability":[5404020107],"power":0,"attr":[[11,3500]]}`|
|403020100|`{"ability":[5404030102],"power":0,"attr":[[11,2500]]}`|
|403020105|`{"ability":[5404030103],"power":0,"attr":[[11,3000]]}`|
|403020110|`{"ability":[5404030104],"power":0,"attr":[[11,3500]]}`|
|403030100|`{"ability":[5404030105],"power":0,"attr":[[13,2500]]}`|
|403030105|`{"ability":[5404030106],"power":0,"attr":[[13,3000]]}`|
|403030110|`{"ability":[5404030107],"power":0,"attr":[[13,3500]]}`|

## GetWay

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|get_way|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|9|`{}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|small_border|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|convert_piece|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chat_share_txt_attr|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_attr_tid|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_quality_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cultivate_quality_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_draw_quality_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_hero_middle_bar|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_title_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|msg_award_bg|string|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_tag|string|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|fetter_head_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_middle_quality_long_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|convert_piece_new|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon_bottom|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_ck_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|card_bar|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name_txt_attr|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trial_piece_num|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_middle_quality_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fetter_head_frame|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_hero_bar|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|30|`{"convert_piece":20,"chat_share_txt_attr":1023,"card_quality_bg":"img_kp_down_lan.png","cultivate_quality_icon":"img_r.png","attr_bg":"img_yxjm_lansetiao.png","card_draw_quality_bg":"img_ck_rbiaozhi.png","card_hero_middle_bar":"img_yxtx_medium_lanup.png","msg_award_bg":"img_pzjl_lan.png","award_tag":"img_beibao_R.png","card_middle_quality_long_bg":"img_ss_medium_lan1.png","convert_piece_new":10,"quality_icon":"img_r2.png","quality_ck_icon":"img_ck_r.png","name_txt_attr":4004,"trial_piece_num":180,"card_middle_quality_bg":"img_yxtx_medium_lan.png","card_hero_bar":"img_yxjm_lantiao2.png","lv_bg":"img_kp_lan.png"}`|
|40|`{"convert_piece":30,"chat_share_txt_attr":1024,"card_quality_bg":"img_kp_down_zi.png","cultivate_quality_icon":"img_sr.png","attr_bg":"img_yxjm_zisetiao.png","card_draw_quality_bg":"img_ck_srbiaozhi.png","card_hero_middle_bar":"img_yxtx_medium_ziup.png","msg_award_bg":"img_pzjl_zi.png","award_tag":"img_beibao_SR.png","card_middle_quality_long_bg":"img_yxtx_medium_zidi2.png","convert_piece_new":15,"quality_icon":"img_sr2.png","quality_ck_icon":"img_ck_sr.png","name_txt_attr":4003,"trial_piece_num":240,"card_middle_quality_bg":"img_yxtx_medium_zidi.png","card_hero_bar":"img_yxjm_zitiao2.png","lv_bg":"img_kp_zi.png"}`|
|50|`{"convert_piece":60,"chat_share_txt_attr":1025,"card_quality_bg":"img_kp_down_huang.png","cultivate_quality_icon":"img_ssr.png","attr_bg":"img_yxjm_huangsetiao.png","card_draw_quality_bg":"img_ck_ssrbiaozhi.png","card_hero_middle_bar":"img_yxtx_medium_huangup.png","msg_award_bg":"img_pzjl_huang.png","award_tag":"img_beibao_SSR.png","card_middle_quality_long_bg":"img_yxtx_medium_huang1.png","convert_piece_new":60,"quality_icon":"img_ssr2.png","quality_ck_icon":"img_ck_ssr.png","name_txt_attr":4002,"trial_piece_num":240,"card_middle_quality_bg":"img_yxtx_medium_huang.png","card_hero_bar":"img_yxjm_huangtiao2.png","lv_bg":"img_kp_huang.png"}`|
|60|`{"convert_piece":80,"chat_share_txt_attr":4007,"card_quality_bg":"img_kp_down_cai.png","cultivate_quality_icon":"img_ur.png","attr_bg":"img_yxjm_caisetiao.png","card_draw_quality_bg":"img_ck_urbiaozhi.png","card_hero_middle_bar":"img_yxtx_medium_caiup.png","msg_award_bg":"img_pzjl_cai.png","award_tag":"img_beibao_ur.png","card_middle_quality_long_bg":"img_yxtx_medium_cai1.png","convert_piece_new":80,"quality_icon":"img_ur2.png","quality_ck_icon":"img_ck_ur.png","name_txt_attr":4007,"trial_piece_num":0,"card_middle_quality_bg":"img_yxtx_medium_cai.png","card_hero_bar":"img_yxjm_caitiao2.png","lv_bg":"img_kp_cai1.png"}`|
|70|`{"convert_piece":80,"chat_share_txt_attr":6142,"card_quality_bg":"img_kp_down_cai.png","cultivate_quality_icon":"img_ur.png","attr_bg":"img_yxjm_chaofan2.png","card_draw_quality_bg":"img_ck_urbiaozhi.png","card_hero_middle_bar":"img_yxtx_medium_chaofanup.png","msg_award_bg":"img_pzjl_cai.png","award_tag":"img_beibao_ur.png","card_middle_quality_long_bg":"img_yxtx_medium_chaofan1.png","convert_piece_new":80,"quality_icon":"img_ur2.png","quality_ck_icon":"img_ck_ur.png","name_txt_attr":6142,"trial_piece_num":0,"card_middle_quality_bg":"img_yxtx_medium_chaofan.png","card_hero_bar":"img_yxjm_chaofan2.png","lv_bg":"img_sp_shouhuihebaofa_chaofan.png"}`|

## HeadAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|free_head|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|77|本表行键；与其他表同值不自动代表同一对象。|
|need_level|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"free_head":101208,"need_level":0}`|
|1010201|`{"free_head":101308,"need_level":0}`|
|1020101|`{"free_head":100608,"need_level":0}`|
|1020201|`{"free_head":100808,"need_level":0}`|
|1020301|`{"free_head":100708,"need_level":0}`|
|1020401|`{"free_head":100908,"need_level":0}`|
|1020501|`{"free_head":101008,"need_level":0}`|
|1020601|`{"free_head":100308,"need_level":0}`|
|1030101|`{"free_head":101708,"need_level":3}`|
|1030201|`{"free_head":100208,"need_level":3}`|
|1030301|`{"free_head":100108,"need_level":3}`|
|1030401|`{"free_head":100508,"need_level":3}`|
|1030501|`{"free_head":100408,"need_level":3}`|
|1030601|`{"free_head":101108,"need_level":3}`|
|1030701|`{"free_head":111808,"need_level":3}`|
|1040101|`{"free_head":107908,"need_level":3}`|
|1040201|`{"free_head":116408,"need_level":3}`|
|1040301|`{"free_head":121908,"need_level":3}`|
|2010101|`{"free_head":102508,"need_level":0}`|
|2010201|`{"free_head":102608,"need_level":0}`|
|2020101|`{"free_head":102008,"need_level":0}`|
|2020201|`{"free_head":102408,"need_level":0}`|
|2020301|`{"free_head":102208,"need_level":0}`|
|2020401|`{"free_head":102308,"need_level":0}`|
|2020501|`{"free_head":102108,"need_level":0}`|
|2020601|`{"free_head":101508,"need_level":0}`|
|2030101|`{"free_head":101608,"need_level":3}`|
|2030201|`{"free_head":101408,"need_level":3}`|
|2030301|`{"free_head":101808,"need_level":3}`|
|2030401|`{"free_head":101908,"need_level":3}`|
|2030501|`{"free_head":102908,"need_level":3}`|
|2030601|`{"free_head":110708,"need_level":3}`|
|2030701|`{"free_head":115508,"need_level":3}`|
|2040101|`{"free_head":116308,"need_level":3}`|
|2040201|`{"free_head":122308,"need_level":3}`|
|3010101|`{"free_head":103508,"need_level":0}`|
|3010201|`{"free_head":103708,"need_level":0}`|
|3010301|`{"free_head":103908,"need_level":0}`|
|3020101|`{"free_head":102708,"need_level":0}`|
|3020201|`{"free_head":103308,"need_level":0}`|
|3020301|`{"free_head":103408,"need_level":0}`|
|3020401|`{"free_head":103208,"need_level":0}`|
|3020501|`{"free_head":103108,"need_level":0}`|
|3030201|`{"free_head":102808,"need_level":3}`|
|3030301|`{"free_head":103608,"need_level":3}`|
|3030401|`{"free_head":103008,"need_level":3}`|
|3030501|`{"free_head":103808,"need_level":3}`|
|3030601|`{"free_head":108808,"need_level":3}`|
|3030701|`{"free_head":110208,"need_level":3}`|
|3040101|`{"free_head":113608,"need_level":3}`|
|3040201|`{"free_head":119608,"need_level":3}`|
|4010101|`{"free_head":105008,"need_level":0}`|
|4010201|`{"free_head":105108,"need_level":0}`|
|4010301|`{"free_head":105208,"need_level":0}`|
|4020101|`{"free_head":104508,"need_level":0}`|
|4020201|`{"free_head":108908,"need_level":0}`|
|4020301|`{"free_head":104708,"need_level":0}`|
|4020401|`{"free_head":104808,"need_level":0}`|
|4020501|`{"free_head":104908,"need_level":0}`|
|4030101|`{"free_head":104108,"need_level":3}`|
|4030201|`{"free_head":104008,"need_level":3}`|
|4030301|`{"free_head":104208,"need_level":3}`|
|4030401|`{"free_head":104308,"need_level":3}`|
|4030501|`{"free_head":104408,"need_level":3}`|
|4030601|`{"free_head":107608,"need_level":3}`|
|4030801|`{"free_head":109008,"need_level":3}`|
|4040101|`{"free_head":108008,"need_level":0}`|
|4040201|`{"free_head":107708,"need_level":3}`|
|4040301|`{"free_head":119708,"need_level":3}`|
|4040401|`{"free_head":121608,"need_level":3}`|
|5040101|`{"free_head":122908,"need_level":3}`|
|5040201|`{"free_head":123008,"need_level":3}`|
|5040301|`{"free_head":123408,"need_level":3}`|
|5040401|`{"free_head":123908,"need_level":3}`|
|5040501|`{"free_head":124308,"need_level":3}`|
|5040601|`{"free_head":124708,"need_level":3}`|
|5040701|`{"free_head":125208,"need_level":3}`|

## Sex

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## AbilityLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|55|本表行键；与其他表同值不自动代表同一对象。|
|level|array|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3000|`{"level":[1,1,0,0,0,0,0,0,0]}`|
|3001|`{"level":[1,1,1,0,0,0,0,0,0]}`|
|3002|`{"level":[1,1,1,1,0,0,0,0,0]}`|
|3003|`{"level":[1,1,1,1,1,0,0,0,0]}`|
|3004|`{"level":[1,1,1,1,1,1,0,0,0]}`|
|3005|`{"level":[1,1,1,1,1,1,1,0,0]}`|
|3006|`{"level":[1,1,1,1,1,1,1,1,0]}`|
|3007|`{"level":[1,1,1,1,1,1,1,1,0]}`|
|3008|`{"level":[1,1,1,1,1,1,1,2,0]}`|
|3009|`{"level":[1,1,1,1,1,1,1,2,0]}`|
|3010|`{"level":[1,1,1,1,1,1,1,3,0]}`|
|4000|`{"level":[1,2,0,0,0,0,0,0,0]}`|
|4001|`{"level":[1,2,1,0,0,0,0,0,0]}`|
|4002|`{"level":[1,2,1,1,0,0,0,0,0]}`|
|4003|`{"level":[1,2,1,1,1,0,0,0,0]}`|
|4004|`{"level":[1,2,1,1,1,1,0,0,0]}`|
|4005|`{"level":[1,2,1,1,1,1,1,0,0]}`|
|4006|`{"level":[1,2,1,1,1,1,1,1,0]}`|
|4007|`{"level":[1,2,1,1,1,1,1,1,0]}`|
|4008|`{"level":[1,2,1,1,1,1,1,2,0]}`|
|4009|`{"level":[1,2,1,1,1,1,1,2,0]}`|
|4010|`{"level":[1,2,1,1,1,1,1,3,0]}`|
|5000|`{"level":[1,3,0,0,0,0,0,0,0]}`|
|5001|`{"level":[1,3,1,0,0,0,0,0,0]}`|
|5002|`{"level":[1,3,1,1,0,0,0,0,0]}`|
|5003|`{"level":[1,3,1,1,1,0,0,0,0]}`|
|5004|`{"level":[1,3,1,1,1,1,0,0,0]}`|
|5005|`{"level":[1,3,1,1,1,1,1,0,0]}`|
|5006|`{"level":[1,3,1,1,1,1,1,1,0]}`|
|5007|`{"level":[1,3,1,1,1,1,1,1,0]}`|
|5008|`{"level":[1,3,1,1,1,1,1,2,0]}`|
|5009|`{"level":[1,3,1,1,1,1,1,2,0]}`|
|5010|`{"level":[1,3,1,1,1,1,1,3,0]}`|
|6000|`{"level":[1,3,0,0,0,0,0,0,0]}`|
|6001|`{"level":[1,3,1,0,0,0,0,0,0]}`|
|6002|`{"level":[1,3,1,1,0,0,0,0,0]}`|
|6003|`{"level":[1,3,1,1,1,0,0,0,0]}`|
|6004|`{"level":[1,3,1,1,1,1,0,0,0]}`|
|6005|`{"level":[1,3,1,1,1,1,1,0,0]}`|
|6006|`{"level":[1,3,1,1,1,1,1,1,0]}`|
|6007|`{"level":[1,3,1,1,1,1,1,1,0]}`|
|6008|`{"level":[1,3,1,1,1,1,1,2,0]}`|
|6009|`{"level":[1,3,1,1,1,1,1,2,0]}`|
|6010|`{"level":[1,3,1,1,1,1,1,3,0]}`|
|7000|`{"level":[1,3,0,0,0,0,0,0,1]}`|
|7001|`{"level":[1,3,1,0,0,0,0,0,1]}`|
|7002|`{"level":[1,3,1,1,0,0,0,0,1]}`|
|7003|`{"level":[1,3,1,1,1,0,0,0,1]}`|
|7004|`{"level":[1,3,1,1,1,1,0,0,1]}`|
|7005|`{"level":[1,3,1,1,1,1,1,0,1]}`|
|7006|`{"level":[1,3,1,1,1,1,1,1,1]}`|
|7007|`{"level":[1,3,1,1,1,1,1,1,1]}`|
|7008|`{"level":[1,3,1,1,1,1,1,2,1]}`|
|7009|`{"level":[1,3,1,1,1,1,1,2,1]}`|
|7010|`{"level":[1,3,1,1,1,1,1,3,1]}`|

## Ability

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|ability|array|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|soul_ability|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|77|本表行键；与其他表同值不自动代表同一对象。|
|mastery_ability|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hide_ability|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"ability":[1101010101,2101010111,3101010111,3101010121,3101010131,3101010141,3101010151,4101010161],"soul_ability":0,"mastery_ability":311010171}`|
|1010201|`{"ability":[1101020101,2101020111,3101020111,3101020121,3101020131,3101020141,3101020151,4101020161],"soul_ability":0,"mastery_ability":311020171}`|
|1020101|`{"ability":[1102010101,2102010112,3102010111,3102010121,3102010131,3102010141,3102010151,4102010161],"soul_ability":0,"mastery_ability":312010171}`|
|1020201|`{"ability":[1102020101,2102020112,3102020111,3102020121,3102020131,3102020141,3102020151,4102020161],"soul_ability":0,"mastery_ability":312020171}`|
|1020301|`{"ability":[1102030101,2102030112,3102030111,3102030121,3102030131,3102030141,3102030151,4102030161],"soul_ability":0,"mastery_ability":312030171}`|
|1020401|`{"ability":[1102040101,2102040112,3102040111,3102040121,3102040131,3102040141,3102040151,4102040161],"soul_ability":0,"mastery_ability":312040171}`|
|1020501|`{"ability":[1102050101,2102050112,3102050111,3102050121,3102050131,3102050141,3102050151,4102050161],"soul_ability":0,"mastery_ability":312050171}`|
|1020601|`{"ability":[1102060101,2102060112,3102060111,3102060121,3102060131,3102060141,3102060151,4102060161],"soul_ability":0,"mastery_ability":312060171}`|
|1030101|`{"ability":[1103010101,2103010113,3103010111,3103010121,3103010131,3103010141,3103010151,4103010161],"soul_ability":0,"mastery_ability":313010171}`|
|1030201|`{"ability":[1103020101,2103020113,3103020111,3103020121,3103020131,3103020141,3103020151,4103020161],"soul_ability":0,"mastery_ability":313020171}`|
|1030301|`{"ability":[1103030101,2103030113,3103030111,3103030121,3103030131,3103030141,3103030151,4103030161],"soul_ability":0,"mastery_ability":313030171}`|
|1030401|`{"ability":[1103040101,2103040113,3103040111,3103040121,3103040131,3103040141,3103040151,4103040161],"soul_ability":0,"mastery_ability":313040171}`|
|1030501|`{"ability":[1103050101,2103050113,3103050111,3103050121,3103050131,3103050141,3103050151,4103050161],"soul_ability":0,"mastery_ability":313050171}`|
|1030601|`{"ability":[1103060101,2103060113,3103060111,3103060121,3103060131,3103060141,3103060151,4103060161],"soul_ability":0,"mastery_ability":313060171}`|
|1030701|`{"ability":[1103070101,2103070113,3103070111,3103070121,3103070131,3103070141,3103070151,4103070161],"soul_ability":0,"mastery_ability":313070171}`|
|1040101|`{"ability":[1104010101,2104010113,3104010111,3104010121,3104010131,3104010141,3104010151,4104010161],"soul_ability":2104010123,"mastery_ability":314010171}`|
|1040201|`{"ability":[1104020101,2104020113,3104020111,3104020121,3104020131,3104020141,3104020151,4104020161],"soul_ability":2104020123,"mastery_ability":314020171}`|
|1040301|`{"ability":[1104030101,2104030113,3104030111,3104030121,3104030131,3104030141,3104030151,4104030161],"soul_ability":2104030123,"mastery_ability":314030171}`|
|2010101|`{"ability":[1201010101,2201010111,3201010111,3201010121,3201010131,3201010141,3201010151,4201010161],"soul_ability":0,"mastery_ability":321010171}`|
|2010201|`{"ability":[1201020101,2201020111,3201020111,3201020121,3201020131,3201020141,3201020151,4201020161],"soul_ability":0,"mastery_ability":321020171}`|
|2020101|`{"ability":[1202010101,2202010112,3202010111,3202010121,3202010131,3202010141,3202010151,4202010161],"soul_ability":0,"mastery_ability":322010171}`|
|2020201|`{"ability":[1202020101,2202020112,3202020111,3202020121,3202020131,3202020141,3202020151,4202020161],"soul_ability":0,"mastery_ability":322020171}`|
|2020301|`{"ability":[1202030101,2202030112,3202030111,3202030121,3202030131,3202030141,3202030151,4202030161],"soul_ability":0,"mastery_ability":322030171}`|
|2020401|`{"ability":[1202040101,2202040112,3202040111,3202040121,3202040131,3202040141,3202040151,4202040161],"soul_ability":0,"mastery_ability":322040171}`|
|2020501|`{"ability":[1202050101,2202050112,3202050111,3202050121,3202050131,3202050141,3202050151,4202050161],"soul_ability":0,"mastery_ability":322050171}`|
|2020601|`{"ability":[1202060101,2202060113,3202060111,3202060121,3202060131,3202060141,3202060151,4202060161],"soul_ability":0,"mastery_ability":322060171}`|
|2030101|`{"ability":[1203010101,2203010113,3203010111,3203010121,3203010131,3203010141,3203010151,4203010161],"soul_ability":0,"mastery_ability":323010171}`|
|2030201|`{"ability":[1203020101,2203020113,3203020111,3203020121,3203020131,3203020141,3203020151,4203020161],"soul_ability":0,"mastery_ability":323020171}`|
|2030301|`{"ability":[1203030101,2203030113,3203030111,3203030121,3203030131,3203030141,3203030151,4203030161],"soul_ability":0,"mastery_ability":323030171}`|
|2030401|`{"ability":[1203040101,2203040113,3203040111,3203040121,3203040131,3203040141,3203040151,4203040161],"soul_ability":0,"mastery_ability":323040171}`|
|2030501|`{"ability":[1203050101,2203050113,3203050111,3203050121,3203050131,3203050141,3203050151,4203050161],"soul_ability":0,"mastery_ability":323050171}`|
|2030601|`{"ability":[1203060101,2203060113,3203060111,3203060121,3203060131,3203060141,3203060151,4203060161],"soul_ability":0,"mastery_ability":323060171}`|
|2030701|`{"ability":[1203070101,2203070113,3203070111,3203070121,3203070131,3203070141,3203070151,4203070161],"soul_ability":0,"mastery_ability":323070171}`|
|2040101|`{"ability":[1204010101,2204010113,3204010111,3204010121,3204010131,3204010141,3204010151,4204010161],"soul_ability":2204010123,"mastery_ability":324010171}`|
|2040201|`{"ability":[1204020101,2204020113,3204020111,3204020121,3204020131,3204020141,3204020151,4204020161],"soul_ability":2204020123,"mastery_ability":324020171}`|
|3010101|`{"ability":[1301010101,2301010111,3301010111,3301010121,3301010131,3301010141,3301010151,4301010161],"soul_ability":0,"mastery_ability":331010171}`|
|3010201|`{"ability":[1301020101,2301020111,3301020111,3301020121,3301020131,3301020141,3301020151,4301020161],"soul_ability":0,"mastery_ability":331020171}`|
|3010301|`{"ability":[1301030101,2301030111,3301030111,3301030121,3301030131,3301030141,3301030151,4301030161],"soul_ability":0,"mastery_ability":331030171}`|
|3020101|`{"ability":[1302010101,2302010112,3302010111,3302010121,3302010131,3302010141,3302010151,4302010161],"soul_ability":0,"mastery_ability":332010171}`|
|3020201|`{"ability":[1302020101,2302020112,3302020111,3302020121,3302020131,3302020141,3302020151,4302020161],"soul_ability":0,"mastery_ability":332020171}`|
|3020301|`{"ability":[1302030101,2302030112,3302030111,3302030121,3302030131,3302030141,3302030151,4302030161],"soul_ability":0,"mastery_ability":332030171}`|
|3020401|`{"ability":[1302040101,2302040112,3302040111,3302040121,3302040131,3302040141,3302040151,4302040161],"soul_ability":0,"mastery_ability":332040171}`|
|3020501|`{"ability":[1302050101,2302050112,3302050111,3302050121,3302050131,3302050141,3302050151,4302050161],"soul_ability":0,"mastery_ability":332050171}`|
|3030201|`{"ability":[1303020101,2303020113,3303020111,3303020121,3303020131,3303020141,3303020151,4303020161],"soul_ability":0,"mastery_ability":333020171}`|
|3030301|`{"ability":[1303030101,2303030113,3303030111,3303030121,3303030131,3303030141,3303030151,4303030161],"soul_ability":0,"mastery_ability":333030171}`|
|3030401|`{"ability":[1303040101,2303040113,3303040111,3303040121,3303040131,3303040141,3303040151,4303040161],"soul_ability":0,"mastery_ability":333040171}`|
|3030501|`{"ability":[1303050101,2303050113,3303050111,3303050121,3303050131,3303050141,3303050151,4303050161],"soul_ability":0,"mastery_ability":333050171}`|
|3030601|`{"ability":[1303060101,2303060113,3303060111,3303060121,3303060131,3303060141,3303060151,4303060161],"soul_ability":0,"mastery_ability":333060171}`|
|3030701|`{"ability":[1303070101,2303070113,3303070111,3303070121,3303070131,3303070141,3303070151,4303070161],"soul_ability":0,"mastery_ability":333070171}`|
|3040101|`{"ability":[1304010101,2304010113,3304010111,3304010121,3304010131,3304010141,3304010151,4304010161],"soul_ability":2304010123,"mastery_ability":334010171}`|
|3040201|`{"ability":[1304020101,2304020113,3304020111,3304020121,3304020131,3304020141,3304020151,4304020161],"soul_ability":2304020123,"mastery_ability":334020171}`|
|4010101|`{"ability":[1401010101,2401010111,3401010111,3401010121,3401010131,3401010141,3401010151,4401010161],"soul_ability":0,"mastery_ability":341010171}`|
|4010201|`{"ability":[1401020101,2401020111,3401020111,3401020121,3401020131,3401020141,3401020151,4401020161],"soul_ability":0,"mastery_ability":341020171}`|
|4010301|`{"ability":[1401030101,2401030111,3401030111,3401030121,3401030131,3401030141,3401030151,4401030161],"soul_ability":0,"mastery_ability":341030171}`|
|4020101|`{"ability":[1402010101,2402010112,3402010111,3402010121,3402010131,3402010141,3402010151,4402010161],"soul_ability":0,"mastery_ability":342010171}`|
|4020201|`{"ability":[1402020101,2402020112,3402020111,3402020121,3402020131,3402020141,3402020151,4402020161],"soul_ability":0,"mastery_ability":342020171}`|
|4020301|`{"ability":[1402030101,2402030112,3402030111,3402030121,3402030131,3402030141,3402030151,4402030161],"soul_ability":0,"mastery_ability":342030171}`|
|4020401|`{"ability":[1402040101,2402040112,3402040111,3402040121,3402040131,3402040141,3402040151,4402040161],"soul_ability":0,"mastery_ability":342040171}`|
|4020501|`{"ability":[1402050101,2402050112,3402050111,3402050121,3402050131,3402050141,3402050151,4402050161],"soul_ability":0,"mastery_ability":342050171}`|
|4030101|`{"ability":[1403010101,2403010113,3403010111,3403010121,3403010131,3403010141,3403010151,4403010161],"soul_ability":0,"mastery_ability":343010171}`|
|4030201|`{"ability":[1403020101,2403020113,3403020111,3403020121,3403020131,3403020141,3403020151,4403020161],"soul_ability":0,"mastery_ability":343020171}`|
|4030301|`{"ability":[1403030101,2403030113,3403030111,3403030121,3403030131,3403030141,3403030151,4403030161],"soul_ability":0,"mastery_ability":343030171}`|
|4030401|`{"ability":[1403040101,2403040113,3403040111,3403040121,3403040131,3403040141,3403040151,4403040161],"soul_ability":0,"mastery_ability":343040171}`|
|4030501|`{"ability":[1403050101,2403050113,3403050111,3403050121,3403050131,3403050141,3403050151,4403050161],"soul_ability":0,"mastery_ability":343050171}`|
|4030601|`{"ability":[1403060101,2403060113,3403060111,3403060121,3403060131,3403060141,3403060151,4403060161],"soul_ability":0,"mastery_ability":343060171}`|
|4030801|`{"ability":[1403080101,2403080113,3403080111,3403080121,3403080131,3403080141,3403080151,4403080161],"soul_ability":0,"mastery_ability":343080171}`|
|4040101|`{"ability":[1404010101,2404010113,3404010111,3404010121,3404010131,3404010141,3404010151,4404010161],"soul_ability":2404010123,"mastery_ability":0}`|
|4040201|`{"ability":[1404020101,2404020113,3404020111,3404020121,3404020131,3404020141,3404020151,4404020161],"soul_ability":2404020123,"mastery_ability":344020171}`|
|4040301|`{"ability":[1404030101,2404030113,3404030111,3404030121,3404030131,3404030141,3404030151,4404030161],"soul_ability":2404030123,"mastery_ability":344030171}`|
|4040401|`{"ability":[1404040101,2404040113,3404040111,3404040121,3404040131,3404040141,3404040151,4404040161],"soul_ability":2404040123,"mastery_ability":344040171}`|
|5040101|`{"ability":[1504010101,2504010113,3504010111,3504010121,3504010131,3504010141,3504010151,4504010161,3504010161],"soul_ability":2504010123,"mastery_ability":354010171}`|
|5040201|`{"ability":[1504020101,2504020113,3504020111,3504020121,3504020131,3504020141,3504020151,4504020161],"soul_ability":2504020123,"mastery_ability":354020171}`|
|5040301|`{"ability":[1504030101,2504030113,3504030111,3504030121,3504030131,3504030141,3504030151,4504030161,3504030161],"soul_ability":2504030123,"mastery_ability":354030171}`|
|5040401|`{"ability":[1504040101,2504040113,3504040111,3504040121,3504040131,3504040141,3504040151,4504040161,3504040161],"soul_ability":2504040123,"mastery_ability":354040171}`|
|5040501|`{"ability":[1504050101,2504050113,3504050111,3504050121,3504050131,3504050141,3504050151,4504050161,3504050161],"soul_ability":2504050123,"mastery_ability":354050171}`|
|5040601|`{"ability":[1504060101,2504060113,3504060111,3504060121,3504060131,3504060141,3504060151,4504060161,3504060161],"soul_ability":2504060123,"mastery_ability":354060171}`|
|5040701|`{"ability":[1504070101,2504070113,3504070111,3504070121,3504070131,3504070141,3504070151,4504070161,3504070161],"soul_ability":2504070123,"mastery_ability":354070171}`|

## From

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

## Cell

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|assert_param|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|assert|undefined/number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guide_node|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lock_tips|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"assert_param":[],"lock_tips":0}`|
|2|`{"assert_param":[],"lock_tips":0}`|
|3|`{"assert_param":[],"lock_tips":0}`|
|4|`{"assert_param":[2,1],"assert":377309400004,"lock_tips":668414}`|
|5|`{"assert_param":[10],"assert":955132601046,"lock_tips":61855}`|
|6|`{"assert_param":[10],"assert":955132601046,"lock_tips":61855}`|

## Sort

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|sort_ext|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1020301|`{}`|
|3020201|`{}`|

## Profession

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|ability|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_attr_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|battle_card_icon_SP|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_card_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cultivate_name_prop|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cultivate_card_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_zyicon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name_pinyin|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|battle_card_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"ability":[],"hero_attr_icon":"","hero_card_icon":"","hero_zyicon":""}`|
|1|`{"ability":[120001031],"hero_attr_icon":"img_yxjm_gongjixiao.png","hero_card_icon":"img_zyicon_gongji.png","hero_zyicon":"img_zyicon_gongji.png"}`|
|2|`{"ability":[120001026],"hero_attr_icon":"img_yxjm_chongfengxiao.png","hero_card_icon":"img_zyicon_chongfeng.png","hero_zyicon":"img_zyicon_chongfeng.png"}`|
|3|`{"ability":[120001028],"hero_attr_icon":"img_yxjm_fuzhuxiao.png","hero_card_icon":"img_zyicon_fuzhu.png","hero_zyicon":"img_zyicon_fuzhu.png"}`|
|4|`{"ability":[120001027],"hero_attr_icon":"img_yxjm_fangyuxiao.png","hero_card_icon":"img_zyicon_fangyu.png","hero_zyicon":"img_zyicon_fangyu.png"}`|

## Camp

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|camp_collection_hero_anim|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_card_bg|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cultivate_bg|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|camp_collection_bg|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_icon_draw|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_order|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|head_icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_zyicon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_card_bg|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_head_bg|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_collection_title|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"camp_collection_hero_anim":"Ani_HeroHandbookInfoNode_jy","draw_card_bg":"img_ckjg_ankuang_diban.png","camp_icon_draw":"icon_ty_zhengying_an.png"}`|
|2|`{"camp_collection_hero_anim":"Ani_HeroHandbookInfoNode_ys","draw_card_bg":"img_ckjg_fengkuang_diban.png","camp_icon_draw":"icon_ty_zhengying_huo.png"}`|
|3|`{"camp_collection_hero_anim":"Ani_HeroHandbookInfoNode_gy","draw_card_bg":"img_ckjg_huokuang_diban.png","camp_icon_draw":"icon_ty_zhengying_shui.png"}`|
|4|`{"camp_collection_hero_anim":"Ani_HeroHandbookInfoNode_st","draw_card_bg":"img_ckjg_guangkuang_diban.png","camp_icon_draw":"icon_ty_zhengying_guang.png"}`|
|5|`{"camp_collection_hero_anim":"","draw_card_bg":"img_ckjg_shuikuang_diban.png","camp_icon_draw":"img_kp_shui.png"}`|
|6|`{"camp_collection_hero_anim":"","draw_card_bg":"","camp_icon_draw":"img_kp_an.png"}`|
|8|`{"camp_collection_hero_anim":"","draw_card_bg":"","camp_icon_draw":"img_kp_an.png"}`|
|9|`{"camp_collection_hero_anim":"Ani_HeroHandbookInfoNode_jy","draw_card_bg":"img_ckjg_ankuang_diban.png","camp_icon_draw":"icon_zy_hd.png"}`|
|100|`{"camp_collection_hero_anim":"","draw_card_bg":"","camp_icon_draw":""}`|
|101|`{"camp_collection_hero_anim":"","draw_card_bg":"","camp_icon_draw":""}`|
|102|`{"camp_collection_hero_anim":"","draw_card_bg":"","camp_icon_draw":""}`|
|103|`{"camp_collection_hero_anim":"","draw_card_bg":"","camp_icon_draw":""}`|

## AllFavourLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|400|本表行键；与其他表同值不自动代表同一对象。|
|need_favor|number|400|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_attr|array|400|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|400|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部400行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_favor":0,"extra_attr":[[205,0],[206,0],[210,0]],"attr":[[201,0],[202,0],[209,0]]}`|
|2|`{"need_favor":50,"extra_attr":[[205,0],[206,0],[210,0]],"attr":[[201,180],[202,30],[209,18]]}`|
|3|`{"need_favor":100,"extra_attr":[[205,0],[206,0],[210,0]],"attr":[[201,360],[202,60],[209,36]]}`|

## PlaygroundUnlock

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|52|本表行键；与其他表同值不自动代表同一对象。|
|unlock_favour_level|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"unlock_favour_level":3}`|
|1010201|`{"unlock_favour_level":3}`|
|1020101|`{"unlock_favour_level":3}`|
|1020201|`{"unlock_favour_level":3}`|
|1020301|`{"unlock_favour_level":3}`|
|1020401|`{"unlock_favour_level":3}`|
|1020501|`{"unlock_favour_level":3}`|
|1020601|`{"unlock_favour_level":3}`|
|1030101|`{"unlock_favour_level":3}`|
|1030201|`{"unlock_favour_level":3}`|
|1030301|`{"unlock_favour_level":3}`|
|1030401|`{"unlock_favour_level":3}`|
|1030501|`{"unlock_favour_level":3}`|
|2010101|`{"unlock_favour_level":3}`|
|2010201|`{"unlock_favour_level":3}`|
|2020101|`{"unlock_favour_level":3}`|
|2020201|`{"unlock_favour_level":3}`|
|2020301|`{"unlock_favour_level":3}`|
|2020401|`{"unlock_favour_level":3}`|
|2020501|`{"unlock_favour_level":3}`|
|2020601|`{"unlock_favour_level":3}`|
|2030101|`{"unlock_favour_level":3}`|
|2030201|`{"unlock_favour_level":3}`|
|2030301|`{"unlock_favour_level":3}`|
|2030401|`{"unlock_favour_level":3}`|
|2030501|`{"unlock_favour_level":3}`|
|3010101|`{"unlock_favour_level":3}`|
|3010201|`{"unlock_favour_level":3}`|
|3010301|`{"unlock_favour_level":3}`|
|3020101|`{"unlock_favour_level":3}`|
|3020201|`{"unlock_favour_level":3}`|
|3020301|`{"unlock_favour_level":3}`|
|3020401|`{"unlock_favour_level":3}`|
|3020501|`{"unlock_favour_level":3}`|
|3030201|`{"unlock_favour_level":3}`|
|3030301|`{"unlock_favour_level":3}`|
|3030401|`{"unlock_favour_level":3}`|
|3030501|`{"unlock_favour_level":3}`|
|4010101|`{"unlock_favour_level":3}`|
|4010201|`{"unlock_favour_level":3}`|
|4010301|`{"unlock_favour_level":3}`|
|4020101|`{"unlock_favour_level":3}`|
|4020201|`{"unlock_favour_level":3}`|
|4020301|`{"unlock_favour_level":3}`|
|4020401|`{"unlock_favour_level":3}`|
|4020501|`{"unlock_favour_level":3}`|
|4030101|`{"unlock_favour_level":3}`|
|4030201|`{"unlock_favour_level":3}`|
|4030301|`{"unlock_favour_level":3}`|
|4030401|`{"unlock_favour_level":3}`|
|4030501|`{"unlock_favour_level":3}`|
|4030801|`{"unlock_favour_level":3}`|

## PlaygroundAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|add_fafour|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[]}`|
|2|`{"award":[]}`|
|3|`{"award":[]}`|

## FavourConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|bubble_stay_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_play_item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_play_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hero_day_play_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"day_play_item":[[597002,1]],"day_play_times":4,"hero_day_play_times":1}`|

## FavourBubble

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|53|本表行键；与其他表同值不自动代表同一对象。|
|date|array|53|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|date_story|array|53|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|array|53|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4030801|`{}`|

## FavourGift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|value|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|favour|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|31002|`{"value":5}`|
|32002|`{"value":25}`|
|33002|`{"value":50}`|

## FavourBreak

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|need_all_favor_level|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_favor_level|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"need_all_favor_level":1,"max_favor_level":5}`|
|1|`{"need_all_favor_level":5,"max_favor_level":10}`|
|2|`{"need_all_favor_level":10,"max_favor_level":0}`|

## FavourLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|need_favor|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level_up_award|array|13|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|stage|number|13|ActFrame阶段引用数组；不同于旧Activity.state。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_favor":0,"level_up_award":[],"stage":0}`|
|2|`{"need_favor":100,"level_up_award":[[101500,10]],"stage":1}`|
|3|`{"need_favor":300,"level_up_award":[[101500,10]],"stage":1}`|
|4|`{"need_favor":750,"level_up_award":[[101500,10]],"stage":1}`|
|5|`{"need_favor":1350,"level_up_award":[[101500,10]],"stage":1}`|
|6|`{"need_favor":2000,"level_up_award":[[101500,10]],"stage":2}`|
|7|`{"need_favor":4000,"level_up_award":[[101500,10]],"stage":2}`|
|8|`{"need_favor":6000,"level_up_award":[[101500,10]],"stage":2}`|
|9|`{"need_favor":8000,"level_up_award":[[101500,10]],"stage":2}`|
|10|`{"need_favor":11000,"level_up_award":[[101500,10]],"stage":3}`|
|11|`{"need_favor":14000,"level_up_award":[[101500,10]],"stage":3}`|
|12|`{"need_favor":18000,"level_up_award":[[101500,10]],"stage":3}`|
|13|`{"need_favor":25000,"level_up_award":[[101500,10]],"stage":3}`|

## FavourRedShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|red_value|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"red_value":300}`|
|5|`{"red_value":250}`|

## ResolveHandler

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|client_handler|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Return

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|handler|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|

## CustomCamp

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Prop

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## RoleSound

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|die_sound|number|158|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|music|number|158|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk_text|array|158|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sound|array|158|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|158|本表行键；与其他表同值不自动代表同一对象。|
|recruit|number|158|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_sound|number|158|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|701005|`{}`|
|701007|`{}`|
|701008|`{}`|
|701009|`{}`|
|701011|`{}`|
|701012|`{}`|
|701013|`{}`|
|701014|`{}`|
|701015|`{}`|
|701016|`{}`|
|701017|`{}`|
|701018|`{}`|
|701019|`{}`|
|701020|`{}`|
|701022|`{}`|
|701023|`{}`|
|701024|`{}`|
|701025|`{}`|
|701026|`{}`|
|701027|`{}`|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|1030601|`{}`|
|1030701|`{}`|
|1040101|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|2030601|`{}`|
|2030701|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|3030701|`{}`|
|3040101|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4030601|`{}`|
|4030801|`{}`|
|4040201|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040101|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040401|`{}`|
|5040501|`{}`|
|5040601|`{}`|
|5040701|`{}`|
|102060101|`{}`|
|103050102|`{}`|
|103050103|`{}`|
|103050104|`{}`|
|103060101|`{}`|
|104010101|`{}`|
|104010102|`{}`|
|104020101|`{}`|
|116040101|`{}`|
|202050101|`{}`|
|203030102|`{}`|
|203030103|`{}`|
|203030104|`{}`|
|203060101|`{}`|
|204010101|`{}`|
|216020102|`{}`|
|216050101|`{}`|
|217020101|`{}`|
|217020102|`{}`|
|217020103|`{}`|
|217020104|`{}`|
|303020101|`{}`|
|303050101|`{}`|
|303050102|`{}`|
|303050103|`{}`|
|303050104|`{}`|
|303050105|`{}`|
|303050106|`{}`|
|303050107|`{}`|
|303050108|`{}`|
|303050109|`{}`|
|303060101|`{}`|
|303060104|`{}`|
|303060105|`{}`|
|303060106|`{}`|
|303070101|`{}`|
|304030101|`{}`|
|316020101|`{}`|
|316020102|`{}`|
|316040101|`{}`|
|316040201|`{}`|
|403060101|`{}`|
|403060103|`{}`|
|403080101|`{}`|
|403080102|`{}`|
|404020101|`{}`|
|404020102|`{}`|
|417010102|`{}`|
|417020102|`{}`|
|417020103|`{}`|
|417020104|`{}`|
|417020105|`{}`|
|504020101|`{}`|
|517010102|`{}`|
|517020102|`{}`|
|517030101|`{}`|
|517050102|`{}`|
|517050103|`{}`|
|517050104|`{}`|
|517050105|`{}`|
|517050106|`{}`|
|518020101|`{}`|

## RouseConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|activated_star|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_star|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"activated_star":400,"hero_star":15,"hero_level":385}`|

## RouseStar

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|401|`{"attr":[[5,1000],[6,1000]]}`|
|402|`{"attr":[[5,2000],[6,2000]]}`|
|403|`{"attr":[[5,3000],[6,3000]]}`|
|404|`{"attr":[[5,4000],[6,4000]]}`|
|405|`{"attr":[[5,5000],[6,5000]]}`|

## RouseActive

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## TeamSuggestGroupType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## TeamSuggestShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|target_star|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_desc|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100|`{"target_star":[3,1,1],"skill":[3303050131,3203020131,3203050111,3202060111,3102060111,3202040111],"skill_desc":[6502057,6502058,6502059,6502060,6502061,6502062]}`|
|101|`{"target_star":[5,5,3],"skill":[3303050151,3203020151,3203030151,3203050151,3202060131,3202040131],"skill_desc":[6502063,6502064,6502065,6502066,6502067,6502068]}`|
|102|`{"target_star":[8,5,5],"skill":[4203020162,4203030162,3303050151,3203040151,3203050151,3203010151],"skill_desc":[6502069,6502070,6502071,6502072,6502073,6502074]}`|
|200|`{"target_star":[3,1,1],"skill":[3303050131,3103010131,3203050111,3202060111,3102060111,3202040111],"skill_desc":[6502075,6502076,6502077,6502078,6502079,6502080]}`|
|201|`{"target_star":[5,3,3],"skill":[3303050151,3103010151,3103050131,3203050131,3202060131,3102040131],"skill_desc":[6502081,6502082,6502083,6502084,6502085,6502086]}`|
|202|`{"target_star":[8,5,5],"skill":[4103010162,4103050162,3303050151,3103040151,3203010151,3303040151],"skill_desc":[6502087,6502088,6502089,6502090,6502091,6502092]}`|
|300|`{"target_star":[3,1,1],"skill":[3303050131,3403050131,3203050111,3202060111,3102060111,3202040111],"skill_desc":[6502093,6502094,6502095,6502096,6502097,6502098]}`|
|301|`{"target_star":[5,3,3],"skill":[3303050151,3403050151,3403040131,3203050131,3202060131,3402010131],"skill_desc":[6502099,6502100,6502101,6502102,6502103,6502104]}`|
|302|`{"target_star":[8,5,5],"skill":[4403050162,4403040162,3303050151,3203010151,3403020151,3403010151],"skill_desc":[6502105,6502106,6502107,6502108,6502109,6502110]}`|
|400|`{"target_star":[3,1,1],"skill":[3303050131,3303060131,3203050111,3202060111,3102060111,3202040111],"skill_desc":[6502111,6502112,6502113,6502114,6502115,6502116]}`|
|401|`{"target_star":[5,3,3],"skill":[3303050151,3303060151,3303020131,3203050131,3202060131,3302010131],"skill_desc":[6502117,6502118,6502119,6502120,6502121,6502122]}`|
|402|`{"target_star":[8,5,5],"skill":[4303060162,4303020162,3303050151,3303030151,3303040151,3203010151],"skill_desc":[6502123,6502124,6502125,6502126,6502127,6502128]}`|

## TeamSuggestConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|build_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"build_count":3}`|

## TeamSuggestAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|collect_percent|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|30|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|team_type|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[31002,2]],"team_type":1}`|
|102|`{"award":[[31002,3]],"team_type":1}`|
|103|`{"award":[[31002,5]],"team_type":1}`|
|104|`{"award":[[32002,2]],"team_type":1}`|
|105|`{"award":[[32002,3]],"team_type":1}`|
|106|`{"award":[[32002,5]],"team_type":1}`|
|107|`{"award":[[33002,2]],"team_type":1}`|
|108|`{"award":[[33002,3]],"team_type":1}`|
|109|`{"award":[[33002,5]],"team_type":1}`|
|110|`{"award":[[101500,100],[33002,5]],"team_type":1}`|
|201|`{"award":[[31002,5]],"team_type":2}`|
|202|`{"award":[[31002,8]],"team_type":2}`|
|203|`{"award":[[31002,10]],"team_type":2}`|
|204|`{"award":[[32002,5]],"team_type":2}`|
|205|`{"award":[[32002,8]],"team_type":2}`|
|206|`{"award":[[32002,10]],"team_type":2}`|
|207|`{"award":[[33002,5]],"team_type":2}`|
|208|`{"award":[[33002,8]],"team_type":2}`|
|209|`{"award":[[33002,10]],"team_type":2}`|
|210|`{"award":[[101500,100],[33002,10]],"team_type":2}`|
|301|`{"award":[[31002,10]],"team_type":3}`|
|302|`{"award":[[31002,12]],"team_type":3}`|
|303|`{"award":[[31002,15]],"team_type":3}`|
|304|`{"award":[[32002,10]],"team_type":3}`|
|305|`{"award":[[32002,12]],"team_type":3}`|
|306|`{"award":[[32002,15]],"team_type":3}`|
|307|`{"award":[[33002,10]],"team_type":3}`|
|308|`{"award":[[33002,12]],"team_type":3}`|
|309|`{"award":[[33002,15]],"team_type":3}`|
|310|`{"award":[[101500,100],[33002,15]],"team_type":3}`|

## TeamSuggestType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|popularity|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|subheading|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene_idx|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group_type":1}`|
|2|`{"group_type":2}`|
|3|`{"group_type":3}`|
|4|`{"group_type":4}`|

## TeamSuggest

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|hero_position|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|subheading|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suggest_hero|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|team_type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100|`{"hero_position":[10182,10157],"type":2,"suggest_hero":[[3030501,3],[2030201,3],[2030501,3],[2020601,3],[1020601,3],[2020401,3]],"team_type":1}`|
|101|`{"hero_position":[10131,10157],"type":2,"suggest_hero":[[3030501,5],[2030201,5],[2030301,5],[2030501,5],[2020601,5],[2020401,5]],"team_type":2}`|
|102|`{"hero_position":[10131,10157],"type":2,"suggest_hero":[[2030201,8],[2030301,8],[3030501,8],[2030401,8],[2030501,8],[2030101,8]],"team_type":3}`|
|200|`{"hero_position":[10182,10189],"type":1,"suggest_hero":[[3030501,3],[1030101,3],[2030501,3],[2020601,3],[1020601,3],[1020401,3]],"team_type":1}`|
|201|`{"hero_position":[10189,10116],"type":1,"suggest_hero":[[3030501,5],[1030101,5],[1030501,5],[2030501,5],[2020601,5],[1020401,5]],"team_type":2}`|
|202|`{"hero_position":[10189,10190],"type":1,"suggest_hero":[[1030101,8],[1030501,8],[3030501,8],[1030401,8],[2030101,8],[3030401,8]],"team_type":3}`|
|300|`{"hero_position":[10182,10195],"type":4,"suggest_hero":[[3030501,3],[4030501,3],[2030501,3],[2020601,3],[1020601,3],[4020101,3]],"team_type":1}`|
|301|`{"hero_position":[10191,10060],"type":4,"suggest_hero":[[3030501,5],[4030501,5],[4030401,5],[2030501,5],[2020601,5],[4020101,5]],"team_type":2}`|
|302|`{"hero_position":[10191,10060],"type":4,"suggest_hero":[[4030501,8],[4030401,8],[3030501,8],[2030101,8],[4030201,8],[4030101,8]],"team_type":3}`|
|400|`{"hero_position":[10182,10194],"type":3,"suggest_hero":[[3030501,3],[3030601,3],[2030501,3],[2020601,3],[1020601,3],[3020101,3]],"team_type":1}`|
|401|`{"hero_position":[10194,10193],"type":3,"suggest_hero":[[3030501,5],[3030601,5],[3030201,5],[2030501,5],[2020601,5],[3020101,5]],"team_type":2}`|
|402|`{"hero_position":[10194,10192],"type":3,"suggest_hero":[[3030601,8],[3030201,8],[3030501,8],[3030301,8],[3030401,8],[2030101,8]],"team_type":3}`|

## TeamSuggestTeamType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|unlock_percent|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_collect_all_percent|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_percent":0,"unlock_collect_all_percent":0}`|
|2|`{"unlock_percent":60,"unlock_collect_all_percent":0}`|
|3|`{"unlock_percent":85,"unlock_collect_all_percent":75}`|

## TeamSuggestFirstTeam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|suggest_hero|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|core_hero|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc_pos|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"suggest_hero":[2010101,2010201,1020601,2020601,3030501],"core_hero":[1030101,2030201,3030601,4030501],"loc_pos":[6,4,2,5,1,3]}`|
|2|`{"suggest_hero":[2010101,2010201,1020601,2020601,2020201],"core_hero":[1030101,2030201,3030601,4030501],"loc_pos":[6,4,2,5,1,3]}`|

## TeamGenreCycleOld

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|asserts|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_open_day|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_asserts|undefined|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|88|本表行键；与其他表同值不自动代表同一对象。|
|cycle_team_show|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cycle_team|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"asserts":254606700001,"unlock_open_day":1,"type":1,"cycle_team_show":101,"cycle_team":101}`|
|102|`{"asserts":778050200102,"unlock_open_day":30,"type":1,"cycle_team_show":102,"cycle_team":102}`|
|103|`{"asserts":778050200103,"unlock_open_day":50,"type":1,"cycle_team_show":103,"cycle_team":103}`|
|104|`{"asserts":778050200104,"unlock_open_day":65,"type":1,"cycle_team_show":104,"cycle_team":104}`|
|105|`{"asserts":778050200105,"unlock_open_day":67,"type":1,"cycle_team_show":105,"cycle_team":105}`|
|106|`{"asserts":955132601441,"unlock_open_day":79,"type":1,"cycle_team_show":106,"cycle_team":106}`|
|201|`{"asserts":254606700001,"unlock_open_day":1,"type":2,"cycle_team_show":201,"cycle_team":201}`|
|202|`{"asserts":778050200103,"unlock_open_day":50,"type":2,"cycle_team_show":202,"cycle_team":202}`|
|203|`{"asserts":778050200104,"unlock_open_day":30,"type":2,"cycle_team_show":203,"cycle_team":203}`|
|204|`{"asserts":778050200105,"unlock_open_day":67,"type":2,"cycle_team_show":204,"cycle_team":204}`|
|205|`{"asserts":955132601440,"unlock_open_day":79,"type":2,"cycle_team_show":205,"cycle_team":205}`|
|301|`{"asserts":254606700001,"unlock_open_day":1,"type":3,"cycle_team_show":301,"cycle_team":301}`|
|302|`{"asserts":778050200103,"unlock_open_day":50,"type":3,"cycle_team_show":302,"cycle_team":302}`|
|303|`{"asserts":778050200303,"unlock_open_day":58,"type":3,"cycle_team_show":303,"cycle_team":303}`|
|304|`{"asserts":778050200104,"unlock_open_day":65,"type":3,"cycle_team_show":304,"cycle_team":304}`|
|305|`{"asserts":778050200105,"unlock_open_day":67,"type":3,"cycle_team_show":305,"cycle_team":305}`|
|401|`{"asserts":254606700001,"unlock_open_day":1,"type":4,"cycle_team_show":401,"cycle_team":401}`|
|402|`{"asserts":778050200102,"unlock_open_day":30,"type":4,"cycle_team_show":402,"cycle_team":402}`|
|403|`{"asserts":778050200104,"unlock_open_day":30,"type":4,"cycle_team_show":403,"cycle_team":403}`|
|404|`{"asserts":778050200103,"unlock_open_day":50,"type":4,"cycle_team_show":404,"cycle_team":404}`|
|405|`{"asserts":778050200104,"unlock_open_day":65,"type":4,"cycle_team_show":405,"cycle_team":405}`|
|501|`{"asserts":254606700001,"unlock_open_day":1,"type":5,"cycle_team_show":0,"cycle_team":0}`|
|601|`{"asserts":254606700001,"unlock_open_day":1,"type":6,"cycle_team_show":601,"cycle_team":601}`|
|701|`{"asserts":254606700001,"unlock_open_day":1,"type":7,"cycle_team_show":0,"cycle_team":701}`|
|801|`{"asserts":254606700001,"unlock_open_day":1,"type":8,"cycle_team_show":0,"cycle_team":801}`|
|901|`{"asserts":254606700001,"unlock_open_day":1,"type":9,"cycle_team_show":0,"cycle_team":901}`|
|1001|`{"asserts":254606700001,"unlock_open_day":1,"type":10,"cycle_team_show":0,"cycle_team":1001}`|
|1101|`{"asserts":254606700001,"unlock_open_day":1,"type":11,"cycle_team_show":0,"cycle_team":1101}`|
|1201|`{"asserts":254606700001,"unlock_open_day":1,"type":12,"cycle_team_show":0,"cycle_team":1201}`|
|1301|`{"asserts":254606700001,"unlock_open_day":1,"type":13,"cycle_team_show":0,"cycle_team":1301}`|
|1401|`{"asserts":254606700001,"unlock_open_day":1,"type":14,"cycle_team_show":0,"cycle_team":1401}`|
|1501|`{"asserts":254606700001,"unlock_open_day":1,"type":15,"cycle_team_show":0,"cycle_team":1501}`|
|1601|`{"asserts":254606700001,"unlock_open_day":1,"type":16,"cycle_team_show":0,"cycle_team":1601}`|
|1701|`{"asserts":955132601266,"unlock_open_day":1,"type":17,"cycle_team_show":1701,"cycle_team":1701}`|
|1702|`{"asserts":778050200102,"unlock_open_day":22,"type":17,"cycle_team_show":1702,"cycle_team":1702}`|
|1703|`{"asserts":778050201703,"unlock_open_day":37,"type":17,"cycle_team_show":1703,"cycle_team":1703}`|
|1704|`{"asserts":778050200104,"unlock_open_day":65,"type":17,"cycle_team_show":1704,"cycle_team":1704}`|
|1705|`{"asserts":778050200103,"unlock_open_day":50,"type":17,"cycle_team_show":1705,"cycle_team":1705}`|
|1706|`{"asserts":778050200104,"unlock_open_day":94,"type":17,"cycle_team_show":1706,"cycle_team":1706}`|
|1707|`{"asserts":778050200104,"unlock_open_day":66,"type":17,"cycle_team_show":1707,"cycle_team":1707}`|
|1708|`{"asserts":778050200105,"unlock_open_day":67,"type":17,"cycle_team_show":1708,"cycle_team":1708}`|
|1709|`{"asserts":778050200104,"unlock_open_day":65,"type":17,"cycle_team_show":1709,"cycle_team":1709}`|
|1710|`{"asserts":778050200104,"unlock_open_day":94,"type":17,"cycle_team_show":1710,"cycle_team":1710}`|
|1711|`{"asserts":983580210003,"unlock_open_day":79,"type":17,"cycle_team_show":1711,"cycle_team":1711}`|
|1712|`{"asserts":955132601441,"unlock_open_day":80,"type":17,"cycle_team_show":1712,"cycle_team":1712}`|
|1801|`{"asserts":955132601266,"unlock_open_day":1,"type":18,"cycle_team_show":1801,"cycle_team":1801}`|
|1802|`{"asserts":778050201703,"unlock_open_day":37,"type":18,"cycle_team_show":1802,"cycle_team":1802}`|
|1803|`{"asserts":778050200104,"unlock_open_day":30,"type":18,"cycle_team_show":1803,"cycle_team":1803}`|
|1804|`{"asserts":778050201703,"unlock_open_day":37,"type":18,"cycle_team_show":1804,"cycle_team":1804}`|
|1805|`{"asserts":778050200104,"unlock_open_day":65,"type":18,"cycle_team_show":1805,"cycle_team":1805}`|
|1806|`{"asserts":778050200104,"unlock_open_day":94,"type":18,"cycle_team_show":1806,"cycle_team":1806}`|
|1807|`{"asserts":778050200104,"unlock_open_day":94,"type":18,"cycle_team_show":1807,"cycle_team":1807}`|
|1808|`{"asserts":778050200103,"unlock_open_day":50,"type":18,"cycle_team_show":1808,"cycle_team":1808}`|
|1809|`{"asserts":778050200105,"unlock_open_day":67,"type":18,"cycle_team_show":1809,"cycle_team":1809}`|
|1810|`{"asserts":778050200104,"unlock_open_day":94,"type":18,"cycle_team_show":1810,"cycle_team":1810}`|
|1811|`{"asserts":778050201811,"unlock_open_day":79,"type":18,"cycle_team_show":1811,"cycle_team":1811}`|
|1812|`{"asserts":955132601440,"unlock_open_day":80,"type":18,"cycle_team_show":1812,"cycle_team":1812}`|
|1901|`{"asserts":955132601266,"unlock_open_day":1,"type":19,"cycle_team_show":1901,"cycle_team":1901}`|
|1902|`{"asserts":778050200104,"unlock_open_day":30,"type":19,"cycle_team_show":1902,"cycle_team":1902}`|
|1903|`{"asserts":778050201703,"unlock_open_day":37,"type":19,"cycle_team_show":1903,"cycle_team":1903}`|
|1904|`{"asserts":778050200104,"unlock_open_day":65,"type":19,"cycle_team_show":1904,"cycle_team":1904}`|
|1905|`{"asserts":778050200103,"unlock_open_day":50,"type":19,"cycle_team_show":1905,"cycle_team":1905}`|
|1906|`{"asserts":778050200104,"unlock_open_day":94,"type":19,"cycle_team_show":1906,"cycle_team":1906}`|
|1907|`{"asserts":778050200303,"unlock_open_day":58,"type":19,"cycle_team_show":1907,"cycle_team":1907}`|
|1908|`{"asserts":778050200104,"unlock_open_day":45,"type":19,"cycle_team_show":1908,"cycle_team":1908}`|
|1909|`{"asserts":778050200104,"unlock_open_day":65,"type":19,"cycle_team_show":1909,"cycle_team":1909}`|
|1910|`{"asserts":778050200104,"unlock_open_day":94,"type":19,"cycle_team_show":1910,"cycle_team":1910}`|
|1911|`{"asserts":983580210003,"unlock_open_day":79,"type":19,"cycle_team_show":1911,"cycle_team":1911}`|
|1912|`{"asserts":778050201912,"unlock_open_day":90,"type":19,"cycle_team_show":1912,"cycle_team":1912}`|
|2001|`{"asserts":955132601266,"unlock_open_day":1,"type":20,"cycle_team_show":2001,"cycle_team":2001}`|
|2002|`{"asserts":778050200102,"unlock_open_day":22,"type":20,"cycle_team_show":2002,"cycle_team":2002}`|
|2003|`{"asserts":778050200104,"unlock_open_day":30,"type":20,"cycle_team_show":2003,"cycle_team":2003}`|
|2004|`{"asserts":778050201703,"unlock_open_day":37,"type":20,"cycle_team_show":2004,"cycle_team":2004}`|
|2005|`{"asserts":778050200104,"unlock_open_day":65,"type":20,"cycle_team_show":2005,"cycle_team":2005}`|
|2006|`{"asserts":778050200103,"unlock_open_day":50,"type":20,"cycle_team_show":2006,"cycle_team":2006}`|
|2007|`{"asserts":778050200104,"unlock_open_day":94,"type":20,"cycle_team_show":2007,"cycle_team":2007}`|
|2008|`{"asserts":778050200104,"unlock_open_day":45,"type":20,"cycle_team_show":2008,"cycle_team":2008}`|
|2009|`{"asserts":778050200104,"unlock_open_day":65,"type":20,"cycle_team_show":2009,"cycle_team":2009}`|
|2010|`{"asserts":983580210003,"unlock_open_day":94,"type":20,"cycle_team_show":2010,"cycle_team":2010}`|
|2011|`{"asserts":778050202011,"unlock_open_day":90,"type":20,"cycle_team_show":2011,"cycle_team":2011}`|
|2101|`{"asserts":955132601266,"unlock_open_day":1,"type":21,"cycle_team_show":2101,"cycle_team":2101}`|
|2201|`{"asserts":254606700001,"unlock_open_day":1,"type":22,"cycle_team_show":0,"cycle_team":0}`|
|2202|`{"asserts":778050200104,"unlock_open_day":50,"type":22,"cycle_team_show":2202,"cycle_team":2202}`|
|2203|`{"asserts":778050200104,"unlock_open_day":65,"type":22,"cycle_team_show":2203,"cycle_team":2203}`|
|2204|`{"asserts":778050201703,"unlock_open_day":37,"type":22,"cycle_team_show":2204,"cycle_team":2204}`|
|2205|`{"asserts":778050200104,"unlock_open_day":80,"type":22,"cycle_team_show":2205,"cycle_team":2205}`|
|2206|`{"asserts":778050200103,"unlock_open_day":50,"type":22,"cycle_team_show":2206,"cycle_team":2206}`|
|2207|`{"asserts":778050200104,"unlock_open_day":94,"type":22,"cycle_team_show":2207,"cycle_team":2207}`|

## TeamGenreCycle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|asserts|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_open_day|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_asserts|undefined/number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|73|本表行键；与其他表同值不自动代表同一对象。|
|cycle_team_show|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cycle_team|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5101|`{"asserts":151200005101,"unlock_open_day":1,"type":51,"cycle_team_show":0,"cycle_team":5101}`|
|5102|`{"asserts":151200005102,"unlock_open_day":12,"type":51,"cycle_team_show":0,"cycle_team":5102}`|
|5103|`{"asserts":41612268002,"unlock_open_day":47,"type":51,"cycle_team_show":0,"cycle_team":5103}`|
|5104|`{"asserts":151200005104,"unlock_open_day":1,"type":51,"cycle_team_show":0,"cycle_team":5104}`|
|5201|`{"asserts":151200005101,"unlock_open_day":1,"type":52,"cycle_team_show":0,"cycle_team":5201}`|
|5202|`{"asserts":151200005202,"unlock_open_day":40,"type":52,"cycle_team_show":0,"cycle_team":5202}`|
|5203|`{"asserts":638469030517,"unlock_open_day":54,"type":52,"cycle_team_show":0,"cycle_team":5203}`|
|5204|`{"asserts":151200005104,"unlock_open_day":1,"type":52,"cycle_team_show":0,"cycle_team":5204}`|
|5301|`{"asserts":151200005101,"unlock_open_day":1,"type":53,"cycle_team_show":0,"cycle_team":5301}`|
|5302|`{"asserts":151200005302,"unlock_open_day":33,"type":53,"cycle_team_show":0,"cycle_team":5302}`|
|5303|`{"asserts":151200005104,"unlock_open_day":1,"type":53,"cycle_team_show":0,"cycle_team":5303}`|
|5401|`{"asserts":151200005101,"unlock_open_day":1,"type":54,"cycle_team_show":0,"cycle_team":5401}`|
|5402|`{"asserts":151200005402,"unlock_open_day":2,"type":54,"cycle_team_show":0,"cycle_team":5402}`|
|5403|`{"asserts":151200005104,"unlock_open_day":1,"type":54,"cycle_team_show":0,"cycle_team":5403}`|
|5501|`{"asserts":151200005501,"unlock_open_day":1,"type":55,"cycle_team_show":0,"cycle_team":5501}`|
|5601|`{"asserts":941349100005,"unlock_open_day":8,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5601}`|
|5602|`{"asserts":983580210701,"unlock_open_day":12,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5602}`|
|5603|`{"asserts":230114840301,"unlock_open_day":15,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5603}`|
|5604|`{"asserts":908613500002,"unlock_open_day":22,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5604}`|
|5605|`{"asserts":8850230601,"unlock_open_day":29,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5605}`|
|5606|`{"asserts":151200005606,"unlock_open_day":1,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5606}`|
|5607|`{"asserts":151200005607,"unlock_open_day":1,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5607}`|
|5608|`{"asserts":151200005608,"unlock_open_day":1,"new_asserts":478536205601,"type":56,"cycle_team_show":0,"cycle_team":5608}`|
|5701|`{"asserts":941349100005,"unlock_open_day":8,"new_asserts":478536205601,"type":57,"cycle_team_show":0,"cycle_team":5701}`|
|5702|`{"asserts":230114840301,"unlock_open_day":15,"new_asserts":478536205601,"type":57,"cycle_team_show":0,"cycle_team":5702}`|
|5703|`{"asserts":908613500002,"unlock_open_day":22,"new_asserts":478536205601,"type":57,"cycle_team_show":0,"cycle_team":5703}`|
|5704|`{"asserts":8850230601,"unlock_open_day":29,"new_asserts":478536205601,"type":57,"cycle_team_show":0,"cycle_team":5704}`|
|5705|`{"asserts":151200005606,"unlock_open_day":1,"new_asserts":478536205601,"type":57,"cycle_team_show":0,"cycle_team":5705}`|
|5706|`{"asserts":151200005607,"unlock_open_day":1,"new_asserts":478536205601,"type":57,"cycle_team_show":0,"cycle_team":5706}`|
|5707|`{"asserts":151200005608,"unlock_open_day":1,"new_asserts":478536205601,"type":57,"cycle_team_show":0,"cycle_team":5707}`|
|5801|`{"asserts":941349100005,"unlock_open_day":8,"new_asserts":478536205601,"type":58,"cycle_team_show":0,"cycle_team":5801}`|
|5802|`{"asserts":230114840301,"unlock_open_day":15,"new_asserts":478536205601,"type":58,"cycle_team_show":0,"cycle_team":5802}`|
|5803|`{"asserts":908613500002,"unlock_open_day":22,"new_asserts":478536205601,"type":58,"cycle_team_show":0,"cycle_team":5803}`|
|5804|`{"asserts":8850230601,"unlock_open_day":29,"new_asserts":478536205601,"type":58,"cycle_team_show":0,"cycle_team":5804}`|
|5805|`{"asserts":151200005606,"unlock_open_day":1,"new_asserts":478536205601,"type":58,"cycle_team_show":0,"cycle_team":5805}`|
|5806|`{"asserts":151200005607,"unlock_open_day":1,"new_asserts":478536205601,"type":58,"cycle_team_show":0,"cycle_team":5806}`|
|5807|`{"asserts":151200005608,"unlock_open_day":1,"new_asserts":478536205601,"type":58,"cycle_team_show":0,"cycle_team":5807}`|
|5901|`{"asserts":941349100005,"unlock_open_day":8,"new_asserts":478536205601,"type":59,"cycle_team_show":0,"cycle_team":5901}`|
|5902|`{"asserts":230114840301,"unlock_open_day":15,"new_asserts":478536205601,"type":59,"cycle_team_show":0,"cycle_team":5902}`|
|5903|`{"asserts":908613500002,"unlock_open_day":22,"new_asserts":478536205601,"type":59,"cycle_team_show":0,"cycle_team":5903}`|
|5904|`{"asserts":8850230601,"unlock_open_day":29,"new_asserts":478536205601,"type":59,"cycle_team_show":0,"cycle_team":5904}`|
|5905|`{"asserts":151200005606,"unlock_open_day":1,"new_asserts":478536205601,"type":59,"cycle_team_show":0,"cycle_team":5905}`|
|5906|`{"asserts":151200005607,"unlock_open_day":1,"new_asserts":478536205601,"type":59,"cycle_team_show":0,"cycle_team":5906}`|
|5907|`{"asserts":151200005608,"unlock_open_day":1,"new_asserts":478536205601,"type":59,"cycle_team_show":0,"cycle_team":5907}`|
|6001|`{"asserts":151200006001,"unlock_open_day":29,"type":60,"cycle_team_show":0,"cycle_team":6001}`|
|6002|`{"asserts":955132601452,"unlock_open_day":29,"type":60,"cycle_team_show":0,"cycle_team":6002}`|
|6003|`{"asserts":151200006003,"unlock_open_day":29,"type":60,"cycle_team_show":0,"cycle_team":6003}`|
|6004|`{"asserts":151200006003,"unlock_open_day":29,"type":60,"cycle_team_show":0,"cycle_team":6006}`|
|6101|`{"asserts":151200006101,"unlock_open_day":29,"type":61,"cycle_team_show":0,"cycle_team":6101}`|
|6102|`{"asserts":955132601463,"unlock_open_day":29,"type":61,"cycle_team_show":0,"cycle_team":6102}`|
|6103|`{"asserts":151200006103,"unlock_open_day":29,"type":61,"cycle_team_show":0,"cycle_team":6103}`|
|6104|`{"asserts":767223424308,"unlock_open_day":29,"type":61,"cycle_team_show":0,"cycle_team":6104}`|
|6105|`{"asserts":151200006105,"unlock_open_day":29,"type":61,"cycle_team_show":0,"cycle_team":6105}`|
|6201|`{"asserts":151200006101,"unlock_open_day":29,"type":62,"cycle_team_show":0,"cycle_team":6201}`|
|6202|`{"asserts":955132601463,"unlock_open_day":29,"type":62,"cycle_team_show":0,"cycle_team":6202}`|
|6203|`{"asserts":151200006103,"unlock_open_day":29,"type":62,"cycle_team_show":0,"cycle_team":6203}`|
|6204|`{"asserts":767223424308,"unlock_open_day":29,"type":62,"cycle_team_show":0,"cycle_team":6204}`|
|6205|`{"asserts":151200006105,"unlock_open_day":29,"type":62,"cycle_team_show":0,"cycle_team":6205}`|
|6301|`{"asserts":151200006101,"unlock_open_day":29,"type":63,"cycle_team_show":0,"cycle_team":6301}`|
|6302|`{"asserts":955132601463,"unlock_open_day":29,"type":63,"cycle_team_show":0,"cycle_team":6302}`|
|6303|`{"asserts":151200006103,"unlock_open_day":29,"type":63,"cycle_team_show":0,"cycle_team":6303}`|
|6304|`{"asserts":767223424308,"unlock_open_day":29,"type":63,"cycle_team_show":0,"cycle_team":6304}`|
|6305|`{"asserts":151200006105,"unlock_open_day":29,"type":63,"cycle_team_show":0,"cycle_team":6305}`|
|6401|`{"asserts":151200006101,"unlock_open_day":29,"type":64,"cycle_team_show":0,"cycle_team":6401}`|
|6402|`{"asserts":955132601463,"unlock_open_day":29,"type":64,"cycle_team_show":0,"cycle_team":6402}`|
|6403|`{"asserts":151200006103,"unlock_open_day":29,"type":64,"cycle_team_show":0,"cycle_team":6403}`|
|6404|`{"asserts":767223424308,"unlock_open_day":29,"type":64,"cycle_team_show":0,"cycle_team":6404}`|
|6405|`{"asserts":151200006105,"unlock_open_day":29,"type":64,"cycle_team_show":0,"cycle_team":6405}`|
|6501|`{"asserts":151200006101,"unlock_open_day":29,"type":65,"cycle_team_show":0,"cycle_team":6501}`|
|6502|`{"asserts":955132601463,"unlock_open_day":29,"type":65,"cycle_team_show":0,"cycle_team":6502}`|
|6503|`{"asserts":151200006103,"unlock_open_day":29,"type":65,"cycle_team_show":0,"cycle_team":6503}`|
|6504|`{"asserts":767223424308,"unlock_open_day":29,"type":65,"cycle_team_show":0,"cycle_team":6504}`|
|6505|`{"asserts":151200006105,"unlock_open_day":29,"type":65,"cycle_team_show":0,"cycle_team":6505}`|

## StrategyTeamGenre

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|hero_position|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suggest_hero|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|subheading|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_idx|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|title|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|701|`{"hero_position":[10241,10231],"suggest_hero":[2020601,1020601,1020201,3020501,1010101,1010201],"type":7}`|
|801|`{"hero_position":[10228,10241],"suggest_hero":[2030201,2030301,2030401,2020601,3020501,1010201],"type":8}`|
|901|`{"hero_position":[10231,10214],"suggest_hero":[1030301,1030201,2020401,2020601,1020601,1020401],"type":9}`|
|1001|`{"hero_position":[10252,10250],"suggest_hero":[1030301,1030201,2030201,2030301,4030201,4030101],"type":10}`|
|1101|`{"hero_position":[10229,10247],"suggest_hero":[3030601,3030201,3030501,3030301,3030401,4030301],"type":11}`|
|1201|`{"hero_position":[10215,10250],"suggest_hero":[3030501,4030401,1030501,2030201,4030201,2030101],"type":12}`|
|1301|`{"hero_position":[10229,10217],"suggest_hero":[1030101,1030501,3030501,1020401,2020601,1020601],"type":13}`|
|1401|`{"hero_position":[10226,10250],"suggest_hero":[2030201,2030301,2030401,2020401,2020601,1020601],"type":14}`|
|1501|`{"hero_position":[10229,10247],"suggest_hero":[3030601,3030201,3030301,3030401,3020101,3020201],"type":15}`|
|1601|`{"hero_position":[10215,10250],"suggest_hero":[4030501,4030401,3030501,4020101,4010301,4030801],"type":16}`|

## TeamGenreConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|rule_time_split|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|genre_hero_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rule_time_split":1757278800,"genre_hero_count":6}`|

## TeamGenreShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|target_star|array|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|array|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|76|本表行键；与其他表同值不自动代表同一对象。|
|skill_desc|array|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"target_star":[10,10,10,6,5,5],"skill":[4103010163,4103050163,4303050161,3103040151,3103020151,3103030151],"type":1,"skill_desc":[6502087,6502088,6502089,6502090,6504390,6504391]}`|
|102|`{"target_star":[10,10,10,10,5,5],"skill":[4103010163,4103060163,4103050163,3103040151,3103020151,3103030151],"type":1,"skill_desc":[6502087,6503021,6502088,6502090,6504390,6504391]}`|
|103|`{"target_star":[10,10,10,10,5,10],"skill":[4103010163,4103060163,4103050163,3103030151,4303070163,4203060163],"type":1,"skill_desc":[6502087,6503021,6502088,6504391,6503571,6503572]}`|
|104|`{"target_star":[10,10,10,10,10,10],"skill":[4103010163,4103060163,4103050163,4303050163,4303070163,4203060163],"type":1,"skill_desc":[6502087,6503021,6502088,6503570,6503571,6503572]}`|
|105|`{"target_star":[10,10,10,10,10,5],"skill":[4103010163,4103060163,4103070163,4103050163,3103030151,3103040151],"type":1,"skill_desc":[6502087,6503021,6503599,6503570,6504391,6502090]}`|
|106|`{"target_star":[10,10,10,10,10,10],"skill":[4103010163,4103060163,4103070163,4104020163,4303070163,4203060163],"type":1,"skill_desc":[6502087,6503021,6503599,6504151,6504150,6502088]}`|
|201|`{"target_star":[10,10,6,5,5,5],"skill":[4203020163,4203030163,4303050161,3203040151,3203050151,3203010151],"type":2,"skill_desc":[6502069,6502070,6502071,6502072,6502073,6502074]}`|
|202|`{"target_star":[10,10,10,5,5,5],"skill":[4203020163,4203030163,4203060163,3203040151,3203050151,3203010151],"type":2,"skill_desc":[6502069,6504096,6503482,6502072,6502073,6502074]}`|
|203|`{"target_star":[10,10,6,5,5,6],"skill":[4203020163,4203030163,4403060161,3203040151,3203050151,4303050161],"type":2,"skill_desc":[6502069,6502070,6503482,6502072,6502073,6502071]}`|
|204|`{"target_star":[10,10,5,10,10,5],"skill":[4203020163,4203030163,3203040151,4203060163,4203070163,3203050151],"type":2,"skill_desc":[6502069,6502070,6503482,6504096,6504097,6504098]}`|
|205|`{"target_star":[10,10,10,10,10,5],"skill":[4203020163,4203030163,4204010163,4203060163,4203070163,3203040151],"type":2,"skill_desc":[6502069,6502070,6504127,6504096,6504097,6502072]}`|
|301|`{"target_star":[10,10,6,5,5,5],"skill":[4303060163,4303020163,4303050161,3303030151,3303040151,3302010151],"type":3,"skill_desc":[6502123,6502124,6502125,6502126,6502127,6504384]}`|
|302|`{"target_star":[10,10,10,6,5,5],"skill":[4303070163,4303060163,3303040151,4303050163,4303030163,4303020163],"type":3,"skill_desc":[6503504,6502123,6502127,6503502,6503503,6502124]}`|
|303|`{"target_star":[10,10,5,10,10,10],"skill":[4303070163,4303060163,4203060163,4303050163,4303030163,4303020163],"type":3,"skill_desc":[6503504,6502123,6503575,6503502,6503503,6502124]}`|
|304|`{"target_star":[10,10,10,10,10,10],"skill":[4303070163,4303060163,4103060163,4303050163,4303030163,4303020163],"type":3,"skill_desc":[6503504,6502123,6503022,6503502,6503503,6502124]}`|
|305|`{"target_star":[10,10,10,10,10,10],"skill":[4303070163,4303060163,4103060163,4303050163,4303030163,4103070163],"type":3,"skill_desc":[6503504,6502123,6503575,6503502,6503503,6503858]}`|
|401|`{"target_star":[10,10,6,5,5,5],"skill":[4403050163,4403040163,4303050161,3403080151,3403020151,3403010151],"type":4,"skill_desc":[6502105,6502106,6502107,6504385,6502109,6502110]}`|
|402|`{"target_star":[10,10,10,5,6,5],"skill":[4403050163,4403040163,4403060163,3403020151,4303050161,3403010151],"type":4,"skill_desc":[6502105,6502106,6503483,6502109,6502107,6502110]}`|
|403|`{"target_star":[10,10,10,5,6,5],"skill":[4403050163,4403040163,4403060163,3103040151,4303050161,3403010151],"type":4,"skill_desc":[6502105,6502106,6503483,6502108,6502107,6502110]}`|
|404|`{"target_star":[10,10,10,10,10,10],"skill":[4403050163,4403040163,4403060163,3403010151,4303050163,4203060163],"type":4,"skill_desc":[6502105,6502106,6503483,6502110,6503574,6503575]}`|
|405|`{"target_star":[10,10,10,10,10,10],"skill":[4403050163,4403040163,4403060163,4303070163,4303050163,4203060163],"type":4,"skill_desc":[6502105,6502106,6503483,6503573,6503574,6503575]}`|
|601|`{"target_star":[10,10,6,5,5,5],"skill":[4403080163,4303050163,4202060161,3102060151,3201020151,3201010151],"type":6,"skill_desc":[14929,14930,14931,14932,14933,14934]}`|
|1701|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4103010163,4103050163,4303050163,4103040163,3103030151],"type":17,"skill_desc":[6502872,6502873,6502874,6502875,6502876,6504391]}`|
|1702|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4103010163,4103060163,4103050163,4303050163,4103040163],"type":17,"skill_desc":[6502872,6502873,6503023,6502874,6502875,6502876]}`|
|1703|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4103060163,4103010163,4103050163,4103040163],"type":17,"skill_desc":[6503795,6502872,6503023,6502873,6502874,6502876]}`|
|1704|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4103010163,4103060163,4303050163,4303070163,4203060163],"type":17,"skill_desc":[6502872,6502873,6503023,6502875,6503576,6503577]}`|
|1705|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4103010163,4103060163,4404020163,4103050163,4203060163],"type":17,"skill_desc":[6502872,6502873,6503023,6503795,6502874,6503577]}`|
|1706|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4103060163,4103010163,4303050163,4203060163],"type":17,"skill_desc":[6503795,6502872,6503023,6502873,6502875,6503577]}`|
|1707|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4103060163,4103010163,4103070163,4103050163],"type":17,"skill_desc":[6503795,6502872,6503023,6502873,6503600,6502874]}`|
|1708|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4103060163,4103010163,4303050163,4103040163],"type":17,"skill_desc":[6503795,6502872,6503023,6502873,6502875,6502876]}`|
|1709|`{"target_star":[10,10,10,10,10,10],"skill":[4304010163,4104010163,4103060163,4103010163,4303050163,4203060163],"type":17,"skill_desc":[6504004,6502872,6503023,6502873,6502875,6503577]}`|
|1710|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4103060163,4103010163,4304010163,4203060163],"type":17,"skill_desc":[6503795,6502872,6503023,6502873,6504004,6503577]}`|
|1711|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4103050163,4103060163,4103070163,4304010163,4103010163],"type":17,"skill_desc":[6503795,6502874,6503023,6503600,6504004,6502873]}`|
|1712|`{"target_star":[10,10,10,10,10,10],"skill":[4104020163,4103050163,4103060163,4103070163,4304010163,4103010163],"type":17,"skill_desc":[6504152,6502874,6503023,6503600,6504004,6502873]}`|
|1801|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4203020163,4203030163,4203050163,4303050163,4203010163],"type":18,"skill_desc":[6502878,6502879,6502880,6504383,6502882,6502883]}`|
|1802|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4203020163,4203030163,4203050163,4203010163,4404020163],"type":18,"skill_desc":[6502878,6502879,6502880,6504383,6502883,6503796]}`|
|1803|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4203020163,4203030163,4403060163,4303050163,4203040163],"type":18,"skill_desc":[6502878,6502879,6502880,6503484,6502882,6502881]}`|
|1804|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4203020163,4203030163,4203040163,4303050163],"type":18,"skill_desc":[6503796,6502878,6502879,6502880,6502881,6502882]}`|
|1805|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4203020163,4203030163,4403060163,4303050163,4203060163],"type":18,"skill_desc":[6502878,6502879,6502880,6503484,6502882,6503585]}`|
|1806|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4203020163,4203030163,4403060163,4203060163],"type":18,"skill_desc":[6503796,6502878,6502879,6502880,6503484,6503585]}`|
|1807|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4203020163,4203030163,4403060163,4203060163],"type":18,"skill_desc":[6503796,6502878,6502879,6502880,6503484,6503585]}`|
|1808|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4203020163,4203030163,4203040163,4404020163,4203060163],"type":18,"skill_desc":[6502878,6502879,6502880,6502881,6503796,6503585]}`|
|1809|`{"target_star":[10,10,10,10,10,10],"skill":[4203070163,4104010163,4203020163,4203030163,4404020163,4203060163],"type":18,"skill_desc":[6504095,6502878,6502879,6502880,6503796,6502882]}`|
|1810|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4203020163,4203030163,4304010163,4303050163],"type":18,"skill_desc":[6503796,6502878,6502879,6502880,6504003,6502882]}`|
|1811|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4203030163,4203020163,4203070163,4304010163,4203060163],"type":18,"skill_desc":[6503796,6502880,6502879,6504095,6504003,6503585]}`|
|1812|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4204010163,4203020163,4203070163,4203030163,4203060163],"type":18,"skill_desc":[6503796,6504128,6502879,6504095,6502880,6503585]}`|
|1901|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4303060163,4303020163,4303030163,4303040163,4303050163],"type":19,"skill_desc":[6502884,6502885,6502886,6502887,6502888,6502889]}`|
|1902|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4303060163,4303020163,4103060163,4303030163,4303050163],"type":19,"skill_desc":[6502884,6502885,6502886,6503024,6502887,6502889]}`|
|1903|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4303020163,4303050163,4303030163,4303060163],"type":19,"skill_desc":[6503797,6502884,6502886,6502889,6502887,6502885]}`|
|1904|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4303070163,4303060163,4103060163,4303030163,4303050163],"type":19,"skill_desc":[6502884,6503505,6502885,6503024,6502887,6502889]}`|
|1905|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4303070163,4303050163,4303020163,4303060163],"type":19,"skill_desc":[6503797,6502884,6503505,6502889,6502886,6502885]}`|
|1906|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4303070163,4303050163,4303030163,4303060163],"type":19,"skill_desc":[6503797,6502884,6503505,6502889,6502887,6502885]}`|
|1907|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4303070163,4303050163,4203060163,4303060163],"type":19,"skill_desc":[6503797,6502884,6503505,6502889,6503585,6502885]}`|
|1908|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4303060163,4103060163,4303030163,4303050163],"type":19,"skill_desc":[6503797,6502884,6502885,6503024,6502887,6502889]}`|
|1909|`{"target_star":[10,10,10,10,10,10],"skill":[4304010163,4104010163,4303070163,4303050163,4103060163,4303060163],"type":19,"skill_desc":[6504002,6502884,6503505,6502889,6503024,6502885]}`|
|1910|`{"target_star":[10,10,10,10,10,10],"skill":[4304010163,4104010163,4303070163,4303050163,4404020163,4303060163],"type":19,"skill_desc":[6504002,6502884,6503505,6502889,6503797,6502885]}`|
|1911|`{"target_star":[10,10,10,10,10,10],"skill":[4304010163,4104010163,4303070163,4303050163,4404020163,4303060163],"type":19,"skill_desc":[6504002,6502884,6503505,6502889,6503797,6502885]}`|
|1912|`{"target_star":[10,10,10,10,10,10],"skill":[4304020163,4304010163,4303070163,4303020163,4303040163,4303060163],"type":19,"skill_desc":[6504431,6504002,6503505,6502886,6502888,6502885]}`|
|2001|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4403050163,4403040163,4303050163,4403020163,4403010163],"type":20,"skill_desc":[6502890,6502891,6502892,6502893,6502894,6502895]}`|
|2002|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4403050163,4403040163,4403060163,4303050163,4403010163],"type":20,"skill_desc":[6502890,6502891,6502892,6503485,6502893,6502895]}`|
|2003|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4403050163,4403040163,4403060163,4303050163,4103040163],"type":20,"skill_desc":[6502890,6502891,6502892,6503485,6502893,6503486]}`|
|2004|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4403050163,4403040163,4403060163,4303050163],"type":20,"skill_desc":[6503798,6502890,6502891,6502892,6503485,6502893]}`|
|2005|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4403050163,4403040163,4403060163,4303050163,4203060163],"type":20,"skill_desc":[6502890,6502891,6502892,6503485,6502893,6503579]}`|
|2006|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4403050163,4403040163,4403060163,4404020163,4203060163],"type":20,"skill_desc":[6502890,6502891,6502892,6503485,6503798,6503579]}`|
|2007|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4403050163,4403040163,4403060163,4203060163],"type":20,"skill_desc":[6503798,6502890,6502891,6502892,6503485,6503579]}`|
|2008|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4403050163,4403040163,4403060163,4303050163],"type":20,"skill_desc":[6503798,6502890,6502891,6502892,6503485,6502893]}`|
|2009|`{"target_star":[10,10,10,10,10,10],"skill":[4304010163,4104010163,4403050163,4403040163,4403060163,4203060163],"type":20,"skill_desc":[6504001,6502890,6502891,6502892,6503485,6503579]}`|
|2010|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4304010163,4403050163,4403040163,4403060163,4104010163],"type":20,"skill_desc":[6503798,6504001,6502891,6502892,6503485,6502890]}`|
|2011|`{"target_star":[10,10,10,10,10,10],"skill":[4404030163,4304010163,4403050163,4403040163,4403060163,4403010163],"type":20,"skill_desc":[6503798,6504001,6502891,6502892,6503485,6502890]}`|
|2101|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4403080163,4303050163,4202060163,4102060163,4201020163],"type":21,"skill_desc":[6502896,6502897,6502898,6502899,6502900,6502901]}`|
|2202|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4303070163,4403060163,4403050163,4403040163,4303050163],"type":22,"skill_desc":[6503509,6503510,6503511,6503512,6503513,6503514]}`|
|2203|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4303070163,4403060163,4403050163,4403040163,4303050163],"type":22,"skill_desc":[6503509,6503510,6503511,6503512,6503513,6503514]}`|
|2204|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4403040163,4403060163,4403050163,4104010163,4303050163],"type":22,"skill_desc":[6503799,6502892,6503511,6503512,6503509,6503514]}`|
|2205|`{"target_star":[10,10,10,10,10,10],"skill":[4104010163,4303070163,4403060163,4403050163,4203060163,4303050163],"type":22,"skill_desc":[6503509,6503510,6503511,6503512,6503584,6503514]}`|
|2206|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4303070163,4403060163,4403050163,4403040163,4303050163],"type":22,"skill_desc":[6503799,6503510,6503511,6503512,6503513,6503514]}`|
|2207|`{"target_star":[10,10,10,10,10,10],"skill":[4404020163,4104010163,4403060163,4403050163,4203060163,4103060163],"type":22,"skill_desc":[6503799,6503509,6503511,6503512,6503584,6503800]}`|

## TeamGenreAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[101500,20]]}`|
|2|`{"award":[[101500,20]]}`|
|3|`{"award":[[101500,20]]}`|
|4|`{"award":[[101500,20]]}`|
|5|`{"award":[[101500,20]]}`|
|6|`{"award":[[101500,20]]}`|

## TeamGenreAwardOld

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[25002,2],[32002,5]]}`|
|2|`{"award":[[25002,2],[32002,5]]}`|
|3|`{"award":[[25002,2],[32002,5]]}`|
|4|`{"award":[[25002,2],[32002,5]]}`|
|5|`{"award":[[25002,2],[32002,5]]}`|
|6|`{"award":[[25002,2],[33002,5]]}`|

## TeamGenreType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|main_genre|boolean|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_new|boolean|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene_idx|number|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|37|本表行键；与其他表同值不自动代表同一对象。|
|title|number|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene_name|string|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_idx|number|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_color|number|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|subheading|number|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_bg|string|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sp_genre|boolean|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|37|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_new":false}`|
|2|`{"is_new":false}`|
|3|`{"is_new":false}`|
|4|`{"is_new":false}`|
|5|`{"is_new":false}`|
|6|`{"is_new":false}`|
|7|`{"is_new":false}`|
|8|`{"is_new":false}`|
|9|`{"is_new":false}`|
|10|`{"is_new":false}`|
|11|`{"is_new":false}`|
|12|`{"is_new":false}`|
|13|`{"is_new":false}`|
|14|`{"is_new":false}`|
|15|`{"is_new":false}`|
|16|`{"is_new":false}`|
|17|`{"is_new":false}`|
|18|`{"is_new":false}`|
|19|`{"is_new":false}`|
|20|`{"is_new":false}`|
|21|`{"is_new":false}`|
|22|`{"is_new":false}`|
|51|`{"is_new":true}`|
|52|`{"is_new":true}`|
|53|`{"is_new":true}`|
|54|`{"is_new":true}`|
|55|`{"is_new":true}`|
|56|`{"is_new":true}`|
|57|`{"is_new":true}`|
|58|`{"is_new":true}`|
|59|`{"is_new":true}`|
|60|`{"is_new":true}`|
|61|`{"is_new":true}`|
|62|`{"is_new":true}`|
|63|`{"is_new":true}`|
|64|`{"is_new":true}`|
|65|`{"is_new":true}`|

## TeamGenre

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|type|number|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|151|本表行键；与其他表同值不自动代表同一对象。|
|title|number|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_position|array|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|core_hero|array|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|subheading|number|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_idx|number|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suggest_hero|array|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_level|array|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":1,"hero_position":[10214,10215],"core_hero":[1030101,1030501],"suggest_hero":[1030101,1030501,3030501,1030401,1030201,1030301],"sort_level":[4,5]}`|
|102|`{"type":1,"hero_position":[10214,10215],"core_hero":[1030101,1030601],"suggest_hero":[1030101,1030601,1030501,3030501,1030201,1030301],"sort_level":[4,5]}`|
|103|`{"type":1,"hero_position":[10214,10215],"core_hero":[1030101,1030601],"suggest_hero":[1030101,1030601,1030501,1030301,3030701,2030601],"sort_level":[4,5]}`|
|104|`{"type":1,"hero_position":[10214,10215],"core_hero":[1030101,1030601],"suggest_hero":[1030101,1030601,1030501,3030501,3030701,2030601],"sort_level":[4,5]}`|
|105|`{"type":1,"hero_position":[10214,10215],"core_hero":[1030701,1030601],"suggest_hero":[1030101,1030601,1030701,1030501,1030301,1030401],"sort_level":[4,5]}`|
|106|`{"type":1,"hero_position":[10214,10215],"core_hero":[1040201,1030701],"suggest_hero":[1030101,1030601,1030701,1040201,1030401,1030501],"sort_level":[4,5]}`|
|201|`{"type":2,"hero_position":[10226,10250],"core_hero":[2030201,2030301],"suggest_hero":[2030201,2030301,3030501,2030401,2030501,2030101],"sort_level":[3,4]}`|
|202|`{"type":2,"hero_position":[10226,10250],"core_hero":[2030601,2030301],"suggest_hero":[2030201,2030301,2030601,2030401,2030501,2030101],"sort_level":[3,4]}`|
|203|`{"type":2,"hero_position":[10226,10250],"core_hero":[2030201,2030301],"suggest_hero":[2030201,2030301,4030601,2030401,2030501,3030501],"sort_level":[3,4]}`|
|204|`{"type":2,"hero_position":[10226,10250],"core_hero":[2030701,2030601],"suggest_hero":[2030201,2030301,2030401,2030601,2030701,2030501],"sort_level":[3,4]}`|
|205|`{"type":2,"hero_position":[10226,10250],"core_hero":[2040101,2030701],"suggest_hero":[2030201,2030301,2040101,2030601,2030701,2030401],"sort_level":[3,4]}`|
|301|`{"type":3,"hero_position":[10229,10247],"core_hero":[3030601,3030201],"suggest_hero":[3030601,3030201,3030501,3030301,3030401,3020101],"sort_level":[2,3]}`|
|302|`{"type":3,"hero_position":[10229,10247],"core_hero":[3030701,3030601],"suggest_hero":[3030701,3030601,3030401,3030501,3030301,3030201],"sort_level":[2,3]}`|
|303|`{"type":3,"hero_position":[10229,10247],"core_hero":[3030701,3030601],"suggest_hero":[3030701,3030601,2030601,3030501,3030301,3030201],"sort_level":[2,3]}`|
|304|`{"type":3,"hero_position":[10229,10247],"core_hero":[3030701,3030601],"suggest_hero":[3030701,3030601,1030601,3030501,3030301,3030201],"sort_level":[2,3]}`|
|305|`{"type":3,"hero_position":[10229,10247],"core_hero":[3030701,3030601],"suggest_hero":[3030701,3030601,2030601,3030501,3030301,1030701],"sort_level":[2,3]}`|
|401|`{"type":4,"hero_position":[10231,10100],"core_hero":[4030501,4030401],"suggest_hero":[4030501,4030401,3030501,4030801,4030201,4030101],"sort_level":[1,2]}`|
|402|`{"type":4,"hero_position":[10231,10100],"core_hero":[4030501,4030401],"suggest_hero":[4030501,4030401,4030601,4030201,3030501,4030101],"sort_level":[1,2]}`|
|403|`{"type":4,"hero_position":[10231,10100],"core_hero":[4030501,4030401],"suggest_hero":[4030501,4030401,4030601,1030401,3030501,4030101],"sort_level":[1,2]}`|
|404|`{"type":4,"hero_position":[10231,10100],"core_hero":[4030501,4030401],"suggest_hero":[4030501,4030401,4030601,4030101,3030501,2030601],"sort_level":[1,2]}`|
|405|`{"type":4,"hero_position":[10231,10100],"core_hero":[4030501,4030401],"suggest_hero":[4030501,4030401,4030601,3030701,3030501,2030601],"sort_level":[1,2]}`|
|601|`{"type":6,"hero_position":[10252,10250],"core_hero":[4030801,3030501],"suggest_hero":[4030801,3030501,2020601,1020601,2010201,2010101],"sort_level":[5,1]}`|
|1701|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030101,1040101],"suggest_hero":[1040101,1030101,1030501,3030501,1030201,1030301],"sort_level":[1,10]}`|
|1702|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030101,1040101],"suggest_hero":[1040101,1030101,1030601,1030501,3030501,1030401],"sort_level":[1,10]}`|
|1703|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030101,4040201],"suggest_hero":[4040201,1040101,1030601,1030101,1030501,1030401],"sort_level":[1,10]}`|
|1704|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030101,1040101],"suggest_hero":[1040101,1030101,1030601,3030501,3030701,2030601],"sort_level":[1,10]}`|
|1705|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030101,4040201],"suggest_hero":[1040101,1030101,1030601,4040201,1030501,2030601],"sort_level":[1,10]}`|
|1706|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030101,4040201],"suggest_hero":[4040201,1040101,1030601,1030101,3030501,2030601],"sort_level":[1,10]}`|
|1707|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030701,4040201],"suggest_hero":[4040201,1040101,1030601,1030101,1030701,1030501],"sort_level":[1,10]}`|
|1708|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030601,4040201],"suggest_hero":[4040201,1040101,1030601,1030101,3030501,1030401],"sort_level":[1,10]}`|
|1709|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030601,3040101],"suggest_hero":[3040101,1040101,1030601,1030101,3030501,2030601],"sort_level":[1,10]}`|
|1710|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030601,3040101],"suggest_hero":[4040201,1040101,1030601,1030101,3040101,2030601],"sort_level":[1,10]}`|
|1711|`{"type":17,"hero_position":[10214,10215],"core_hero":[1030701,3040101],"suggest_hero":[4040201,1030501,1030601,1030701,3040101,1030101],"sort_level":[1,10]}`|
|1712|`{"type":17,"hero_position":[10214,10215],"core_hero":[1040201,3040101],"suggest_hero":[1040201,1030501,1030601,1030701,3040101,1030101],"sort_level":[1,10]}`|
|1801|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,1040101],"suggest_hero":[1040101,2030201,2030301,2030501,3030501,2030101],"sort_level":[1,9]}`|
|1802|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,1040101],"suggest_hero":[1040101,2030201,2030301,2030501,2030101,4040201],"sort_level":[1,9]}`|
|1803|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,1040101],"suggest_hero":[1040101,2030201,2030301,4030601,3030501,2030401],"sort_level":[1,9]}`|
|1804|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,4040201],"suggest_hero":[4040201,1040101,2030201,2030301,2030401,3030501],"sort_level":[1,9]}`|
|1805|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,1040101],"suggest_hero":[1040101,2030201,2030301,4030601,3030501,2030601],"sort_level":[1,9]}`|
|1806|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,4040201],"suggest_hero":[4040201,1040101,2030201,2030301,4030601,2030601],"sort_level":[1,9]}`|
|1807|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,4040201],"suggest_hero":[4040201,1040101,2030201,2030301,4030601,2030601],"sort_level":[1,9]}`|
|1808|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,4040201],"suggest_hero":[1040101,2030201,2030301,2030401,4040201,2030601],"sort_level":[1,9]}`|
|1809|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,2030701],"suggest_hero":[2030701,1040101,2030201,2030301,4040201,2030601],"sort_level":[1,9]}`|
|1810|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030301,3040101],"suggest_hero":[4040201,1040101,2030201,2030301,3040101,2030601],"sort_level":[1,9]}`|
|1811|`{"type":18,"hero_position":[10226,10250],"core_hero":[2030701,3040101],"suggest_hero":[4040201,2030301,2030201,2030701,3040101,2030601],"sort_level":[1,9]}`|
|1812|`{"type":18,"hero_position":[10226,10250],"core_hero":[2040101,4040201],"suggest_hero":[4040201,2040101,2030201,2030701,2030301,2030601],"sort_level":[1,9]}`|
|1901|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030601,1040101],"suggest_hero":[1040101,3030601,3030201,3030301,3030401,3030501],"sort_level":[1,8]}`|
|1902|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030601,1040101],"suggest_hero":[1040101,3030601,3030201,1030601,3030301,3030501],"sort_level":[1,8]}`|
|1903|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030601,4040201],"suggest_hero":[4040201,1040101,3030201,3030501,3030301,3030601],"sort_level":[1,8]}`|
|1904|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030601,1040101],"suggest_hero":[1040101,3030701,3030601,1030601,3030301,3030501],"sort_level":[1,8]}`|
|1905|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030701,4040201],"suggest_hero":[4040201,1040101,3030701,3030501,3030201,3030601],"sort_level":[1,8]}`|
|1906|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030701,4040201],"suggest_hero":[4040201,1040101,3030701,3030501,3030301,3030601],"sort_level":[1,8]}`|
|1907|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030701,4040201],"suggest_hero":[4040201,1040101,3030701,3030501,2030601,3030601],"sort_level":[1,8]}`|
|1908|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030601,4040201],"suggest_hero":[4040201,1040101,3030301,3030501,1030601,3030601],"sort_level":[1,8]}`|
|1909|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030701,3040101],"suggest_hero":[3040101,1040101,3030701,3030501,1030601,3030601],"sort_level":[1,8]}`|
|1910|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030701,3040101],"suggest_hero":[3040101,1040101,3030701,3030501,4040201,3030601],"sort_level":[1,8]}`|
|1911|`{"type":19,"hero_position":[10229,10247],"core_hero":[3030701,3040101],"suggest_hero":[3040101,1040101,3030701,3030501,4040201,3030601],"sort_level":[1,8]}`|
|1912|`{"type":19,"hero_position":[10229,10247],"core_hero":[3040201,3040101],"suggest_hero":[3040201,3040101,3030701,3030201,3030401,3030601],"sort_level":[1,8]}`|
|2001|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,1040101],"suggest_hero":[1040101,4030501,4030401,3030501,4030201,4030101],"sort_level":[1,7]}`|
|2002|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,1040101],"suggest_hero":[1040101,4030501,4030401,4030601,3030501,4030101],"sort_level":[1,7]}`|
|2003|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,1040101],"suggest_hero":[1040101,4030501,4030401,4030601,3030501,1030401],"sort_level":[1,7]}`|
|2004|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,4040201],"suggest_hero":[4040201,1040101,4030501,4030401,4030601,3030501],"sort_level":[1,7]}`|
|2005|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,1040101],"suggest_hero":[1040101,4030501,4030401,4030601,3030501,2030601],"sort_level":[1,7]}`|
|2006|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,4040201],"suggest_hero":[1040101,4030501,4030401,4030601,4040201,2030601],"sort_level":[1,7]}`|
|2007|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,4040201],"suggest_hero":[4040201,1040101,4030501,4030401,4030601,2030601],"sort_level":[1,7]}`|
|2008|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,4040201],"suggest_hero":[4040201,1040101,4030501,4030401,4030601,3030501],"sort_level":[1,7]}`|
|2009|`{"type":20,"hero_position":[10231,10100],"core_hero":[4030501,3040101],"suggest_hero":[3040101,1040101,4030501,4030401,4030601,2030601],"sort_level":[1,7]}`|
|2010|`{"type":20,"hero_position":[10231,10100],"core_hero":[4040201,3040101],"suggest_hero":[4040201,3040101,4030501,4030401,4030601,1040101],"sort_level":[1,7]}`|
|2011|`{"type":20,"hero_position":[10231,10100],"core_hero":[4040301,3040101],"suggest_hero":[4040301,3040101,4030501,4030401,4030601,4030101],"sort_level":[1,7]}`|
|2101|`{"type":21,"hero_position":[10252,10250],"core_hero":[1040101,3030501],"suggest_hero":[1040101,4030801,3030501,2020601,1020601,2010201],"sort_level":[1,6]}`|
|2202|`{"type":22,"hero_position":[10252,10229],"core_hero":[1040101,3030701],"suggest_hero":[1040101,3030701,4030601,4030501,4030401,3030501],"sort_level":[1,11]}`|
|2203|`{"type":22,"hero_position":[10252,10229],"core_hero":[1040101,3030701],"suggest_hero":[1040101,3030701,4030601,4030501,4030401,3030501],"sort_level":[1,11]}`|
|2204|`{"type":22,"hero_position":[10252,10229],"core_hero":[4030501,4040201],"suggest_hero":[4040201,4030401,4030601,4030501,1040101,3030501],"sort_level":[1,11]}`|
|2205|`{"type":22,"hero_position":[10252,10229],"core_hero":[1040101,3030701],"suggest_hero":[1040101,3030701,4030601,4030501,2030601,3030501],"sort_level":[1,11]}`|
|2206|`{"type":22,"hero_position":[10252,10229],"core_hero":[4040201,3030701],"suggest_hero":[4040201,3030701,4030601,4030501,4030401,3030501],"sort_level":[1,11]}`|
|2207|`{"type":22,"hero_position":[10252,10229],"core_hero":[1040101,4040201],"suggest_hero":[4040201,1040101,4030601,4030501,2030601,1030601],"sort_level":[1,11]}`|
|5101|`{"type":51,"hero_position":[10214,10215],"core_hero":[1030101,1030501],"suggest_hero":[1030101,1030501,1030401,1030201,1030301,3030501],"sort_level":[2,2]}`|
|5102|`{"type":51,"hero_position":[10214,10215],"core_hero":[1030601,1030101],"suggest_hero":[1030601,1030101,1030501,1030401,1030201,1030301],"sort_level":[2,2]}`|
|5103|`{"type":51,"hero_position":[10214,10215],"core_hero":[1030701,1030601],"suggest_hero":[1030701,1030601,1030101,1030501,1030401,1030201],"sort_level":[2,2]}`|
|5104|`{"type":51,"hero_position":[10214,10215],"core_hero":[1030601,1030101],"suggest_hero":[1030601,1030101,1030501,1030201,1030301,3030501],"sort_level":[2,2]}`|
|5201|`{"type":52,"hero_position":[10226,10250],"core_hero":[2030201,2030301],"suggest_hero":[2030201,2030301,2030401,2030501,2030101,3030501],"sort_level":[4,4]}`|
|5202|`{"type":52,"hero_position":[10226,10250],"core_hero":[2030601,2030201],"suggest_hero":[2030601,2030201,2030301,2030401,2030501,2030101],"sort_level":[4,4]}`|
|5203|`{"type":52,"hero_position":[10226,10250],"core_hero":[2030701,2030601],"suggest_hero":[2030701,2030601,2030201,2030301,2030401,2030501],"sort_level":[4,4]}`|
|5204|`{"type":52,"hero_position":[10226,10250],"core_hero":[2030601,2030201],"suggest_hero":[2030601,2030201,2030301,2030501,2030101,3030501],"sort_level":[4,4]}`|
|5301|`{"type":53,"hero_position":[10229,10247],"core_hero":[3030501,3030601],"suggest_hero":[3030501,3030601,3030201,3030301,3030401,3020101],"sort_level":[3,3]}`|
|5302|`{"type":53,"hero_position":[10229,10247],"core_hero":[3030701,3030501],"suggest_hero":[3030701,3030501,3030601,3030201,3030301,3030401],"sort_level":[3,3]}`|
|5303|`{"type":53,"hero_position":[10229,10247],"core_hero":[3030701,3030601],"suggest_hero":[3030701,3030601,3030201,3030301,3030401,3030501],"sort_level":[3,3]}`|
|5401|`{"type":54,"hero_position":[10231,10100],"core_hero":[4030501,4030401],"suggest_hero":[4030501,4030401,4030801,3030501,4030201,4030101],"sort_level":[5,5]}`|
|5402|`{"type":54,"hero_position":[10231,10100],"core_hero":[4030601,4030501],"suggest_hero":[4030601,4030501,4030401,4030801,3030501,4030201],"sort_level":[5,5]}`|
|5403|`{"type":54,"hero_position":[10231,10100],"core_hero":[4030601,4030501],"suggest_hero":[4030601,4030501,4030401,4030801,4030201,3030501],"sort_level":[5,5]}`|
|5501|`{"type":55,"hero_position":[10252,10250],"core_hero":[3030501,4030801],"suggest_hero":[3030501,4030801,2020601,1020601,2010201,2010101],"sort_level":[1,1]}`|
|5601|`{"type":56,"hero_position":[10214,10215],"core_hero":[4040201,1040101],"suggest_hero":[4040201,1040101,1030101,1030501,1030401,1030201],"sort_level":[1,7]}`|
|5602|`{"type":56,"hero_position":[10214,10215],"core_hero":[4040201,1040101],"suggest_hero":[4040201,1040101,1030601,1030101,1030501,1030401],"sort_level":[1,7]}`|
|5603|`{"type":56,"hero_position":[10214,10215],"core_hero":[3040101,4040201],"suggest_hero":[3040101,4040201,1040101,1030601,1030101,1030501],"sort_level":[1,7]}`|
|5604|`{"type":56,"hero_position":[10214,10215],"core_hero":[4040301,3040101],"suggest_hero":[4040301,3040101,4040201,1040101,1030601,1030101],"sort_level":[1,7]}`|
|5605|`{"type":56,"hero_position":[10214,10215],"core_hero":[1040301,4040301],"suggest_hero":[1040301,4040301,4040201,3040101,1030601,1030101],"sort_level":[1,7]}`|
|5606|`{"type":56,"hero_position":[10214,10215],"core_hero":[1040101,1030601],"suggest_hero":[1040101,1030601,1030101,1030501,3030501,1030401],"sort_level":[1,7]}`|
|5607|`{"type":56,"hero_position":[10214,10215],"core_hero":[1040101,2040201],"suggest_hero":[1040101,2040201,1030601,1030101,1030501,3030501],"sort_level":[1,7]}`|
|5608|`{"type":56,"hero_position":[10214,10215],"core_hero":[5040201,4040301],"suggest_hero":[5040201,4040301,1030601,1030101,1030501,3030501],"sort_level":[1,7]}`|
|5701|`{"type":57,"hero_position":[10226,10250],"core_hero":[4040201,1040101],"suggest_hero":[4040201,1040101,2030201,2030301,2030401,2030501],"sort_level":[1,9]}`|
|5702|`{"type":57,"hero_position":[10226,10250],"core_hero":[3040101,4040201],"suggest_hero":[3040101,4040201,1040101,2030201,2030301,2030401],"sort_level":[1,9]}`|
|5703|`{"type":57,"hero_position":[10226,10250],"core_hero":[4040301,3040101],"suggest_hero":[4040301,3040101,4040201,1040101,2030201,2030301],"sort_level":[1,9]}`|
|5704|`{"type":57,"hero_position":[10226,10250],"core_hero":[1040301,4040301],"suggest_hero":[1040301,4040301,4040201,3040101,2030201,2030301],"sort_level":[1,9]}`|
|5705|`{"type":57,"hero_position":[10226,10250],"core_hero":[1040101,2030601],"suggest_hero":[1040101,2030601,2030201,2030301,2030401,3030501],"sort_level":[1,9]}`|
|5706|`{"type":57,"hero_position":[10226,10250],"core_hero":[1040101,2040201],"suggest_hero":[1040101,2040201,2030601,2030201,2030301,3030501],"sort_level":[1,9]}`|
|5707|`{"type":57,"hero_position":[10226,10250],"core_hero":[5040201,4040301],"suggest_hero":[5040201,4040301,2030601,2030201,2030301,3030501],"sort_level":[1,9]}`|
|5801|`{"type":58,"hero_position":[10229,10247],"core_hero":[4040201,1040101],"suggest_hero":[4040201,1040101,3030501,3030601,3030201,3030301],"sort_level":[1,8]}`|
|5802|`{"type":58,"hero_position":[10229,10247],"core_hero":[3040101,4040201],"suggest_hero":[3040101,4040201,1040101,3030501,3030601,3030201],"sort_level":[1,8]}`|
|5803|`{"type":58,"hero_position":[10229,10247],"core_hero":[4040301,3040101],"suggest_hero":[4040301,3040101,4040201,1040101,3030501,3030601],"sort_level":[1,8]}`|
|5804|`{"type":58,"hero_position":[10229,10247],"core_hero":[1040301,4040301],"suggest_hero":[1040301,4040301,4040201,3040101,3030501,3030601],"sort_level":[1,8]}`|
|5805|`{"type":58,"hero_position":[10229,10247],"core_hero":[1040101,3030701],"suggest_hero":[1040101,3030701,3030601,3030501,3030201,3030401],"sort_level":[1,8]}`|
|5806|`{"type":58,"hero_position":[10229,10247],"core_hero":[1040101,2040201],"suggest_hero":[1040101,2040201,3030701,3030601,3030501,3030201],"sort_level":[1,8]}`|
|5807|`{"type":58,"hero_position":[10229,10247],"core_hero":[5040201,4040301],"suggest_hero":[5040201,4040301,3030701,3030601,3030501,3030201],"sort_level":[1,8]}`|
|5901|`{"type":59,"hero_position":[10231,10100],"core_hero":[4040201,1040101],"suggest_hero":[4040201,1040101,4030601,4030501,4030401,4030801],"sort_level":[1,10]}`|
|5902|`{"type":59,"hero_position":[10231,10100],"core_hero":[3040101,4040201],"suggest_hero":[3040101,4040201,1040101,4030601,4030501,4030401],"sort_level":[1,10]}`|
|5903|`{"type":59,"hero_position":[10231,10100],"core_hero":[4040301,3040101],"suggest_hero":[4040301,3040101,4040201,1040101,4030601,4030501],"sort_level":[1,10]}`|
|5904|`{"type":59,"hero_position":[10231,10100],"core_hero":[1040301,4040301],"suggest_hero":[1040301,4040301,4040201,3040101,4030601,4030501],"sort_level":[1,10]}`|
|5905|`{"type":59,"hero_position":[10231,10100],"core_hero":[1040101,4030601],"suggest_hero":[1040101,4030601,4030501,4030401,3030501,4030801],"sort_level":[1,10]}`|
|5906|`{"type":59,"hero_position":[10231,10100],"core_hero":[1040101,2040201],"suggest_hero":[1040101,2040201,4030601,4030501,4030401,4030801],"sort_level":[1,10]}`|
|5907|`{"type":59,"hero_position":[10231,10100],"core_hero":[5040201,4040301],"suggest_hero":[5040201,4040301,4030601,4030501,4030401,4030801],"sort_level":[1,10]}`|
|6001|`{"type":60,"hero_position":[10231,10226],"core_hero":[1040201,2040101],"suggest_hero":[1040201,2040101,3040101,4040301,4040201,1040101],"sort_level":[1,11]}`|
|6002|`{"type":60,"hero_position":[10231,10226],"core_hero":[3040201,1040201],"suggest_hero":[3040201,1040201,2040101,3040101,1040101,4040201],"sort_level":[1,11]}`|
|6003|`{"type":60,"hero_position":[10231,10226],"core_hero":[4040301,3040201],"suggest_hero":[4040301,3040201,1040201,2040101,3040101,4040201],"sort_level":[1,11]}`|
|6004|`{"type":60,"hero_position":[10231,10226],"core_hero":[3040201,1040201],"suggest_hero":[3040201,1040201,2040101,3040101,4040201,1040101],"sort_level":[1,11]}`|
|6005|`{"type":60,"hero_position":[10231,10226],"core_hero":[4040301,3040201],"suggest_hero":[4040301,3040201,1040201,2040101,3040101,4040201],"sort_level":[1,11]}`|
|6006|`{"type":60,"hero_position":[10231,10226],"core_hero":[1040301,3040201],"suggest_hero":[1040301,3040201,1040201,2040101,3040101,4040301],"sort_level":[1,11]}`|
|6101|`{"type":61,"hero_position":[10214,10215],"core_hero":[5040101,1040301],"suggest_hero":[5040101,1040301,5040201,1040201,1040101,1030601],"sort_level":[1,12]}`|
|6102|`{"type":61,"hero_position":[10214,10215],"core_hero":[5040301,5040101],"suggest_hero":[5040301,5040101,1040301,5040201,1040201,1040101],"sort_level":[1,12]}`|
|6103|`{"type":61,"hero_position":[10214,10215],"core_hero":[5040401,5040301],"suggest_hero":[5040401,5040301,5040101,1040301,5040201,1040101],"sort_level":[1,12]}`|
|6104|`{"type":61,"hero_position":[10214,10215],"core_hero":[5040501,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,1040301,5040201],"sort_level":[1,12]}`|
|6105|`{"type":61,"hero_position":[10214,10215],"core_hero":[5040601,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,5040601,5040201],"sort_level":[1,12]}`|
|6201|`{"type":62,"hero_position":[10226,10250],"core_hero":[5040101,2040101],"suggest_hero":[5040101,2040101,5040201,2030601,2030201,2030301],"sort_level":[1,14]}`|
|6202|`{"type":62,"hero_position":[10226,10250],"core_hero":[5040301,5040101],"suggest_hero":[5040301,5040101,2040101,5040201,2030601,2030301],"sort_level":[1,14]}`|
|6203|`{"type":62,"hero_position":[10226,10250],"core_hero":[5040401,5040301],"suggest_hero":[5040401,5040301,5040101,2040101,5040201,2030601],"sort_level":[1,14]}`|
|6204|`{"type":62,"hero_position":[10226,10250],"core_hero":[5040501,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,2040101,5040201],"sort_level":[1,14]}`|
|6205|`{"type":62,"hero_position":[10226,10250],"core_hero":[5040601,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,5040601,5040201],"sort_level":[1,14]}`|
|6301|`{"type":63,"hero_position":[10229,10247],"core_hero":[5040101,3040201],"suggest_hero":[5040101,3040201,5040201,3040101,3030701,3030601],"sort_level":[1,13]}`|
|6302|`{"type":63,"hero_position":[10229,10247],"core_hero":[5040301,5040101],"suggest_hero":[5040301,5040101,3040201,5040201,3040101,3030701],"sort_level":[1,13]}`|
|6303|`{"type":63,"hero_position":[10229,10247],"core_hero":[5040401,5040301],"suggest_hero":[5040401,5040301,5040101,3040201,5040201,3040101],"sort_level":[1,13]}`|
|6304|`{"type":63,"hero_position":[10229,10247],"core_hero":[5040501,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,3040201,5040201],"sort_level":[1,13]}`|
|6305|`{"type":63,"hero_position":[10229,10247],"core_hero":[5040601,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,5040601,5040201],"sort_level":[1,13]}`|
|6401|`{"type":64,"hero_position":[10231,10100],"core_hero":[5040101,4040301],"suggest_hero":[5040101,4040301,5040201,4040201,4030601,4030501],"sort_level":[1,15]}`|
|6402|`{"type":64,"hero_position":[10231,10100],"core_hero":[5040301,5040101],"suggest_hero":[5040301,5040101,4040301,5040201,4040201,4030601],"sort_level":[1,15]}`|
|6403|`{"type":64,"hero_position":[10231,10100],"core_hero":[5040401,5040301],"suggest_hero":[5040401,5040301,5040101,4040301,5040201,4040201],"sort_level":[1,15]}`|
|6404|`{"type":64,"hero_position":[10231,10100],"core_hero":[5040501,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,4040301,5040201],"sort_level":[1,15]}`|
|6405|`{"type":64,"hero_position":[10231,10100],"core_hero":[5040601,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,5040601,5040201],"sort_level":[1,15]}`|
|6501|`{"type":65,"hero_position":[10231,10226],"core_hero":[5040101,1040301],"suggest_hero":[5040101,1040301,4040301,5040201,3040101,3040201],"sort_level":[1,16]}`|
|6502|`{"type":65,"hero_position":[10231,10226],"core_hero":[5040301,5040101],"suggest_hero":[5040301,5040101,1040301,4040301,5040201,3040101],"sort_level":[1,16]}`|
|6503|`{"type":65,"hero_position":[10231,10226],"core_hero":[5040401,5040301],"suggest_hero":[5040401,5040301,5040101,1040301,2040101,5040201],"sort_level":[1,16]}`|
|6504|`{"type":65,"hero_position":[10231,10226],"core_hero":[5040501,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,5040201,1040301],"sort_level":[1,16]}`|
|6505|`{"type":65,"hero_position":[10231,10226],"core_hero":[5040601,5040301],"suggest_hero":[5040501,5040301,5040401,5040101,5040201,5040601],"sort_level":[1,16]}`|

## HandbookCampConstant

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|prefab|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|page_count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"page_count":6}`|
|2|`{"page_count":6}`|
|3|`{"page_count":6}`|
|4|`{"page_count":6}`|
|9|`{"page_count":3}`|

## HandbookConstant

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|bubble_tip_draw_count|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_count|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_tip_need_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|open_one_key|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|assert|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_count":0,"open_one_key":10,"award_item":0,"assert":61637800001}`|

## Handbook

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|48|本表行键；与其他表同值不自动代表同一对象。|
|likeValue|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3003000|`{"likeValue":0,"attr":[[202,30],[201,180],[209,18]]}`|
|3003001|`{"likeValue":0,"attr":[[202,45],[201,270],[209,27]]}`|
|3003002|`{"likeValue":0,"attr":[[202,60],[201,360],[209,36]]}`|
|3003003|`{"likeValue":0,"attr":[[202,80],[201,480],[209,48]]}`|
|3003004|`{"likeValue":0,"attr":[[202,105],[201,630],[209,63]]}`|
|3003005|`{"likeValue":0,"attr":[[202,165],[201,990],[209,99]]}`|
|3004005|`{"likeValue":0,"attr":[[202,225],[201,1350],[209,135]]}`|
|3005005|`{"likeValue":0,"attr":[[202,285],[201,1710],[209,171]]}`|
|3006006|`{"likeValue":0,"attr":[[202,345],[201,2070],[209,207]]}`|
|3006007|`{"likeValue":0,"attr":[[202,405],[201,2430],[209,243]]}`|
|3006008|`{"likeValue":0,"attr":[[202,465],[201,2790],[209,279]]}`|
|3006009|`{"likeValue":0,"attr":[[202,555],[201,3330],[209,333]]}`|
|3006010|`{"likeValue":0,"attr":[[202,645],[201,3870],[209,387]]}`|
|4004000|`{"likeValue":0,"attr":[[202,70],[201,420],[209,42]]}`|
|4004001|`{"likeValue":0,"attr":[[202,90],[201,540],[209,54]]}`|
|4004002|`{"likeValue":0,"attr":[[202,130],[201,780],[209,78]]}`|
|4004003|`{"likeValue":0,"attr":[[202,176],[201,1056],[209,105]]}`|
|4004004|`{"likeValue":0,"attr":[[202,210],[201,1260],[209,126]]}`|
|4004005|`{"likeValue":0,"attr":[[202,310],[201,1860],[209,186]]}`|
|4005005|`{"likeValue":0,"attr":[[202,390],[201,2340],[209,234]]}`|
|4006006|`{"likeValue":0,"attr":[[202,470],[201,2820],[209,282]]}`|
|4006007|`{"likeValue":0,"attr":[[202,550],[201,3300],[209,330]]}`|
|4006008|`{"likeValue":0,"attr":[[202,630],[201,3780],[209,378]]}`|
|4006009|`{"likeValue":0,"attr":[[202,750],[201,4500],[209,450]]}`|
|4006010|`{"likeValue":0,"attr":[[202,870],[201,5220],[209,522]]}`|
|5005000|`{"likeValue":0,"attr":[[202,175],[201,1050],[209,105]]}`|
|5005001|`{"likeValue":0,"attr":[[202,225],[201,1350],[209,135]]}`|
|5005002|`{"likeValue":0,"attr":[[202,325],[201,1950],[209,195]]}`|
|5005003|`{"likeValue":0,"attr":[[202,440],[201,2640],[209,264]]}`|
|5005004|`{"likeValue":0,"attr":[[202,550],[201,3300],[209,330]]}`|
|5005005|`{"likeValue":0,"attr":[[202,850],[201,5100],[209,510]]}`|
|5006006|`{"likeValue":0,"attr":[[202,1000],[201,6000],[209,600]]}`|
|5006007|`{"likeValue":0,"attr":[[202,1150],[201,6900],[209,690]]}`|
|5006008|`{"likeValue":0,"attr":[[202,1300],[201,7800],[209,780]]}`|
|5006009|`{"likeValue":0,"attr":[[202,1500],[201,9000],[209,900]]}`|
|5006010|`{"likeValue":0,"attr":[[202,1700],[201,10200],[209,1020]]}`|
|6006005|`{"likeValue":0,"attr":[[202,850],[201,5100],[209,510]]}`|
|6006006|`{"likeValue":0,"attr":[[202,1000],[201,6000],[209,600]]}`|
|6006007|`{"likeValue":0,"attr":[[202,1150],[201,6900],[209,690]]}`|
|6006008|`{"likeValue":0,"attr":[[202,1300],[201,7800],[209,780]]}`|
|6006009|`{"likeValue":0,"attr":[[202,1500],[201,9000],[209,900]]}`|
|6006010|`{"likeValue":0,"attr":[[202,1700],[201,10200],[209,1020]]}`|
|7007005|`{"likeValue":0,"attr":[[202,1150],[201,6900],[209,690]]}`|
|7007006|`{"likeValue":0,"attr":[[202,1300],[201,7800],[209,780]]}`|
|7007007|`{"likeValue":0,"attr":[[202,1500],[201,9000],[209,900]]}`|
|7007008|`{"likeValue":0,"attr":[[202,1700],[201,10200],[209,1020]]}`|
|7007009|`{"likeValue":0,"attr":[[202,1900],[201,11250],[209,1125]]}`|
|7007010|`{"likeValue":0,"attr":[[202,2100],[201,12360],[209,1236]]}`|

## HandbookLineUpEffect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|flying_star|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|flash|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"flying_star":"Effect_SourceStoneIntensifyForm_feiqiu.prefab"}`|
|2|`{"flying_star":"Effect_SourceStoneIntensifyForm_feiqiu.prefab"}`|
|3|`{"flying_star":"Effect_SourceStoneIntensifyForm_feiqiu.prefab"}`|
|4|`{"flying_star":"Effect_SourceStoneIntensifyForm_feiqiu.prefab"}`|
|9|`{"flying_star":"Effect_SourceStoneIntensifyForm_feiqiu.prefab"}`|

## HandbookPrefabConfig

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|group|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|layer_index|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|page_index|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|77|本表行键；与其他表同值不自动代表同一对象。|
|page|number|77|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"group":1}`|
|1010201|`{"group":1}`|
|1020101|`{"group":1}`|
|1020201|`{"group":1}`|
|1020301|`{"group":1}`|
|1020401|`{"group":1}`|
|1020501|`{"group":1}`|
|1020601|`{"group":1}`|
|1030101|`{"group":1}`|
|1030201|`{"group":1}`|
|1030301|`{"group":1}`|
|1030401|`{"group":1}`|
|1030501|`{"group":1}`|
|1030601|`{"group":1}`|
|1030701|`{"group":1}`|
|1040101|`{"group":1}`|
|1040201|`{"group":1}`|
|1040301|`{"group":1}`|
|2010101|`{"group":2}`|
|2010201|`{"group":2}`|
|2020101|`{"group":2}`|
|2020201|`{"group":2}`|
|2020301|`{"group":2}`|
|2020401|`{"group":2}`|
|2020501|`{"group":2}`|
|2020601|`{"group":2}`|
|2030101|`{"group":2}`|
|2030201|`{"group":2}`|
|2030301|`{"group":2}`|
|2030401|`{"group":2}`|
|2030501|`{"group":2}`|
|2030601|`{"group":2}`|
|2030701|`{"group":2}`|
|2040101|`{"group":2}`|
|2040201|`{"group":2}`|
|3010101|`{"group":3}`|
|3010201|`{"group":3}`|
|3010301|`{"group":3}`|
|3020101|`{"group":3}`|
|3020201|`{"group":3}`|
|3020301|`{"group":3}`|
|3020401|`{"group":3}`|
|3020501|`{"group":3}`|
|3030201|`{"group":3}`|
|3030301|`{"group":3}`|
|3030401|`{"group":3}`|
|3030501|`{"group":3}`|
|3030601|`{"group":3}`|
|3030701|`{"group":3}`|
|3040101|`{"group":3}`|
|3040201|`{"group":3}`|
|4010101|`{"group":4}`|
|4010201|`{"group":4}`|
|4010301|`{"group":4}`|
|4020101|`{"group":4}`|
|4020201|`{"group":4}`|
|4020301|`{"group":4}`|
|4020401|`{"group":4}`|
|4020501|`{"group":4}`|
|4030101|`{"group":4}`|
|4030201|`{"group":4}`|
|4030301|`{"group":4}`|
|4030401|`{"group":4}`|
|4030501|`{"group":4}`|
|4030601|`{"group":4}`|
|4030801|`{"group":4}`|
|4040101|`{"group":99}`|
|4040201|`{"group":4}`|
|4040301|`{"group":4}`|
|4040401|`{"group":4}`|
|5040101|`{"group":5}`|
|5040201|`{"group":5}`|
|5040301|`{"group":5}`|
|5040401|`{"group":5}`|
|5040501|`{"group":5}`|
|5040601|`{"group":5}`|
|5040701|`{"group":5}`|

## HandbookStylePos

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|79|本表行键；与其他表同值不自动代表同一对象。|
|ui_pos|array|79|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{}`|
|1010201|`{}`|
|1020101|`{}`|
|1020201|`{}`|
|1020301|`{}`|
|1020401|`{}`|
|1020501|`{}`|
|1020601|`{}`|
|1030101|`{}`|
|1030201|`{}`|
|1030301|`{}`|
|1030401|`{}`|
|1030501|`{}`|
|1030601|`{}`|
|1030701|`{}`|
|1040101|`{}`|
|1040201|`{}`|
|1040301|`{}`|
|2010101|`{}`|
|2010201|`{}`|
|2020101|`{}`|
|2020201|`{}`|
|2020301|`{}`|
|2020401|`{}`|
|2020501|`{}`|
|2020601|`{}`|
|2030101|`{}`|
|2030201|`{}`|
|2030301|`{}`|
|2030401|`{}`|
|2030501|`{}`|
|2030601|`{}`|
|2030701|`{}`|
|2040101|`{}`|
|2040201|`{}`|
|3010101|`{}`|
|3010201|`{}`|
|3010301|`{}`|
|3020101|`{}`|
|3020201|`{}`|
|3020301|`{}`|
|3020401|`{}`|
|3020501|`{}`|
|3030201|`{}`|
|3030301|`{}`|
|3030401|`{}`|
|3030501|`{}`|
|3030601|`{}`|
|3030701|`{}`|
|3040101|`{}`|
|3040201|`{}`|
|4010101|`{}`|
|4010201|`{}`|
|4010301|`{}`|
|4020101|`{}`|
|4020201|`{}`|
|4020301|`{}`|
|4020401|`{}`|
|4020501|`{}`|
|4030101|`{}`|
|4030201|`{}`|
|4030301|`{}`|
|4030401|`{}`|
|4030501|`{}`|
|4030601|`{}`|
|4030801|`{}`|
|4040101|`{}`|
|4040201|`{}`|
|4040301|`{}`|
|4040401|`{}`|
|5040101|`{}`|
|5040201|`{}`|
|5040301|`{}`|
|5040401|`{}`|
|5040501|`{}`|
|5040601|`{}`|
|5040701|`{}`|
|102060101|`{}`|
|316040101|`{}`|
