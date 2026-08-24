# Contributing to PPGP

PPGP v0.1 is intentionally provisional.

The project is being published early so developers can test it on real repositories, challenge its assumptions, simplify it and report failures.

## Useful contributions

Especially valuable reports include:

- a fresh agent failed to recover the active goal;
- PPGP created more documentation overhead than value;
- a memory rule caused stale context or drift;
- an agent escalated unnecessarily to a human;
- a provider or IDE could not interpret the protocol;
- a smaller representation preserved the same recovery quality;
- a multi-agent workflow became less reliable because of handoff cost;
- a concrete repository benefited from a modification to the protocol.

Positive results are welcome, but failure reports are at least as useful.

## Evidence

When practical, include:

- agent/product and version;
- repository scale or rough shape;
- PPGP version;
- relevant protocol state;
- expected behavior;
- observed behavior;
- whether a human had to reconstruct context;
- verification evidence.

Do not publish proprietary code, credentials or confidential prompts merely to provide a reproduction.

## Discussion style

Challenge the protocol, not the contributor.

Prefer concrete counterexamples over status arguments.

Do not assume that a technique working for one model or repository is universal.

Claims of superiority should include reproducible evidence.

## Maturity

Changes should prefer the smallest rule that generalizes.

A feature that requires one vendor SHOULD be marked as an optional adapter rather than added to the portable core.

The project should remain understandable without requiring a database, external service or paid platform.

## License

By contributing, you agree that your contribution may be distributed under the MIT License used by this project.
