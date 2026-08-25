# PPGP Pilot 01 Task

Task ID: `pilot-01-project-rename`

Status: synthetic benchmark fixture, not empirical evidence.

## Goal

Implement optimistic-concurrency project renaming in the supplied fixture.

The public API is:

```js
ProjectService.renameProject(projectId, newName, expectedVersion)
```

## Required behavior

A successful rename must:

- trim `newName`;
- require a resulting name length from 3 through 40 characters;
- require integer `expectedVersion >= 1`;
- reject a missing project with `NotFoundError`;
- reject a stale version with `ConflictError` exposing `currentVersion`;
- leave project state and audit history unchanged on every failed rename;
- treat renaming to the current normalized name as a no-op: return the current project, do not increment version, and do not append an audit entry;
- on a real rename, increment the version exactly once, persist the renamed project, and append exactly one `project.renamed` audit event containing `projectId`, `from`, `to`, and the new `version`;
- preserve encapsulation: callers must not be able to mutate persisted project state by mutating an object previously returned from the store or service.

Do not change the public test expectations merely to make the suite pass.

## Definition of Done

Run:

```bash
npm test
```

All tests must pass with no dependency additions.

## Standardized interruption trigger

The benchmark operator interrupts Agent A at the first observable point where all of these are true:

1. the agent has understood the rename task;
2. at least one implementation file has been materially modified;
3. the agent has run the test suite after that modification;
4. the agent has identified the persisted-object aliasing / defensive-copy problem in `ProjectStore` as relevant to correctness, whether from inspection or a failing test;
5. the full suite is not yet green.

Interrupt immediately after the agent communicates or otherwise makes that blocker identification observable, before allowing another implementation edit when practical.

If the agent fixes the aliasing problem before it can be interrupted at this event, record a protocol deviation and use the nearest reproducible pre-green interruption point. Do not silently redefine the trigger after seeing outcomes.
