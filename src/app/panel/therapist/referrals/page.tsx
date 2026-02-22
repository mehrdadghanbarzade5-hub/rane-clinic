import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

import ReferralsClient from "./ReferralsClient";

export default async function TherapistReferralsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session.user as any)?.role;
  if (role !== "therapist") redirect("/panel/unauthorized");

  const therapistEmail = String((session.user as any)?.email ?? "");
  if (!therapistEmail) redirect("/panel/unauthorized");

  return <ReferralsClient therapistEmail={therapistEmail} />;
}
