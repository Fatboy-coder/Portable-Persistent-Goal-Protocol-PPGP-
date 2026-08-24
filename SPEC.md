# PPGP Specification v0.1

Status: Experimental / Provisional  
Published: 2026-08-24  
Protocol: Portable Persistent Goal Protocol (PPGP)

## 1. Scope

PPGP defines a portable continuity protocol for long-running coding-agent work.

A conforming implementation SHOULD allow a fresh compatible agent to recover an active software goal without requiring the human operator to reconstruct the previous conversation.

PPGP is model-vendor neutral and repository-oriented.

## 2. Normative language

The terms MUST, MUST NOT, SHOULD, SHOULD NOT and MAY describe protocol requirements and recommendations.

## 3. Logical memory roles

PPGP defines logical roles, not mandatory filenames.

### 3.1 CONSTITUTION

Long-lived mission, authority, invariants and non-negotiable project constraints.

It SHOULD change rarely.

### 3.2 ROADMAP

Current project direction, completed goals, future goals, dependencies and deferred work.

It SHOULD describe state and direction, not preserve a full execution diary.

### 3.3 MEMORY

Durable facts that future agents would otherwise need to rediscover.

Good candidates include architectural decisions, non-obvious invariants, validated operational facts, expensive failed approaches worth avoiding, durable repository conventions, authority decisions and recurring failure modes.

A MEMORY item SHOULD change future behavior.

### 3.4 ACTIVE_GOAL

Temporary working memory for exactly one active goal.

It SHOULD remain compact enough for a fresh agent to recover the goal in one read.

Minimum fields:

```text
GOAL
WHY
PHASE
DEFINITION_OF_DONE
FROZEN_DECISIONS
INVARIANTS
VERIFIED_CURRENT_STATE
COMPLETED
REMAINING
BLOCKERS
HUMAN_AUTHORITY_REQUIRED
VERIFICATION_EVIDENCE
NEXT_EXECUTABLE_ACTION
```

ACTIVE_GOAL MUST NOT become the permanent chronological history.

ACTIVE_GOAL MUST be removed after successful closure and distillation.

### 3.5 GIT / FORENSIC HISTORY

Git or the repository's equivalent history is the forensic record of what actually changed.

PPGP memory SHOULD preserve meaning and current state rather than duplicating Git chronology.

## 4. Goal lifecycle

A substantial PPGP goal follows:

```text
THINK -> FREEZE -> EXECUTE -> HARDEN -> SHIP -> DISTILL -> CLOSED
```

### THINK

Inspect, research, compare alternatives and determine an executable strategy.

### FREEZE

Record the selected strategy, critical invariants, Definition of Done and authority boundaries.

After FREEZE, an agent SHOULD NOT reopen strategy merely because another agent would have chosen differently.

Replanning is justified when new evidence materially invalidates a frozen assumption.

### EXECUTE

Perform the work autonomously within the frozen strategy and delegated authority.

### HARDEN

Attack the implementation through tests, edge cases, security review, independent review or other relevant verification.

HARDEN improves the selected solution. It is not a default invitation to redesign it.

### SHIP

Verify the implementation in the environment required by the Definition of Done.

When production behavior is part of the Definition of Done, local success alone MUST NOT close the goal.

### DISTILL

Move durable information into ROADMAP, MEMORY or CONSTITUTION as appropriate.

Discard temporary chronology and redundant execution detail.

### CLOSED

A goal is CLOSED only after synchronous Definition-of-Done requirements are verified and temporary working memory has been garbage-collected.

## 5. Inner execution loop

Inside a goal, implementations SHOULD use:

```text
RETRIEVE -> ACT -> VERIFY -> DELTA
```

### RETRIEVE

Load only the state and evidence relevant to the current decision.

### ACT

Perform the next bounded action.

### VERIFY

Check observable evidence rather than relying on model confidence.

### DELTA

Record only material state changes needed for continuation.

The loop repeats until the current phase exit condition is met.

## 6. Boot and recovery

A fresh agent SHOULD start from a minimal boot packet:

```text
GOAL_CONTRACT
+ HOT_STATE
+ RELEVANT_MEMORY
+ RELEVANT_EVIDENCE
```

The implementation SHOULD avoid loading the complete project history unless required.

A recovery sequence SHOULD inspect, as relevant:

1. repository agent instructions;
2. ACTIVE_GOAL;
3. selectively relevant durable memory;
4. `git status`;
5. recent relevant commits;
6. verification evidence;
7. NEXT_EXECUTABLE_ACTION.

If ACTIVE_GOAL says the strategy is frozen, recovery SHOULD resume execution rather than restart THINK by default.

## 7. Evidence precedence

When technical claims conflict, implementations SHOULD prefer more direct evidence.

