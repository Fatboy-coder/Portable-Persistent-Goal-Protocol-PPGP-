# PPGP Roadmap

PPGP is currently experimental. The roadmap prioritizes evidence, portability and reduction of unnecessary protocol overhead.

## v0.1

Published and available for public testing.

Current capabilities:

- portable repository-visible goal state;
- THINK, FREEZE, EXECUTE, HARDEN, SHIP, DISTILL lifecycle;
- RETRIEVE, ACT, VERIFY, DELTA inner loop;
- logical memory roles without mandatory filenames;
- explicit human-authority boundaries;
- compact handoff format;
- Agent Skills-compatible implementation;
- downloadable skill package;
- public specification, citation metadata and evaluation guide.

## Next priorities

### Gather independent evidence

Collect recovery failures, successful replications, overhead reports and comparative evaluations from different repositories, agents and providers.

### Reduce protocol overhead

Identify fields, steps or rules that can be removed without reducing recovery quality.

### Test portability

Validate that the same repository-visible state can be interpreted consistently by materially different coding agents and environments.

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
- multi-agent orchestration;
- proprietary infrastructure.

These may be useful optional integrations, but they should not become prerequisites for protocol conformance.

## Stability

A future `1.0` should require evidence that the core rules are sufficiently stable across multiple independent projects and environments.

No target date is assigned. Evidence, not calendar time, should determine promotion to a stable specification.
