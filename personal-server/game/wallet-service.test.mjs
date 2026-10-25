import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createGameCodec,rawBinary,decodeEtf} from '../protocol/game-codec.mjs';
import {createGameStore} from '../storage/game-store.mjs';
import {readGameTables} from '../config/game-tables.mjs';
import {createWalletService} from './wallet-service.mjs';
import {createSprintService} from './sprint-service.mjs';
import {createAdminService} from '../admin/server.mjs';
import {createSdkService} from '../sdk-service.mjs';
import {signSdkParameters} from '../sdk-signing.mjs';
const codec=createGameCodec(),tables=readGameTables();
const capture=JSON.parse(fs.readFileSync(new URL('../../analysis/captures/protocol-2026-10-25-r2a/decoded.local-only.json',import.meta.url)));
function setup(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fc-wallet-')),file=path.join(dir,'game.sqlite');
  const seed=()=>({version:1,roleId:100001,serverId:1,createdAt:1700000000,modules:structuredClone(capture.privateFlows.find(x=>x.messageId==='game:tcp-69:s2c:103').decoded[2]),rolePb:codec.pack('to_client_role_info',{level:9,nick_name:Buffer.from('Local Test')}).toString('base64'),guides:{},lineups:null});
  let store=createGameStore({databasePath:file,seed,codec});const pushes=[];
  const make=()=>createWalletService({store,codec,tables,publish:(type,data)=>pushes.push({type,data})});let wallet=make();
  t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});
  return{get store(){return store;},get wallet(){return wallet;},pushes,reopen(){store.close();store=createGameStore({databasePath:file,seed,codec});wallet=make();}};
}
test('wallet credits and purchases are atomic, idempotent and persistent, including new currency login',t=>{
  const e=setup(t),credit={account_id:'local-1',amount_cents:10000,request_id:'credit-1',note:'test'};
  assert.equal(e.wallet.credit(credit).balance_cents,10000);assert.equal(e.wallet.credit(credit).duplicate,true);
  assert.throws(()=>e.wallet.credit({...credit,amount_cents:20000}));
  const product=tables.Recharge.get(11);assert.equal(product.price,600);
  const buy={product_id:11,request_id:'purchase-1'};const result=e.wallet.buy(buy);assert.equal(result.balance_cents,9400);assert.equal(e.wallet.buy(buy).order_id,result.order_id);assert.equal(e.pushes.length,1);
  const push=codec.unpack('res_recharge_success',e.pushes[0].data);assert.equal(push.recharge_id,11);assert.equal(push.res.changes[0].diff_num,'60');
  assert.equal(e.store.read().resources.get('101500').num,'60');const modules=new Map(e.store.state().modules.value);assert.equal(codec.unpack('pb_currency_data',rawBinary(modules.get(5))).res_list.find(x=>x.tid==='101500').num,'60');
  e.reopen();assert.equal(e.wallet.snapshot().accounts[0].balance_cents,9400);assert.equal(e.wallet.snapshot().orders.length,1);assert.equal(e.wallet.snapshot().totals.credited_cents,10000);
  const login=codec.unpack('res_recharge_login',rawBinary(new Map(e.store.state().modules.value).get(19)));assert.equal(login.total_amount,600);assert.equal(login.tmp_recharge_record.tmp_record_list[0].order_no,result.order_id);
  e.wallet.acknowledge(result.order_id);assert.equal(codec.unpack('res_recharge_login',rawBinary(new Map(e.store.state().modules.value).get(19))).tmp_recharge_record.tmp_record_list.length,0);
});
test('wallet rejects insufficient balance and rolls back database failures and encoding failures',t=>{
  const e=setup(t);assert.throws(()=>e.wallet.buy({product_id:11,request_id:'poor'}),x=>x.code===301);
  for(const cents of [-1,0,0.1,Number.MAX_SAFE_INTEGER])assert.throws(()=>e.wallet.credit({account_id:'local-1',amount_cents:cents,request_id:'bad'}));
  e.wallet.credit({account_id:'local-1',amount_cents:1000,request_id:'fund'});const initial=e.store.state();
  e.store.inspect(db=>db.exec("CREATE TRIGGER deny_order BEFORE INSERT ON recharge_orders BEGIN SELECT RAISE(ABORT,'deny'); END"));
  assert.throws(()=>e.wallet.buy({product_id:11,request_id:'blocked'}));assert.deepEqual(e.store.state(),initial);assert.equal(e.wallet.snapshot().accounts[0].balance_cents,1000);assert.equal(e.wallet.snapshot().orders.length,0);assert.equal(e.pushes.length,0);
  e.store.inspect(db=>db.exec('DROP TRIGGER deny_order'));
  const broken=createWalletService({store:e.store,tables,codec:{...codec,pack:(name,obj)=>{if(name==='res_recharge_success')throw Error('encode fail');return codec.pack(name,obj);}}});
  assert.throws(()=>broken.buy({product_id:11,request_id:'encode-fail'}));assert.deepEqual(e.store.state(),initial);assert.equal(e.wallet.snapshot().accounts[0].balance_cents,1000);
});
test('admin HTTP requires management key and same origin and persists fractional money as cents',async t=>{
  const e=setup(t),admin=createAdminService({wallet:e.wallet,token:'test-key'}),a=await admin.listen(0);t.after(()=>admin.close());const url='http://127.0.0.1:'+a.port;
  assert.equal((await fetch(url+'/')).status,200);assert.equal((await fetch(url+'/api/state')).status,401);
  const post=(data,origin=url)=>fetch(url+'/api/credit',{method:'POST',headers:{Authorization:'Bearer test-key','Content-Type':'application/json',Origin:origin},body:JSON.stringify(data)});
  const input={account_id:'local-1',amount_cents:123,request_id:'web-credit'};assert.equal((await post(input,'http://evil.test')).status,403);
  const r=await post(input);assert.equal(r.status,200);assert.equal((await r.json()).balance_cents,123);assert.equal((await(await post(input)).json()).duplicate,true);
});
test('sprint claim grants configured awards once, updates nested login bits and survives restart',async t=>{
  const e=setup(t),now=Date.now(),day=Math.floor((now/1000+10800)/86400);
  e.store.transaction(model=>{const modules=new Map(model.state.modules.value);const p=codec.unpack('pb_hunter_arena_login',rawBinary(modules.get(121)));p.hunter_arena.best_rank=[{day_index:day,best_value:96}];modules.set(121,{value:codec.pack('pb_hunter_arena_login',p).toJSON(),bits:8});model.state.modules.value=[...modules];});
  const service=createSprintService({store:e.store,codec,tables,now:()=>now});const req={act_id:13016,task_tid_list:[55001]};
  // 55001 belongs to sprint type 55, configured against its exact activity.
  const result=await service.execute(req);assert.equal(result.value.res.changes.find(x=>x.tid==='101500').diff_num,'20');
  const data=codec.unpack('pb_act_login',rawBinary(new Map(e.store.state().modules.value).get(92))),group=data.act_parallel_list.find(x=>x.states_data.some(s=>s.act_id===13016));
  const tuple=await decodeEtf(Buffer.from(group.module_login_data,'base64'));const tasks=codec.unpack('pb_sprint_task_data',Buffer.from(tuple.value[1].value));assert.ok(Buffer.from(tasks.rank_task_list.find(x=>x.type_tid===13016).receive_data,'base64')[0]&64);
  e.reopen();await assert.rejects(()=>createSprintService({store:e.store,codec,tables,now:()=>now}).execute(req),x=>x.code===310);
});

