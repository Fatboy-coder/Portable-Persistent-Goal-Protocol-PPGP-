# Incident 001: Shared Checkout Conflict + Partial External Wait

Date observed: 2026-08-30  
Evidence class: Real project incident, generalized for public protocol design  
PPGP version in use: 0.1.x lineage  
Outcome: Recovered without destructive checkout mutation; interrupted host-only work later promoted to verified remote durability

## Privacy note

This record intentionally removes product-specific repository names, infrastructure identifiers, credentials, local paths, and proprietary implementation details.

The purpose is to preserve only the protocol-relevant failure pattern.

## Initial state

One repository contained at least two independent active workstreams.

Workstream A:

- was being executed by Agent A;
- occupied the shared primary checkout;
- was on an A-specific branch;
- contained several hours of uncommitted work.

Workstream B:

- was being executed by Agent B;
- required a different branch;
- had a future infrastructure action that depended on external connection details not yet available;
- still had substantial local implementation and verification work that did not depend on those details.

## Failure pattern 1: checkout safety versus liveness

Agent B correctly detected that switching the shared checkout could disturb or lose Agent A's dirty work.

Agent B therefore refused to switch the shared checkout.

That safety decision was correct.

The coordination failure was treating the checkout conflict as though it prevented Workstream B from making any progress.

## Recovery 1

A separate Git worktree was created for Workstream B.

This preserved Agent A's dirty shared checkout while allowing Agent B to continue independently.

Protocol lesson:

```text
foreign dirty checkout
!=
project-wide blocker
```

When safe isolation is available, workspace isolation is preferable to either destructive normalization or unnecessary idling.

## Failure pattern 2: external wait promoted too far

A later remote action in Workstream B required external connection details.

The dependency was real.

The incorrect interpretation was:

```text
remote action WAITING_EXTERNAL
=> entire workstream WAITING_EXTERNAL
```

Local implementation and verification were still possible.

Protocol lesson:

```text
wait conditions require explicit scope
```

The external wait should have applied only to the remote action until all independent local work was exhausted.

## Recovery 2

Workstream B continued local engineering in its isolated worktree while the remote action remained waiting.

This separated two truths that had previously been conflated:

```text
LOCAL_ENGINEERING = RUNNABLE/RUNNING
REMOTE_EXECUTION  = external action wait
```

## Failure pattern 3: abrupt executor unavailability with dirty isolated work

After substantial local progress, Agent B became temporarily unavailable before a cooperative handoff.

The isolated worktree contained many modified files and significant uncommitted changes.

The work was still present on the host, but PPGP v0.1.x did not explicitly represent:

- temporary execution ownership;
- checkout ownership;
- takeover state;
- dirty-workspace recovery rules;
- durability level of unfinished work.

The executor becoming unavailable did not make the underlying workstream semantically blocked.

Protocol lesson:

```text
executor unavailable
!=
workstream blocked
```

A provider cooldown, quota boundary, process crash, terminal loss, or similar executor interruption is an execution-capacity event. It SHOULD NOT be promoted into a GOAL blocker when another compatible executor can safely recover or continue the work.

## Recovery requirement

A replacement agent must be able to inspect and continue the dirty isolated worktree without treating it as corruption and without resetting it merely to obtain a clean Git state.

The correct recovery sequence is observation before mutation:

```text
read goal and portfolio state
-> inspect workspace
-> identify branch/HEAD/tracked and untracked state
-> preserve changes
-> compare with last checkpoint
-> verify proportionately
-> record takeover
-> continue
```

If the prior lease ended cleanly and no ambiguous mutable state remains, executor unavailability may simply make the workstream RUNNABLE again.

If unfinished dirty or uncertain state exists, the correct interim state is RECOVERY_REQUIRED until takeover inspection establishes safe ownership.

## Follow-up observation 1: UI state versus canonical VCS state

When Agent A later resumed, the session UI displayed a very large `uncommitted changes` diff.

A read-only recovery audit showed instead:

- current HEAD equaled the pushed remote checkpoint;
- tracked diffs were empty;
- no interrupted merge/rebase/cherry-pick existed;
- the large UI diff corresponded to cumulative branch changes relative to the session-start commit rather than true uncommitted work.

Protocol lesson:

```text
session/UI diff label
!=
canonical workspace state
```

The correct response was not to reset, reconstruct, or discard anything. The agent reconciled the UI observation against Git and classified the workstream as clean at the tracked-state level.

