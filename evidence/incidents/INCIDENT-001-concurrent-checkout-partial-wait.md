# Incident 001: Shared Checkout Conflict + Partial External Wait

Date observed: 2026-08-30  
Evidence class: Real project incident, generalized for public protocol design  
PPGP version in use: 0.1.x lineage  
Outcome: Recovered without destructive checkout mutation

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
-> identify branch/HEAD/dirtiness
-> preserve changes
-> compare with last checkpoint
-> verify proportionately
-> record takeover
-> continue
```

If the prior lease ended cleanly and no ambiguous mutable state remains, executor unavailability may simply make the workstream RUNNABLE again.

If unfinished dirty or uncertain state exists, the correct interim state is RECOVERY_REQUIRED until takeover inspection establishes safe ownership.

## Protocol gaps identified

The incident exposed seven gaps:

1. PPGP v0.1.x assumes one primary ACTIVE_GOAL and does not explicitly coordinate several simultaneous workstreams.
2. Lifecycle phase does not express whether a workstream is currently runnable.
3. Blockers and waits have no normative scope.
4. Writable checkout ownership is implicit.
5. Temporary agent execution ownership and takeover are implicit.
6. The durability of unfinished dirty work is not visible.
7. Executor availability can be mistaken for workstream availability.

## v0.2.0 design consequences

RFC 0001 proposes:

- PORTFOLIO / workstream coordination;
- WORKSTREAM;
- RUN_STATE separate from lifecycle PHASE;
- scoped typed wait conditions;
- EXECUTION_LEASE;
- CHECKOUT_CLAIM;
- RECOVERY_REQUIRED takeover;
- explicit unfinished-work durability levels;
- executor unavailability treated as a runtime-capacity condition rather than an automatic GOAL blocker.

## Generalized invariant

The most important lesson is:

```text
PROTECT FOREIGN WORK
AND
CONTINUE INDEPENDENT SAFE WORK
```

Safety without liveness causes needless idling.

Liveness without ownership safety risks data loss.

PPGP v0.2.0 should require both.
