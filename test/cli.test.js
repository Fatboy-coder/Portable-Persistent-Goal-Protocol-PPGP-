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
  if (result.status !== 0) {
    throw new Error(`command failed: ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(repo, rel), 'utf8'));
}

function readText(rel) {
  return fs.readFileSync(path.join(repo, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const pkg = readJson('package.json');
  const version = pkg.version;

  // Legacy/single-workstream CLI remains intact.
  assert(run(['--version']).trim() === version, `version output mismatch: expected ${version}`);
  run(['init', '--root', root]);
  run(['goal', 'Ship', 'the', 'test', '--root', root]);
  const activeGoal = path.join(root, 'docs', 'ACTIVE_GOAL.md');
  assert(fs.existsSync(activeGoal), 'ACTIVE_GOAL was not created');
  assert(run(['status', '--root', root]).includes(`PPGP/${version} status`), 'status protocol header version mismatch');
  assert(run(['status', '--root', root]).includes('goal: Ship the test'), 'status did not recover goal');
  assert(run(['handoff', '--root', root]).includes(`PPGP/${version}`), 'handoff protocol header version mismatch');

  // Platform manifests.
  const claudePlugin = readJson('.claude-plugin/plugin.json');
  const claudeMarketplace = readJson('.claude-plugin/marketplace.json');
  const packagedClaudePlugin = readJson('plugins/ppgp/.claude-plugin/plugin.json');
  const codexPlugin = readJson('.codex-plugin/plugin.json');
  const codexMarketplace = readJson('.agents/plugins/marketplace.json');
  const agentPlugin = readJson('plugin.json');
  const gemini = readJson('gemini-extension.json');

  for (const [name, manifest] of Object.entries({ codexPlugin, agentPlugin, gemini })) {
    assert(manifest.name === 'ppgp', `${name} name mismatch`);
    assert(manifest.version === version, `${name} version mismatch`);
  }

  for (const [name, manifest] of Object.entries({ claudePlugin, packagedClaudePlugin })) {
    assert(manifest.name === 'ppgp', `${name} name mismatch`);
    assert(
      !Object.prototype.hasOwnProperty.call(manifest, 'version'),
      `${name} should not pin a static version; Claude marketplace refresh follows repository revisions`
    );
  }

  assert(claudeMarketplace.name === 'ppgp', 'Claude marketplace name mismatch');
  assert(
    claudeMarketplace.plugins.length === 1 && claudeMarketplace.plugins[0].name === 'ppgp',
    'Claude marketplace plugin mismatch'
  );
  assert(claudeMarketplace.plugins[0].source === './plugins/ppgp', 'Claude marketplace must point to packaged plugin directory');
  assert(fs.existsSync(path.join(repo, 'plugins', 'ppgp', '.claude-plugin', 'plugin.json')), 'packaged Claude plugin manifest missing');

  assert(codexMarketplace.name === 'ppgp', 'Codex marketplace name mismatch');
  assert(
    codexMarketplace.plugins.length === 1 && codexMarketplace.plugins[0].name === 'ppgp',
    'Codex marketplace plugin mismatch'
  );
  assert(codexPlugin.skills === './skills/', 'Codex plugin must use canonical skills directory');

  assert(agentPlugin.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'Agent Plugin schema mismatch');
  const allowedAgentPluginKeys = new Set([
    '$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions'
  ]);
  for (const key of Object.keys(agentPlugin)) {
    assert(allowedAgentPluginKeys.has(key), `Agent Plugin contains unsupported top-level field: ${key}`);
  }

  // Canonical Agent Skill + deterministic mirrors.
  for (const rel of [
    'skills/ppgp/SKILL.md',
    'skills/ppgp/references/PPGP.md',
    'skills/ppgp/references/COORDINATION.md',
    'schemas/portfolio.schema.json',
    'schemas/workstream.schema.json'
  ]) {
    assert(fs.existsSync(path.join(repo, rel)), `required v0.2 artifact missing: ${rel}`);
  }

  const canonicalSkill = readText('skills/ppgp/SKILL.md');
  const canonicalRef = readText('skills/ppgp/references/PPGP.md');
  const canonicalCoord = readText('skills/ppgp/references/COORDINATION.md');

  for (const [label, base] of [
    ['.agents', '.agents/skills/ppgp'],
    ['Claude packaged', 'plugins/ppgp/skills/ppgp']
  ]) {
    assert(readText(`${base}/SKILL.md`) === canonicalSkill, `${label} skill mirror drifted from canonical SKILL.md`);
    assert(readText(`${base}/references/PPGP.md`) === canonicalRef, `${label} reference mirror drifted from canonical PPGP.md`);
    assert(
      readText(`${base}/references/COORDINATION.md`) === canonicalCoord,
      `${label} coordination mirror drifted from canonical COORDINATION.md`
    );
  }

  // Reference schemas remain parseable and explicitly non-v0.1.
  const portfolioSchema = readJson('schemas/portfolio.schema.json');
  const workstreamSchema = readJson('schemas/workstream.schema.json');
  assert(portfolioSchema.properties.schemaVersion.const === '0.2', 'portfolio schema version mismatch');
  assert(workstreamSchema.properties.schemaVersion.const === '0.2', 'workstream schema version mismatch');
  assert(
    workstreamSchema.properties.runState.enum.includes('RECOVERY_REQUIRED'),
    'workstream schema must include RECOVERY_REQUIRED'
  );

  // One current release version across release-facing artifacts.
  const currentVersionChecks = [
    ['README.md', `**Status:** Experimental v${version}`],
    ['README.md', `ppgp-v${version}.zip`],
    ['SPEC.md', `# PPGP Specification v${version}`],
    ['EVALUATION.md', `PPGP v${version} is experimental.`],
    ['CONTRIBUTING.md', `PPGP v${version} is intentionally provisional.`],
    ['COMPATIBILITY.md', `PPGP v${version} remains experimental`],
    ['DISTRIBUTION.md', `PPGP specification ${version}`],
    ['DISTRIBUTION.md', `@fatboy-coder/ppgp@${version}`],
    ['ROADMAP.md', `## v${version}`],
    ['skills/ppgp/SKILL.md', `version: "${version}"`],
    ['skills/ppgp/references/PPGP.md', `# PPGP v${version} Compact Reference`],
    ['CITATION.cff', `version: "${version}"`],
    ['BENCHMARK_PROTOCOL.md', `Protocol under test: PPGP v${version}`],
    ['benchmarks/examples/pair-001-ppgp.json', `"ppgpVersion": "${version}"`]
  ];

  for (const [file, expected] of currentVersionChecks) {
    assert(readText(file).includes(expected), `${file} is not aligned with current version ${version}: missing ${expected}`);
  }

  // Historical stale aliases must not return.
  const readme = readText('README.md');
  const distribution = readText('DISTRIBUTION.md');
  const releaseWorkflow = readText('.github/workflows/publish-release.yml');
  assert(!readme.includes('releases/latest/download/ppgp-v0.1.zip'), 'README still points at stale ppgp-v0.1.zip alias');
  assert(!distribution.includes('npm 0.1.0'), 'DISTRIBUTION still contains stale npm 0.1.0 guidance');
  assert(!releaseWorkflow.includes('protocol_archive=ppgp-v0.1.zip'), 'release workflow must not regenerate a stale protocol-version alias');

  // Repository platform adapters stay outside the npm payload.
  assert(!pkg.files.includes('.agents/'), 'platform adapters must not silently change npm package contents');
  assert(!pkg.files.includes('.claude-plugin/'), 'Claude adapter must not silently change npm package contents');
  assert(!pkg.files.includes('.codex-plugin/'), 'Codex adapter must not silently change npm package contents');
  assert(!pkg.files.includes('plugin.json'), 'Agent Plugin manifest must not silently change npm package contents');
  assert(!pkg.files.includes('gemini-extension.json'), 'Gemini adapter must not silently change npm package contents');
  assert(!pkg.files.includes('plugins/'), 'Claude packaged plugin must not silently change npm package contents');
  assert(pkg.files.includes('schemas/'), 'v0.2 reference schemas must be included in npm package');

  console.log('PPGP CLI, v0.2 schemas, mirror parity, version consistency, and distribution tests passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
