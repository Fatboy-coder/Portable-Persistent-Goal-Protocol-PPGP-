# PPGP benchmark records

This directory contains the machine-readable format for PPGP recovery experiments.

- `result.schema.json` defines the run record.
- `examples/` contains synthetic fixtures used to test the reporting tool. They are **not empirical evidence** for PPGP.
- Real experiments should keep one JSON record per condition/run and preserve raw logs separately when publication is safe.

Read [`../BENCHMARK_PROTOCOL.md`](../BENCHMARK_PROTOCOL.md) before collecting results.

## Generate a report

From repository root:

```bash
node scripts/benchmark-report.js path/to/results
```

or:

```bash
npm run benchmark:report -- path/to/results
```

The reporter validates the core required fields and emits a deterministic Markdown summary to stdout:

```bash
npm run benchmark:report -- path/to/results > BENCHMARK_RESULTS.md
```

Do not commit generated example output as if it were observed benchmark evidence.

## Record unknown telemetry honestly

If a client does not expose token counts, timestamps or another metric, store `null` rather than estimating silently.

The benchmark is designed to remain usable across agent vendors with different telemetry surfaces.

## Pair naming

A simple convention is:

```text
experiment-001/
  pair-001-control.json
  pair-001-ppgp.json
  pair-002-control.json
  pair-002-ppgp.json
```

Both members of a pair should use the same task, repository base commit and comparable agent configuration.
