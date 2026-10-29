import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(toolRoot, '..');
const input = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(projectRoot, 'unity/FateCovenantClone/Assets/Resources/CharacterSkillCatalog.json');
const output = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(projectRoot, 'docs/character-skill-catalog.md');
const raw = fs.readFileSync(input);
const catalog = JSON.parse(raw.toString('utf8'));
const characters = catalog.characters.filter(character => character.catalogVisible);

function text(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function statusTone(status) {
  if (status === 'DescriptionHeuristic') return 'Executable, description-inferred';
  if (status === 'ProjectFallback') return 'Executable, project fallback';
  if (status === 'MetadataFallback') return 'Executable, metadata fallback';
  if (status === 'MetadataOnly') return 'Metadata only';
  return status;
}

const lines = [
  '# Character Skill Catalog',
  '',
  'Generated from `CharacterSkillCatalog.json`. Do not edit by hand.',
  '',
  `- Source heroes: ${catalog.characters.length}`,
  `- Guide-visible heroes: ${characters.length}`,
  `- Skill references: ${characters.reduce((sum, character) => sum + character.skills.length, 0)}`,
  `- Unique skill IDs: ${new Set(characters.flatMap(character => character.skills.map(skill => skill.id))).size}`,
  `- Catalog SHA256: \`${crypto.createHash('sha256').update(raw).digest('hex')}\``,
  '',
  'Status meanings:',
  '',
  '- `Executable, description-inferred`: target, magnitude and timing were conservatively inferred from localized text.',
  '- `Executable, project fallback`: a prototype fallback used where the source table has no basic-attack binding.',
  '- `Executable, metadata fallback`: the skill can execute, but a missing localized description falls back to a generic damage rule.',
  '- `Metadata only`: the localized description is retained, while named or bespoke behavior is not presented as fully recovered.',
  ''
];

characters.sort((left, right) => left.id.localeCompare(right.id));
for (const character of characters) {
  lines.push(`## ${character.name} (${character.id})`, '');
  lines.push(`Role: ${character.role} | HP ${character.stats.maxHp} | ATK ${character.stats.attack} | DEF ${character.stats.defense} | SPD ${character.stats.speed}`, '');
  for (const skill of character.skills) {
    lines.push(`- **${text(skill.displayName)}** (\`${skill.id}\`, ${skill.category}, ${statusTone(skill.implementationStatus)})`);
    if (skill.description) lines.push(`  - ${text(skill.description)}`);
  }
  lines.push('');
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, lines.join('\n'), 'utf8');
console.log(JSON.stringify({ input, output, heroes: characters.length, bytes: Buffer.byteLength(lines.join('\n')) }, null, 2));
