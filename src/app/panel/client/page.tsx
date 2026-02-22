import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StatCard from "@/components/panel/StatCard";
import Link from "next/link";
import { bookings, therapists } from "@/data/mockDb";

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";

  const my = bookings.filter((b) => b.clientEmail === email);

  const upcoming = my.filter((b) => b.status === "confirmed" || b.status === "pending");
  const history = my.filter((b) => b.status === "done" || b.status === "canceled");

  const pendingCount = my.filter((b) => b.status === "pending").length;
  const confirmedCount = my.filter((b) => b.status === "confirmed").length;

  const latest = my
    .slice()
    .sort((a, b) => new Date(b.startsAtISO).getTime() - new Date(a.startsAtISO).getTime())[0];

  const latestTherapist =
    latest ? therapists.find((t) => t.id === latest.therapistId) : undefined;

  return (
    <>
      <div className="text-3xl font-bold">پنل مراجع</div>
      <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
        مشاهده جلسات رزرو شده، وضعیت تایید، تاریخچه جلسات، تکالیف و یادداشت‌ها (فعلاً بدون دیتابیس).
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StatCard label="جلسات رزرو شده (آینده)" value={upcoming.length} />
        <StatCard label="در انتظار تایید" value={pendingCount} />
        <StatCard label="تایید شده" value={confirmedCount} />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <StatCard label="تاریخچه جلسات" value={history.length} />
        <StatCard
          label="درمانگر آخر"
          value={latestTherapist ? latestTherapist.name : "—"}
        />
        <StatCard
          label="وضعیت پرسشنامه"
          value={my.length ? "در انتظار / تکمیل (Mock)" : "—"}
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Link
          href="/panel/client/bookings"
          className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4 text-sm font-bold hover:bg-white"
        >
          رفتن به جلسات + تکالیف + یادداشت‌ها
        </Link>

        <Link
          href="/panel/client/intake"
          className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4 text-sm font-bold hover:bg-white"
        >
          رفتن به پرسشنامه جلسه اول (Intake)
        </Link>
      </div>
    </>
  );
}
