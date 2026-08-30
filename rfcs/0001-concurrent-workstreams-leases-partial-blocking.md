# RFC 0001: Concurrent Workstreams, Leases, and Partial Blocking

Status: Draft for PPGP v0.2.0  
Date: 2026-08-30  
Target: Portable Persistent Goal Protocol 0.2.0

## Summary

PPGP v0.1.x models durable continuity for one active substantial goal. Real coding-agent workflows can contain multiple simultaneously active goals or workstreams, multiple agents, multiple Git branches or worktrees, partially blocked external actions, and abrupt agent unavailability.

This RFC extends PPGP with portable coordination primitives while preserving the protocol's repository-visible, vendor-neutral, low-infrastructure core.

The central invariant is:

```text
blocked action != blocked workstream
blocked workstream != blocked goal
blocked goal != blocked project
```

A wait condition MUST be scoped to the smallest unit it actually blocks.

## Motivation

A real multi-agent coding incident exposed several gaps in PPGP v0.1.2.

Two independent workstreams existed in one repository. One agent held a shared checkout containing hours of uncommitted work on one branch. A second agent needed to continue another workstream on another branch. The second workstream also depended on external infrastructure credentials for one later action.

The safe initial behavior was to refuse to switch the shared checkout because doing so could disturb foreign uncommitted work. The unsafe inference was to treat the second workstream as globally blocked.

The correct recovery was to create an isolated Git worktree and continue all local work that did not require the external dependency. Later, that second agent became unavailable with a substantial dirty worktree. The work remained recoverable on the host, but ownership, durability, takeover, and checkpoint semantics were not explicitly represented by PPGP.

The incident demonstrates that continuity alone is insufficient once several agents or workstreams share a repository. PPGP also needs a small coordination model.

## Goals

PPGP v0.2.0 SHOULD:

- allow multiple active workstreams in one project;
- distinguish lifecycle phase from execution state;
- prevent one wait condition from falsely blocking unrelated useful work;
- make writable checkout/worktree ownership explicit;
- make temporary agent execution ownership explicit and transferable;
- support safe recovery after abrupt agent unavailability;
- expose the durability level of unfinished work;
- preserve v0.1.2 single-goal repositories without migration overhead;
- remain usable without MCP, a daemon, a database, a lock server, CRDTs, or a specific agent vendor.

## Non-goals

PPGP v0.2.0 does not require:

- concurrent editing of the same files;
- automatic merge conflict resolution;
- a distributed lock service;
- real-time agent-to-agent messaging;
- a central coordinator agent;
- a mandatory JSON or YAML state format;
- automatic lease expiration based only on wall-clock time;
- multi-agent execution for repositories that do not benefit from it.

## 1. New logical roles

### 1.1 WORKSTREAM

A WORKSTREAM is an independently schedulable unit of useful work inside a project.

A workstream may correspond to:

- a complete GOAL;
- a bounded sub-goal;
- a parallel implementation track;
- a review or verification track;
- an infrastructure track independent of product implementation.

A project MAY contain one or more active workstreams.

Single-workstream projects remain valid and need no registry.

### 1.2 WORKSTREAM_REGISTRY

When more than one workstream is active, implementations SHOULD maintain a compact repository-visible WORKSTREAM_REGISTRY.

The registry exists only for cross-workstream coordination. It MUST NOT duplicate the complete contents of each ACTIVE_GOAL.

Minimum coordination fields per workstream SHOULD include:

```text
ID
ACTIVE_GOAL_REF
RUN_STATE
LEASE
CHECKOUT_CLAIM
WAIT_CONDITIONS
DURABILITY
LAST_CHECKPOINT
```

Lifecycle phase, frozen decisions, Definition of Done, durable reasoning, and detailed verification remain in the referenced ACTIVE_GOAL or equivalent state.

The registry is a coordination index, not a second source of goal truth.

### 1.3 EXECUTION_LEASE

An EXECUTION_LEASE is a temporary claim by one agent/session to actively mutate a workstream.

A lease SHOULD record:

```text
holder
workstream
state
claimed_at
last_checkpoint
handoff_or_takeover_ref
```

Recommended lease states:

```text
ACTIVE
HANDOFF_READY
RECOVERY_REQUIRED
RELEASED
```

A lease expresses who may continue execution. It does not grant authority beyond project policy.

