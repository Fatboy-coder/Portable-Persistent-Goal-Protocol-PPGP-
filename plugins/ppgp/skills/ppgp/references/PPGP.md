# PPGP v0.2.0 Compact Reference

## Objective

Enable a fresh coding agent to recover and continue substantial software work from repository-visible state without human reconstruction of prior conversation history.

When concurrent or ambiguous work exists, also preserve enough coordination state to determine what work is safe and useful to execute next.

## Lifecycle

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

## Inner loop

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

## Core logical memory

```text
CONSTITUTION  durable authority and invariants
ROADMAP       project direction
MEMORY        durable reusable lessons and decisions
ACTIVE_GOAL   temporary hot state for one active goal
GIT           forensic history
```

Single-workstream repositories may stop here.

Do not create duplicate documentation.

## Optional coordination

Load `COORDINATION.md` only when concurrency, ownership ambiguity, partial blocking, multiple workstreams/checkouts, or abrupt takeover appears.

Core invariant:

```text
PORTFOLIO != WORKSTREAM != LEASE HOLDER != CHECKOUT
```

## ACTIVE_GOAL minimum state

```text
GOAL
WHY
PHASE
DEFINITION_OF_DONE
FROZEN_DECISIONS
INVARIANTS
VERIFIED_CURRENT_STATE
COMPLETED
REMAINING
BLOCKERS
HUMAN_AUTHORITY_REQUIRED
VERIFICATION_EVIDENCE
NEXT_EXECUTABLE_ACTION
```

Write current state, not a diary.

## Recovery

Load the smallest sufficient boot packet:

```text
GOAL_CONTRACT
+ HOT_STATE
+ RELEVANT_MEMORY
+ RELEVANT_EVIDENCE
```

If strategy is frozen, resume execution unless new evidence invalidates it.

In concurrent mode additionally identify runnable workstreams, lease ownership, checkout ownership, scoped waits, dependencies and unfinished-work durability.

## Blockers

```text
A agent-solvable        -> solve
B external asynchronous -> record; continue independent work
C authority boundary    -> escalate smallest required action
D hard dependency       -> escalate only when no safe path exists
```

Always prefer the narrowest true scope.

```text
blocked action != blocked workstream
blocked workstream != blocked project
executor unavailable != workstream blocked
```

## Evidence

Default technical precedence:

```text
runtime/production
> automated verification
> current repository/workspace
> Git
> canonical PPGP state
> MEMORY
> ROADMAP
> conversation
> recollection
```

Current observed checkout state beats stale coordination metadata.

## Handoff

Prefer deltas and compact structured state over transcript replay.

Single-workstream handoffs may use the v0.1 compact form.

Concurrent handoffs should include workstream, phase, run state, lease generation, scoped waits, durability, evidence and next action.

## Distill

```text
authority/invariant -> CONSTITUTION
future direction    -> ROADMAP
durable lesson      -> MEMORY
temporary detail    -> discard
```

Git keeps chronology.

Release transient leases and obsolete checkout claims at closure.

## Human interruption

Default to autonomous resolution of reversible technical work.

Authority must be action-scoped. An agent cannot self-grant product, legal, financial, credential or production authority.

Continue unrelated safe RUNNABLE work before escalating a blocked workstream when permitted.

## Multi-agent

Single agent by default.

Add agents only when independent information gain or genuinely parallel useful work exceeds coordination cost.

## Closure

```text
DoD verified
+ evidence
+ distillation
+ roadmap/high-level state updated when needed
+ temporary hot/coordination state garbage-collected
= CLOSED
```
