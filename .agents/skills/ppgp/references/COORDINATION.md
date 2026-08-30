# PPGP v0.2 Draft Coordination Reference

Load this reference only when concurrent or ambiguous execution exists.

Typical triggers:

- more than one active workstream;
- more than one coding agent/session touching the same repository;
- a dirty checkout owned by another workstream;
- multiple Git worktrees or isolated clones;
- a workstream reported blocked while independent work may remain;
- abrupt executor unavailability;
- takeover of unfinished mutable work.

For ordinary single-workstream execution, the normal PPGP reference is sufficient.

## Core invariant

```text
PROTECT FOREIGN WORK
AND
CONTINUE INDEPENDENT SAFE WORK
```

Also:

```text
blocked action != blocked workstream
blocked workstream != blocked project
executor unavailable != workstream blocked
```

## Coordination model

```text
PROJECT
  PORTFOLIO (only when needed)
    WORKSTREAM
      GOAL_REF
      RUN_STATE
      WAIT_CONDITIONS[]
      EXECUTION_LEASE
      CHECKOUT_CLAIM
      DURABILITY
      LAST_CHECKPOINT
```

The PORTFOLIO coordinates active work. It does not replace detailed goal state.

Do not duplicate frozen decisions, Definition of Done, or durable project memory into every workstream.

## RUN_STATE

Keep lifecycle PHASE separate from execution state.

```text
RUNNABLE
RUNNING
WAITING
RECOVERY_REQUIRED
PARKED
COMPLETED
```

A workstream is WAITING only when no safe useful action remains runnable.

Typed wait conditions explain why.

## Wait conditions

Record the smallest true scope.

```text
kind = EXTERNAL | AUTHORITY | TECHNICAL
scope = ACTION | WORKSTREAM | GOAL | PROJECT
resume_condition = observable condition
```

Before promoting a wait to workstream scope, ask:

```text
Can any safe useful work continue without this dependency?
```

If yes, keep the workstream RUNNABLE/RUNNING and scope the wait more narrowly.

Provider quota, cooldown, process loss, or terminal loss is executor availability. It is handled through lease/recovery semantics rather than inventing a new GOAL blocker type.

## Execution lease

A lease says which executor currently owns mutation of a workstream.

Recommended states:

```text
CLAIMED
HANDOFF_READY
RECOVERY_REQUIRED
RELEASED
```

Use a monotonically increasing generation or equivalent fencing value when takeovers/concurrent writers are possible.

A stale generation must not overwrite a newer canonical generation.

Lease loss does not authorize destructive cleanup.

A lease does not expand human-delegated authority.

Live lease persistence is implementation-defined. PPGP does not require Git to function as a lock server.

## Checkout claim

A writable mutable checkout is exclusive by default.

Before mutation inspect, when available:

```text
branch
HEAD
dirty state
worktree list
existing claim
current lease
```

If a shared checkout contains foreign dirty work, do not by default:

```text
switch
reset
clean
stash foreign work
commit foreign work
overwrite
repurpose
```

Prefer an isolated workspace when safely available.

For Git repositories, a linked worktree is a normal implementation option.

Creating safe isolation is normally agent-solvable and should not become a human approval gate unless project policy forbids it.

## Authority gates

Bind authority to a specific action.

Recommended lifecycle:

```text
REQUIRED
GRANTED
CONSUMED
REVOKED
```

An agent cannot self-grant authority.

A granted gate authorizes only the named action/scope.

Do not store secrets merely to model authority.

## Dependencies

Dependencies must be explicit when they affect scheduling.

A minimal dependency is:

```text
workstream=<id>
condition=COMPLETED
```

Do not infer dependencies from branch names, checkout location, agent identity, document order, or conversation order.

Reject cycles.

## Revision / CAS

Canonical machine state should carry a revision or equivalent compare-and-swap mechanism when multiple writers are possible.

A stale revision must not silently overwrite newer state.

The reference CLI uses integer revisions plus a local mutation lock. Multi-machine implementations need atomic storage or equivalent CAS.

## Durability

Classify unfinished work when recovery risk matters:

```text
SESSION_ONLY
HOST_DURABLE
REPO_DURABLE
REMOTE_DURABLE
```

Examples:

- conversation-only reasoning: SESSION_ONLY
- dirty identified worktree: HOST_DURABLE
- local checkpoint commit: REPO_DURABLE
- pushed checkpoint/recoverable remote artifact: REMOTE_DURABLE

Do not assume HOST_DURABLE work survives host loss.

## Cooperative handoff

Before releasing execution when possible:

```text
VERIFY
-> update goal/workstream state
-> record workspace + durability
-> record NEXT
-> transfer/release lease
-> emit compact handoff
```

A handoff to a new executor should increment lease generation atomically.

## Abrupt takeover

When the prior executor disappears with ambiguous or dirty mutable state:

```text
RUN_STATE = RECOVERY_REQUIRED
```

Then:

```text
1. read portfolio + goal state
2. inspect real workspace
3. preserve dirty state exactly as found
4. compare with last checkpoint
5. classify durability/uncertainty
6. verify proportionately
7. record takeover/new lease generation
8. continue smallest verified next action
```

Do not normalize with destructive Git operations merely to obtain a clean status.

## Project scheduler rule

```text
if any eligible workstream is RUNNABLE or RUNNING:
    project is not blocked
```

RECOVERY_REQUIRED should be inspected before duplicating replacement work.

Before asking the human about one blocked workstream, continue another useful workstream when safe and within delegated scope.

Human escalation remains scoped to the genuine authority boundary.

## Progressive-disclosure rule

Do not preload this reference for every PPGP operation.

Load it when concurrency, ownership ambiguity, partial blocking, or takeover actually appears.

The coordination layer should cost close to zero tokens in simple single-workstream repositories.
