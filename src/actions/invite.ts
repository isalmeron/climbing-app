"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { inviteLinks } from "@/db/schema";
import { env } from "@/lib/env";
import { inviteEmail, mailer } from "@/lib/mailer";
import { requireRoleAction } from "@/lib/session";
import { newInviteToken } from "@/lib/token";

export async function createInviteLink(): Promise<{ url: string }> {
  const coach = await requireRoleAction("coach");
  const token = newInviteToken();

  await db.insert(inviteLinks).values({ token, coachId: coach.id });

  const url = `${env().APP_URL}/signup/${token}`;
  await mailer().send({
    to: coach.email,
    subject: "Tu enlace de invitación",
    text: `Comparte este enlace con un deportista. Solo puede usarse una vez:\n\n${url}`,
  });

  revalidatePath("/coach");
  return { url };
}

export async function createInviteLinkForEmail(email: string): Promise<void> {
  const coach = await requireRoleAction("coach");
  const token = newInviteToken();
  await db.insert(inviteLinks).values({ token, coachId: coach.id });
  const url = `${env().APP_URL}/signup/${token}`;
  await mailer().send({
    to: email,
    subject: "Invitación a Climbing Training",
    text: inviteEmail(url),
  });
  revalidatePath("/coach");
}

export async function listInviteLinks() {
  const coach = await requireRoleAction("coach");
  return db
    .select()
    .from(inviteLinks)
    .where(eq(inviteLinks.coachId, coach.id))
    .orderBy(desc(inviteLinks.createdAt))
    .limit(20);
}

/** Form-action wrapper: `<form action={createInviteLinkForm}>`. */
export async function createInviteLinkForm(): Promise<void> {
  await createInviteLink();
}
