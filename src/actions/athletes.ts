"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { athleteCoach, planAssignments, trainingPlans } from "@/db/schema";
import { canTransferAthlete } from "@/lib/permissions";
import { requireRoleAction } from "@/lib/session";

/** Linking a plan archives the athlete's previous one — history is kept. */
export async function assignPlan(athleteId: string, planId: string): Promise<void> {
  const coach = await requireRoleAction(["coach", "admin"]);

  const [plan] = await db.select().from(trainingPlans).where(eq(trainingPlans.id, planId));
  if (!plan) throw new Error("El plan no existe");
  if (coach.role === "coach" && plan.coachId !== coach.id) throw new Error("No autorizado");

  const [link] = await db.select().from(athleteCoach).where(eq(athleteCoach.athleteId, athleteId));

  if (coach.role === "coach" && link?.coachId !== coach.id) throw new Error("No autorizado");

  await db.transaction(async (tx) => {
    await tx
      .update(planAssignments)
      .set({ archivedAt: new Date() })
      .where(and(eq(planAssignments.athleteId, athleteId), isNull(planAssignments.archivedAt)));

    await tx.insert(planAssignments).values({
      planId,
      athleteId,
      assignedByCoachId: coach.id,
    });
  });

  revalidatePath("/coach/athletes");
  revalidatePath("/athlete");
}

/** Coaches may hand an athlete to another coach; the athlete keeps plan and logs. */
export async function transferAthlete(athleteId: string, newCoachId: string): Promise<void> {
  const actor = await requireRoleAction(["coach", "admin"]);

  const [link] = await db.select().from(athleteCoach).where(eq(athleteCoach.athleteId, athleteId));
  if (!canTransferAthlete({ coachId: link?.coachId ?? null }, actor)) {
    throw new Error("No autorizado");
  }

  await db
    .update(athleteCoach)
    .set({ coachId: newCoachId, linkedAt: new Date() })
    .where(eq(athleteCoach.athleteId, athleteId));

  revalidatePath("/coach/athletes");
  revalidatePath("/admin");
}
