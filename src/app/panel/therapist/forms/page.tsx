import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

import FormBank from "@/components/panel/therapist/FormBank";

export default async function TherapistFormsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const role = (session.user as any)?.role;
  if (role !== "therapist") redirect("/panel/unauthorized");

  const therapistEmail = (session.user as any)?.email as string;

  return <FormBank therapistEmail={therapistEmail} />;
}