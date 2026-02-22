// src/app/panel/admin/settings/AdminSettingsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_ADMIN_SETTINGS,
  loadAdminSettings,
  resetAdminSettings,
  saveAdminSettings,
  type AdminSettings,
} from "@/components/panel/settings/settingsStore";

type AuditItem = {
  id: string;
  atISO: string;
  action: "save" | "reset" | "import";
  summary: string;
};

const AUDIT_KEY = "rane_admin_settings_audit_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadAudit(): AuditItem[] {
  if (typeof window === "undefined") return [];
  const x = safeParse<AuditItem[]>(localStorage.getItem(AUDIT_KEY));
  return Array.isArray(x) ? x : [];
}

function pushAudit(item: AuditItem) {
  const list = [item, ...loadAudit()].slice(0, 20);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-bold text-emerald-950/65">{children}</div>;
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] leading-5 text-emerald-950/55">{children}</div>;
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-bold text-emerald-950">{title}</div>
        {desc ? <div className="text-xs leading-5 text-emerald-950/60">{desc}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "w-full rounded-[14px] border p-3 text-right transition",
        checked ? "border-emerald-900/15 bg-emerald-50/70" : "border-emerald-900/10 bg-white/60",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold text-emerald-950/80">{label}</div>
        <div
          className={[
            "h-6 w-11 rounded-full border transition",
            checked ? "border-emerald-900/15 bg-emerald-600/80" : "border-emerald-900/10 bg-emerald-950/10",
          ].join(" ")}
        >
          <div
            className={[
              "h-5 w-5 translate-y-[1px] rounded-full bg-white shadow-sm transition",
              checked ? "translate-x-[22px]" : "translate-x-[2px]",
            ].join(" ")}
          />
        </div>
      </div>
    </button>
  );
}

function isEmail(v: string) {
  const s = (v || "").trim();
  if (!s) return true; // خالی بودن را خطا نمی‌گیریم (ممکن است در تست باشد)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function onlyDigits(v: string) {
  return (v || "").replace(/[^\d]/g, "");
}

