import { describe, expect, it } from "vitest";
import { DESCRIPTION_PREVIEW_LENGTH, parseCatalogFilters, truncateDescription } from "@/lib/catalog-filters";

describe("parseCatalogFilters", () => {
  it("returns no filters when params are absent", () => {
    expect(parseCatalogFilters({})).toEqual({ status: null, tagKeys: [] });
  });

  it("reads a valid status", () => {
    expect(parseCatalogFilters({ status: "draft" })).toEqual({ status: "draft", tagKeys: [] });
    expect(parseCatalogFilters({ status: "accepted" })).toEqual({ status: "accepted", tagKeys: [] });
  });

  it("drops unknown status values instead of throwing", () => {
    expect(parseCatalogFilters({ status: "deleted" })).toEqual({ status: null, tagKeys: [] });
    expect(parseCatalogFilters({ status: ["draft", "accepted"] })).toEqual({
      status: "draft",
      tagKeys: [],
    });
  });

  it("splits comma-separated tag keys", () => {
    expect(parseCatalogFilters({ tags: "pull,fingers" })).toEqual({
      status: null,
      tagKeys: ["pull", "fingers"],
    });
  });

  it("accepts repeated tags params and dedupes", () => {
    expect(parseCatalogFilters({ tags: ["pull", "fingers,pull"] })).toEqual({
      status: null,
      tagKeys: ["pull", "fingers"],
    });
  });

  it("ignores blank tag entries", () => {
    expect(parseCatalogFilters({ tags: " , pull,," })).toEqual({ status: null, tagKeys: ["pull"] });
  });

  it("parses status and tags together", () => {
    expect(parseCatalogFilters({ status: "accepted", tags: "core" })).toEqual({
      status: "accepted",
      tagKeys: ["core"],
    });
  });
});

describe("truncateDescription", () => {
  it("keeps short descriptions whole", () => {
    expect(truncateDescription("Corta")).toBe("Corta");
  });

  it("trims trailing whitespace before the ellipsis", () => {
    const text = `${"a".repeat(DESCRIPTION_PREVIEW_LENGTH - 1)} b${"c".repeat(50)}`;
    const result = truncateDescription(text);
    expect(result).toHaveLength(DESCRIPTION_PREVIEW_LENGTH);
    expect(result.endsWith("…")).toBe(true);
    expect(result.endsWith(" …")).toBe(false);
  });

  it("appends an ellipsis to long descriptions", () => {
    const text = "x".repeat(300);
    expect(truncateDescription(text)).toBe(`${"x".repeat(DESCRIPTION_PREVIEW_LENGTH)}…`);
  });
});
