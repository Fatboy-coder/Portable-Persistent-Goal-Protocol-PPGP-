'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const cli = path.join(repo, 'bin', 'ppgp.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ppgp-cli-'));

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`command failed: ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(repo, rel), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const pkg = readJson('package.json');
  assert(run(['--version']).trim() === pkg.version, `version output mismatch: expected ${pkg.version}`);
  run(['init', '--root', root]);
  run(['goal', 'Ship', 'the', 'test', '--root', root]);
  const activeGoal = path.join(root, 'docs', 'ACTIVE_GOAL.md');
  assert(fs.existsSync(activeGoal), 'ACTIVE_GOAL was not created');
  assert(run(['status', '--root', root]).includes('goal: Ship the test'), 'status did not recover goal');
  assert(run(['handoff', '--root', root]).includes('PPGP/0.1'), 'handoff header missing');

  const claudePlugin = readJson('.claude-plugin/plugin.json');
  const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
  const packagedClaudePlugin = readJson('plugins/ppgp/.claude-plugin/plugin.json');
  const codexPlugin = readJson('.codex-plugin/plugin.json');
  const codexMarketplace = readJson('.agents/plugins/marketplace.json');
  const agentPlugin = readJson('plugin.json');
  const gemini = readJson('gemini-extension.json');

  for (const [name, manifest] of Object.entries({ codexPlugin, agentPlugin, gemini })) {
    assert(manifest.name === 'ppgp', `${name} name mismatch`);
    assert(manifest.version === pkg.version, `${name} version mismatch`);
  }

  for (const [name, manifest] of Object.entries({ claudePlugin, packagedClaudePlugin })) {
    assert(manifest.name === 'ppgp', `${name} name mismatch`);
    assert(!Object.prototype.hasOwnProperty.call(manifest, 'version'), `${name} should not pin a static version; Claude marketplace refresh follows repository revisions`);
  }

  assert(claudeMarketplace.name === 'ppgp', 'Claude marketplace name mismatch');
  assert(claudeMarketplace.plugins.length === 1 && claudeMarketplace.plugins[0].name === 'ppgp', 'Claude marketplace plugin mismatch');
  assert(claudeMarketplace.plugins[0].source === './plugins/ppgp', 'Claude marketplace must point to packaged plugin directory');
  assert(fs.existsSync(path.join(repo, 'plugins', 'ppgp', '.claude-plugin', 'plugin.json')), 'packaged Claude plugin manifest missing');

  assert(codexMarketplace.name === 'ppgp', 'Codex marketplace name mismatch');
  assert(codexMarketplace.plugins.length === 1 && codexMarketplace.plugins[0].name === 'ppgp', 'Codex marketplace plugin mismatch');
  assert(codexPlugin.skills === './skills/', 'Codex plugin must use canonical skills directory');

  assert(agentPlugin.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'Agent Plugin schema mismatch');
  const allowedAgentPluginKeys = new Set(['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions']);
  for (const key of Object.keys(agentPlugin)) {
    assert(allowedAgentPluginKeys.has(key), `Agent Plugin contains unsupported top-level field: ${key}`);
  }

  assert(fs.existsSync(path.join(repo, 'skills', 'ppgp', 'SKILL.md')), 'canonical skill missing');
  assert(fs.existsSync(path.join(repo, 'skills', 'ppgp', 'references', 'PPGP.md')), 'canonical reference missing');

  const canonicalSkill = fs.readFileSync(path.join(repo, 'skills', 'ppgp', 'SKILL.md'), 'utf8');
  const agentsSkill = fs.readFileSync(path.join(repo, '.agents', 'skills', 'ppgp', 'SKILL.md'), 'utf8');
  const claudeSkill = fs.readFileSync(path.join(repo, 'plugins', 'ppgp', 'skills', 'ppgp', 'SKILL.md'), 'utf8');
  const canonicalRef = fs.readFileSync(path.join(repo, 'skills', 'ppgp', 'references', 'PPGP.md'), 'utf8');
  const agentsRef = fs.readFileSync(path.join(repo, '.agents', 'skills', 'ppgp', 'references', 'PPGP.md'), 'utf8');
  const claudeRef = fs.readFileSync(path.join(repo, 'plugins', 'ppgp', 'skills', 'ppgp', 'references', 'PPGP.md'), 'utf8');
  assert(canonicalSkill === agentsSkill, '.agents skill mirror drifted from canonical SKILL.md');
  assert(canonicalRef === agentsRef, '.agents reference mirror drifted from canonical PPGP.md');
  assert(canonicalSkill === claudeSkill, 'Claude packaged skill mirror drifted from canonical SKILL.md');
  assert(canonicalRef === claudeRef, 'Claude packaged reference mirror drifted from canonical PPGP.md');

  assert(!pkg.files.includes('.agents/'), 'platform adapters must not silently change npm package contents');
  assert(!pkg.files.includes('.claude-plugin/'), 'Claude adapter must not silently change npm package contents');
  assert(!pkg.files.includes('.codex-plugin/'), 'Codex adapter must not silently change npm package contents');
  assert(!pkg.files.includes('plugin.json'), 'Agent Plugin manifest must not silently change npm package contents');
  assert(!pkg.files.includes('gemini-extension.json'), 'Gemini adapter must not silently change npm package contents');
  assert(!pkg.files.includes('plugins/'), 'Claude packaged plugin must not silently change npm package contents');

  console.log('PPGP CLI and distribution tests passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
