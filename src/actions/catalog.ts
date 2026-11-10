"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { exercises, tags } from "@/db/schema";
import { requireRoleAction } from "@/lib/session";

const acceptSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().min(5).max(4000).optional(),
});

/** The single quality gate: the admin accepts a draft into the global catalog. */
export async function acceptDraft(exerciseId: string, patch: z.infer<typeof acceptSchema> = {}): Promise<void> {
  const admin = await requireRoleAction("admin");
  const data = acceptSchema.parse(patch);

  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId));
  if (!exercise) throw new Error("El ejercicio no existe");
  if (exercise.status === "accepted") throw new Error("Ya está aceptado");

  await db
    .update(exercises)
    .set({
      ...data,
      status: "accepted",
      acceptedAt: new Date(),
      acceptedByAdminId: admin.id,
      updatedAt: new Date(),
    })
    .where(eq(exercises.id, exerciseId));

  revalidatePath("/admin/exercises");
  revalidatePath("/coach/exercises");
}

const tagSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Clave en minúsculas, sin espacios (ej. upper-body)"),
  labelEs: z.string().min(2).max(60),
  sort: z.number().int().min(0).default(0),
});

export async function createTag(input: z.infer<typeof tagSchema>): Promise<void> {
  await requireRoleAction("admin");
  const data = tagSchema.parse(input);
  await db.insert(tags).values(data);
  revalidatePath("/admin/tags");
}

export async function updateTag(id: string, input: z.infer<typeof tagSchema>): Promise<void> {
  await requireRoleAction("admin");
  const data = tagSchema.parse(input);
  await db.update(tags).set(data).where(eq(tags.id, id));
  revalidatePath("/admin/tags");
}
