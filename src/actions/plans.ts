"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import {
  exercises,
  planAssignments,
  planWeeks,
  sessionExercises,
  trainingPlans,
  trainingSessions,
} from "@/db/schema";
import { canDeletePlan, canManagePlan } from "@/lib/permissions";
import { requireRoleAction } from "@/lib/session";

const planSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
});

export async function createPlan(input: z.infer<typeof planSchema>): Promise<{ id: string }> {
  const coach = await requireRoleAction("coach");
  const data = planSchema.parse(input);
  const [plan] = await db
    .insert(trainingPlans)
    .values({ coachId: coach.id, name: data.name, description: data.description })
    .returning();
  if (!plan) throw new Error("No se pudo crear el plan");
  revalidatePath("/coach/plans");
  return { id: plan.id };
}

export async function archivePlan(planId: string): Promise<void> {
  const coach = await requireRoleAction("coach");
  const [plan] = await db.select().from(trainingPlans).where(eq(trainingPlans.id, planId));
  if (!plan || !canManagePlan(plan, coach)) throw new Error("No autorizado");
  await db
    .update(trainingPlans)
    .set({ archivedAt: new Date() })
    .where(eq(trainingPlans.id, planId));
  revalidatePath("/coach/plans");
}

/** Deletion is allowed only while no athlete has it as an active assignment. */
export async function deletePlan(planId: string): Promise<void> {
  const coach = await requireRoleAction("coach");
  const [plan] = await db.select().from(trainingPlans).where(eq(trainingPlans.id, planId));
  if (!plan) throw new Error("El plan no existe");

  const active = await db
    .select({ id: planAssignments.id })
    .from(planAssignments)
    .where(and(eq(planAssignments.planId, planId), isNull(planAssignments.archivedAt)));

  if (!canDeletePlan(plan, active.length, coach)) {
    throw new Error("El plan está asignado a un deportista: archívalo en lugar de borrarlo.");
  }
  await db.delete(trainingPlans).where(eq(trainingPlans.id, planId));
  revalidatePath("/coach/plans");
}

export async function addWeek(planId: string): Promise<void> {
  const coach = await requireRoleAction("coach");
  const [plan] = await db.select().from(trainingPlans).where(eq(trainingPlans.id, planId));
  if (!plan || !canManagePlan(plan, coach)) throw new Error("No autorizado");

  const weeks = await db.select().from(planWeeks).where(eq(planWeeks.planId, planId));
  await db.insert(planWeeks).values({ planId, position: weeks.length + 1 });
  revalidatePath(`/coach/plans/${planId}`);
}

export async function addSession(weekId: string, name?: string): Promise<void> {
  await requireRoleAction("coach");
  const sessions = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.weekId, weekId));
  await db
    .insert(trainingSessions)
    .values({ weekId, position: sessions.length + 1, name: name ?? null });
}

export async function addExerciseToSession(input: {
  sessionId: string;
  exerciseId: string;
  reps: number;
  sets: number;
  notes?: string;
}): Promise<void> {
  await requireRoleAction("coach");
  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, input.exerciseId));
  if (!exercise) throw new Error("El ejercicio no existe");
  if (exercise.status !== "accepted") throw new Error("Solo se pueden usar ejercicios aceptados");

  const existing = await db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, input.sessionId));

  await db.insert(sessionExercises).values({
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    position: existing.length + 1,
    reps: input.reps,
    sets: input.sets,
    notes: input.notes,
  });
}

export async function removeSessionExercise(id: string): Promise<void> {
  await requireRoleAction("coach");
  await db.delete(sessionExercises).where(eq(sessionExercises.id, id));
}
