# Portable Persistent Goal Protocol (PPGP)

> Portable continuity protocol for long-running coding agents.

**Status:** Experimental v0.1  
**First public release:** 2026-08-24  
**License:** MIT  
**Maturity:** Provisional

PPGP is an open, vendor-neutral workflow for keeping long-running software goals recoverable across context compaction, interrupted sessions, agent replacement and different coding-agent products.

It does not replace model memory, Git, tests, MCP or provider-specific compaction. It defines a small control protocol around them.

## Start here

| Goal | Resource |
| --- | --- |
| Understand the protocol | [`SPEC.md`](./SPEC.md) |
| Install the Agent Skill | [`skills/ppgp/`](./skills/ppgp/) or [`ppgp-v0.1.zip`](./dist/ppgp-v0.1.zip) |
| Run an evaluation | [`EVALUATION.md`](./EVALUATION.md) |
| Report a recovery failure | [Open an issue](../../issues/new/choose) |
| Contribute | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Cite PPGP | [`CITATION.cff`](./CITATION.cff) |
| Review release history | [`CHANGELOG.md`](./CHANGELOG.md) |

## Why

Long-running coding agents commonly lose efficiency when they must repeatedly reconstruct:

- the current goal;
- frozen decisions;
- verified state;
- remaining work;
- real blockers;
- durable lessons;
- the next executable action.

PPGP externalizes only the minimum useful state and treats conversation history as disposable cache.

## Core model

```text
GOAL
  |
  v
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
                     ^                    |
                     |                    v
              RETRIEVE -> ACT -> VERIFY -> DELTA
```

Logical memory layers:

```text
CONSTITUTION   long-lived authority and constraints
ROADMAP        project direction and goal scheduling
MEMORY         durable decisions, invariants and lessons
ACTIVE_GOAL    temporary working memory for one goal
GIT            forensic history and implementation evidence
```

`ACTIVE_GOAL` is temporary. At goal closure, durable information is distilled into persistent memory and the temporary goal state is deleted.

## Design principles

- Retrieve relevant memory instead of preloading the whole history.
- Prefer current verified state over chronological diaries.
- Communicate deltas instead of repeating full summaries.
- Treat tests and production evidence as stronger than agent confidence.
- Keep human escalation for genuine authority boundaries.
- Use additional agents only when expected information gain exceeds coordination cost.
- Keep the protocol readable by humans and portable between model vendors.
- Do not require vector databases, embeddings, MCP, a specific model or a specific IDE.

## Install

PPGP v0.1 ships as an [Agent Skills](https://agentskills.io/) compatible skill.

### Agent Skills CLI

```bash
npx skills add https://github.com/Fatboy-coder/Portable-Persistent-Goal-Protocol-PPGP-/tree/main/skills/ppgp
```

### Manual install

Download [`ppgp-v0.1.zip`](./dist/ppgp-v0.1.zip), extract it, then copy or upload the `ppgp` skill directory into a client that implements the Agent Skills standard.

### Read without installing

Read [`SPEC.md`](./SPEC.md) for the protocol itself.

The skill contains a compact operational reference in [`skills/ppgp/references/PPGP.md`](./skills/ppgp/references/PPGP.md).

## Operations

The skill exposes six workflow intents:

```text
ppgp init
ppgp goal
ppgp status
ppgp handoff
ppgp distill
ppgp close
```

These are protocol operations, not assumptions about a vendor-specific slash-command system.

## Research and evaluation

PPGP is experimental.

Independent evaluation, replication, criticism, alternative implementations and failure reports are welcome.

If you evaluate PPGP in research, production or comparative agent testing, identify the exact PPGP version used and publish enough methodology for the result to be independently interpreted.

The reproducible evaluation guide is in [`EVALUATION.md`](./EVALUATION.md). The repository also provides structured issue forms for recovery failures and evaluation reports.

Especially useful evidence includes:

- whether a fresh agent can recover an active goal without human reconstruction;
- recovery failures and ambiguous state;
- documentation overhead created by the protocol;
- unnecessary human escalations;
- stale or contradictory memory;
- cross-agent or cross-provider incompatibilities;
- smaller representations that preserve recovery quality;
- measured results from small, large, legacy or multi-agent repositories.

Negative results are useful. PPGP should change when reproducible evidence shows that a simpler or more reliable rule exists.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Citation

Citation metadata is provided in [`CITATION.cff`](./CITATION.cff).

Version-specific citation is strongly preferred. The public GitHub handle is used as the author identifier until real-name citation metadata is added.

## What v0.1 deliberately does not claim

PPGP v0.1 does **not** claim to:

- invent persistent agent memory;
- outperform existing memory systems;
- be optimal for every repository;
- reduce tokens by a specific percentage;
- eliminate human review;
- make multi-agent systems inherently better.

The purpose of the public v0.1 release is to make the protocol inspectable, reproducible and falsifiable.

## Project mission

PPGP is a community-oriented open-source project intended to help developers and users get more reliable work from coding agents with less repeated explanation and avoidable supervision.

The project may be used commercially under the MIT license. The community-oriented mission is not a restriction on who may use the protocol.

## Publication history

PPGP v0.1 was first published publicly on 2026-08-24 in the `Fatboy-coder/fatboy-coder` repository under `/ppgp`.

This repository is now the canonical home of the protocol. The original Git history remains the first public record of the v0.1 release.

## Versioning

PPGP uses semantic specification versions.

`0.x` releases are experimental and may change incompatibly.

Researchers, developers and maintainers should cite the exact version evaluated.
