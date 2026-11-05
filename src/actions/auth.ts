"use server";

import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { athleteCoach, athleteProfiles, inviteLinks, users } from "@/db/schema";
import { signIn } from "@/lib/auth";

const signupSchema = z.object({
  token: z.string().min(10),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export type SignupState = { error?: string } | undefined;

/** The only way an athlete joins: through a coach's single-use invite link. */
export async function signUpWithInvite(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    token: formData.get("token"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Revisa los datos del formulario." };

  const { token } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const [invite] = await db
    .select()
    .from(inviteLinks)
    .where(and(eq(inviteLinks.token, token), isNull(inviteLinks.usedAt)))
    .limit(1);
  if (!invite) return { error: "Esta invitación no es válida o ya se ha usado." };

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "Ya existe una cuenta con ese email." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [created] = await db
    .insert(users)
    .values({
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      email,
      role: "athlete",
      passwordHash,
    })
    .returning();

  if (!created) return { error: "No se pudo crear la cuenta." };

  await db.transaction(async (tx) => {
    await tx.insert(athleteProfiles).values({ userId: created.id });
    await tx.insert(athleteCoach).values({ athleteId: created.id, coachId: invite.coachId });
    await tx
      .update(inviteLinks)
      .set({ usedAt: new Date(), usedByAthleteId: created.id })
      .where(eq(inviteLinks.id, invite.id));
  });

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/athlete",
  });
  return undefined;
}

export async function loginWithCredentials(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    // Auth.js signals success by throwing a redirect; only real failures land here.
    if ((error as { digest?: string }).digest?.includes("NEXT_REDIRECT")) throw error;
    return { error: "Email o contraseña incorrectos." };
  }
  return undefined;
}

export async function loginWithGoogle(): Promise<void> {
  await signIn("google", { redirectTo: "/" });
}

export async function loginWithFacebook(): Promise<void> {
  await signIn("facebook", { redirectTo: "/" });
}

export async function logout(): Promise<void> {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/login" });
}
