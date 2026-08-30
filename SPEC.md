# PPGP Specification v0.2.0

Status: Experimental / Provisional  
First published: 2026-08-24  
Target release: 2026-08-30  
Protocol: Portable Persistent Goal Protocol (PPGP)

## 1. Scope

PPGP defines a portable continuity and coordination protocol for long-running coding-agent work.

A conforming implementation SHOULD allow a fresh compatible agent to recover an unfinished software goal without requiring the human operator to reconstruct the previous conversation.

When several active workstreams, executors, branches, worktrees, dependencies, or partial wait conditions coexist, a conforming implementation SHOULD additionally allow an agent to determine what work is safe and useful to execute next without disturbing foreign unfinished work.

PPGP is model-vendor neutral and repository-oriented.

The portable protocol core defines logical roles and semantics. It does not require the reference JSON layout, the reference CLI, Git worktrees, MCP, a hosted service, a database, or a particular model provider.

Core invariants include:

```text
PORTFOLIO != WORKSTREAM != LEASE HOLDER != CHECKOUT

executor unavailable != workstream blocked
blocked action != blocked workstream
blocked workstream != blocked project
```

## 2. Normative language

The terms MUST, MUST NOT, SHOULD, SHOULD NOT and MAY describe protocol requirements and recommendations.

## 3. Logical memory and coordination roles

PPGP defines logical roles, not mandatory filenames or storage formats.

### 3.1 CONSTITUTION

Long-lived mission, authority, invariants and non-negotiable project constraints.

It SHOULD change rarely.

### 3.2 ROADMAP

Current project direction, completed goals, future goals, dependencies and deferred work.

It SHOULD describe state and direction, not preserve a full execution diary.

### 3.3 MEMORY

Durable facts that future agents would otherwise need to rediscover.

Good candidates include architectural decisions, non-obvious invariants, validated operational facts, expensive failed approaches worth avoiding, durable repository conventions, authority decisions and recurring failure modes.

A MEMORY item SHOULD change future behavior.

### 3.4 ACTIVE_GOAL

Temporary working memory for one substantial active goal.

A single-workstream repository MAY continue to use one ACTIVE_GOAL exactly as in PPGP v0.1.x.

It SHOULD remain compact enough for a fresh agent to recover the goal in one read.

Minimum logical information remains:

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

ACTIVE_GOAL MUST NOT become the permanent chronological history.

ACTIVE_GOAL MUST be removed after successful closure and distillation when it is the active temporary representation.

### 3.5 PORTFOLIO

PORTFOLIO is an optional project-level coordination view of multiple active workstreams.

It exists only when concurrent or otherwise ambiguous active work makes project-level scheduling necessary.

PORTFOLIO MUST NOT duplicate detailed goal reasoning, frozen decisions, Definition of Done, or execution chronology already owned by workstream/goal state.

A project with one unambiguous active goal MAY omit an explicit PORTFOLIO.

### 3.6 WORKSTREAM

A WORKSTREAM is an independently schedulable unit of useful work inside a project.

A workstream MAY correspond to:

- a complete goal;
- a bounded sub-goal;
- a parallel implementation track;
- an independent review or verification track;
- an infrastructure track whose execution can be scheduled independently.

A workstream SHOULD have one canonical state representation.

### 3.7 EXECUTION_LEASE

An EXECUTION_LEASE identifies the executor/session currently entitled to mutate one workstream.

A lease coordinates execution. It does not grant product, legal, financial, production, credential, or other human authority.

A lease SHOULD carry a monotonically increasing generation or equivalent fencing value when takeovers or concurrent writers are possible.

A stale lease generation MUST NOT overwrite a newer canonical generation.

Lease expiration or executor disappearance MUST NOT authorize destructive cleanup of dirty work.

### 3.8 CHECKOUT_CLAIM

A CHECKOUT_CLAIM identifies a mutable repository workspace assigned to a workstream.

