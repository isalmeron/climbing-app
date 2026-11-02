import { describe, expect, it } from "vitest";
import {
  canCompleteSession,
  canDeletePlan,
  canEditExercise,
  canManagePlan,
  canTransferAthlete,
  canViewAthlete,
} from "@/lib/permissions";

const coach = { id: "coach-1", role: "coach" as const };
const otherCoach = { id: "coach-2", role: "coach" as const };
const admin = { id: "admin-1", role: "admin" as const };
const athlete = { id: "athlete-1", role: "athlete" as const };

describe("exercise drafts (ADR 0003)", () => {
  const draft = { status: "draft" as const, authorCoachId: coach.id };
  const accepted = { status: "accepted" as const, authorCoachId: coach.id };

  it("lets the author edit their draft", () => {
    expect(canEditExercise(draft, coach)).toBe(true);
  });

  it("blocks another coach from editing the draft", () => {
    expect(canEditExercise(draft, otherCoach)).toBe(false);
  });

  it("freezes authorship once accepted", () => {
    expect(canEditExercise(accepted, coach)).toBe(false);
  });

  it("lets the admin edit anything", () => {
    expect(canEditExercise(accepted, admin)).toBe(true);
    expect(canEditExercise(draft, admin)).toBe(true);
  });
});

describe("plans and assignments", () => {
  const plan = { coachId: coach.id };

  it("only the owning coach manages a plan", () => {
    expect(canManagePlan(plan, coach)).toBe(true);
    expect(canManagePlan(plan, otherCoach)).toBe(false);
  });

  it("refuses deletion while an athlete has it active", () => {
    expect(canDeletePlan(plan, 1, coach)).toBe(false);
  });

  it("allows deletion of a plan nobody is assigned to", () => {
    expect(canDeletePlan(plan, 0, coach)).toBe(true);
  });
});

describe("athlete visibility and transfer", () => {
  const linked = { id: athlete.id, coachId: coach.id };

  it("lets the linked coach see the athlete", () => {
    expect(canViewAthlete(linked, coach)).toBe(true);
  });

  it("hides the athlete from another coach", () => {
    expect(canViewAthlete(linked, otherCoach)).toBe(false);
  });

  it("lets the athlete see themselves and the admin see everyone", () => {
    expect(canViewAthlete(linked, athlete)).toBe(true);
    expect(canViewAthlete(linked, admin)).toBe(true);
  });

  it("only the current coach or admin transfers", () => {
    expect(canTransferAthlete(linked, coach)).toBe(true);
    expect(canTransferAthlete(linked, otherCoach)).toBe(false);
    expect(canTransferAthlete(linked, admin)).toBe(true);
  });
});

describe("completion (ADR 0002)", () => {
  it("only the assigned athlete marks a session complete", () => {
    expect(canCompleteSession(athlete.id, athlete)).toBe(true);
    expect(canCompleteSession(athlete.id, coach)).toBe(false);
  });
});
