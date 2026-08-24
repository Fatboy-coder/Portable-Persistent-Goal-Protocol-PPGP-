#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const pkg = require('../package.json');

const ROLE_CANDIDATES = {
  CONSTITUTION: ['docs/MASTER.md', 'MASTER.md', 'docs/CONSTITUTION.md', 'CONSTITUTION.md'],
  ROADMAP: ['docs/ROADMAP.md', 'ROADMAP.md'],
  MEMORY: ['docs/PROJECT_MEMORY.md', 'PROJECT_MEMORY.md', 'docs/MEMORY.md', 'MEMORY.md'],
  ACTIVE_GOAL: ['docs/ACTIVE_GOAL.md', 'ACTIVE_GOAL.md']
};

function die(message, code = 1) {
  console.error(`PPGP: ${message}`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = [...argv];
  const options = { root: process.cwd(), force: false };
  const positional = [];

  while (args.length) {
    const arg = args.shift();
    if (arg === '--root') {
      const value = args.shift();
      if (!value) die('--root requires a path.');
      options.root = path.resolve(value);
    } else if (arg === '--force') {
      options.force = true;
    } else {
      positional.push(arg);
    }
  }

  return { options, positional };
}

function findRole(root, role) {
  for (const candidate of ROLE_CANDIDATES[role] || []) {
    const absolute = path.join(root, candidate);
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return candidate;
  }
  return null;
}

function roleMap(root) {
  return Object.fromEntries(Object.keys(ROLE_CANDIDATES).map((role) => [role, findRole(root, role)]));
}

function hasGit(root) {
  try {
    execFileSync('git', ['-C', root, 'rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function printMap(root) {
  const roles = roleMap(root);
  console.log(`PPGP ${pkg.version} repository mapping`);
  console.log(`Root: ${root}`);
  for (const [role, file] of Object.entries(roles)) {
    console.log(`${role.padEnd(12)} ${file || '(not mapped)'}`);
  }
  console.log(`GIT          ${hasGit(root) ? 'available' : '(not detected)'}`);
  return roles;
}

function activeGoalPath(root) {
  const existing = findRole(root, 'ACTIVE_GOAL');
  return existing ? path.join(root, existing) : path.join(root, 'docs', 'ACTIVE_GOAL.md');
}

function goalTemplate(outcome) {
  return `# ACTIVE_GOAL\n\n## GOAL\n${outcome}\n\n## WHY\nTODO: Why this goal matters.\n\n## PHASE\nTHINK\n\n## DEFINITION_OF_DONE\n- TODO: Define a verifiable completion condition.\n\n## FROZEN_DECISIONS\n- None yet.\n\n## INVARIANTS\n- None recorded yet.\n\n## VERIFIED_CURRENT_STATE\n- TODO: Verify current repository or runtime state.\n\n## COMPLETED\n- Nothing yet.\n\n## REMAINING\n- Define and execute the work required to reach the Definition of Done.\n\n## BLOCKERS\n- None currently known.\n\n## HUMAN_AUTHORITY_REQUIRED\n- None currently known.\n\n## VERIFICATION_EVIDENCE\n- None yet.\n\n## NEXT_EXECUTABLE_ACTION\n- Complete THINK and freeze the first executable plan.\n`;
}

function parseSections(content) {
  const sections = {};
  let current = null;
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^##\s+([A-Z_]+)\s*$/);
    if (match) {
      current = match[1];
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line);
  }
  return Object.fromEntries(Object.entries(sections).map(([key, lines]) => [key, lines.join('\n').trim()]));
}

function oneLine(value, fallback = '(not set)') {
  if (!value) return fallback;
  return value.replace(/^[-*]\s+/gm, '').replace(/\s*\n\s*/g, ' | ').replace(/\s+/g, ' ').trim() || fallback;
}

function readActiveGoal(root) {
  const file = findRole(root, 'ACTIVE_GOAL');
  if (!file) die('No ACTIVE_GOAL found. Start one with: ppgp goal "<outcome>"');
  const absolute = path.join(root, file);
  return { file, sections: parseSections(fs.readFileSync(absolute, 'utf8')) };
}

function cmdInit(root) {
  printMap(root);
  console.log('\nInitialization is non-destructive. Existing documentation is reused; no empty memory files are created.');
}

function cmdDoctor(root) {
  const roles = printMap(root);
  const issues = [];
  if (!hasGit(root)) issues.push('Git forensic history was not detected.');
  if (!roles.ACTIVE_GOAL) issues.push('No ACTIVE_GOAL is present. This is normal when no substantial goal is active.');
  console.log(issues.length ? `\nNotes:\n- ${issues.join('\n- ')}` : '\nNo obvious repository-level PPGP issues detected.');
}

function cmdGoal(root, positional, force) {
  const outcome = positional.join(' ').trim();
  if (!outcome) die('goal requires an outcome, for example: ppgp goal "Ship the authentication migration"');
  const target = activeGoalPath(root);
  if (fs.existsSync(target) && !force) die(`${path.relative(root, target)} already exists. Use --force only when intentionally replacing the active goal.`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, goalTemplate(outcome), 'utf8');
  console.log(`Created ${path.relative(root, target)} in THINK phase.`);
  console.log('Next: verify current state, define the Definition of Done, then freeze the executable plan.');
}

function cmdStatus(root) {
  const { file, sections } = readActiveGoal(root);
  console.log(`PPGP/0.1 status from ${file}`);
  console.log(`goal: ${oneLine(sections.GOAL)}`);
  console.log(`phase: ${oneLine(sections.PHASE)}`);
  console.log(`frozen: ${oneLine(sections.FROZEN_DECISIONS)}`);
  console.log(`verified: ${oneLine(sections.VERIFIED_CURRENT_STATE)}`);
  console.log(`remaining: ${oneLine(sections.REMAINING)}`);
  console.log(`blockers: ${oneLine(sections.BLOCKERS)}`);
  console.log(`authority: ${oneLine(sections.HUMAN_AUTHORITY_REQUIRED)}`);
  console.log(`next: ${oneLine(sections.NEXT_EXECUTABLE_ACTION)}`);
  console.log(`evidence: ${oneLine(sections.VERIFICATION_EVIDENCE)}`);
}

function cmdHandoff(root) {
  const { sections } = readActiveGoal(root);
  console.log('PPGP/0.1');
  console.log(`G=${oneLine(sections.GOAL)}`);
  console.log(`P=${oneLine(sections.PHASE)}`);
  console.log(`F:${oneLine(sections.FROZEN_DECISIONS)}`);
  console.log(`D:${oneLine(sections.COMPLETED)}`);
  console.log(`B:${oneLine(sections.BLOCKERS)}`);
  console.log(`E:${oneLine(sections.VERIFICATION_EVIDENCE)}`);
  console.log(`N:${oneLine(sections.NEXT_EXECUTABLE_ACTION)}`);
}

function cmdSkillPath() {
  console.log(path.join(path.resolve(__dirname, '..'), 'skills', 'ppgp'));
}

function cmdInstallSkill(positional) {
  const destination = positional[0];
  if (!destination) die('install-skill requires a destination directory, for example: ppgp install-skill ~/.config/agent-skills');
  const source = path.join(path.resolve(__dirname, '..'), 'skills', 'ppgp');
  if (!fs.existsSync(source)) die('Bundled Agent Skill was not found in this package.');
  const parent = path.resolve(destination);
  const target = path.join(parent, 'ppgp');
  fs.mkdirSync(parent, { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: true });
  console.log(`Installed PPGP Agent Skill to ${target}`);
}

function help() {
  console.log(`PPGP ${pkg.version}\nPortable Persistent Goal Protocol CLI\n\nUsage:\n  ppgp init [--root PATH]\n  ppgp doctor [--root PATH]\n  ppgp goal <outcome> [--root PATH] [--force]\n  ppgp status [--root PATH]\n  ppgp handoff [--root PATH]\n  ppgp skill-path\n  ppgp install-skill <destination>\n  ppgp --version\n\nThe CLI is a deterministic companion to the PPGP protocol. It does not replace agent reasoning, verification, distillation, or closure checks.\n`);
}

const raw = process.argv.slice(2);
if (raw.length === 0 || raw.includes('--help') || raw.includes('-h')) {
  help();
  process.exit(0);
}
if (raw.includes('--version') || raw.includes('-v')) {
  console.log(pkg.version);
  process.exit(0);
}

const command = raw.shift();
const { options, positional } = parseArgs(raw);
if (!fs.existsSync(options.root) || !fs.statSync(options.root).isDirectory()) die(`Root is not a directory: ${options.root}`);

switch (command) {
  case 'init': cmdInit(options.root); break;
  case 'doctor': cmdDoctor(options.root); break;
  case 'goal': cmdGoal(options.root, positional, options.force); break;
  case 'status': cmdStatus(options.root); break;
  case 'handoff': cmdHandoff(options.root); break;
  case 'skill-path': cmdSkillPath(); break;
  case 'install-skill': cmdInstallSkill(positional); break;
  default: die(`Unknown command: ${command}. Run ppgp --help.`);
}
