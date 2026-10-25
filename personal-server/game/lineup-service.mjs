import { GameError } from './hero-progression.mjs';
const fail = (code, message) => { throw new GameError(code, message); };
function validateTeam(model, team) {
  if (!team || !Number.isInteger(team.team_id) || team.team_id < 1) fail(51558, 'Invalid team');
  const cells = new Set(), positions = new Set(), heroes = new Set();
  for (const fighter of team.fighter_list ?? []) {
    const uid = String(fighter.hero_id);
    if (!model.heroInfo.hero_list.some(hero => String(hero.uid) === uid)) fail(3001, 'Hero does not exist');
    if (!model.heroInfo.cell_list.some(cell => cell.index === fighter.index)) fail(3029, 'Hero cell does not exist');
    if (!Number.isInteger(fighter.loc) || fighter.loc < 1 || fighter.loc > 6) fail(51551, 'Invalid fighter position');
    if (positions.has(fighter.loc) || cells.has(fighter.index)) fail(51554, 'Duplicate position or cell');
    if (heroes.has(uid)) fail(51555, 'Duplicate hero');
    positions.add(fighter.loc); cells.add(fighter.index); heroes.add(uid);
  }
  if (heroes.size > 6) fail(51503, 'Too many fighters');
}
function syncHeroes(model) {
  const current = model.lineups.pre_lineups.find(pre => pre.index === (model.lineups.cur_pre_index || 1));
  if (!current) fail(51553, 'Current preset does not exist');
  const changed = [];
  for (const fighter of current.lineup.fighter_list ?? []) {
    const hero = model.heroInfo.hero_list.find(hero => String(hero.uid) === String(fighter.hero_id));
    const cell = model.heroInfo.cell_list.find(cell => cell.index === fighter.index);
    if (hero.level !== cell.level || (hero.breakthrough_level ?? 0) !== (cell.break_level ?? 0)) {
      hero.level = cell.level; hero.breakthrough_level = cell.break_level ?? 0; changed.push(hero);
    }
  }
  return changed;
}
export function createLineupService({ store, codec }) {
  return {
    supports: type => [208, 209, 218].includes(type),
    execute(type, input) {
      return store.transaction(model => {
        let schema, value;
        if (type === 208) {
          const entries = input.lineup_list ?? [], seen = new Set();
          if (!entries.length) fail(51556, 'Missing lineup');
          for (const entry of entries) {
            if (seen.has(entry.type)) fail(51552, 'Duplicate lineup type');
            seen.add(entry.type);
            const existing = model.playLineups.findIndex(lineup => lineup.type === entry.type);
            if (existing < 0) fail(51552, 'Unknown lineup type');
            const teams = new Set();
            for (const team of entry.team_list ?? []) { validateTeam(model, team); if (teams.has(team.team_id)) fail(51558, 'Duplicate team'); teams.add(team.team_id); }
            if (!teams.size) fail(51558, 'Missing lineup team');
            model.playLineups[existing] = structuredClone(entry);
          }
          schema = 'pb_edit_lineup_rsp'; value = { lineup_list: entries };
        } else if (type === 209 || type === 218) {
          let copy = [];
          if (type === 218) {
            if (input !== 0 && input !== 1) fail(1, 'Invalid lineup version');
            if ((model.lineups.version ?? 0) !== input) {
              const previous = model.lineups.pre_lineups;
              // A first switch initializes the alternate local layout from the saved team.
              model.lineups.pre_lineups = model.lineups.pre_lineups_standby?.length ? model.lineups.pre_lineups_standby : structuredClone(previous);
              model.lineups.pre_lineups_standby = previous;
              model.lineups.version = input;
              if (!model.lineups.pre_lineups.some(pre => pre.index === model.lineups.cur_pre_index)) model.lineups.cur_pre_index = model.lineups.pre_lineups[0].index;
            }
          } else {
            const entries = input.pre_lineup_list ?? [], seen = new Set();
            if (!entries.length) fail(51556, 'Missing preset');
            for (const entry of entries) {
              if (seen.has(entry.index)) fail(51553, 'Duplicate preset');
              seen.add(entry.index);
              const index = model.lineups.pre_lineups.findIndex(pre => pre.index === entry.index);
              if (index < 0) fail(51553, 'Unknown preset');
              validateTeam(model, entry.lineup);
              model.lineups.pre_lineups[index] = structuredClone(entry);
            }
            const current = model.lineups.pre_lineups.find(pre => pre.index === (model.lineups.cur_pre_index || 1));
            for (const handle of new Set(input.handle_types ?? [])) {
              if (String(handle) === '0') continue;
              const lineup = model.playLineups.find(lineup => String(lineup.type) === String(handle));
              if (!lineup) fail(51552, 'Unknown lineup copy target');
              lineup.team_list = [structuredClone(current.lineup)]; copy.push(lineup);
            }
          }
          const changed = syncHeroes(model);
          schema = 'pb_edit_pre_lineup_rsp'; value = { role_lineup: model.lineups, copy_lineup: copy, change_hero: changed };
        } else fail(1, 'Invalid lineup command');
        return { schema, value, data: codec.pack(schema, value) };
      });
    }
  };
}
