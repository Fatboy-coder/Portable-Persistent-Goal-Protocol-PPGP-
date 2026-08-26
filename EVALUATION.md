# Evaluating PPGP

PPGP v0.1.2 is experimental. Independent tests, failures, replications and comparative evaluations are welcome.

The purpose of this guide is to make reports easier to interpret and compare. It is not a benchmark claim.

For controlled A/B recovery experiments, use [`BENCHMARK_PROTOCOL.md`](./BENCHMARK_PROTOCOL.md). Machine-readable run records are defined in [`benchmarks/result.schema.json`](./benchmarks/result.schema.json), with deterministic Markdown aggregation available through `scripts/benchmark-report.js`.

## Minimum evaluation record

Please record:

- exact PPGP version;
- coding agent or agents used, including version when available;
- repository scale or rough project shape;
- whether the test used an existing project or a synthetic task;
- the active goal and its Definition of Done;
- how continuity was interrupted, such as context compaction, new session or agent replacement;
- what repository-visible PPGP state was available to the recovering agent;
- whether the recovering agent resumed without human reconstruction;
- observed failures, ambiguity or unnecessary overhead;
- verification evidence for the final outcome.

Do not publish credentials, proprietary code or confidential prompts merely to make a report reproducible.

## Basic recovery test

A minimal continuity test is:

1. Agent A begins a substantial goal using PPGP.
2. The previous conversation becomes unavailable to the next agent.
3. Agent B starts with repository access but without Agent A's conversation history.
4. Agent B reads the repository-visible PPGP state.
5. Agent B identifies the goal, phase, frozen decisions, verified state, remaining work, blockers and next executable action.
6. Agent B continues the work without asking the human to reconstruct prior conversation history.
7. The goal is verified, distilled and closed.

A failure at any step is useful evidence.

## Abrupt interruption recovery test

This test targets the specific resilience claim that active continuity depends on repository-visible hot state, especially `ACTIVE_GOAL`, rather than on a successful end-of-session distillation step.

### Purpose

Test whether a substantial active goal survives an unplanned interruption before `ppgp distill` or `ppgp close` occurs.

### Procedure

1. Agent A starts a substantial goal and materializes the active goal state in the repository.
2. Agent A completes at least one meaningful execution step and updates `ACTIVE_GOAL` with current verified state and the next executable action.
3. Do **not** run `ppgp distill`.
4. Interrupt Agent A abruptly. Examples include terminating the session, starting a fresh session with no transcript, forcing context loss, or replacing Agent A with a different compatible coding agent.
5. Agent B starts with repository access but without Agent A's conversation history.
6. Agent B reads the repository-visible PPGP state.
7. Agent B must recover, without human reconstruction:
   - the active goal;
   - current lifecycle phase;
   - frozen decisions and invariants;
   - verified current state;
   - completed and remaining work;
   - real blockers and authority boundaries;
   - the next executable action.
8. Agent B continues the goal from that state.
9. After the goal is eventually verified, run normal distillation and closure.

### PASS criteria

The trial passes operational recovery if Agent B:

- resumes the correct active goal without the human restating prior context;
- does not restart strategy when the strategy is already frozen unless new evidence invalidates it;
- does not repeat already verified work unnecessarily;
- identifies the correct next executable action or an equivalent safe continuation;
- preserves frozen authority and blocker boundaries;
- can continue despite the absence of a prior distillation step.

### FAIL criteria

Record a failure if Agent B:

- asks the human to reconstruct information already present in repository-visible state;
- cannot identify the current goal or phase;
- reopens frozen strategy without new evidence;
- repeats substantial verified work because hot state was insufficient or stale;
- misses a material blocker, invariant or authority boundary;
- cannot determine a safe next action from the available PPGP state.

### Important interpretation

A successful abrupt recovery is evidence that the tested repository, agent and PPGP version preserved usable continuity under the tested interruption.

