'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const source = path.join(repo, 'skills', 'ppgp');
const destination = path.join(repo, '.agents', 'skills', 'ppgp');

if (!fs.existsSync(source)) {
  throw new Error(`Canonical skill not found: ${source}`);
}

fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });

console.log(`Synced ${path.relative(repo, source)} -> ${path.relative(repo, destination)}`);