Examples include a primary checkout, Git worktree, isolated clone, or equivalent VCS workspace.

Writable checkout claims SHOULD be exclusive by default.

Read-only inspection MAY be shared.

Two workstreams MUST NOT simultaneously assume exclusive write ownership of the same mutable checkout unless the repository explicitly provides a safe concurrent-editing mechanism.

Checkout claims SHOULD remain local/runtime coordination state rather than durable project memory unless the implementation has a specific reason to persist them.

### 3.9 WAIT_CONDITION

A WAIT_CONDITION records a condition preventing a specific action or broader unit from proceeding.

Every material wait SHOULD identify:

```text
kind
scope
dependency
resume_condition
```

Recommended kinds:

```text
EXTERNAL
AUTHORITY
TECHNICAL
```

Recommended scopes:

```text
ACTION
WORKSTREAM
GOAL
PROJECT
```

The narrowest defensible scope SHOULD be used.

### 3.10 AUTHORITY_GATE

An AUTHORITY_GATE binds human authority to a specific action.

Recommended states:

```text
REQUIRED
GRANTED
CONSUMED
REVOKED
```

An agent MUST NOT grant its own authority gate.

A granted gate authorizes only the action or scope it explicitly names.

Credentials and secrets MUST NOT be stored merely to represent an authority gate.

### 3.11 DURABILITY

DURABILITY describes how recoverable unfinished work is if the current executor disappears.

Recommended levels:

```text
SESSION_ONLY
HOST_DURABLE
REPO_DURABLE
REMOTE_DURABLE
```

SESSION_ONLY means material state exists only in volatile agent/session context.

HOST_DURABLE means the work survives the agent session on the current host, for example as identified dirty files in a worktree.

REPO_DURABLE means a local version-control object or equivalent repository recovery artifact exists.

REMOTE_DURABLE means the recovery artifact survives loss of the current host.

PPGP does not require every intermediate change to be REMOTE_DURABLE. The purpose is to make recovery risk explicit.

### 3.12 GIT / FORENSIC HISTORY

Git or the repository's equivalent history remains the forensic record of what actually changed.

PPGP memory SHOULD preserve meaning and current state rather than duplicate chronology.

Git SHOULD NOT be treated as a high-frequency distributed lease server by the portable protocol core.

## 4. Goal lifecycle

The PPGP lifecycle remains:

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

### THINK

Inspect, research, compare alternatives and determine an executable strategy.

### FREEZE

Record the selected strategy, critical invariants, Definition of Done and authority boundaries.

After FREEZE, an agent SHOULD NOT reopen strategy merely because another agent would have chosen differently.

Replanning is justified when new evidence materially invalidates a frozen assumption.

### EXECUTE

Perform the work autonomously within frozen strategy and delegated authority.

### HARDEN

Attack the implementation through tests, edge cases, security review, independent review or other relevant verification.

HARDEN improves the selected solution. It is not a default invitation to redesign it.

### SHIP

Verify implementation in the environment required by Definition of Done.

When production behavior is part of Definition of Done, local success alone MUST NOT close the goal.

### DISTILL

Move durable information into ROADMAP, MEMORY or CONSTITUTION as appropriate.

Discard temporary chronology and redundant execution detail.

DISTILL is consolidation and garbage collection. It is not the primary survival mechanism for unfinished work.

### CLOSED

A goal is CLOSED only after synchronous Definition-of-Done requirements are verified and temporary working memory has been garbage-collected.

## 5. Workstream execution state

Lifecycle PHASE and execution RUN_STATE are orthogonal.

PHASE answers:

> What kind of work is this workstream doing?

RUN_STATE answers:

> Can useful execution proceed now, and is an executor currently responsible for it?

Recommended RUN_STATE values are:

```text
RUNNABLE
RUNNING
WAITING
RECOVERY_REQUIRED
PARKED
COMPLETED
```

