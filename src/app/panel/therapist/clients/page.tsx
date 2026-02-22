"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import {
  getTherapistAccountByEmail,
  getTherapistClientListForEmail,
  getClientDetailsForTherapistEmail,
} from "@/data/mockDb";

type SessionLike = { status?: string };

function hasPriorSessionScoped(therapistEmail: string, clientId: string) {
  const details = getClientDetailsForTherapistEmail(therapistEmail, clientId);
  const sessions: SessionLike[] = Array.isArray(details?.sessions) ? details!.sessions : [];

  // اگر حتی یک جلسه "انجام شده" داشته باشد => با سابقه
  return sessions.some((s) => {
    const st = String(s?.status ?? "").trim();
    return st.includes("انجام") || st.toLowerCase() === "done";
  });
}

function toLabelFromISO(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

export default function TherapistClientsPage() {
  const { data: session, status } = useSession();

  const email = (session?.user as any)?.email ? String((session?.user as any).email) : "";
  const therapistAccount = email ? getTherapistAccountByEmail(email) : null;

  // اگر هنوز لود می‌شود
  if (status === "loading") {
    return (
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
        <div className="text-sm font-bold">در حال بارگذاری…</div>
        <div className="mt-2 text-xs font-bold text-emerald-950/55">
          لطفاً چند ثانیه صبر کنید.
        </div>
      </div>
    );
  }

  // اگر لاگین نیست
  if (!session?.user) {
    return (
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
        <div className="text-sm font-bold">دسترسی محدود</div>
        <div className="mt-2 text-xs font-bold text-emerald-950/55">
          برای مشاهده این صفحه باید وارد حساب درمانگر شوید.
        </div>
        <div className="mt-4">
          <Link
            href="/auth/signin"
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
          >
            رفتن به صفحه ورود
          </Link>
        </div>
      </div>
    );
  }

  // اگر درمانگرِ نمونه اولیه نیست (فقط ۲ درمانگر)
  if (!therapistAccount) {
    return (
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
        <div className="text-sm font-bold">این حساب درمانگر نمونه اولیه نیست</div>
        <div className="mt-2 text-xs font-bold text-emerald-950/55 leading-7">
          در این نسخه، پنل مستقل فقط برای این دو درمانگر فعال است:
          <br />
          • دکتر ریحانه افشار (reyhane.afshar@rane.com)
          <br />
          • دکتر امیرحسین نوحه‌خوان (amir.noohakhan@rane.com)
        </div>
        <div className="mt-4">
          <Link
            href="/panel/therapist"
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
          >
            برگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  // ✅ داده‌های جدا بر اساس ایمیل درمانگر
  const all = getTherapistClientListForEmail(therapistAccount.email);

  const newClients = all.filter((c) => !hasPriorSessionScoped(therapistAccount.email, c.id));
  const existingClients = all.filter((c) => hasPriorSessionScoped(therapistAccount.email, c.id));

  function renderClientCard(c: any) {
    // سازگاری با UI قبلی (name/phone/status/lastSession/nextSession/active)
    const view = {
      id: c.id,
      name: c.fullName,
      phone: "—",
      status: c.status === "active" ? "فعال" : "غیرفعال",
      active: c.status === "active",
      lastSession: toLabelFromISO(c.lastSessionAtISO),
      nextSession: toLabelFromISO(c.nextSessionAtISO),
    };

    return (
      <div
        key={view.id}
        className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold">{view.name}</div>
            <div className="mt-1 text-xs font-bold text-emerald-950/55">
              کد: {view.id} • تلفن: {view.phone}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={[
                "rounded-[14px] border px-3 py-2 text-xs font-bold",
                view.active
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-950/80"
                  : "border-emerald-900/10 bg-white/70 text-emerald-950/55",
              ].join(" ")}
            >
              {view.status}
            </div>

            <Link
              href={`/panel/therapist/clients/${view.id}`}
              className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold text-emerald-950 hover:bg-white/90"
            >
              جزئیات
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
            <div className="text-[11px] font-bold text-emerald-950/55">
              آخرین جلسه
            </div>
            <div className="mt-1 text-sm font-bold">{view.lastSession}</div>
          </div>

          <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
            <div className="text-[11px] font-bold text-emerald-950/55">
              جلسه بعدی
            </div>
            <div className="mt-1 text-sm font-bold">{view.nextSession}</div>
          </div>

          <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
            <div className="text-[11px] font-bold text-emerald-950/55">
              وضعیت پرونده
            </div>
            <div className="mt-1 text-sm font-bold">
              {view.active ? "در جریان" : "بسته شده"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold">مراجعین</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            پنل مستقل: نمایش مراجعین مربوط به{" "}
            <span className="text-emerald-950/80">{therapistAccount.displayName}</span> (فعلاً Mock).
          </div>
        </div>

        <Link
          href="/panel/therapist"
          className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
        >
          برگشت به داشبورد
        </Link>
      </div>

      {/* ✅ اول مراجعه */}
      <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold">اولین مراجعه</div>
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
        </div>
        <div className="mt-2 text-xs font-bold text-emerald-950/55">
          مراجعینی که هنوز جلسه «انجام‌شده» ندارند (اولین مراجعه/جلسه‌های اولیه).
        </div>

        <div className="mt-4 grid gap-3">
          {newClients.length === 0 ? (
            <div className="text-xs font-bold text-emerald-950/55">
              موردی وجود ندارد.
            </div>
          ) : (
            newClients.map(renderClientCard)
          )}
        </div>
      </div>

      {/* ✅ با سابقه */}
      <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold">مراجعین با سابقه</div>
          <div className="h-3 w-3 rounded-full bg-emerald-950/40" />
        </div>
        <div className="mt-2 text-xs font-bold text-emerald-950/55">
          مراجعینی که حداقل یک جلسه «انجام‌شده» دارند.
        </div>

        <div className="mt-4 grid gap-3">
          {existingClients.length === 0 ? (
            <div className="text-xs font-bold text-emerald-950/55">
              موردی وجود ندارد.
            </div>
          ) : (
            existingClients.map(renderClientCard)
          )}
        </div>
      </div>
    </>
  );
}
