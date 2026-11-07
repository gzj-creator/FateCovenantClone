import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createCipheriv} from 'node:crypto';
import {createGameCodec,rawBinary,serializedBinary,decodeEtf} from '../protocol/game-codec.mjs';
import {createGameStore} from '../storage/game-store.mjs';
import {readGameTables} from '../config/game-tables.mjs';
import {createWalletService} from '../game/wallet-service.mjs';
import {GameError} from '../game/hero-progression.mjs';
import {grantResources} from '../game/resources.mjs';
import {createSprintService} from '../game/sprint-service.mjs';
import {createAdminService} from '../admin/server.mjs';
import {createSdkService} from '../sdk-service.mjs';
import {signSdkParameters} from '../sdk-signing.mjs';
import {signQuickSdk} from '../quick-sdk.mjs';
const codec=createGameCodec(),tables=readGameTables();
const capture=JSON.parse(fs.readFileSync(new URL('../fixtures/login-modules.seed.json',import.meta.url)));
function setup(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fc-wallet-')),file=path.join(dir,'game.sqlite');
  const seed=()=>({version:1,roleId:100001,serverId:1,createdAt:1700000000,modules:structuredClone(capture.privateFlows.find(x=>x.messageId==='game:tcp-69:s2c:103').decoded[2]),rolePb:codec.pack('to_client_role_info',{level:9,nick_name:Buffer.from('Local Test')}).toString('base64'),guides:{},lineups:null});
  let store=createGameStore({databasePath:file,seed,codec});const pushes=[];
  const make=()=>createWalletService({store,codec,tables,publish:(type,data)=>pushes.push({type,data})});let wallet=make();
  t.after(()=>{store.close();fs.rmSync(dir,{recursive:true,force:true});});
  return{get store(){return store;},get wallet(){return wallet;},pushes,reopen(){store.close();store=createGameStore({databasePath:file,seed,codec});wallet=make();}};
}
test('wallet credits and purchases are atomic, idempotent and persistent, including new currency login',async t=>{
  const e=setup(t),credit={account_id:'local-1',amount_cents:10000,request_id:'credit-1',note:'test'};
  assert.equal(e.wallet.credit(credit).balance_cents,10000);assert.equal(e.wallet.credit(credit).duplicate,true);
  assert.throws(()=>e.wallet.credit({...credit,amount_cents:20000}));
  const product=tables.Recharge.get(11);assert.equal(product.price,600);
  const buy={product_id:11,request_id:'purchase-1'};const result=e.wallet.buy(buy);assert.equal(result.balance_cents,9400);assert.equal(e.wallet.buy(buy).order_id,result.order_id);assert.equal(e.pushes.length,1);
  const push=codec.unpack('res_recharge_success',e.pushes[0].data);assert.equal(push.recharge_id,11);assert.equal(push.res.changes[0].diff_num,'60');
  const extraParams=await decodeEtf(Buffer.from(push.extra_params,'base64'));assert.equal(extraParams.value.length,1);assert.ok(Array.isArray(extraParams.value[0].value));assert.deepEqual(extraParams.value[0].value.slice(0,2),[false,0]);assert.ok(Number.isSafeInteger(extraParams.value[0].value[2]));
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
  const post=async(route,fields,key='test-key',override={})=>{const signed={...fields};if(route==='/pay/recharge/order'&&(signed.channel===undefined||signed.channel===''))signed.channel='null';const form=new URLSearchParams({...fields,sign:signSdkParameters(signed,key),...override});const r=await fetch(address.url+route,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});return{status:r.status,body:await r.json()};};
  const input={appid:'test-sdk',userid:'local-1',server:'1',role_id:'100001',product_id:'11',cp_order:'sdk-order',amount:'6.00',channel:'',extra_params:''};
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

test('QuickSDK order payment reports an exhausted gift limit instead of insufficient balance',async t=>{
  const e=setup(t),quickSdk={productCode:'fc-local',productKey:'fclocal1'},now=1790000000;
  const sdk=createSdkService({localTestOtp:true,appId:'test-sdk',appKey:'test-key',quickSdk,account:{loginCode:'local',passwordMd5:'a'.repeat(32),userId:'local-1'},nowSeconds:()=>now,sessionTtlSeconds:60});
  sdk.attachWallet(e.wallet);const address=await sdk.listen(0);t.after(()=>sdk.close());
  const post=async(route,fields)=>{const form=new URLSearchParams({...fields,sign:signSdkParameters(fields,'test-key')});const response=await fetch(address.url+route,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:form});return{status:response.status,body:await response.json()};};
  const login=await post('/user/phoneLogin',{appid:'test-sdk',phone:'19900000000',verifyCode:'1234'});assert.equal(login.status,200);
  e.wallet.credit({account_id:'local-1',amount_cents:1200,request_id:'quick-limit-fund'});
  const pay=async cpOrderId=>{
    const payment={uid:'local-1',token:login.body.result.token,goods_id:40010,cp_order_id:cpOrderId,price:12,amount:12,count:1,extras_params:JSON.stringify({goodsID:40010,productID:40010}),game_role_info:Buffer.from(JSON.stringify({server_id:'1',game_role_id:'100001'})).toString('base64')};
    const key=Buffer.from(quickSdk.productKey),cipher=createCipheriv('des-ede3',Buffer.concat([key,key,key]),null);
    const json_data=Buffer.concat([cipher.update(JSON.stringify(payment),'utf8'),cipher.final()]).toString('base64');
    const fields=new Map([['product_code',quickSdk.productCode],['json_data',json_data]]);
    const response=await fetch(address.url+'/v1/order/orderpay',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams([...fields,['sign',signQuickSdk(fields,quickSdk.productKey)]]).toString()});
    return{status:response.status,body:await response.json()};
  };
  assert.equal((await pay('quick-limit-first')).body.result,true);
  assert.equal(e.wallet.snapshot().accounts[0].balance_cents,0);
  const exhausted=await pay('quick-limit-repeat');
  assert.equal(exhausted.status,200);
  assert.deepEqual(exhausted.body,{result:false,error:{code:307,id:'80001',message:'该商品今日购买次数已用完'},data:{}});
  assert.equal(e.wallet.snapshot().orders.length,1);
});