### RUNNABLE

At least one safe useful action can execute now and no current execution lease is actively performing it.

### RUNNING

A valid lease holder is actively executing the workstream.

RUNNING SHOULD require a current execution lease or equivalent ownership proof.

### WAITING

No safe useful action can currently advance the workstream because one or more recorded waits or unsatisfied dependencies prevent progress.

WAITING is intentionally neutral. Typed wait conditions retain the actual reasons.

Implementations MAY display derived convenience labels such as `WAITING_EXTERNAL`, but those labels MUST NOT erase simultaneous wait kinds.

### RECOVERY_REQUIRED

The previous executor became unavailable, ownership became ambiguous, or unfinished mutable state must be inspected before ordinary execution resumes.

RECOVERY_REQUIRED is a recoverable safety state, not a declaration that the goal has failed.

### PARKED

The workstream is intentionally deferred despite potentially being runnable.

### COMPLETED

The workstream has satisfied its completion contract.

A parent goal or portfolio may remain open.

## 6. Scoped waits and blockers

A wait MUST NOT be promoted to a broader scope merely because one action cannot proceed.

Before marking an entire workstream WAITING, an agent SHOULD determine whether any safe useful independent work remains.

If independent work remains, the workstream SHOULD remain RUNNABLE or RUNNING and the wait SHOULD stay scoped to the blocked action or dependency.

The rule applies recursively:

```text
blocked action != blocked workstream
blocked workstream != blocked goal
blocked goal != blocked project
```

PPGP v0.1.x blocker classes remain valid:

```text
A agent-solvable
B external asynchronous
C authority boundary
D hard dependency
```

Type and scope are separate concepts.

Routine technical uncertainty MUST NOT be promoted to an authority gate merely to avoid responsibility.

## 7. Authority gates

An authority requirement SHOULD be tied to the exact action requiring authority.

Example:

```text
action=create_paid_compute
state=GRANTED
```

This does not authorize unrelated spending, production mutation, or architectural change.

A gate MAY remain granted while another unrelated wait condition is unsatisfied.

A consumed or revoked gate MUST NOT be reused as current authority.

## 8. Dependencies

Workstream dependencies MUST be explicit when they affect scheduling.

A minimal dependency expresses:

```text
workstream=<id>
condition=COMPLETED
```

An implementation MUST NOT infer dependency solely from:

- branch names;
- checkout location;
- executor identity;
- document order;
- conversation order;
- historical accident.

Dependency graphs MUST be acyclic.

A cycle is invalid coordination state.

An unsatisfied dependency blocks only its dependent workstream unless broader evidence justifies a wider scope.

Complex conditional dependency expressions are outside the v0.2 portable core.

## 9. Portfolio runnability

PORTFOLIO runnability is derived from canonical workstream state and dependencies.

A useful reference aggregation is:

```text
if any eligible workstream is RUNNING:
    portfolio = RUNNING
else if any eligible workstream is RUNNABLE:
    portfolio = RUNNABLE
else if any eligible workstream is RECOVERY_REQUIRED:
    portfolio = RECOVERY_REQUIRED
else if unfinished non-parked work remains:
    portfolio = WAITING
else if all workstreams are COMPLETED:
    portfolio = COMPLETED
else:
    portfolio = IDLE
```

An implementation MAY use different display labels if equivalent semantics are preserved.

The normative invariant is:

```text
A non-runnable workstream MUST NOT imply a non-runnable portfolio.
```

## 10. Revision and compare-and-swap semantics

When multiple writers may update canonical machine state, implementations SHOULD use a revision number, generation, compare-and-swap operation, lock, or equivalent concurrency control.

A stale revision MUST NOT silently overwrite newer canonical state.

The reference implementation uses monotonically increasing integer revisions plus a local mutation lock.

Multi-machine implementations SHOULD provide atomic storage or equivalent compare-and-swap semantics.

