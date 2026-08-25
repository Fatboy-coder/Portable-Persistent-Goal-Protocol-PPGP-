'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const fixture = path.join(repo, 'benchmarks', 'pilot-01', 'fixture');
const task = path.join(repo, 'benchmarks', 'pilot-01', 'TASK.md');
const outputRoot = path.resolve(process.argv[2] || path.join(repo, '.benchmark-work', 'pilot-01'));

function run(cwd, command, args) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function materialize(name) {
  const target = path.join(outputRoot, name);
  if (fs.existsSync(target)) {
    throw new Error(`Refusing to overwrite existing directory: ${target}`);
  }

  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(fixture, target, { recursive: true });
  fs.copyFileSync(task, path.join(target, 'TASK.md'));

  run(target, 'git', ['init']);
  run(target, 'git', ['add', '.']);
  run(target, 'git', ['-c', 'user.name=PPGP Benchmark', '-c', 'user.email=benchmark@local.invalid', 'commit', '-m', 'benchmark: pilot-01 base fixture']);
  const sha = run(target, 'git', ['rev-parse', 'HEAD']);
  return { target, sha };
}

try {
  if (!fs.existsSync(fixture)) throw new Error(`Fixture not found: ${fixture}`);
  fs.mkdirSync(outputRoot, { recursive: true });

  const control = materialize('pilot-01-control');
  const ppgp = materialize('pilot-01-ppgp');

  if (control.sha !== ppgp.sha) {
    throw new Error(`Base commits differ: control=${control.sha} ppgp=${ppgp.sha}`);
  }

  console.log('PPGP Pilot 01 repositories materialized.');
  console.log(`CONTROL: ${control.target}`);
  console.log(`PPGP:    ${ppgp.target}`);
  console.log(`BASE:    ${control.sha}`);
  console.log('Next: follow benchmarks/pilot-01/RUNBOOK.md.');
} catch (error) {
  console.error(`PPGP Pilot 01 preparation failed: ${error.message}`);
  process.exit(1);
}
