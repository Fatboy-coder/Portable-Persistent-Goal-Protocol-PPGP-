# Changelog

## Unreleased - 0.2.0 release candidate

Major experimental coordination update derived from observed failures in real multi-agent coding work.

Implemented:

- optional PORTFOLIO / WORKSTREAM coordination while preserving the v0.1.x single-ACTIVE_GOAL path;
- lifecycle PHASE separated from neutral RUN_STATE;
- RUNNABLE, RUNNING, WAITING, RECOVERY_REQUIRED, PARKED and COMPLETED states;
- typed and scoped wait conditions so blocked actions do not falsely block independent work;
- explicit action-scoped AUTHORITY_GATE lifecycle: REQUIRED, GRANTED, CONSUMED, REVOKED;
- explicit acyclic workstream dependencies;
- execution leases with monotonically increasing generations for handoff/takeover fencing;
- reference integer revisions plus local compare-and-swap/mutation locking;
- local exclusive checkout claims stored in the Git common directory rather than committed project state;
- checkout/branch validation and collision protection;
- safe-isolation preference when a shared checkout contains foreign dirty work;
- richer recovery-time workspace observation distinguishing tracked state, untracked state, ownership and sensitivity when those dimensions matter;
- explicit staging-safety guidance for foreign/sensitive untracked artifacts;
- RECOVERY_REQUIRED and non-destructive takeover after abrupt executor unavailability;
- unfinished-work durability classes: SESSION_ONLY, HOST_DURABLE, REPO_DURABLE, REMOTE_DURABLE;
- durability promotion rules so an older remote checkpoint does not falsely upgrade newer host-only edits;
- recovery guidance to reconstruct interrupted intent from canonical state plus observed diff rather than agent recollection alone;
- evidence-consistency rule: human-readable claim, mechanism, verification evidence and canonical state must be semantically aligned before closure;
- explicit rule that session/UI labels and narrative state do not silently supersede observed canonical repository state;
- copy-first reversible legacy migration with one canonical source after cutover;
- JSON reference schemas for portfolio/workstream state without making JSON a protocol-core requirement;
- progressive-disclosure `COORDINATION.md` reference so simple repositories avoid unnecessary coordination tokens;
- v0.2 conformance tests/evaluation cases for stale revisions, lock cleanup, mixed waits, dependency cycles, lease generations, checkout collisions, takeover, migration rollback, UI/VCS disagreement, foreign untracked sensitive state, durability promotion and claim consistency;
- related-work documentation explicitly positioning PPGP alongside existing context-engineering, worktree, durable-execution and multi-agent coordination approaches;
- Incident 001 extended with the completed real recovery path from HOST_DURABLE interrupted work to verified REMOTE_DURABLE checkpoint.

Core invariants added:

```text
PORTFOLIO != WORKSTREAM != LEASE HOLDER != CHECKOUT
executor unavailable != workstream blocked
blocked action != blocked workstream
blocked workstream != blocked project
```

Additional recovery invariant:

```text
OBSERVE
-> PRESERVE
-> RECONCILE
-> VERIFY
-> PROMOTE DURABILITY
-> CONTINUE
```

The reference CLI adds:

```text
ppgp migrate
ppgp status --all
ppgp workstream start/status/park/resume/handoff/recover/close
ppgp checkout status/claim/release
```

This section is not yet a public release announcement. The v0.2.0 tag, GitHub Release, npm package and GitHub Package remain gated on repository-wide version alignment, Linux/Windows CI, package dry-run, adapter/mirror parity and final release review.

No superiority or universality benchmark claim is made.

## 0.1.2 - 2026-08-26

Version-consistency and release-hardening patch.

Includes:

- one canonical current version, `0.1.2`, across the specification, npm package, versioned adapters, Agent Skill metadata, citation metadata and public documentation;
- CLI `status` and `handoff` protocol headers derived from `package.json` instead of a hard-coded `PPGP/0.1` value;
- current README download text and asset links normalized to `ppgp-v0.1.2.zip`;
- removal of the stale protocol-level `ppgp-v0.1.zip` alias from future release generation;
- explicit separation between historical release numbers, benchmark schema versions and the current PPGP release version;
- automated version-consistency assertions to prevent future documentation/package drift.

This patch does not change the continuity model introduced in the experimental line. It makes the current release identity internally consistent and machine-checked.

## 0.1.1 - 2026-08-26

Historical package and distribution release.

Includes:

- Claude Code plugin + self-hosted marketplace packaging;
- OpenAI Codex plugin + repository marketplace metadata;
- Google Gemini CLI extension manifest;
- open Agent Plugin manifest for compatible clients such as Cursor;
- generated `.agents/skills/ppgp/` compatibility mirror with drift tests;
- canonical project identity and evidence-status metadata inside the Agent Skill;
- explicit `ACTIVE_GOAL` hot-state recovery semantics;
- falsifiable recovery evaluation cases;
- paired A/B benchmark protocol, machine-readable result schema, reporter, and deterministic Pilot 01 fixture/materializer;
- npm payload hardening so benchmark tooling is actually shipped;
- a guarded GitHub Release gate and downstream package-publication workflows.

At this historical point the package/adapters used `0.1.1` while several protocol-facing texts and CLI headers still identified the protocol as `0.1`. That version drift is explicitly corrected in 0.1.2.

## 0.1 - 2026-08-24

First public experimental release of the Portable Persistent Goal Protocol.

Includes:

- vendor-neutral PPGP specification;
- hierarchical repository-visible memory roles;
- THINK / FREEZE / EXECUTE / HARDEN / SHIP / DISTILL lifecycle;
- RETRIEVE / ACT / VERIFY / DELTA inner loop;
- compact recovery and handoff rules;
- human-authority blocker classification;
- conditional multi-agent rule;
- distillation and ACTIVE_GOAL garbage collection;
- Agent Skills-compatible `ppgp` skill;
- `init`, `goal`, `status`, `handoff`, `distill`, and `close` operations.

No performance or universality benchmark claim was made in v0.1.