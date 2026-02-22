"use client";

import { useEffect, useMemo, useState } from "react";
import StatusPill from "@/components/panel/StatusPill";
import ClientPrivateNote from "@/components/panel/ClientPrivateNote";
import { loadAdminSettings } from "@/components/panel/settings/settingsStore";

type BookingStatus = "pending" | "confirmed" | "done" | "canceled";

type Therapist = {
  id: string;
  name: string;
  specialties: string[];
  email?: string;
};

type Booking = {
  id: string;
  clientEmail: string;
  therapistId: string;
  startsAtISO: string;
  endsAtISO: string;
  status: BookingStatus;

  therapistTasks: { id: string; title: string; done: boolean }[];
  therapistNoteToClient: string;

  clientPrivateNoteSeed?: string;
};

type BookingOverride = {
  status?: BookingStatus;
  cancelledAtISO?: string;
  cancelReason?: string;
};

type OverridesMap = Record<string, BookingOverride>;

const LS_KEY = "rane_client_booking_overrides_v1";

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

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
};

function minutesUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.floor(ms / 60000);
}

function isFuture(iso: string) {
  return new Date(iso).getTime() > Date.now();
}

function useRaneModes() {
  const [modes, setModes] = useState({ isDark: false, isAnxiety: false });

  useEffect(() => {
    const read = () => ({
      isDark: document.documentElement.classList.contains("dark"),
      isAnxiety: document.body.classList.contains("rane-anxiety"),
    });

    setModes(read());

    const obs = new MutationObserver(() => setModes(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => obs.disconnect();
  }, []);

  return modes;
}

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isDark } = useRaneModes();
  return (
    <div
      className={[
        "rounded-[22px] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)]",
        // ✅ Light: سفیدِ واقعی + مرز واضح‌تر (خوانایی بهتر روی پس‌زمینه گرادیانی)
        isDark ? "border-white/10 bg-slate-900/45" : "border-emerald-900/15 bg-white",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SubBox({ children }: { children: React.ReactNode }) {
  const { isDark } = useRaneModes();
  return (
    <div
      className={[
        "rounded-[18px] border p-5",
        // ✅ Light: سفید واقعی + border واضح‌تر
        isDark ? "border-white/10 bg-slate-900/35" : "border-emerald-900/15 bg-white",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function ClientBookingsClient({
  my,
  therapists,
}: {
  my: Booking[];
  therapists: Therapist[];
}) {
  const { isDark, isAnxiety } = useRaneModes();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [overrides, setOverrides] = useState<OverridesMap>({});
  const [mounted, setMounted] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [lastMsg, setLastMsg] = useState<string | null>(null);

  const cancellationHours = useMemo(() => {
    try {
      const a = loadAdminSettings();
      const h = a?.policies?.cancellationHours;
      return typeof h === "number" && h > 0 ? h : 24;
    } catch {
      return 24;
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const fromLS = readLS<OverridesMap>(LS_KEY);
    setOverrides(fromLS ?? {});
  }, []);

  const merged = useMemo(() => {
    return my.map((b) => {
      const o = overrides[b.id];
      const status = (o?.status ?? b.status) as BookingStatus;
      return { ...b, status, __override: o } as Booking & { __override?: BookingOverride };
    });
  }, [my, overrides]);

  function persistOverride(id: string, patch: BookingOverride) {
    setOverrides((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...patch } };
      writeLS(LS_KEY, next);
      return next;
    });
  }

  function canCancel(b: Booking & { __override?: BookingOverride }) {
    if (!isFuture(b.startsAtISO)) return { ok: false, reason: "جلسه گذشته است." };
    if (b.status !== "pending" && b.status !== "confirmed") return { ok: false, reason: "این جلسه قابل لغو نیست." };

    const mins = minutesUntil(b.startsAtISO);
    const limitMins = cancellationHours * 60;

    if (mins < limitMins) {
      return { ok: false, reason: `کمتر از ${cancellationHours} ساعت تا جلسه مانده است.` };
    }
    return { ok: true, reason: "" };
  }

  function openCancel(id: string) {
    setCancelId(id);
    setCancelReason("");
    setCancelOpen(true);
  }

  function closeCancel() {
    setCancelOpen(false);
    setCancelId(null);
    setCancelReason("");
  }

  function doCancel() {
    if (!cancelId) return;
    persistOverride(cancelId, {
      status: "canceled",
      cancelledAtISO: new Date().toISOString(),
      cancelReason: cancelReason.trim() || "لغو توسط مراجع",
    });
    setLastMsg("✅ جلسه با موفقیت لغو شد (Mock پایدار).");
    closeCancel();
  }

  // ✅ کنتراست استاندارد
  const titleText = isDark ? "text-slate-100" : "text-emerald-950";
  const bodyText = isDark ? "text-slate-200" : "text-slate-900";
  const muteText = isDark ? "text-slate-300" : "text-slate-700"; // مهم: دیگر /55 و /60 نداریم

  return (
    <div className="space-y-5" style={isAnxiety ? { filter: "saturate(0.97) contrast(1.02)" } : undefined}>
      <div>
        <div className={`text-2xl md:text-[28px] font-extrabold ${titleText}`}>جلسات و پیگیری‌ها</div>
        <div className={`mt-2 text-sm md:text-[15px] font-bold leading-7 ${bodyText}`}>
          لیست جلسات رزرو شده، وضعیت تایید، تاریخچه، تکالیف و یادداشت‌ها.
        </div>
        <div className={`mt-1 text-xs md:text-sm font-bold ${muteText}`}>
          قانون لغو: حداقل {cancellationHours} ساعت قبل از زمان جلسه.
        </div>
      </div>

      {lastMsg ? (
        <CardShell className="p-4">
          <div className={`text-sm font-extrabold ${bodyText}`}>{lastMsg}</div>
        </CardShell>
      ) : null}

      <div className="grid gap-3">
        {merged.length === 0 ? (
          <CardShell>
            <div className={`text-sm md:text-base font-extrabold ${bodyText}`}>هنوز جلسه‌ای ثبت نشده است.</div>
          </CardShell>
        ) : (
          merged.map((b) => {
            const t = therapists.find((x) => x.id === b.therapistId);
            const expanded = expandedId === b.id;
            const cancelState = mounted ? canCancel(b as any) : { ok: false, reason: "" };

            return (
              <CardShell key={b.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className={`text-sm md:text-base font-extrabold ${titleText}`}>
                    درمانگر:{" "}
                    <span className={titleText}>
                      {t?.name ?? "—"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={b.status} />

                    <button
                      type="button"
                      onClick={() => setExpandedId((p) => (p === b.id ? null : b.id))}
                      className={[
                        "rounded-[14px] border px-4 py-2.5 text-xs md:text-sm font-extrabold transition",
                        isDark
                          ? "border-white/10 bg-slate-900/35 text-slate-100 hover:bg-slate-900/55"
                          : "border-emerald-900/20 bg-white text-slate-900 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {expanded ? "بستن جزئیات" : "جزئیات"}
                    </button>

                    <button
                      type="button"
                      onClick={() => openCancel(b.id)}
                      disabled={!cancelState.ok}
                      title={!cancelState.ok ? cancelState.reason : "لغو جلسه"}
                      className={[
                        "rounded-[14px] border px-4 py-2.5 text-xs md:text-sm font-extrabold transition",
                        cancelState.ok
                          ? "border-rose-500/30 bg-rose-500/12 text-rose-700 hover:bg-rose-500/18"
                          : isDark
                          ? "border-white/10 bg-slate-900/25 text-slate-500 cursor-not-allowed"
                          : "border-emerald-900/15 bg-white text-slate-400 cursor-not-allowed",
                      ].join(" ")}
                    >
                      لغو جلسه
                    </button>
                  </div>
                </div>

                <div className={`mt-2 text-sm md:text-[15px] font-bold ${muteText}`}>
                  زمان جلسه: <span className={bodyText}>{fmt(b.startsAtISO)}</span>
                </div>

                {b.__override?.status === "canceled" ? (
                  <div
                    className={[
                      "mt-4 rounded-[16px] border px-4 py-3 text-sm font-extrabold",
                      isDark
                        ? "border-rose-500/25 bg-rose-500/10 text-slate-100"
                        : "border-rose-500/25 bg-rose-500/10 text-slate-900",
                    ].join(" ")}
                  >
                    این جلسه توسط مراجع لغو شده است.
                    {b.__override?.cancelReason ? (
                      <span className={`mr-2 text-xs md:text-sm font-bold ${muteText}`}>
                        (علت: {b.__override.cancelReason})
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {expanded ? (
                  <div className="mt-5 grid gap-3">
                    <SubBox>
                      <div className={`text-sm md:text-base font-extrabold ${titleText}`}>تکالیف درمانگر</div>
                      <div className="mt-3 grid gap-2">
                        {b.therapistTasks.length === 0 ? (
                          <div className={`text-sm font-bold ${muteText}`}>تکلیفی ثبت نشده است.</div>
                        ) : (
                          b.therapistTasks.map((task) => (
                            <div
                              key={task.id}
                              className={[
                                "flex flex-col gap-1 md:flex-row md:items-center md:justify-between rounded-[14px] border px-4 py-3",
                                isDark ? "border-white/10 bg-slate-900/30" : "border-emerald-900/15 bg-white",
                              ].join(" ")}
                            >
                              <div className={`text-sm md:text-[15px] font-extrabold ${bodyText}`}>{task.title}</div>
                              <div className={`text-sm font-bold ${muteText}`}>{task.done ? "انجام شده" : "در انتظار"}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </SubBox>

                    <SubBox>
                      <div className={`text-sm md:text-base font-extrabold ${titleText}`}>یادداشت درمانگر</div>
                      <div className={`mt-3 text-sm md:text-[15px] font-bold leading-7 ${bodyText}`}>
                        {b.therapistNoteToClient || "یادداشتی ثبت نشده است."}
                      </div>
                    </SubBox>

                    <SubBox>
                      <ClientPrivateNote bookingId={b.id} seed={b.clientPrivateNoteSeed} />
                    </SubBox>
                  </div>
                ) : null}
              </CardShell>
            );
          })
        )}
      </div>

      {cancelOpen && cancelId ? (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCancel();
          }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div
            className={[
              "relative w-full max-w-lg rounded-[22px] border p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)]",
              isDark ? "border-white/10 bg-slate-950/92 text-slate-100" : "border-emerald-900/20 bg-white text-slate-900",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <div className={`text-base font-extrabold ${titleText}`}>لغو جلسه</div>
              <button
                type="button"
                onClick={closeCancel}
                className={[
                  "rounded-[14px] border px-4 py-2 text-xs md:text-sm font-extrabold",
                  isDark ? "border-white/10 bg-slate-900/40 hover:bg-slate-900/60" : "border-emerald-900/20 bg-white hover:bg-slate-50",
                ].join(" ")}
              >
                بستن
              </button>
            </div>

            <div className={`mt-3 text-sm font-bold leading-7 ${muteText}`}>
              این عملیات قابل بازگشت نیست (در نسخه فعلی Mock). در صورت نیاز علت لغو را وارد کنید.
            </div>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className={[
                "mt-3 min-h-[100px] w-full resize-none rounded-[16px] border px-4 py-3 text-sm md:text-[15px] font-bold outline-none",
                isDark ? "border-white/10 bg-slate-900/40 text-slate-100" : "border-emerald-900/20 bg-white text-slate-900",
              ].join(" ")}
              placeholder="علت لغو (اختیاری)"
            />

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={doCancel}
                className="rounded-[16px] border border-rose-500/30 bg-rose-500/15 px-5 py-3 text-sm font-extrabold text-rose-700 hover:bg-rose-500/20"
              >
                تایید و لغو جلسه
              </button>

              <button
                type="button"
                onClick={closeCancel}
                className={[
                  "rounded-[16px] border px-5 py-3 text-sm font-extrabold",
                  isDark ? "border-white/10 bg-slate-900/40 hover:bg-slate-900/60" : "border-emerald-900/20 bg-white hover:bg-slate-50",
                ].join(" ")}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}