test('SDK balance payment authenticates signed local sessions and debits SQLite once',async t=>{
  const e=setup(t);let now=1790000000;
  const sdk=createSdkService({localTestOtp:true,appId:'test-sdk',appKey:'test-key',platform:{appId:'test-platform',appKey:'platform-key'},account:{loginCode:'local',passwordMd5:'a'.repeat(32),userId:'local-1'},nowSeconds:()=>now,sessionTtlSeconds:60});
  sdk.attachWallet(e.wallet);const address=await sdk.listen(0);t.after(()=>sdk.close());
  const post=async(route,fields,key='test-key',override={})=>{const form=new URLSearchParams({...fields,sign:signSdkParameters(fields,key),...override});const r=await fetch(address.url+route,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});return{status:r.status,body:await r.json()};};
  const input={appid:'test-sdk',userid:'local-1',server:'1',role_id:'100001',product_id:'11',cp_order:'sdk-order',amount:'6.00',extra_params:''};
  assert.equal((await post('/pay/recharge/order',input)).status,401);
  assert.equal((await post('/user/phoneLogin',{appid:'test-sdk',phone:'19900000000',verifyCode:'1234'})).status,200);
  assert.equal((await post('/pay/recharge/order',input,'test-key',{sign:'0'.repeat(32)})).status,401);
  assert.equal((await post('/pay/recharge/order',input)).body.rcode,301);
  e.wallet.credit({account_id:'local-1',amount_cents:5000,request_id:'sdk-credit'});
  for(const changed of [{amount:'0.06'},{product_id:'999999'},{role_id:'100002'},{userid:'other'},{server:'2'}])assert.notEqual((await post('/pay/recharge/order',{...input,...changed})).status,200);
  const first=await post('/pay/recharge/order',input);assert.equal(first.status,200);assert.equal(first.body.result.balance_cents,4400);
  const retry=await post('/pay/recharge/order',input);assert.equal(retry.body.result.order_no,first.body.result.order_no);assert.equal(e.pushes.length,1);
  const platform=await post('/pay/recharge/order',{...input,appid:'test-platform',cp_order:'platform-order'},'platform-key');assert.equal(platform.status,200);assert.equal(platform.body.result.balance_cents,3800);
  now+=61;assert.equal((await post('/pay/recharge/order',{...input,cp_order:'expired'})).status,401);
  e.reopen();assert.equal(e.wallet.snapshot().accounts[0].balance_cents,3800);assert.equal(e.wallet.snapshot().orders.length,2);
});

