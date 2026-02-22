"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  MOCK_REFERRALS,
  MOCK_THERAPISTS_MINI,
  MOCK_THERAPIST_CLIENTS_MINI,
} from "@/data/mockDb";
import StatusPill from "../StatusPill";

/**
 * ✅ کنترل داده‌های تست/Seed
 * - اگر false شود، فقط از localStorage می‌خوانیم (و دیگر seed انجام نمی‌دهیم).
 * - برای تست‌های UI/UX فعلاً بهتر است true بماند.
 */
const ENABLE_DUMMY_SEED = true;

/**
 * ✅ نسخه‌ی ذخیره‌سازی
 * اگر در آینده ساختار تغییر کند، نسخه را بالا ببرید تا با داده‌های قدیمی تداخل نکند.
 */
const LS_VERSION = "v2";

type ReferralStatus = "pending" | "accepted" | "declined" | "cancelled";

/**
 * نکته:
 * در mockDb ممکن است وضعیت‌هایی مثل "rejected" هم وجود داشته باشد.
 * ما آن را هنگام لود نرمال می‌کنیم تا UI نشکند.
 */
type ReferralStatusLoose = ReferralStatus | "rejected";

type Referral = {
  id: string;
  clientId: string;
  clientName: string;
  fromTherapistEmail: string;
  fromTherapistName: string;
  toTherapistEmail: string;
  toTherapistName: string;
  reason: string;
  status: ReferralStatus;
  createdAtISO: string;
  updatedAtISO: string;

  decisionNote?: string;
  decidedByEmail?: string;
  decidedAtISO?: string;
};

type MiniClient = {
  id: string;
  fullName?: string;
  therapistEmail?: string;
};

type MiniTherapist = {
  email: string;
  name?: string;
};

function nowISO() {
  return new Date().toISOString();
}

function safeArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
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

