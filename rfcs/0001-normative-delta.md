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
```

If the prior executor disappeared and dirty/uncertain mutable state may exist, RUN_STATE SHOULD become or be treated as RECOVERY_REQUIRED until inspected.

## 7. Evidence-precedence delta

Keep the existing evidence hierarchy.

Add this rule:

Recorded checkout/dirty/lease state is last-known coordination evidence, not permission to ignore current observed repository state.

Observed branch, HEAD, worktree, and dirty state take precedence over stale coordination metadata.

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
dirty state
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

Prefer safe isolation when available.

## 13. New takeover requirements

For RECOVERY_REQUIRED work:

```text
read coordination + goal state
-> inspect real workspace
-> preserve dirty state
-> compare with last checkpoint
-> classify durability/uncertainty
-> verify proportionately
-> record takeover/new lease
-> resume smallest verified next action
```

Destructive workspace normalization MUST NOT be used merely to simplify takeover.

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

No one mechanism is required for PPGP conformance.

## 18. Reference mapping delta

Retain existing common mapping.

Add an optional example only:

```text
PORTFOLIO -> docs/PPGP_PORTFOLIO.md or equivalent
```

Do not make that filename normative.

## 19. Conformance-test delta

Retain the v0.1.2 abrupt recovery test.

Add at least these cases:

### C1 Foreign dirty checkout

Replacement/parallel work preserves foreign dirty state and uses safe isolation where available.

### C2 Partial external wait

Action-scoped external wait does not stop independent local work.

### C3 Abrupt executor loss

Dirty identified work survives executor disappearance and is recovered non-destructively.

### C4 Independent workstream

One authority/external-blocked workstream does not stop another RUNNABLE workstream.

### C5 Mixed waits

Multiple wait kinds remain visible without being collapsed into a lossy scalar state.

## 20. Skill implementation delta

Keep `skills/ppgp/SKILL.md` compact.

Add one trigger instruction telling the agent to load:

```text
references/COORDINATION.md
```

only when concurrency, ownership ambiguity, partial blocking, or takeover appears.

This preserves progressive disclosure and avoids charging single-workstream users the token cost of coordination rules.

## 21. CLI implementation delta

Keep current commands backward compatible.

Prototype the smallest useful additions before freezing syntax:

```text
ppgp status --all
ppgp claim
ppgp release
ppgp recover
```

Do not release these commands until persistence semantics and tests are stable.

## 22. Versioning delta

The change is intentionally `0.2.0`, not `0.1.3`, because it adds new protocol primitives and conformance behavior while the project is still in the experimental `0.x` line.

Update package, specification, Agent Skill metadata, adapters, mirrors, citation metadata, docs, release assets, and version-consistency fixtures atomically at release time.
