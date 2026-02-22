"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { getTherapistAccountByEmail, getBookingsForTherapistEmail } from "@/data/mockDb";

function isWithinNextDays(iso: string, days: number) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const end = now + days * 24 * 60 * 60 * 1000;
  return t >= now && t <= end;
}

export default function TherapistDashboardPage() {
  const { data: session, status } = useSession();

  const email = useMemo(() => {
    return typeof (session?.user as any)?.email === "string" ? String((session?.user as any).email) : "";
  }, [session]);

  const therapistAccount = useMemo(() => {
    if (!email) return null;
    return getTherapistAccountByEmail(email);
  }, [email]);

  const scopedBookings = useMemo(() => {
    if (!therapistAccount) return [];
    return getBookingsForTherapistEmail(therapistAccount.email);
  }, [therapistAccount]);

  // شمارنده‌ها
  const sessionsThisWeek = useMemo(() => {
    return scopedBookings.filter(
      (b) => (b.status === "pending" || b.status === "confirmed") && isWithinNextDays(b.startsAtISO, 7)
    ).length;
  }, [scopedBookings]);

  const activeClients = useMemo(() => {
    // فعال = هر مراجع که حداقل یک رزرو غیر-canceled داشته باشد
    const set = new Set<string>();
    for (const b of scopedBookings) {
      if (b.status === "canceled") continue;
      const key = b.clientId ?? b.clientEmail;
      if (key) set.add(key);
    }
    return set.size;
  }, [scopedBookings]);

  // فعلاً پیام‌ها mock
  const newMessages = 0;

  // وضعیت‌ها
  if (status === "loading") {
    return (
      <>
        <div className="text-2xl font-bold">پنل درمانگر</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          در حال بارگذاری...
        </div>
      </>
    );
  }

  if (!session?.user) {
    return (
      <>
        <div className="text-2xl font-bold">پنل درمانگر</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          برای مشاهده این بخش باید وارد حساب درمانگر شوید.
        </div>

        <div className="mt-6">
          <Link
            href="/auth/signin"
            className="rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-4 text-sm font-bold text-emerald-950 hover:bg-white/90"
          >
            رفتن به صفحه ورود
          </Link>
        </div>
      </>
    );
  }

  // فقط دو درمانگر نمونه اولیه
  if (!therapistAccount) {
    return (
      <>
        <div className="text-2xl font-bold">پنل درمانگر</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          این حساب درمانگر نمونه اولیه نیست و فعلاً پنل مستقل برای آن فعال نشده است.
        </div>

        <div className="mt-6 rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-4">
          <div className="text-xs font-bold text-emerald-950/55 leading-7">
            درمانگرهای فعال در نمونه اولیه:
            <br />• دکتر ریحانه افشار (reyhane.afshar@rane.com)
            <br />• دکتر امیرحسین نوحه‌خوان (amir.noohakhan@rane.com)
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/auth/signin"
            className="rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-4 text-sm font-bold text-emerald-950 hover:bg-white/90"
          >
            ورود با حساب دیگر
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-2xl font-bold">پنل درمانگر</div>
      <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
        برنامه جلسات، مراجعین، و به‌روزرسانی پروفایل (فعلاً Mock) —{" "}
        <span className="text-emerald-950/80">{therapistAccount.displayName}</span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4">
          <div className="text-xs font-bold text-emerald-950/55">جلسات این هفته</div>
          <div className="mt-1 text-[11px] font-bold text-emerald-950/45">
            تعداد جلسات برنامه‌ریزی‌شده در ۷ روز آینده.
          </div>
          <div className="mt-2 text-2xl font-bold">{sessionsThisWeek}</div>
        </div>

        <div className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4">
          <div className="text-xs font-bold text-emerald-950/55">مراجع فعال</div>
          <div className="mt-1 text-[11px] font-bold text-emerald-950/45">
            تعداد مراجعینی که پرونده‌شان در حال پیگیری است.
          </div>
          <div className="mt-2 text-2xl font-bold">{activeClients}</div>
        </div>

        <div className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4">
          <div className="text-xs font-bold text-emerald-950/55">پیام‌های جدید</div>
          <div className="mt-1 text-[11px] font-bold text-emerald-950/45">
            پیام‌های خوانده‌نشده یا اعلان‌های تازه.
          </div>
          <div className="mt-2 text-2xl font-bold">{newMessages}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Link
          href="/panel/therapist/clients"
          className="rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-4 text-sm font-bold text-emerald-950 hover:bg-white/90"
        >
          رفتن به «مراجعین»
        </Link>

        <Link
          href="/panel/therapist/schedule"
          className="rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-4 text-sm font-bold text-emerald-950 hover:bg-white/90"
        >
          رفتن به «زمان‌بندی»
        </Link>
      </div>
    </>
  );
}