function removeLS(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function shortISO(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

function normalizeStatus(s: unknown): ReferralStatus {
  const v = String(s || "").toLowerCase() as ReferralStatusLoose;
  if (v === "rejected") return "declined";
  if (v === "pending" || v === "accepted" || v === "declined" || v === "cancelled") return v;
  return "pending";
}

function normalizeReferral(raw: any): Referral | null {
  if (!raw || typeof raw !== "object") return null;

  const id = typeof raw.id === "string" ? raw.id : `ref_${Date.now()}`;
  const clientId = typeof raw.clientId === "string" ? raw.clientId : "—";
  const clientName = typeof raw.clientName === "string" ? raw.clientName : "—";
  const fromTherapistEmail = typeof raw.fromTherapistEmail === "string" ? raw.fromTherapistEmail : "—";
  const fromTherapistName = typeof raw.fromTherapistName === "string" ? raw.fromTherapistName : fromTherapistEmail;
  const toTherapistEmail = typeof raw.toTherapistEmail === "string" ? raw.toTherapistEmail : "—";
  const toTherapistName = typeof raw.toTherapistName === "string" ? raw.toTherapistName : toTherapistEmail;
  const reason = typeof raw.reason === "string" ? raw.reason : "—";

  const createdAtISO = typeof raw.createdAtISO === "string" ? raw.createdAtISO : nowISO();
  const updatedAtISO = typeof raw.updatedAtISO === "string" ? raw.updatedAtISO : createdAtISO;

  const decisionNote = typeof raw.decisionNote === "string" ? raw.decisionNote : undefined;
  const decidedByEmail = typeof raw.decidedByEmail === "string" ? raw.decidedByEmail : undefined;
  const decidedAtISO = typeof raw.decidedAtISO === "string" ? raw.decidedAtISO : undefined;

  return {
    id,
    clientId,
    clientName,
    fromTherapistEmail,
    fromTherapistName,
    toTherapistEmail,
    toTherapistName,
    reason,
    status: normalizeStatus(raw.status),
    createdAtISO,
    updatedAtISO,
    decisionNote,
    decidedByEmail,
    decidedAtISO,
  };
}

function pickOtherTherapist(therapistEmail: string, therapists: MiniTherapist[]): MiniTherapist {
  const other =
    therapists.find((t) => t.email && t.email !== therapistEmail) ??
    therapists[0] ??
    { email: "therapist2@rane.com", name: "درمانگر" };
  return other;
}

function getTherapistName(email: string, therapists: MiniTherapist[]): string {
  const t = therapists.find((x) => x.email === email);
  return t?.name || email;
}

function seedExtraIncomingReferrals(therapistEmail: string, base: Referral[]): Referral[] {
  const therapists = safeArray<MiniTherapist>(MOCK_THERAPISTS_MINI);
  const clients = safeArray<MiniClient>(MOCK_THERAPIST_CLIENTS_MINI);

  const toName = getTherapistName(therapistEmail, therapists);
  const from = pickOtherTherapist(therapistEmail, therapists);

  const clientPool = clients.length
    ? clients
    : [
        { id: "c_1", fullName: "مراجع نمونه ۱" },
        { id: "c_2", fullName: "مراجع نمونه ۲" },
        { id: "c_3", fullName: "مراجع نمونه ۳" },
        { id: "c_4", fullName: "مراجع نمونه ۴" },
      ];

  const reasons = [
    "نیاز به ارزیابی تخصصی‌تر و تصمیم‌گیری درمانی مشترک.",
    "هماهنگی برای جلسات آنلاین به دلیل محدودیت زمانی مراجع.",
    "ارجاع برای بررسی همزمان اضطراب و مشکلات خواب.",
    "مراجعه اولیه و نیاز به تعیین مسیر درمان و برنامه جلسات.",
    "ارجاع جهت بررسی و تکمیل پرونده و ثبت یادداشت بالینی.",
    "درخواست مراجع برای تغییر درمانگر و ادامه مسیر درمان.",
    "ارجاع برای هم‌فکری درباره پروتکل درمان و پیگیری کوتاه‌مدت.",
    "نیاز به ارجاع به درمانگر با رویکرد تخصصی‌تر در این موضوع.",
  ];

  const mk = (idx: number): Referral => {
    const c = clientPool[idx % clientPool.length];
    const iso = new Date(Date.now() - (idx + 1) * 86400000).toISOString();
    return {
      id: `ref_seed_in_${therapistEmail}_${idx}_${Date.now()}`,
      clientId: c.id,
      clientName: c.fullName || c.id,
      fromTherapistEmail: from.email,
      fromTherapistName: from.name || from.email,
      toTherapistEmail: therapistEmail,
      toTherapistName: toName,
      reason: reasons[idx % reasons.length],
      status: "pending",
      createdAtISO: iso,
      updatedAtISO: iso,
    };
  };

  const extras: Referral[] = [mk(0), mk(1), mk(2), mk(3), mk(4), mk(5), mk(6), mk(7)];

  const key = (r: Referral) => `${r.clientId}|${r.fromTherapistEmail}|${r.toTherapistEmail}|${r.reason}`;
  const existing = new Set(base.map(key));
  const dedupedExtras = extras.filter((r) => !existing.has(key(r)));

  return [...dedupedExtras, ...base];
}

function SmallGuideBox({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
      <div className="text-xs font-bold text-emerald-950/75">{title}</div>
      <div className="mt-2 grid gap-1 text-[11px] font-bold text-emerald-950/55 leading-6">
        {lines.map((x, i) => (
          <div key={`${title}-${i}`}>• {x}</div>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative rounded-[14px] border px-4 py-2 text-xs font-bold transition",
        active
          ? "border-emerald-500/20 bg-emerald-500/90 text-[#050807]"
          : "border-emerald-900/10 bg-white/70 text-emerald-950/70 hover:bg-white/90",
      ].join(" ")}
      type="button"
    >
      <span className="inline-flex items-center gap-2">
        {label}
        {typeof count === "number" ? (
          <span
            className={[
              "inline-flex min-w-[28px] items-center justify-center rounded-[999px] border px-2 py-[2px] text-[11px] font-black",
              active
                ? "border-emerald-900/10 bg-white/70 text-emerald-950/80"
                : "border-emerald-900/10 bg-white/80 text-emerald-950/65",
            ].join(" ")}
          >
            {count}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default function ReferralBoard({ therapistEmail }: { therapistEmail: string }) {
  const LS_KEY = `rane_referrals_${LS_VERSION}_${therapistEmail}`;

  const [items, setItems] = useState<Referral[]>([]);
  const [tab, setTab] = useState<"incoming" | "outgoing" | "create">("incoming");

  // create form
  const [clientId, setClientId] = useState("");
  const [toTherapistEmail, setToTherapistEmail] = useState("");
  const [reason, setReason] = useState("");

  // Decline flow
  const [declineOpenId, setDeclineOpenId] = useState<string | null>(null);
  const [declineNote, setDeclineNote] = useState("");
  const [declineError, setDeclineError] = useState<string | null>(null);

  // Accept flow
  const [acceptOpenId, setAcceptOpenId] = useState<string | null>(null);
  const [acceptNote, setAcceptNote] = useState("");
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // help modal
  const [helpOpen, setHelpOpen] = useState(false);

  // ✅ Portal mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const therapists = useMemo(() => safeArray<MiniTherapist>(MOCK_THERAPISTS_MINI), []);
  const clients = useMemo(() => safeArray<MiniClient>(MOCK_THERAPIST_CLIENTS_MINI), []);

  // ✅ init: LS (اگر نبود) => mock + seed
  useEffect(() => {
    const fromLS = readLS<unknown[]>(LS_KEY);
    const normalizedFromLS = safeArray<any>(fromLS)
      .map(normalizeReferral)
      .filter(Boolean) as Referral[];

    if (normalizedFromLS.length) {
      setItems(normalizedFromLS);
      return;
    }

    // mock
    const initialFromMock = safeArray<any>(MOCK_REFERRALS)
      .map(normalizeReferral)
      .filter(Boolean) as Referral[];

    const base = initialFromMock;

    const merged =
      ENABLE_DUMMY_SEED ? seedExtraIncomingReferrals(therapistEmail, base) : base;

    setItems(merged);
  }, [LS_KEY, therapistEmail]);

  // ✅ persist
  useEffect(() => {
    if (!items.length) return;
    writeLS(LS_KEY, items);
  }, [items, LS_KEY]);

  // ✅ ESC برای بستن مودال
  useEffect(() => {
    if (!helpOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen]);

  const incoming = useMemo(() => {
    const list = items.filter((r) => r.toTherapistEmail === therapistEmail);
    return [...list].sort((a, b) => {
      if (a.status === b.status) return b.createdAtISO.localeCompare(a.createdAtISO);
      if (a.status === "pending") return -1;
      if (b.status === "pending") return 1;
      return b.createdAtISO.localeCompare(a.createdAtISO);
    });
  }, [items, therapistEmail]);

  const outgoing = useMemo(() => {
    const list = items.filter((r) => r.fromTherapistEmail === therapistEmail);
    return [...list].sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO));
  }, [items, therapistEmail]);

  const counts = useMemo(() => {
    const incomingPending = incoming.filter((x) => x.status === "pending").length;
    const outgoingPending = outgoing.filter((x) => x.status === "pending").length;
    return {
      incomingAll: incoming.length,
      outgoingAll: outgoing.length,
      incomingPending,
      outgoingPending,
    };
  }, [incoming, outgoing]);

  function updateStatus(id: string, status: ReferralStatus, extra?: Partial<Referral>) {
    setItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              updatedAtISO: nowISO(),
              ...(extra || {}),
            }
          : r
      )
    );
  }

  function createReferral() {
    const c = clients.find((x) => x.id === clientId);
    const to = therapists.find((t) => t.email === toTherapistEmail);
    const from = therapists.find((t) => t.email === therapistEmail);

    if (!c || !to || !from) return;

    const trimmedReason = (reason || "").trim();
    if (!trimmedReason) return;

    const newItem: Referral = {
      id: `ref_${Date.now()}`,
      clientId: c.id,
      clientName: c.fullName || "—",
      fromTherapistEmail: from.email,
      fromTherapistName: from.name || from.email,
      toTherapistEmail: to.email,
      toTherapistName: to.name || to.email,
      reason: trimmedReason,
      status: "pending",
      createdAtISO: nowISO(),
      updatedAtISO: nowISO(),
    };

    setItems((prev) => [newItem, ...prev]);
    setClientId("");
    setToTherapistEmail("");
    setReason("");
    setTab("outgoing");
  }

  function openDecline(id: string) {
    setDeclineOpenId(id);
    setDeclineNote("");
    setDeclineError(null);
    setAcceptOpenId(null);
    setAcceptNote("");
    setAcceptError(null);
  }

  function submitDecline() {
    if (!declineOpenId) return;

    const note = (declineNote || "").trim();
    if (!note) {
      setDeclineError("نوشتن دلیل رد اجباری است.");
      return;
    }

    updateStatus(declineOpenId, "declined", {
      decisionNote: note,
      decidedByEmail: therapistEmail,
      decidedAtISO: nowISO(),
    });

    setDeclineOpenId(null);
    setDeclineNote("");
    setDeclineError(null);
  }

  function openAccept(id: string) {
    setAcceptOpenId(id);
    setAcceptNote("");
    setAcceptError(null);
    setDeclineOpenId(null);
    setDeclineNote("");
    setDeclineError(null);
  }

  function submitAccept() {
    if (!acceptOpenId) return;

    const note = (acceptNote || "").trim();
    const finalNote = note || "پذیرفته شد";

    updateStatus(acceptOpenId, "accepted", {
      decisionNote: finalNote,
      decidedByEmail: therapistEmail,
      decidedAtISO: nowISO(),
    });

    setAcceptOpenId(null);
    setAcceptNote("");
    setAcceptError(null);
  }

  const openHelp = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setHelpOpen(true);
  };

  const closeHelp = (e?: React.SyntheticEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setHelpOpen(false);
  };

  // ✅ ریست داده‌های تست این صفحه
  const resetTestData = () => {
    removeLS(LS_KEY);

    const initialFromMock = safeArray<any>(MOCK_REFERRALS)
      .map(normalizeReferral)
      .filter(Boolean) as Referral[];

    const base = initialFromMock;
    const merged = ENABLE_DUMMY_SEED ? seedExtraIncomingReferrals(therapistEmail, base) : base;

    setItems(merged);
    setTab("incoming");
    setHelpOpen(false);
    setAcceptOpenId(null);
    setDeclineOpenId(null);
    setAcceptNote("");
    setDeclineNote("");
    setAcceptError(null);
    setDeclineError(null);
  };

  // راهنماهای کوتاه
  const pageIntroLines = [
    "ارجاع‌های دریافتی را می‌توانید «پذیرش» یا «عدم پذیرش (با دلیل اجباری)» کنید.",
    "ارجاع‌های ارسالی را می‌توانید پیگیری کنید و یادداشت درمانگر مقصد را ببینید.",
    "برای ایجاد ارجاع جدید: مراجع، درمانگر مقصد و علت ارجاع را کوتاه و دقیق وارد کنید.",
  ];

  const incomingGuide = [
    "ارجاع‌های «در انتظار» بالاتر نمایش داده می‌شوند.",
    "در صورت رد کردن، نوشتن دلیل الزامی است.",
    "پس از پذیرش/رد، «یادداشت» برای فرستنده هم قابل مشاهده است.",
  ];

  const outgoingGuide = [
    "وضعیت ارجاع (در انتظار/پذیرفته/رد/لغو) نمایش داده می‌شود.",
    "اگر ارجاع از حالت در انتظار خارج شود، یادداشت درمانگر مقصد نمایش داده می‌شود.",
    "در حالت «در انتظار» امکان «لغو» دارید.",
  ];

  const createGuide = [
    "علت ارجاع را کوتاه، مشخص و قابل اقدام بنویسید.",
    "بهتر است شامل: موضوع، اولویت/فوریت، محدودیت زمانی باشد.",
    "اگر لازم است اطلاعات پرونده/خلاصه جلسه قبلی را ذکر کنید.",
  ];

  return (
    <div className="grid gap-4">
      {/* ✅ Header حرفه‌ای‌تر */}
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">ارجاع‌ها</div>

              {/* ✅ دکمه ! واضح‌تر */}
              <button
                type="button"
                onClick={openHelp}
                className={[
                  "inline-flex h-9 w-9 items-center justify-center",
                  "rounded-[999px] border border-emerald-900/10 bg-white/90",
                  "text-base font-black text-emerald-950/80 hover:bg-white",
                  "shadow-[0_12px_36px_rgba(0,0,0,0.10)]",
                  "cursor-pointer select-none",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                ].join(" ")}
                aria-label="راهنمای کامل ارجاع‌ها"
                title="راهنمای کامل"
              >
                !
              </button>

              {/* ✅ وضعیت خلاصه */}
              <div className="hidden md:flex items-center gap-2">
                {counts.incomingPending ? (
                  <span className="rounded-[999px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-950/70">
                    دریافتیِ در انتظار: {counts.incomingPending}
                  </span>
                ) : null}
                {counts.outgoingPending ? (
                  <span className="rounded-[999px] border border-emerald-900/10 bg-white/80 px-3 py-1 text-[11px] font-black text-emerald-950/60">
                    ارسالیِ در انتظار: {counts.outgoingPending}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
              مدیریت ارجاع بین درمانگران (فعلاً Mock) — با کلیک روی{" "}
              <span className="text-emerald-950/80">!</span> راهنمای کامل را ببینید.
            </div>
          </div>

          {/* ✅ کنترل داده تست */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetTestData}
              className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-4 py-2 text-xs font-bold text-emerald-950/70 hover:bg-white"
              title="پاک کردن localStorage این بخش و برگرداندن داده‌های تست"
            >
              ریست داده‌های تست
            </button>
          </div>
        </div>

        <div className="mt-4">
          <SmallGuideBox title="راهنمای سریع" lines={pageIntroLines} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <TabButton
          active={tab === "incoming"}
          onClick={() => setTab("incoming")}
          label="ارجاع‌های دریافتی"
          count={counts.incomingAll}
        />
        <TabButton
          active={tab === "outgoing"}
          onClick={() => setTab("outgoing")}
          label="ارجاع‌های ارسالی"
          count={counts.outgoingAll}
        />
        <TabButton
          active={tab === "create"}
          onClick={() => setTab("create")}
          label="ایجاد ارجاع جدید"
        />
      </div>

      {/* راهنمای تب‌ها */}
      {tab === "incoming" ? (
        <SmallGuideBox title="این تب چه چیزی را نشان می‌دهد؟" lines={incomingGuide} />
      ) : null}
      {tab === "outgoing" ? (
        <SmallGuideBox title="این تب چه چیزی را نشان می‌دهد؟" lines={outgoingGuide} />
      ) : null}
      {tab === "create" ? (
        <SmallGuideBox title="این تب چه کاری انجام می‌دهد؟" lines={createGuide} />
      ) : null}

      {/* Incoming */}
      {tab === "incoming" ? (
        <div className="grid gap-3">
          {incoming.length ? (
            incoming.map((r) => (
              <div
                key={r.id}
                className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[220px]">
                    <div className="text-sm font-bold">{r.clientName}</div>
                    <div className="mt-1 text-xs font-bold text-emerald-950/55">
                      ارجاع از: {r.fromTherapistName}
                    </div>
                    <div className="mt-1 text-xs font-bold text-emerald-950/55">
                      تاریخ: {shortISO(r.createdAtISO)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusPill status={r.status} />

                    {r.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openAccept(r.id)}
                          className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/90 px-4 py-2 text-xs font-bold text-[#050807] hover:opacity-95"
                        >
                          پذیرش
                        </button>

                        <button
                          type="button"
                          onClick={() => openDecline(r.id)}
                          className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-2 text-xs font-bold text-emerald-950/70 hover:bg-white/90"
                        >
                          عدم پذیرش
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 text-xs font-bold text-emerald-950/60 leading-7">
                  <span className="opacity-70">علت ارجاع:</span> {r.reason}
                </div>

                {/* Accept inline */}
                {acceptOpenId === r.id ? (
                  <div className="mt-3 rounded-[18px] border border-emerald-900/10 bg-white/85 p-3">
                    <div className="text-xs font-bold text-emerald-950/75">یادداشت پذیرش (اختیاری)</div>

                    <input
                      value={acceptNote}
                      onChange={(e) => {
                        setAcceptNote(e.target.value);
                        if (acceptError) setAcceptError(null);
                      }}
                      className="mt-2 w-full rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-xs font-bold outline-none"
                      placeholder="مثلاً: لطفاً پرونده و خلاصه جلسه قبلی ارسال شود..."
                    />

                    {acceptError ? (
                      <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-5">
                        {acceptError}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={submitAccept}
                        className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/90 px-4 py-2 text-xs font-bold text-[#050807] hover:opacity-95"
                      >
                        ثبت پذیرش
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAcceptOpenId(null);
                          setAcceptNote("");
                          setAcceptError(null);
                        }}
                        className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-2 text-xs font-bold hover:bg-white/90"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Decline inline */}
                {declineOpenId === r.id ? (
                  <div className="mt-3 rounded-[18px] border border-emerald-900/10 bg-white/85 p-3">
                    <div className="text-xs font-bold text-emerald-950/75">دلیل عدم پذیرش (اجباری)</div>

                    <input
                      value={declineNote}
                      onChange={(e) => {
                        setDeclineNote(e.target.value);
                        if (declineError) setDeclineError(null);
                      }}
                      className="mt-2 w-full rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-xs font-bold outline-none"
                      placeholder="مثلاً: ظرفیت تکمیل است / حوزه خارج از تخصص ..."
                    />

                    {declineError ? (
                      <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-5">
                        {declineError}
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={submitDecline}
                        disabled={!declineNote.trim()}
                        className={[
                          "rounded-[14px] px-4 py-2 text-xs font-bold border transition",
                          !declineNote.trim()
                            ? "bg-emerald-500/25 text-emerald-950/40 cursor-not-allowed border-emerald-900/10"
                            : "border-emerald-500/20 bg-emerald-500/90 text-[#050807] hover:opacity-95",
                        ].join(" ")}
                      >
                        ثبت رد
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeclineOpenId(null);
                          setDeclineNote("");
                          setDeclineError(null);
                        }}
                        className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-2 text-xs font-bold hover:bg-white/90"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* decision note */}
                {r.status !== "pending" && r.decisionNote ? (
                  <div className="mt-3 text-xs font-bold text-emerald-950/55 leading-7">
                    <span className="opacity-70">یادداشت درمانگر دریافت‌کننده:</span> {r.decisionNote}
                  </div>
                ) : null}

                <div className="mt-3">
                  <Link
                    href={`/panel/therapist/clients/${r.clientId}`}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    مشاهده پرونده مراجع
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 text-xs font-bold text-emerald-950/60">
              ارجاع دریافتی جدیدی ندارید.
            </div>
          )}
        </div>
      ) : null}

      {/* Outgoing */}
      {tab === "outgoing" ? (
        <div className="grid gap-3">
          {outgoing.length ? (
            outgoing.map((r) => (
              <div
                key={r.id}
                className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[220px]">
                    <div className="text-sm font-bold">{r.clientName}</div>
                    <div className="mt-1 text-xs font-bold text-emerald-950/55">
                      ارجاع به: {r.toTherapistName}
                    </div>
                    <div className="mt-1 text-xs font-bold text-emerald-950/55">
                      تاریخ: {shortISO(r.createdAtISO)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusPill status={r.status} />
                    {r.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(r.id, "cancelled")}
                        className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-2 text-xs font-bold text-emerald-950/70 hover:bg-white/90"
                      >
                        لغو
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 text-xs font-bold text-emerald-950/60 leading-7">
                  <span className="opacity-70">علت ارجاع:</span> {r.reason}
                </div>

                {r.status !== "pending" && r.decisionNote ? (
                  <div className="mt-3 text-xs font-bold text-emerald-950/55 leading-7">
                    <span className="opacity-70">یادداشت درمانگر مقصد:</span> {r.decisionNote}
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 text-xs font-bold text-emerald-950/60">
              ارجاع ارسالی ندارید.
            </div>
          )}
        </div>
      ) : null}

      {/* Create */}
      {tab === "create" ? (
        <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-bold">ایجاد ارجاع جدید</div>

          <div className="mt-2 text-xs font-bold text-emerald-950/60 leading-7">
            مراجع را انتخاب کنید، درمانگر مقصد را تعیین کنید و علت ارجاع را وارد کنید.
          </div>

          <div className="mt-3 rounded-[18px] border border-emerald-900/10 bg-white/85 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-emerald-950/75">راهنمای خلاصه نوشتن اطلاعات ضروری</div>
              <button
                type="button"
                onClick={openHelp}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[999px] border border-emerald-900/10 bg-white/90 text-base font-black text-emerald-950/80 hover:bg-white cursor-pointer select-none"
                aria-label="باز کردن راهنمای کامل"
                title="راهنمای کامل"
              >
                !
              </button>
            </div>
            <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">
              • موضوع ارجاع • فوریت/اولویت • محدودیت زمانی • نکته مهم پرونده (در صورت نیاز)
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">انتخاب مراجع</div>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/75 px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="">— انتخاب کنید —</option>
                {clients
                  .filter((c) => c.therapistEmail === therapistEmail)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName || c.id}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">انتخاب درمانگر مقصد</div>
              <select
                value={toTherapistEmail}
                onChange={(e) => setToTherapistEmail(e.target.value)}
                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/75 px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="">— انتخاب کنید —</option>
                {therapists
                  .filter((t) => t.email !== therapistEmail)
                  .map((t) => (
                    <option key={t.email} value={t.email}>
                      {t.name || t.email}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">علت ارجاع</div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[110px] w-full rounded-[14px] border border-emerald-900/10 bg-white/75 px-3 py-2 text-xs font-bold outline-none"
                placeholder="مثال: نیاز به ارزیابی اوتیسم (فوریت متوسط) — امکان جلسه آنلاین طی ۱۰ روز آینده"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={createReferral}
                className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/90 px-4 py-2 text-xs font-bold text-[#050807] hover:opacity-95"
              >
                ثبت ارجاع
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientId("");
                  setToTherapistEmail("");
                  setReason("");
                }}
                className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-2 text-xs font-bold hover:bg-white/90"
              >
                پاک کردن
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Help Modal (Portal) — UI حرفه‌ای‌تر */}
      {mounted && helpOpen
        ? createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
              {/* Backdrop: کلیک روی پس‌زمینه => بستن */}
              <button
                type="button"
                className="absolute inset-0 bg-black/35"
                onClick={closeHelp}
                aria-label="بستن راهنما"
              />

              <div className="relative w-full max-w-2xl rounded-[26px] border border-emerald-900/10 bg-white/95 p-5 shadow-[0_22px_80px_rgba(0,0,0,0.20)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-emerald-950/100">راهنمای کامل ارجاع‌ها</div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-950/55 leading-6">
                      نکته: این بخش فعلاً Mock است و داده‌ها در localStorage ذخیره می‌شود (برای تست UI/UX).
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeHelp}
                    className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-xs font-bold text-emerald-950/100 hover:bg-white"
                  >
                    بستن
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-[20px] border border-emerald-900/10 bg-white/80 p-4">
                    <div className="text-xs font-black text-emerald-950/75">۱) ایجاد ارجاع جدید</div>
                    <div className="mt-2 text-[11px] font-bold text-emerald-950/60 leading-6">
                      • مراجع را انتخاب کنید • درمانگر مقصد را تعیین کنید • علت ارجاع را کوتاه و دقیق بنویسید.
                      <br />
                      پیشنهاد: موضوع + اولویت/فوریت + محدودیت زمانی + نکته مهم پرونده.
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-emerald-900/10 bg-white/80 p-4">
                    <div className="text-xs font-black text-emerald-950/75">۲) ارجاع‌های دریافتی</div>
                    <div className="mt-2 text-[11px] font-bold text-emerald-950/60 leading-6">
                      • می‌توانید «پذیرش» کنید (یادداشت اختیاری) یا «عدم پذیرش» کنید (دلیل اجباری).
                      <br />
                      • پس از تصمیم‌گیری، یادداشت شما برای درمانگر فرستنده هم قابل مشاهده است.
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-emerald-900/10 bg-white/80 p-4">
                    <div className="text-xs font-black text-emerald-950/75">۳) ارجاع‌های ارسالی</div>
                    <div className="mt-2 text-[11px] font-bold text-emerald-950/60 leading-6">
                      • وضعیت ارجاع نمایش داده می‌شود.
                      <br />
                      • اگر ارجاع پذیرفته/رد شود، یادداشت درمانگر مقصد هم نمایش داده می‌شود.
                      <br />
                      • در حالت «در انتظار» امکان «لغو» دارید.
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <div className="rounded-[18px] border border-emerald-900/10 bg-emerald-500/10 p-3">
                    <div className="text-[11px] font-black text-emerald-950/70">کلیدهای سریع</div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-950/60 leading-6">
                      • ESC برای بستن راهنما • کلیک روی پس‌زمینه برای بستن
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}