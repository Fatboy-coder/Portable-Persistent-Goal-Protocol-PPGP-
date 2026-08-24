# PPGP v0.1 Compact Reference

## Objective

Enable a fresh coding agent to recover and continue a substantial goal from repository-visible state without human reconstruction of the prior conversation.

## Lifecycle

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

## Inner loop

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

## Logical memory

```text
CONSTITUTION  durable authority and invariants
ROADMAP       project direction
MEMORY        durable reusable lessons and decisions
ACTIVE_GOAL   temporary hot state for one active goal
GIT           forensic history
```

Reuse existing equivalent files.

Do not create duplicate documentation.

ACTIVE_GOAL is temporary and must be deleted after verified closure and distillation.

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

## Blockers

```text
A agent-solvable        -> solve
B external asynchronous -> record, usually continue
C authority boundary    -> escalate minimally
D hard dependency       -> escalate if no safe autonomous path
```

## Evidence

Default technical precedence:

```text
runtime/production
> automated verification
> current implementation
> Git
> ACTIVE_GOAL
> MEMORY
> ROADMAP
> conversation
> recollection
```

## Handoff

Prefer deltas and compact structured state over transcript replay.

Keep the handoff human-auditable and cross-model readable.

Do not require gibberish, hidden-state communication, embeddings, MCP or a particular vendor.

## Distill

```text
authority/invariant -> CONSTITUTION
future direction    -> ROADMAP
durable lesson      -> MEMORY
temporary detail    -> discard
```

Git keeps chronology.

## Human interruption

Default to autonomous resolution of reversible technical work.

Escalate only for genuine authority, permission, legal/financial, destructive, or unavailable-dependency boundaries.

## Multi-agent

Single agent by default.

Add agents only when expected independent information gain exceeds coordination cost.

## Closure

```text
DoD verified
+ evidence
+ distillation
+ roadmap/high-level state updated when needed
+ ACTIVE_GOAL deleted
= CLOSED
```
