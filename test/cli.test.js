'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cli = path.resolve(__dirname, '..', 'bin', 'ppgp.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ppgp-cli-'));

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`command failed: ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

try {
  if (!run(['--version']).includes('0.1.0')) throw new Error('version output mismatch');
  run(['init', '--root', root]);
  run(['goal', 'Ship', 'the', 'test', '--root', root]);
  const activeGoal = path.join(root, 'docs', 'ACTIVE_GOAL.md');
  if (!fs.existsSync(activeGoal)) throw new Error('ACTIVE_GOAL was not created');
  if (!run(['status', '--root', root]).includes('goal: Ship the test')) throw new Error('status did not recover goal');
  if (!run(['handoff', '--root', root]).includes('PPGP/0.1')) throw new Error('handoff header missing');
  console.log('PPGP CLI tests passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
