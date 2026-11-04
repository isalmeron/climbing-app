import { z } from "zod";

/**
 * Read lazily: `next build` runs without runtime secrets, and every consumer
 * calls this inside a request handler or script.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1).optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_FACEBOOK_ID: z.string().optional(),
  AUTH_FACEBOOK_SECRET: z.string().optional(),

  AWS_REGION: z.string().default("eu-west-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  /** `dev/` locally, `staging/` on staging, `prod/` in production — no default:
   *  a missing prefix must fail loudly rather than mix environments. */
  S3_PREFIX: z.string().min(1),

  SES_FROM: z.string().email().optional(),
  /** Where invite/reset links point when running locally. */
  MAIL_TRANSPORT: z.enum(["console", "ses"]).default("console"),

  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      throw new Error(`Invalid environment:\n${issues.join("\n")}`);
    }
    cached = parsed.data;
  }
  return cached;
}
