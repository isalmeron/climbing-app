"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { exercises, exerciseTags } from "@/db/schema";
import { canEditExercise, canReviewDrafts } from "@/lib/permissions";
import { requireRoleAction } from "@/lib/session";

const draftSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(5).max(4000),
  demoType: z.enum(["upload", "embed"]).optional(),
  demoUrl: z.string().url().optional(),
  demoKey: z.string().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
});

export type ExerciseInput = z.infer<typeof draftSchema>;

/** A coach proposes a new exercise; it stays private until an admin accepts it. */
export async function createExerciseDraft(input: ExerciseInput): Promise<{ id: string }> {
  const coach = await requireRoleAction("coach");
  const data = draftSchema.parse(input);

  const [draft] = await db
    .insert(exercises)
    .values({
      name: data.name,
      description: data.description,
      status: "draft",
      authorCoachId: coach.id,
      demoType: data.demoType,
      demoUrl: data.demoUrl,
      demoKey: data.demoKey,
    })
    .returning();
  if (!draft) throw new Error("No se pudo crear el borrador");

  if (data.tagIds.length > 0) {
    await db
      .insert(exerciseTags)
      .values(data.tagIds.map((tagId) => ({ exerciseId: draft.id, tagId })));
  }
  revalidatePath("/coach/exercises");
  return { id: draft.id };
}

/** Editable by the author until accepted; then only the admin (ADR 0003). */
export async function updateExercise(exerciseId: string, input: ExerciseInput): Promise<void> {
  const user = await requireRoleAction(["coach", "admin"]);
  const data = draftSchema.parse(input);

  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId));
  if (!exercise) throw new Error("El ejercicio no existe");
  if (!canEditExercise(exercise, user)) throw new Error("No puedes editar este ejercicio");

  await db
    .update(exercises)
    .set({
      name: data.name,
      description: data.description,
      demoType: data.demoType,
      demoUrl: data.demoUrl,
      demoKey: data.demoKey,
      updatedAt: new Date(),
    })
    .where(eq(exercises.id, exerciseId));

  await db.delete(exerciseTags).where(eq(exerciseTags.exerciseId, exerciseId));
  if (data.tagIds.length > 0) {
    await db.insert(exerciseTags).values(data.tagIds.map((tagId) => ({ exerciseId, tagId })));
  }
  revalidatePath("/coach/exercises");
  revalidatePath("/admin/exercises");
}

/** Rejected drafts are removed — accepted exercises never are. */
export async function rejectDraft(exerciseId: string): Promise<void> {
  const user = await requireRoleAction("admin");
  if (!canReviewDrafts(user.role)) throw new Error("No autorizado");

  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId));
  if (exercise?.status === "accepted") {
    throw new Error("Un ejercicio aceptado no se puede borrar");
  }
  await db
    .delete(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.status, "draft")));
  revalidatePath("/admin/exercises");
}
