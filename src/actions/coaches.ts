"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { coachSetupTokens, users } from "@/db/schema";
import { signIn } from "@/lib/auth";
import { coachSetupEmail, mailer } from "@/lib/mailer";
import { requireRoleAction } from "@/lib/session";
import { newInviteToken } from "@/lib/token";

const inviteSchema = z.object({
  email: z.string().email(),
});

/** Invariant: one unused setup token per coach — resending invalidates the old one. */
async function issueSetupToken(userId: string): Promise<string> {
  await db.delete(coachSetupTokens).where(and(eq(coachSetupTokens.userId, userId), isNull(coachSetupTokens.usedAt)));
  const token = newInviteToken();
  await db.insert(coachSetupTokens).values({ token, userId });
  return token;
}

/**
 * The admin is the trust boundary for who authors plans (ADR 0005): invites
 * hardcode role=coach, and the flow can never create admins or change roles.
 */
export async function inviteCoach(formData: FormData): Promise<void> {
  await requireRoleAction("admin");
  const { email } = inviteSchema.parse({ email: formData.get("email") });
  const normalized = email.toLowerCase();

  const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  if (existing) throw new Error("Ya existe una cuenta con ese email");

  const [coach] = await db.insert(users).values({ email: normalized, role: "coach" }).returning();
  if (!coach) throw new Error("No se pudo crear el entrenador");

  const token = await issueSetupToken(coach.id);
  await mailer().send({
    to: normalized,
    subject: "Tu cuenta de entrenador",
    text: coachSetupEmail(`${process.env.APP_URL ?? ""}/coach-setup/${token}`),
  });

  revalidatePath("/admin");
}

export async function resendCoachInvite(coachId: string): Promise<void> {
  await requireRoleAction("admin");

  const [coach] = await db.select().from(users).where(eq(users.id, coachId));
  if (!coach || coach.role !== "coach") throw new Error("No es un entrenador");

  const token = await issueSetupToken(coach.id);
  await mailer().send({
    to: coach.email,
    subject: "Tu cuenta de entrenador",
    text: coachSetupEmail(`${process.env.APP_URL ?? ""}/coach-setup/${token}`),
  });

  revalidatePath("/admin");
}

export async function revokeCoachInvite(coachId: string): Promise<void> {
  await requireRoleAction("admin");
  await db.delete(coachSetupTokens).where(and(eq(coachSetupTokens.userId, coachId), isNull(coachSetupTokens.usedAt)));
  revalidatePath("/admin");
}

const setupSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
});

export type CoachSetupState = { error?: string } | undefined;

/** One-time setup: consumes the token, sets the password, signs the coach in. */
export async function completeCoachSetup(_prev: CoachSetupState, formData: FormData): Promise<CoachSetupState> {
  const parsed = setupSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const [token] = await db
    .select()
    .from(coachSetupTokens)
    .where(and(eq(coachSetupTokens.token, parsed.data.token), isNull(coachSetupTokens.usedAt)))
    .limit(1);
  if (!token) return { error: "Este enlace ya se ha usado o no es válido." };

  const [coach] = await db.select().from(users).where(eq(users.id, token.userId)).limit(1);
  if (!coach || coach.role !== "coach") return { error: "Este enlace no es válido." };

  const bcrypt = (await import("bcryptjs")).default;
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.password, 10) })
    .where(eq(users.id, coach.id));
  await db.update(coachSetupTokens).set({ usedAt: new Date() }).where(eq(coachSetupTokens.id, token.id));

  await signIn("credentials", {
    email: coach.email,
    password: parsed.data.password,
    redirectTo: "/coach",
  });
  redirect("/coach");
}

export type OnboardingState = { error?: string } | undefined;

const onboardingSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

/** Mandatory onboarding: names must be set before the coach home is reachable. */
export async function completeOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const coach = await requireRoleAction("coach");
  const parsed = onboardingSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });
  if (!parsed.success) return { error: "Revisa tus datos." };

  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
    })
    .where(eq(users.id, coach.id));

  redirect("/coach");
}

export async function updateAvatar(imageUrl: string): Promise<void> {
  const user = await requireRoleAction(["coach", "athlete", "admin"]);
  const url = z.string().url().parse(imageUrl);
  await db.update(users).set({ image: url }).where(eq(users.id, user.id));
  revalidatePath("/coach");
  revalidatePath("/athlete");
}
