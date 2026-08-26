# Changelog

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