A lease MUST NOT justify deleting or overwriting work merely because its holder is unavailable.

Implementations MAY use timeouts, heartbeats, fencing tokens, MCP tools, or orchestrator state as optional accelerators. The portable core does not require any of them.

Lease expiry alone MUST NOT authorize destructive takeover of a dirty workspace.

### 1.4 CHECKOUT_CLAIM

A CHECKOUT_CLAIM identifies a mutable repository workspace used by a workstream.

Examples include:

- the primary checkout;
- a Git worktree;
- an isolated clone;
- another version-control workspace with equivalent semantics.

A writable checkout claim SHOULD capture, when available:

```text
workspace_id
mode=read|write
branch
head
base
last_known_dirty_state
host_local_locator
```

The host-local locator MAY be an absolute path or another host-local handle. Portable identifiers such as branch and commit remain more important for cross-host recovery.

Writable claims are exclusive by default.

Multiple agents MAY inspect the same checkout read-only.

Two workstreams MUST NOT concurrently assume exclusive write ownership of the same mutable checkout unless the repository explicitly provides a safe concurrent-editing mechanism.

## 2. Orthogonal state axes

PPGP v0.1.x lifecycle phase remains unchanged:

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

PPGP v0.2.0 adds a separate RUN_STATE axis:

```text
RUNNABLE
RUNNING
WAITING
RECOVERY_REQUIRED
PARKED
COMPLETED
```

Lifecycle PHASE answers:

> What kind of work is this workstream doing?

RUN_STATE answers:

> Can useful execution proceed now, and does somebody currently own execution?

WAIT_CONDITIONS answer:

> What specific conditions prevent particular actions from proceeding?

These concepts MUST NOT be collapsed into one field.

### RUNNABLE

At least one safe useful action can execute now and no current execution lease is actively performing it.

### RUNNING

A valid execution lease holder is actively executing the workstream.

### WAITING

No safe useful action can currently advance the workstream because one or more recorded wait conditions remain unsatisfied.

WAITING is intentionally neutral. The typed WAIT_CONDITIONS determine whether the cause is external, authority-bound, technical, or mixed.

### RECOVERY_REQUIRED

The previous execution holder became unavailable, ownership became ambiguous, or unfinished mutable state exists that must be inspected before normal execution resumes.

RECOVERY_REQUIRED is a safety state, not a failure declaration.

### PARKED

The workstream is intentionally deferred despite potentially being runnable.

### COMPLETED

The workstream has satisfied its own completion contract. A parent GOAL may still remain open.

## 3. Scoped wait conditions

A WAIT_CONDITION MUST identify what it actually blocks.

Recommended fields:

```text
kind=external|authority|technical
scope=action|workstream|goal|project
dependency
resume_condition
independent_work_remaining=yes|no
```

A workstream MAY contain several wait conditions of different kinds at once. This is why wait kind is not encoded directly into RUN_STATE.

Default scope SHOULD be the narrowest defensible scope.

An implementation MUST NOT promote an action-level wait to workstream, goal, or project scope without evidence that all useful independent work at the narrower level is exhausted.

Before setting an entire workstream to WAITING, an agent SHOULD ask:

```text
Is there any safe useful work in this workstream that does not depend on the wait?
```

If yes, the workstream remains RUNNABLE or RUNNING and the wait is recorded only for the blocked scope.

The same rule applies recursively across workstreams and goals.

Authority escalation uses the wait type, not the generic WAITING state. An authority wait SHOULD be escalated only when its scope actually prevents all permitted useful progress that matters to the current scheduling decision.

## 4. Workspace safety protocol

Before mutating a repository checkout in a concurrent-workstream environment, an agent SHOULD inspect:

```text
current branch
HEAD
working-tree dirtiness
existing worktrees/checkouts when available
existing checkout claim
current execution lease
```

If the intended checkout contains dirty work belonging to another workstream, the agent MUST NOT by default:

- switch branches;
- reset;
- clean;
- stash foreign changes;
- commit foreign changes;
- overwrite files;
- repurpose the checkout.

The preferred autonomous response is:

```text
create or use an isolated workspace
```

when that operation is reversible and not forbidden by project policy.

Creating an isolated Git worktree to avoid disturbing foreign dirty work SHOULD normally be treated as an agent-solvable Type A coordination action, not as a human authority boundary.