test('wallet order confirms an existing QuickSDK order without buying or notifying twice',async t=>{
  const e=setup(t),now=1790000000;
  const sdk=createSdkService({localTestOtp:true,appId:'test-sdk',appKey:'test-key',platform:{appId:'test-platform',appKey:'platform-key'},account:{loginCode:'local',passwordMd5:'a'.repeat(32),userId:'local-1'},nowSeconds:()=>now,sessionTtlSeconds:60});
  sdk.attachWallet(e.wallet);const address=await sdk.listen(0);t.after(()=>sdk.close());
  const post=async(route,fields,key='test-key',override={})=>{const signed={...fields};if(route==='/pay/recharge/order'&&(signed.channel===undefined||signed.channel===''))signed.channel='null';const form=new URLSearchParams({...fields,sign:signSdkParameters(signed,key),...override});const r=await fetch(address.url+route,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});return{status:r.status,body:await r.json()};};
  await post('/user/phoneLogin',{appid:'test-sdk',phone:'19900000000',verifyCode:'1234'});
  e.wallet.credit({account_id:'local-1',amount_cents:5000,request_id:'confirm-credit'});
  const bought=e.wallet.buy({product_id:11,request_id:'quick-sdk-request'});
  const before={orders:e.wallet.snapshot().orders.length,balance:e.wallet.snapshot().accounts[0].balance_cents,pushes:e.pushes.length};
  const input={appid:'test-sdk',userid:'local-1',server:'1',role_id:'100001',product_id:'11',cp_order:bought.order_id,amount:'6.00',channel:'',game:'6',title:'test',recharge_source:'android',third_product_id:'0',extra_params:'',package:'com.jzyx.ps'};
  const confirmed=await post('/pay/recharge/order',input);
  assert.equal(confirmed.status,200);assert.equal(confirmed.body.result.order_no,bought.order_id);assert.equal(confirmed.body.result.balance_cents,before.balance);
  assert.equal(e.wallet.snapshot().orders.length,before.orders);assert.equal(e.wallet.snapshot().accounts[0].balance_cents,before.balance);assert.equal(e.pushes.length,before.pushes);
  const wrongProduct=await post('/pay/recharge/order',{...input,product_id:'40009',amount:'6.00',cp_order:bought.order_id});
  assert.equal(wrongProduct.status,400);
});

