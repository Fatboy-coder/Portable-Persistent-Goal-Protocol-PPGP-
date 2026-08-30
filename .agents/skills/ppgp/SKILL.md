---
name: ppgp
description: "Portable Persistent Goal Protocol for long-running coding-agent work. Use when starting, resuming, coordinating, handing off, recovering, distilling, or closing substantial software goals across long sessions, context compaction, agent replacement, or concurrent coding-agent work."
license: MIT
compatibility: "Requires repository read/write access for persistent state and Git access when Git is used as forensic history or local checkout coordination. No network service, MCP server, database, or specific model provider is required."
metadata:
  author: Fatboy-coder
  version: "0.2.0"
  protocol: PPGP
---

# PPGP

Use PPGP to preserve the minimum repository-visible state required for a fresh coding agent to continue long-running software work without asking the human to reconstruct prior conversation history.

Read `references/PPGP.md` for the compact core protocol.

Load `references/COORDINATION.md` only when concurrency, ownership ambiguity, partial blocking, multiple workstreams/checkouts, or abrupt executor takeover actually appears.

Do not preload advanced coordination rules into ordinary single-workstream work.

## Project identity and evidence status

- Canonical repository: `https://github.com/Fatboy-coder/ppgp`
- Public specification: `SPEC.md`
- Evaluation guide: `EVALUATION.md`
- Related work: `RELATED_WORK.md`
- Citation metadata: `CITATION.cff`
- Author/publisher identifier: `Fatboy-coder`
- License: MIT
- Current protocol version: experimental `0.2.0`

PPGP v0.2.0 is an experimental engineering protocol. It does not claim peer-reviewed validation, independent benchmark superiority, universality, or a measured performance advantage.

PPGP is independent and is not presented as affiliated with or endorsed by Anthropic, OpenAI, Google, GitHub, Cursor, or another agent vendor.

## Core lifecycle

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

Inside each phase:

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

## Core memory roles

Reuse existing project documentation whenever it already fulfills a role.

Common mapping:

```text
CONSTITUTION -> docs/MASTER.md
ROADMAP      -> docs/ROADMAP.md
MEMORY       -> docs/PROJECT_MEMORY.md
ACTIVE_GOAL  -> docs/ACTIVE_GOAL.md
FORENSICS    -> Git
```

A single-workstream repository does not need an explicit portfolio.

When several active workstreams or ambiguous executors/checkouts coexist, use the optional PPGP v0.2 coordination model:

```text
PROJECT
└── PORTFOLIO
    ├── WORKSTREAM
    │   ├── PHASE
    │   ├── RUN_STATE
    │   ├── REVISION
    │   ├── EXECUTION_LEASE
    │   ├── DEPENDENCIES
    │   ├── WAIT_CONDITIONS
    │   ├── AUTHORITY_GATES
    │   └── DURABILITY
    └── WORKSTREAM ...
```

The invariant is:

```text
PORTFOLIO != WORKSTREAM != LEASE HOLDER != CHECKOUT
```

Detailed coordination semantics belong in `references/COORDINATION.md`.

## Recovery rule

For single-workstream recovery, load the smallest useful boot packet:

```text
GOAL_CONTRACT
+ HOT_STATE
+ RELEVANT_MEMORY
+ RELEVANT_EVIDENCE
```

Do not restart THINK merely because the agent/session is new when strategy is already frozen.

For concurrent or ambiguous work, additionally determine which workstreams are runnable, who owns execution, which checkout belongs to which workstream, which waits are scoped locally, and what unfinished work requires recovery.

## `ppgp init`

1. Inspect repository instructions and existing project documentation.
2. Map existing files to PPGP logical roles.
3. Reuse them instead of duplicating them.
4. Inspect whether an explicit `.ppgp/portfolio.json` exists.
5. Do not create empty memory or portfolio files merely to satisfy the protocol.

## `ppgp goal <outcome>`

Use for an unambiguous single active goal.

Capture current goal, WHY, phase, Definition of Done, frozen decisions, invariants, verified state, completed/remaining work, blockers, authority, evidence and next executable action.

If an explicit multi-workstream portfolio exists, do not silently replace or choose a workstream. Use an explicit workstream operation.

## `ppgp status`

Recover current state with minimal context.

Prefer current canonical PPGP state, real repository state and relevant evidence over conversation memory.

`ppgp status --all` may display the portfolio and all workstreams when the reference implementation is present.

## `ppgp handoff`

For ordinary single-workstream work:

1. Verify material state.
2. Update hot state to current truth.
3. Remove stale statements.
4. Record the next executable action.
5. Emit compact delta-oriented state.

Do not dump the conversation transcript.

For concurrent work, use explicit workstream handoff so lease generation and ownership are not ambiguous.

## Workstream operations

The reference CLI may provide:

```text
ppgp workstream start
ppgp workstream status
ppgp workstream park
ppgp workstream resume
ppgp workstream handoff
ppgp workstream recover
ppgp workstream close
```

Treat these as reference implementation operations, not mandatory vendor-specific slash commands.

A cooperative handoff and abrupt recovery are different events.

## Checkout operations

When local checkout coordination is needed, the reference CLI may provide:

```text
ppgp checkout status
ppgp checkout claim
ppgp checkout release
```

Writable checkout ownership is exclusive by default.

Do not switch, reset, clean, stash, commit, overwrite, or repurpose foreign dirty work merely to simplify execution.

Prefer safe isolation when available and permitted.

## Waits and human escalation

Use the narrowest true wait scope.

```text
blocked action != blocked workstream
blocked workstream != blocked project
executor unavailable != workstream blocked
```

Solve reversible technical decisions autonomously.

Escalate only genuine authority boundaries such as irreversible destructive action, legal/financial commitment, unavailable credential or account authorization, ambiguous product policy, material change to frozen architecture, or action outside delegated permission.

Authority must be tied to the exact action it permits. An agent cannot grant itself authority.

Before escalating one blocked workstream, continue unrelated safe RUNNABLE work when permitted.

## Distill and close

At closure classify temporary state:

```text
authority/invariant -> CONSTITUTION
future direction    -> ROADMAP
durable lesson      -> MEMORY
temporary detail    -> discard
```

Git keeps chronology.

Release transient execution leases and obsolete checkout claims.

Prepared is not done.

Started is not done.

Agent confidence is not evidence.

A PPGP goal is done when its synchronous Definition of Done is verified, durable knowledge is distilled, and temporary working state has been garbage-collected.

## Multi-agent rule

Use one agent by default.

Introduce another agent when independent information gain or genuinely parallel useful work is likely to exceed communication and coordination cost.

Concurrency is optional. Coordination overhead should remain close to zero for simple single-workstream repositories.
