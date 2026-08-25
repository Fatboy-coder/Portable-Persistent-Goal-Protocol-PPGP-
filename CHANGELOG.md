# Changelog

## Unreleased

Distribution infrastructure for PPGP v0.1:

- Claude Code plugin + self-hosted marketplace manifests;
- OpenAI Codex plugin + repository marketplace metadata;
- Google Gemini CLI extension manifest;
- open Agent Plugin manifest for compatible clients such as Cursor;
- generated `.agents/skills/ppgp/` compatibility mirror for clients that discover the cross-agent path;
- deterministic mirror sync helper and byte-for-byte drift tests;
- cross-platform compatibility matrix and installation documentation;
- GitHub Actions validation for CLI + distribution invariants.

This does not change PPGP protocol semantics or the protocol version.

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