test('committed wallet purchase remains successful when immediate notification fails',t=>{
  const e=setup(t);e.wallet.credit({account_id:'local-1',amount_cents:1000,request_id:'fund'});
  const wallet=createWalletService({store:e.store,codec,tables,publish(){throw Error('client disconnected');}});
  const result=wallet.buy({product_id:11,request_id:'lost-push'});assert.equal(result.balance_cents,400);assert.equal(wallet.buy({product_id:11,request_id:'lost-push'}).duplicate,true);
  assert.equal(codec.unpack('res_recharge_login',rawBinary(new Map(e.store.state().modules.value).get(19))).tmp_recharge_record.tmp_record_list[0].order_no,result.order_id);
});

test('daily discount purchases publish and persist the refreshed protobuf with a next-day reset',async t=>{
  const e=setup(t);e.wallet.credit({account_id:'local-1',amount_cents:100000,request_id:'daily-fund'});
  const result=e.wallet.buy({product_id:40008,request_id:'daily-first'});assert.equal(result.balance_paid_cents,3000);
  const push=codec.unpack('res_recharge_success',e.pushes[0].data);
  const extraParams=await decodeEtf(Buffer.from(push.extra_params,'base64'));assert.equal(extraParams.value.length,1);assert.ok(Array.isArray(extraParams.value[0].value));assert.equal(extraParams.value[0].value[0],false);assert.equal(extraParams.value[0].value[1],0);assert.ok(Number.isSafeInteger(extraParams.value[0].value[2]));
  const extra=push.extra_ret_list.find(entry=>entry.flag===40);assert.ok(extra);
  const pushed=codec.unpack('pb_daily_discount_all',Buffer.from(extra.data,'base64'));
  assert.equal(pushed.daily_discount_list.find(row=>row.recharge_tid===4).buy_times,1);
  const persisted=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  assert.equal(persisted.daily_discount_list.find(row=>row.recharge_tid===4).buy_times,1);
  const additional=e.wallet.buy({product_id:40008,request_id:'daily-repeat',extra_buy:true});assert.equal(additional.daily_discount_additional,true);
  const additionalPush=codec.unpack('res_recharge_success',e.pushes[1].data);
  const additionalParams=await decodeEtf(Buffer.from(additionalPush.extra_params,'base64'));assert.equal(additionalParams.value[0].value[0],true);
  const additionalInfo=codec.unpack('pb_daily_discount_all',Buffer.from(additionalPush.extra_ret_list.find(entry=>entry.flag===40).data,'base64'));
  const additionalRow=additionalInfo.daily_discount_list.find(row=>row.recharge_tid===4);
  assert.equal(additionalRow.buy_times,1);assert.equal(additionalRow.buy_additionally,5);

  const purchasedAt=Math.floor(Date.parse(e.wallet.snapshot().orders[0].created_at)/1000);
  const nextDay=createWalletService({store:e.store,codec,tables,now:()=>purchasedAt+86400});
  const nextDayPurchase=nextDay.buy({product_id:40008,request_id:'daily-next-day'});assert.equal(nextDayPurchase.balance_paid_cents,3000);
  const refreshed=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  assert.equal(refreshed.daily_discount_list.find(row=>row.recharge_tid===4).buy_times,1);
});

