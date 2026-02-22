import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function PanelRoot() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/signin");

  const role = (session.user as any)?.role;

  if (role === "admin") redirect("/panel/admin");
  if (role === "therapist") redirect("/panel/therapist");
  if (role === "client") redirect("/panel/client");

  redirect("/auth/signin");
}
