"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { canDeactivateUser } from "@/lib/permissions";
import { requireRoleAction } from "@/lib/session";

const userActiveSchema = z.object({
  userId: z.string().uuid(),
  active: z.boolean(),
});

/**
 * Deactivation is an account-level flag — nothing cascades (ADR 0005): a
 * deactivated coach's athletes keep read access and their plan; re-linking
 * happens via transfer. Login rejects deactivated users (password and OAuth).
 */
export async function setUserActive(userId: string, active: boolean): Promise<void> {
  const admin = await requireRoleAction("admin");
  const data = userActiveSchema.parse({ userId, active });

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, data.userId)).limit(1);
  if (!target) throw new Error("El usuario no existe");
  if (!canDeactivateUser(target, admin)) throw new Error("No autorizado");

  await db
    .update(users)
    .set({ deactivatedAt: data.active ? null : new Date() })
    .where(eq(users.id, data.userId));

  revalidatePath("/admin");
  revalidatePath("/admin/athletes");
}
