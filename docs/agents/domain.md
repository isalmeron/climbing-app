# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root: the domain vocabulary, including the
  role definitions (Athlete, Coach, Admin).
- **`docs/context.md`**: the product context — what the app is, how the pieces
  fit together, and the questions still open.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. Read
  all five before changing roles/permissions, plans and logging, the exercise
  catalog, media handling, or the stack.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

Single-context repo:

```
/
├── GLOSSARY.md
├── docs/
│   ├── context.md
│   ├── adr/
│   │   ├── 0001-coach-only-plan-authorship.md
│   │   ├── 0002-completion-only-logs.md
│   │   ├── 0003-exercises-are-an-immutable-catalog.md
│   │   ├── 0004-s3-and-embed-links-for-exercise-media.md
│   │   └── 0005-typescript-monolith-on-coolify.md
│   └── agents/
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
