'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { validate } = require('../scripts/benchmark-report');

const repo = path.resolve(__dirname, '..');
const examples = path.join(repo, 'benchmarks', 'examples');
const reporter = path.join(repo, 'scripts', 'benchmark-report.js');
const pilotFixture = path.join(repo, 'benchmarks', 'pilot-01', 'fixture');
const pilotPrepare = path.join(repo, 'scripts', 'prepare-pilot-01.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

for (const name of ['pair-001-control.json', 'pair-001-ppgp.json']) {
  const file = path.join(examples, name);
  const runRecord = JSON.parse(fs.readFileSync(file, 'utf8'));
  validate(runRecord, file);
}

const result = run(process.execPath, [reporter, examples]);
assert(result.status === 0, `benchmark reporter failed:\n${result.stdout}\n${result.stderr}`);
assert(result.stdout.includes('# PPGP Recovery Benchmark Report'), 'report heading missing');
assert(result.stdout.includes('| Successful + verified recoveries | 0/1 | 1/1 |'), 'aggregate recovery row mismatch');
assert(result.stdout.includes('| Human reconstruction messages, total | 1 | 0 |'), 'human reconstruction row mismatch');
assert(result.stdout.includes('This report is descriptive.'), 'interpretation constraint missing');

const invalid = JSON.parse(fs.readFileSync(path.join(examples, 'pair-001-ppgp.json'), 'utf8'));
invalid.ppgpVersion = null;
let rejected = false;
try {
  validate(invalid, 'invalid.json');
} catch (error) {
  rejected = /ppgpVersion required/.test(error.message);
}
assert(rejected, 'PPGP record without ppgpVersion must fail validation');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ppgp-benchmark-'));
try {
  const excluded = JSON.parse(fs.readFileSync(path.join(examples, 'pair-001-control.json'), 'utf8'));
  excluded.pairId = 'pair-excluded';
  excluded.excluded = true;
  excluded.exclusionReason = 'synthetic infrastructure failure';
  fs.writeFileSync(path.join(temp, 'excluded.json'), JSON.stringify(excluded, null, 2));
  const excludedResult = run(process.execPath, [reporter, temp]);
  assert(excludedResult.status === 0, 'excluded-run report failed');
  assert(excludedResult.stdout.includes('Excluded runs: 1'), 'excluded count missing');
  assert(excludedResult.stdout.includes('synthetic infrastructure failure'), 'exclusion reason missing');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

assert(fs.existsSync(path.join(repo, 'benchmarks', 'pilot-01', 'TASK.md')), 'pilot-01 task missing');
assert(fs.existsSync(path.join(repo, 'benchmarks', 'pilot-01', 'RUNBOOK.md')), 'pilot-01 runbook missing');
for (const rel of ['package.json', 'src/errors.js', 'src/project-store.js', 'src/audit-log.js', 'src/project-service.js', 'test/project-service.test.js']) {
  assert(fs.existsSync(path.join(pilotFixture, rel)), `pilot-01 fixture missing ${rel}`);
}

const fixtureTest = run(process.execPath, ['--test'], { cwd: pilotFixture });
assert(fixtureTest.status !== 0, 'pilot-01 starting fixture must be red before agent implementation');
assert(`${fixtureTest.stdout}\n${fixtureTest.stderr}`.includes('Not implemented'), 'pilot-01 fixture should expose the unimplemented rename path');

const ProjectStore = require(path.join(pilotFixture, 'src', 'project-store'));
const aliasStore = new ProjectStore.ProjectStore([{ id: 'p', name: 'Before', version: 1 }]);
const leaked = aliasStore.get('p');
leaked.name = 'After';
assert(aliasStore.get('p').name === 'After', 'pilot-01 fixture must preserve the intended live-reference blocker at baseline');

const materializedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ppgp-pilot-materialize-'));
try {
  const prepared = run(process.execPath, [pilotPrepare, materializedRoot]);
  assert(prepared.status === 0, `pilot-01 preparation failed:\n${prepared.stdout}\n${prepared.stderr}`);

  const control = path.join(materializedRoot, 'pilot-01-control');
  const treatment = path.join(materializedRoot, 'pilot-01-ppgp');
  for (const directory of [control, treatment]) {
    assert(fs.existsSync(path.join(directory, '.git')), `materialized repo missing Git history: ${directory}`);
    assert(fs.existsSync(path.join(directory, 'TASK.md')), `materialized repo missing TASK.md: ${directory}`);
  }

  const controlSha = run('git', ['rev-parse', 'HEAD'], { cwd: control });
  const treatmentSha = run('git', ['rev-parse', 'HEAD'], { cwd: treatment });
  const controlTree = run('git', ['rev-parse', 'HEAD^{tree}'], { cwd: control });
  const treatmentTree = run('git', ['rev-parse', 'HEAD^{tree}'], { cwd: treatment });
  assert(controlSha.status === 0 && treatmentSha.status === 0, 'materialized base commit lookup failed');
  assert(controlTree.status === 0 && treatmentTree.status === 0, 'materialized tree lookup failed');
  assert(controlSha.stdout.trim() === treatmentSha.stdout.trim(), 'pilot-01 deterministic base commit differs between conditions');
  assert(controlTree.stdout.trim() === treatmentTree.stdout.trim(), 'pilot-01 fixture trees differ between conditions');
} finally {
  fs.rmSync(materializedRoot, { recursive: true, force: true });
}

console.log('PPGP benchmark protocol tests passed.');
