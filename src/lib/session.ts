import { redirect } from "next/navigation";
import type { Role } from "@/db/schema";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  role: Role;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

/** Server-side guard used by every role layout and Server Action. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    role: user.role,
    email: user.email ?? "",
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowed: Role | Role[]): Promise<SessionUser> {
  const user = await requireUser();
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!list.includes(user.role)) redirect(`/${user.role}`);
  return user;
}

/** For Server Actions: throws instead of redirecting. */
export async function requireRoleAction(allowed: Role | Role[]): Promise<SessionUser> {
  const user = await currentUser();
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!user || !list.includes(user.role)) {
    throw new Error("No autorizado");
  }
  return user;
}

export function homeFor(role: Role): string {
  return `/${role}`;
}
