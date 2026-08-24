# Evaluating PPGP

PPGP v0.1 is experimental. Independent tests, failures, replications and comparative evaluations are welcome.

The purpose of this guide is to make reports easier to interpret and compare. It is not a benchmark claim.

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

## Useful outcomes

### Recovery success

Did the fresh agent correctly recover the active goal and continue it?

### Human reconstruction

Did a human have to restate prior decisions, completed work or the next action?

### State quality

Was repository-visible state current, compact and unambiguous?

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

Use them only when the measurement method is described clearly enough to interpret the result.

## Comparative evaluations

If comparing PPGP with another workflow or with no explicit continuity protocol, keep the task, repository state and evaluation criteria as similar as practical.

Report meaningful differences in setup. Avoid presenting a single repository or model as universal evidence.

## Reporting results

For a focused failure or reproducible observation, open an issue using the relevant template.

For a larger study, benchmark, article or external publication, link the public result from an issue so the community can inspect the methodology and discuss it.

Negative results are welcome. A simpler approach that preserves recovery quality is a useful contribution.