PPGP does not require a specific storage engine.

## 11. Execution lease semantics

A reference lease contains information equivalent to:

```text
holder
generation
status
claimed_at
expires_at
```

Recommended lease states include:

```text
CLAIMED
HANDOFF_READY
RECOVERY_REQUIRED
RELEASED
```

Claiming a lease SHOULD make the workstream RUNNING.

Parking, completion, or a full workstream WAIT SHOULD release active execution ownership unless the implementation has a documented reason to retain it.

A cooperative handoff SHOULD transfer ownership atomically and increment generation.

A takeover after interruption SHOULD increment generation or an equivalent fencing value so an older executor can detect that it no longer owns mutation rights.

Provider cooldown, quota exhaustion, terminal loss, process crash or model-session loss is executor availability, not automatically a GOAL blocker.

## 12. Checkout safety

Before mutating a checkout in concurrent or ambiguous conditions, an agent SHOULD inspect, where available:

```text
current branch
HEAD
working-tree dirtiness
known worktrees/checkouts
checkout claim
execution lease
```

If a checkout contains foreign dirty work, an agent MUST NOT by default:

- switch branches;
- reset;
- clean;
- stash foreign changes;
- commit foreign changes;
- overwrite files;
- repurpose the checkout.

When reversible and allowed by project policy, the preferred response is safe isolation, such as a separate Git worktree or equivalent workspace.

Creating such isolation SHOULD normally be treated as an agent-solvable coordination action, not a human authority boundary.

A useful reference mutation rule is:

```text
valid execution lease
+ checkout claimed by same workstream
+ actual branch matches declared branch
= mutation permitted by the coordination layer
```

This rule does not supersede project security, human authority or repository-specific constraints.

## 13. Inner execution loop

Inside a goal or workstream, implementations SHOULD use:

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

### RETRIEVE

Load only state and evidence relevant to the current decision.

Concurrent contexts SHOULD additionally retrieve relevant portfolio, lease, checkout, wait and dependency state.

### ACT

Perform the next bounded action.

### VERIFY

Check observable evidence rather than relying on model confidence.

When checkout ownership matters, observed branch/HEAD/dirtiness SHOULD be checked before mutation.

### DELTA

Record only material state changes needed for continuation.

Do not turn every trivial action into a persistent write.

## 14. Boot and recovery

A fresh single-workstream agent SHOULD start from a minimal boot packet:

```text
GOAL_CONTRACT
+ HOT_STATE
+ RELEVANT_MEMORY
+ RELEVANT_EVIDENCE
```

For concurrent or ambiguous work, recovery SHOULD additionally answer:

```text
What workstreams exist?
Which are runnable?
Which executor owns each active lease?
Which mutable checkout belongs to which workstream?
Which waits are local versus global?
What dependencies are unsatisfied?
How durable is unfinished work?
What may I safely execute next?
```

If unfinished dirty or uncertain mutable state may exist after executor loss, recovery SHOULD enter or treat the workstream as RECOVERY_REQUIRED before ordinary mutation resumes.

## 15. Abrupt interruption and takeover

A cooperative handoff and abrupt takeover are different protocol events.

For RECOVERY_REQUIRED work, a recovery agent SHOULD:

```text
1. read canonical goal/workstream and portfolio state
2. inspect real workspace branch, HEAD and dirtiness
3. preserve unfinished state exactly as found
4. compare observed state with the last checkpoint
5. classify durability and unresolved uncertainty
6. run proportionate verification when practical
7. record takeover with a new lease generation
8. continue from the smallest verified next action
```

A recovery agent MUST NOT use destructive workspace normalization merely to obtain a clean status or simplify takeover.

## 16. Evidence precedence

When technical claims conflict, implementations SHOULD prefer more direct evidence.

A useful default order is:

```text
production/runtime behavior
> automated verification
> current repository/workspace implementation
> Git history
> current canonical PPGP state
> durable MEMORY
> ROADMAP
> conversation claims
> agent recollection
```

