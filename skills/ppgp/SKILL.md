---
name: ppgp
description: "Portable Persistent Goal Protocol for long-running coding-agent work. Use when starting, resuming, handing off, distilling, or closing a substantial software goal across long sessions, context compaction, agent replacement, Claude Code, Codex, or other Agent Skills-compatible coding agents."
license: MIT
compatibility: "Requires repository read/write access for persistent state and Git access when Git is used as forensic history. No network service, MCP server, database, or specific model provider is required."
metadata:
  author: Fatboy-coder
  version: "0.1"
  protocol: PPGP
---

# PPGP

Use PPGP to preserve the minimum repository-visible state required for a fresh coding agent to continue a long-running goal without asking the human to reconstruct prior conversation history.

Read `references/PPGP.md` when you need the compact protocol rules.

## Core lifecycle

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

Inside each phase:

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

Use existing project documentation whenever it already fulfills a PPGP memory role. Do not create duplicate sources of truth.

Common role mapping:

```text
CONSTITUTION -> docs/MASTER.md
ROADMAP      -> docs/ROADMAP.md
MEMORY       -> docs/PROJECT_MEMORY.md
ACTIVE_GOAL  -> docs/ACTIVE_GOAL.md
FORENSICS    -> Git
```

Only ACTIVE_GOAL is mandatory during an active substantial goal. Do not create empty memory files merely to satisfy the protocol.

## Operations

Treat the following phrases as PPGP operations even when the host agent does not implement vendor-specific slash commands.

### `ppgp init`

1. Inspect repository instructions and existing project documentation.
2. Identify existing files that already serve CONSTITUTION, ROADMAP, MEMORY and ACTIVE_GOAL roles.
3. Reuse them instead of duplicating them.
4. Check that Git or another forensic history exists when available.
5. Do not create ACTIVE_GOAL unless a substantial goal is active.
6. Return a compact mapping of logical roles to repository files and any genuine missing capability.

Do not rewrite project doctrine during initialization.

### `ppgp goal <outcome>`

Create or replace ACTIVE_GOAL only when beginning a new substantial goal.

Capture:

- GOAL;
- WHY;
- PHASE;
- DEFINITION_OF_DONE;
- FROZEN_DECISIONS;
- INVARIANTS;
- VERIFIED_CURRENT_STATE;
- COMPLETED;
- REMAINING;
- BLOCKERS;
- HUMAN_AUTHORITY_REQUIRED;
- VERIFICATION_EVIDENCE;
- NEXT_EXECUTABLE_ACTION.

Begin in THINK unless the repository already contains an explicitly frozen strategy for this exact goal.

Keep ACTIVE_GOAL state-oriented, not chronological.

### `ppgp status`

Recover current state with minimal context.

Read:

1. relevant repository instructions;
2. ACTIVE_GOAL;
3. only durable memory relevant to the current goal;
4. `git status`;
5. relevant recent commits or evidence when needed.

Return a compact state packet containing:

```text
goal
phase
frozen
verified
remaining
blockers
authority
next
evidence
```

Do not restart planning merely because the current agent is new.

### `ppgp handoff`

Before another agent or session takes over:

1. Verify the current material state.
2. Update ACTIVE_GOAL to current truth.
3. Remove stale or superseded statements.
4. Record the next executable action.
5. Emit a compact delta-oriented handoff.

Prefer:

```text
PPGP/0.1
G=<goal>
P=<phase>
F:<frozen facts>
D:<material deltas>
B:<real blockers>
E:<evidence refs>
N:<next action>
```

Do not dump the conversation transcript.

### `ppgp distill`

At the end of a goal or after major state accumulation:

Classify ACTIVE_GOAL information as:

```text
authority/invariant -> CONSTITUTION
future direction    -> ROADMAP
durable lesson      -> MEMORY
temporary detail    -> discard
```

Prefer compact decision + reason + invariant statements.

Do not preserve chronological execution detail that Git already records.

Do not delete ACTIVE_GOAL unless closure conditions are satisfied or the user explicitly requests abandonment.

### `ppgp close`

Close only when the synchronous Definition of Done is verified.

1. Verify implementation evidence.
2. Verify production/runtime behavior when required by Definition of Done.
3. Resolve or correctly classify blockers.
4. Run `ppgp distill`.
5. Update ROADMAP if project direction changed.
6. Update high-level documentation if required.
7. Delete ACTIVE_GOAL.
8. Keep Git as forensic history.
9. Report CLOSED + VERIFIED, or the smallest genuine remaining authority/dependency blocker.

Do not wait for asynchronous external observations unless Definition of Done explicitly requires them.

## Human escalation

Solve reversible technical decisions autonomously.

Escalate only for genuine authority boundaries such as irreversible destructive action, legal or financial commitment, unavailable credential or account authorization, genuinely ambiguous product policy, material change to frozen architecture, or action outside delegated permission.

Do not convert routine implementation uncertainty into a human approval gate.

## Multi-agent rule

Use one agent by default.

Introduce another agent when independent information gain is likely to exceed communication cost, especially for adversarial, security, linguistic, architecture, or independent verification work.

Keep reviewers independent of unnecessary implementer self-assessment.

## Completion invariant

Prepared is not done.

Started is not done.

Agent confidence is not evidence.

A PPGP goal is done when its Definition of Done is verified, durable knowledge is distilled, and temporary ACTIVE_GOAL state has been garbage-collected.
