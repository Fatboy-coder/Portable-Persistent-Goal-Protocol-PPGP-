# PPGP Roadmap

PPGP is experimental. The roadmap prioritizes evidence, portability and reduction of unnecessary protocol overhead.

## v0.2.0

Release candidate implementation line.

v0.2.0 extends PPGP from continuity of one primary active goal to optional portfolio coordination when several workstreams, executors, branches, worktrees, dependencies, or partial waits coexist.

Implemented in the release-candidate branch:

- optional PORTFOLIO / WORKSTREAM coordination;
- lifecycle PHASE separated from RUN_STATE;
- RUNNABLE, RUNNING, WAITING, RECOVERY_REQUIRED, PARKED and COMPLETED states;
- typed/scoped wait conditions;
- action-scoped authority gates;
- explicit acyclic workstream dependencies;
- execution leases with monotonically increasing generations;
- local exclusive checkout claims stored outside committed project state;
- stale revision rejection plus local mutation locking;
- safe isolation preference around foreign dirty work;
- non-destructive abrupt takeover;
- SESSION_ONLY / HOST_DURABLE / REPO_DURABLE / REMOTE_DURABLE recovery classes;
- copy-first reversible legacy migration with one canonical source after cutover;
- progressive-disclosure coordination reference;
- reference portfolio/workstream JSON Schemas;
- backward compatibility for single ACTIVE_GOAL repositories;
- v0.2 coordination conformance tests.

Design lineage:

- [`rfcs/0001-concurrent-workstreams-leases-partial-blocking.md`](./rfcs/0001-concurrent-workstreams-leases-partial-blocking.md)
- [`rfcs/0001-normative-delta.md`](./rfcs/0001-normative-delta.md)
- [`evidence/incidents/INCIDENT-001-concurrent-checkout-partial-wait.md`](./evidence/incidents/INCIDENT-001-concurrent-checkout-partial-wait.md)
- [`RELATED_WORK.md`](./RELATED_WORK.md)

### Remaining release gates

Before public v0.2.0 publication:

1. complete repository-wide version alignment;
2. pass Linux and Windows `npm test` including installed-package smoke tests;
3. pass package dry-run and verify schemas/coordination reference are shipped;
4. audit adapters and mirror parity;
5. independently review the v0.2 conformance semantics;
6. confirm release notes and citation metadata;
7. create immutable GitHub Release/tag only after all above are green;
8. publish npm/GitHub Packages through the guarded release pipeline.

The GitHub/npm publication step remains separate because it is less reversible than repository implementation work.

## v0.1.2

Published experimental predecessor.

v0.1.2 provides:

- portable repository-visible goal state;
- THINK, FREEZE, EXECUTE, HARDEN, SHIP, DISTILL lifecycle;
- RETRIEVE, ACT, VERIFY, DELTA inner loop;
- logical memory roles without mandatory filenames;
- explicit human-authority boundaries;
- compact handoff format;
- Agent Skills-compatible implementation;
- ACTIVE_GOAL hot-state recovery semantics;
- reproducible paired benchmark infrastructure;
- version-consistency hardening.

v0.2.0 intentionally preserves this single-workstream path when no explicit portfolio is needed.

## Evidence priorities after v0.2.0

### Gather independent evidence

Collect recovery failures, successful replications, overhead reports and comparative evaluations from different repositories, agents and providers.

### Reduce protocol overhead

Identify fields, steps or rules that can be removed without reducing recovery or coordination quality.

### Test portability

Validate that materially different coding agents interpret the same portable state consistently.

### Test concurrency semantics

Measure checkout safety, blocker-scope reliability, takeover recovery and stale-write prevention under real multi-agent conditions.

### Clarify conformance

Refine minimum compatibility requirements using observed failures rather than theoretical completeness.

## Not planned as core requirements

PPGP does not plan to require:

- a specific model provider;
- MCP;
- vector databases or embeddings;
- a hosted service;
- a multi-agent orchestrator;
- a distributed lock server;
- CRDT-backed concurrent editing;
- proprietary infrastructure.

These remain optional integrations.

## Stability

A future `1.0` should require evidence that the core rules are sufficiently stable across multiple independent projects and environments.

No target date is assigned. Evidence, not calendar time, should determine promotion to a stable specification.