## Follow-up observation 2: tracked-clean did not mean workspace-empty

The same audit found local untracked artifacts in the primary checkout, including foreign workstream material and a sensitive local-only credential artifact.

Nothing had been committed or leaked, but a broad staging command could have captured the foreign local state.

The repository therefore simultaneously had:

```text
current tracked state  = CLEAN
untracked local state  = PRESENT
ownership              = MIXED / FOREIGN
sensitivity            = SENSITIVE
```

Protocol lesson:

```text
tracked clean
!=
no local state
```

When this distinction matters, recovery should observe tracked state, untracked state, ownership and sensitivity separately rather than relying on one `dirty` boolean.

The active agent continued with explicit path staging and audited the staged-file set before commit. It did not clean, move, inspect destructively, or stage the foreign artifacts.

## Follow-up recovery: HOST_DURABLE to REMOTE_DURABLE

The interrupted Workstream B worktree was later recovered by a compatible executor.

The durable state at recovery time was split:

```text
last pushed checkpoint = REMOTE_DURABLE
newer dirty worktree   = HOST_DURABLE
```

The returning executor did not recreate the second lot from memory.

It:

1. performed a read-only audit of the existing worktree;
2. confirmed local HEAD and remote HEAD matched the last pushed checkpoint;
3. preserved the interrupted diff exactly as found;
4. checked that the diff matched the bounded intent recorded immediately before interruption;
5. completed only that bounded second lot;
6. ran focused verification and one complete affected verification pass;
7. staged only explicit allowed paths and audited the staged set;
8. committed the recovered work as a new checkpoint;
9. pushed it and verified local HEAD equaled remote HEAD.

Only after step 8 did the new work become REPO_DURABLE.

Only after step 9 did it become REMOTE_DURABLE.

Protocol lesson:

```text
REMOTE_DURABLE old checkpoint
+
HOST_DURABLE newer edits
!=
REMOTE_DURABLE current work
```

Durability attaches to a specific recovery artifact and must be promoted by evidence.

## Follow-up observation 3: claim, mechanism, evidence and canonical state

During the surrounding work, several human-readable claims were found to overreach what the mechanism actually guaranteed even though automated tests were green.

The durable lesson is broader than any one implementation detail:

```text
claim
== mechanism
== verification evidence
== canonical state
```

The equality is semantic, not textual.

A narrative or handoff may correct stale canonical state, but it must do so explicitly. Narrative state must not silently replace the canonical source merely because it is newer prose.

## Protocol gaps identified

The complete incident exposed ten gaps or ambiguities:

1. PPGP v0.1.x assumes one primary ACTIVE_GOAL and does not explicitly coordinate several simultaneous workstreams.
2. Lifecycle phase does not express whether a workstream is currently runnable.
3. Blockers and waits have no normative scope.
4. Writable checkout ownership is implicit.
5. Temporary agent execution ownership and takeover are implicit.
6. The durability of unfinished dirty work is not visible.
7. Executor availability can be mistaken for workstream availability.
8. A single clean/dirty workspace bit can hide important tracked/untracked ownership and sensitivity distinctions.
9. Session/UI state can be mistaken for canonical repository state.
10. Human-readable claims can outrun the mechanism, evidence, or canonical state even when tests are green.

## v0.2.0 design consequences

RFC 0001 proposes or now incorporates:

- PORTFOLIO / workstream coordination;
- WORKSTREAM;
- RUN_STATE separate from lifecycle PHASE;
- scoped typed wait conditions;
- EXECUTION_LEASE;
- CHECKOUT_CLAIM;
- RECOVERY_REQUIRED takeover;
- explicit unfinished-work durability levels;
- executor unavailability treated as a runtime-capacity condition rather than an automatic GOAL blocker;
- richer workspace observation when recovery risk matters: tracked state, untracked state, ownership and sensitivity;
- durability promotion only after the corresponding recovery artifact exists and is verified;
- evidence-consistency rules preventing UI/narrative claims from silently superseding canonical observed state.

## Generalized invariants

The most important lesson remains:

```text
PROTECT FOREIGN WORK
AND
CONTINUE INDEPENDENT SAFE WORK
```

The recovery extension is:

```text
OBSERVE
-> PRESERVE
-> RECONCILE
-> VERIFY
-> PROMOTE DURABILITY
-> CONTINUE
```

Safety without liveness causes needless idling.

Liveness without ownership safety risks data loss.

Recovery without evidence risks reconstructing fiction.

PPGP v0.2.0 should require all three.