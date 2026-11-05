import type { DefaultSession } from "next-auth";
import type { Role } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role; firstName: string | null; lastName: string | null } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    firstName?: string | null;
    lastName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    firstName?: string | null;
    lastName?: string | null;
  }
}