CONSTITUTION remains authoritative for project policy and authority.

Recorded lease, checkout and dirty-state metadata is last-known coordination evidence. Current observed workspace state takes precedence when the two conflict.

## 17. Human interruption policy

The default is agent autonomy inside established authority.

Human escalation SHOULD be reserved for genuine authority boundaries such as irreversible destructive actions, legal or financial commitments, unavailable credentials or external authorization, genuinely ambiguous product policy, brand/governance authority, material changes to frozen architecture, and actions outside delegated permissions.

Before escalating one blocked workstream, an agent SHOULD continue unrelated permitted RUNNABLE work when safe.

Human escalation SHOULD identify the smallest blocked scope and exact decision required.

## 18. Multi-agent policy

PPGP does not require multiple agents.

A second agent SHOULD be introduced only when expected independent information gain or parallel useful work exceeds communication and coordination cost.

Concurrent agents SHOULD operate on isolatable or explicitly coordinated workstreams.

A reviewer SHOULD receive artifact, requirements and relevant facts without unnecessary exposure to implementer self-assessment.

The existence of PORTFOLIO, leases or checkout claims does not imply that many agents should run simultaneously.

## 19. Handoff format

Handoffs SHOULD prefer compact structured state or deltas over narrative transcripts.

Single-workstream handoffs MAY retain the v0.1.x compact form.

Concurrent handoffs SHOULD carry equivalent information to:

```text
WS=<workstream id>
P=<phase>
R=<run state>
L=<lease holder/status/generation>
W=<scoped waits>
U=<durability>
E=<evidence refs>
N=<next action>
```

Exact encoding is not normative.

## 20. Distillation and garbage collection

Before closing a goal, material temporary state SHOULD be classified:

```text
strategic authority/invariant -> CONSTITUTION
current/future direction      -> ROADMAP
durable reusable lesson       -> MEMORY
temporary execution detail    -> discard
```

At workstream closure:

- live lease state SHOULD be released;
- obsolete checkout claims SHOULD be removed;
- transient executor identity SHOULD NOT become durable memory unless it changes future behavior;
- portfolio coordination SHOULD shrink as workstreams complete.

Git remains the detailed forensic archive.

## 21. Reference implementation

The official CLI MAY use the following non-normative layout:

```text
.ppgp/
├── portfolio.json
└── workstreams/
    └── <id>/
        ├── state.json
        └── notes.md
```

In this reference representation:

- `portfolio.json` contains portfolio revision, workstream references and aggregation policy;
- `state.json` contains machine scheduling/coordination truth;
- `notes.md` contains human-readable WHY, Definition of Done, frozen decisions, invariants and progress context;
- scheduling fields SHOULD NOT be duplicated as competing canonical values in Markdown;
- local checkout claims live outside committed project state, preferably in a local VCS/runtime registry.

JSON is a reference implementation choice because it is deterministic and easy to validate. Other conforming implementations MAY use different representations.

## 22. Backward compatibility and migration

Without an explicit portfolio, an existing PPGP v0.1.x ACTIVE_GOAL remains a valid implicit one-workstream deployment.

Legacy commands SHOULD retain their behavior where no multi-workstream ambiguity exists.

In an explicit multi-workstream portfolio, a generic `goal` operation MUST NOT silently choose or replace an ambiguous workstream.

Migration SHOULD be copy-first and reversible:

```text
DISCOVER
-> COPY
-> VALIDATE EQUIVALENCE
-> CUTOVER
```

After CUTOVER, one representation MUST be canonical.

A legacy ACTIVE_GOAL MAY remain as a compatibility snapshot or projection, but implementations MUST NOT silently maintain two independently writable canonical truths.

Rollback SHOULD be possible while the compatibility source remains unchanged and no irreversible v0.2-only state has invalidated the rollback contract.

