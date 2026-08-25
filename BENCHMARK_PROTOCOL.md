# PPGP Recovery Benchmark Protocol v0.1

Status: Experimental / exploratory  
Protocol under test: PPGP v0.1  
Primary question: does repository-visible PPGP state improve recovery after an abrupt loss of conversational context?

This document defines a reproducible paired A/B experiment. It is an evaluation protocol, not evidence that PPGP is effective.

A successful pilot supports only the conditions actually tested. It does not establish universal superiority, scientific consensus, or production suitability for every repository or agent.

## 1. Hypotheses

Primary hypothesis:

- **H1 Recovery success:** after a standardized interruption, a fresh agent using PPGP is more likely to complete the original Definition of Done without human reconstruction than an otherwise comparable fresh agent without PPGP.

Secondary hypotheses:

- **H2 Human reconstruction:** PPGP reduces the amount of prior context the human must restate.
- **H3 Recovery latency:** PPGP reduces the work required before the recovering agent performs the first materially goal-advancing action.
- **H4 Duplicate work:** PPGP reduces avoidable repetition of work already verified before interruption.
- **H5 Net overhead:** the cost of maintaining PPGP state is smaller than the recovery cost it avoids under the tested interruption conditions.

The benchmark MUST report results that contradict these hypotheses as readily as results that support them.

## 2. Experimental design

Use a paired design whenever practical.

Each pair uses:

- the same repository snapshot;
- the same task and Definition of Done;
- the same agent product, model, model version, tool permissions and budget where controllable;
- isolated working copies or branches;
- fresh recovery sessions with no access to the interrupted conversation;
- the same standardized interruption rule.

The only intended treatment difference is continuity protocol availability.

### Condition A: CONTROL

The agent receives the repository, Git history and normal project documentation, but no PPGP skill, PPGP-specific instructions or PPGP ACTIVE_GOAL state.

Do not deliberately cripple ordinary repository documentation. The control should represent a reasonable non-PPGP workflow, not a strawman.

### Condition B: PPGP

The agent receives the same base repository plus PPGP and repository-visible PPGP state.

Before interruption, ACTIVE_GOAL must contain current hot state, including the active goal, frozen decisions, verified state, remaining work, blockers and next executable action.

No `ppgp distill` may run before the interruption. The test is specifically intended to measure immediate recovery from hot state rather than post-goal consolidation.

## 3. Pair isolation and order

A pair MUST NOT share conversational context between conditions.

Use separate repository clones/worktrees and separate agent sessions.

If the same human operator runs both conditions, alternate or randomize order across pairs to reduce learning/order effects.

Record the order and randomization method or seed.

A recommended pilot pattern is:

```text
pair 1: A -> B
pair 2: B -> A
pair 3: A -> B
pair 4: B -> A
...
```

For confirmatory work, randomize condition order before execution and preserve the assignment before observing outcomes.

## 4. Task design

A benchmark task SHOULD be substantial enough that continuity matters, while remaining independently verifiable.

Useful tasks include:

- a multi-file implementation or refactor;
- at least one non-trivial design decision;
- at least one intermediate verification step;
- at least one hidden or non-obvious blocker discovered during execution;
- remaining work after the interruption point;
- a deterministic Definition of Done that can be checked without relying on the agent's confidence.

Avoid tasks whose success depends on unavailable external credentials, irreversible production changes, legal/financial authority, or subjective product taste. Those introduce authority boundaries unrelated to continuity quality.

Record the task text verbatim.

## 5. Standardized interruption

Prefer an event-based interruption rather than an arbitrary elapsed time.

The interruption SHOULD occur only after all of the following are true:

1. the agent has understood the task;
2. a material implementation/design choice has been made;
3. at least one useful change or verification has occurred;
4. a non-obvious blocker, constraint or remaining dependency has been identified;
5. substantial work remains unfinished.

For Condition B, ACTIVE_GOAL must be checkpointed immediately before interruption.

Then terminate the session abruptly enough that the recovery agent cannot use the prior conversation. Examples include a new clean session, deliberate context removal, agent replacement, or controlled process termination.

Do not allow a final narrative handoff after the interruption trigger. That would measure handoff quality instead of abrupt recovery.

Record the exact interruption trigger and the repository commit/status at interruption.

## 6. Recovery prompt

The recovery agent in A and B should receive the same neutral instruction, except for any unavoidable platform-specific invocation needed to make an installed skill available.

Recommended instruction:

```text
Continue the existing software goal from the repository state.
Recover what is already known before asking the human to restate prior context.
Verify current state, then continue toward the existing Definition of Done.
```

Do not tell the recovery agent which condition it is in.

Do not summarize Agent A's conversation.

## 7. Primary endpoint

### Recovery Success (RS)

Boolean.

PASS only if the recovery agent:

1. correctly recovers the active goal;
2. respects material frozen decisions unless new evidence invalidates them;
3. identifies already verified work without materially redoing it unnecessarily;
4. identifies remaining work and blockers;
5. completes the original synchronous Definition of Done;
6. does so without human reconstruction of information that was already available in the repository state.

FAIL if any of those conditions is materially violated.

A legitimate request for an authority decision that was not encoded or inferable from the repository is not automatically a recovery failure. Benchmark tasks should minimize such cases and report them separately.

## 8. Secondary metrics

Record raw measurements whenever possible. Do not substitute a composite score when the underlying quantities can be reported directly.

### 8.1 Human Reconstruction Messages (HRM)

Count human messages whose purpose is to restate prior goal context, completed work, frozen decisions, blockers or next actions.

Also record reconstruction characters or tokens when available.

