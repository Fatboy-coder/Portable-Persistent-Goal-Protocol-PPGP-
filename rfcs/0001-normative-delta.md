# RFC 0001 Normative Delta: PPGP v0.1.2 -> v0.2.0

Status: Draft implementation handoff  
Base: PPGP Specification v0.1.2  
Target: PPGP Specification v0.2.0

This document is intentionally a delta, not a duplicate specification.

Apply it only after RFC 0001 semantics are accepted.

## 1. Scope delta

Extend the scope from continuity of one substantial active goal to continuity and safe coordination when multiple active workstreams, executors, or mutable checkouts coexist.

Add the invariant:

```text
executor unavailable != workstream blocked
blocked action != blocked workstream
blocked workstream != project blocked
```

Add the evidence-consistency rule:

```text
narrative/UI state MUST NOT silently supersede observed canonical state
```

## 2. Logical memory-role delta

Keep existing roles:

```text
CONSTITUTION
ROADMAP
MEMORY
ACTIVE_GOAL
GIT / FORENSIC HISTORY
```

Add optional roles activated only when concurrent or ambiguous execution exists:

```text
PORTFOLIO
WORKSTREAM
EXECUTION_LEASE
CHECKOUT_CLAIM
WAIT_CONDITION
DURABILITY
```

### PORTFOLIO

Project-level coordination view of active workstreams.

MUST NOT become a duplicate execution diary or a second copy of every ACTIVE_GOAL.

MAY be omitted for ordinary single-workstream execution.

### WORKSTREAM

Independently schedulable unit of useful work associated with a goal or bounded execution track.

### EXECUTION_LEASE

Temporary mutation ownership by an executor/session.

Lease loss or expiry MUST NOT authorize destructive cleanup of dirty work.

### CHECKOUT_CLAIM

Ownership declaration for a mutable checkout/worktree/isolated repository workspace.

Writable claims SHOULD be exclusive unless the repository provides an explicit safe concurrent-editing mechanism.

When recovery risk matters, implementations SHOULD distinguish observed workspace dimensions rather than collapsing everything into one dirty bit:

```text
tracked      = CLEAN | DIRTY | UNKNOWN
untracked    = NONE | PRESENT | UNKNOWN
ownership    = SELF | FOREIGN | MIXED | UNKNOWN
sensitivity  = NORMAL | SENSITIVE | UNKNOWN
```

This observation profile is non-mandatory storage. Its purpose is to prevent `tracked clean` from being misread as `no local state`.

### WAIT_CONDITION

Typed and scoped condition preventing a specific action or larger unit from proceeding.

### DURABILITY

Explicit recovery level for unfinished work.

Values:

```text
SESSION_ONLY
HOST_DURABLE
REPO_DURABLE
REMOTE_DURABLE
```

Durability applies to a specific recovery artifact. An older REMOTE_DURABLE checkpoint MUST NOT cause newer HOST_DURABLE edits to be described as REMOTE_DURABLE.

## 3. ACTIVE_GOAL delta

Keep all v0.1.2 ACTIVE_GOAL requirements.

Clarify that ACTIVE_GOAL remains goal truth while PORTFOLIO/workstream state handles cross-workstream coordination.

A concurrent implementation MUST avoid copying frozen decisions and Definition of Done into multiple conflicting sources of truth.

When one ACTIVE_GOAL is sufficient, no new coordination file is required.

## 4. Lifecycle delta

Do not change the lifecycle:

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

Add an orthogonal RUN_STATE for workstreams:

```text
RUNNABLE
RUNNING
WAITING
RECOVERY_REQUIRED
PARKED
COMPLETED
```

PHASE and RUN_STATE MUST NOT be conflated.

## 5. Inner-loop delta

Keep:

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

Extend RETRIEVE in concurrent contexts to include relevant portfolio, lease, checkout, and wait state.

Extend VERIFY before mutation to validate real workspace state when checkout ownership is relevant.

Extend VERIFY beyond green tests when a human-readable claim matters. The durable target is semantic agreement among:

```text
claim
mechanism
verification evidence
canonical state
```

If the claim overreaches the mechanism or evidence, narrow the claim or improve the mechanism before closure.

Extend DELTA to update coordination state only when a material coordination fact changes.

Do not turn Git commits into high-frequency lease heartbeats.

## 6. Boot/recovery delta

For ordinary single-workstream recovery, preserve the v0.1.2 boot sequence.

For concurrent/ambiguous recovery, the minimal boot packet SHOULD additionally answer:

```text
which workstreams exist
which are runnable
which executor last/currently owns execution
which checkout belongs to which workstream
which waits are scoped locally versus globally
how durable unfinished work is
whether tracked/untracked local state or foreign/sensitive artifacts affect safe mutation
```

If the prior executor disappeared and dirty/uncertain mutable state may exist, RUN_STATE SHOULD become or be treated as RECOVERY_REQUIRED until inspected.

## 7. Evidence-precedence delta

Keep the existing evidence hierarchy.

Add these rules:

Recorded checkout/dirty/lease state is last-known coordination evidence, not permission to ignore current observed repository state.

Observed branch, HEAD, tracked state, untracked state and worktree state take precedence over stale coordination metadata.

