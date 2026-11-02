import { describe, expect, it } from "vitest";
import { adherenceRate, assignmentsToArchive, isWeekComplete } from "@/lib/assignment";

describe("one active plan per athlete", () => {
  it("archives every active assignment when a new plan is linked", () => {
    const rows = [
      { id: "a1", archivedAt: null },
      { id: "a2", archivedAt: null },
      { id: "a3", archivedAt: new Date("2024-01-01") },
    ];
    expect(assignmentsToArchive(rows)).toEqual(["a1", "a2"]);
  });

  it("archives nothing when there is no active assignment", () => {
    expect(assignmentsToArchive([{ id: "a3", archivedAt: new Date() }])).toEqual([]);
  });
});

describe("weekly adherence", () => {
  it("counts a week complete only when every session is logged", () => {
    expect(isWeekComplete(3, 3)).toBe(true);
    expect(isWeekComplete(3, 2)).toBe(false);
  });

  it("never calls an empty week complete", () => {
    expect(isWeekComplete(0, 0)).toBe(false);
  });

  it("reports adherence as a percentage", () => {
    expect(adherenceRate(4, 1)).toBe(25);
    expect(adherenceRate(0, 0)).toBe(0);
  });
});
