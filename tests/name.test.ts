import { describe, expect, it } from "vitest";
import { displayName, splitFullName } from "@/lib/name";

describe("displayName", () => {
  it("prefers the canonical split names", () => {
    expect(displayName({ firstName: "Juan", lastName: "Pérez", email: "a@b.c" })).toBe("Juan Pérez");
  });

  it("works with only a first name", () => {
    expect(displayName({ firstName: "Juan", lastName: null, email: "a@b.c" })).toBe("Juan");
  });

  it("falls back to the Auth.js mirror when split names are unset", () => {
    expect(displayName({ firstName: null, lastName: null, name: "Juan Pérez", email: "a@b.c" })).toBe("Juan Pérez");
  });

  it("falls back to the email as the last resort", () => {
    expect(displayName({ firstName: null, lastName: null, name: null, email: "a@b.c" })).toBe("a@b.c");
  });
});

describe("splitFullName (OAuth profile names)", () => {
  it("splits on the first space, keeping multi-token surnames whole", () => {
    expect(splitFullName("María de los Ángeles")).toEqual({ firstName: "María", lastName: "de los Ángeles" });
  });

  it("leaves single-token names without a last name", () => {
    expect(splitFullName("Chino")).toEqual({ firstName: "Chino", lastName: null });
  });

  it("handles empty input", () => {
    expect(splitFullName(null)).toEqual({ firstName: null, lastName: null });
    expect(splitFullName("   ")).toEqual({ firstName: null, lastName: null });
  });
});
