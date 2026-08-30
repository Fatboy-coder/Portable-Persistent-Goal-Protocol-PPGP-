# PPGP v0.2 Draft Coordination Reference

Load this reference only when concurrent or ambiguous execution exists.

Typical triggers:

- more than one active workstream;
- more than one coding agent/session touching the same repository;
- a dirty checkout owned by another workstream;
- multiple Git worktrees or isolated clones;
- a workstream reported blocked while independent work may remain;
- abrupt executor unavailability;
- takeover of unfinished mutable work;
- a session/UI diff claim that conflicts with observed VCS state;
- untracked local artifacts whose ownership or sensitivity matters to safe mutation.

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

A narrative claim, UI label, or remembered state MUST NOT silently supersede observed canonical state.

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
tracked changes
untracked local state
worktree list
existing claim
current lease
```

When recovery risk matters, do not reduce workspace state to one ambiguous `clean/dirty` boolean. Observe or classify, where practical:

```text
tracked      = CLEAN | DIRTY | UNKNOWN
untracked    = NONE | PRESENT | UNKNOWN
ownership    = SELF | FOREIGN | MIXED | UNKNOWN
sensitivity  = NORMAL | SENSITIVE | UNKNOWN
```

This is an observation profile, not a mandatory persisted schema. The purpose is to distinguish cases such as a clean tracked tree with foreign sensitive untracked artifacts from a truly empty workspace.

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

If foreign or sensitive untracked state is present, broad staging commands SHOULD be avoided. Prefer explicit pathspecs and inspect the staged-file set before commit. Foreign work, secrets, private keys, generated bundles, or unrelated workstream artifacts MUST NOT be staged merely because they share a checkout.

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

Durability is attached to the specific recovery artifact, not automatically to the whole workstream. A pushed checkpoint can be REMOTE_DURABLE while newer local edits remain only HOST_DURABLE.

Promote durability only after the corresponding artifact actually exists and is verified. A useful recovery promotion is:

```text
HOST_DURABLE dirty work
-> inspect against last checkpoint
-> verify
-> commit/checkpoint
-> REPO_DURABLE
-> push/remote artifact verification
-> REMOTE_DURABLE
```

Do not relabel local work as REMOTE_DURABLE merely because an older remote checkpoint exists.

## Evidence consistency

Verification includes semantic consistency, not only green tests.

When a durable human-readable claim matters, check that:

```text
claim
== mechanism
== verification evidence
== canonical state
```

The equality is semantic, not textual.

If a sentence overstates the mechanism, either narrow the claim or improve the mechanism before closure. Narrative state MUST NOT silently replace a conflicting canonical source.

Session/UI labels such as `uncommitted changes`, progress counters, or remembered branch state are observations, not canonical truth. Reconcile them against the VCS/workspace before mutation.

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
3. preserve mutable state exactly as found
4. compare with the last durable checkpoint
5. classify tracked/untracked state, ownership, sensitivity, durability and uncertainty
6. reconstruct interrupted intent from canonical state + observed diff, not agent recollection alone
7. verify proportionately
8. record takeover/new lease generation
9. continue the smallest verified next action
10. promote durability only when the new checkpoint is actually created and verified
```

Do not normalize with destructive Git operations merely to obtain a clean status.

If the returning executor finds the VCS clean despite a UI/session claim of uncommitted changes, classify that discrepancy explicitly rather than inventing or discarding work.

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

Load it when concurrency, ownership ambiguity, partial blocking, takeover, or conflicting workspace evidence actually appears.

The coordination layer should cost close to zero tokens in simple single-workstream repositories.