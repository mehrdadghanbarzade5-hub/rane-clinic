// src/app/panel/admin/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PanelShell from "@/components/panel/PanelShell";
import { authOptions } from "@/lib/auth";

export default async function AdminLayout({
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

  // اگر نقش ادمین نیست → هدایت به پنل خودش
  if (role === "therapist") {
    redirect("/panel/therapist");
  }

  if (role === "client") {
    redirect("/panel/client");
  }

  if (role !== "admin") {
    redirect("/");
  }

  return <PanelShell role="admin">{children}</PanelShell>;
}