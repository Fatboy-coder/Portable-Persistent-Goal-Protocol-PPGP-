'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const cli = path.join(repo, 'bin', 'ppgp.js');
function assert(x, m) { if (!x) throw new Error(m); }
function run(args, ok = true) {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  if (ok && r.status !== 0) throw new Error(`FAILED ${args.join(' ')}\n${r.stdout}\n${r.stderr}`);
  if (!ok && r.status === 0) throw new Error(`EXPECTED FAILURE ${args.join(' ')}\n${r.stdout}`);
  return r;
}
function git(root, args) {
  const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
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
function j(root, rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
function w(root, rel, obj) { fs.writeFileSync(path.join(root, rel), `${JSON.stringify(obj, null, 2)}\n`); }

const roots = [];
try {
  const legacy = makeRepo(); roots.push(legacy);
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

  const root = makeRepo(); roots.push(root);
  run(['workstream', 'start', 'a', 'Workstream A', '--root', root, '--branch', 'master']);
  run(['workstream', 'start', 'b', 'Workstream B', '--root', root, '--branch', 'master']);
  let portfolio = j(root, '.ppgp/portfolio.json');
  assert(portfolio.workstreams.length === 2 && portfolio.revision === 2, 'portfolio revision mismatch');

  run(['workstream', 'handoff', 'a', 'codex', '--root', root, '--revision', '0']);
  let a = j(root, '.ppgp/workstreams/a/state.json');
  assert(a.runState === 'RUNNING' && a.lease.generation === 1, 'first lease incorrect');
  const conflict = run(['workstream', 'park', 'a', '--root', root, '--revision', '0'], false);
  assert(conflict.stderr.includes('Revision conflict'), 'stale revision was not rejected');
  assert(!fs.existsSync(path.join(root, '.ppgp', '.lock')), 'CAS failure left a stale lock');

  run(['checkout', 'claim', 'a', root, '--root', root]);
  assert(fs.existsSync(path.join(root, '.git', 'ppgp-checkouts.json')), 'checkout registry not stored in git common dir');
  run(['workstream', 'handoff', 'b', 'claude', '--root', root]);
  const collision = run(['checkout', 'claim', 'b', root, '--root', root], false);
  assert(collision.stderr.includes('already claimed by a'), 'checkout collision not rejected');

  run(['workstream', 'handoff', 'a', 'claude', '--root', root, '--revision', '1']);
  a = j(root, '.ppgp/workstreams/a/state.json');
  assert(a.lease.generation === 2 && a.lease.holder === 'claude', 'lease generation did not increment');

  a.runState = 'WAITING'; a.lease = null; a.revision += 1;
  a.waitConditions = [
    { id: 'ssh', kind: 'EXTERNAL', scope: 'ACTION', dependency: 'SSH coordinates', resumeCondition: 'coordinates available' },
    { id: 'spend', kind: 'AUTHORITY', scope: 'ACTION', dependency: 'paid compute approval', resumeCondition: 'authority granted' }
  ];
  w(root, '.ppgp/workstreams/a/state.json', a);
  let status = run(['status', '--all', '--root', root]).stdout;
  assert(status.includes('portfolio_state: RUNNING'), 'independent running workstream should keep portfolio running');
  assert(status.includes('EXTERNAL/ACTION:ssh') && status.includes('AUTHORITY/ACTION:spend'), 'mixed waits were collapsed or lost');

  let b = j(root, '.ppgp/workstreams/b/state.json');
  b.runState = 'RUNNABLE'; b.lease = null; b.dependencies = [{ workstream: 'a', condition: 'COMPLETED' }]; b.revision += 1;
  w(root, '.ppgp/workstreams/b/state.json', b);
  status = run(['status', '--all', '--root', root]).stdout;
  assert(status.includes('portfolio_state: WAITING'), 'unsatisfied dependency plus waiting prerequisite should aggregate WAITING');

  a.dependencies = [{ workstream: 'b', condition: 'COMPLETED' }]; a.revision += 1;
  w(root, '.ppgp/workstreams/a/state.json', a);
  const doctorCycle = run(['doctor', '--root', root]);
  assert(doctorCycle.stdout.includes('dependency cycle'), 'doctor did not report dependency cycle');
  a.dependencies = []; a.revision += 1; w(root, '.ppgp/workstreams/a/state.json', a);

  a.runState = 'RECOVERY_REQUIRED';
  a.lease = { holder: 'codex', status: 'RECOVERY_REQUIRED', generation: 2, claimedAt: new Date().toISOString(), expiresAt: null };
  a.revision += 1; w(root, '.ppgp/workstreams/a/state.json', a);
  run(['workstream', 'recover', 'a', 'claude', '--root', root, '--revision', String(a.revision)]);
  a = j(root, '.ppgp/workstreams/a/state.json');
  assert(a.runState === 'RUNNING' && a.lease.generation === 3 && a.lease.holder === 'claude', 'recover did not fence old generation');

  const premature = run(['workstream', 'close', 'a', '--root', root], false);
  assert(premature.stderr.includes('phase must already be CLOSED'), 'premature close was allowed');
  a = j(root, '.ppgp/workstreams/a/state.json'); a.phase = 'CLOSED'; a.revision += 1; w(root, '.ppgp/workstreams/a/state.json', a);
  run(['workstream', 'close', 'a', '--root', root, '--revision', String(a.revision)]);
  assert(j(root, '.ppgp/workstreams/a/state.json').runState === 'COMPLETED', 'close did not complete workstream');
  assert(!j(root, '.git/ppgp-checkouts.json').claims.some((c) => c.workstreamId === 'a'), 'close did not release checkout claim');

  const ambiguous = run(['goal', 'bad', '--root', root], false);
  assert(ambiguous.stderr.includes('workstream start'), 'goal did not reject portfolio ambiguity');

  console.log('PPGP v0.2 portfolio, lease, checkout, migration, recovery, and CAS tests passed.');
} finally {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
}
