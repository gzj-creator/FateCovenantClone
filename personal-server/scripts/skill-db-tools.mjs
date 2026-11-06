import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = path.resolve(__dirname, '../config/skill-database.json');
const LOCK_PATH = `${DB_PATH}.lock`;

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function withSkillDb(mutator, { timeoutMs = 120000, staleMs = 300000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let fd;
  while (true) {
    try {
      fd = fs.openSync(LOCK_PATH, 'wx');
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const st = fs.statSync(LOCK_PATH);
        if (Date.now() - st.mtimeMs > staleMs) {
          fs.unlinkSync(LOCK_PATH);
          continue;
        }
      } catch {}
      if (Date.now() > deadline) throw new Error('timed out waiting for skill database lock');
      sleepSync(100);
    }
  }

  try {
    fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
    fs.closeSync(fd);
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const result = mutator(db);
    const tmp = `${DB_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
    fs.renameSync(tmp, DB_PATH);
    return result;
  } finally {
    try { fs.unlinkSync(LOCK_PATH); } catch {}
  }
}

export function applyHeroPatch(patch) {
  if (!patch || typeof patch !== 'object') throw new Error('patch must be an object');
  const heroId = Number(patch.heroId);
  if (!Number.isInteger(heroId)) throw new Error('patch.heroId must be an integer');
  if (!Array.isArray(patch.skills) || patch.skills.length === 0) throw new Error('patch.skills must be a non-empty array');

  return withSkillDb((db) => {
    const hero = db.heroes.find(candidate => candidate.id === heroId);
    if (!hero) throw new Error(`hero ${heroId} not found`);
    const changed = [];
    for (const incoming of patch.skills) {
      const target = hero.skills.find(skill => skill.id === String(incoming.id));
      if (!incoming.implementation || typeof incoming.implementation !== 'object') {
        throw new Error(`skill ${incoming.id} is missing implementation`);
      }
      if (!target) {
        if (!incoming.name || !incoming.type) {
          throw new Error(`hero ${heroId} has no skill ${incoming.id}; adding it requires name and type`);
        }
        const created = {
          id: String(incoming.id),
          name: incoming.name,
          type: incoming.type,
          status: incoming.status || 'Executable',
          category: incoming.category || 'description-inferred',
          description: incoming.description || '',
          implementation: incoming.implementation,
        };
        const anchor = incoming.insertAfter && hero.skills.findIndex(skill => skill.id === String(incoming.insertAfter));
        if (anchor !== undefined && anchor >= 0) hero.skills.splice(anchor + 1, 0, created);
        else hero.skills.push(created);
        changed.push(`${created.id} (added)`);
        continue;
      }
      for (const key of ['name', 'description', 'category', 'status']) {
        if (incoming[key] !== undefined) target[key] = incoming[key];
      }
      target.implementation = incoming.implementation;
      changed.push(target.id);
    }
    return { heroId, name: hero.name, changed };
  });
}
