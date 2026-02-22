// src/app/panel/admin/page.tsx

import {
  THERAPIST_ACCOUNTS,
  getTherapistClientListForEmail,
  getBookingsForTherapistEmail,
} from "@/data/mockDb";

export default function AdminPanel() {
  // تعداد درمانگرها
  const therapistsCount = Array.isArray(THERAPIST_ACCOUNTS)
    ? THERAPIST_ACCOUNTS.length
    : 0;

  // محاسبه کل مراجعین و رزروها
  let totalClients = 0;
  let totalBookings = 0;
  let pendingBookings = 0;

  if (Array.isArray(THERAPIST_ACCOUNTS)) {
    for (const t of THERAPIST_ACCOUNTS) {
      const clients = getTherapistClientListForEmail(t.email) ?? [];
      totalClients += clients.length;

      const bookings = getBookingsForTherapistEmail(t.email) ?? [];
      totalBookings += bookings.length;

      pendingBookings += bookings.filter(
        (b: any) => String(b.status).toLowerCase() === "pending"
      ).length;
    }
  }

  return (
    <div>
      <div className="text-2xl font-bold">داشبورد ادمین</div>
      <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
        نمای کلی وضعیت کلینیک (بر اساس Mock Data)
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard title="تعداد درمانگرها" value={therapistsCount} />
        <StatCard title="تعداد کل مراجعین" value={totalClients} />
        <StatCard title="تعداد کل رزروها" value={totalBookings} />
        <StatCard title="رزروهای در انتظار" value={pendingBookings} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="text-xs font-bold text-emerald-950/60">
        {title}
      </div>
      <div className="mt-2 text-3xl font-black text-emerald-950">
        {value}
      </div>
    </div>
  );
}