test('daily discount batch purchase consumes every included offer and survives restart',t=>{
  const e=setup(t);e.wallet.credit({account_id:'local-1',amount_cents:10000,request_id:'daily-batch-fund'});
  const result=e.wallet.buy({product_id:46003,request_id:'daily-batch-first'});
  assert.equal(result.balance_paid_cents,900);
  const push=codec.unpack('res_recharge_success',e.pushes[0].data);
  assert.equal(push.res.changes.find(change=>change.tid==='101500').diff_num,'150');
  const pushed=codec.unpack('pb_daily_discount_all',Buffer.from(push.extra_ret_list.find(entry=>entry.flag===40).data,'base64'));
  const assertConsumed=info=>assert.deepEqual([6,2,5,1].map(tid=>info.daily_discount_list.find(row=>row.recharge_tid===tid)?.buy_times??0),[1,1,1,1]);
  assertConsumed(pushed);
  assertConsumed(codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108))));
  for(const [productId,requestId] of [[46003,'daily-batch-repeat'],[40009,'daily-batch-component-a'],[46002,'daily-batch-component-b']]) {
    assert.throws(()=>e.wallet.buy({product_id:productId,request_id:requestId}),error=>error.code===307);
  }
  assert.throws(()=>e.wallet.purchaseGift({product_id:40006,request_id:'daily-batch-free'}),error=>error.code===307);
  assert.equal(e.wallet.snapshot().orders.length,1);assert.equal(e.wallet.snapshot().accounts[0].balance_cents,9100);assert.equal(e.pushes.length,1);

  e.reopen();
  assertConsumed(codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108))));
  assert.throws(()=>e.wallet.buy({product_id:40009,request_id:'daily-batch-after-restart'}),error=>error.code===307);
  assert.equal(e.wallet.snapshot().orders.length,1);assert.equal(e.wallet.snapshot().accounts[0].balance_cents,9100);
});

test('daily discount repairs stale row refresh times without resetting current-day sold-out offers',t=>{
  const e=setup(t);e.wallet.credit({account_id:'local-1',amount_cents:10000,request_id:'stale-daily-fund'});
  e.wallet.buy({product_id:46003,request_id:'stale-daily-batch'});
  let info=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  const currentRefresh=Number(info.refresh_time);
  e.store.transaction(model=>{
    const modules=new Map(model.state.modules.value);
    const daily=codec.unpack('pb_daily_discount_all',rawBinary(modules.get(108)));
    for(const row of daily.daily_discount_list)row.refresh_time=1782533479;
    modules.set(108,serializedBinary(codec.pack('pb_daily_discount_all',daily)));
    model.state.modules.value=[...modules];
  });

  e.reopen();
  info=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  assert.equal(Number(info.refresh_time),currentRefresh);
  assert.ok(info.daily_discount_list.every(row=>Number(row.refresh_time)===currentRefresh));
  assert.deepEqual([6,2,3,4,5,1].map(tid=>info.daily_discount_list.find(row=>row.recharge_tid===tid)?.buy_times??0),[1,1,0,0,1,1]);

  assert.equal(e.wallet.buy({product_id:40010,request_id:'stale-daily-12'}).balance_paid_cents,1200);
  assert.equal(e.wallet.buy({product_id:40008,request_id:'stale-daily-30'}).balance_paid_cents,3000);
  assert.throws(()=>e.wallet.buy({product_id:40009,request_id:'stale-daily-6'}),error=>error.code===307);
});

