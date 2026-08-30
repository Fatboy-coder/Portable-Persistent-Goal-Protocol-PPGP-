'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const cli = path.join(repo, 'bin', 'ppgp.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args, ok = true) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  if (ok && result.status !== 0) {
    throw new Error(`FAILED ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  }
  if (!ok && result.status === 0) {
    throw new Error(`EXPECTED FAILURE ${args.join(' ')}\n${result.stdout}`);
  }
  return result;
}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ppgp-v020-'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'test@example.com']);
  git(root, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(root, 'seed.txt'), 'seed\n');
  git(root, ['add', '.']);
  git(root, ['commit', '-qm', 'seed']);
  return root;
}

function readJson(root, rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function writeJson(root, rel, value) {
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const roots = [];

try {
  // Legacy behavior and reversible migration.
  const legacy = makeRepo();
  roots.push(legacy);
  run(['goal', 'Legacy', 'goal', '--root', legacy]);
  assert(run(['status', '--root', legacy]).stdout.includes('status from'), 'legacy status missing');
  const original = fs.readFileSync(path.join(legacy, 'docs', 'ACTIVE_GOAL.md'), 'utf8');

  run(['migrate', '--root', legacy]);
  assert(fs.existsSync(path.join(legacy, '.ppgp', 'portfolio.json')), 'portfolio missing after migrate');
  assert(fs.readFileSync(path.join(legacy, 'docs', 'ACTIVE_GOAL.md'), 'utf8') === original, 'migration mutated legacy source');
  assert(run(['status', '--all', '--root', legacy]).stdout.includes('portfolio_state: RUNNABLE'), 'migrated portfolio not runnable');

  run(['migrate', '--rollback', '--root', legacy]);
  assert(!fs.existsSync(path.join(legacy, '.ppgp')), 'rollback left .ppgp');
  assert(fs.readFileSync(path.join(legacy, 'docs', 'ACTIVE_GOAL.md'), 'utf8') === original, 'rollback mutated legacy source');

  // Rollback must refuse to destroy post-cutover v0.2 state.
  run(['migrate', '--root', legacy]);
  let migrated = readJson(legacy, '.ppgp/workstreams/legacy/state.json');
  migrated.revision += 1;
  migrated.nextAction = 'Changed after cutover';
  writeJson(legacy, '.ppgp/workstreams/legacy/state.json', migrated);
  const destructiveRollback = run(['migrate', '--rollback', '--root', legacy], false);
  assert(destructiveRollback.stderr.includes('changed after cutover'), 'rollback did not refuse diverged v0.2 state');
  fs.rmSync(path.join(legacy, '.ppgp'), { recursive: true, force: true });

  // Portfolio/workstream coordination.
  const root = makeRepo();
  roots.push(root);
  const branch = git(root, ['branch', '--show-current']);

  run(['workstream', 'start', 'a', 'Workstream A', '--root', root, '--branch', branch]);
  run(['workstream', 'start', 'b', 'Workstream B', '--root', root, '--branch', branch]);
  let portfolio = readJson(root, '.ppgp/portfolio.json');
  assert(portfolio.workstreams.length === 2 && portfolio.revision === 2, 'portfolio revision mismatch');

  // Existing-workstream mutation requires observed revision.
  const missingRevision = run(['workstream', 'handoff', 'a', 'codex', '--root', root], false);
  assert(missingRevision.stderr.includes('requires --revision'), 'mutation without revision was accepted');

  run(['workstream', 'handoff', 'a', 'codex', '--root', root, '--revision', '0']);
  let a = readJson(root, '.ppgp/workstreams/a/state.json');
  assert(a.runState === 'RUNNING' && a.lease.generation === 1, 'first lease incorrect');

  const conflict = run(['workstream', 'park', 'a', '--root', root, '--revision', '0'], false);
  assert(conflict.stderr.includes('Revision conflict'), 'stale revision was not rejected');
  assert(!fs.existsSync(path.join(root, '.ppgp', '.lock')), 'CAS failure left a stale portfolio lock');

  // Checkout registry is local and exclusive.
  run(['checkout', 'claim', 'a', root, '--root', root]);
  assert(fs.existsSync(path.join(root, '.git', 'ppgp-checkouts.json')), 'checkout registry not stored in git common dir');
  assert(!fs.existsSync(path.join(root, '.git', 'ppgp-checkouts.lock')), 'checkout claim left stale lock');

  run(['workstream', 'handoff', 'b', 'claude', '--root', root, '--revision', '0']);
  const collision = run(['checkout', 'claim', 'b', root, '--root', root], false);
  assert(collision.stderr.includes('already claimed by a'), 'checkout collision not rejected');
  assert(!fs.existsSync(path.join(root, '.git', 'ppgp-checkouts.lock')), 'checkout collision left stale lock');

  // Handoff fences older executor generation.
  run(['workstream', 'handoff', 'a', 'claude', '--root', root, '--revision', '1']);
  a = readJson(root, '.ppgp/workstreams/a/state.json');
  assert(a.lease.generation === 2 && a.lease.holder === 'claude', 'lease generation did not increment');

  // Mixed waits retain independent reasons.
  a.runState = 'WAITING';
  a.lease = null;
  a.revision += 1;
  a.waitConditions = [
    { id: 'ssh', kind: 'EXTERNAL', scope: 'ACTION', dependency: 'SSH coordinates', resumeCondition: 'coordinates available' },
    { id: 'spend', kind: 'AUTHORITY', scope: 'ACTION', dependency: 'paid compute approval', resumeCondition: 'authority granted' }
  ];
  a.authorityGates = [
    { id: 'paid-compute', action: 'create paid compute', state: 'REQUIRED' }
  ];
  writeJson(root, '.ppgp/workstreams/a/state.json', a);

  let status = run(['status', '--all', '--root', root]).stdout;
  assert(status.includes('portfolio_state: RUNNING'), 'independent running workstream should keep portfolio running');
  assert(status.includes('EXTERNAL/ACTION:ssh') && status.includes('AUTHORITY/ACTION:spend'), 'mixed waits were collapsed or lost');
  assert(status.includes('paid-compute:REQUIRED'), 'authority gate state missing');

  // Dependency blocks only its dependent workstream.
  let b = readJson(root, '.ppgp/workstreams/b/state.json');
  b.runState = 'RUNNABLE';
  b.lease = null;
  b.dependencies = [{ workstream: 'a', condition: 'COMPLETED' }];
  b.revision += 1;
  writeJson(root, '.ppgp/workstreams/b/state.json', b);
  status = run(['status', '--all', '--root', root]).stdout;
  assert(status.includes('portfolio_state: WAITING'), 'unsatisfied dependency plus waiting prerequisite should aggregate WAITING');

  // Cycles are invalid coordination state.
  a.dependencies = [{ workstream: 'b', condition: 'COMPLETED' }];
  a.revision += 1;
  writeJson(root, '.ppgp/workstreams/a/state.json', a);
  const doctorCycle = run(['doctor', '--root', root]);
  assert(doctorCycle.stdout.includes('dependency cycle'), 'doctor did not report dependency cycle');
  a.dependencies = [];
  a.revision += 1;
  writeJson(root, '.ppgp/workstreams/a/state.json', a);

  // Abrupt takeover increments generation and preserves claimed checkout.
  a.runState = 'RECOVERY_REQUIRED';
  a.lease = {
    holder: 'codex',
    status: 'RECOVERY_REQUIRED',
    generation: 2,
    claimedAt: new Date().toISOString(),
    expiresAt: null
  };
  a.revision += 1;
  writeJson(root, '.ppgp/workstreams/a/state.json', a);
  run(['workstream', 'recover', 'a', 'claude', '--root', root, '--revision', String(a.revision)]);
  a = readJson(root, '.ppgp/workstreams/a/state.json');
  assert(a.runState === 'RUNNING' && a.lease.generation === 3 && a.lease.holder === 'claude', 'recover did not fence old generation');

  // Close requires verified CLOSED phase and current revision.
  const premature = run(['workstream', 'close', 'a', '--root', root, '--revision', String(a.revision)], false);
  assert(premature.stderr.includes('phase must already be CLOSED'), 'premature close was allowed');
  assert(!fs.existsSync(path.join(root, '.ppgp', '.lock')), 'failed close left stale lock');

  a = readJson(root, '.ppgp/workstreams/a/state.json');
  a.phase = 'CLOSED';
  a.revision += 1;
  writeJson(root, '.ppgp/workstreams/a/state.json', a);
  run(['workstream', 'close', 'a', '--root', root, '--revision', String(a.revision)]);
  assert(readJson(root, '.ppgp/workstreams/a/state.json').runState === 'COMPLETED', 'close did not complete workstream');
  assert(!readJson(root, '.git/ppgp-checkouts.json').claims.some((claim) => claim.workstreamId === 'a'), 'close did not release checkout claim');

  // Generic goal remains forbidden once portfolio state is explicit.
  const ambiguous = run(['goal', 'bad', '--root', root], false);
  assert(ambiguous.stderr.includes('workstream start'), 'goal did not reject portfolio ambiguity');

  // Repository references cannot escape the repository root.
  portfolio = readJson(root, '.ppgp/portfolio.json');
  portfolio.workstreams[0].stateRef = '../outside.json';
  writeJson(root, '.ppgp/portfolio.json', portfolio);
  const traversal = run(['status', '--all', '--root', root], false);
  assert(traversal.stderr.includes('escapes repository root'), 'path traversal reference was accepted');

  console.log('PPGP v0.2 portfolio, CAS, lease, checkout, migration, recovery, authority, dependency, and path-safety tests passed.');
} finally {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
}
