# Portable Persistent Goal Protocol (PPGP)

> Portable continuity protocol for long-running coding agents.

**Status:** Experimental v0.1  
**First public release:** 2026-08-24  
**License:** MIT  
**Maturity:** Provisional

PPGP is an open, vendor-neutral workflow for keeping long-running software goals recoverable across context compaction, interrupted sessions, agent replacement, and different coding-agent products.

It does not attempt to replace model memory, Git, tests, MCP, or provider-specific compaction. It defines a small control protocol around them.

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
- Do not require vector databases, embeddings, MCP, a specific model, or a specific IDE.

## Agent Skill

PPGP v0.1 ships as an [Agent Skills](https://agentskills.io/) compatible skill.

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

### Install with the open `skills` CLI

```bash
npx skills add https://github.com/Fatboy-coder/Portable-Persistent-Goal-Protocol-PPGP-/tree/main/skills/ppgp
```

You can also copy or upload the `skills/ppgp/` directory into any client that implements the Agent Skills standard.

## Specification

See [SPEC.md](./SPEC.md).

The skill contains a compact operational reference in [`skills/ppgp/references/PPGP.md`](./skills/ppgp/references/PPGP.md).

## What v0.1 deliberately does not claim

PPGP v0.1 does **not** claim to:

- invent persistent agent memory;
- outperform existing memory systems;
- be optimal for every repository;
- reduce tokens by a specific percentage;
- eliminate human review;
- make multi-agent systems inherently better.

The purpose of the public v0.1 release is to make the protocol inspectable, reproducible and falsifiable.

## Community testing

Useful feedback includes:

- contexts where the protocol adds too much overhead;
- cases where a fresh agent cannot resume correctly;
- memory that becomes stale or contradictory;
- unnecessary human interruptions;
- cross-agent incompatibilities;
- simpler variants that preserve the same recovery quality;
- examples from small, large, legacy or multi-agent repositories.

No benchmark result is required to contribute.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project mission

PPGP is published as a community-oriented open-source project intended to help developers and users get more reliable work from coding agents with less repeated explanation and avoidable supervision.

The project may be used commercially under the MIT license. The community/non-profit intent is a project mission, not a restriction on who may use the protocol.

## Publication history

PPGP v0.1 was first published publicly on 2026-08-24 in the `Fatboy-coder/fatboy-coder` repository under `/ppgp`.

This repository is now the canonical home of the protocol. The original publication remains available as the first public record of the v0.1 release.
