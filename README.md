# Portable Persistent Goal Protocol (PPGP)

> Portable continuity and coordination protocol for long-running coding agents.

**Status:** Experimental v0.2.0  
**First public release:** 2026-08-24  
**Target v0.2.0 release:** 2026-08-30  
**License:** MIT  
**Maturity:** Provisional

PPGP is an open, vendor-neutral protocol for keeping long-running software work recoverable across context compaction, interrupted sessions, agent replacement, and concurrent coding-agent work.

It does not replace model memory, Git, tests, MCP, worktrees, orchestration, or provider-specific compaction. It defines a small portable control layer around them.

**[Try with npm](https://www.npmjs.com/package/@fatboy-coder/ppgp)** · **[Read the specification](./SPEC.md)** · **[Platform compatibility](./COMPATIBILITY.md)** · **[Run an evaluation](./EVALUATION.md)** · **[Related work](./RELATED_WORK.md)** · **[Cite PPGP](./CITATION.cff)**

## Try PPGP in 30 seconds

For an ordinary single active goal:

```bash
npx @fatboy-coder/ppgp init
npx @fatboy-coder/ppgp goal "Ship one verified milestone"
npx @fatboy-coder/ppgp status
```

A v0.1-style `ACTIVE_GOAL.md` remains a valid v0.2 single-workstream deployment. No migration is required.

For concurrent workstreams:

```bash
npx @fatboy-coder/ppgp workstream start d1 "Run D1 capacity work"
npx @fatboy-coder/ppgp workstream start goal-e "Continue Goal E"
npx @fatboy-coder/ppgp status --all
```

The reference CLI then uses an explicit portfolio:

```text
.ppgp/
├── portfolio.json
└── workstreams/
    └── <id>/
        ├── state.json
        └── notes.md
```

JSON is the reference implementation format, not a protocol-core requirement.

## What changed in v0.2.0

PPGP v0.1.x focused on recoverability of one primary active goal.

v0.2.0 adds an optional coordination layer for real repositories where several agents, workstreams, branches, worktrees, blockers, or executor interruptions coexist.

The central model is:

```text
PROJECT
│
├── CONSTITUTION
├── ROADMAP
├── MEMORY
│
└── PORTFOLIO                 optional
    ├── WORKSTREAM A
    │   ├── PHASE
    │   ├── RUN_STATE
    │   ├── REVISION
    │   ├── EXECUTION_LEASE
    │   ├── DEPENDENCIES
    │   ├── WAIT_CONDITIONS
    │   ├── AUTHORITY_GATES
    │   └── DURABILITY
    └── WORKSTREAM B ...
```

Core invariant:

```text
PORTFOLIO != WORKSTREAM != LEASE HOLDER != CHECKOUT
```

And:

```text
executor unavailable != workstream blocked
blocked action != blocked workstream
blocked workstream != blocked project
```

## Goal lifecycle remains stable

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

Inside each phase:

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

v0.2 adds a separate workstream execution axis:

```text
RUNNABLE
RUNNING
WAITING
RECOVERY_REQUIRED
PARKED
COMPLETED
```

PHASE and RUN_STATE are deliberately independent.

For example:

```text
EXECUTE + RUNNING
SHIP + WAITING
HARDEN + RECOVERY_REQUIRED
```

## Typed and scoped waits

PPGP does not collapse every blocker into one project-wide stop.

A wait records:

```text
kind  = EXTERNAL | AUTHORITY | TECHNICAL
scope = ACTION | WORKSTREAM | GOAL | PROJECT
```

A workstream may contain several wait kinds at once.

If one remote action is waiting for credentials while local implementation remains safe and useful, the action waits but the workstream remains runnable.

## Execution leases

A lease coordinates who currently owns mutation of a workstream.

The reference model includes a monotonically increasing `generation` so an older executor can detect that a takeover occurred.

```text
Agent A generation 4
        ↓ interruption
Agent B takeover
        ↓
generation 5
```

A lease does not grant product, legal, financial, credential, or production authority.

## Checkout safety

Writable checkouts are exclusive by default.

The reference CLI stores checkout claims locally in the Git common directory, so they are shared across linked worktrees but are not committed as project memory.

A useful coordination rule is:

```text
valid lease
+ checkout claimed by same workstream
+ actual branch matches declared branch
= coordination layer permits mutation
```

Foreign dirty work must not be reset, cleaned, stashed, committed, overwritten, or repurposed merely to make another agent's job easier.

When safe and reversible, use an isolated workspace such as a Git worktree.

## Recovery durability

Unfinished work may have different recovery guarantees:

```text
SESSION_ONLY
HOST_DURABLE
REPO_DURABLE
REMOTE_DURABLE
```

A dirty identified worktree may be perfectly recoverable after an agent cooldown while still being only `HOST_DURABLE` and therefore vulnerable to loss of the machine.

## Dependencies

Scheduling dependencies are explicit and acyclic.

```text
workstream=goal-e
requires=d1
condition=COMPLETED
```

PPGP does not infer dependency from branch names, checkout location, executor identity, document order, or conversation order.

## Authority gates

Authority is action-scoped:

```text
REQUIRED
GRANTED
CONSUMED
REVOKED
```

An agent cannot grant itself authority.

A grant for one action is not blanket permission for unrelated actions.

Credentials and secrets are not PPGP state.

## Revision / compare-and-swap

The reference machine state carries integer revisions.

A stale revision is rejected rather than silently overwriting newer canonical state.

The local CLI also uses a short-lived mutation lock. Multi-machine implementations may use a database, MCP coordinator, lock service, fencing tokens, or another atomic/CAS mechanism.

None is required by the portable core.

## Progressive disclosure

Simple repositories should not pay the token cost of multi-agent coordination.

The canonical skill loads [`references/COORDINATION.md`](./skills/ppgp/references/COORDINATION.md) only when concurrency, checkout ownership, partial blocking, or takeover actually appears.

For a normal single goal, the v0.1 mental model remains enough:

```text
CONSTITUTION
ROADMAP
MEMORY
ACTIVE_GOAL
GIT
```

## Reference CLI

The public npm package is `@fatboy-coder/ppgp`.

### Legacy / single-workstream

```bash
npx @fatboy-coder/ppgp init
npx @fatboy-coder/ppgp doctor
npx @fatboy-coder/ppgp goal "Ship the next verified milestone"
npx @fatboy-coder/ppgp status
npx @fatboy-coder/ppgp handoff
```

### Portfolio / workstreams

```bash
ppgp status --all

ppgp workstream start <id> <title>
ppgp workstream status <id>
ppgp workstream park <id>
ppgp workstream resume <id>
ppgp workstream handoff <id> <new-holder>
ppgp workstream recover <id> <new-holder>
ppgp workstream close <id>
```

### Local checkout claims

```bash
ppgp checkout status
ppgp checkout claim <workstream-id> [checkout-path]
ppgp checkout release [checkout-path]
```

### Optional migration

```bash
ppgp migrate
ppgp migrate --rollback
```

Migration is copy-first. After cutover, `.ppgp/` becomes canonical and the old `ACTIVE_GOAL.md` remains untouched only as a compatibility snapshot. The reference implementation does not maintain two independently writable canonical truths.

Rollback is accepted while the legacy source remains unchanged.

## Design principles

- Retrieve relevant memory instead of preloading project history.
- Prefer verified current state over chronological diaries.
- Communicate deltas instead of replaying transcripts.
- Separate machine coordination truth from human-readable reasoning.
- Reject stale writes instead of silently overwriting newer state.
- Protect foreign unfinished work while continuing independent safe work.
- Keep waits scoped to the smallest true unit.
- Keep authority tied to exact actions.
- Treat tests and runtime evidence as stronger than agent confidence.
- Use one agent by default; add agents only when their value exceeds coordination cost.
- Keep the core portable across model vendors and IDEs.
- Do not require MCP, embeddings, vector databases, CRDTs, a hosted service, or a specific provider.

## Install

PPGP v0.2.0 ships as an [Agent Skills](https://agentskills.io/) compatible skill, a dependency-free Node.js CLI, and thin native distribution adapters.

### Universal Agent Skills route

```bash
npx skills add https://github.com/Fatboy-coder/ppgp/tree/main/skills/ppgp
```

`skills/ppgp/` is canonical. `.agents/skills/ppgp/` and the packaged Claude skill are generated compatibility mirrors whose parity is test-enforced.

### Native platform routes

| Platform | Route |
| --- | --- |
| Claude Code | Plugins → Add marketplace → `Fatboy-coder/ppgp` → install `ppgp` |
| OpenAI Codex | `.codex-plugin/plugin.json` + repository marketplace metadata |
| ChatGPT | Agent Skill / skill-only OpenAI plugin; public directory listing requires external publication |
| Gemini CLI | `gemini extensions install https://github.com/Fatboy-coder/ppgp --auto-update` |
| Cursor | root Agent Plugin `plugin.json` + canonical `skills/` |
| GitHub Copilot | repository-native `.agents/skills/ppgp/` discovery |
| Windsurf | repository-native `.agents/skills/ppgp/` discovery |
| Devin | repository-native `.agents/skills/ppgp/` discovery |
| Kiro / Cline / Junie | import the canonical public Agent Skill |

See [`COMPATIBILITY.md`](./COMPATIBILITY.md) for verification level and limitations. Repository readiness is not presented as vendor approval.

### Manual release archive

After the v0.2.0 release is published, the versioned archive is expected at:

```text
ppgp-v0.2.0.zip
```

Until that release action occurs, use the repository skill or npm's currently published stable package.

## Distribution

PPGP intentionally separates the portable protocol from distribution adapters:

```text
Canonical Agent Skill      -> vendor-neutral source
Claude Plugin/Marketplace  -> Claude discovery
OpenAI Plugin              -> Codex / OpenAI packaging
Gemini Extension           -> Gemini CLI installation
Agent Plugin               -> Cursor-compatible packaging
.agents/skills mirror      -> repository-native discovery
GitHub Release             -> versioned direct download
npmjs.com                  -> CLI discovery and zero-install execution
GitHub Packages            -> package presence inside GitHub
```

See [`DISTRIBUTION.md`](./DISTRIBUTION.md).

## Research and evaluation

PPGP is experimental.

Independent evaluation, criticism, alternative implementations, failure reports, and simpler competing approaches are welcome.

Especially useful evidence includes:

- whether a fresh agent can recover without human reconstruction;
- whether workstream blocker scope is classified correctly;
- whether foreign dirty work is protected;
- whether abrupt executor takeover preserves useful work;
- whether stale revisions are rejected;
- whether coordination overhead is justified;
- whether the same state is interpretable across different agents/providers.

The reproducible evaluation guide is [`EVALUATION.md`](./EVALUATION.md).

The design lineage and neighboring work are documented in [`RELATED_WORK.md`](./RELATED_WORK.md).

Negative results are useful. PPGP should change when reproducible evidence shows that a simpler or more reliable rule exists.

## What v0.2.0 deliberately does not claim

PPGP v0.2.0 does **not** claim to:

- invent persistent agent memory;
- invent worktrees, leases, durable execution, or multi-agent coordination;
- outperform existing memory or orchestration systems;
- be optimal for every repository;
- reduce tokens by a specific percentage;
- eliminate human review;
- make multi-agent systems inherently better;
- provide a distributed lock service.

The protocol is published to be inspectable, reproducible, falsifiable, and improvable.

## Project mission

PPGP is a community-oriented open-source project intended to help developers and users get more reliable work from coding agents with less repeated explanation, avoidable supervision, and preventable coordination loss.

The project may be used commercially under the MIT license. The community-oriented mission is not a restriction on who may use the protocol.

## Publication history

PPGP v0.1 was first published publicly on 2026-08-24 in the `Fatboy-coder/fatboy-coder` repository under `/ppgp`.

The dedicated `Fatboy-coder/ppgp` repository is now the canonical home.

v0.2.0 is the first protocol line to add optional multi-workstream portfolio coordination while retaining the v0.1 single-goal path.

## Versioning

PPGP uses semantic versions for the protocol and versioned distribution artifacts.

`0.x` releases are experimental and may change incompatibly.

Researchers, developers and maintainers should cite the exact version evaluated.
