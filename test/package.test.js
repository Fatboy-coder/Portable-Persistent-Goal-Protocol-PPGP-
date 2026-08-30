'use strict';

const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const repo = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8'));
assert(pkg.bin && pkg.bin.ppgp === 'bin/ppgp.js', 'package.json must publish the ppgp CLI binary at bin/ppgp.js');

const packed = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
  cwd: repo,
  encoding: 'utf8',
  shell: process.platform === 'win32'
});

assert(packed.status === 0, `npm pack --dry-run failed:\n${packed.stdout}\n${packed.stderr}`);

let manifest;
try {
  const parsed = JSON.parse(packed.stdout);
  manifest = parsed[0];
} catch (error) {
  throw new Error(`Could not parse npm pack JSON output: ${error.message}\n${packed.stdout}`);
}

const files = new Set((manifest.files || []).map((entry) => entry.path));

for (const required of [
  'bin/ppgp.js',
  'skills/ppgp/SKILL.md',
  'skills/ppgp/references/PPGP.md',
  'skills/ppgp/references/COORDINATION.md',
  'schemas/portfolio.schema.json',
  'schemas/workstream.schema.json',
  'scripts/benchmark-report.js',
  'scripts/prepare-pilot-01.js',
  'benchmarks/result.schema.json',
  'benchmarks/pilot-01/RUNBOOK.md',
  'benchmarks/pilot-01/TASK.md',
  'BENCHMARK_PROTOCOL.md',
  'SPEC.md',
  'EVALUATION.md',
  'CITATION.cff'
]) {
  assert(files.has(required), `published npm package is missing ${required}`);
}

for (const forbidden of [
  '.agents/skills/ppgp/SKILL.md',
  '.codex-plugin/plugin.json',
  '.claude-plugin/plugin.json',
  'plugins/ppgp/skills/ppgp/SKILL.md',
  'gemini-extension.json',
  'plugin.json'
]) {
  assert(!files.has(forbidden), `repository adapter leaked into npm package: ${forbidden}`);
}

console.log('PPGP npm package contents, v0.2 schemas, coordination reference, and CLI bin mapping verified.');