Routine authorization, unrelated conversation and new requirements do not count.

### 8.2 Recovery Latency

Measure from recovery-agent start until the first **materially goal-advancing action**.

Report any available combination of:

- wall-clock seconds;
- agent turns;
- tool calls;
- input/output tokens.

A materially goal-advancing action is an action that uses recovered state to advance remaining work or its required verification.

Repository inspection, `git status`, reading files or running a diagnostic may be necessary recovery work, but do not automatically count as the first goal-advancing action.

`git diff` by itself is not a universal latency endpoint.

### 8.3 Avoidable Duplicate Work (ADW)

Count discrete actions that unnecessarily repeat work already verified before interruption.

Examples:

- rewriting an already-correct implementation without new evidence;
- rerunning an expensive verification that repository-visible evidence already proves current and sufficient;
- reopening and re-deciding a frozen architectural choice without new evidence;
- recreating an artifact already present and verified.

Do NOT count necessary re-reading, sanity checks, or verification required to establish that prior evidence still applies.

When classification is ambiguous, record the event and rationale rather than forcing a count.

### 8.4 PPGP Maintenance Overhead (PMO)

Condition B only.

Measure the cost attributable to creating/updating PPGP hot state before interruption and during closure.

Report available raw measures:

- tokens;
- tool calls;
- wall-clock seconds;
- bytes or lines written to PPGP state.

Do not count ordinary implementation documentation that would have existed in both conditions.

### 8.5 Final Outcome Quality

Record the same deterministic verification evidence in both conditions:

- tests;
- build;
- lint/typecheck where applicable;
- runtime/production checks if part of the task;
- final Git diff/commit state.

A faster recovery that produces an incorrect outcome is not a benchmark success.

## 9. Optional derived metrics

Derived metrics may be reported only when the raw inputs are also published.

### Recovery Success Rate (RSR)

```text
successful recoveries / total recoveries
```

### Human Reconstruction Reduction

For paired runs where both measurements exist:

```text
HRM_control - HRM_ppgp
```

### Recovery Token Delta

When token accounting is comparable across both conditions:

```text
recovery_tokens_control - recovery_tokens_ppgp
```

### Observed Net Token Delta

Exploratory only:

```text
(recovery_tokens_control)
-
(recovery_tokens_ppgp + PPGP_maintenance_tokens)
```

Do not mix vendor token accounting methods without documenting the difference.

## 10. Instrumentation record

Each run SHOULD be stored as machine-readable JSON conforming to:

```text
benchmarks/result.schema.json
```

At minimum record:

- experiment and pair identifiers;
- condition;
- exact PPGP version for Condition B;
- repository and base commit;
- task identifier and verbatim task source/reference;
- agent product, model and version when known;
- tool/client version when known;
- condition order/randomization data;
- interruption trigger and repository state;
- primary recovery result;
- human reconstruction count;
- recovery latency raw measures;
- duplicate-work observations;
- PPGP maintenance overhead when applicable;
- final verification result;
- links or paths to raw logs when publishable.

Missing telemetry must be represented as unknown/null rather than estimated silently.

## 11. Evaluator independence

Where practical, have a reviewer who did not run the implementation classify:

- recovery success;
- avoidable duplicate work;
- whether a human message qualifies as reconstruction;
- whether final verification satisfies the Definition of Done.

For stronger studies, blind the reviewer to A/B condition by removing PPGP-specific path names from the review packet when doing so does not destroy the evidence being classified.

If the evaluator is not independent, disclose that limitation.

## 12. Pilot and confirmatory phases

### Pilot

A small pilot of 5 to 10 paired tasks is useful for:

- finding ambiguous metrics;
- validating instrumentation;
- estimating variance;
- discovering protocol failure modes;
- determining benchmark cost.

A pilot MUST NOT be described as definitive scientific validation.

### Confirmatory evaluation

Before a confirmatory run:

1. freeze task-selection rules;
2. freeze primary endpoint and metric definitions;
3. freeze exclusion criteria;
4. pre-assign condition order;
5. choose sample size before inspecting outcomes;
6. preserve raw run records.

A larger sample does not repair biased tasks or inconsistent conditions. Method quality takes precedence over raw run count.

## 13. Exclusion criteria

Exclude a paired comparison only for pre-declared reasons such as:

- infrastructure outage unrelated to the agent;
- corrupted repository fixture;
- model/client unavailable in only one condition;
- accidental leakage of the prior conversation into the recovery session;
- task fixture does not satisfy its own stated preconditions.

Do not exclude a run merely because PPGP performs poorly.

Report excluded runs and reasons.

## 14. Reporting

A benchmark report should include:

- protocol version;
- benchmark protocol version;
- task list;
- model/client versions;
- condition order;
- all primary outcomes;
- raw secondary metrics;
- exclusions;
- failures and protocol deviations;
- aggregate descriptive results;
- limitations.

Use `scripts/benchmark-report.js` to produce a deterministic Markdown summary from run JSON records.

Never label a result "scientifically proven" solely because this benchmark was run.

Prefer language such as:

> Under the tested tasks, models and interruption conditions, PPGP showed X/Y successful recoveries versus A/B for the control condition.

## 15. Minimal first experiment

A useful first public experiment is:

```text
5 paired tasks
same model/client within each pair
same repository snapshot within each pair
alternating A/B order
fresh recovery session
interruption after frozen strategy + blocker discovery
no distill before interruption
independent outcome review where practical
```

Publish every run, including failures.

The purpose of the first experiment is to learn whether the protocol and measurement design survive contact with real agents, not to manufacture a favorable score.