Session/UI labels such as `uncommitted changes`, progress counters or remembered branch state are observations, not canonical truth. Reconcile them against the VCS/workspace before mutation.

Narrative state MUST NOT silently supersede a conflicting canonical source. If the canonical source is stale, update it explicitly and preserve the evidence for that change.

## 8. Blocker-classification delta

Keep v0.1.2 blocker classes A/B/C/D.

Add mandatory scope to waits/blockers when concurrency or partial blocking is relevant:

```text
ACTION
WORKSTREAM
GOAL
PROJECT
```

The default SHOULD be the narrowest defensible scope.

An agent MUST NOT promote a wait to a broader scope merely because one dependency is unavailable.

Before marking a whole workstream WAITING, check whether independent useful work remains.

## 9. Human-interruption delta

Keep the existing authority boundary.

Add:

- checkout isolation and creation of a reversible worktree SHOULD normally be Type A agent-solvable work;
- before escalating a scoped authority blocker, continue unrelated permitted RUNNABLE work when safe;
- executor cooldown/quota/process loss MUST NOT by itself become a human authority request;
- human escalation SHOULD name the smallest blocked scope and exact decision required.

## 10. Multi-agent delta

Keep single-agent-by-default.

Add:

- multiple agents SHOULD work concurrently only when workstream isolation/coordination cost is acceptable;
- one agent MUST NOT mutate another workstream's foreign dirty checkout by default;
- additional agents MAY take over RECOVERY_REQUIRED work after non-destructive inspection.

## 11. Handoff delta

Keep the compact handoff principle.

For concurrent work, add optional fields or equivalent information:

```text
WS=<workstream id>
R=<run state>
L=<lease holder/state>
C=<checkout claim>
W=<scoped waits>
U=<durability>
```

Exact encoding remains non-normative.

A cooperative handoff and abrupt takeover MUST be distinguishable.

## 12. New workspace-safety requirements

Before mutating a checkout in concurrent/ambiguous conditions, inspect as available:

```text
current branch
HEAD
tracked state
untracked local state
existing worktrees/checkouts
checkout claim
execution lease
```

If foreign dirty work is present, MUST NOT by default:

```text
switch branches
reset
clean
stash foreign work
commit foreign work
overwrite
repurpose the checkout
```

If foreign or sensitive untracked state exists, broad staging commands SHOULD be avoided when they could capture it. Prefer explicit pathspec staging and inspect the staged-file set before commit.

Foreign work, secrets, private keys, generated bundles and unrelated workstream artifacts MUST NOT be staged merely because they share a checkout.

Prefer safe isolation when available.

## 13. New takeover requirements

For RECOVERY_REQUIRED work:

```text
read coordination + goal state
-> inspect real workspace
-> preserve mutable state exactly as found
-> compare with last durable checkpoint
-> classify tracked/untracked state, ownership, sensitivity, durability and uncertainty
-> reconstruct interrupted intent from canonical state + observed diff, not recollection alone
-> verify proportionately
-> record takeover/new lease
-> resume smallest verified next action
-> promote durability only after the corresponding checkpoint exists and is verified
```

Destructive workspace normalization MUST NOT be used merely to simplify takeover.

A useful durability promotion is:

```text
HOST_DURABLE dirty work
-> verified local checkpoint
-> REPO_DURABLE
-> verified remote checkpoint/artifact
-> REMOTE_DURABLE
```

An older REMOTE_DURABLE checkpoint does not automatically upgrade newer local edits.

## 14. New project scheduling rule

Add:

```text
if any permitted workstream is RUNNABLE or RUNNING:
    project is not blocked
```

When one workstream cannot proceed, the scheduler SHOULD seek another RUNNABLE workstream before reporting a project-wide stop.

## 15. Distillation/GC delta

Keep existing goal distillation.

At closure or retirement of a workstream:

- release/retire live lease state;
- remove obsolete checkout claims;
- preserve only durable reusable lessons and project direction;
- do not preserve transient executor identity as durable project memory unless it matters to future behavior.

PORTFOLIO coordination SHOULD shrink as workstreams complete.

## 16. Metrics delta

Keep HIG, TPG, RSR, VWR, MCR.

Candidate optional v0.2 coordination measurements:

```text
BSR  Blocker Scope Reliability
CCR  Checkout Collision Rate
TRR  Takeover Recovery Rate
DWR  Duplicate Work after Recovery
```

Metric names and formulas remain non-normative until evaluation design is reviewed.

Do not publish numeric performance claims merely because these metrics exist.

## 17. Interoperability delta

Explicitly classify richer coordination mechanisms as optional adapters:

```text
Git worktrees
MCP claim/status tools
CRDT shared workspaces
remote lock services
heartbeats
fencing tokens
event logs
snapshot stores
orchestrators
```

## 18. Conformance delta from observed recovery

Add evaluation scenarios for:

- disagreement between session/UI `uncommitted` labels and actual VCS state;
- tracked-clean workspaces that still contain foreign or sensitive untracked local state;
- recovery where an old pushed checkpoint is REMOTE_DURABLE while newer interrupted edits are only HOST_DURABLE;
- semantic consistency among human-readable claims, mechanisms, verification evidence and canonical state.

These scenarios were added after a real multi-workstream interruption was recovered without destructive normalization or human reconstruction of the interrupted diff.