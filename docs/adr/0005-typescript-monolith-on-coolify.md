# TypeScript monolith: Next.js + Postgres on a single Coolify server

The app is web-only, mobile-first, built by a small team, with an existing
self-hosted server running Coolify and AWS already chosen for media storage
(ADR 0004). We decided on a **single Next.js application deployed as one
container per environment**:

- **Next.js (App Router)** with **Server Actions** for mutations (Zod-validated);
  Route Handlers only where raw HTTP is needed (health check, presign endpoint).
  No separate REST API — the only client is this web UI.
- **Postgres** as a Coolify container with scheduled volume backups; **Drizzle**
  as the ORM/query layer (plain SQL migrations).
- **Auth.js v5** for the three auth methods (Google OAuth, Facebook OAuth,
  email/password). Sessions are **JWTs in a cookie**; the `users` / `accounts`
  tables still live in our Postgres. Auth.js cannot issue database sessions for
  the credentials provider, and DB sessions would have needed a hand-written
  login route for no gain — amended from the original "sessions in our
  database". Trainer accounts are created by an admin and activated via a
  one-time setup invite.
- **AWS SES** for transactional email (athlete invite links, trainer setup
  invites, password resets).
- **Mantine** as the component library (Tailwind not used), styled mobile-first.
- **Biome** for linting and formatting (ESLint + Prettier rejected: two tools,
  two configs, slower; Biome covers both in one binary).
- **pnpm** as the package manager; the single app lives at the repo root (the
  `pnpm-workspace.yaml` only records dependency build approvals).
- **Two environments on the same server**: production (auto-deploys from
  `main`) and staging (deploys from the development branch), each with its own
  Postgres database. Staging uploads to the shared S3 bucket under a
  `staging/` prefix.
- **Spanish-only UI**. No i18n framework; strings are written in Spanish.
  Tag vocabulary values are language-neutral English keys with Spanish display
  labels kept in the presentation layer.
- **Observability**: structured logs viewed through Coolify. No error-tracking
  container until real usage demands it.

The driving trade-off is simplicity: one language, one deploy unit, one server,
no services that a single developer has to babysit. Every rejected alternative
buys scale or flexibility we don't need yet.

## Considered Options

- **SvelteKit / Nuxt**: excellent DX, smaller ecosystems — ecosystem depth won.
- **Vite SPA + separate API**: two deploy units and hand-kept API types for a
  client we don't have.
- **REST route handlers**: decoupling that only pays off with a second client.
- **Prisma**: heavier runtime/codegen than Drizzle for the same job.
- **SQLite**: weak concurrent-write and backup story as usage grows.
- **Hosted Postgres (Neon/Supabase)**: free tiers, but data leaves our server.
- **Clerk / Firebase Auth**: cost past free tier / second platform; Auth.js
  covers all three methods in our container.
- **Resend**: kept as the swap-in alternative if SES DX annoys us (one module
  behind an interface).
- **Self-hosted SMTP**: deliverability pain (SPF/DKIM), rejected.
- **shadcn/ui + Tailwind**: rejected in favor of Mantine's batteries-included
  components for admin CRUD.
- **English-only or bilingual UI from day one**: rejected; Spanish-only for v1,
  i18n is a presentation-layer addition later.
- **ESLint + Prettier**: rejected in favor of Biome.
- **Database sessions with a custom credentials login route**: rejected; JWT
  sessions work with all three providers as-is.

## Consequences

- Deploying = one Docker image per environment, built by Coolify from git;
  database migrations ship with the app (Drizzle) and run on deploy.
- The "API" is private to the UI (Server Actions); exposing it to other clients
  later means promoting action bodies into Route Handlers — mechanical, not
  free.
- Staging/prod share the AWS account and S3 bucket; isolation is by prefix.
- All user-facing copy, including emails, is written in Spanish.
