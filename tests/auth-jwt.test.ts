import { describe, expect, it } from "vitest";
import { authCallbacks } from "@/lib/auth-callbacks";

type JwtArgs = {
  token: Record<string, unknown>;
  trigger?: "signIn" | "update" | "signUp";
  session?: unknown;
};

const callJwt = async ({ token, trigger, session }: JwtArgs) =>
  authCallbacks.jwt({
    token,
    trigger,
    session,
  } as Parameters<typeof authCallbacks.jwt>[0]);

describe("jwt callback: update trigger", () => {
  it("refreshes names from unstable_update({ user: { firstName, lastName } })", async () => {
    const token = { uid: "u1", role: "coach", firstName: null, lastName: null };

    const out = await callJwt({
      token,
      trigger: "update",
      session: { user: { firstName: "Ana", lastName: "García" } },
    });

    expect(out.firstName).toBe("Ana");
    expect(out.lastName).toBe("García");
  });
});
