import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bookings, therapists } from "@/data/mockDb";
import ClientBookingsClient from "./ClientBookingsClient";

export default async function ClientBookingsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";

  const my = bookings
    .filter((b) => b.clientEmail === email)
    .slice()
    .sort((a, b) => new Date(b.startsAtISO).getTime() - new Date(a.startsAtISO).getTime());

  // فقط داده‌های لازم را پاس می‌دهیم (سریالایز امن)
  return <ClientBookingsClient my={my as any} therapists={therapists as any} />;
}