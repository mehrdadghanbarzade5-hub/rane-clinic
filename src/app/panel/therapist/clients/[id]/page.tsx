// src/app/panel/therapist/clients/[id]/page.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  type Booking,
  getTherapistAccountByEmail,
  getTherapistClientListForEmail,
  getClientDetailsForTherapistEmail,
  getBookingsForTherapistEmail,
} from "@/data/mockDb";

type IntakeField = { label: string; value: string };
type SessionItem = { id: string; date: string; status: string; title: string };
type UpcomingItem = {
  id: string;
  date: string;
  time?: string;
  status: string;
  title: string;
};
type TaskItem = { id: string; text: string; due?: string; done: boolean };

type ClientDetailsNormalized = {
  intakeSummary: string;
  intakeFields: IntakeField[];
  sessions: SessionItem[];
  upcoming: UpcomingItem[];
  tasks: TaskItem[];
  therapistNote: string;
  clientPrivateNote: string;
  therapistPrivateNote: string;
};

type AssignedFormTask = {
  id: string;
  formId: string;
  formTitle: string;
  clientId: string;
  clientName: string;
  therapistEmail: string;
  assignedAtISO: string;
  status: "assigned" | "completed";
};

type ClientOverrides = {
  therapistNote?: string; // یادداشت درمانگر برای مراجع (قابل مشاهده توسط مراجع در نسخه واقعی)
  therapistPrivateNote?: string; // فقط درمانگر
  manualTasks?: Array<{ id: string; text: string; done: boolean; createdAtISO: string }>;
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeDetails(raw: unknown): ClientDetailsNormalized {
  const r = (raw ?? {}) as Record<string, unknown>;

  const intakeSummary =
    asString(r.intakeSummary) || asString(r.intake) || asString(r.intakeText) || "—";

  const rawFields =
    r.intakeFields ?? r.fields ?? r.intakeForm ?? r.intakeItems ?? r.intakeAnswers ?? [];

  const intakeFields = asArray<Record<string, unknown>>(rawFields).map(
    (f, idx): IntakeField => ({
      label: asString(f.label, `فیلد ${idx + 1}`),
      value: asString(f.value, "—"),
    })
  );

  const rawSessions = r.sessions ?? r.history ?? r.pastSessions ?? r.doneSessions ?? [];
  const sessions = asArray<Record<string, unknown>>(rawSessions).map(
    (s, idx): SessionItem => ({
      id: asString(s.id, `s-${idx + 1}`),
      date: asString(s.date, "—"),
      status: asString(s.status, "—"),
      title: asString(s.title, "جلسه"),
    })
  );

  const rawUpcoming =
    r.upcoming ?? r.upcomingSessions ?? r.nextSessions ?? r.reservations ?? r.bookings ?? [];

  const upcoming = asArray<Record<string, unknown>>(rawUpcoming).map(
    (u, idx): UpcomingItem => ({
      id: asString(u.id, `u-${idx + 1}`),
      date: asString(u.date, "—"),
      time: asString(u.time, ""),
      status: asString(u.status, "—"),
      title: asString(u.title, "جلسه"),
    })
  );

  const rawTasks = r.tasks ?? r.homeworks ?? r.assignments ?? [];
  const tasks = asArray<Record<string, unknown>>(rawTasks).map(
    (t, idx): TaskItem => ({
      id: asString(t.id, `t-${idx + 1}`),
      text: asString(t.text, "—"),
      due: asString(t.due, ""),
      done: asBool(t.done, false),
    })
  );

  const therapistNote = asString(r.therapistNote) || asString(r.noteTherapist) || "—";
  const clientPrivateNote = asString(r.clientPrivateNote) || asString(r.clientNote) || "";
  const therapistPrivateNote = asString(r.therapistPrivateNote) || asString(r.privateNote) || "";

  return {
    intakeSummary,
    intakeFields,
    sessions,
    upcoming,
    tasks,
    therapistNote,
    clientPrivateNote,
    therapistPrivateNote,
  };
}

function formatFaDateTime(iso: string) {
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

function shortISO(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

function nowISO() {
  return new Date().toISOString();
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

function badge(status: string) {
  const base = "rounded-[999px] border px-3 py-1 text-xs font-bold";
  const s = (status || "").toLowerCase();

  if (s === "confirmed" || s === "accepted") {
    return [base, "border-emerald-500/20 bg-emerald-500/10 text-emerald-950/80"].join(" ");
  }
  if (s === "pending") {
    return [base, "border-emerald-900/10 bg-white/70 text-emerald-950/60"].join(" ");
  }
  if (s === "done") {
    return [base, "border-emerald-900/10 bg-emerald-950/5 text-emerald-950/70"].join(" ");
  }
  if (s === "cancelled" || s === "canceled") {
    return [base, "border-emerald-900/10 bg-white/70 text-emerald-950/55"].join(" ");
  }
  return [base, "border-emerald-900/10 bg-white/70 text-emerald-950/60"].join(" ");
}

type BookingWithClientId = Booking & { clientId?: string };

function bookingClientId(b: BookingWithClientId) {
  // ✅ دقیقاً هم‌راستا با schedule/page.tsx
  return b.clientId ?? `c-${b.id}`;
}

export default function TherapistClientDetailsPage() {
  const routeParams = useParams<{ id?: string }>();
  const clientIdFromRoute = typeof routeParams?.id === "string" ? routeParams.id : "";

  const { data: session, status } = useSession();

  const therapistEmail = useMemo(() => {
    return typeof (session?.user as any)?.email === "string" ? String((session?.user as any).email) : "";
  }, [session]);

  const therapistAccount = useMemo(() => {
    if (!therapistEmail) return null;
    return getTherapistAccountByEmail(therapistEmail);
  }, [therapistEmail]);

  const scopedClients = useMemo(() => {
    if (!therapistAccount) return [];
    return getTherapistClientListForEmail(therapistAccount.email);
  }, [therapistAccount]);

  const client = useMemo(() => {
    if (!clientIdFromRoute) return null;
    return scopedClients.find((c: any) => c?.id === clientIdFromRoute) ?? null;
  }, [scopedClients, clientIdFromRoute]);

  const rawDetails = useMemo(() => {
    if (!therapistAccount || !clientIdFromRoute) return null;
    return getClientDetailsForTherapistEmail(therapistAccount.email, clientIdFromRoute);
  }, [therapistAccount, clientIdFromRoute]);

  const details = useMemo(() => normalizeDetails(rawDetails), [rawDetails]);

  const missing = !client || !rawDetails;

  // ✅ اصلاح اصلی: رزروها فقط برای همان درمانگر لاگین‌شده
  const relatedBookings = useMemo(() => {
    if (!therapistAccount || !clientIdFromRoute) return [];
    const allForTherapist = (getBookingsForTherapistEmail(therapistAccount.email) ?? []) as Array<BookingWithClientId>;

    return allForTherapist
      .filter((b) => bookingClientId(b) === clientIdFromRoute)
      .slice()
      .sort((a, b) => {
        const ta = Date.parse(a.startsAtISO ?? "") || 0;
        const tb = Date.parse(b.startsAtISO ?? "") || 0;
        return tb - ta;
      });
  }, [therapistAccount, clientIdFromRoute]);

  const clientStatusFa = useMemo(() => {
    const st = String((client as any)?.status ?? "").toLowerCase();
    if (st === "inactive") return "غیرفعال";
    return "فعال";
  }, [client]);

  // ===============================
  // ✅ NEW: FormBank assigned tasks + therapist editable overrides (localStorage)
  // ===============================
  const LS_FORM_TASKS_KEY = useMemo(() => {
    if (!therapistAccount?.email) return "";
    return `rane_form_tasks_v1_${therapistAccount.email}`;
  }, [therapistAccount?.email]);

  const LS_OVERRIDES_KEY = useMemo(() => {
    if (!therapistAccount?.email || !clientIdFromRoute) return "";
    return `rane_client_overrides_v1_${therapistAccount.email}_${clientIdFromRoute}`;
  }, [therapistAccount?.email, clientIdFromRoute]);

  const [formTasks, setFormTasks] = useState<AssignedFormTask[]>([]);
  const [overrides, setOverrides] = useState<ClientOverrides>({});

  const [therapistNoteDraft, setTherapistNoteDraft] = useState("");
  const [therapistPrivateDraft, setTherapistPrivateDraft] = useState("");

  const [manualTasks, setManualTasks] = useState<Array<{ id: string; text: string; done: boolean; createdAtISO: string }>>(
    []
  );
  const [newManualTask, setNewManualTask] = useState("");

  // init: read localStorage (forms + overrides)
  useEffect(() => {
    if (!LS_FORM_TASKS_KEY) return;
    const fromLS = readLS<AssignedFormTask[]>(LS_FORM_TASKS_KEY);
    setFormTasks(fromLS && Array.isArray(fromLS) ? fromLS : []);
  }, [LS_FORM_TASKS_KEY]);

  useEffect(() => {
    if (!LS_OVERRIDES_KEY) return;
    const fromLS = readLS<ClientOverrides>(LS_OVERRIDES_KEY);
    const o = fromLS && typeof fromLS === "object" ? fromLS : {};
    setOverrides(o);

    // draft init
    const note = (o?.therapistNote ?? "").trim();
    const priv = (o?.therapistPrivateNote ?? "").trim();

    setTherapistNoteDraft(note || "");
    setTherapistPrivateDraft(priv || "");

    setManualTasks(Array.isArray(o?.manualTasks) ? o.manualTasks : []);
  }, [LS_OVERRIDES_KEY]);

  // keep drafts in sync when details changes & no override stored yet
  useEffect(() => {
    // اگر override خالی است، پیش‌فرض را از mock بگذار
    // (ولی اگر کاربر چیزی تایپ کرده، override می‌نشیند)
    if (!LS_OVERRIDES_KEY) return;

    setTherapistNoteDraft((prev) => {
      if (prev.trim()) return prev;
      const base = (details.therapistNote || "").trim();
      return base && base !== "—" ? base : "";
    });

    setTherapistPrivateDraft((prev) => {
      if (prev.trim()) return prev;
      const base = (details.therapistPrivateNote || "").trim();
      return base && base !== "—" ? base : "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details.therapistNote, details.therapistPrivateNote, LS_OVERRIDES_KEY]);

  // derived: form tasks for this client
  const myClientFormTasks = useMemo(() => {
    if (!clientIdFromRoute || !therapistAccount?.email) return [];
    return formTasks
      .filter((t) => t.therapistEmail === therapistAccount.email && t.clientId === clientIdFromRoute)
      .slice()
      .sort((a, b) => (a.assignedAtISO > b.assignedAtISO ? -1 : 1));
  }, [formTasks, therapistAccount?.email, clientIdFromRoute]);

  function persistOverrides(next: ClientOverrides) {
    setOverrides(next);
    if (LS_OVERRIDES_KEY) writeLS(LS_OVERRIDES_KEY, next);
  }

  function saveTherapistNotes() {
    const next: ClientOverrides = {
      ...(overrides || {}),
      therapistNote: therapistNoteDraft,
      therapistPrivateNote: therapistPrivateDraft,
      manualTasks: manualTasks,
    };
    persistOverrides(next);
  }

  function addManualTask() {
    const text = (newManualTask || "").trim();
    if (!text) return;

    const item = {
      id: `mt_${Date.now()}`,
      text,
      done: false,
      createdAtISO: nowISO(),
    };

    const nextList = [item, ...manualTasks];
    setManualTasks(nextList);
    setNewManualTask("");

    const next: ClientOverrides = {
      ...(overrides || {}),
      therapistNote: therapistNoteDraft,
      therapistPrivateNote: therapistPrivateDraft,
      manualTasks: nextList,
    };
    persistOverrides(next);
  }

  function toggleManualTaskDone(id: string) {
    const nextList = manualTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setManualTasks(nextList);

    const next: ClientOverrides = {
      ...(overrides || {}),
      therapistNote: therapistNoteDraft,
      therapistPrivateNote: therapistPrivateDraft,
      manualTasks: nextList,
    };
    persistOverrides(next);
  }

  function removeManualTask(id: string) {
    const nextList = manualTasks.filter((t) => t.id !== id);
    setManualTasks(nextList);

    const next: ClientOverrides = {
      ...(overrides || {}),
      therapistNote: therapistNoteDraft,
      therapistPrivateNote: therapistPrivateDraft,
      manualTasks: nextList,
    };
    persistOverrides(next);
  }

  function updateFormTaskStatus(id: string, status: "assigned" | "completed") {
    if (!LS_FORM_TASKS_KEY) return;
    setFormTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, status } : t));
      writeLS(LS_FORM_TASKS_KEY, next);
      return next;
    });
  }

  function removeFormTask(id: string) {
    if (!LS_FORM_TASKS_KEY) return;
    setFormTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeLS(LS_FORM_TASKS_KEY, next);
      return next;
    });
  }

  // ===============================

  if (status === "loading") {
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-bold">جزئیات مراجع</div>
            <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">در حال بارگذاری...</div>
          </div>
        </div>
      </>
    );
  }

  if (!session?.user) {
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-bold">جزئیات مراجع</div>
            <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
              برای مشاهده این صفحه باید وارد حساب درمانگر شوید.
            </div>
          </div>

          <Link
            href="/auth/signin"
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-bold">جزئیات مراجع</div>
            <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
              این حساب درمانگر نمونه اولیه نیست و فعلاً دسترسی کامل به پرونده‌ها ندارد.
            </div>
          </div>

          <Link
            href="/panel/therapist"
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
          >
            برگشت به داشبورد
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-bold">جزئیات مراجع</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            Intake، جلسات، تکالیف و یادداشت‌ها (فعلاً Mock) —{" "}
            <span className="text-emerald-950/80">{therapistAccount.displayName}</span>
          </div>
        </div>

        <Link
          href="/panel/therapist/clients"
          className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
        >
          برگشت به مراجعین
        </Link>
      </div>

      {missing ? (
        <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
          <div className="text-sm font-bold">این مراجع پیدا نشد.</div>
          <div className="mt-2 text-xs font-bold text-emerald-950/60 leading-6">
            کد درخواست: <span className="text-emerald-950/80">{clientIdFromRoute || "—"}</span>
            <br />
            لطفاً از صفحه «زمان‌بندی» یا «مراجعین» وارد شوید تا id درست باشد.
          </div>
        </div>
      ) : (
        <>
          {/* خلاصه */}
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4">
              <div className="text-xs font-bold text-emerald-950/55">نام</div>
              <div className="mt-1 text-lg font-bold">{client?.fullName ?? "—"}</div>
            </div>

            <div className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4">
              <div className="text-xs font-bold text-emerald-950/55">وضعیت</div>
              <div className="mt-1 text-lg font-bold">{clientStatusFa}</div>
            </div>

            <div className="rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-4">
              <div className="text-xs font-bold text-emerald-950/55">کد مراجع</div>
              <div className="mt-1 text-lg font-bold">{client?.id ?? "—"}</div>
            </div>
          </div>

          {/* ✅ NEW: فرم‌ها/تست‌های اختصاص داده شده */}
          <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold">فرم‌ها و تست‌های اختصاص داده شده</div>
                <div className="mt-2 text-xs font-bold text-emerald-950/60 leading-6">
                  این بخش از «بانک فرم‌ها» پر می‌شود و فقط درمانگر می‌بیند (localStorage).
                </div>
              </div>

              <Link
                href="/panel/therapist/forms"
                className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/90 px-4 py-3 text-xs font-bold text-[#050807] hover:opacity-95"
              >
                رفتن به بانک فرم‌ها
              </Link>
            </div>

            <div className="mt-4 grid gap-2">
              {myClientFormTasks.length === 0 ? (
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                  هنوز فرمی برای این مراجع اختصاص داده نشده است.
                </div>
              ) : (
                myClientFormTasks.map((t) => (
                  <div key={t.id} className="rounded-[18px] border border-emerald-900/10 bg-white/90 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-[220px]">
                        <div className="text-sm font-black text-emerald-950">{t.formTitle}</div>
                        <div className="mt-1 text-[11px] font-bold text-emerald-950/65">
                          تاریخ تخصیص: {shortISO(t.assignedAtISO)} — وضعیت:{" "}
                          <span className="text-emerald-950/80">
                            {t.status === "completed" ? "تکمیل شده" : "ارسال شده"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "rounded-[999px] border px-3 py-1 text-[11px] font-bold",
                            t.status === "completed"
                              ? "bg-emerald-900/10 text-emerald-950/70 border-emerald-900/10"
                              : "bg-emerald-500/15 text-emerald-950/80 border-emerald-500/20",
                          ].join(" ")}
                        >
                          {t.status === "completed" ? "تکمیل شده" : "ارسال شده"}
                        </span>

                        {t.status !== "completed" ? (
                          <button
                            type="button"
                            onClick={() => updateFormTaskStatus(t.id, "completed")}
                            className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/90 px-3 py-2 text-[11px] font-bold text-[#050807] hover:opacity-95"
                          >
                            علامت‌گذاری تکمیل شد
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateFormTaskStatus(t.id, "assigned")}
                            className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-[11px] font-bold text-emerald-950/80 hover:bg-white"
                          >
                            بازگردانی به «ارسال شده»
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFormTask(t.id)}
                          className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-[11px] font-bold text-emerald-950/80 hover:bg-white"
                          title="حذف از لیست تکالیف فرم (فقط تست)"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* رزروها */}
          <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
            <div className="text-sm font-bold">جلسات و تکالیف (بر اساس رزروها)</div>
            <div className="mt-2 text-xs font-bold text-emerald-950/60 leading-6">
              هر رزرو/جلسه به‌صورت جدا نمایش داده می‌شود؛ شامل تکالیف تعیین‌شده، پیام درمانگر به مراجع و پیام/پاسخ مراجع.
            </div>

            <div className="mt-4 grid gap-3">
              {relatedBookings.length === 0 ? (
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                  برای این مراجع رزروی ثبت نشده است.
                </div>
              ) : (
                relatedBookings.map((b) => (
                  <div key={b.id} className="rounded-[18px] border border-emerald-900/10 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-bold">جلسه • {formatFaDateTime(b.startsAtISO)}</div>
                      <div className={badge(b.status)}>{b.status}</div>
                    </div>

                    {/* پیام درمانگر */}
                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-emerald-950/55">پیام درمانگر به مراجع</div>
                      <div className="mt-1 rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/70 leading-6">
                        {b.therapistNoteToClient?.trim() ? b.therapistNoteToClient : "—"}
                      </div>
                    </div>

                    {/* تکالیف */}
                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-emerald-950/55">تکالیف این جلسه</div>

                      <div className="mt-2 grid gap-2">
                        {(b.therapistTasks ?? []).length === 0 ? (
                          <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                            تکلیفی برای این جلسه ثبت نشده است.
                          </div>
                        ) : (
                          (b.therapistTasks ?? []).map((t) => (
                            <div key={t.id} className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
                              <div className="flex items-center justify-between gap-3 text-xs font-bold">
                                <span className="text-emerald-950/75">{t.title}</span>
                                <span className="text-emerald-950/55">{t.done ? "انجام شده" : "در انتظار"}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* پیام مراجع */}
                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-emerald-950/55">پیام/پاسخ مراجع (اختیاری)</div>
                      <div className="mt-1 rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/70 leading-6">
                        {b.clientPrivateNoteSeed?.trim() ? b.clientPrivateNoteSeed : "—"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Intake + Sessions */}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {/* Intake */}
            <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
              <div className="text-sm font-bold">Intake (خلاصه)</div>
              <div className="mt-3 text-xs font-bold text-emerald-950/65 leading-6">{details.intakeSummary || "—"}</div>

              <div className="mt-4 grid gap-2">
                {details.intakeFields.length === 0 ? (
                  <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                    فیلدهای Intake ثبت نشده است.
                  </div>
                ) : (
                  details.intakeFields.map((f: IntakeField, idx: number) => (
                    <div key={`${f.label}-${idx}`} className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
                      <div className="text-[11px] font-bold text-emerald-950/55">{f.label}</div>
                      <div className="mt-1 text-xs font-bold text-emerald-950/75">{f.value}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sessions */}
            <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
              <div className="text-sm font-bold">جلسات آینده</div>
              <div className="mt-3 grid gap-2">
                {details.upcoming.length === 0 ? (
                  <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                    جلسه آینده ثبت نشده است.
                  </div>
                ) : (
                  details.upcoming.map((u: UpcomingItem, idx: number) => (
                    <div key={`${u.id}-${idx}`} className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-950/60">
                          {u.date}
                          {u.time ? ` • ${u.time}` : ""}
                        </span>
                        <span className="text-emerald-950/80">{u.status}</span>
                      </div>
                      <div className="mt-1 text-sm font-bold">{u.title}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 text-sm font-bold">تاریخچه جلسات</div>
              <div className="mt-3 grid gap-2">
                {details.sessions.length === 0 ? (
                  <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                    تاریخچه‌ای ثبت نشده است.
                  </div>
                ) : (
                  details.sessions.map((s: SessionItem, idx: number) => (
                    <div key={`${s.id}-${idx}`} className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-950/60">{s.date}</span>
                        <span className="text-emerald-950/80">{s.status}</span>
                      </div>
                      <div className="mt-1 text-sm font-bold">{s.title}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ✅ NEW: تکالیف/یادداشت‌های قابل ویرایش درمانگر */}
          <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
            <div className="text-sm font-bold">یادداشت‌ها و تکالیف درمانگر (قابل ویرایش)</div>
            <div className="mt-2 text-xs font-bold text-emerald-950/60 leading-6">
              این بخش مخصوص درمانگر است و تغییرات فعلاً در localStorage ذخیره می‌شود (برای تست UI/UX).
            </div>

            {/* یادداشت‌ها */}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[18px] border border-emerald-900/10 bg-white/90 p-4">
                <div className="text-xs font-black text-emerald-950">یادداشت درمانگر برای مراجع</div>
                <div className="mt-2 text-[11px] font-bold text-emerald-950/60 leading-6">
                  (در نسخه واقعی، می‌تواند برای مراجع قابل مشاهده باشد)
                </div>

                <textarea
                  value={therapistNoteDraft}
                  onChange={(e) => setTherapistNoteDraft(e.target.value)}
                  className="mt-3 min-h-[110px] w-full rounded-[16px] border border-emerald-900/15 bg-white px-4 py-3 text-xs font-bold text-emerald-950/80 outline-none focus:ring-2 focus:ring-emerald-500/25"
                  placeholder="یادداشت..."
                />
              </div>

              <div className="rounded-[18px] border border-emerald-900/10 bg-white/90 p-4">
                <div className="text-xs font-black text-emerald-950">یادداشت خصوصی درمانگر</div>
                <div className="mt-2 text-[11px] font-bold text-emerald-950/60 leading-6">
                  فقط درمانگر می‌بیند (Private).
                </div>

                <textarea
                  value={therapistPrivateDraft}
                  onChange={(e) => setTherapistPrivateDraft(e.target.value)}
                  className="mt-3 min-h-[110px] w-full rounded-[16px] border border-emerald-900/15 bg-white px-4 py-3 text-xs font-bold text-emerald-950/80 outline-none focus:ring-2 focus:ring-emerald-500/25"
                  placeholder="یادداشت خصوصی..."
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={saveTherapistNotes}
                className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/90 px-4 py-3 text-xs font-black text-[#050807] hover:opacity-95"
              >
                ذخیره یادداشت‌ها
              </button>

              <div className="text-[11px] font-bold text-emerald-950/55">
                کلید ذخیره: <span className="font-black">{LS_OVERRIDES_KEY || "—"}</span>
              </div>
            </div>

            {/* تکالیف دستی */}
            <div className="mt-6 rounded-[18px] border border-emerald-900/10 bg-white/90 p-4">
              <div className="text-xs font-black text-emerald-950">تکالیف دستی درمانگر</div>
              <div className="mt-2 text-[11px] font-bold text-emerald-950/60 leading-6">
                برای مواردی که فرم نیستند (تمرین، مواجهه، تکلیف خانگی و…).
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={newManualTask}
                  onChange={(e) => setNewManualTask(e.target.value)}
                  className="w-full flex-1 rounded-[16px] border border-emerald-900/15 bg-white px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/25"
                  placeholder="مثال: تمرین تنفس ۴-۷-۸ روزی ۲ بار"
                />
                <button
                  type="button"
                  onClick={addManualTask}
                  disabled={!newManualTask.trim()}
                  className={[
                    "rounded-[16px] border px-4 py-3 text-xs font-black transition",
                    newManualTask.trim()
                      ? "border-emerald-500/20 bg-emerald-500/90 text-[#050807] hover:opacity-95"
                      : "border-emerald-900/10 bg-emerald-500/20 text-emerald-950/40 cursor-not-allowed",
                  ].join(" ")}
                >
                  افزودن
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {manualTasks.length === 0 ? (
                  <div className="rounded-[16px] border border-emerald-900/10 bg-white px-4 py-3 text-xs font-bold text-emerald-950/60">
                    هنوز تکلیف دستی ثبت نشده است.
                  </div>
                ) : (
                  manualTasks.map((t) => (
                    <div key={t.id} className="rounded-[16px] border border-emerald-900/10 bg-white px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold text-emerald-950/80">{t.text}</div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-emerald-950/60">
                            {t.done ? "انجام شده" : "در انتظار"}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleManualTaskDone(t.id)}
                            className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-[11px] font-bold text-emerald-950/80 hover:bg-white"
                          >
                            تغییر وضعیت
                          </button>

                          <button
                            type="button"
                            onClick={() => removeManualTask(t.id)}
                            className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-[11px] font-bold text-emerald-950/80 hover:bg-white"
                          >
                            حذف
                          </button>
                        </div>
                      </div>

                      <div className="mt-1 text-[11px] font-bold text-emerald-950/50">
                        تاریخ ثبت: {shortISO(t.createdAtISO)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* یادداشت خصوصی مراجع (نمایش) */}
            <div className="mt-6">
              <div className="text-sm font-bold">یادداشت خصوصی مراجع (اختیاری)</div>
              <div className="mt-2 rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/70 leading-6">
                {details.clientPrivateNote?.trim() ? details.clientPrivateNote : "—"}
              </div>
            </div>
          </div>

          {/* Tasks (قدیمی) */}
          <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
            <div className="text-sm font-bold">تکالیف درمانگر (قدیمی/Mock)</div>

            <div className="mt-3 grid gap-2">
              {details.tasks.length === 0 ? (
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/60">
                  تکلیفی ثبت نشده است.
                </div>
              ) : (
                details.tasks.map((t: TaskItem, idx: number) => (
                  <div key={`${t.id}-${idx}`} className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-950/70">{t.text}</span>
                      <span className="text-emerald-950/55">{t.done ? "انجام شده" : "در انتظار"}</span>
                    </div>
                    {t.due ? (
                      <div className="mt-1 text-[11px] font-bold text-emerald-950/50">موعد: {t.due}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 text-sm font-bold">یادداشت درمانگر (قدیمی/Mock)</div>
            <div className="mt-2 rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/70 leading-6">
              {details.therapistNote?.trim() ? details.therapistNote : "—"}
            </div>

            <div className="mt-5 text-sm font-bold">یادداشت خصوصی درمانگر (قدیمی/Mock)</div>
            <div className="mt-2 rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/70 leading-6">
              {details.therapistPrivateNote?.trim() ? details.therapistPrivateNote : "—"}
            </div>
          </div>
        </>
      )}
    </>
  );
}