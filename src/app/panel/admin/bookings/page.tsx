"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  THERAPIST_ACCOUNTS,
  getBookingsForTherapistEmail,
  type Booking,
} from "@/data/mockDb";

import {
  getDisabledTherapists,
  subscribeDisabledTherapists,
  ensureDisabledTherapistsSemantic,
} from "@/lib/adminState";

type TherapistAccount = {
  therapistId: string;
  email: string;
  displayName: string;
};

type BookingRow = {
  id: string;
  startsAtISO: string;
  status: string;
  therapistId: string;
  therapistName: string;
  therapistEmail: string;
  clientLabel: string;
  therapistIsDisabled: boolean;
};

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function faDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function badgeClass(status: string) {
  const base = "rounded-[999px] border px-3 py-1 text-[11px] font-bold";
  const s = norm(status);
  if (s === "confirmed" || s === "accepted") {
    return `${base} border-emerald-500/20 bg-emerald-500/12 text-emerald-950/80`;
  }
  if (s === "pending") {
    return `${base} border-amber-500/20 bg-amber-500/10 text-emerald-950/75`;
  }
  if (s === "done" || s === "completed") {
    return `${base} border-emerald-900/10 bg-emerald-950/5 text-emerald-950/70`;
  }
  if (s === "cancelled" || s === "canceled") {
    return `${base} border-rose-500/15 bg-rose-500/10 text-emerald-950/70`;
  }
  return `${base} border-emerald-900/10 bg-white/70 text-emerald-950/65`;
}

function toneBadge(disabled: boolean) {
  const base = "rounded-[999px] border px-3 py-1 text-[11px] font-bold";
  return disabled
    ? `${base} border-emerald-900/10 bg-emerald-950/5 text-emerald-950/60`
    : `${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-950/75`;
}

type OverridesMap = Record<string, { status?: string }>;
const OVERRIDE_KEY = "rane_admin_booking_overrides_v1";