Migration is optional.

## 23. Reference CLI operations

The reference CLI MAY expose operations including:

```text
ppgp init
ppgp doctor
ppgp goal
ppgp status
ppgp handoff
ppgp migrate

ppgp workstream start
ppgp workstream status
ppgp workstream park
ppgp workstream resume
ppgp workstream handoff
ppgp workstream recover
ppgp workstream close

ppgp checkout status
ppgp checkout claim
ppgp checkout release
```

CLI syntax is implementation-specific and is not a protocol-core conformance requirement.

`doctor` SHOULD validate canonical state, duplicate IDs, dependency cycles, stale/expired leases where observable, and checkout/branch mismatches where the runtime exposes them.

## 24. Suggested operational metrics

PPGP retains optional v0.1.x metrics:

- HIG: Human Interruptions per Completed Goal.
- TPG: Tokens per Completed Goal.
- RSR: Recovery Success Rate.
- VWR: Verified Work Rate.
- MCR: Memory Compression Ratio.

Candidate v0.2 coordination measurements include:

- BSR: Blocker Scope Reliability.
- CCR: Checkout Collision Rate.
- TRR: Takeover Recovery Rate.
- DWR: Duplicate Work after Recovery.

These metrics define measurement ideas, not benchmark claims.

## 25. Interoperability

A PPGP implementation MUST NOT require a specific model provider.

It MAY integrate with:

- native model compaction;
- Agent Skills;
- MCP;
- vector or semantic retrieval;
- Git worktrees;
- CRDT-backed shared workspaces;
- remote lock services;
- heartbeats or fencing tokens;
- event logs or snapshot stores;
- provider-specific memory;
- multi-agent orchestrators.

These are optional accelerators or runtime mechanisms.

The portable control semantics SHOULD remain recoverable by another compatible agent without requiring one proprietary implementation.

## 26. Conformance tests

A robust PPGP v0.2 evaluation SHOULD retain the v0.1.x abrupt recovery test and add at least the following scenarios.

### C1. Foreign dirty checkout

Given foreign unfinished changes in a shared writable checkout, a parallel/replacement workstream does not reset, clean, stash, overwrite or repurpose that checkout by default and uses safe isolation when available.

### C2. Partial external wait

An action-scoped external dependency does not stop independent useful local work.

### C3. Abrupt executor loss

A dirty identified worktree survives executor disappearance and is recovered non-destructively with a new lease generation or equivalent fencing mechanism.

### C4. Independent workstream

One authority/external/technical wait does not stop another eligible RUNNABLE workstream.

### C5. Mixed waits

Several wait kinds remain visible without being collapsed into one lossy scalar state.

### C6. Revision conflict

A stale revision cannot silently overwrite newer canonical state.

### C7. Dependency cycle

A cyclic workstream dependency graph is rejected as invalid.

### C8. Checkout collision

Two exclusive mutation claims on the same mutable checkout are rejected.

### C9. Legacy compatibility

A v0.1.x single ACTIVE_GOAL remains recoverable without mandatory migration.

### C10. Reversible cutover

A copy-first migration can return to the unchanged legacy representation before irreversible divergence.

Passing a scenario demonstrates behavior only under the tested conditions. It does not establish universal superiority.

## 27. Progressive disclosure

Detailed coordination rules SHOULD be loaded only when concurrency, ownership ambiguity, partial blocking, takeover or equivalent conditions appear.

Simple single-workstream repositories SHOULD NOT pay the full token or attention cost of multi-workstream coordination rules.

## 28. Versioning

PPGP uses semantic specification versions.

v0.x releases remain experimental and may change incompatibly.

v0.2.0 is a minor-version increase within the experimental line because it changes the cardinality and conformance model from one primary active goal toward optional multi-workstream portfolio coordination while preserving v0.1.x single-goal compatibility.

The community is encouraged to report recovery and coordination failures before the protocol is declared stable.
