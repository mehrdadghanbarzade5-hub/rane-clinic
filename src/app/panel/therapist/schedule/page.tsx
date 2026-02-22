"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

import { getTherapistAccountByEmail, getBookingsForTherapistEmail } from "@/data/mockDb";

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
}

function badge(status: string) {
  // نگاشت وضعیت‌های Booking به همان استایل قبلی
  if (status === "pending" || status === "confirmed")
    return "bg-emerald-500/15 text-emerald-950/70 border-emerald-500/20";
  if (status === "done")
    return "bg-emerald-900/10 text-emerald-950/60 border-emerald-900/10";
  return "bg-white/70 text-emerald-950/50 border-emerald-900/10";
}

function statusLabel(status: string) {
  if (status === "pending") return "در انتظار";
  if (status === "confirmed") return "تایید شده";
  if (status === "done") return "انجام شده";
  if (status === "canceled" || status === "cancelled") return "لغو شده";
  return status;
}

function getClientNameFromEmail(email: string) {
  const safe = String(email || "");
  if (!safe.includes("@")) return "مراجع";
  const base = safe.split("@")[0] || "مراجع";
  return base;
}

function normalizeText(x: string) {
  return String(x || "").trim().toLowerCase();
}

export default function TherapistSchedulePage() {
  const { data: session, status } = useSession();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "done" | "canceled"
  >("all");

  const email = useMemo(() => {
    return typeof (session?.user as any)?.email === "string"
      ? String((session?.user as any).email)
      : "";
  }, [session]);

  const therapistAccount = useMemo(() => {
    if (!email) return null;
    return getTherapistAccountByEmail(email);
  }, [email]);

  const scopedBookings = useMemo(() => {
    if (!therapistAccount) return [];
    return getBookingsForTherapistEmail(therapistAccount.email);
  }, [therapistAccount]);

  const scheduleItems = useMemo(() => {
    return scopedBookings.map((b) => {
      const clientId = b.clientId ?? `c-${b.id}`; // سازگار با صفحه clients/[id]
      const clientName = getClientNameFromEmail(b.clientEmail);
      return {
        id: b.id,
        clientId,
        clientEmail: b.clientEmail,
        clientName,
        datetimeISO: b.startsAtISO,
        endsAtISO: b.endsAtISO,
        durationMin: Math.max(
          0,
          Math.round((+new Date(b.endsAtISO) - +new Date(b.startsAtISO)) / (1000 * 60))
        ),
        type: "online" as const, // فعلاً mock
        status: b.status as string,
      };
    });
  }, [scopedBookings]);

  const normalizedQuery = useMemo(() => normalizeText(query), [query]);

  const filtered = useMemo(() => {
    return scheduleItems.filter((x) => {
      const matchesQuery =
        !normalizedQuery ||
        normalizeText(x.clientName).includes(normalizedQuery) ||
        normalizeText(x.clientEmail || "").includes(normalizedQuery);

      const s = String(x.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "canceled"
            ? s === "canceled" || s === "cancelled"
            : s === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [scheduleItems, normalizedQuery, statusFilter]);

  const upcoming = useMemo(() => {
    return filtered
      .filter((x) => x.status === "pending" || x.status === "confirmed")
      .sort((a, b) => +new Date(a.datetimeISO) - +new Date(b.datetimeISO));
  }, [filtered]);

  const history = useMemo(() => {
    return filtered
      .filter((x) => !(x.status === "pending" || x.status === "confirmed"))
      .sort((a, b) => +new Date(b.datetimeISO) - +new Date(a.datetimeISO));
  }, [filtered]);

  const counts = useMemo(() => {
    const all = scheduleItems.length;
    const up = scheduleItems.filter((x) => x.status === "pending" || x.status === "confirmed").length;
    const done = scheduleItems.filter((x) => x.status === "done").length;
    const canc = scheduleItems.filter((x) => x.status === "canceled" || x.status === "cancelled").length;
    return { all, up, done, canc };
  }, [scheduleItems]);

  if (status === "loading") {
    return (
      <>
        <div className="text-2xl font-bold">زمان‌بندی</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          در حال بارگذاری...
        </div>
      </>
    );
  }

  if (!session?.user) {
    return (
      <>
        <div className="text-2xl font-bold">زمان‌بندی</div>
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

  if (!therapistAccount) {
    return (
      <>
        <div className="text-2xl font-bold">زمان‌بندی</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          این حساب درمانگر نمونه اولیه نیست و فعلاً زمان‌بندی اختصاصی برای آن فعال نشده است.
        </div>

        <div className="mt-6">
          <Link
            href="/panel/therapist"
            className="rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-4 text-sm font-bold text-emerald-950 hover:bg-white/90"
          >
            برگشت به داشبورد
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-2xl font-bold">زمان‌بندی</div>

      {/* ✅ توضیح زیر عنوان صفحه */}
      <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
        برنامه جلسات مربوط به{" "}
        <span className="text-emerald-950/80">{therapistAccount.displayName}</span> (فعلاً Mock).
        <br />
        از جستجو و فیلتر پایین برای پیدا کردن سریع جلسه‌ها استفاده کنید.
      </div>

      {/* ✅ نوار ابزار: جستجو + فیلتر */}
      <div className="mt-5 rounded-[22px] border border-emerald-900/10 bg-white/70 p-4">
        <div className="grid gap-3 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <div className="text-xs font-bold text-emerald-950/60">جستجو</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-2 w-full rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-xs font-bold outline-none"
              placeholder="نام/ایمیل مراجع…"
            />
          </div>

          <div className="md:col-span-4">
            <div className="text-xs font-bold text-emerald-950/60">فیلتر وضعیت</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="mt-2 w-full rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending">در انتظار</option>
              <option value="confirmed">تایید شده</option>
              <option value="done">انجام شده</option>
              <option value="canceled">لغو شده</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-bold text-emerald-950/60">آمار</div>
            <div className="mt-2 rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-[11px] font-bold text-emerald-950/60 leading-6">
              کل: {counts.all}
              <br />
              پیش‌رو: {counts.up}
            </div>
          </div>
        </div>

        <div className="mt-3 text-[11px] font-bold text-emerald-950/45 leading-6">
          نکته: داده‌ها در نسخه فعلی Mock هستند و صرفاً برای تست UI/UX استفاده می‌شوند.
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-bold">جلسات پیش رو</div>

          {/* ✅ توضیح کوتاه زیر باکس */}
          <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">
            جلساتی که وضعیت آن‌ها «در انتظار» یا «تایید شده» است، اینجا نمایش داده می‌شود.
          </div>

          <div className="mt-4 grid gap-2">
            {upcoming.map((s) => (
              <div
                key={s.id}
                className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold">
                    {s.clientName} — {fmt(s.datetimeISO)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "rounded-[999px] border px-3 py-1 text-xs font-bold",
                        badge(s.status),
                      ].join(" ")}
                    >
                      {statusLabel(s.status)}
                    </span>

                    <Link
                      href={`/panel/therapist/clients/${s.clientId}`}
                      className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold text-emerald-950 hover:bg-white/90"
                    >
                      پرونده مراجع
                    </Link>
                  </div>
                </div>
                <div className="mt-2 text-xs font-bold text-emerald-950/55">
                  مدت: {s.durationMin} دقیقه — نوع: {s.type === "online" ? "آنلاین" : "حضوری"}
                </div>
              </div>
            ))}

            {upcoming.length === 0 ? (
              <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                جلسه‌ای با فیلترهای فعلی پیدا نشد.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-bold">تاریخچه</div>

          {/* ✅ توضیح کوتاه زیر باکس */}
          <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">
            جلسه‌های «انجام شده» یا «لغو شده» در این بخش قرار می‌گیرند و برای مرور سریع قابل جستجو هستند.
          </div>

          <div className="mt-4 grid gap-2">
            {history.map((s) => (
              <div
                key={s.id}
                className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold">
                    {s.clientName} — {fmt(s.datetimeISO)}
                  </div>
                  <span
                    className={[
                      "rounded-[999px] border px-3 py-1 text-xs font-bold",
                      badge(s.status),
                    ].join(" ")}
                  >
                    {statusLabel(s.status)}
                  </span>
                </div>

                <div className="mt-2">
                  <Link
                    href={`/panel/therapist/clients/${s.clientId}`}
                    className="inline-flex rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold text-emerald-950 hover:bg-white/90"
                  >
                    مشاهده پرونده
                  </Link>
                </div>
              </div>
            ))}

            {history.length === 0 ? (
              <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                موردی با فیلترهای فعلی وجود ندارد.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
