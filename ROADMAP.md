# PPGP Roadmap

PPGP is currently experimental. The roadmap prioritizes evidence, portability and reduction of unnecessary protocol overhead.

## v0.1.2

Published as the current experimental line and available for public testing.

Current capabilities:

- portable repository-visible goal state;
- THINK, FREEZE, EXECUTE, HARDEN, SHIP, DISTILL lifecycle;
- RETRIEVE, ACT, VERIFY, DELTA inner loop;
- logical memory roles without mandatory filenames;
- explicit human-authority boundaries;
- compact handoff format;
- Agent Skills-compatible implementation;
- downloadable skill package;
- public specification, citation metadata and evaluation guide;
- explicit ACTIVE_GOAL hot-state recovery semantics;
- reproducible paired benchmark infrastructure.

## v0.2.0 development line

v0.2.0 is being designed from observed coordination failures in real long-running multi-agent coding work.

The release should extend continuity from one active goal to safe recovery and scheduling when several workstreams, agents, branches, worktrees, and partial wait conditions coexist.

Primary design RFC:

- [`rfcs/0001-concurrent-workstreams-leases-partial-blocking.md`](./rfcs/0001-concurrent-workstreams-leases-partial-blocking.md)

Target protocol additions:

- optional WORKSTREAM_REGISTRY for concurrent active work;
- lifecycle PHASE separated from SCHEDULABILITY;
- RUNNABLE, RUNNING, WAITING_EXTERNAL, WAITING_AUTHORITY, BLOCKED_TECHNICAL, PARKED, and COMPLETED scheduling states;
- scoped wait conditions so one unavailable dependency does not falsely block independent work;
- temporary EXECUTION_LEASE ownership;
- exclusive writable CHECKOUT_CLAIM semantics;
- isolated-workspace preference when a shared checkout contains foreign dirty work;
- explicit RECOVERY_REQUIRED takeover after abrupt agent unavailability;
- unfinished-work durability levels from SESSION_ONLY through REMOTE_DURABLE;
- project-level invariant that a blocked workstream does not block unrelated runnable work;
- backward compatibility for v0.1.2 single-ACTIVE_GOAL repositories.

### v0.2.0 release gates

Before v0.2.0 is released:

1. freeze RFC 0001 semantics;
2. update the normative specification without creating a second source of truth;
3. extend the Agent Skill and compact reference;
4. extend the CLI with the smallest useful coordination operations;
5. add deterministic conformance cases for shared-checkout protection, partial external waits, abrupt takeover, and unrelated runnable workstreams;
6. update all versioned adapters and mirrors atomically;
7. pass existing v0.1.x recovery tests plus new v0.2 coordination tests;
8. validate packaging and version consistency;
9. document the motivating incident only in generalized, non-project-specific form;
10. release as experimental without a superiority or universality claim.

## Evidence priorities

### Gather independent evidence

Collect recovery failures, successful replications, overhead reports and comparative evaluations from different repositories, agents and providers.

### Reduce protocol overhead

Identify fields, steps or rules that can be removed without reducing recovery quality.

### Test portability

Validate that the same repository-visible state can be interpreted consistently by materially different coding agents and environments.

### Test concurrency semantics

Test whether fresh agents can safely distinguish workstream ownership, checkout ownership, scoped blockers, recoverable dirty state, and the next runnable work without human reconstruction.

### Clarify conformance

Refine the minimum requirements for claiming PPGP compatibility using observed implementation failures rather than theoretical completeness.

### Improve packaging

Keep installation simple across Agent Skills-compatible clients without making the portable core dependent on one vendor.

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

These may be useful optional integrations, but they should not become prerequisites for protocol conformance.

## Stability

A future `1.0` should require evidence that the core rules are sufficiently stable across multiple independent projects and environments.

No target date is assigned. Evidence, not calendar time, should determine promotion to a stable specification.
