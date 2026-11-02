"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { athleteProfiles, users } from "@/db/schema";
import { requireRoleAction } from "@/lib/session";

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  weightKg: z.coerce.number().min(20).max(300).nullable().optional(),
  heightCm: z.coerce.number().int().min(80).max(260).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireRoleAction(["athlete", "coach", "admin"]);
  const data = profileSchema.parse({
    name: formData.get("name"),
    birthdate: formData.get("birthdate") || null,
    weightKg: formData.get("weightKg") || null,
    heightCm: formData.get("heightCm") || null,
    notes: formData.get("notes") || null,
  });

  await db.update(users).set({ name: data.name }).where(eq(users.id, user.id));

  await db
    .insert(athleteProfiles)
    .values({
      userId: user.id,
      birthdate: data.birthdate ?? null,
      weightKg: data.weightKg != null ? String(data.weightKg) : null,
      heightCm: data.heightCm ?? null,
      notes: data.notes ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: athleteProfiles.userId,
      set: {
        birthdate: data.birthdate ?? null,
        weightKg: data.weightKg != null ? String(data.weightKg) : null,
        heightCm: data.heightCm ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/athlete/profile");
}
