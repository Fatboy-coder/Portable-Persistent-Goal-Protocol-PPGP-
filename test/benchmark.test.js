'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { validate } = require('../scripts/benchmark-report');

const repo = path.resolve(__dirname, '..');
const examples = path.join(repo, 'benchmarks', 'examples');
const reporter = path.join(repo, 'scripts', 'benchmark-report.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const name of ['pair-001-control.json', 'pair-001-ppgp.json']) {
  const file = path.join(examples, name);
  const run = JSON.parse(fs.readFileSync(file, 'utf8'));
  validate(run, file);
}

const result = spawnSync(process.execPath, [reporter, examples], { encoding: 'utf8' });
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
  const excludedResult = spawnSync(process.execPath, [reporter, temp], { encoding: 'utf8' });
  assert(excludedResult.status === 0, 'excluded-run report failed');
  assert(excludedResult.stdout.includes('Excluded runs: 1'), 'excluded count missing');
  assert(excludedResult.stdout.includes('synthetic infrastructure failure'), 'exclusion reason missing');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log('PPGP benchmark protocol tests passed.');
