# Environment variable matrix

The authoritative list of every `process.env` read in the codebase. Validated at
runtime by `src/lib/env.ts` (`env()` throws on invalid values, so a bad config
fails on first use, not silently).

Secrets live in **Coolify** as environment variables on the corresponding
service — never in the repo, never in chat. `.env` (gitignored) holds local
values; `.env.example` is the template.

| Variable                   | Purpose                                                | dev                              | staging                   | prod                         | Where it comes from                           | Secret?                     |
| -------------------------- | ------------------------------------------------------ | -------------------------------- | ------------------------- | ---------------------------- | --------------------------------------------- | --------------------------- |
| `DATABASE_URL`             | Postgres connection string; migrations and all queries | compose `db` service             | staging Postgres instance | production Postgres instance | Coolify Postgres service                      | **yes** (contains password) |
| `AUTH_SECRET`              | Signs Auth.js JWT session cookies                      | any 32+ random bytes             | own value                 | own value                    | `openssl rand -base64 32`                     | **yes**                     |
| `APP_URL`                  | Public origin; invite links are absolute               | `http://localhost:3000`          | staging domain            | production domain            | DNS / Coolify domain                          | no                          |
| `AUTH_GOOGLE_ID`           | Google OAuth client id                                 | optional                         | required                  | required                     | Google Cloud console                          | no                          |
| `AUTH_GOOGLE_SECRET`       | Google OAuth client secret                             | optional                         | required                  | required                     | Google Cloud console                          | **yes**                     |
| `AUTH_FACEBOOK_ID`         | Facebook OAuth app id                                  | optional                         | required                  | required                     | Meta app dashboard                            | no                          |
| `AUTH_FACEBOOK_SECRET`     | Facebook OAuth app secret                              | optional                         | required                  | required                     | Meta app dashboard                            | **yes**                     |
| `AWS_REGION`               | Region for S3 and SES                                  | any (e.g. `eu-west-1`)           | same as prod              | e.g. `eu-west-1`             | AWS account                                   | no                          |
| `AWS_ACCESS_KEY_ID`        | Scoped IAM key for uploads                             | optional                         | required                  | required                     | IAM user (scoped to the bucket, per issue #1) | **yes**                     |
| `AWS_SECRET_ACCESS_KEY`    | Pair of the above                                      | optional                         | required                  | required                     | IAM user                                      | **yes**                     |
| `S3_BUCKET`                | Bucket holding exercise media                          | optional (uploads fail if unset) | required                  | required                     | S3 console                                    | no                          |
| `S3_PREFIX`                | Key prefix isolating environments                      | `dev/`                           | `staging/`                | `prod/`                      | convention (this doc)                         | no                          |
| `SES_FROM`                 | Verified sender identity for mail                      | unused (`console` transport)     | verified sender           | verified sender              | SES identities                                | no                          |
| `MAIL_TRANSPORT`           | `console` prints mail to stdout; `ses` sends           | `console`                        | `console`                 | **must be `ses`**            | convention (this doc)                         | no                          |
| `BOOTSTRAP_ADMIN_EMAIL`    | Admin account created by `pnpm db:seed`                | seed only                        | seed (fake data)          | seed once, then rotate       | chosen by operator                            | no                          |
| `BOOTSTRAP_ADMIN_PASSWORD` | Its initial password                                   | seed only                        | seed (fake data)          | **rotate after first login** | password manager                              | **yes**                     |

Not user-configured: `PORT` / `HOSTNAME` are set in the `Dockerfile` (container
internals), and `NODE_ENV` is set by Next.js.

## The two environment traps

1. **`S3_PREFIX`** — a wrong or missing prefix means staging uploads land
   next to production media (or nothing uploads at all: it has no default and
   `env()` throws). Values are a fixed convention: `dev/`, `staging/`, `prod/`.
2. **`MAIL_TRANSPORT`** — production **must** be `ses`. Anything else silently
   prints invite emails to container logs and no athlete ever receives one.

## Rotation notes

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: create a new key in IAM,
  update Coolify, redeploy, then disable the old key. If a key ever appears in
  a chat, a CSV, or a commit, rotate immediately.
- `AUTH_SECRET`: rotating logs out every existing session (JWTs stop
  validating). Rotate on compromise only.
- `BOOTSTRAP_ADMIN_PASSWORD`: rotate after the first admin login; re-running
  `pnpm db:seed` resets it (idempotent), which is also the recovery path.
- OAuth secrets: rotate in the provider console and update Coolify; sessions
  survive, only new logins are affected.

## Verifying an environment after provisioning

1. `/api/health` returns `{"ok":true}` (database reachable).
2. Login as the seeded admin works.
3. A presigned upload works:
   `curl -X PUT -H "Content-Type: image/gif" --data-binary @x.gif "<uploadUrl>"`
4. With `MAIL_TRANSPORT=ses`, a real invite email arrives externally.

## Escaping this document

The contract is `src/lib/env.ts`. When adding a variable: add it to the Zod
schema, to `.env.example`, and as a row here — all three in the same commit.
