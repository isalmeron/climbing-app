import { eq } from "drizzle-orm";
import type { Account, Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { db } from "@/db";
import { type roleEnum, users } from "@/db/schema";
import { splitFullName } from "@/lib/name";

export const authCallbacks = {
  async signIn({
    user,
    account,
  }: {
    user: User;
    account?: Account | null;
    profile?: Profile;
    email?: { verificationRequest?: boolean };
    credentials?: Record<string, unknown>;
  }) {
    // Credentials rejects deactivated users in `authorize`; a linked OAuth
    // account would bypass that check, so it is repeated here.
    if (account?.provider === "credentials" || !user.id) return true;
    const [row] = await db
      .select({ deactivatedAt: users.deactivatedAt })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    return !row?.deactivatedAt;
  },
  async jwt({
    token,
    user,
    trigger,
    session,
  }: {
    token: JWT;
    user?: User;
    trigger?: "signIn" | "update" | "signUp";
    session?: unknown;
  }) {
    if (user?.id) {
      token.uid = user.id;
      token.role = (user as User & { role?: (typeof roleEnum.enumValues)[number] }).role ?? "athlete";

      // Canonical split names from our row; OAuth profiles only carry a full
      // name, so split it here and let the adapter's `name` stay as fallback.
      const [row] = await db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      const names = row?.firstName
        ? { firstName: row.firstName, lastName: row.lastName }
        : splitFullName(token.name ?? user.name);
      token.firstName = names.firstName;
      token.lastName = names.lastName;
    }

    // Server Actions mutate the user row; without this the JWT would keep
    // its sign-in snapshot until the next login.
    if (trigger === "update" && session) {
      const patch = session as {
        user?: { firstName?: string | null; lastName?: string | null };
      };
      if (patch.user?.firstName !== undefined) token.firstName = patch.user.firstName;
      if (patch.user?.lastName !== undefined) token.lastName = patch.user.lastName;
    }
    return { ...token };
  },
  async session({ session, token }: { session: Session; token: JWT }) {
    if (token.uid) session.user.id = token.uid as string;
    if (token.role) session.user.role = token.role as typeof session.user.role;
    session.user.firstName = (token.firstName as string | null | undefined) ?? null;
    session.user.lastName = (token.lastName as string | null | undefined) ?? null;
    return session;
  },
};
