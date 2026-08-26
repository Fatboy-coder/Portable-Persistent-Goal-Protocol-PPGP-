# Changelog

## 0.1.1 - 2026-08-26

Package and distribution release for PPGP protocol v0.1.

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
- a single guarded GitHub Release gate that triggers npmjs and GitHub Packages publication.

This release does not change PPGP protocol semantics beyond the clarified v0.1 recovery model. The protocol specification version remains `0.1`.

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

No performance or universality benchmark claim is made in v0.1.
