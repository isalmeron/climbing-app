/**
 * Assignment transition rules, kept pure so the "one active plan" invariant is
 * testable without a database (the partial index guards it at rest).
 */

export type AssignmentRow = { id: string; archivedAt: Date | null };

/** Which existing assignments to archive when a new plan is linked. */
export function assignmentsToArchive(existing: AssignmentRow[]): string[] {
  return existing.filter((a) => a.archivedAt === null).map((a) => a.id);
}

/** A week counts as complete when all of its sessions were logged. */
export function isWeekComplete(totalSessions: number, completedSessions: number): boolean {
  return totalSessions > 0 && completedSessions === totalSessions;
}

export function adherenceRate(totalSessions: number, completedSessions: number): number {
  if (totalSessions === 0) return 0;
  return Math.round((completedSessions / totalSessions) * 100);
}