export default function AdminBookingsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const therapists = useMemo(() => safeArray<TherapistAccount>(THERAPIST_ACCOUNTS), []);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "done" | "cancelled"
  >("all");
  const [therapistFilter, setTherapistFilter] = useState<string>("all");

  const [overrides, setOverrides] = useState<OverridesMap>({});

  // ✅ disabled therapists sync (برای اینکه "غیرفعال" درست و همگام نمایش داده شود)
  const [disabledEmails, setDisabledEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!mounted) return;

    const knownEmails = (Array.isArray(THERAPIST_ACCOUNTS) ? THERAPIST_ACCOUNTS : [])
      .map((a: any) => a?.email)
      .filter(Boolean) as string[];

    const fixed = ensureDisabledTherapistsSemantic(knownEmails);
    setDisabledEmails(Array.isArray(fixed) ? fixed.map((e) => norm(e)) : []);

    const unsub = subscribeDisabledTherapists(() => {
      const cur = getDisabledTherapists();
      setDisabledEmails(Array.isArray(cur) ? cur.map((e) => norm(e)) : []);
    });

    return () => unsub();
  }, [mounted]);

  // load overrides
  useEffect(() => {
    if (!mounted) return;
    const fromLS = readLS<OverridesMap>(OVERRIDE_KEY);
    setOverrides(fromLS && typeof fromLS === "object" ? fromLS : {});
  }, [mounted]);

  // persist overrides
  useEffect(() => {
    if (!mounted) return;
    writeLS(OVERRIDE_KEY, overrides);
  }, [mounted, overrides]);

  const therapistMap = useMemo(() => {
    const m = new Map<string, TherapistAccount>();
    for (const t of therapists) m.set(String(t.therapistId), t);
    return m;
  }, [therapists]);

  const rows = useMemo((): BookingRow[] => {
    const all: BookingRow[] = [];

    for (const t of therapists) {
      const list = safeArray<Booking>(getBookingsForTherapistEmail(t.email));
      const tIsDisabled = disabledEmails.includes(norm(t.email));

      for (const b of list) {
        const id = String((b as any)?.id ?? "");
        if (!id) continue;

        const rawStatus = String((b as any)?.status ?? "pending");
        const overridden = overrides[id]?.status;
        const status = overridden ? String(overridden) : rawStatus;

        const startsAtISO = String((b as any)?.startsAtISO ?? "");
        const clientId = String((b as any)?.clientId ?? "");
        const clientName = String((b as any)?.clientName ?? "");

        const clientLabel =
          clientName?.trim()
            ? clientName
            : clientId?.trim()
              ? `مراجع: ${clientId}`
              : `مراجع: (نمونه)`;

        all.push({
          id,
          startsAtISO,
          status,
          therapistId: String(t.therapistId),
          therapistName: String(t.displayName ?? "—"),
          therapistEmail: String(t.email ?? "—"),
          clientLabel,
          therapistIsDisabled: tIsDisabled,
        });
      }
    }

    return all
      .slice()
      .sort((a, b) => (Date.parse(b.startsAtISO) || 0) - (Date.parse(a.startsAtISO) || 0));
  }, [therapists, overrides, disabledEmails]);

  const therapistsForFilter = useMemo(() => {
    const uniq = new Map<string, { id: string; name: string }>();
    for (const t of therapists) {
      const id = String(t.therapistId);
      if (!uniq.has(id)) uniq.set(id, { id, name: String(t.displayName ?? id) });
    }
    return Array.from(uniq.values());
  }, [therapists]);

  const filtered = useMemo(() => {
    const query = norm(q);

    return rows.filter((r) => {
      if (statusFilter !== "all") {
        const s = norm(r.status);
        if (statusFilter === "pending" && s !== "pending") return false;
        if (statusFilter === "confirmed" && !(s === "confirmed" || s === "accepted")) return false;
        if (statusFilter === "done" && !(s === "done" || s === "completed")) return false;
        if (statusFilter === "cancelled" && !(s === "cancelled" || s === "canceled")) return false;
      }

      if (therapistFilter !== "all" && String(r.therapistId) !== therapistFilter) return false;

      if (!query) return true;
      const hay = norm(
        `${r.id} ${r.therapistName} ${r.therapistEmail} ${r.status} ${r.clientLabel}`
      );
      return hay.includes(query);
    });
  }, [rows, q, statusFilter, therapistFilter]);

  const counts = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => norm(r.status) === "pending").length;
    const confirmed = rows.filter((r) => ["confirmed", "accepted"].includes(norm(r.status))).length;
    const done = rows.filter((r) => ["done", "completed"].includes(norm(r.status))).length;
    const cancelled = rows.filter((r) => ["cancelled", "canceled"].includes(norm(r.status))).length;
    return { total, pending, confirmed, done, cancelled };
  }, [rows]);

  const setBookingStatus = (bookingId: string, status: string) => {
    setOverrides((prev) => ({
      ...prev,
      [bookingId]: { ...(prev[bookingId] ?? {}), status },
    }));
  };

  const clearOverride = (bookingId: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[bookingId];
      return next;
    });
  };

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl font-bold">رزروها</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            مدیریت رزروها (فعلاً Mock) + امکان تغییر وضعیت رزرو با{" "}
            <span className="font-black">Override</span> در localStorage.
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

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-5">
        {[
          { t: "کل رزروها", v: counts.total },
          { t: "در انتظار", v: counts.pending },
          { t: "تأیید شده", v: counts.confirmed },
          { t: "انجام شده", v: counts.done },
          { t: "لغو شده", v: counts.cancelled },
        ].map((x) => (
          <div
            key={x.t}
            className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            <div className="text-xs font-bold text-emerald-950/55">{x.t}</div>
            <div className="mt-1 text-xl font-bold">{x.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-sm font-bold">جستجو و فیلتر</div>

        <div className="mt-2 grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold outline-none"
            placeholder="جستجو: نام درمانگر، ایمیل، وضعیت، شناسه رزرو..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-3 py-3 text-xs font-bold outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="confirmed">تأیید شده</option>
            <option value="done">انجام شده</option>
            <option value="cancelled">لغو شده</option>
          </select>

          <select
            value={therapistFilter}
            onChange={(e) => setTherapistFilter(e.target.value)}
            className="w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-3 py-3 text-xs font-bold outline-none"
          >
            <option value="all">همه درمانگرها</option>
            {therapistsForFilter.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] font-bold text-emerald-950/45 leading-6">
          نکته: تغییر وضعیت‌ها فعلاً فقط به‌صورت <span className="font-black">Override</span> ذخیره می‌شود (localStorage)
          تا بعداً به دیتابیس واقعی وصل کنیم.
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-sm font-bold">لیست رزروها</div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-[18px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
            رزروی مطابق فیلترها پیدا نشد.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {filtered.map((r) => {
              const therapist = therapistMap.get(r.therapistId);
              const therapistLabel = therapist ? therapist.displayName : r.therapistName;

              return (
                <div
                  key={r.id}
                  className="rounded-[18px] border border-emerald-900/10 bg-white/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-[240px]">
                      <div className="text-sm font-bold">
                        {faDateTime(r.startsAtISO || "")}{" "}
                        <span className="text-emerald-950/50 text-xs font-bold">•</span>{" "}
                        <span className="text-xs font-bold text-emerald-950/70">{r.clientLabel}</span>
                      </div>

                      <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">
                        درمانگر: <span className="text-emerald-950/75">{therapistLabel}</span>
                        <span className="mx-2 text-emerald-950/30">|</span>
                        <span className="text-emerald-950/60">{r.therapistEmail}</span>
                        <span className="mx-2 text-emerald-950/30">|</span>
                        شناسه رزرو: <span className="text-emerald-950/70">{r.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={toneBadge(r.therapistIsDisabled)}>
                        {r.therapistIsDisabled ? "درمانگر غیرفعال" : "درمانگر فعال"}
                      </span>

                      <span className={badgeClass(r.status)}>{r.status}</span>

                      <select
                        value={norm(r.status)}
                        onChange={(e) => setBookingStatus(r.id, e.target.value)}
                        className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-[11px] font-bold outline-none"
                        title="تغییر وضعیت (Override)"
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="accepted">accepted</option>
                        <option value="done">done</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                        <option value="canceled">canceled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => clearOverride(r.id)}
                        className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-[11px] font-bold text-emerald-950/70 hover:bg-white/90"
                        title="حذف Override"
                      >
                        ریست
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}