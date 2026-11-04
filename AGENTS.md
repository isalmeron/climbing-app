# climbing-app

Coach-centric climbing training app. Next.js 16 + Postgres/Drizzle + Auth.js,
deployed as one container per environment on Coolify (ADR 0005).

## Agent skills

### Issue tracker

Issues and specs live as rows in the Notion **Issues** database (climbing
teamspace), managed through the Notion MCP tools. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` at the root (roles + vocabulary), product context
in `docs/context.md`, ADRs in `docs/adr/`. See `docs/agents/domain.md`.

## Commands

```bash
pnpm install          # deps
pnpm dev              # dev server
pnpm test             # vitest (domain rules)
pnpm typecheck        # tsc --noEmit
pnpm lint             # biome check
pnpm lint:fix         # biome check --write
pnpm db:generate      # new migration from src/db/schema.ts
pnpm db:migrate       # apply migrations
pnpm db:seed          # bootstrap admin, tags, starter exercises
```

Local database: `docker compose up -d db`, then `pnpm db:migrate && pnpm db:seed`.

## Conventions

- Mutations are Server Actions in `src/actions/*`, Zod-validated, guarded with
  `requireRoleAction` from `src/lib/session.ts`. No REST API (ADR 0005).
- Authorisation rules live in `src/lib/permissions.ts` as pure functions and are
  covered by `tests/`. Add a rule there, not inline in a page.
- Every table and field name traces back to `GLOSSARY.md`. The glossary's
  `Session` is `training_sessions` in the database (Auth.js owns `sessions`).
- User-facing copy is Spanish. Tag vocabulary values are English keys with
  Spanish labels (`label_es`), rendered through `labelForTag`.
- Migrations are generated and committed; never hand-edit `drizzle/` SQL.
- Environment variables: contract in `src/lib/env.ts`, matrix in
  `docs/ops/env.md` — keep all three (schema, `.env.example`, doc) in sync.
- When using compound components from Mantine (e.g. AppShell.XXX) always use the
  ComponentXXX form e.g. AppShell.Header would change to AppShellHeader.
  `pnpm lint` enforces this via `scripts/check-no-compound-jsx.mjs`.
