import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PanelShell from "@/components/panel/PanelShell";
import { authOptions } from "@/lib/auth";

export default async function TherapistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // اگر لاگین نیست
  if (!session) {
    redirect("/auth/signin");
  }

  const role = (session.user as any)?.role;

  // اگر نقش درمانگر نیست → هدایت به پنل خودش
  if (role === "admin") {
    redirect("/panel/admin");
  }

  if (role === "client") {
    redirect("/panel/client");
  }

  if (role !== "therapist") {
    redirect("/");
  }

  return <PanelShell role="therapist">{children}</PanelShell>;
}
