import { randomBytes } from "node:crypto";

/** Opaque, single-use token for invite links (never guessable). */
export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}
