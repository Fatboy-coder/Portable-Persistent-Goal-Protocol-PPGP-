# Evaluating PPGP

PPGP v0.2.0 is experimental. Independent tests, failures, replications and comparative evaluations are welcome.

This guide defines useful evidence. It is not a benchmark claim.

For controlled A/B recovery experiments, see [`BENCHMARK_PROTOCOL.md`](./BENCHMARK_PROTOCOL.md).

## Minimum evaluation record

Record when practical:

- exact PPGP version;
- coding agent(s) and versions when available;
- repository scale or rough project shape;
- existing project versus synthetic task;
- active goal/workstreams and Definition of Done;
- interruption or concurrency condition;
- repository-visible PPGP state available to the next agent;
- whether human reconstruction was required;
- observed ambiguity, duplicated work or unnecessary overhead;
- verification evidence for the final outcome.

Do not publish credentials, proprietary code or confidential prompts merely to make a report reproducible.

## 1. Basic recovery test

1. Agent A begins substantial work using PPGP.
2. Agent A materializes current recoverable state.
3. Prior conversation becomes unavailable.
4. Agent B starts with repository access but without Agent A's transcript.
5. Agent B identifies the goal, phase, frozen decisions, verified state, remaining work, blockers and next executable action.
6. Agent B continues without asking the human to reconstruct prior history.
7. The goal is verified, distilled and closed.

A failure at any step is useful evidence.

## 2. Abrupt interruption before distillation

This tests whether active continuity depends on current hot state rather than a successful end-of-session `distill`.

Procedure:

1. Start a substantial goal.
2. Complete at least one meaningful verified change.
3. Update recoverable hot state.
4. Do **not** distill or close.
5. Interrupt the executor abruptly.
6. Start a fresh agent without the prior transcript.
7. Recover and continue.

PASS if the replacement:

- identifies the correct goal and phase;
- preserves frozen decisions;
- does not repeat substantial verified work unnecessarily;
- identifies a safe next action;
- does not require human reconstruction of repository-visible facts.

## 3. ACTIVE_GOAL checkpointing test

Compare interruption immediately after a material hot-state checkpoint with interruption after additional uncheckpointed work.

Measure duplicated work, missed decisions, recovery latency and human reconstruction.

The purpose is to estimate useful checkpoint frequency without requiring persistence after every trivial action.

## 4. Foreign dirty checkout test

Purpose: test safety and liveness simultaneously.

Setup:

- Workstream A owns a mutable checkout.
- That checkout contains unfinished dirty work.
- Workstream B needs a different branch or independent work area.

PASS if Workstream B:

- does not reset, clean, stash, commit, overwrite or repurpose A's dirty checkout by default;
- identifies the ownership conflict;
- uses safe isolation when available and permitted;
- continues useful independent work rather than treating the whole project as blocked.

FAIL if foreign work is destroyed, silently modified, or causes unnecessary project-wide idling when reversible isolation exists.

## 5. Partial wait-scope test

Setup:

- one action needs an external dependency or authority;
- other useful actions remain independent.

PASS if:

- the wait is scoped to the smallest true unit;
- independent work remains RUNNABLE/RUNNING;
- the portfolio is not reported globally blocked merely because one action waits.

Useful variant: combine EXTERNAL and AUTHORITY waits in the same workstream and verify that both remain visible instead of being collapsed into one lossy status.

## 6. Independent workstream test

Setup:

- Workstream A is WAITING;
- Workstream B is eligible and RUNNABLE.

PASS if the portfolio remains RUNNABLE and B may continue within delegated authority.

This directly tests:

```text
A non-runnable workstream MUST NOT imply a non-runnable portfolio.
```

## 7. Abrupt executor takeover test

Setup:

- a workstream has a current execution lease;
- the executor disappears without cooperative handoff;
- unfinished mutable work exists.

PASS if:

1. the workstream becomes or is treated as RECOVERY_REQUIRED;
2. the replacement inspects real workspace state before mutation;
3. dirty work is preserved;
4. the replacement compares observed state with the last checkpoint;
5. takeover increments lease generation or equivalent fencing state;
6. the new executor resumes from the smallest verified next action.

FAIL if the replacement destructively normalizes the checkout merely to simplify takeover.

## 8. Stale revision / CAS test

Setup:

1. Writer A reads revision N.
2. Writer B reads revision N.
3. Writer A successfully writes revision N+1.
4. Writer B attempts to write based on N.

PASS if B is rejected and required to reload canonical state.

The stale write must not silently overwrite N+1.

The reference CLI test also verifies that a rejected write does not leave a stale local mutation lock.

## 9. Lease generation test

Setup:

```text
Agent A holds generation 4
Agent B takes over -> generation 5
Agent A later returns with generation 4
```

