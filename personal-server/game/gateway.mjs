import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { E, encodeEtf, decodeEtf, binary, revive, rawBinary, createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createHeroProgression, GameError } from './hero-progression.mjs';
import { createLineupService } from './lineup-service.mjs';
import { createRankService } from './rank-service.mjs';
import { createFeatureService } from './feature-service.mjs';
import { readHeroTables } from '../config/hero-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { createWalletService } from './wallet-service.mjs';
import { createWelfareService } from './welfare-service.mjs';
import { createTaskService } from './task-service.mjs';
import { createSprintService } from './sprint-service.mjs';
import { createItemBoxService } from './item-box-service.mjs';
import { createMissionFightService } from './mission-fight-service.mjs';
import { createActivityReadService } from './activity-read-service.mjs';
import { createVoucherService } from './voucher-service.mjs';
import { createMailService } from './mail-service.mjs';
import { GameFrameDecoder, encodeGameFrame, isInitialVerifyPayload } from '../game-framing.mjs';
import { createServerHandshakeChallenge, LOCAL_AES_PROFILE } from '../game-handshake.mjs';

export { encodeEtf, decodeEtf, binary, revive, loadGameSchemas } from '../protocol/game-codec.mjs';
export function createLocalGame({ databasePath, statePath, capturePath, verifySession, sprintPreview = false, localWallet = false, missionFightPlayback = false, logger = () => {} }) {
  const codec = createGameCodec(), { root, pack, unpack } = codec;
  function seed() {
    const capture = JSON.parse(fs.readFileSync(capturePath));
    const template = capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103')?.decoded;
    if (!template || template[0] !== 1) throw new Error('Verified login structure missing');
    const modules = new Map(template[2].value);
    const role = unpack('to_client_role_info', rawBinary(modules.get(2)));
    role.nick_name = Buffer.from('Local Adventurer');
    role.res = { changes: [] };
    return { version: 1, roleId: 100001, serverId: 1, createdAt: Math.floor(Date.now() / 1000) - 86400,
      seedSource: 'offline captured early-game structural fixture; independent local test save',
      modules: template[2], rolePb: pack('to_client_role_info', role).toString('base64'), guides: {}, lineups: null };
  }
  const store = createGameStore({ databasePath: databasePath ?? path.join(path.dirname(statePath), 'game.local-only.sqlite'), legacyStatePath: statePath, seed, codec });
  const progression = createHeroProgression({ store, codec, tables: readHeroTables() });
  const lineups = createLineupService({ store, codec });
  const ranks = createRankService({ codec });
  const features = createFeatureService({ store, codec, sprintPreview });
  const tables=readGameTables(), subscribers=new Set();
  const publish=(type,data)=>{for(const send of subscribers){try{send(type,data);}catch{logger({event:'wallet_subscriber_disconnected'});}}};
  const voucher=localWallet?createVoucherService({store,tables,logger}):undefined;
  const mail=voucher?createMailService({store,codec,tables,voucher,publish,logger}):undefined;
  const wallet=localWallet?createWalletService({store,codec,tables,voucher,publish,logger}):undefined;
  const welfare=createWelfareService({store,codec,tables,wallet,logger});
  const tasks=createTaskService({store,codec,tables,logger});
  const sprint=createSprintService({store,codec,tables});
  const itemBox=createItemBoxService({store,codec,tables,logger});
  const activityRead=createActivityReadService({codec,logger});
  async function loginPayload() {
    const state = store.state();
    const list = revive(state.modules);
    const modules = new Map(list.value);
    const now = Math.floor(Date.now() / 1000);
    const loginTime = pack('pb_login_time', { last_login: now, last_logout: now - 1, day_count: 1, create_time: state.createdAt, online_time: 0 });
    modules.set(1, [binary('local-sqlite-v1'), state.roleId, binary(loginTime), state.serverId, state.createdAt, binary('Local Server'), binary(''), 0]);
    modules.set(2, binary(Buffer.from(state.rolePb, 'base64')));
    // Cross-server membership is deliberately empty in this single local server.
    modules.set(63, binary(pack('pb_cross_login', { cross_infos: [], role_info: pack('pb_cross_role', {}) })));
    if (state.lineups) modules.set(9, binary(Buffer.from(state.lineups, 'base64')));
    if (mail) modules.set(93, binary(mail.loginPayload(state.roleId)));
    return encodeEtf([1, [Date.now(), 28800, 1], new E.OtpErlangList([...modules], false), false]);
  }
  async function mailArgument(data) {
    const decoded = await decodeEtf(data);
    const value = decoded?.value ?? decoded;
    if (Array.isArray(value)) {
      if (value.length === 1 && (typeof value[0] === 'number' || typeof value[0] === 'string')) return value[0];
      return value.map(item => typeof item === 'object' && item !== null ? item.mailid ?? item.mail_id ?? item.id : item);
    }
    if (typeof value === 'number' || typeof value === 'string') return value;
    if (value && typeof value === 'object') return value.mailid ?? value.mail_id ?? value.id;
    throw new GameError(1, 'Invalid mail command payload');
  }
  async function singleIdArgument(data, message) {
    const decoded = await decodeEtf(data);
    const value = decoded?.value ?? decoded;
    const candidate = Array.isArray(value) ? value.length === 1 ? value[0] : undefined : value;
    const id = Number(candidate);
    if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, message);
    return id;
  }
  const storyMissionArgument = data => singleIdArgument(data, 'Invalid story mission payload');
  const sockets = new Set();
  const wireDumpDirectory = process.env.FATE_COVENANT_WIRE_DUMP_DIR;
  const server = net.createServer(socket => {
    if (sockets.size >= 8) { socket.destroy(); return; }
    sockets.add(socket);
    const id = crypto.randomUUID();
    const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
    let phase = 'verify', challenge, chain = Promise.resolve();
    const push=(type,data)=>{if(!socket.destroyed)socket.write(encodeGameFrame(pack('pb_s2c',{type,data})));};
    const log = event => logger({ connection: id, ...event });
    const fight = createMissionFightService({ store, codec, logger: log, playbackEnabled: missionFightPlayback });
    socket.setNoDelay(true); socket.setTimeout(180000);
    socket.on('timeout', () => socket.destroy());
    socket.on('error', error => log({ event: 'socket_error', code: error.code }));
    socket.on('close', () => { subscribers.delete(push); sockets.delete(socket); log({ event: 'game_closed' }); });
    const send = (seq, data = Buffer.alloc(0), err) => {
      const payload = pack('pb_s2c', { seq, ...(data.length ? { data } : {}), ...(err ? { err } : {}) });
      const frame = encodeGameFrame(payload);
      const diagnostics = {
        event: 's2c_frame_sent',
        seq,
        errCode: err?.err,
        payloadBytes: payload.length,
        frameBytes: frame.length,
        header: frame.subarray(0, 4).toString('hex'),
        frameSha256: crypto.createHash('sha256').update(frame).digest('hex')
      };
      if (wireDumpDirectory && payload.length >= 1024) {
        fs.mkdirSync(wireDumpDirectory, { recursive: true });
        const filename = 's2c-' + String(seq) + '-' + Date.now() + '-' + diagnostics.frameSha256.slice(0, 12) + '.bin';
        fs.writeFileSync(path.join(wireDumpDirectory, filename), frame, { mode: 0o600 });
        diagnostics.dumpFile = filename;
      }
      log(diagnostics);
      return socket.write(frame);
    };
    async function handle(payload) {
      if (phase === 'verify') {
        if (!isInitialVerifyPayload(payload, Buffer.from('verify'))) throw new Error('Invalid verify');
        challenge = createServerHandshakeChallenge({ profile: LOCAL_AES_PROFILE, flags: { encryptC2S: false, encryptS2C: false, signature: false }, expectedApplicationVersion: '1.55.090365' });
        socket.write(encodeGameFrame(challenge.payload)); phase = 'reply'; log({ event: 'challenge_sent' }); return;
      }
      if (phase === 'reply') {
        if (!challenge.verifyReply(payload).ok) throw new Error('Invalid handshake');
        phase = 'login'; log({ event: 'handshake_accepted' }); return;
      }
      const request = root.lookupType('pb_c2s').decode(payload);
      const { type, seq } = request;
      log({ event: 'command', type, seq, bytes: request.data?.length ?? 0 });
      // Heartbeat is one-way. A zero-length S2C frame leaves the client's
      // TcpConnectionWorker receive stream at offset 4 and corrupts the next frame.
      if (type === -1) return;
      if (type === 909103) {
        const state = store.state();
        const login = root.lookupType('login').decode(request.data);
        if (login.server_id !== state.serverId || !verifySession(login.channel_uid, login.verify_code)) {
          log({ event: 'login_rejected', serverMatches: login.server_id === state.serverId, credentialFields: { uidLength: login.channel_uid.length, codeLength: login.verify_code.length, extraLength: login.channel_extra.length } });
          send(seq, Buffer.alloc(0), { err: -1, stacktrace: 'Local SDK session required' }); return;
        }
        send(seq, await loginPayload()); phase = 'ready'; subscribers.add(push); log({ event: 'login_sent', moduleCount: state.modules.value.length, roleId: state.roleId }); return;
      }
      if (phase !== 'ready') throw new Error('Login required');
      if (mail && mail.supports(type)) {
        try {
          let result;
          if (type === 3000 || type === 3001 || type === 3002) {
            let ids = [];
            if (request.data?.length) {
              const value = await mailArgument(request.data);
              ids = Array.isArray(value) ? value : value === undefined ? [] : [value];
            }
            result = type === 3000 ? mail.deleteOneKey(ids) : type === 3001 ? mail.readOneKey(ids) : mail.claimOneKey(ids);
          } else {
            const mailId = await mailArgument(request.data);
            result = type === 3003 ? mail.read(mailId) : type === 3004 ? mail.claim(mailId) : type === 3005 ? mail.delete(mailId) : mail.detail(mailId);
          }
          if (Buffer.isBuffer(result)) send(seq, result);
          else send(seq, result?.data ?? Buffer.alloc(0));
          log({ event: 'mail_command_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'mail_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (itemBox.supports(type)) {
        try {
          let entries;
          if (type === 159) entries = unpack('pb_one_key_use', request.data).use;
          else if (type === 157) {
            const batch = unpack('pb_batch_use_box_req', request.data);
            if ((batch.lottery_list ?? []).length) throw new GameError(5, 'Lottery box list is not implemented');
            entries = batch.box_list;
          } else entries = [unpack('simple_use', request.data)];
          const result = itemBox.open(entries);
          send(seq, result.data); log({ event: 'item_box_committed', type, seq, changes: result.value.changes.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'item_box_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 508) {
        try {
          const sectionTid = await storyMissionArgument(request.data);
          const result = fight.passStory(sectionTid);
          send(seq, result.data);
          log({ event: 'story_mission_passed', type, seq, sectionTid, previousMissionId: result.value.previousMissionId, missionId: result.value.mission.mission_id });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'story_mission_rejected', type, seq, code, message: error.message, payloadHead: (request.data ?? Buffer.alloc(0)).subarray(0, 64).toString('base64') });
        }
        return;
      }
      if (fight.supports(type)) {
        try {
          const result = await fight.execute(type, request.data);
          if (result.data.length) send(seq, result.data); else send(seq);
          log({ event: 'fight_handled', type, seq, missionId: result.value?.mission?.mission_id });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'fight_rejected', type, seq, code, message: error.message, payloadHead: (request.data ?? Buffer.alloc(0)).subarray(0, 64).toString('base64') });
        }
        return;
      }
      if (tasks.supports(type)) {
        try {
          const taskId = await singleIdArgument(request.data, 'Invalid linear task payload');
          const result = tasks.execute(type, taskId);
          send(seq, result.data);
          log({ event: 'linear_task_committed', type, seq, taskId, changes: result.value.res_change.changes.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'linear_task_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (activityRead.supports(type)) {
        try {
          const result = activityRead.execute(type, request.data);
          send(seq, result.data); log({ event: 'activity_read_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'activity_read_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (welfare.supports(type)) {
        try {
          const result = await welfare.execute(type, request.data, { connection: id, seq });
          send(seq, result.data);
          log({ event: 'welfare_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'welfare_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if(sprint.supports(type)||wallet&&type===16003){
        try{
          if(type===16003){const decoded=await decodeEtf(request.data);const value=decoded?.value??decoded;const bytes=Buffer.isBuffer(value)?value:Array.isArray(value)?Buffer.from(value):null;wallet.acknowledge(bytes?bytes.toString():value);send(seq);}
          else{const claim=unpack('pb_sprint_rank_task_receive_req',request.data);log({event:'sprint_claim_requested',actId:claim.act_id,taskIds:claim.task_tid_list});const result=await sprint.execute(claim);send(seq,result.data);}
          log({event:type===16003?'recharge_acknowledged':'sprint_reward_committed',type,seq});
        }catch(error){const code=error instanceof GameError?error.code:2;send(seq,Buffer.alloc(0),{err:code});log({event:'gameplay_rejected',type,seq,code,message:error.message});}
        return;
      }
      if (wallet && type === 16004) {
        let productId;
        try {
          const decoded = await decodeEtf(request.data);
          const value = decoded?.value ?? decoded;
          const args = Array.isArray(value) ? value : [value];
          if (args.length < 3) throw new GameError(1, 'Invalid voucher recharge payload');
          productId = Number(args[0]);
          const itemTid = Number(args[2]);
          const order = wallet.buy({ account_id: wallet.accountId, product_id: productId, request_id: 'native:' + id + ':' + seq, voucher_item_tid: itemTid });
          send(seq);
          log({ event: 'voucher_recharge_committed', type, seq, productId, itemTid, orderId: order.order_id, voucherQuantity: order.voucher_quantity });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          // The client renders every 16004 error as a generic server-fault popup.
          // A repeat purchase is a no-op, so acknowledge it instead of alarming the player.
          if (code === 307) {
            send(seq);
            log({ event: 'voucher_recharge_already_owned', type, seq, productId, message: error.message });
            return;
          }
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'voucher_recharge_rejected', type, seq, code, message: error.message, payloadHead: (request.data ?? Buffer.alloc(0)).subarray(0, 160).toString('base64') });
        }
        return;
      }
      if (features.supports(type)) {
        try {
          const result = features.execute(type, await decodeEtf(request.data));
          send(seq, result.data); log({ event: 'feature_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code }); log({ event: 'feature_rejected', type, seq, code });
        }
        return;
      }
      if (ranks.supports(type)) {
        try {
          const result = ranks.execute(type, await decodeEtf(request.data));
          send(seq, result.data); log({ event: 'rank_sent', type, seq, boardCount: result.value.client_list?.length ?? 1 });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code }); log({ event: 'rank_rejected', type, seq, code });
        }
        return;
      }
      if (lineups.supports(type)) {
        try {
          const input = type === 218 ? await decodeEtf(request.data) : unpack(type === 208 ? 'pb_edit_lineup_req' : 'pb_edit_pre_lineup_req', request.data);
          const result = lineups.execute(type, input);
          send(seq, result.data); log({ event: 'lineup_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'lineup_rejected', type, seq, code, errorName: error.name });
        }
        return;
      }
      if (progression.supports(type)) {
        try {
          const input = type === 636 ? unpack('pb_hero_up_lv_req', request.data) : await decodeEtf(request.data);
          const result = progression.execute(type, input?.value ?? input);
          send(seq, result.data);
          const diagnostics = type === 636 ? {
            heroUid: String(input.hero_uid),
            cellIndex: input.cell_index,
            upLvCount: input.up_lv_count,
            newLv: result.value.new_lv,
            changedHeroes: result.value.change_hero_list.map(hero => ({ uid: String(hero.uid), level: hero.level })),
            responseBytes: result.data.length,
            responseSha256: crypto.createHash('sha256').update(result.data).digest('hex')
          } : {};
          log({ event: 'hero_progression_committed', type, seq, ...diagnostics });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_progression_rejected', type, seq, code, errorName: error.name });
        }
        return;
      }
      if (type === 8000) {
        const requestData = unpack('pb_req_save_process', request.data);
        store.transaction(model => { for (const process of requestData.req_list ?? []) model.state.guides[process.key_id] = process.process_id; });
        // Return the evidenced response schema, with the requested process records.
        const responseType = root.lookupType('pb_req_save_process_back');
        send(seq, pack(responseType.name, { process_list: requestData.req_list })); return;
      }
      if (type === 1202) {
        // Hall entry asks for shop ids. Answer the requested ids with empty local groups; local shop
        // purchases stay unimplemented instead of inventing goods or prices.
        let shopIds = [];
        try {
          const decoded = await decodeEtf(request.data);
          const value = decoded?.value ?? decoded;
          if (Array.isArray(value)) shopIds = value.filter(id => Number.isSafeInteger(id) && id > 0).slice(0, 32);
        } catch {}
        const shops = shopIds.map(id => ({ id, version: 0, items_groups: [] }));
        send(seq, pack('pb_query_shops_back', { shops }));
        log({ event: 'shop_info_sent', type, seq, shopCount: shops.length }); return;
      }
      if (type === 85901) {
        try {
          const actives = unpack('pb_recommend_gift_active_req', request.data).actives ?? [];
          // buy_times drives the client's remaining-purchase badge. Mirror the
          // same recharge_orders count that wallet purchase limits enforce.
          const buyCounts = store.inspect(db => new Map(db.prepare('SELECT product_id, count(*) AS n FROM recharge_orders GROUP BY product_id').all().map(row => [Number(row.product_id), Number(row.n)])));
          const gift_list = actives.map(active => ({
            act_tid: active.act_tid,
            buy_list: (active.gift_id ?? []).map(rechargeTid => ({ recharge_tid: rechargeTid, buy_times: buyCounts.get(Number(rechargeTid)) ?? 0 }))
          }));
          send(seq, pack('pb_recommend_gift_active_rsp', { gift_list }));
          log({ event: 'recommend_gift_active_sent', type, seq, giftCount: gift_list.length, buyCount: gift_list.reduce((sum, gift) => sum + gift.buy_list.length, 0), boughtCount: gift_list.reduce((sum, gift) => sum + gift.buy_list.filter(buy => buy.buy_times > 0).length, 0) });
        } catch (error) {
          send(seq, Buffer.alloc(0), { err: 1 });
          log({ event: 'recommend_gift_active_rejected', type, seq, message: error.message });
        }
        return;
      }
      const reads = new Map([[107703, ['pb_dragon_land_guild_data_rsp', {}]], [100601, ['pb_group_buy_act_server', {}]], [10507, ['pb_msg_range_list_with_role_info', {}]]]);
      if (reads.has(type)) { const [schema, object] = reads.get(type); send(seq, pack(schema, object)); return; }
      if ([108, 53001, 53002, 102801, 10503].includes(type)) {
        // Activity state/stage sync (53001/53002) uses an empty change_list meaning no server-side
        // stage transition for this local account; real stage advancement stays unimplemented.
        // 108 (req_remove_operate_display) is a UI-only acknowledgement after a purchase.
        send(seq);
        if (type === 53001 || type === 53002) log({ event: 'activity_stage_sync_acknowledged', type, seq });
        if (type === 108) log({ event: 'operate_display_removed', type, seq });
        return;
      }
      log({ event: 'unsupported_command', type, seq, payloadHead: (request.data ?? Buffer.alloc(0)).subarray(0, 64).toString('base64') });
      send(seq, Buffer.alloc(0), { err: -1, stacktrace: 'LOCAL_NOT_IMPLEMENTED:' + type });
    }
    socket.on('data', chunk => {
      try { for (const payload of decoder.push(chunk)) chain = chain.then(() => handle(payload)); }
      catch (error) { socket.destroy(); log({ event: 'frame_error', message: error.message }); }
      chain = chain.catch(error => { log({ event: 'handler_error', message: error.message }); socket.destroy(); });
    });
    log({ event: 'game_connected' });
  });
  return {
    root, loginPayload, store, wallet, mail, voucher,
    listen(port = 19090) { return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server.address())); }); },
    close() { for (const socket of sockets) socket.destroy(); return new Promise(resolve => server.close(() => { store.close(); resolve(); })); }
  };
}