## 5. Dirty-workspace ownership

Dirty state is not itself a protocol failure.

A dirty workspace becomes dangerous when its ownership, branch, recovery state, or durability is ambiguous.

A workstream with a dirty claimed workspace SHOULD record enough state for a fresh agent to answer:

- whose work is this;
- which workstream it belongs to;
- which branch and HEAD it is based on;
- whether the dirty state is expected;
- what was last verified;
- how durable the unfinished work is;
- what action should occur next.

A recorded dirty flag is only last-known state. Recovery MUST inspect the real workspace before mutation.

## 6. Recovery checkpoints and durability

PPGP v0.1.2 already requires ACTIVE_GOAL checkpointing after material changes.

PPGP v0.2.0 adds explicit recovery durability.

Recommended durability levels:

```text
SESSION_ONLY
HOST_DURABLE
REPO_DURABLE
REMOTE_DURABLE
```

### SESSION_ONLY

Material state exists only in conversation or volatile agent context.

Material implementation work SHOULD NOT remain at this level longer than necessary.

### HOST_DURABLE

State survives the agent session on the current host, for example as uncommitted files in an identified worktree.

This supports same-host recovery but not host-loss recovery.

### REPO_DURABLE

State is represented by local version-control objects or another repository-level recovery artifact.

Examples may include a checkpoint commit or another explicitly preserved local repository object.

### REMOTE_DURABLE

The recovery artifact exists on a remote or otherwise independently durable store and can survive loss of the current host.

PPGP does not require every intermediate change to be REMOTE_DURABLE.

The purpose of the field is to make recovery risk explicit rather than silently assuming all unfinished work has equal durability.

## 7. Durable coordination versus live execution state

PPGP MUST NOT require Git history to behave as a high-frequency lock server.

Implementations SHOULD distinguish:

```text
DURABLE COORDINATION
  workstream identity
  ACTIVE_GOAL reference
  scoped waits
  last checkpoint
  expected branch/workspace identity
  durability class

LIVE EXECUTION STATE
  current lease holder
  heartbeat/timeout
  host-local path
  runtime lock or fencing metadata
```

The exact persistence mechanism for live execution state is implementation-defined.

It MAY be:

- a repository-visible runtime file;
- host-local state;
- an MCP coordination service;
- an orchestrator;
- a database;
- another safe coordination mechanism.

The portable protocol MUST remain understandable without depending on one such mechanism.

If live lease state is missing or stale, an agent MUST fall back to observation and recovery rules rather than assuming write permission.

## 8. Abrupt interruption and takeover

A cooperative handoff and an abrupt takeover are different protocol events.

### Cooperative handoff

The current lease holder:

1. verifies current material state;
2. updates ACTIVE_GOAL;
3. updates durable coordination state if needed;
4. records workspace state and durability;
5. emits a compact handoff;
6. marks the lease HANDOFF_READY or RELEASED.

### Abrupt interruption

When the lease holder becomes unavailable without a clean handoff, the workstream SHOULD be treated as RECOVERY_REQUIRED if unfinished mutable state may exist or ownership cannot be proven current.

A recovery agent MUST first inspect real repository state before assuming the last checkpoint is complete.

Recommended takeover sequence:

```text
1. read coordination state and ACTIVE_GOAL
2. inspect claimed workspace, branch, HEAD, and dirtiness
3. preserve foreign/uncommitted state exactly as found
4. compare observed state with the last checkpoint
5. classify durability and unresolved uncertainty
6. run proportionate verification when practical
7. record TAKEOVER with the new lease holder
8. continue from the smallest verified next action
```

A recovery agent MUST NOT use reset, clean, branch switching, or destructive workspace normalization merely to make recovery simpler.

## 9. Scheduling rule

The scheduler may be a human, an agent, a CLI, or simply protocol reasoning.

When a workstream cannot proceed, it SHOULD search for another RUNNABLE workstream before declaring the project blocked.

Default project-level rule:

```text
if any workstream is RUNNABLE or RUNNING:
    project is not blocked
```

RECOVERY_REQUIRED SHOULD normally be inspected before creating duplicate replacement work.

The project is globally waiting only when no permitted active workstream can make useful progress and the recorded waits explain the aggregate stop condition.

## 10. Multi-agent default remains conservative

PPGP v0.2.0 does not change the v0.1.x rule that one agent is preferred when additional agents do not provide enough independent value.

