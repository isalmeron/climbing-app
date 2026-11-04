# Climbing Training

A coach-centric training app for climbing: trainers build training plans from a
global exercise catalog, link them to athletes, and review weekly adherence.
Athletes pick a session and mark it complete.

- **[GLOSSARY.md](./GLOSSARY.md)** — the vocabulary and the three roles (Athlete, Coach, Admin)
- **[docs/context.md](./docs/context.md)** — how the product fits together
- **[docs/adr/](./docs/adr/)** — why the big decisions are what they are

## Stack (ADR 0005)

Next.js 16 (App Router, Server Actions) · React 19 · Mantine 9 · Postgres 17 +
Drizzle · Auth.js v5 (JWT sessions: Google, Facebook, email/password) · AWS S3
(presigned uploads) · AWS SES · Biome · Vitest · pnpm

Web only, mobile-first, Spanish UI. One container per environment on Coolify.

## Local development

```bash
pnpm install
cp .env.example .env          # fill in what you need; console mail works offline
docker compose up -d db       # Postgres on :5432
pnpm db:migrate               # apply drizzle migrations
pnpm db:seed                  # bootstrap admin + tags + starter catalog
pnpm dev                      # http://localhost:3000
```

Without AWS credentials the app still runs: mails print to stdout
(`MAIL_TRANSPORT=console`) and only exercise-media uploads need S3.

### Scripts

| Command                       | What it does                                           |
| ----------------------------- | ------------------------------------------------------ |
| `pnpm dev`                    | Dev server                                             |
| `pnpm build`                  | Production build (standalone output)                   |
| `pnpm start`                  | Run the built app                                      |
| `pnpm lint` / `pnpm lint:fix` | Biome check / autofix                                  |
| `pnpm typecheck`              | `tsc --noEmit`                                         |
| `pnpm test`                   | Vitest (permissions, assignment rules, tag vocabulary) |
| `pnpm db:generate`            | Generate a migration from `src/db/schema.ts`           |
| `pnpm db:migrate`             | Apply migrations                                       |
| `pnpm db:seed`                | Bootstrap admin, tag vocabulary, starter exercises     |
| `pnpm db:studio`              | Drizzle Studio                                         |

## Roles and onboarding

- **Admin** — seeded by `db:seed` from `BOOTSTRAP_ADMIN_EMAIL` /
  `BOOTSTRAP_ADMIN_PASSWORD`. Creates trainer accounts, reviews exercise drafts,
  curates the tag vocabulary. Cannot be created in-app.
- **Coach** — gets a one-time setup invite from the admin, then generates
  single-use invite links for athletes. Composes plans, links them, transfers
  athletes.
- **Athlete** — joins only through a coach's invite link, lands linked to that
  coach, and can log completions for their active plan.

## Deployment (Coolify)

1. One Postgres service per environment (backups on — set this up on day one).
2. One application per environment built from this repo's `Dockerfile`:
   - **production** ← `main`
   - **staging** ← the staging branch
3. Env vars per app — the authoritative table with sources, secrets and
   rotation notes is **[docs/ops/env.md](./docs/ops/env.md)**. Differences that matter:
   - `S3_PREFIX=prod/` vs `staging/`
   - `MAIL_TRANSPORT=ses` in production; `console` is fine for staging
   - `APP_URL` must match the public URL (invite links are absolute)
4. Migrations run automatically on container start (`build-scripts/migrate.js`).
   Seeding is manual: `node build-scripts/seed.js` inside the running container.

### AWS setup checklist

- S3 bucket + IAM key limited to `s3:PutObject`/`s3:GetObject` on the bucket.
- Bucket CORS must allow `PUT` from the app origin — uploads go browser → S3
  directly, never through the container.
- SES: verify the sending identity and request production access; set `SES_FROM`.

## Repository layout

```
src/
  app/           route groups per role: (admin), (coach), (athlete), plus auth pages
  actions/       Server Actions (Zod-validated); the only mutation surface
  db/            Drizzle schema + client (table names follow GLOSSARY.md)
  lib/           auth, session guards, permissions, mailer, s3, tags
  types/         NextAuth type augmentation
drizzle/         generated SQL migrations (committed)
scripts/         migrate + seed entrypoints (bundled into the image)
tests/           Vitest unit tests for domain rules
docs/            context, ADRs, agent docs
```