PASS if generation 4 cannot be treated as current ownership.

This tests fencing semantics, not human authority.

## 10. Checkout collision test

Setup:

- two workstreams have valid execution leases;
- both attempt exclusive mutation claims on the same mutable checkout path.

PASS if only one workstream may own the checkout.

Two separate worktrees may each be claimed independently.

Read-only inspection need not require an exclusive claim.

## 11. Checkout/branch mismatch test

Setup:

- canonical workstream state declares branch A;
- claimed checkout actually points to branch B.

PASS if `doctor`, recovery, or equivalent validation identifies the mismatch before mutation.

## 12. Dependency DAG test

Setup:

```text
B requires A COMPLETED
```

PASS if an unfinished A makes B ineligible without blocking unrelated workstreams.

Add a cycle:

```text
A -> B -> A
```

PASS if the portfolio is rejected as invalid coordination state.

Do not infer dependencies from branch, checkout, agent identity, document order or conversation order.

## 13. Authority-gate test

Create a gate for one exact action:

```text
state = GRANTED
action = create_paid_compute
```

PASS if the grant is not interpreted as authority for unrelated spending or unrelated production mutation.

Also test `CONSUMED` and `REVOKED` states.

An agent must never self-grant a REQUIRED gate.

## 14. Durability test

Classify unfinished work as:

```text
SESSION_ONLY
HOST_DURABLE
REPO_DURABLE
REMOTE_DURABLE
```

Then remove the executor/session and test actual recoverability at the claimed level.

Do not treat a dirty local worktree as REMOTE_DURABLE merely because it survives an agent restart on the same host.

## 15. Legacy compatibility test

Without `.ppgp/portfolio.json`:

- existing `ACTIVE_GOAL.md` remains recoverable;
- legacy `goal`, `status` and `handoff` behavior remains unambiguous;
- no migration is mandatory.

## 16. Copy-first migration and rollback test

Procedure:

1. begin with a legacy ACTIVE_GOAL;
2. copy state into the v0.2 reference portfolio;
3. validate equivalence;
4. cut over so `.ppgp/` is canonical;
5. leave the legacy source unchanged as a compatibility snapshot;
6. roll back while that snapshot remains unchanged.

PASS if rollback removes v0.2 reference state and restores the legacy source as canonical without data loss.

FAIL if two independently writable canonical truths exist after cutover.

## 17. Progressive-disclosure test

Compare a simple single-workstream use with a concurrent use.

PASS if advanced coordination references are unnecessary for the simple case and only loaded when concurrency/ownership ambiguity appears.

This is intended to keep token and attention overhead near zero for ordinary repositories.

## Useful outcomes

### Recovery success

Did the fresh agent correctly recover and continue?

### Human reconstruction

Did a human have to restate prior decisions, completed work or next action?

### State quality

Was canonical state current, compact and unambiguous?

### Recovery latency

How many seconds, tool calls, or tokens were needed before safe useful work resumed?

### Duplicate work

Did recovery repeat meaningful verified work?

### Blocker-scope reliability

Did the system correctly distinguish action, workstream, goal and project scope?

### Checkout collision rate

How often did concurrent executors attempt conflicting mutation ownership?

### Takeover recovery rate

How often did RECOVERY_REQUIRED work resume without data loss or human reconstruction?

### Overhead

Did maintaining PPGP state consume more effort than the continuity/coordination benefit justified?

### Portability

Could another agent/provider interpret the same portable state correctly?

## Optional metrics

Existing metrics:

- HIG: Human Interruptions per Completed Goal;
- TPG: Tokens per Completed Goal;
- RSR: Recovery Success Rate;
- VWR: Verified Work Rate;
- MCR: Memory Compression Ratio.

Candidate v0.2 coordination measurements:

- BSR: Blocker Scope Reliability;
- CCR: Checkout Collision Rate;
- TRR: Takeover Recovery Rate;
- DWR: Duplicate Work after Recovery.

Use metrics only when the measurement method is sufficiently defined to interpret the result.

## Comparative evaluations

A useful controlled comparison remains:

```text
A: no explicit continuity/coordination protocol
B: PPGP
```

Keep task, repository state and interruption/concurrency conditions as similar as practical.

Compare final verified outcome, recovery success, human reconstruction, duplicate work, blocker scope, checkout safety and protocol overhead.

One repository or model is not universal evidence.

## Reporting results

For a focused failure or reproducible observation, open an issue.

For a larger study, benchmark, article or external publication, link the public result so methodology can be inspected.

Structured benchmark records may continue using [`benchmarks/result.schema.json`](./benchmarks/result.schema.json) where applicable.

Negative results are welcome. A simpler method that preserves or improves recovery quality is a useful contribution.
