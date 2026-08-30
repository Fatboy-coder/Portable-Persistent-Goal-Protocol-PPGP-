#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const pkg = require('../package.json');

const ROLE_CANDIDATES = {
  CONSTITUTION: ['docs/MASTER.md', 'MASTER.md', 'docs/CONSTITUTION.md', 'CONSTITUTION.md'],
  ROADMAP: ['docs/ROADMAP.md', 'ROADMAP.md'],
  MEMORY: ['docs/PROJECT_MEMORY.md', 'PROJECT_MEMORY.md', 'docs/MEMORY.md', 'MEMORY.md'],
  ACTIVE_GOAL: ['docs/ACTIVE_GOAL.md', 'ACTIVE_GOAL.md']
};

const PHASES = new Set(['THINK', 'FREEZE', 'EXECUTE', 'HARDEN', 'SHIP', 'DISTILL', 'CLOSED']);
const RUN_STATES = new Set(['RUNNABLE', 'RUNNING', 'WAITING', 'RECOVERY_REQUIRED', 'PARKED', 'COMPLETED']);
const LEASE_STATES = new Set(['CLAIMED', 'HANDOFF_READY', 'RECOVERY_REQUIRED', 'RELEASED']);
const WAIT_KINDS = new Set(['EXTERNAL', 'AUTHORITY', 'TECHNICAL']);
const WAIT_SCOPES = new Set(['ACTION', 'WORKSTREAM', 'GOAL', 'PROJECT']);
const GATE_STATES = new Set(['REQUIRED', 'GRANTED', 'CONSUMED', 'REVOKED']);
const DURABILITY = new Set(['SESSION_ONLY', 'HOST_DURABLE', 'REPO_DURABLE', 'REMOTE_DURABLE']);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

class PPGPError extends Error {
  constructor(message, code = 1) { super(message); this.name = 'PPGPError'; this.code = code; }
}

function die(message, code = 1) { throw new PPGPError(message, code); }

