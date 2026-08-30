# PPGP Platform Compatibility

PPGP keeps one canonical protocol skill at `skills/ppgp/` and adds only thin distribution adapters around it.

PPGP v0.2.0 remains experimental regardless of distribution surface.

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
| Anthropic Claude / Claude Code | Plugin + self-hosted marketplace | `.claude-plugin/marketplace.json`, `plugins/ppgp/` | VERIFIED CLIENT | Tested Claude client invokes `/ppgp`; Claude Code may expose `/ppgp:ppgp`; public Anthropic listing is not claimed |
| OpenAI Codex | Plugin + repo marketplace | `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `skills/ppgp/` | STRUCTURALLY READY | Import/test in Codex; public Plugin Directory listing is external |
| OpenAI ChatGPT | Agent Skills / skill-only plugins | `skills/ppgp/` and Codex/OpenAI plugin package | IMPORT READY | Upload/import the skill or submit the plugin for public directory availability |
| Google Gemini CLI | Gemini Extension + Agent Skills | `gemini-extension.json`, `skills/ppgp/` | STRUCTURALLY READY | Run the documented Gemini extension install and smoke-test |
| Cursor | Agent Plugins + Agent Skills | `plugin.json`, `skills/ppgp/` | STRUCTURALLY READY | Local plugin smoke test; marketplace publication is external |
| GitHub Copilot | Agent Skills | `.agents/skills/ppgp/` generated mirror | REPOSITORY NATIVE | Open a repo with Copilot and verify discovery |
| Windsurf | Agent Skills | `.agents/skills/ppgp/` generated mirror | REPOSITORY NATIVE | Open a repo with Windsurf and verify discovery |
| Devin | Agent Skills | `.agents/skills/ppgp/` generated mirror | REPOSITORY NATIVE | Connect/open the repo in Devin and verify discovery |
| Kiro | Agent Skills import | canonical GitHub `skills/ppgp/` | IMPORT READY | Import the public GitHub skill in Kiro |
| Cline | Agent Skills | canonical `skills/ppgp/` | IMPORT READY | Install/copy into a supported Cline skills directory and smoke-test |
| JetBrains Junie | Agent Skills | canonical `skills/ppgp/` | IMPORT READY | Import/copy into Junie's skills location and smoke-test |
| Roo Code | Agent Skills-compatible workflow when available | canonical `skills/ppgp/` | DOCUMENTATION ONLY | Confirm the installed client's official skill discovery path before adding an adapter |
| Amazon Q Developer | No PPGP-specific stable adapter validated | canonical protocol remains usable manually | DOCUMENTATION ONLY | Re-evaluate when a stable official Agent Skills/plugin surface is confirmed |

## Canonical skill and generated mirrors

The source of truth is:

```text
skills/ppgp/SKILL.md
skills/ppgp/references/PPGP.md
skills/ppgp/references/COORDINATION.md
```

`COORDINATION.md` is progressively disclosed and should only be loaded when multi-workstream ownership, checkout conflicts, scoped waits, or takeover make it relevant.

For clients that discover `.agents/skills/`, PPGP also commits:

```text
.agents/skills/ppgp/SKILL.md
.agents/skills/ppgp/references/PPGP.md
.agents/skills/ppgp/references/COORDINATION.md
```

The `.agents/skills/ppgp/` tree is a deterministic compatibility mirror, not an independent implementation. `npm test` fails if mirrored skill/reference content drifts from canonical source.

Claude's marketplace adapter is packaged under `plugins/ppgp/` because Claude copies installed plugins into its cache. Its packaged skill and references are deterministic mirrors as well.

## Reference implementation versus protocol core

PPGP v0.2.0 introduces a JSON reference portfolio and local checkout registry in the CLI, but these are not platform requirements.

The portable protocol may be implemented through another representation provided equivalent semantics are preserved:

- one canonical workstream state;
- stale writes cannot silently overwrite current state when concurrent writers exist;
- execution lease ownership is distinguishable from human authority;
- exclusive mutable checkout ownership is protected;
- partial waits stay correctly scoped;
- abrupt takeover is recoverable without destructive normalization.

Provider-native locks, MCP coordination, databases, CRDTs, heartbeats or orchestrators remain optional adapters.

## Claude invocation note

Invocation is client-surface dependent.

In the previously tested Claude client, the self-hosted marketplace installation exposed:

```text
/ppgp
```

Claude Code may namespace plugin skills as:

```text
/ppgp:ppgp
```

Do not project one invocation form across every Claude surface.

## Adapter principles

1. Protocol semantics remain vendor-neutral.
2. A platform manifest may describe PPGP but may not fork protocol semantics.
3. Prefer direct use of `skills/ppgp/` over copies.
4. When a second discovery path is required, keep it deterministic and drift-tested.
5. Marketplace readiness, submission, approval and public listing are distinct states.
6. Do not claim a client is verified merely because a manifest exists.
7. Repository-backed adapters should follow repository revisions rather than maintaining stale semantic forks.
8. Document platform-native invocation names from the exact tested client surface.
9. v0.2 coordination must remain optional for simple single-workstream repositories.

## Public marketplace state

Repository-side packaging does not imply vendor endorsement or public listing.

Current evidence remains limited to the surfaces actually smoke-tested or structurally validated. A v0.2.0 package/release must be retested on real clients after publication before client-specific v0.2 verification is claimed.
