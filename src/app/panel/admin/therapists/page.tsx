// src/app/panel/admin/therapists/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  therapists,
  THERAPIST_ACCOUNTS,
  getTherapistClientListForEmail,
  getBookingsForTherapistEmail,
  type Therapist,
  type TherapistAccount,
} from "@/data/mockDb";

import {
  getDisabledTherapists,
  toggleTherapistDisabled,
  subscribeDisabledTherapists,
  ensureDisabledTherapistsSemantic,
} from "@/lib/adminState";

function normEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

function faDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

function badgeTone(kind: "ok" | "warn" | "muted") {
  const base = "rounded-[999px] border px-3 py-1 text-[11px] font-bold";
  if (kind === "ok") return `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-950/75`;
  if (kind === "warn") return `${base} border-emerald-900/10 bg-white/70 text-emerald-950/60`;
  return `${base} border-emerald-900/10 bg-emerald-950/5 text-emerald-950/60`;
}

type AdminTherapistRow = {
  id: string;
  name: string;
  email?: string;
  specialties: string[];
  prototypeAccount?: TherapistAccount;

  clientsCount: number;
  bookingsCount: number;
  pendingBookingsCount: number;

  isDisabled: boolean;
};

export default function AdminTherapistsPage() {
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState("");
  const [disabledEmails, setDisabledEmails] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  // init + semantic-fix + subscribe
  useEffect(() => {
    if (!mounted) return;

    const knownEmails = [
      ...(Array.isArray(THERAPIST_ACCOUNTS) ? THERAPIST_ACCOUNTS.map((a: any) => a?.email) : []),
      ...(Array.isArray(therapists) ? (therapists as any[]).map((t) => t?.email) : []),
    ].filter(Boolean) as string[];

    // اگر قبلاً برعکس ذخیره شده باشد، همینجا اصلاح می‌کنیم
    const fixed = ensureDisabledTherapistsSemantic(knownEmails);
    setDisabledEmails(Array.isArray(fixed) ? fixed.map(normEmail) : []);

    // sync بین صفحات
    const unsub = subscribeDisabledTherapists(() => {
      const cur = getDisabledTherapists();
      setDisabledEmails(Array.isArray(cur) ? cur.map(normEmail) : []);
    });

    return () => unsub();
  }, [mounted]);

  const accountMap = useMemo(() => {
    const m = new Map<string, TherapistAccount>();
    for (const a of Array.isArray(THERAPIST_ACCOUNTS) ? THERAPIST_ACCOUNTS : []) {
      m.set(normEmail((a as any).email), a as TherapistAccount);
    }
    return m;
  }, []);

  const rows = useMemo((): AdminTherapistRow[] => {
    const list: Therapist[] = Array.isArray(therapists) ? (therapists as Therapist[]) : [];

    return list.map((t) => {
      const email = t.email?.trim() ? t.email : undefined;
      const acc = email ? accountMap.get(normEmail(email)) : undefined;

      const clients = email ? getTherapistClientListForEmail(email) ?? [] : [];
      const bookings = email ? getBookingsForTherapistEmail(email) ?? [] : [];

      const pendingBookingsCount = bookings.filter((b: any) => {
        const s = String(b.status ?? "").toLowerCase();
        return s === "pending";
      }).length;

      const isDisabled = email ? disabledEmails.includes(normEmail(email)) : false;

      return {
        id: t.id,
        name: t.name,
        email,
        specialties: Array.isArray(t.specialties) ? (t.specialties as string[]) : [],
        prototypeAccount: acc,
        clientsCount: clients.length,
        bookingsCount: bookings.length,
        pendingBookingsCount,
        isDisabled,
      };
    });
  }, [accountMap, disabledEmails]);

  const filtered = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((r) => {
      const hay = [
        r.name,
        r.email || "",
        r.specialties.join(" "),
        r.prototypeAccount?.displayName || "",
        r.prototypeAccount?.therapistId || "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [rows, q]);

  const totals = useMemo(() => {
    const all = rows;
    const enabled = all.filter((x) => !x.isDisabled).length;
    const disabled = all.filter((x) => x.isDisabled).length;
    const proto = all.filter((x) => Boolean(x.prototypeAccount)).length;
    return { all: all.length, enabled, disabled, proto };
  }, [rows]);

  const onToggle = (email?: string) => {
    if (!email) return;
    const next = toggleTherapistDisabled(email);
    setDisabledEmails(Array.isArray(next) ? next.map(normEmail) : []);
  };

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl font-bold">درمانگرها</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            مدیریت لیست درمانگرها (فعلاً Mock). وضعیت فعال/غیرفعال به‌صورت تستی در{" "}
            <span className="font-black">localStorage</span> ذخیره می‌شود.
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/panel/admin"
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white/90"
          >
            برگشت
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { t: "کل درمانگرها", v: String(totals.all) },
          { t: "فعال", v: String(totals.enabled) },
          { t: "غیرفعال", v: String(totals.disabled) },
          { t: "حساب‌های نمونه اولیه", v: String(totals.proto) },
        ].map((x) => (
          <div key={x.t} className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
            <div className="text-xs font-bold text-emerald-950/55">{x.t}</div>
            <div className="mt-1 text-xl font-bold">{x.v}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-sm font-bold">جستجو</div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold outline-none"
            placeholder="نام، ایمیل، تخصص، therapistId..."
          />
          <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/55">
            نتیجه: {filtered.length}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[240px]">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-bold">{r.name}</div>

                  {/* ✅ اینجا دیگر برعکس نمی‌شود */}
                  <span className={r.isDisabled ? badgeTone("muted") : badgeTone("ok")}>
                    {r.isDisabled ? "غیرفعال (تستی)" : "فعال"}
                  </span>

                  {r.prototypeAccount ? (
                    <span className={badgeTone("ok")}>
                      نمونه اولیه • {r.prototypeAccount.therapistId}
                    </span>
                  ) : (
                    <span className={badgeTone("warn")}>خارج از نمونه اولیه</span>
                  )}
                </div>

                <div className="mt-2 text-xs font-bold text-emerald-950/60">
                  ایمیل: <span className="text-emerald-950/80">{r.email || "—"}</span>
                  {r.prototypeAccount?.displayName ? (
                    <>
                      {" "}
                      • نام نمایشی:{" "}
                      <span className="text-emerald-950/80">{r.prototypeAccount.displayName}</span>
                    </>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.specialties.length ? r.specialties : ["—"]).map((s, idx) => (
                    <span
                      key={`${r.id}-sp-${idx}`}
                      className="rounded-[999px] border border-emerald-900/10 bg-white/80 px-3 py-1 text-[11px] font-bold text-emerald-950/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold">
                  مراجعین: <span className="text-emerald-950/70">{r.clientsCount}</span>
                </div>
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold">
                  رزروها: <span className="text-emerald-950/70">{r.bookingsCount}</span>
                </div>
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold">
                  Pending: <span className="text-emerald-950/70">{r.pendingBookingsCount}</span>
                </div>

                {/* ✅ متن دکمه هم درست و مطابق وضعیت */}
                <button
                  type="button"
                  onClick={() => onToggle(r.email)}
                  disabled={!r.email}
                  className={[
                    "rounded-[16px] border px-4 py-3 text-xs font-bold transition",
                    !r.email
                      ? "cursor-not-allowed border-emerald-900/10 bg-white/60 text-emerald-950/40"
                      : r.isDisabled
                        ? "border-emerald-900/10 bg-white/80 text-emerald-950/70 hover:bg-white/95"
                        : "border-rose-500/15 bg-rose-500/10 text-emerald-950/70 hover:bg-rose-500/15",
                  ].join(" ")}
                  title={!r.email ? "برای درمانگر بدون ایمیل قابل تغییر نیست" : "تغییر وضعیت (فقط تست)"}
                >
                  {r.isDisabled ? "فعال‌سازی" : "غیرفعال‌سازی"}
                </button>
              </div>
            </div>

            {/* ✅ جلوگیری از Hydration mismatch: فقط بعد از mount تاریخ را نشان می‌دهیم */}
            {r.email && mounted ? (
              <div className="mt-3 text-[11px] font-bold text-emerald-950/45 leading-6">
                نکته: شمارش‌ها از روی MockDB محاسبه می‌شود. آخرین به‌روزرسانی: {faDate(new Date().toISOString())}
              </div>
            ) : null}
          </div>
        ))}

        {filtered.length === 0 ? (
          <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 text-xs font-bold text-emerald-950/60">
            موردی پیدا نشد.
          </div>
        ) : null}
      </div>
    </div>
  );
}