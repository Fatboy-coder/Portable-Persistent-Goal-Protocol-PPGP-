# PPGP Distribution

PPGP is intentionally distributed through multiple channels. Each channel serves a different use case.

## GitHub Release

Purpose: zero-friction download of the installable Agent Skill archive.

Canonical asset:

```text
ppgp-v0.1.zip
```

## Agent Skills

Purpose: direct installation into Agent Skills-compatible environments.

```bash
npx skills add https://github.com/Fatboy-coder/ppgp/tree/main/skills/ppgp
```

## npm

Purpose: public CLI discovery and zero-install execution.

Canonical public package name:

```text
@fatboy-coder/ppgp
```

The original unscoped name `ppgp` is intentionally not used because npm's similarity protection rejects it as too close to existing high-traffic package names. The scoped package keeps the PPGP identity while avoiding namespace ambiguity.

CLI binary:

```text
ppgp
```

Zero-install examples:

```bash
npx @fatboy-coder/ppgp init
npx @fatboy-coder/ppgp doctor
npx @fatboy-coder/ppgp goal "Ship the next verified milestone"
npx @fatboy-coder/ppgp status
npx @fatboy-coder/ppgp handoff
```

Global installation keeps the shorter executable:

```bash
npm install -g @fatboy-coder/ppgp
ppgp init
```

The npm package also bundles the Agent Skill. `ppgp install-skill <destination>` copies the bundled skill into an explicit destination without assuming a vendor-specific client path.

### First npm publication

Create the npm organization `fatboy-coder` first. The organization name becomes the npm scope `@fatboy-coder`.

Use npm's free public-package organization plan. Then publish the first package from an authenticated trusted local machine:

```bash
npm login --auth-type=web
npm whoami
npm test
npm pack --dry-run
npm publish --access public
```

### npm Trusted Publisher

After `@fatboy-coder/ppgp@0.1.0` exists on npmjs.com, configure the package Trusted Publisher with:

```text
Provider: GitHub Actions
GitHub user or organization: Fatboy-coder
Repository: ppgp
Workflow filename: publish-npm.yml
Allowed action: npm publish
Environment: none
```

The workflow is `.github/workflows/publish-npm.yml` and requests `id-token: write` for OIDC authentication.

After one successful OIDC publication, restrict traditional token publishing in npm package settings and revoke any temporary automation token used for bootstrap.

## GitHub Packages

Purpose: presence inside the GitHub package ecosystem and a package directly associated with the repository.

Published package name:

```text
@fatboy-coder/ppgp
```

The GitHub package is produced from the same npm package contents and published to GitHub's npm registry.

GitHub Packages is a secondary distribution surface. The public GitHub Release and npmjs.com package remain the lower-friction entry points for users.

## Version mapping

The protocol currently uses specification version `0.1`.

npm-compatible package releases use semantic package version `0.1.0`.

```text
PPGP protocol 0.1
npm package @fatboy-coder/ppgp@0.1.0
GitHub package @fatboy-coder/ppgp@0.1.0
GitHub release v0.1
```

Package versioning may become identical to protocol versioning once the protocol adopts full three-component semantic versions.
