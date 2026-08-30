# Contributing to PPGP

PPGP v0.2.0 is intentionally provisional.

The project is published early so developers can test it on real repositories, challenge assumptions, simplify rules and report failures.

## Useful contributions

Especially valuable reports include:

- a fresh agent failed to recover the active goal/workstream;
- PPGP created more state-maintenance overhead than value;
- a memory or coordination rule caused stale context or drift;
- a stale revision overwrote newer state;
- lease takeover produced ambiguous ownership;
- foreign dirty checkout work was endangered or unnecessarily blocked progress;
- a wait was promoted to workstream/project scope incorrectly;
- an authority gate was interpreted too broadly;
- a dependency graph became ambiguous or cyclical;
- a provider or IDE could not interpret the portable protocol;
- a simpler representation preserved the same recovery/coordination quality;
- a multi-agent workflow became less reliable because coordination cost exceeded value;
- a concrete repository benefited from a modification to the protocol.

Positive results are welcome, but failure reports are at least as useful.

## Evidence

When practical, include:

- agent/product and version;
- repository scale or rough shape;
- PPGP version;
- single-workstream or portfolio mode;
- relevant protocol state without secrets;
- expected behavior;
- observed behavior;
- whether a human had to reconstruct context;
- whether foreign unfinished work was present;
- verification evidence.

Do not publish proprietary code, credentials, secrets or confidential prompts merely to provide a reproduction.

## Coordination reports

For v0.2 coordination failures, useful extra details include:

- workstream RUN_STATE and lifecycle PHASE;
- wait kind and scope;
- lease holder/generation where relevant;
- declared versus observed branch/checkout state;
- durability class of unfinished work;
- whether another independent workstream remained runnable.

Avoid publishing local user paths if they are not necessary to reproduce the issue.

## Discussion style

Challenge the protocol, not the contributor.

Prefer concrete counterexamples over status arguments.

Do not assume that a technique working for one model or repository is universal.

Claims of superiority should include reproducible evidence.

## Maturity

Changes should prefer the smallest rule that generalizes.

A feature that requires one vendor SHOULD be an optional adapter rather than part of the portable core.

The project should remain understandable and usable without requiring a database, external service, paid platform, MCP server or orchestrator.

Multi-workstream complexity should remain progressively disclosed so ordinary single-goal repositories do not pay unnecessary token or attention cost.

## License

By contributing, you agree that your contribution may be distributed under the MIT License used by this project.
