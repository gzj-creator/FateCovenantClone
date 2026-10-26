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
import { createSprintService } from './sprint-service.mjs';
import { createItemBoxService } from './item-box-service.mjs';
import { createMissionFightService } from './mission-fight-service.mjs';
import { createActivityReadService } from './activity-read-service.mjs';
import { GameFrameDecoder, encodeGameFrame, isInitialVerifyPayload } from '../game-framing.mjs';
import { createServerHandshakeChallenge, LOCAL_AES_PROFILE } from '../game-handshake.mjs';

export { encodeEtf, decodeEtf, binary, revive, loadGameSchemas } from '../protocol/game-codec.mjs';
export function createLocalGame({ databasePath, statePath, capturePath, verifySession, sprintPreview = false, localWallet = false, logger = () => {} }) {
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
  const wallet=localWallet?createWalletService({store,codec,tables,publish,logger}):undefined;
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
    return encodeEtf([1, [Date.now(), 28800, 1], new E.OtpErlangList([...modules], false), false]);
  }
  const sockets = new Set();
  const server = net.createServer(socket => {
    if (sockets.size >= 8) { socket.destroy(); return; }
    sockets.add(socket);
    const id = crypto.randomUUID();
    const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
    let phase = 'verify', challenge, chain = Promise.resolve();
    const push=(type,data)=>{if(!socket.destroyed)socket.write(encodeGameFrame(pack('pb_s2c',{type,data})));};
    const log = event => logger({ connection: id, ...event });
    const fight = createMissionFightService({ store, codec, logger: log });
    socket.setNoDelay(true); socket.setTimeout(180000);
    socket.on('timeout', () => socket.destroy());
    socket.on('error', error => log({ event: 'socket_error', code: error.code }));
    socket.on('close', () => { subscribers.delete(push); sockets.delete(socket); log({ event: 'game_closed' }); });
    const send = (seq, data = Buffer.alloc(0), err) => socket.write(encodeGameFrame(pack('pb_s2c', { seq, ...(data.length ? { data } : {}), ...(err ? { err } : {}) })));
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
      if (type === -1) { send(0); return; }
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
      if (fight.supports(type)) {
        try {
          const result = fight.execute(type, request.data);
          if (result.data.length) send(seq, result.data); else send(seq);
          log({ event: 'fight_handled', type, seq, missionId: result.value?.mission?.mission_id });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'fight_rejected', type, seq, code, message: error.message });
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
      if(sprint.supports(type)||wallet&&type===16003){
        try{
          if(type===16003){const decoded=await decodeEtf(request.data);const value=decoded?.value??decoded;const bytes=Buffer.isBuffer(value)?value:Array.isArray(value)?Buffer.from(value):null;wallet.acknowledge(bytes?bytes.toString():value);send(seq);}
          else{const claim=unpack('pb_sprint_rank_task_receive_req',request.data);log({event:'sprint_claim_requested',actId:claim.act_id,taskIds:claim.task_tid_list});const result=await sprint.execute(claim);send(seq,result.data);}
          log({event:type===16003?'recharge_acknowledged':'sprint_reward_committed',type,seq});
        }catch(error){const code=error instanceof GameError?error.code:2;send(seq,Buffer.alloc(0),{err:code});log({event:'gameplay_rejected',type,seq,code,message:error.message});}
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
          send(seq, result.data); log({ event: 'hero_progression_committed', type, seq });
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
      const reads = new Map([[107703, ['pb_dragon_land_guild_data_rsp', {}]], [100601, ['pb_group_buy_act_server', {}]], [10507, ['pb_msg_range_list_with_role_info', {}]]]);
      if (reads.has(type)) { const [schema, object] = reads.get(type); send(seq, pack(schema, object)); return; }
      if ([53001, 102801, 10503].includes(type)) { send(seq); return; }
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
    root, loginPayload, store, wallet,
    listen(port = 19090) { return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server.address())); }); },
    close() { for (const socket of sockets) socket.destroy(); return new Promise(resolve => server.close(() => { store.close(); resolve(); })); }
  };
}
