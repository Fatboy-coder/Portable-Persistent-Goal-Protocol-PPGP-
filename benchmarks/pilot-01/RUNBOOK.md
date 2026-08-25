# PPGP Pilot 01 Execution Runbook

Status: operational protocol for the first empirical paired run. No result is implied by this document.

Task: [`TASK.md`](./TASK.md)

Benchmark protocol: [`../../BENCHMARK_PROTOCOL.md`](../../BENCHMARK_PROTOCOL.md)

## Important corrections to the informal Gemini proposal

Do not use a single combined `run-001.json` containing both A and B. PPGP benchmark schema v0.1 requires one JSON record per run/condition. Use:

```text
pair-001-control.json
pair-001-ppgp.json
```

Do not use stale example model names. Record the exact client/model/version actually used at execution time and keep them identical within the pair where controllable.

Do not give the recovering agent a narrative reconstruction of the original session. Use the same neutral recovery instruction in both conditions:

```text
Continue the existing software goal from the repository state.
Recover what is already known before asking the human to restate prior context.
Verify current state, then continue toward the existing Definition of Done.
```

## 1. Materialize two isolated repositories

Copy the contents of `fixture/` into two fresh standalone directories outside the PPGP repository so the CONTROL agent cannot inspect PPGP source or benchmark documentation accidentally.

Suggested directory names:

```text
pilot-01-control
pilot-01-ppgp
```

In each directory:

```bash
git init
git add .
git commit -m "benchmark: pilot-01 base fixture"
```

Record the resulting base commit SHA. The file contents must be byte-equivalent before treatment-specific setup.

## 2. Condition order

For the first pair use `AB` unless an order was independently randomized before execution. Record the actual order honestly in both run records.

Do not change order after seeing the first outcome.

## 3. CONTROL condition

The control repository receives:

- the fixture files;
- the task text from `TASK.md` as the user instruction;
- ordinary Git history;
- no PPGP `ACTIVE_GOAL`;
- no PPGP-specific prompt or repository instruction.

If the chosen agent client has PPGP installed globally, disable/remove it for the control session or use an isolated clean profile. If that cannot be done reliably, record the run as contaminated and exclude it under the benchmark protocol rather than pretending it is a valid control.

Start Agent A with the task text verbatim.

Interrupt only at the standardized trigger defined in `TASK.md`.

After interruption, start a fresh session with no prior transcript and send only the neutral recovery instruction above.

Do not answer reconstruction questions with prior context. Count such questions/messages according to the benchmark definitions.

Allow the recovery agent to finish or fail naturally.

## 4. PPGP condition

The PPGP repository begins from the byte-equivalent fixture base.

Make PPGP available through the client or canonical skill, then begin the goal. `ACTIVE_GOAL` must be maintained as current operational hot state before interruption.

The treatment condition may use the PPGP skill and/or deterministic CLI, but the exact mechanism must be recorded.

No `ppgp distill` or `ppgp close` may run before interruption.

Start Agent A with the same task text used in CONTROL.

Interrupt at the same standardized logical trigger from `TASK.md`, after `ACTIVE_GOAL` has been checkpointed to current truth.

Start a fresh recovery session with no transcript and use exactly the same neutral recovery instruction as CONTROL.

Allow the recovery agent to finish or fail naturally.

## 5. What to record

Create two records conforming to `../result.schema.json`:

```text
results/pair-001-control.json
results/pair-001-ppgp.json
```

Use `null` for telemetry the client does not expose. Never enter zero merely because a value is unknown.

Record at minimum:

- exact base commit;
- exact client/model/version where available;
- interruption event and repository state;
- whether `ACTIVE_GOAL` was checkpointed;
- Recovery Success PASS/FAIL;
- human reconstruction messages;
- recovery latency measures available from the client/logs;
- avoidable duplicate actions, with notes when classification is non-obvious;
- PPGP maintenance overhead for treatment only;
- final deterministic verification result;
- raw-log location if publishable;
- protocol deviations or exclusion reasons.

## 6. Final verification

The fixture Definition of Done is:

```bash
npm test
```

All fixture tests must pass. Do not count agent self-report as verification.

A recovery can still FAIL even when the final test suite eventually passes if the primary Recovery Success criteria were materially violated.

## 7. Produce the paired report

After both JSON files exist:

```bash
npm run benchmark:report -- benchmarks/pilot-01/results > benchmarks/pilot-01/BENCHMARK_RESULTS.md
```

Review the raw records before publishing the generated report.

If either run is excluded, preserve it and its exclusion reason. Do not delete an inconvenient result.

## 8. Interpretation boundary

One pair is a pilot observation, not evidence of general superiority.

Report the result using language such as:

> In pilot pair 001, under the recorded model, client, fixture and interruption condition, the CONTROL recovery [passed/failed] and the PPGP recovery [passed/failed].

Do not call PPGP scientifically validated after this run, even if the treatment wins strongly.
