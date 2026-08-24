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

### npm publishing security

The first npm publication may use a repository `NPM_TOKEN` secret or a local authenticated publish.

After the package exists on npmjs.com, configure `.github/workflows/publish-npm.yml` as the package's npm Trusted Publisher. npm Trusted Publishing uses GitHub OIDC instead of a long-lived registry token and automatically supplies provenance for public packages published from public repositories.

Once Trusted Publishing is verified, remove the repository `NPM_TOKEN` secret.

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