function clampNumber(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function AdminSettingsClient() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [banner, setBanner] = useState<{ type: "ok" | "warn"; text: string } | null>(null);

  // ✅ تنظیمات عملیاتی واقعی برای رزرو
  // (فعلاً در همین صفحه ذخیره می‌شود؛ در فاز واقعی به رزرو/DB وصل می‌کنیم)
  const [ops, setOps] = useState({
    sessionMinutes: 50 as 45 | 50 | 60,
    bufferMinutes: 10 as 0 | 5 | 10 | 15 | 20,
    maxDailyPerTherapist: 8,
    workingHours: [
      { day: "شنبه", enabled: true, from: "09:00", to: "18:00" },
      { day: "یکشنبه", enabled: true, from: "09:00", to: "18:00" },
      { day: "دوشنبه", enabled: true, from: "09:00", to: "18:00" },
      { day: "سه‌شنبه", enabled: true, from: "09:00", to: "18:00" },
      { day: "چهارشنبه", enabled: true, from: "09:00", to: "18:00" },
      { day: "پنجشنبه", enabled: true, from: "09:00", to: "14:00" },
      { day: "جمعه", enabled: false, from: "09:00", to: "14:00" },
    ],
  });

  const OPS_KEY = "rane_admin_ops_v1";

  useEffect(() => {
    setSettings(loadAdminSettings());
    setAudit(loadAudit());
    if (typeof window !== "undefined") {
      const x = safeParse<typeof ops>(localStorage.getItem(OPS_KEY));
      if (x && typeof x === "object") setOps({ ...ops, ...x });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = useMemo(() => {
    const current = JSON.stringify(settings);
    const stored = JSON.stringify(loadAdminSettings());
    return current !== stored;
  }, [settings]);

  function showBanner(type: "ok" | "warn", text: string) {
    setBanner({ type, text });
    window.setTimeout(() => setBanner(null), 2500);
  }

  function persist(next: AdminSettings) {
    setSettings(next);
    saveAdminSettings(next);
    setSavedAt(Date.now());
    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "save",
      summary: "تنظیمات ذخیره شد (Mock پایدار)",
    });
    setAudit(loadAudit());
    showBanner("ok", "ذخیره شد");
  }

  function persistOps(next: typeof ops) {
    setOps(next);
    localStorage.setItem(OPS_KEY, JSON.stringify(next));
    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "save",
      summary: "تنظیمات عملیاتی رزرو ذخیره شد (Mock پایدار)",
    });
    setAudit(loadAudit());
    showBanner("ok", "ذخیره شد");
  }

  function exportAll() {
    const payload = {
      adminSettings: settings,
      opsSettings: ops,
      exportedAtISO: new Date().toISOString(),
      version: 1,
    };
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rane-admin-settings-export.json";
    a.click();
    URL.revokeObjectURL(url);

    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "save",
      summary: "خروجی JSON از تنظیمات گرفته شد",
    });
    setAudit(loadAudit());
    showBanner("ok", "خروجی گرفته شد");
  }

  function importAll(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const data = safeParse<any>(raw);
      if (!data || typeof data !== "object") {
        showBanner("warn", "فایل نامعتبر است");
        return;
      }
      const nextAdmin = data.adminSettings as AdminSettings | undefined;
      const nextOps = data.opsSettings as typeof ops | undefined;

      if (nextAdmin && nextAdmin.version === 1) {
        saveAdminSettings({ ...DEFAULT_ADMIN_SETTINGS, ...nextAdmin });
        setSettings(loadAdminSettings());
      }
      if (nextOps && typeof nextOps === "object") {
        localStorage.setItem(OPS_KEY, JSON.stringify({ ...ops, ...nextOps }));
        const x = safeParse<typeof ops>(localStorage.getItem(OPS_KEY));
        if (x) setOps(x);
      }

      pushAudit({
        id: uid(),
        atISO: new Date().toISOString(),
        action: "import",
        summary: "تنظیمات از فایل وارد شد (Import)",
      });
      setAudit(loadAudit());
      setSavedAt(Date.now());
      showBanner("ok", "Import انجام شد");
    };
    reader.readAsText(file);
  }

  const emailOk = isEmail(settings.clinic.publicEmail) && isEmail(settings.notifications.adminEmail);
  const noShowAmountOk =
    !settings.policies.noShowFeeEnabled || (settings.policies.noShowFeeAmount ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
        <div className="flex flex-col gap-1">
          <div className="text-base font-extrabold text-emerald-950">تنظیمات پنل ادمین</div>
          <div className="text-xs leading-5 text-emerald-950/60">
            این بخش برای واقعی‌سازی مدیریت کلینیک طراحی شده است: مشخصات کلینیک، سیاست‌ها، تنظیمات عملیاتی رزرو، خروجی/بکاپ،
            و ثبت تغییرات.
          </div>
        </div>

        {banner ? (
          <div
            className={[
              "mt-3 rounded-[14px] border px-3 py-2 text-xs font-bold",
              banner.type === "ok"
                ? "border-emerald-900/10 bg-emerald-50/70 text-emerald-950/80"
                : "border-amber-900/10 bg-amber-50/70 text-amber-900/80",
            ].join(" ")}
          >
            {banner.text}
          </div>
        ) : null}

        {!emailOk ? (
          <div className="mt-3 rounded-[14px] border border-amber-900/10 bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-900/80">
            فرمت ایمیل‌ها را بررسی کن (ایمیل عمومی یا ایمیل مدیر نامعتبر است).
          </div>
        ) : null}

        {!noShowAmountOk ? (
          <div className="mt-3 rounded-[14px] border border-amber-900/10 bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-900/80">
            مبلغ جریمه عدم حضور نامعتبر است.
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-[11px] text-emerald-950/55">
            وضعیت:{" "}
            {isDirty ? (
              <span className="font-bold text-amber-700/90">تغییرات ذخیره شده (Mock) — آماده بررسی</span>
            ) : (
              <span className="font-bold text-emerald-700/90">همه چیز ذخیره است</span>
            )}
            {savedAt ? (
              <span className="mr-2 text-emerald-950/45">
                (آخرین ذخیره: {new Date(savedAt).toLocaleTimeString("fa-IR")})
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportAll}
              className="rounded-[14px] border border-emerald-900/10 bg-white/60 px-3 py-2 text-xs font-bold text-emerald-950/75 hover:bg-white/80"
            >
              خروجی JSON
            </button>

            <label className="cursor-pointer rounded-[14px] border border-emerald-900/10 bg-white/60 px-3 py-2 text-xs font-bold text-emerald-950/75 hover:bg-white/80">
              Import
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importAll(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                resetAdminSettings();
                localStorage.removeItem(OPS_KEY);
                setSettings(DEFAULT_ADMIN_SETTINGS);
                setOps({
                  sessionMinutes: 50,
                  bufferMinutes: 10,
                  maxDailyPerTherapist: 8,
                  workingHours: [
                    { day: "شنبه", enabled: true, from: "09:00", to: "18:00" },
                    { day: "یکشنبه", enabled: true, from: "09:00", to: "18:00" },
                    { day: "دوشنبه", enabled: true, from: "09:00", to: "18:00" },
                    { day: "سه‌شنبه", enabled: true, from: "09:00", to: "18:00" },
                    { day: "چهارشنبه", enabled: true, from: "09:00", to: "18:00" },
                    { day: "پنجشنبه", enabled: true, from: "09:00", to: "14:00" },
                    { day: "جمعه", enabled: false, from: "09:00", to: "14:00" },
                  ],
                });
                pushAudit({
                  id: uid(),
                  atISO: new Date().toISOString(),
                  action: "reset",
                  summary: "بازنشانی به حالت پیش‌فرض انجام شد",
                });
                setAudit(loadAudit());
                setSavedAt(Date.now());
                showBanner("ok", "بازنشانی شد");
              }}
              className="rounded-[14px] border border-emerald-900/10 bg-white/60 px-3 py-2 text-xs font-bold text-emerald-950/75 hover:bg-white/80"
            >
              بازنشانی
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="مشخصات کلینیک" desc="اطلاعات پایه‌ای که در بخش‌های عمومی/رزرو/فاکتور استفاده می‌شود.">
          <div className="grid gap-3">
            <div>
              <FieldLabel>نام کلینیک</FieldLabel>
              <input
                value={settings.clinic.clinicName}
                onChange={(e) => persist({ ...settings, clinic: { ...settings.clinic, clinicName: e.target.value } })}
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                placeholder="مثلاً: کلینیک تخصصی رانه"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <FieldLabel>تلفن عمومی</FieldLabel>
                <input
                  value={settings.clinic.publicPhone}
                  onChange={(e) => persist({ ...settings, clinic: { ...settings.clinic, publicPhone: e.target.value } })}
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                  placeholder="051-xxxxxxx"
                />
              </div>
              <div>
                <FieldLabel>ایمیل عمومی</FieldLabel>
                <input
                  value={settings.clinic.publicEmail}
                  onChange={(e) => persist({ ...settings, clinic: { ...settings.clinic, publicEmail: e.target.value } })}
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                  placeholder="info@clinic.ir"
                />
                <HelpText>مثال: info@rane.clinic</HelpText>
              </div>
            </div>

            <div>
              <FieldLabel>آدرس</FieldLabel>
              <textarea
                value={settings.clinic.address}
                onChange={(e) => persist({ ...settings, clinic: { ...settings.clinic, address: e.target.value } })}
                className="mt-1 min-h-[90px] w-full resize-none rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                placeholder="آدرس کامل کلینیک"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <FieldLabel>شهر</FieldLabel>
                <input
                  value={settings.clinic.city}
                  onChange={(e) => persist({ ...settings, clinic: { ...settings.clinic, city: e.target.value } })}
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                  placeholder="مشهد"
                />
              </div>
              <div>
                <FieldLabel>منطقه زمانی</FieldLabel>
                <input
                  value={settings.clinic.timezone}
                  onChange={(e) => persist({ ...settings, clinic: { ...settings.clinic, timezone: e.target.value } })}
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                  placeholder="Asia/Tehran"
                />
                <HelpText>برای گزارش‌ها و زمان‌بندی رزروها استفاده می‌شود.</HelpText>
              </div>
            </div>
          </div>
        </Card>

        <Card title="سیاست‌ها و قوانین رزرو" desc="قوانین واقعی برای لغو، عدم حضور و الزامات جلسه اول.">
          <div className="grid gap-3">
            <div>
              <FieldLabel>حداقل زمان لغو قبل از جلسه</FieldLabel>
              <select
                value={settings.policies.cancellationHours}
                onChange={(e) =>
                  persist({
                    ...settings,
                    policies: { ...settings.policies, cancellationHours: Number(e.target.value) as any },
                  })
                }
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
              >
                {[1, 3, 6, 12, 24, 48].map((h) => (
                  <option key={h} value={h}>
                    {h} ساعت
                  </option>
                ))}
              </select>
              <HelpText>لغو دیرتر از این زمان می‌تواند «لغو دیرهنگام» تلقی شود.</HelpText>
            </div>

            <Switch
              checked={settings.policies.noShowFeeEnabled}
              onChange={(v) => persist({ ...settings, policies: { ...settings.policies, noShowFeeEnabled: v } })}
              label="فعال‌سازی جریمه عدم حضور"
            />

            <div>
              <FieldLabel>مبلغ جریمه عدم حضور (تومان)</FieldLabel>
              <input
                inputMode="numeric"
                value={String(settings.policies.noShowFeeAmount ?? 0)}
                onChange={(e) => {
                  const n = Number(onlyDigits(e.target.value)) || 0;
                  persist({ ...settings, policies: { ...settings.policies, noShowFeeAmount: n } });
                }}
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                placeholder="مثلاً 150000"
                disabled={!settings.policies.noShowFeeEnabled}
              />
              <HelpText>در فاز واقعی به پرداخت/فاکتور متصل می‌کنیم.</HelpText>
            </div>

            <Switch
              checked={settings.policies.requireIntakeForFirstVisit}
              onChange={(v) =>
                persist({ ...settings, policies: { ...settings.policies, requireIntakeForFirstVisit: v } })
              }
              label="الزام تکمیل Intake برای اولین مراجعه"
            />
          </div>
        </Card>

        <Card title="تنظیمات عملیاتی رزرو (واقعی)" desc="کنترل طول جلسه، فاصله بین جلسات و سقف رزرو روزانه.">
          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <FieldLabel>مدت جلسه</FieldLabel>
                <select
                  value={ops.sessionMinutes}
                  onChange={(e) => persistOps({ ...ops, sessionMinutes: Number(e.target.value) as any })}
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                >
                  {[45, 50, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} دقیقه
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>فاصله بین جلسات (Buffer)</FieldLabel>
                <select
                  value={ops.bufferMinutes}
                  onChange={(e) => persistOps({ ...ops, bufferMinutes: Number(e.target.value) as any })}
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                >
                  {[0, 5, 10, 15, 20].map((m) => (
                    <option key={m} value={m}>
                      {m} دقیقه
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>سقف رزرو روزانه/هر درمانگر</FieldLabel>
                <input
                  inputMode="numeric"
                  value={String(ops.maxDailyPerTherapist)}
                  onChange={(e) => {
                    const n = clampNumber(Number(onlyDigits(e.target.value)) || 0, 1, 40);
                    persistOps({ ...ops, maxDailyPerTherapist: n });
                  }}
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                  placeholder="مثلاً 8"
                />
                <HelpText>در فاز واقعی روی رزروها اعمال می‌شود.</HelpText>
              </div>
            </div>

            <div className="rounded-[14px] border border-emerald-900/10 bg-white/60 p-3">
              <FieldLabel>ساعات کاری کلینیک</FieldLabel>
              <HelpText>برای نمایش عمومی و محدودکردن رزروها (فاز واقعی).</HelpText>

              <div className="mt-3 grid gap-2">
                {ops.workingHours.map((d, idx) => (
                  <div
                    key={d.day}
                    className="grid gap-2 rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 md:grid-cols-12 md:items-center"
                  >
                    <div className="md:col-span-3 text-xs font-bold text-emerald-950/80">{d.day}</div>

                    <div className="md:col-span-3">
                      <Switch
                        checked={d.enabled}
                        onChange={(v) => {
                          const next = [...ops.workingHours];
                          next[idx] = { ...next[idx], enabled: v };
                          persistOps({ ...ops, workingHours: next });
                        }}
                        label={d.enabled ? "فعال" : "غیرفعال"}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FieldLabel>از</FieldLabel>
                      <input
                        value={d.from}
                        onChange={(e) => {
                          const next = [...ops.workingHours];
                          next[idx] = { ...next[idx], from: e.target.value };
                          persistOps({ ...ops, workingHours: next });
                        }}
                        className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-2 text-sm outline-none"
                        placeholder="09:00"
                        disabled={!d.enabled}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FieldLabel>تا</FieldLabel>
                      <input
                        value={d.to}
                        onChange={(e) => {
                          const next = [...ops.workingHours];
                          next[idx] = { ...next[idx], to: e.target.value };
                          persistOps({ ...ops, workingHours: next });
                        }}
                        className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-2 text-sm outline-none"
                        placeholder="18:00"
                        disabled={!d.enabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="اطلاع‌رسانی مدیریتی" desc="کنترل ایمیل/پیامک‌های مدیریتی و گزارش‌های روزانه.">
          <div className="grid gap-3">
            <div>
              <FieldLabel>ایمیل مدیر</FieldLabel>
              <input
                value={settings.notifications.adminEmail}
                onChange={(e) =>
                  persist({ ...settings, notifications: { ...settings.notifications, adminEmail: e.target.value } })
                }
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                placeholder="admin@clinic.ir"
              />
              <HelpText>برای دریافت گزارش‌ها و اطلاع‌رسانی‌ها.</HelpText>
            </div>

            <div className="grid gap-2">
              <Switch
                checked={settings.notifications.newBookingEmail}
                onChange={(v) =>
                  persist({ ...settings, notifications: { ...settings.notifications, newBookingEmail: v } })
                }
                label="ارسال ایمیل هنگام رزرو جدید"
              />
              <Switch
                checked={settings.notifications.newBookingSms}
                onChange={(v) =>
                  persist({ ...settings, notifications: { ...settings.notifications, newBookingSms: v } })
                }
                label="ارسال پیامک هنگام رزرو جدید (فاز واقعی)"
              />
              <Switch
                checked={settings.notifications.dailyReport}
                onChange={(v) => persist({ ...settings, notifications: { ...settings.notifications, dailyReport: v } })}
                label="گزارش روزانه"
              />
            </div>
          </div>
        </Card>

        <Card title="امنیت و دسترسی‌ها" desc="سیاست‌های کلان امنیتی و کنترل اختیار ویرایش پروفایل‌ها.">
          <div className="grid gap-2">
            <Switch
              checked={settings.security.enforceStrongPasswords}
              onChange={(v) => persist({ ...settings, security: { ...settings.security, enforceStrongPasswords: v } })}
              label="اجبار رمز عبور قوی (سیاست)"
            />
            <Switch
              checked={settings.security.allowTherapistSelfEdit}
              onChange={(v) => persist({ ...settings, security: { ...settings.security, allowTherapistSelfEdit: v } })}
              label="درمانگر اجازه ویرایش پروفایل خودش را داشته باشد"
            />
            <Switch
              checked={settings.security.allowClientSelfEdit}
              onChange={(v) => persist({ ...settings, security: { ...settings.security, allowClientSelfEdit: v } })}
              label="مراجع اجازه ویرایش پروفایل خودش را داشته باشد"
            />

            <div className="mt-2 rounded-[14px] border border-emerald-900/10 bg-white/60 p-3">
              <FieldLabel>داده‌های تست (Test/Dummy Data)</FieldLabel>
              <HelpText>
                این گزینه فقط ذخیره می‌شود و فعلاً روی mockDb اعمال نمی‌کنیم (طبق تصمیم شما).
              </HelpText>
              <div className="mt-2">
                <Switch
                  checked={settings.data.testDataEnabled}
                  onChange={(v) => persist({ ...settings, data: { ...settings.data, testDataEnabled: v } })}
                  label={settings.data.testDataEnabled ? "داده تست فعال است" : "داده تست غیرفعال است"}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card title="گزارش آخرین تغییرات" desc="برای ردگیری تغییرات مهم (Audit Log سبک).">
          <div className="grid gap-2">
            {audit.length ? (
              audit.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="rounded-[14px] border border-emerald-900/10 bg-white/60 p-3"
                >
                  <div className="text-xs font-bold text-emerald-950/80">{a.summary}</div>
                  <div className="mt-1 text-[11px] text-emerald-950/55">
                    {new Date(a.atISO).toLocaleString("fa-IR")}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-xs text-emerald-950/60">
                هنوز تغییری ثبت نشده است.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
        <div className="text-xs leading-6 text-emerald-950/60">
          نکته: در فاز فعال‌سازی واقعی، خروجی/Import همین ساختار برای انتقال به دیتابیس و اعمال سیاست‌ها روی رزروها
          استفاده می‌شود.
        </div>
      </div>
    </div>
  );
}