Concurrency SHOULD be introduced when workstreams can be isolated or coordinated at acceptable cost.

The presence of WORKSTREAM_REGISTRY, leases, or checkout claims does not imply that many agents should run simultaneously.

These primitives also improve sequential handoffs between different agents.

## 11. Backward compatibility

A v0.1.2 repository with one `ACTIVE_GOAL` and one mutable checkout remains a valid minimal PPGP v0.2.0 deployment.

No WORKSTREAM_REGISTRY is required until concurrent active work exists or coordination ambiguity appears.

For a single workstream:

```text
ACTIVE_GOAL
+ repository evidence
```

remains sufficient.

When concurrency begins, the existing ACTIVE_GOAL MAY become one registered workstream without rewriting its durable content.

## 12. Candidate compact registry representation

The exact encoding is non-normative.

Example:

```text
PPGP/0.2
WS goal-e
  run=RUNNING
  goal=docs/ACTIVE_GOAL.goal-e.md
  lease=agent-a/session-a:ACTIVE
  checkout=shared:write
  branch=agent-a/goal-e
  durability=HOST_DURABLE

WS d1
  run=RUNNING
  goal=docs/ACTIVE_GOAL.d1.md
  lease=agent-b/session-b:ACTIVE
  checkout=worktree-d1:write
  branch=agent-b/d1
  wait[remote]=external/action
  durability=HOST_DURABLE
```

If Agent B becomes unavailable unexpectedly:

```text
WS d1
  run=RECOVERY_REQUIRED
  lease=agent-b/session-b:RECOVERY_REQUIRED
```

This representation intentionally separates cross-workstream coordination from detailed goal state.

## 13. Candidate operation changes

Existing operations remain:

```text
ppgp init
ppgp goal
ppgp status
ppgp handoff
ppgp distill
ppgp close
```

v0.2.0 SHOULD additionally define portable intents equivalent to:

```text
ppgp claim
ppgp release
ppgp recover
ppgp status --all
```

Exact CLI syntax and persistence of live leases are implementation details until the command contract is tested.

## 14. v0.2.0 conformance scenarios

### Scenario A: foreign dirty shared checkout

Given:

- Workstream A owns a shared writable checkout.
- The checkout is dirty with A's unfinished changes.
- Workstream B needs a different branch.

Expected:

- B does not switch or reset the shared checkout.
- B identifies the ownership conflict.
- B autonomously selects an isolated workspace when safely available.
- A's dirty state remains intact.

### Scenario B: partial external wait

Given:

- Workstream B requires external credentials for a later remote action.
- Local implementation and verification remain possible.

Expected:

- the remote action has an EXTERNAL action-scoped wait;
- the workstream remains RUNNABLE or RUNNING;
- local work continues;
- the project is not reported globally blocked.

### Scenario C: abrupt agent unavailability with dirty worktree

Given:

- an agent holds an active workstream lease;
- the agent becomes unavailable without handoff;
- the claimed worktree contains substantial uncommitted changes.

Expected:

- the workstream enters or is treated as RECOVERY_REQUIRED;
- a replacement agent inspects rather than normalizes the workspace;
- the replacement records takeover and durability state;
- verified useful work is preserved and execution resumes without human reconstruction when possible.

### Scenario D: unrelated runnable workstream

Given:

- one workstream is WAITING because of an AUTHORITY wait;
- another workstream is RUNNABLE.

Expected:

- the project remains runnable;
- the agent may continue the independent workstream;
- only the authority-dependent scope is escalated.

### Scenario E: mixed waits

Given:

- one workstream has both an EXTERNAL action wait and an AUTHORITY action wait;
- no independent useful actions remain.

Expected:

- RUN_STATE is WAITING;
- both typed waits remain visible;
- the protocol does not invent a lossy scalar state such as WAITING_EXTERNAL that hides the authority dependency.

## 15. Design test

The v0.2.0 coordination layer succeeds when a fresh agent can answer, without prior conversation:

```text
What workstreams exist?
Which can run now?
Who currently holds each execution lease?
Which mutable checkout belongs to which workstream?
Which waits are local versus global?
What unfinished work is dirty?
How durable is that work?
What may I safely execute next?
```

If those questions require the human to reconstruct the previous agents' interactions, the coordination state is insufficient.