It is **not** proof that PPGP is universally effective, optimal, or superior to alternatives.

A failed recovery is equally useful because it identifies a concrete state-quality, checkpointing or protocol weakness.

## ACTIVE_GOAL checkpointing test

PPGP does not require a chronological diary. The relevant question is whether `ACTIVE_GOAL` is current enough at interruption time to support recovery.

To evaluate checkpoint quality, compare at least two interruption points:

1. immediately after a meaningful verified state change has been written to `ACTIVE_GOAL`;
2. after additional work has occurred but before the next state update.

Record whether the second interruption causes duplicated work, missed decisions or human reconstruction.

This helps estimate the practical checkpoint frequency needed for a given agent and task type without assuming that every trivial action must be persisted.

## Distillation-independence test

To isolate the role of distillation:

1. run an abrupt interruption recovery trial with current `ACTIVE_GOAL` but without prior `distill`;
2. separately run a completed-goal handoff after normal `distill`;
3. compare recovery quality and state size.

Expected interpretation:

- `ACTIVE_GOAL` should provide immediate continuity for unfinished work;
- `distill` should reduce long-term cognitive debt by moving reusable knowledge into durable memory and removing temporary state;
- failure to distill may increase future noise, but should not by itself make an otherwise current active goal unrecoverable.

This expectation is a protocol hypothesis to test, not a benchmark result.

## Useful outcomes

### Recovery success

Did the fresh agent correctly recover the active goal and continue it?

### Human reconstruction

Did a human have to restate prior decisions, completed work or the next action?

### State quality

Was repository-visible state current, compact and unambiguous?

### Recovery latency

How long, how many tool calls, or how many tokens did the recovering agent need before it could safely resume useful work?

### Duplicate work

Did the recovering agent repeat meaningful work that Agent A had already completed and verified?

### Frozen-strategy fidelity

Did the recovering agent preserve frozen decisions unless new evidence materially invalidated them?

### Overhead

Did maintaining PPGP state consume more effort than the continuity benefit justified?

### Portability

Could another agent, model provider or coding environment interpret the same state correctly?

## Optional metrics

PPGP defines several optional metrics in the specification:

- HIG: Human Interruptions per Completed Goal;
- TPG: Tokens per Completed Goal;
- RSR: Recovery Success Rate;
- VWR: Verified Work Rate;
- MCR: Memory Compression Ratio.

Additional evaluation measurements may include:

- recovery latency;
- duplicate verified work after recovery;
- number of human reconstruction prompts;
- ACTIVE_GOAL size at interruption;
- time or token overhead spent maintaining hot state.

Use metrics only when the measurement method is described clearly enough to interpret the result.

## Comparative evaluations

If comparing PPGP with another workflow or with no explicit continuity protocol, keep the task, repository state and evaluation criteria as similar as practical.

A useful controlled comparison is:

```text
A: no explicit continuity protocol
B: PPGP with ACTIVE_GOAL recovery
```

Apply the same interruption point where practical, then compare:

- recovery success;
- human reconstruction required;
- recovery latency;
- duplicated work;
- final verified outcome;
- state-maintenance overhead.

For a reproducible paired design, metric definitions, exclusion rules, randomization guidance and reporting format, follow [`BENCHMARK_PROTOCOL.md`](./BENCHMARK_PROTOCOL.md).

Report meaningful differences in setup. Avoid presenting a single repository or model as universal evidence.

## Reporting results

For a focused failure or reproducible observation, open an issue using the relevant template.

For a larger study, benchmark, article or external publication, link the public result from an issue so the community can inspect the methodology and discuss it.

When recording structured benchmark data, keep one JSON record per run using [`benchmarks/result.schema.json`](./benchmarks/result.schema.json). The example records under `benchmarks/examples/` are synthetic test fixtures and MUST NOT be presented as empirical evidence.

Negative results are welcome. A simpler approach that preserves recovery quality is a useful contribution.
