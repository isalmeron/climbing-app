import { describe, expect, it } from "vitest";
import { labelForTag, TAG_VOCABULARY } from "@/lib/tag-vocabulary";

describe("tag vocabulary (ADR 0003)", () => {
  it("uses language-neutral english keys", () => {
    for (const tag of TAG_VOCABULARY) {
      expect(tag.key).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("keeps keys unique", () => {
    const keys = TAG_VOCABULARY.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("renders the spanish label, not the key", () => {
    expect(labelForTag({ key: "upper-body" })).toBe("Tren superior");
  });

  it("prefers the admin-edited label from the database", () => {
    expect(labelForTag({ key: "core", labelEs: "Zona media" })).toBe("Zona media");
  });

  it("falls back to the key for unknown tags", () => {
    expect(labelForTag({ key: "unknown-tag" })).toBe("unknown-tag");
  });
});
