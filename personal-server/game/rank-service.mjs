import { GameError } from './hero-progression.mjs';

const SUPPORTED_TYPES = new Set([2000, 2001, 2002, 2005, 2006, 2007, 2008, 2009, 2010, 2011]);
const MAX_RANK_IDS = 100;
const MAX_BUBBLE_LENGTH = 56;

function invalid(message) {
  throw new GameError(1, message);
}

function listValue(value) {
  return Array.isArray(value) ? value : value?.value ?? value;
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) invalid(`Invalid ${label}`);
  return value;
}

function positivePair(request, labels) {
  if (!Array.isArray(request) || request.length !== 2) invalid(`Invalid ${labels[0]}/${labels[1]} request`);
  return request.map((value, index) => positiveInteger(value, labels[index]));
}

function rankIds(value, { allowEmpty = false } = {}) {
  const ids = listValue(value);
  if (!Array.isArray(ids) || ids.length > MAX_RANK_IDS || (!allowEmpty && ids.length === 0)) invalid('Invalid ranking list');
  for (const id of ids) positiveInteger(id, 'rank ID');
  return [...new Set(ids)];
}

function singleRankId(value) {
  const ids = rankIds(value);
  if (ids.length !== 1) invalid('Invalid ranking list');
  return ids[0];
}

function unrankedInfo(rankId, roleId) {
  return { id: String(roleId), rank_id: String(rankId), rank: 0, value: '0', extra: Buffer.alloc(0) };
}

export function createRankService({ codec, store }) {
  function bubbles() {
    const bubble = store?.read?.()?.state?.rankBubble;
    return bubble?.notice ? [{ id: String(bubble.id), notice: bubble.notice }] : [];
  }

  function emptyBoard(rankId, currentBubbles = bubbles()) {
    return {
      rank_id: String(rankId),
      self_rank: 0,
      self_value: '0',
      rank_list: [],
      extra: Buffer.alloc(0),
      bubbles: currentBubbles,
      total: '0'
    };
  }

  function packed(schema, value) {
    return { schema, value, data: codec.pack(schema, value) };
  }

  return {
    supports: type => SUPPORTED_TYPES.has(type),
    execute(type, input) {
      const request = listValue(input);
      if (type === 2000) {
        const rankId = singleRankId(request);
        return packed('rank_to_client', emptyBoard(rankId));
      }
      if (type === 2001) {
        const [rankId, roleId] = positivePair(request, ['rank ID', 'role ID']);
        return packed('rank_info', unrankedInfo(rankId, roleId));
      }
      if (type === 2002) {
        const [rankId] = positivePair(request, ['rank ID', 'top count']);
        return packed('rank_to_client', emptyBoard(rankId));
      }
      if (type === 2005) {
        positivePair(request, ['cross rank ID', 'rank ID']);
        return packed('pb_rank_cross_group_top', { top_list: [] });
      }
      if (type === 2006) {
        const [rankId] = rankIds(request);
        return packed('rank_to_client', emptyBoard(rankId));
      }
      if (type === 2007) {
        const [rankId, roleId] = positivePair(request, ['rank ID', 'role ID']);
        return packed('rank_info', unrankedInfo(rankId, roleId));
      }
      if (type === 2008) {
        const rankId = positiveInteger(request, 'rank ID');
        return packed('rank_to_client', emptyBoard(rankId));
      }
      if (type === 2009) {
        if (typeof request !== 'string') invalid('Invalid rank bubble');
        const notice = request.trim();
        if (!notice || Array.from(notice).length > MAX_BUBBLE_LENGTH) invalid('Invalid rank bubble');
        store?.transaction?.(model => {
          model.state.rankBubble = { id: String(model.state.roleId), notice };
        });
        return { schema: 'etf-fallback', value: { id: String(store?.read?.()?.state?.roleId ?? ''), notice }, data: Buffer.alloc(0) };
      }
      if (type === 2010) {
        if (!Array.isArray(request) || request.length !== 2) invalid('Invalid batch rank info request');
        const roleId = positiveInteger(request[0], 'role ID');
        const ids = rankIds(request[1]);
        return packed('pb_rev_rank', { id: String(roleId), infos: ids.map(rankId => unrankedInfo(rankId, roleId)) });
      }
      if (type === 2011) {
        const ids = rankIds(request, { allowEmpty: true });
        const currentBubbles = bubbles();
        return packed('rank_to_client_list', { client_list: ids.map(rankId => emptyBoard(rankId, currentBubbles)) });
      }
      invalid('Unsupported ranking command');
    }
  };
}
