/**
 * Database schema. Table names come from GLOSSARY.md — read it before adding one.
 *
 * Note: the glossary's `Session` (a unit of training) is `training_sessions` here,
 * because Auth.js owns `sessions`.
 */
import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const roleEnum = pgEnum("role", ["admin", "coach", "athlete"]);
export const exerciseStatusEnum = pgEnum("exercise_status", ["draft", "accepted"]);
export const demoTypeEnum = pgEnum("demo_type", ["upload", "embed"]);

/* ------------------------------------------------------------------ */
/* Auth.js                                                             */
/* ------------------------------------------------------------------ */

/** `name` is Auth.js's mirror of the OAuth profile; canonical identity is first/last. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  role: roleEnum("role").notNull().default("athlete"),
  passwordHash: text("password_hash"),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

/** Unused while sessions are JWTs; kept for a future switch (see ADR 0005). */
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/** One-time coach setup token: no expiry, one unused per user (revoke/resend). */
export const coachSetupTokens = pgTable(
  "coach_setup_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (t) => [index("coach_setup_tokens_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Athlete profile and coach link                                      */
/* ------------------------------------------------------------------ */

/** Age is derived from `birthdate` at read time — never stored. */
export const athleteProfiles = pgTable("athlete_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  birthdate: date("birthdate", { mode: "string" }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  heightCm: integer("height_cm"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per athlete: an athlete has exactly one coach at a time. */
export const athleteCoach = pgTable(
  "athlete_coach",
  {
    athleteId: uuid("athlete_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("athlete_coach_coach_idx").on(t.coachId)],
);

/** Single-use signup link; the only way for an athlete to join. */
export const inviteLinks = pgTable(
  "invite_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedByAthleteId: uuid("used_by_athlete_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [index("invite_links_coach_idx").on(t.coachId)],
);

/* ------------------------------------------------------------------ */
/* Exercise catalog                                                    */
/* ------------------------------------------------------------------ */

/** Fixed, admin-managed vocabulary: English `key` + Spanish display `label`. */
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  labelEs: text("label_es").notNull(),
  sort: integer("sort").notNull().default(0),
});

/** Accepted exercises are never deleted (ADR 0003). Drafts may be rejected. */
export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: exerciseStatusEnum("status").notNull().default("draft"),
    authorCoachId: uuid("author_coach_id").references(() => users.id, { onDelete: "set null" }),
    demoType: demoTypeEnum("demo_type"),
    demoUrl: text("demo_url"),
    demoKey: text("demo_key"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByAdminId: uuid("accepted_by_admin_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("exercises_status_idx").on(t.status)],
);

export const exerciseTags = pgTable(
  "exercise_tags",
  {
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.exerciseId, t.tagId] }), index("exercise_tags_tag_idx").on(t.tagId)],
);

/* ------------------------------------------------------------------ */
/* Training plans                                                      */
/* ------------------------------------------------------------------ */

export const trainingPlans = pgTable(
  "training_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("training_plans_coach_idx").on(t.coachId)],
);

export const planWeeks = pgTable(
  "plan_weeks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => trainingPlans.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name"),
  },
  (t) => [unique("plan_weeks_plan_position_uq").on(t.planId, t.position)],
);

export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    weekId: uuid("week_id")
      .notNull()
      .references(() => planWeeks.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name"),
  },
  (t) => [unique("training_sessions_week_position_uq").on(t.weekId, t.position)],
);

/** Reps and sets live here — per plan, never on the exercise itself. */
export const sessionExercises = pgTable(
  "session_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    reps: integer("reps"),
    sets: integer("sets"),
    notes: text("notes"),
  },
  (t) => [
    unique("session_exercises_session_position_uq").on(t.sessionId, t.position),
    index("session_exercises_exercise_idx").on(t.exerciseId),
  ],
);

/** At most one active assignment per athlete — enforced by a partial index. */
export const planAssignments = pgTable(
  "plan_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => trainingPlans.id, { onDelete: "restrict" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedByCoachId: uuid("assigned_by_coach_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("plan_assignments_one_active_per_athlete").on(t.athleteId).where(sql`${t.archivedAt} is null`),
    index("plan_assignments_athlete_idx").on(t.athleteId),
  ],
);

/** Completion marker only (ADR 0002). One per planned session per athlete. */
export const logs = pgTable(
  "logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("logs_one_per_session_per_athlete").on(t.sessionId, t.athleteId)],
);

/* ------------------------------------------------------------------ */
/* Inferred types                                                      */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Exercise = typeof exercises.$inferSelect;
export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type PlanAssignment = typeof planAssignments.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Log = typeof logs.$inferSelect;
