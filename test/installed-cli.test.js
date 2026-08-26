'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ppgp-installed-cli-'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function runNpm(args, options = {}) {
  return run('npm', args, { shell: process.platform === 'win32', ...options });
}

let tarballPath = null;

try {
  const packed = runNpm(['pack', '--silent', '--ignore-scripts'], { cwd: repo });
  assert(packed.status === 0, `npm pack failed:\n${packed.stdout}\n${packed.stderr}`);

  const tarball = packed.stdout.trim().split(/\r?\n/).filter(Boolean).pop();
  assert(tarball, 'npm pack did not return a tarball name');
  tarballPath = path.join(repo, tarball);
  assert(fs.existsSync(tarballPath), `packed tarball missing: ${tarballPath}`);

  fs.writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ private: true }, null, 2));

  const installed = runNpm(
    ['install', tarballPath, '--ignore-scripts', '--no-audit', '--no-fund'],
    { cwd: temp }
  );
  assert(installed.status === 0, `npm install packed tarball failed:\n${installed.stdout}\n${installed.stderr}`);

  const binDir = path.join(temp, 'node_modules', '.bin');
  const shim = path.join(binDir, process.platform === 'win32' ? 'ppgp.cmd' : 'ppgp');
  assert(fs.existsSync(shim), `installed ppgp binary shim missing: ${shim}`);

  const executed = process.platform === 'win32'
    ? run('cmd.exe', ['/d', '/s', '/c', `"${shim}" --version`], { cwd: temp })
    : run(shim, ['--version'], { cwd: temp });

  assert(executed.status === 0, `installed ppgp binary failed:\n${executed.stdout}\n${executed.stderr}`);
  assert(executed.stdout.trim() === pkg.version, `installed ppgp version mismatch: expected ${pkg.version}, got ${executed.stdout.trim()}`);

  console.log(`Installed PPGP CLI smoke test passed on ${process.platform}.`);
} finally {
  if (tarballPath) fs.rmSync(tarballPath, { force: true });
  fs.rmSync(temp, { recursive: true, force: true });
}