A useful default order is:

```text
production/runtime behavior
> automated verification
> current repository implementation
> Git history
> ACTIVE_GOAL
> durable MEMORY
> ROADMAP
> conversation claims
> agent recollection
```

CONSTITUTION remains authoritative for project policy and authority, but technical documentation MUST be corrected when contradicted by observable reality.

## 8. Blocker classification

PPGP uses four blocker classes.

### A. Agent-solvable

Reversible technical or implementation problem.

Action: solve autonomously.

### B. External asynchronous

Propagation, crawler refresh, external processing or another event that may complete later.

Action: record it. Do not block synchronous goal closure unless the Definition of Done explicitly requires it.

### C. Authority boundary

Requires human/product/legal/financial/account authority.

Action: escalate with the smallest decision required.

### D. Hard dependency

Required information or resource is genuinely unavailable and no safe autonomous path exists.

Action: escalate only after autonomous alternatives are exhausted.

Agents MUST NOT promote routine Type A decisions to Type C solely to avoid responsibility.

## 9. Human interruption policy

The default is agent autonomy inside established authority.

Human escalation SHOULD be reserved for matters such as irreversible destructive actions, legal or financial commitments, unavailable credentials or external authorization, genuinely ambiguous product policy, brand or governance authority, material changes to frozen architecture, and actions outside delegated permissions.

Routine debugging, reversible refactors, test failures and ordinary implementation choices SHOULD NOT require human interruption.

## 10. Multi-agent policy

PPGP does not require multiple agents.

A second agent SHOULD be introduced only when its expected independent information gain exceeds communication and coordination cost.

Useful examples include adversarial review, security review, linguistic review, architecture challenge and independent verification.

A reviewer SHOULD receive the artifact, requirements and relevant facts without unnecessary exposure to the implementer's self-assessment.

## 11. Handoff format

Handoffs SHOULD prefer compact structured state or deltas over narrative transcripts.

Example:

```text
PPGP/0.1
G=8
P=HARDEN

F:
strategy=frozen
seo_ready=page

D:
ja_review=PASS
tests=PASS

B:
master_text=AUTH

E:
commit=8f3d55b

N:
review_de
ship
```

The exact encoding is not normative.

The invariant is that the handoff remain unambiguous, portable, auditable and cheaper than replaying the conversation.

Opaque model-specific gibberish is NOT required for PPGP conformance.

## 12. Distillation and garbage collection

Before closing a goal, every material ACTIVE_GOAL fact SHOULD be classified:

```text
strategic authority/invariant -> CONSTITUTION
current/future direction      -> ROADMAP
durable reusable lesson       -> MEMORY
temporary execution detail    -> discard
```

Git remains the detailed forensic archive.

After successful distillation, ACTIVE_GOAL MUST be deleted.

## 13. Suggested operational metrics

Implementations MAY measure:

- HIG: Human Interruptions per Completed Goal.
- TPG: Tokens per Completed Goal.
- RSR: Recovery Success Rate.
- VWR: Verified Work Rate.
- MCR: Memory Compression Ratio.

PPGP v0.1 defines these metrics but makes no benchmark claim.

## 14. Interoperability

A PPGP implementation MUST NOT require a specific model provider.

It MAY integrate with native model compaction, Agent Skills, MCP, vector or semantic retrieval, IDE-specific hooks, provider-specific memory, and multi-agent orchestration.

Such integrations are optional accelerators. The repository-visible control state SHOULD remain sufficient for recovery by another compatible agent.

## 15. Reference file mapping

PPGP logical roles may be mapped to existing project documents.

A common mapping is:

```text
CONSTITUTION -> docs/MASTER.md
ROADMAP      -> docs/ROADMAP.md
MEMORY       -> docs/PROJECT_MEMORY.md
ACTIVE_GOAL  -> docs/ACTIVE_GOAL.md
FORENSICS    -> Git
```

Implementations SHOULD reuse equivalent existing documents instead of creating duplicate sources of truth.

## 16. Conformance test

A useful PPGP recovery test is:

1. Agent A begins a substantial goal.
2. Context is compacted, lost or deliberately removed.
3. Agent B starts without the prior conversation.
4. Agent B reads repository-visible PPGP state.
5. Agent B correctly identifies the goal, phase, frozen decisions, verified state, remaining work, blockers and next executable action.
6. Agent B continues without asking the human to reconstruct prior history.
7. The goal is verified, distilled and closed.

A system that cannot pass this recovery test SHOULD NOT claim robust PPGP continuity.

## 17. Versioning

PPGP uses semantic specification versions.

v0.x releases are experimental and may change incompatibly.

The community is encouraged to report failures before the protocol is declared stable.