test('daily discount batch offer is unavailable after one included component is sold',t=>{
  const e=setup(t);e.wallet.credit({account_id:'local-1',amount_cents:10000,request_id:'daily-component-fund'});
  e.wallet.buy({product_id:40009,request_id:'daily-component-first'});
  assert.throws(()=>e.wallet.buy({product_id:46003,request_id:'daily-component-bundle'}),error=>error.code===307);
  const info=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  assert.deepEqual([6,2,5,1].map(tid=>info.daily_discount_list.find(row=>row.recharge_tid===tid)?.buy_times??0),[0,1,0,0]);
  assert.equal(e.wallet.snapshot().orders.length,1);assert.equal(e.wallet.snapshot().accounts[0].balance_cents,9400);
});

test('free daily gift bought first remains part of the sold-out batch state without duplicate reward',t=>{
  const e=setup(t);
  const before=BigInt(e.store.read().resources.get('101500')?.num??0);
  e.wallet.purchaseGift({product_id:40006,request_id:'daily-free-first'});
  assert.equal(BigInt(e.store.read().resources.get('101500').num)-before,30n);
  e.wallet.credit({account_id:'local-1',amount_cents:1000,request_id:'daily-free-bundle-fund'});
  const bundle=e.wallet.buy({product_id:46003,request_id:'daily-free-bundle'});
  assert.equal(bundle.balance_cents,100);
  assert.equal(BigInt(e.store.read().resources.get('101500').num)-before,150n);
  const info=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  assert.deepEqual([6,2,5,1].map(tid=>info.daily_discount_list.find(row=>row.recharge_tid===tid)?.buy_times??0),[1,1,1,1]);
  assert.throws(()=>e.wallet.purchaseGift({product_id:40006,request_id:'daily-free-repeat'}),error=>error.code===307);
  e.reopen();
  const reopened=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  assert.deepEqual([6,2,5,1].map(tid=>reopened.daily_discount_list.find(row=>row.recharge_tid===tid)?.buy_times??0),[1,1,1,1]);
});

test('sold-out purchase limit wins over an empty wallet balance',t=>{
  const e=setup(t);
  e.wallet.credit({account_id:'local-1',amount_cents:1200,request_id:'limit-fund'});
  const first=e.wallet.buy({product_id:40010,request_id:'limit-first'});
  assert.equal(first.balance_cents,0);
  assert.throws(()=>e.wallet.buy({product_id:40010,request_id:'limit-repeat'}),error=>error.code===307);

  e.wallet.credit({account_id:'local-1',amount_cents:1500,request_id:'gift-fund'});
  const gift=e.wallet.purchaseGift({product_id:240003,request_id:'gift-first'});
  assert.equal(gift.balance_cents,0);
  assert.throws(()=>e.wallet.purchaseGift({product_id:240003,request_id:'gift-repeat'}),error=>error.code===307);
});

test('daily discount additional purchases are finite and survive restart',t=>{
  const e=setup(t);e.wallet.credit({account_id:'local-1',amount_cents:10000,request_id:'daily-extra-fund'});
  const results=[];
  for(let i=0;i<7;i++)results.push(e.wallet.buy({product_id:40009,request_id:'daily-extra-'+i,extra_buy:i>0}));
  assert.deepEqual(results.map(result=>result.daily_discount_additional),[false,true,true,true,true,true,true]);
  const info=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  const row=info.daily_discount_list.find(value=>value.recharge_tid===2);
  assert.equal(row.buy_times,1);assert.equal(row.buy_additionally ?? 0,0);
  assert.throws(()=>e.wallet.buy({product_id:40009,request_id:'daily-extra-exhausted',extra_buy:true}),error=>error.code===307);
  e.reopen();
  const reopened=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  const reopenedRow=reopened.daily_discount_list.find(value=>value.recharge_tid===2);
  assert.equal(reopenedRow.buy_times,1);assert.equal(reopenedRow.buy_additionally ?? 0,0);
  assert.equal(e.wallet.snapshot().orders.length,7);
});

