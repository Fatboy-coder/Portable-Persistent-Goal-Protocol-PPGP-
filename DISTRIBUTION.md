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

Package name:

```text
ppgp
```

CLI binary:

```text
ppgp
```

Examples after publication:

```bash
npx ppgp init
npx ppgp doctor
npx ppgp goal "Ship the next verified milestone"
npx ppgp status
npx ppgp handoff
```

The npm package also bundles the Agent Skill. `ppgp install-skill <destination>` copies the bundled skill into an explicit destination without assuming a vendor-specific client path.

### First npm publication

The package must exist on npmjs.com before npm Trusted Publishing can be configured.

Bootstrap the first public release from a trusted local machine or with a temporary repository `NPM_TOKEN` secret.

Recommended local bootstrap:

```bash
npm login
npm whoami
npm test
npm pack --dry-run
npm publish --access public
```

The authoritative availability check is the publish itself. A package name can be claimed by another publisher at any time before successful publication.

### npm Trusted Publisher

After `ppgp@0.1.0` exists on npmjs.com, configure the package Trusted Publisher with:

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

The GitHub package is produced from the same npm package contents. The workflow changes only the package scope and registry in an isolated temporary directory before publication.

GitHub Packages is a secondary distribution surface. The public GitHub Release and npmjs.com package remain the lower-friction entry points for users.

## Version mapping

The protocol currently uses specification version `0.1`.

npm-compatible package releases use semantic package version `0.1.0`.

```text
PPGP protocol 0.1
npm package 0.1.0
GitHub package 0.1.0
GitHub release v0.1
```

Package versioning may become identical to protocol versioning once the protocol adopts full three-component semantic versions.
