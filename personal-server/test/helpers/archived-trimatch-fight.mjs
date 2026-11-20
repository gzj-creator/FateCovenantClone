export function seedArchivedTriMatchFight(db, codec, { roleId, fightUid = 1, fightRow, now }) {
  const created = new Date(now).toISOString();
  db.prepare(`INSERT INTO trimatch_fight
    (role_id, fight_uid, fight_tid, fight_type, is_pve, lineup_type, board_tid, board_json, red_team_json,
      blue_team_json, atk_power, def_power, atk_role_id, def_role_id, result, attempt, round_id, phase_id,
      remaining_ms, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?, '[]', '[]', '[]', '1', '1', ?, 0, 1, 1, 1, 1, 0, 'running', ?, ?)`)
    .run(roleId, fightUid, fightRow.tid, fightRow.type, fightRow.lineup, fightRow.board, roleId, created, created);
  const actions = [{ actionType: 1, fightStart: { fightType: fightRow.type, fightTid: fightRow.tid } }];
  for (const [casterUid, skillTid, targetUid] of [[101, 4, 201], [102, 12, 201], [201, 4, 101], [202, 12, 101],
    [101, 5, 201], [102, 13, 201], [201, 5, 101], [202, 13, 101]]) {
    actions.push({ actionType: 5, skillStart: { casterUid, skillTid, targetUids: [targetUid], skillLevel: 1 } });
    actions.push({ actionType: 6, skillEnd: { casterUid, skillTid } });
  }
  actions.push({ actionType: 2, fightEnd: { fightResult: 1 } });
  const insert = db.prepare('INSERT INTO trimatch_fight_action VALUES (?, ?, ?, ?, ?)');
  return actions.map((action, index) => {
    const bytes = codec.pack('action', action);
    insert.run(roleId, fightUid, index + 1, action.actionType, bytes);
    return bytes.toString('base64');
  });
}