function parseArgs(argv) {
  const args = [...argv];
  const options = { root: process.cwd(), force: false, all: false, rollback: false, branch: null, holder: null, revision: null };
  const positional = [];
  while (args.length) {
    const arg = args.shift();
    if (arg === '--root') {
      const value = args.shift();
      if (!value) die('--root requires a path.');
      options.root = path.resolve(value);
    } else if (arg === '--force') options.force = true;
    else if (arg === '--all') options.all = true;
    else if (arg === '--rollback') options.rollback = true;
    else if (arg === '--branch') {
      const value = args.shift();
      if (!value) die('--branch requires a value.');
      options.branch = value;
    } else if (arg === '--holder') {
      const value = args.shift();
      if (!value) die('--holder requires a value.');
      options.holder = value;
    } else if (arg === '--revision') {
      const value = args.shift();
      if (!/^\d+$/.test(value || '')) die('--revision requires a non-negative integer.');
      options.revision = Number(value);
    } else positional.push(arg);
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

function git(root, args, fallback = null) {
  try {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return fallback;
  }
}

function hasGit(root) { return git(root, ['rev-parse', '--is-inside-work-tree']) === 'true'; }
function gitBranch(root) { return git(root, ['branch', '--show-current'], null) || null; }
function gitHead(root) { return git(root, ['rev-parse', 'HEAD'], null); }
function gitDirty(root) { const out = git(root, ['status', '--porcelain'], null); return out === null ? null : out.length > 0; }

function gitCommonDir(root) {
  const raw = git(root, ['rev-parse', '--git-common-dir'], null);
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.resolve(root, raw);
}

function printMap(root) {
  const roles = roleMap(root);
  console.log(`PPGP ${pkg.version} repository mapping`);
  console.log(`Root: ${root}`);
  for (const [role, file] of Object.entries(roles)) console.log(`${role.padEnd(12)} ${file || '(not mapped)'}`);
  console.log(`PORTFOLIO    ${portfolioExists(root) ? '.ppgp/portfolio.json' : '(implicit/single-workstream)'}`);
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
    if (match) { current = match[1]; sections[current] = []; continue; }
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
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  return { file, content, sections: parseSections(content) };
}

function ppgpDir(root) { return path.join(root, '.ppgp'); }
function portfolioPath(root) { return path.join(ppgpDir(root), 'portfolio.json'); }
function portfolioExists(root) { return fs.existsSync(portfolioPath(root)); }
function workstreamDir(root, id) { return path.join(ppgpDir(root), 'workstreams', id); }
function workstreamStatePath(root, id) { return path.join(workstreamDir(root, id), 'state.json'); }
function workstreamNotesPath(root, id) { return path.join(workstreamDir(root, id), 'notes.md'); }

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { die(`Invalid JSON in ${file}: ${error.message}`); }
}

function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

function withPortfolioLock(root, fn) {
  fs.mkdirSync(ppgpDir(root), { recursive: true });
  const lock = path.join(ppgpDir(root), '.lock');
  let fd;
  try { fd = fs.openSync(lock, 'wx'); }
  catch { die('PPGP coordination state is currently locked by another local mutation. Retry after it completes.'); }
  try { fs.writeFileSync(fd, `${process.pid}\n`, 'utf8'); return fn(); }
  finally { try { fs.closeSync(fd); } catch {} try { fs.unlinkSync(lock); } catch {} }
}

function validatePortfolio(p) {
  const errors = [];
  if (!p || typeof p !== 'object' || Array.isArray(p)) return ['portfolio must be an object'];
  if (p.schemaVersion !== '0.2') errors.push('schemaVersion must be 0.2');
  if (typeof p.id !== 'string' || !p.id) errors.push('id must be a non-empty string');
  if (!Number.isInteger(p.revision) || p.revision < 0) errors.push('revision must be a non-negative integer');
  if (p.aggregationPolicy !== 'any-runnable') errors.push('aggregationPolicy must be any-runnable');
  if (!Array.isArray(p.workstreams)) errors.push('workstreams must be an array');
  else {
    const seen = new Set();
    for (const ref of p.workstreams) {
      if (!ref || typeof ref !== 'object') { errors.push('workstream reference must be an object'); continue; }
      if (!ID_RE.test(ref.id || '')) errors.push(`invalid workstream id: ${ref.id}`);
      if (seen.has(ref.id)) errors.push(`duplicate workstream id: ${ref.id}`); else seen.add(ref.id);
      if (typeof ref.stateRef !== 'string' || !ref.stateRef) errors.push(`workstream ${ref.id} missing stateRef`);
      if (typeof ref.notesRef !== 'string' || !ref.notesRef) errors.push(`workstream ${ref.id} missing notesRef`);
    }
  }
  return errors;
}

function validateState(s) {
  const errors = [];
  if (!s || typeof s !== 'object' || Array.isArray(s)) return ['state must be an object'];
  if (s.schemaVersion !== '0.2') errors.push('schemaVersion must be 0.2');
  if (!ID_RE.test(s.id || '')) errors.push('id is invalid');
  if (typeof s.title !== 'string' || !s.title) errors.push('title must be non-empty');
  if (!Number.isInteger(s.revision) || s.revision < 0) errors.push('revision must be a non-negative integer');
  if (!PHASES.has(s.phase)) errors.push(`invalid phase: ${s.phase}`);
  if (!RUN_STATES.has(s.runState)) errors.push(`invalid runState: ${s.runState}`);
  if (!(s.branch === null || typeof s.branch === 'string')) errors.push('branch must be string or null');
  if (!(s.lease === null || typeof s.lease === 'object')) errors.push('lease must be object or null');
  if (s.lease) {
    if (typeof s.lease.holder !== 'string' || !s.lease.holder) errors.push('lease holder missing');
    if (!LEASE_STATES.has(s.lease.status)) errors.push(`invalid lease status: ${s.lease.status}`);
    if (!Number.isInteger(s.lease.generation) || s.lease.generation < 1) errors.push('lease generation must be >= 1');
    if (typeof s.lease.claimedAt !== 'string' || !s.lease.claimedAt) errors.push('lease claimedAt missing');
    if (!(s.lease.expiresAt === null || typeof s.lease.expiresAt === 'string')) errors.push('lease expiresAt must be string or null');
  }
  if (!Array.isArray(s.dependencies)) errors.push('dependencies must be an array');
  else for (const d of s.dependencies) {
    if (!ID_RE.test((d && d.workstream) || '')) errors.push('dependency workstream id invalid');
    if (!d || d.condition !== 'COMPLETED') errors.push('dependency condition must be COMPLETED');
  }
  if (!Array.isArray(s.waitConditions)) errors.push('waitConditions must be an array');
  else for (const w of s.waitConditions) {
    if (!w || typeof w.id !== 'string' || !w.id) errors.push('wait id missing');
    if (!w || !WAIT_KINDS.has(w.kind)) errors.push(`invalid wait kind: ${w && w.kind}`);
    if (!w || !WAIT_SCOPES.has(w.scope)) errors.push(`invalid wait scope: ${w && w.scope}`);
    if (!w || typeof w.dependency !== 'string' || !w.dependency) errors.push('wait dependency missing');
    if (!w || typeof w.resumeCondition !== 'string' || !w.resumeCondition) errors.push('wait resumeCondition missing');
  }
  if (!Array.isArray(s.authorityGates)) errors.push('authorityGates must be an array');
  else for (const g of s.authorityGates) {
    if (!g || typeof g.id !== 'string' || !g.id) errors.push('authority gate id missing');
    if (!g || typeof g.action !== 'string' || !g.action) errors.push('authority gate action missing');
    if (!g || !GATE_STATES.has(g.state)) errors.push(`invalid authority gate state: ${g && g.state}`);
  }
  if (!(s.nextAction === null || typeof s.nextAction === 'string')) errors.push('nextAction must be string or null');
  if (!Array.isArray(s.evidenceRefs) || s.evidenceRefs.some((x) => typeof x !== 'string')) errors.push('evidenceRefs must be a string array');
  if (!DURABILITY.has(s.durability)) errors.push(`invalid durability: ${s.durability}`);
  if (typeof s.notesRef !== 'string' || !s.notesRef) errors.push('notesRef missing');
  if (s.runState === 'RUNNING' && (!s.lease || s.lease.status !== 'CLAIMED')) errors.push('RUNNING requires a CLAIMED lease');
  if (s.runState === 'COMPLETED' && s.phase !== 'CLOSED') errors.push('COMPLETED requires phase CLOSED');
  return errors;
}

function loadPortfolio(root) {
  if (!portfolioExists(root)) return null;
  const portfolio = readJson(portfolioPath(root));
  const errors = validatePortfolio(portfolio);
  if (errors.length) die(`Invalid .ppgp/portfolio.json:\n- ${errors.join('\n- ')}`);
  return portfolio;
}

function resolveRef(root, ref) { return path.resolve(root, ref); }

function loadWorkstream(root, id, portfolio = loadPortfolio(root)) {
  if (!portfolio) die('No PPGP portfolio found.');
  const ref = portfolio.workstreams.find((x) => x.id === id);
  if (!ref) die(`Unknown workstream: ${id}`);
  const file = resolveRef(root, ref.stateRef);
  if (!fs.existsSync(file)) die(`Missing state for workstream ${id}: ${ref.stateRef}`);
  const state = readJson(file);
  const errors = validateState(state);
  if (errors.length) die(`Invalid state for ${id}:\n- ${errors.join('\n- ')}`);
  if (state.id !== id) die(`Workstream reference ${id} points to state id ${state.id}.`);
  return { ref, file, state };
}

function updateState(root, id, mutate, expectedRevision = null) {
  return withPortfolioLock(root, () => {
    const portfolio = loadPortfolio(root);
    const loaded = loadWorkstream(root, id, portfolio);
    if (expectedRevision !== null && loaded.state.revision !== expectedRevision) {
      die(`Revision conflict for ${id}: expected ${expectedRevision}, canonical is ${loaded.state.revision}. Reload before writing.`);
    }
    const next = JSON.parse(JSON.stringify(loaded.state));
    mutate(next);
    next.revision = loaded.state.revision + 1;
    const errors = validateState(next);
    if (errors.length) die(`Refusing invalid update for ${id}:\n- ${errors.join('\n- ')}`);
    writeJsonAtomic(loaded.file, next);
    return next;
  });
}

function makePortfolio() {
  return { schemaVersion: '0.2', id: 'default', revision: 0, aggregationPolicy: 'any-runnable', workstreams: [] };
}

function makeState(id, title, branch = null) {
  return {
    schemaVersion: '0.2', id, title, revision: 0, phase: 'THINK', runState: 'RUNNABLE', branch,
    lease: null, dependencies: [], waitConditions: [], authorityGates: [], nextAction: 'Complete THINK and freeze the first executable plan.',
    evidenceRefs: [], durability: 'HOST_DURABLE', notesRef: `.ppgp/workstreams/${id}/notes.md`
  };
}

function notesTemplate(id, title) {
  return `# WORKSTREAM ${id}: ${title}\n\n## WHY\nTODO: Why this workstream matters.\n\n## DEFINITION_OF_DONE\n- TODO: Define verifiable completion conditions.\n\n## FROZEN_DECISIONS\n- None yet.\n\n## INVARIANTS\n- None recorded yet.\n\n## VERIFIED_PROGRESS\n- Nothing yet.\n\nMachine scheduling state is canonical in \`state.json\`. Do not duplicate RUN_STATE, lease generation, dependencies, waits, or authority-gate state here.\n`;
}

function dependencyGraph(root, portfolio) {
  const states = new Map();
  for (const ref of portfolio.workstreams) states.set(ref.id, loadWorkstream(root, ref.id, portfolio).state);
  return states;
}

function cycleErrors(states) {
  const errors = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(id, trail) {
    if (visiting.has(id)) { errors.push(`dependency cycle: ${[...trail, id].join(' -> ')}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    const state = states.get(id);
    if (state) for (const dep of state.dependencies) {
      if (!states.has(dep.workstream)) errors.push(`${id} depends on unknown workstream ${dep.workstream}`);
      else visit(dep.workstream, [...trail, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of states.keys()) visit(id, []);
  return [...new Set(errors)];
}

function dependencySatisfied(state, states) {
  return state.dependencies.every((d) => states.has(d.workstream) && states.get(d.workstream).runState === 'COMPLETED');
}

function aggregatePortfolio(states) {
  const list = [...states.values()];
  if (list.length === 0) return 'IDLE';
  if (list.every((s) => s.runState === 'COMPLETED')) return 'COMPLETED';
  const eligible = list.filter((s) => s.runState !== 'COMPLETED' && s.runState !== 'PARKED' && dependencySatisfied(s, states));
  if (eligible.some((s) => s.runState === 'RUNNING')) return 'RUNNING';
  if (eligible.some((s) => s.runState === 'RUNNABLE')) return 'RUNNABLE';
  if (eligible.some((s) => s.runState === 'RECOVERY_REQUIRED')) return 'RECOVERY_REQUIRED';
  if (list.some((s) => s.runState !== 'COMPLETED' && s.runState !== 'PARKED')) return 'WAITING';
  return 'IDLE';
}

function checkoutRegistryPath(root) {
  const common = gitCommonDir(root);
  return common ? path.join(common, 'ppgp-checkouts.json') : null;
}

function loadCheckoutRegistry(root) {
  const file = checkoutRegistryPath(root);
  if (!file) return { file: null, data: { schemaVersion: '0.2-local', revision: 0, claims: [] } };
  if (!fs.existsSync(file)) return { file, data: { schemaVersion: '0.2-local', revision: 0, claims: [] } };
  const data = readJson(file);
  if (!data || data.schemaVersion !== '0.2-local' || !Array.isArray(data.claims)) die(`Invalid local checkout registry: ${file}`);
  return { file, data };
}

function saveCheckoutRegistry(file, data) {
  if (!file) die('Checkout claims require Git so they can live in the local Git common directory.');
  data.revision = (Number.isInteger(data.revision) ? data.revision : 0) + 1;
  writeJsonAtomic(file, data);
}

function sha256(content) { return crypto.createHash('sha256').update(content).digest('hex'); }

function cmdInit(root) {
  printMap(root);
  console.log('\nInitialization is non-destructive. Existing documentation is reused; no empty memory or portfolio files are created.');
}

function cmdDoctor(root) {
  printMap(root);
  const issues = [];
  if (!hasGit(root)) issues.push('Git forensic history was not detected.');
  if (!portfolioExists(root)) {
    if (!findRole(root, 'ACTIVE_GOAL')) issues.push('No ACTIVE_GOAL is present. This is normal when no substantial goal is active.');
  } else {
    const portfolio = loadPortfolio(root);
    const states = dependencyGraph(root, portfolio);
    issues.push(...cycleErrors(states));
    for (const [id, state] of states) {
      if (state.lease && state.lease.expiresAt && Date.parse(state.lease.expiresAt) <= Date.now() && state.lease.status === 'CLAIMED') issues.push(`${id} has an expired CLAIMED lease.`);
    }
    const { data } = loadCheckoutRegistry(root);
    for (const claim of data.claims) {
      if (!states.has(claim.workstreamId)) issues.push(`checkout claim ${claim.path} references unknown workstream ${claim.workstreamId}`);
      if (fs.existsSync(claim.path) && states.has(claim.workstreamId)) {
        const actual = gitBranch(claim.path);
        const declared = states.get(claim.workstreamId).branch;
        if (declared && actual && declared !== actual) issues.push(`${claim.workstreamId} checkout branch mismatch: declared ${declared}, actual ${actual}`);
      }
    }
  }
  console.log(issues.length ? `\nNotes:\n- ${issues.join('\n- ')}` : '\nNo obvious repository-level PPGP issues detected.');
}

function cmdGoal(root, positional, force) {
  if (portfolioExists(root)) die('A v0.2 portfolio exists. Use `ppgp workstream start <id> <title>` instead of replacing an ambiguous active goal.');
  const outcome = positional.join(' ').trim();
  if (!outcome) die('goal requires an outcome, for example: ppgp goal "Ship the authentication migration"');
  const target = activeGoalPath(root);
  if (fs.existsSync(target) && !force) die(`${path.relative(root, target)} already exists. Use --force only when intentionally replacing the active goal.`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, goalTemplate(outcome), 'utf8');
  console.log(`Created ${path.relative(root, target)} in THINK phase.`);
  console.log('Next: verify current state, define the Definition of Done, then freeze the executable plan.');
}

function printLegacyStatus(root) {
  const { file, sections } = readActiveGoal(root);
  console.log(`PPGP/${pkg.version} status from ${file}`);
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

function printWorkstream(state) {
  console.log(`${state.id}: ${state.title}`);
  console.log(`  revision: ${state.revision}`);
  console.log(`  phase: ${state.phase}`);
  console.log(`  run_state: ${state.runState}`);
  console.log(`  branch: ${state.branch || '(none)'}`);
  console.log(`  lease: ${state.lease ? `${state.lease.holder}/${state.lease.status}/g${state.lease.generation}` : '(none)'}`);
  console.log(`  dependencies: ${state.dependencies.length ? state.dependencies.map((d) => `${d.workstream}:${d.condition}`).join(', ') : '(none)'}`);
  console.log(`  waits: ${state.waitConditions.length ? state.waitConditions.map((w) => `${w.kind}/${w.scope}:${w.id}`).join(', ') : '(none)'}`);
  console.log(`  authority: ${state.authorityGates.length ? state.authorityGates.map((g) => `${g.id}:${g.state}`).join(', ') : '(none)'}`);
  console.log(`  durability: ${state.durability}`);
  console.log(`  next: ${state.nextAction || '(none)'}`);
}

function cmdStatus(root, all) {
  const portfolio = loadPortfolio(root);
  if (!portfolio) return printLegacyStatus(root);
  const states = dependencyGraph(root, portfolio);
  const cycles = cycleErrors(states);
  if (cycles.length) die(cycles.join('; '));
  console.log(`PPGP/${pkg.version} portfolio ${portfolio.id} revision ${portfolio.revision}`);
  console.log(`portfolio_state: ${aggregatePortfolio(states)}`);
  const eligible = [...states.values()].filter((s) => s.runState !== 'COMPLETED' && s.runState !== 'PARKED' && dependencySatisfied(s, states));
  console.log(`runnable: ${eligible.filter((s) => s.runState === 'RUNNABLE').map((s) => s.id).join(', ') || '(none)'}`);
  console.log(`running: ${eligible.filter((s) => s.runState === 'RUNNING').map((s) => s.id).join(', ') || '(none)'}`);
  console.log(`recovery_required: ${eligible.filter((s) => s.runState === 'RECOVERY_REQUIRED').map((s) => s.id).join(', ') || '(none)'}`);
  if (all) for (const state of states.values()) { console.log(''); printWorkstream(state); }
}

function cmdHandoff(root) {
  const portfolio = loadPortfolio(root);
  if (!portfolio) {
    const { sections } = readActiveGoal(root);
    console.log(`PPGP/${pkg.version}`);
    console.log(`G=${oneLine(sections.GOAL)}`);
    console.log(`P=${oneLine(sections.PHASE)}`);
    console.log(`F:${oneLine(sections.FROZEN_DECISIONS)}`);
    console.log(`D:${oneLine(sections.COMPLETED)}`);
    console.log(`B:${oneLine(sections.BLOCKERS)}`);
    console.log(`E:${oneLine(sections.VERIFICATION_EVIDENCE)}`);
    console.log(`N:${oneLine(sections.NEXT_EXECUTABLE_ACTION)}`);
    return;
  }
  if (portfolio.workstreams.length !== 1) die('Portfolio handoff is ambiguous. Use `ppgp workstream handoff <id> <new-holder>`.');
  const state = loadWorkstream(root, portfolio.workstreams[0].id, portfolio).state;
  console.log(`PPGP/${pkg.version}`);
  console.log(`WS=${state.id}`);
  console.log(`P=${state.phase}`);
  console.log(`R=${state.runState}`);
  console.log(`L=${state.lease ? `${state.lease.holder}/${state.lease.status}/g${state.lease.generation}` : '(none)'}`);
  console.log(`W=${state.waitConditions.map((w) => `${w.kind}/${w.scope}:${w.id}`).join(',') || '(none)'}`);
  console.log(`U=${state.durability}`);
  console.log(`N=${state.nextAction || '(none)'}`);
}

function cmdMigrate(root, rollback) {
  if (rollback) {
    const metaFile = path.join(ppgpDir(root), 'MIGRATION.json');
    if (!fs.existsSync(metaFile)) die('No reversible PPGP migration metadata found.');
    const meta = readJson(metaFile);
    const source = path.resolve(root, meta.source);
    if (!fs.existsSync(source)) die(`Legacy source missing: ${meta.source}`);
    if (sha256(fs.readFileSync(source)) !== meta.sourceSha256) die('Legacy source changed after migration; refusing automatic rollback.');
    fs.rmSync(ppgpDir(root), { recursive: true, force: true });
    console.log('Rolled back v0.2 reference state. Legacy ACTIVE_GOAL is canonical again.');
    return;
  }
  if (portfolioExists(root)) die('Portfolio already exists; migration is unnecessary.');
  const legacy = readActiveGoal(root);
  const id = 'legacy';
  withPortfolioLock(root, () => {
    const portfolio = makePortfolio();
    portfolio.workstreams.push({ id, stateRef: `.ppgp/workstreams/${id}/state.json`, notesRef: `.ppgp/workstreams/${id}/notes.md` });
    const phaseCandidate = oneLine(legacy.sections.PHASE, 'THINK').toUpperCase();
    const phase = PHASES.has(phaseCandidate) ? phaseCandidate : 'THINK';
    const state = makeState(id, oneLine(legacy.sections.GOAL, 'Migrated active goal'), gitBranch(root));
    state.phase = phase;
    state.runState = phase === 'CLOSED' ? 'COMPLETED' : 'RUNNABLE';
    state.nextAction = oneLine(legacy.sections.NEXT_EXECUTABLE_ACTION, null);
    state.evidenceRefs = legacy.sections.VERIFICATION_EVIDENCE && !/^[-*]?\s*None/i.test(legacy.sections.VERIFICATION_EVIDENCE) ? [oneLine(legacy.sections.VERIFICATION_EVIDENCE)] : [];
    state.durability = 'HOST_DURABLE';
    fs.mkdirSync(workstreamDir(root, id), { recursive: true });
    fs.writeFileSync(workstreamNotesPath(root, id), legacy.content, 'utf8');
    writeJsonAtomic(workstreamStatePath(root, id), state);
    writeJsonAtomic(portfolioPath(root), portfolio);
    writeJsonAtomic(path.join(ppgpDir(root), 'MIGRATION.json'), {
      schemaVersion: '0.2', source: legacy.file, sourceSha256: sha256(Buffer.from(legacy.content)),
      cutoverAt: new Date().toISOString(), mode: 'CUTOVER', legacyRole: 'COMPATIBILITY_SNAPSHOT'
    });
  });
  console.log('Migrated legacy ACTIVE_GOAL into the v0.2 reference portfolio.');
  console.log('The legacy file remains untouched as a compatibility snapshot; .ppgp state is now canonical.');
  console.log('Rollback while the legacy snapshot is unchanged: ppgp migrate --rollback');
}

function cmdWorkstream(root, positional, options) {
  const action = positional.shift();
  if (!action) die('workstream requires an action: start, status, park, resume, handoff, recover, close');
  if (action === 'start') {
    const id = positional.shift();
    const title = positional.join(' ').trim();
    if (!ID_RE.test(id || '')) die('workstream start requires a safe id (letters, numbers, dot, underscore, dash).');
    if (!title) die('workstream start requires a title.');
    if (!portfolioExists(root) && findRole(root, 'ACTIVE_GOAL')) die('Legacy ACTIVE_GOAL exists. Run `ppgp migrate` before adding concurrent workstreams.');
    withPortfolioLock(root, () => {
      const portfolio = portfolioExists(root) ? loadPortfolio(root) : makePortfolio();
      if (portfolio.workstreams.some((x) => x.id === id)) die(`Workstream already exists: ${id}`);
      const state = makeState(id, title, options.branch || gitBranch(root));
      fs.mkdirSync(workstreamDir(root, id), { recursive: true });
      fs.writeFileSync(workstreamNotesPath(root, id), notesTemplate(id, title), 'utf8');
      writeJsonAtomic(workstreamStatePath(root, id), state);
      portfolio.workstreams.push({ id, stateRef: `.ppgp/workstreams/${id}/state.json`, notesRef: `.ppgp/workstreams/${id}/notes.md` });
      portfolio.revision += 1;
      writeJsonAtomic(portfolioPath(root), portfolio);
    });
    console.log(`Started workstream ${id} in THINK/RUNNABLE.`);
    return;
  }
  const id = positional.shift();
  if (!id) die(`workstream ${action} requires a workstream id.`);
  if (action === 'status') { printWorkstream(loadWorkstream(root, id).state); return; }
  if (action === 'park') {
    const next = updateState(root, id, (s) => { s.runState = 'PARKED'; s.lease = null; }, options.revision);
    console.log(`Parked ${id} at revision ${next.revision}.`);
    return;
  }
  if (action === 'resume') {
    const next = updateState(root, id, (s) => { if (s.runState === 'COMPLETED') die('Completed workstreams cannot be resumed.'); s.runState = 'RUNNABLE'; s.lease = null; }, options.revision);
    console.log(`Resumed ${id} as RUNNABLE at revision ${next.revision}.`);
    return;
  }
  if (action === 'handoff' || action === 'recover') {
    const holder = positional.shift() || options.holder;
    if (!holder) die(`workstream ${action} requires the new holder.`);
    if (action === 'recover') verifyRecoveryCheckout(root, id);
    const next = updateState(root, id, (s) => {
      if (s.runState === 'COMPLETED') die('Completed workstreams cannot receive a lease.');
      const generation = s.lease && Number.isInteger(s.lease.generation) ? s.lease.generation + 1 : 1;
      s.lease = { holder, status: 'CLAIMED', generation, claimedAt: new Date().toISOString(), expiresAt: null };
      s.runState = 'RUNNING';
    }, options.revision);
    console.log(`${action === 'recover' ? 'Recovered' : 'Handed off'} ${id} to ${holder} at lease generation ${next.lease.generation}, revision ${next.revision}.`);
    return;
  }
  if (action === 'close') {
    const next = updateState(root, id, (s) => {
      if (s.phase !== 'CLOSED') die('Refusing close: workstream phase must already be CLOSED after verified PPGP closure.');
      s.runState = 'COMPLETED';
      s.lease = null;
      s.nextAction = null;
    }, options.revision);
    releaseCheckoutClaimsFor(root, id);
    console.log(`Closed ${id} as COMPLETED at revision ${next.revision}.`);
    return;
  }
  die(`Unknown workstream action: ${action}`);
}

function verifyRecoveryCheckout(root, id) {
  const { data } = loadCheckoutRegistry(root);
  const claims = data.claims.filter((c) => c.workstreamId === id);
  const state = loadWorkstream(root, id).state;
  for (const claim of claims) {
    if (!fs.existsSync(claim.path)) die(`Claimed checkout for ${id} no longer exists: ${claim.path}`);
    const actual = gitBranch(claim.path);
    if (state.branch && actual && actual !== state.branch) die(`Recovery refused: ${id} declared branch ${state.branch}, claimed checkout is ${actual}. Inspect before takeover.`);
  }
}

function releaseCheckoutClaimsFor(root, id) {
  const { file, data } = loadCheckoutRegistry(root);
  if (!file) return;
  const before = data.claims.length;
  data.claims = data.claims.filter((c) => c.workstreamId !== id);
  if (data.claims.length !== before) saveCheckoutRegistry(file, data);
}

function cmdCheckout(root, positional) {
  const action = positional.shift();
  if (!action) die('checkout requires an action: status, claim, release');
  const { file, data } = loadCheckoutRegistry(root);
  if (action === 'status') {
    console.log(`PPGP/${pkg.version} local checkout registry`);
    console.log(`storage: ${file || '(Git unavailable)'}`);
    if (!data.claims.length) console.log('claims: (none)');
    else for (const c of data.claims) console.log(`${c.path} -> ${c.workstreamId} branch=${c.branch || '(none)'} head=${c.head || '(none)'}`);
    return;
  }
  if (!file) die('checkout claims require a Git repository.');
  if (action === 'claim') {
    const id = positional.shift();
    const target = path.resolve(positional.shift() || root);
    if (!id) die('checkout claim requires a workstream id.');
    const state = loadWorkstream(root, id).state;
    if (!state.lease || state.lease.status !== 'CLAIMED' || state.runState !== 'RUNNING') die(`checkout claim requires ${id} to hold a valid CLAIMED execution lease.`);
    if (!hasGit(target)) die(`Target is not a Git checkout: ${target}`);
    const actualBranch = gitBranch(target);
    if (state.branch && actualBranch && state.branch !== actualBranch) die(`Branch mismatch: ${id} declares ${state.branch}, checkout is ${actualBranch}.`);
    const existing = data.claims.find((c) => path.resolve(c.path) === target);
    if (existing && existing.workstreamId !== id) die(`Checkout already claimed by ${existing.workstreamId}: ${target}`);
    const claim = { path: target, workstreamId: id, branch: actualBranch, head: gitHead(target), dirty: gitDirty(target) === true, claimedAt: new Date().toISOString() };
    if (existing) Object.assign(existing, claim); else data.claims.push(claim);
    saveCheckoutRegistry(file, data);
    console.log(`Claimed ${target} for ${id}.`);
    return;
  }
  if (action === 'release') {
    const target = path.resolve(positional.shift() || root);
    const before = data.claims.length;
    data.claims = data.claims.filter((c) => path.resolve(c.path) !== target);
    if (before === data.claims.length) die(`No checkout claim found for ${target}`);
    saveCheckoutRegistry(file, data);
    console.log(`Released checkout claim for ${target}.`);
    return;
  }
  die(`Unknown checkout action: ${action}`);
}

function checkoutRegistryPath(root) {
  const common = gitCommonDir(root);
  return common ? path.join(common, 'ppgp-checkouts.json') : null;
}

function loadCheckoutRegistry(root) {
  const file = checkoutRegistryPath(root);
  if (!file) return { file: null, data: { schemaVersion: '0.2-local', revision: 0, claims: [] } };
  if (!fs.existsSync(file)) return { file, data: { schemaVersion: '0.2-local', revision: 0, claims: [] } };
  const data = readJson(file);
  if (!data || data.schemaVersion !== '0.2-local' || !Array.isArray(data.claims)) die(`Invalid local checkout registry: ${file}`);
  return { file, data };
}

function saveCheckoutRegistry(file, data) {
  if (!file) die('Checkout claims require Git so they can live in the local Git common directory.');
  data.revision = (Number.isInteger(data.revision) ? data.revision : 0) + 1;
  writeJsonAtomic(file, data);
}

function cmdSkillPath() { console.log(path.join(path.resolve(__dirname, '..'), 'skills', 'ppgp')); }

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
  console.log(`PPGP ${pkg.version}\nPortable Persistent Goal Protocol CLI\n\nLegacy/single-workstream:\n  ppgp init [--root PATH]\n  ppgp doctor [--root PATH]\n  ppgp goal <outcome> [--root PATH] [--force]\n  ppgp status [--root PATH] [--all]\n  ppgp handoff [--root PATH]\n  ppgp migrate [--root PATH]\n  ppgp migrate --rollback [--root PATH]\n\nPortfolio/workstreams:\n  ppgp workstream start <id> <title> [--branch BRANCH]\n  ppgp workstream status <id>\n  ppgp workstream park <id> [--revision N]\n  ppgp workstream resume <id> [--revision N]\n  ppgp workstream handoff <id> <new-holder> [--revision N]\n  ppgp workstream recover <id> <new-holder> [--revision N]\n  ppgp workstream close <id> [--revision N]\n\nLocal checkout claims:\n  ppgp checkout status\n  ppgp checkout claim <workstream-id> [checkout-path]\n  ppgp checkout release [checkout-path]\n\nDistribution:\n  ppgp skill-path\n  ppgp install-skill <destination>\n  ppgp --version\n\nReference JSON state uses local revision checks and a local mutation lock. Checkout claims live in the Git common directory and are not committed.\n`);
}

function main() {
  const raw = process.argv.slice(2);
  if (raw.length === 0 || raw.includes('--help') || raw.includes('-h')) { help(); return; }
  if (raw.includes('--version') || raw.includes('-v')) { console.log(pkg.version); return; }
  const command = raw.shift();
  const { options, positional } = parseArgs(raw);
  if (!fs.existsSync(options.root) || !fs.statSync(options.root).isDirectory()) die(`Root is not a directory: ${options.root}`);

  switch (command) {
    case 'init': cmdInit(options.root); break;
    case 'doctor': cmdDoctor(options.root); break;
    case 'goal': cmdGoal(options.root, positional, options.force); break;
    case 'status': cmdStatus(options.root, options.all); break;
    case 'handoff': cmdHandoff(options.root); break;
    case 'migrate': cmdMigrate(options.root, options.rollback); break;
    case 'workstream': cmdWorkstream(options.root, positional, options); break;
    case 'checkout': cmdCheckout(options.root, positional); break;
    case 'skill-path': cmdSkillPath(); break;
    case 'install-skill': cmdInstallSkill(positional); break;
    default: die(`Unknown command: ${command}. Run ppgp --help.`);
  }
}

try { main(); }
catch (error) {
  if (error instanceof PPGPError) { console.error(`PPGP: ${error.message}`); process.exitCode = error.code; }
  else throw error;
}
