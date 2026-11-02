"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { logs, planAssignments, planWeeks, trainingSessions } from "@/db/schema";
import { requireRoleAction } from "@/lib/session";

/**
 * Completion only (ADR 0002): the athlete marks a planned session done. The
 * session must belong to their active plan.
 */
export async function completeSession(sessionId: string): Promise<void> {
  const athlete = await requireRoleAction("athlete");

  const [active] = await db
    .select({ planId: planAssignments.planId })
    .from(planAssignments)
    .where(and(eq(planAssignments.athleteId, athlete.id), isNull(planAssignments.archivedAt)))
    .limit(1);

  if (!active) throw new Error("No tienes un plan asignado");

  const [row] = await db
    .select({ id: trainingSessions.id })
    .from(trainingSessions)
    .innerJoin(planWeeks, eq(planWeeks.id, trainingSessions.weekId))
    .where(and(eq(trainingSessions.id, sessionId), eq(planWeeks.planId, active.planId)))
    .limit(1);

  if (!row) throw new Error("Esa sesión no pertenece a tu plan");

  await db
    .insert(logs)
    .values({ sessionId, athleteId: athlete.id })
    .onConflictDoNothing({ target: [logs.sessionId, logs.athleteId] });

  revalidatePath("/athlete");
}