test('daily discount purchase counts are rebuilt from orders on restart',t=>{
  const e=setup(t),now=Date.UTC(2026,9,28,12)/1000;
  e.store.transaction((model,db)=>{
    db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at,acknowledged) VALUES (?,?,?,?,?,?,?,?)')
      .run('daily-backfill','local-1','daily-backfill-request',40008,3000,'{"daily_discount_additional":false}',new Date(now*1000).toISOString(),1);
    db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at,acknowledged) VALUES (?,?,?,?,?,?,?,?)')
      .run('daily-backfill-extra','local-1','daily-backfill-extra-request',40008,3000,'{"daily_discount_additional":true}',new Date(now*1000).toISOString(),1);
    db.prepare('INSERT INTO recharge_orders(order_id,account_id,request_id,product_id,price_cents,payload_json,created_at,acknowledged) VALUES (?,?,?,?,?,?,?,?)')
      .run('daily-backfill-batch','local-1','daily-backfill-batch-request',46003,900,'{"daily_discount_additional":false}',new Date(now*1000).toISOString(),1);
  });
  createWalletService({store:e.store,codec,tables,now:()=>now});
  const info=codec.unpack('pb_daily_discount_all',rawBinary(new Map(e.store.state().modules.value).get(108)));
  assert.equal(info.daily_discount_list.find(row=>row.recharge_tid===4).buy_times,1);
  assert.deepEqual([6,2,5,1].map(tid=>info.daily_discount_list.find(row=>row.recharge_tid===tid)?.buy_times??0),[1,1,1,1]);
});

