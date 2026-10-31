import { E, binary, encodeEtf, decodeEtf, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
const dayIndex = now => Math.floor((now/1000+10800)/86400);
export function createSprintService({ store, codec, tables, calendar, now = Date.now }) {
  async function execute(request) {
    const ids=request.task_tid_list;
    if(!Number.isSafeInteger(request.act_id)||!Array.isArray(ids)||!ids.length||ids.length>100||new Set(ids).size!==ids.length||ids.some(id=>!Number.isSafeInteger(id)))throw new GameError(1,'Invalid sprint claim');
    const state=store.state(), modules=new Map(state.modules.value), activity=codec.unpack('pb_act_login',rawBinary(modules.get(92)));
    const group=activity.act_parallel_list.find(group=>group.states_data.some(row=>row.act_id===request.act_id));
    const act=group?.states_data.find(row=>row.act_id===request.act_id);
    const running=calendar
      ? calendar.isActivityRunning(request.act_id,act,activity,Math.floor(now()/1000))
      : Boolean(group&&act?.cur_state_id===50&&!activity.act_pause_list.includes(request.act_id));
    if(!group||!running)throw new GameError(309,'Activity is not running');
    const tuple=await decodeEtf(Buffer.from(group.module_login_data,'base64'));
    if(!(tuple instanceof E.OtpErlangList)||tuple.value.length<2)throw new GameError(5,'Unsupported sprint login layout');
    const taskData=codec.unpack('pb_sprint_task_data',Buffer.from(tuple.value[1].value));
    const configs=ids.map(id=>tables.SprintRankTask.get(id));
    const sprint=tables.SprintType.get(configs[0]?.type);
    if(!sprint||sprint.activity!==request.act_id||configs.some(row=>!row||row.type!==sprint.tid))throw new GameError(1,'Task does not belong to this activity');
    const row=taskData.rank_task_list.find(row=>row.type_tid===request.act_id)??{type_tid:request.act_id,receive_data:'',day_tasks:[],day_scores:[]};
    const currentDay=dayIndex(now());
    const bits=Buffer.from(row.receive_data??'','base64');
    if(row.refresh_day!==currentDay)for(const cfg of tables.SprintRankTask.values())if(cfg.type===sprint.tid&&cfg.reset_type===1&&Math.floor(cfg.tid%1000/8)<bits.length)bits[Math.floor(cfg.tid%1000/8)]&=~(128>>(cfg.tid%8));
    const next=Buffer.alloc(Math.max(bits.length,Math.floor(Math.max(...ids.map(id=>id%1000))/8)+1));bits.copy(next);
    for(const cfg of configs)next[Math.floor(cfg.tid%1000/8)]|=128>>(cfg.tid%8);
    row.receive_data=next.toString('base64');row.refresh_day=currentDay;
    if(!taskData.rank_task_list.some(x=>x.type_tid===request.act_id))taskData.rank_task_list.push(row);
    tuple.value[1]=binary(codec.pack('pb_sprint_task_data',taskData));
    const encoded=await encodeEtf(tuple);
    const expectedModule=JSON.stringify(modules.get(92));
    group.module_login_data=encoded.toString('base64');
    const moduleBytes=serializedBinary(codec.pack('pb_act_login',activity));
    const result=store.transaction((model,db)=>{
      // The awaited ETF decode precedes the transaction; reject a concurrent activity rewrite.
      if(JSON.stringify(new Map(model.state.modules.value).get(92))!==expectedModule)throw new GameError(1,'Activity changed; retry claim');
      const awards=[];
      for(const cfg of configs){
        const task=tables.TaskType.get(cfg.task_type),period=cfg.reset_type===1?String(currentDay):'once';
        if(!task||![0,1].includes(cfg.reset_type))throw new GameError(5,'Unsupported task reset policy');
        if(db.prepare('SELECT 1 FROM activity_claims WHERE role_id=? AND act_id=? AND task_id=? AND period=?').get(model.state.roleId,request.act_id,cfg.tid,period)||(bits[Math.floor(cfg.tid%1000/8)]&(128>>(cfg.tid%8))))throw new GameError(310,'Reward already claimed');
        let progress;
        if(task.progress_type===2){
          const snapshots=new Map(model.state.modules.value).get(21).value;
          const data=snapshots[task.data-1];
          const statistics=data?codec.unpack('pb_count_statics_data',rawBinary(data)).list:[];
          const key=(task.stat_expand??[]).includes(1)?'1':String(cfg.task_param);
          const count=statistics.find(x=>x.id===key);
          if(cfg.reset_type===1){progress=count?.mod_day==currentDay?Number(count.count_list.at(-1)??0):0;}
          else progress=Number(count?.total??0);
        }else if(task.progress_fun===12)progress=model.role.level;
        else if([452,453,454,455].includes(task.progress_fun)){
          const hunter=task.progress_fun<454;
          const data=new Map(model.state.modules.value).get(hunter?121:150);
          const login=codec.unpack(hunter?'pb_hunter_arena_login':'pb_tournament_login',rawBinary(data));
          const base=hunter?login.hunter_arena:login.tournament?.base;
          const rank=[452,454].includes(task.progress_fun);
          const record=base?.[rank?'best_rank':'best_stage']?.find(x=>x.day_index===currentDay);
          // Match the client no-rank sentinel only after its explicit default is known.
          progress=record?Number(record.best_value):rank?9999:0;
        }else throw new GameError(5,'Task progress needs an additional gameplay handler');
        if(!Number.isFinite(progress)||(task.reverse?progress>cfg.task_count:progress<cfg.task_count))throw new GameError(311,'Task progress is insufficient');
        awards.push(...cfg.award);
        if(cfg.rank_score>0)awards.push([cfg.rank_score_item,cfg.rank_score]);
        db.prepare('INSERT INTO activity_claims VALUES (?,?,?,?,?)').run(model.state.roleId,request.act_id,cfg.tid,period,new Date(now()).toISOString());
      }
      const res=grantResources(model,awards,tables),value={task_data:row,res};
      const updatedModules=new Map(model.state.modules.value);updatedModules.set(92,moduleBytes);model.state.modules.value=[...updatedModules];
      return {value,data:codec.pack('pb_sprint_rank_task_receive_rsp',value)};
    });
    return result;
  }
  return { supports:type=>type===79104, execute };
}
