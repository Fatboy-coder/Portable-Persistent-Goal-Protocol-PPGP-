# PPGP Platform Compatibility

PPGP keeps one canonical protocol skill at `skills/ppgp/` and adds only thin distribution adapters around it.

Status vocabulary:

- **VERIFIED CLIENT**: install/discovery/invocation has been manually verified in the real client.
- **VERIFIED FORMAT**: repository artifact matches the platform's documented format and is covered by PPGP validation.
- **REPOSITORY NATIVE**: the platform can discover the committed repository skill through a documented standard path.
- **IMPORT READY**: the platform can import or install the canonical public skill/repository, but a client-side smoke test is still required.
- **STRUCTURALLY READY**: manifests are present and validated, but marketplace/client discovery still needs a manual external test.
- **EXTERNAL SUBMISSION REQUIRED**: repository work is complete; public directory listing needs a vendor-side submission or approval.
- **DOCUMENTATION ONLY**: no stable first-class adapter was added in this iteration.

| Platform | Native mechanism | PPGP artifact | Status | Remaining external action |
| --- | --- | --- | --- | --- |
| Anthropic Claude Code | Plugin + self-hosted marketplace | `.claude-plugin/marketplace.json`, `plugins/ppgp/` | VERIFIED CLIENT | After install/update run `/reload-plugins`; marketplace plugin skill invocation is `/ppgp:ppgp` |
| OpenAI Codex | Plugin + repo marketplace | `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `skills/ppgp/` | STRUCTURALLY READY | Import/test in Codex; public Plugin Directory listing is external |
| OpenAI ChatGPT | Agent Skills / skill-only plugins | `skills/ppgp/` and Codex/OpenAI plugin package | IMPORT READY | Upload/import the skill or submit the plugin for public directory availability |
| Google Gemini CLI | Gemini Extension + Agent Skills | `gemini-extension.json`, `skills/ppgp/` | STRUCTURALLY READY | Run `gemini extensions install https://github.com/Fatboy-coder/ppgp --auto-update` |
| Cursor | Agent Plugins + Agent Skills | `plugin.json`, `skills/ppgp/` | STRUCTURALLY READY | Local plugin smoke test; marketplace publication is external |
| GitHub Copilot | Agent Skills | `.agents/skills/ppgp/` generated mirror | REPOSITORY NATIVE | Open a repo with Copilot and verify discovery |
| Windsurf | Agent Skills | `.agents/skills/ppgp/` generated mirror | REPOSITORY NATIVE | Open a repo with Windsurf and verify discovery |
| Devin | Agent Skills | `.agents/skills/ppgp/` generated mirror | REPOSITORY NATIVE | Connect/open the repo in Devin and verify discovery |
| Kiro | Agent Skills import | canonical GitHub `skills/ppgp/` | IMPORT READY | Import the public GitHub skill in Kiro |
| Cline | Agent Skills | canonical `skills/ppgp/` | IMPORT READY | Install/copy into a supported Cline skills directory and smoke-test |
| JetBrains Junie | Agent Skills | canonical `skills/ppgp/` | IMPORT READY | Import/copy into Junie's skills location and smoke-test |
| Roo Code | Agent Skills-compatible workflow when available in the installed client | canonical `skills/ppgp/` | DOCUMENTATION ONLY | Confirm the installed Roo version's official skill discovery path before adding an adapter |
| Amazon Q Developer | No PPGP-specific stable adapter validated in this iteration | canonical protocol remains usable manually | DOCUMENTATION ONLY | Re-evaluate when a stable official Agent Skills/plugin surface is confirmed |

## Canonical skill and generated mirror

The source of truth is always:

```text
skills/ppgp/SKILL.md
skills/ppgp/references/PPGP.md
```

For clients that natively discover the cross-agent `.agents/skills/` convention, PPGP also commits:

```text
.agents/skills/ppgp/SKILL.md
.agents/skills/ppgp/references/PPGP.md
```

The `.agents/skills/ppgp/` tree is a generated compatibility mirror, not an independent implementation. `npm test` fails if either mirrored file drifts from the canonical source.

Claude's marketplace adapter is packaged under `plugins/ppgp/` because Claude copies installed plugins into its cache. The packaged skill is also a deterministic mirror of the canonical skill and is drift-tested.

Claude Code namespaces plugin skills as `/plugin-name:skill-name`. Because both the PPGP plugin and its skill are named `ppgp`, the marketplace invocation is therefore:

```text
/ppgp:ppgp
```

An unnamespaced `/ppgp` is a standalone-skill route, not the marketplace-plugin route. Claude Code documents personal standalone skills under `~/.claude/skills/<skill-name>/SKILL.md` and project skills under `.claude/skills/<skill-name>/SKILL.md`.

## Adapter principles

1. Protocol semantics remain vendor-neutral.
2. A platform manifest may describe PPGP, but may not fork the protocol.
3. Prefer direct use of `skills/ppgp/` over copies.
4. When a second path is required for discovery, keep it deterministic and drift-tested.
5. Marketplace readiness, submission, approval, and public listing are distinct states.
6. Do not claim a client is verified merely because a manifest exists.
7. For repository-backed Claude marketplace installs, plugin refresh should follow repository revisions rather than a stale fixed adapter version.
8. Document platform-native invocation names exactly rather than projecting the canonical skill name onto vendor namespace rules.

## Public marketplace state

Repository-side packaging does not imply vendor endorsement or public listing.

Current state after this iteration:

- Claude self-hosted marketplace: installation and namespaced `/ppgp:ppgp` invocation are supported by the packaged plugin layout; after an install/update, use `/reload-plugins` when Claude requests activation. Public Anthropic listing is not claimed.
- OpenAI/Codex plugin package: structurally ready, public Plugin Directory submission not claimed.
- Cursor Agent Plugin: structurally ready, Cursor Marketplace submission not claimed.
- Gemini extension: structurally ready, manual CLI install test required.

PPGP v0.1.2 remains experimental regardless of distribution surface.