test('committed wallet purchase remains successful when immediate notification fails',t=>{
  const e=setup(t);e.wallet.credit({account_id:'local-1',amount_cents:1000,request_id:'fund'});
  const wallet=createWalletService({store:e.store,codec,tables,publish(){throw Error('client disconnected');}});
  const result=wallet.buy({product_id:11,request_id:'lost-push'});assert.equal(result.balance_cents,400);assert.equal(wallet.buy({product_id:11,request_id:'lost-push'}).duplicate,true);
  assert.equal(codec.unpack('res_recharge_login',rawBinary(new Map(e.store.state().modules.value).get(19))).tmp_recharge_record.tmp_record_list[0].order_no,result.order_id);
});

test('wallet logging failures cannot reject committed credits or purchases',t=>{
  const e=setup(t);
  const wallet=createWalletService({store:e.store,codec,tables,publish(){throw Error('disconnected');},logger(){throw Error('log write failed');}});
  assert.equal(wallet.credit({account_id:'local-1',amount_cents:1000,request_id:'logging-credit'}).balance_cents,1000);
  const result=wallet.buy({product_id:11,request_id:'logging-order'});
  assert.equal(result.balance_cents,400);
  assert.equal(wallet.buy({product_id:11,request_id:'logging-order'}).order_id,result.order_id);
  assert.equal(wallet.snapshot().orders.length,1);
  assert.equal(e.store.read().resources.get('101500').num,'60');
  wallet.acknowledge(result.order_id);
  e.reopen();
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents,400);
  assert.equal(e.wallet.snapshot().orders[0].acknowledged,1);
  assert.equal(codec.unpack('res_recharge_login',rawBinary(new Map(e.store.state().modules.value).get(19))).tmp_recharge_record.tmp_record_list.length,0);
});

test('sprint uses tournament evidence for tournament tasks and rolls back mixed ineligible claims',async t=>{
  const e=setup(t),now=Date.now(),day=Math.floor((now/1000+10800)/86400);
  e.store.transaction(model=>{const modules=new Map(model.state.modules.value);const p=codec.unpack('pb_tournament_login',rawBinary(modules.get(150)));p.tournament.base.best_rank=[{day_index:day,best_value:96}];modules.set(150,{value:codec.pack('pb_tournament_login',p).toJSON(),bits:8});model.state.modules.value=[...modules];});
  const service=createSprintService({store:e.store,codec,tables,now:()=>now}),initial=e.store.state();
  await assert.rejects(()=>service.execute({act_id:13016,task_tid_list:[55021,55024]}),x=>x.code===311);assert.deepEqual(e.store.state(),initial);
  await assert.rejects(()=>service.execute({act_id:13016,task_tid_list:[55001]}),x=>x.code===311);
  const result=await service.execute({act_id:13016,task_tid_list:[55021,55022,55023]});assert.equal(result.value.res.changes.find(x=>x.tid==='101500').diff_num,'60');
  assert.equal(e.store.inspect(db=>db.prepare('SELECT count(*) n FROM activity_claims').get().n),3);
});
