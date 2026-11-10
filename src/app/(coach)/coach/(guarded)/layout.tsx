import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";

/** Mandatory onboarding: no guarded coach page until first+last name are set. */
export default async function GuardedCoachLayout({ children }: { children: React.ReactNode }) {
  const coach = await requireRole("coach");
  if (!coach.firstName || !coach.lastName) redirect("/coach/onboarding");
  return <>{children}</>;
}