test('recharge records remain newest first without losing amounts or days that predate local orders',t=>{
  const e=setup(t);
  e.store.transaction(model=>{
    const modules=new Map(model.state.modules.value);
    const login=codec.unpack('res_recharge_login',rawBinary(modules.get(19)));
    login.total_amount=50000;
    login.recharge_record={recent_record:[
      {day_index:20760,recharge_ids:[11],amount:5000},
      {day_index:20762,recharge_ids:[5],amount:45000}
    ],total_day:12};
    login.max_record=structuredClone(login.recharge_record.recent_record[1]);
    modules.set(19,serializedBinary(codec.pack('res_recharge_login',login)));
    model.state.modules.value=[...modules];
  });
  e.reopen();
  const at=20764*86400-10800+3600;
  const wallet=createWalletService({store:e.store,codec,tables,now:()=>at});
  wallet.credit({account_id:'local-1',amount_cents:10000,request_id:'ledger-fund'});
  const buy={product_id:11,request_id:'ledger-cash-16004'};
  wallet.buy(buy);
  wallet.buy(buy);
  wallet.purchaseGift({product_id:40010,request_id:'ledger-cash-16005'});
  wallet.purchaseGift({product_id:40006,request_id:'ledger-free'});
  e.reopen();
  const login=codec.unpack('res_recharge_login',rawBinary(new Map(e.store.state().modules.value).get(19)));
  assert.equal(login.total_amount,51800);
  assert.equal(login.recharge_record.total_day,13);
  assert.deepEqual(login.recharge_record.recent_record.map(row=>row.day_index),[20764,20762,20760]);
  assert.deepEqual(login.recharge_record.recent_record.map(row=>row.recharge_ids),[[11,40010],[5],[11]]);
  assert.deepEqual(login.recharge_record.recent_record.map(row=>row.amount),[1800,45000,5000]);
  assert.equal(login.max_record.amount,45000);
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

test('sprint reads progress from the statistics slot configured by TaskType.data',async t=>{
  const e=setup(t),now=Date.now();
  const roleStatistics=[...tables.CountStatistics.values()].filter(row=>!row.custom_login&&Number(row.type)===0);
  const slot=roleStatistics.findIndex(row=>Number(row.tid)===37)+1;
  e.store.transaction(model=>{
    const modules=new Map(model.state.modules.value),module=modules.get(21);
    module.value[slot]=serializedBinary(codec.pack('pb_count_statics_data',{list:[{id:'1',total:10,mod_day:0,count_list:[]}]}));
    modules.set(21,module);model.state.modules.value=[...modules];
  });
  const service=createSprintService({store:e.store,codec,tables,now:()=>now});
  const result=await service.execute({act_id:13016,task_tid_list:[55011]});
  assert.equal(result.value.res.changes.find(change=>change.tid==='101500').diff_num,'20');
  assert.equal(e.store.inspect(db=>db.prepare('SELECT count(*) n FROM activity_claims').get().n),1);
});

test('wallet purchase completes when the WishTree rebate cycle is closed, skipping only the rebate entry',t=>{
  const e=setup(t),events=[],pushes=[];
  const wishTree={recordPurchase:()=>{throw new GameError(310,'Wish-tree rebate cycle is closed');},supportsProduct:id=>Number(id)===40009};
  const wallet=createWalletService({store:e.store,codec,tables,wishTree,logger:event=>events.push(event),publish:(type,data)=>pushes.push({type,data})});
  wallet.credit({account_id:'local-1',amount_cents:10000,request_id:'closed-cycle-fund'});
  // 40009 is the daily-discount wish-tree gift that fails the 16004 flow after 03:00.
  const bought=wallet.buy({product_id:40009,request_id:'closed-cycle-buy',day_index:20000});
  assert.equal(bought.balance_cents,9400);
  const orders=wallet.snapshot().orders;assert.equal(orders.length,1);assert.equal(orders[0].product_id,40009);
  const resources=e.store.read().resources;
  for(const tid of [122702,3002,101500])assert.ok(Number(resources.get(String(tid))?.num)>0,'reward '+tid+' not granted');
  const push=codec.unpack('res_recharge_success',pushes[0].data);
  assert.equal(push.recharge_id,40009);assert.equal(push.extra_ret_list.some(entry=>entry.flag===40),true);
  const skipped=events.filter(event=>event.event==='wish_tree_rebate_skipped');
  assert.deepEqual(skipped.map(event=>[event.product_id,event.code,event.reason]),[[40009,310,'Wish-tree rebate cycle is closed']]);
});

test('wallet gift purchase skips a closed WishTree cycle on the non-cash gift path too',t=>{
  const e=setup(t),events=[];
  const wishTree={recordPurchase:()=>{throw new GameError(310,'Wish-tree rebate cycle is closed');},supportsProduct:()=>true};
  const wallet=createWalletService({store:e.store,codec,tables,wishTree,logger:event=>events.push(event)});
  e.store.transaction(model=>grantResources(model,[[401500,5000]],tables));
  // 110001 is a pay_type 1 gift, so purchaseGift keeps its own WishTree call site.
  const gift=wallet.purchaseGift({product_id:110001,request_id:'closed-cycle-gift'});
  assert.equal(gift.product_id,110001);assert.ok(gift.order_id);
  const orders=wallet.snapshot().orders;assert.equal(orders.length,1);assert.equal(orders[0].product_id,110001);
  assert.ok(Number(e.store.read().resources.get('401500').num)<5000);
  assert.deepEqual(events.filter(event=>event.event==='wish_tree_rebate_skipped').map(event=>event.product_id),[110001]);
});

test('wallet purchase still fails when the WishTree ledger reports an error other than a closed cycle',t=>{
  const e=setup(t),pushes=[];
  const wishTree={recordPurchase:()=>{throw new GameError(311,'Wish-tree draw has not opened');},supportsProduct:()=>true};
  const wallet=createWalletService({store:e.store,codec,tables,wishTree,publish:(type,data)=>pushes.push({type,data})});
  wallet.credit({account_id:'local-1',amount_cents:10000,request_id:'propagate-fund'});
  const initial=e.store.state();
  assert.throws(()=>wallet.buy({product_id:40009,request_id:'propagate-buy',day_index:20000}),error=>error.code===311);
  assert.deepEqual(e.store.state(),initial);
  assert.equal(wallet.snapshot().orders.length,0);assert.equal(wallet.snapshot().accounts[0].balance_cents,10000);assert.equal(pushes.length,0);
});
