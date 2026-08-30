# PPGP Distribution

PPGP is intentionally distributed through multiple channels. The protocol and canonical Agent Skill remain vendor-neutral; platform-native manifests are thin adapters for discovery and installation.

Canonical protocol skill:

```text
skills/ppgp/SKILL.md
skills/ppgp/references/PPGP.md
skills/ppgp/references/COORDINATION.md
```

`COORDINATION.md` is progressively disclosed. Ordinary single-workstream use does not need to load it.

Generated mirrors exist under `.agents/skills/ppgp/` and `plugins/ppgp/skills/ppgp/`. `npm test` enforces parity with the canonical skill/reference files.

See [`COMPATIBILITY.md`](./COMPATIBILITY.md) for platform-specific verification state.

## Universal Agent Skills route

```bash
npx skills add https://github.com/Fatboy-coder/ppgp/tree/main/skills/ppgp
```

This remains the preferred portable skill source.

## Platform adapters

### Anthropic Claude / Claude Code

```text
.claude-plugin/plugin.json
.claude-plugin/marketplace.json
plugins/ppgp/.claude-plugin/plugin.json
plugins/ppgp/skills/ppgp/
```

The packaged Claude skill is a deterministic mirror because installed plugins may be copied into client cache.

### OpenAI Codex / ChatGPT

```text
.codex-plugin/plugin.json
.agents/plugins/marketplace.json
skills/ppgp/
```

Repository packaging is distinct from vendor submission, approval and public listing.

### Gemini CLI

```text
gemini-extension.json
skills/ppgp/
```

### Cursor / open Agent Plugin format

```text
plugin.json
skills/ppgp/
```

### Repository-native Agent Skills discovery

```text
.agents/skills/ppgp/
```

This supports clients that discover the cross-agent `.agents/skills/` convention without creating a semantic fork.

## Reference implementation artifacts

PPGP v0.2.0 adds reference JSON Schemas:

```text
schemas/portfolio.schema.json
schemas/workstream.schema.json
```

These schemas document the official CLI representation. They are shipped in the npm package but are not a protocol-core storage requirement.

The reference CLI may create project state:

```text
.ppgp/
├── portfolio.json
└── workstreams/
    └── <id>/
        ├── state.json
        └── notes.md
```

Local checkout claims intentionally live outside committed project state in the Git common directory.

## GitHub Release

The v0.2.0 release asset name is:

```text
ppgp-v0.2.0.zip
```

A SHA-256 checksum SHOULD accompany the archive.

The release workflow must validate the requested version against committed `package.json` before creating the immutable tag/release.

## npm

Canonical public package:

```text
@fatboy-coder/ppgp
```

Target current package release:

```text
@fatboy-coder/ppgp@0.2.0
```

The original unscoped name `ppgp` is not used because npm similarity protection rejected it.

CLI binary:

```text
ppgp
```

Examples:

```bash
npx @fatboy-coder/ppgp init
npx @fatboy-coder/ppgp doctor
npx @fatboy-coder/ppgp goal "Ship the next verified milestone"
npx @fatboy-coder/ppgp status
npx @fatboy-coder/ppgp status --all
```

Explicit npm-exec form:

```bash
npm exec --yes --package=@fatboy-coder/ppgp@0.2.0 -- ppgp --version
```

PowerShell fallback when npm's wrapper mishandles forwarded arguments:

```powershell
npm.cmd exec --yes --package=@fatboy-coder/ppgp@0.2.0 -- ppgp --version
```

Expected output after publication:

```text
0.2.0
```

Global install:

```bash
npm install -g @fatboy-coder/ppgp@0.2.0
ppgp --version
```

Inside source checkout:

```bash
node ./bin/ppgp.js --version
```

The npm package bundles:

- CLI;
- canonical Agent Skill and references;
- v0.2 reference schemas;
- specification/evaluation/citation files;
- benchmark protocol, reporter and Pilot 01 preparation tooling.

Repository-native adapter manifests remain excluded from npm payload.

## npm Trusted Publisher

Publishing uses GitHub Actions and npm Trusted Publishing/OIDC via `.github/workflows/publish-npm.yml`.

Long-lived npm automation tokens are not required when trusted publishing is correctly configured.

## GitHub Packages

Published package name:

```text
@fatboy-coder/ppgp
```

GitHub Packages remains a secondary distribution surface produced from the same source package contents.

## Release automation

Intended chain:

```text
Publish PPGP release
        ↓ workflow_run
Publish PPGP to npm
        ↓ workflow_run
Publish PPGP to GitHub Packages
```

The release workflow validates version consistency before creating the tag and release. Downstream package workflows re-check the canonical release and package version.

## Validation

`npm test` must validate at least:

- legacy single-workstream CLI compatibility;
- v0.2 portfolio/workstream coordination behavior;
- stale revision rejection and lock cleanup;
- lease generation takeover;
- checkout collision protection;
- dependency-cycle detection;
- reversible migration;
- canonical skill/reference existence;
- coordination-reference mirrors remain byte-identical;
- platform manifests parse and versioned adapters align;
- reference schemas ship in npm payload;
- repository adapters do not silently enter npm payload;
- public documentation/citation metadata stay aligned with package version.

CI runs on Linux and Windows and includes an installed-package CLI smoke test.

## Version mapping

PPGP specification 0.2.0 and versioned distribution artifacts use one canonical current release version:

```text
PPGP specification 0.2.0
npm package @fatboy-coder/ppgp@0.2.0
GitHub package @fatboy-coder/ppgp@0.2.0
Codex/Gemini/Agent Plugin adapters 0.2.0
Agent Skill metadata 0.2.0
GitHub release v0.2.0
```

Claude's repository-backed plugin manifest intentionally does not pin a static version because repository refresh follows revisions. This is an adapter caching policy, not a second PPGP version.

Historical release numbers remain in `CHANGELOG.md`. Benchmark result-schema versions are independent schema identifiers and are not PPGP release versions.
