import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/db";
import { accounts, type roleEnum, sessions, users, verificationTokens } from "@/db/schema";
import { splitFullName } from "@/lib/name";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // JWT sessions so the credentials provider works alongside OAuth (ADR 0005).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);

        if (!user?.passwordHash || user.deactivatedAt) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
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
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.uid = user.id;
        token.role = (user as { role?: (typeof roleEnum.enumValues)[number] }).role ?? "athlete";

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
          firstName?: string | null;
          lastName?: string | null;
        };
        if (patch.firstName !== undefined) token.firstName = patch.firstName;
        if (patch.lastName !== undefined) token.lastName = patch.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.role) session.user.role = token.role as typeof session.user.role;
      session.user.firstName = (token.firstName as string | null | undefined) ?? null;
      session.user.lastName = (token.lastName as string | null | undefined) ?? null;
      return session;
    },
  },
});
