import type { Role } from "@/db/schema";

/**
 * Pure authorisation rules. Kept free of IO so they can be tested directly —
 * every Server Action and page guard delegates here.
 */

export type ExerciseLike = {
  status: "draft" | "accepted";
  authorCoachId: string | null;
};

export function canComposePlans(role: Role): boolean {
  return role === "coach";
}

export function canCurateCatalog(role: Role): boolean {
  return role === "admin";
}

/** Drafts belong to their author until accepted (ADR 0003). */
export function canEditExercise(exercise: ExerciseLike, actor: { id: string; role: Role }): boolean {
  if (actor.role === "admin") return true;
  if (exercise.status === "accepted") return false;
  return actor.role === "coach" && exercise.authorCoachId === actor.id;
}

/** Only the admin accepts or rejects a draft. */
export function canReviewDrafts(role: Role): boolean {
  return role === "admin";
}

export function canManagePlan(plan: { coachId: string }, actor: { id: string; role: Role }): boolean {
  return actor.role === "admin" || (actor.role === "coach" && plan.coachId === actor.id);
}

/** A plan may be deleted only while no athlete has it as an active assignment. */
export function canDeletePlan(
  plan: { coachId: string },
  activeAssignments: number,
  actor: { id: string; role: Role },
): boolean {
  return canManagePlan(plan, actor) && activeAssignments === 0;
}

/** Athletes see only their own coach's plans; the admin sees all. */
export function canViewAthlete(
  athlete: { id: string; coachId: string | null },
  actor: { id: string; role: Role },
): boolean {
  if (actor.role === "admin") return true;
  if (actor.role === "coach") return athlete.coachId === actor.id;
  return athlete.id === actor.id;
}

export function canTransferAthlete(athlete: { coachId: string | null }, actor: { id: string; role: Role }): boolean {
  return actor.role === "admin" || (actor.role === "coach" && athlete.coachId === actor.id);
}

/** Completion only, and only for the athlete the plan was assigned to. */
export function canCompleteSession(sessionAthleteId: string, actor: { id: string; role: Role }): boolean {
  return actor.role === "athlete" && actor.id === sessionAthleteId;
}
