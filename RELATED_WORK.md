# Related Work

PPGP is an experimental engineering protocol assembled from practical coding-agent failures and established ideas in software engineering, context engineering, durable execution, and multi-agent coordination.

This document exists to make that lineage explicit.

PPGP does not claim to have invented persistent memory, worktrees, leases, durable execution, multi-agent coordination, or Agent Skills.

The project's contribution is the attempt to combine a small subset of these ideas into a portable, repository-oriented continuity and coordination protocol that remains usable across different coding-agent products.

## Long-running agent continuity

### Anthropic: Effective harnesses for long-running agents

https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

Anthropic describes the problem of coding work spanning multiple context windows and the need for successive agent sessions to recover prior progress from persistent project artifacts.

Relationship to PPGP:

- strongly aligned with repository-visible continuity;
- supports the premise that conversation history should not be the only carrier of long-running project state;
- PPGP adds an explicit goal lifecycle, authority boundaries, distillation rules, and portable handoff semantics.

### Anthropic: Effective context engineering for AI agents

https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

Anthropic frames context as a finite resource that should be curated for utility rather than maximized indiscriminately.

Relationship to PPGP:

- aligned with selective retrieval;
- aligned with compact hot state instead of replaying complete transcripts;
- motivates PPGP's preference for state and deltas over chronological diaries.

## Portable skill packaging

### Agent Skills specification

https://agentskills.io/specification

Agent Skills defines an open folder format centered on `SKILL.md`, with optional scripts, references, and resources loaded progressively.

Relationship to PPGP:

- PPGP uses Agent Skills as one portable distribution mechanism;
- Agent Skills is not itself the PPGP memory or coordination model;
- PPGP should remain usable as a written protocol even when an Agent Skills client is unavailable.

## Isolated Git workspaces

### Git worktree documentation

https://git-scm.com/docs/git-worktree.html

Git worktrees allow several working trees to be attached to one repository so multiple branches can be checked out separately.

The Git documentation includes a closely related safety pattern: when one working tree contains an in-progress refactor that should not be disturbed, another linked worktree can be created for an unrelated urgent fix.

Relationship to PPGP v0.2:

- supports isolated-workspace preference when a shared checkout contains foreign dirty work;
- Git worktree remains one implementation mechanism, not a PPGP core requirement;
- repositories using another VCS or sandbox system may implement equivalent checkout claims differently.

## Durable execution and interruption recovery

### Google: Agent Executor distributed runtime

https://cloud.google.com/blog/products/ai-machine-learning/agent-executor-googles-distributed-agent-runtime

Google describes a distributed runtime for long-running agent execution with durable execution, resumption, event logs, and snapshotting.

Relationship to PPGP v0.2:

- aligned with treating agent interruption as recoverable execution state rather than automatic task failure;
- richer runtimes can provide stronger lease, event-log, snapshot, and remote-durability guarantees;
- PPGP intentionally does not require such infrastructure in its portable core.

## Concurrent coding-agent coordination

### AgentRoom: Concurrent Multi-Agent Coding in a CRDT-Backed Shared Workspace

https://arxiv.org/abs/2608.23740

AgentRoom studies concurrent coding agents using file-level claim, status, broadcast, and CRDT-backed shared-workspace mechanisms.

Relationship to PPGP v0.2:

- independently supports the usefulness of explicit claims and status in concurrent coding;
- AgentRoom provides a runtime mechanism for concurrent collaboration;
- PPGP focuses on portable coordination semantics and does not require CRDTs or MCP.

### When Agents Coordinate: Measuring Coordination in Multi-Agent AI Coding

https://arxiv.org/abs/2608.16801

This work studies coordination structure, messages, file access, and communication cost in multi-agent coding runs. It reports that shared files can replace repeated direct communication in some message-heavy configurations, while also adding overhead where file-based coordination is unnecessary.

Relationship to PPGP:

- supports treating coordination cost as something to minimize rather than assuming more inter-agent communication is always better;
- consistent with PPGP's single-agent-by-default rule;
- consistent with repository-visible shared state where it replaces repeated handoff prose;
- reinforces that coordination mechanisms should be conditional rather than universal overhead.

## PPGP positioning

The intended PPGP core remains deliberately smaller than a multi-agent runtime.

```text
PPGP core
  goal continuity
  compact recovery state
  scoped blockers/waits
  workstream coordination
  ownership semantics
  evidence-driven recovery
  distillation and garbage collection

Optional runtime mechanisms
  MCP
  CRDTs
  remote lock services
  heartbeats
  fencing tokens
  event logs
  snapshot stores
  vector retrieval
  provider-specific compaction
  orchestration platforms
```

A runtime may implement PPGP semantics using these richer mechanisms.

PPGP conformance should not require them.

## Novelty posture

PPGP should make narrow, falsifiable claims.

It should not claim that its individual primitives are novel.

The relevant engineering question is whether the combined protocol improves recoverability, coordination safety, and useful autonomy with acceptable overhead across materially different coding-agent environments.

That question requires independent evidence.
