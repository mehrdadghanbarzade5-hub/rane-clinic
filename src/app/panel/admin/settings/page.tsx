"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  DEFAULT_ADMIN_SETTINGS,
  loadAdminSettings,
  resetAdminSettings,
  saveAdminSettings,
  type AdminSettings as StoreAdminSettings,
} from "@/components/panel/settings/settingsStore";

type AdminSettings = {
  enableDummyData: boolean; // فعال/غیرفعال کردن داده‌های تست
  enableAdminOverrides: boolean; // فعال بودن Override های ادمین (مثل وضعیت رزروها)
  enableTherapistLocalTasks: boolean; // فعال بودن ذخیره تکالیف/فرم‌ها در localStorage
};

type AuditItem = {
  id: string;
  atISO: string;
  action: "save" | "reset" | "export" | "import";
  summary: string;
};

type OpsSettings = {
  version: 1;
  sessionMinutes: 45 | 50 | 60;
  bufferMinutes: 0 | 5 | 10 | 15 | 20;
  maxDailyPerTherapist: number; // 1..40
  workingHours: { day: string; enabled: boolean; from: string; to: string }[];
};

const SETTINGS_KEY = "rane_admin_settings_v1"; // legacy (همان قبلی شما)
const AUDIT_KEY = "rane_admin_settings_audit_v1";
const OPS_KEY = "rane_admin_ops_v1";

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

function toBool(v: unknown, fallback: boolean) {
  return typeof v === "boolean" ? v : fallback;
}

function normalizeSettings(raw: unknown): AdminSettings {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    enableDummyData: toBool(r.enableDummyData, true),
    enableAdminOverrides: toBool(r.enableAdminOverrides, true),
    enableTherapistLocalTasks: toBool(r.enableTherapistLocalTasks, true),
  };
}

function prettyKey(k: string) {
  return k.length > 70 ? `${k.slice(0, 70)}…` : k;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function pushAudit(item: AuditItem) {
  const list = [item, ...(safeParse<AuditItem[]>(localStorage.getItem(AUDIT_KEY)) ?? [])].slice(0, 30);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
}

function loadAudit(): AuditItem[] {
  const x = safeParse<AuditItem[]>(localStorage.getItem(AUDIT_KEY));
  return Array.isArray(x) ? x : [];
}

function onlyDigits(v: string) {
  return (v || "").replace(/[^\d]/g, "");
}

function clampNumber(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isEmail(v: string) {
  const s = (v || "").trim();
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-bold text-emerald-950/65">{children}</div>;
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] leading-6 font-bold text-emerald-950/45">{children}</div>;
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
    <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="text-sm font-bold">{title}</div>
      {desc ? <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">{desc}</div> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
      <span className="text-xs font-bold text-emerald-950/70">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-emerald-600"
      />
    </label>
  );
}

const DEFAULT_OPS: OpsSettings = {
  version: 1,
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
};

export default function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ------------------------------
  // ✅ Legacy settings (صفحه فعلی شما)
  // ------------------------------
  const [settings, setSettings] = useState<AdminSettings>({
    enableDummyData: true,
    enableAdminOverrides: true,
    enableTherapistLocalTasks: true,
  });

  // ------------------------------
  // ✅ Real Admin Settings (استاندارد کلینیک)
  // ------------------------------
  const [admin, setAdmin] = useState<StoreAdminSettings>(DEFAULT_ADMIN_SETTINGS);

  // ------------------------------
  // ✅ Ops Settings (واقعی‌تر برای رزرو/ساعت کاری)
  // ------------------------------
  const [ops, setOps] = useState<OpsSettings>(DEFAULT_OPS);

  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [tab, setTab] = useState<"clinic" | "tools">("clinic");
  const [lastActionMsg, setLastActionMsg] = useState<string | null>(null);

  // load (legacy + adminStore + ops + audit)
  useEffect(() => {
    if (!mounted) return;

    // legacy
    const fromLS = readLS<AdminSettings>(SETTINGS_KEY);
    const legacy = normalizeSettings(fromLS);
    setSettings(legacy);

    // store admin settings
    const loadedAdmin = loadAdminSettings();
    setAdmin(loadedAdmin);

    // همگام‌سازی اولیه: اگر legacy.enableDummyData داریم، آن را در store هم ست کنیم
    // تا صفحه‌های جدید Settings (که شما ساختی) یکپارچه شوند.
    if (typeof legacy.enableDummyData === "boolean" && loadedAdmin.data.testDataEnabled !== legacy.enableDummyData) {
      const next = { ...loadedAdmin, data: { ...loadedAdmin.data, testDataEnabled: legacy.enableDummyData } };
      saveAdminSettings(next);
      setAdmin(next);
    }

    // ops
    const opsLS = safeParse<OpsSettings>(localStorage.getItem(OPS_KEY));
    if (opsLS && opsLS.version === 1) setOps({ ...DEFAULT_OPS, ...opsLS });

    // audit
    setAudit(loadAudit());
  }, [mounted]);

  // persist legacy settings
  useEffect(() => {
    if (!mounted) return;
    writeLS(SETTINGS_KEY, settings);

    // ✅ همگام‌سازی: enableDummyData → adminStore.data.testDataEnabled
    // (طبق تصمیم شما: فعلاً روی mockDb اعمال نمی‌کنیم، فقط یکپارچه‌سازی تنظیمات)
    const current = loadAdminSettings();
    if (current?.data?.testDataEnabled !== settings.enableDummyData) {
      const next = { ...current, data: { ...current.data, testDataEnabled: settings.enableDummyData } };
      saveAdminSettings(next);
      setAdmin(next);
    }
  }, [mounted, settings]);

  // persist ops
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(OPS_KEY, JSON.stringify(ops));
  }, [mounted, ops]);

  const raneKeys = useMemo(() => {
    if (!mounted) return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("rane_") || k.includes("rane")) keys.push(k);
    }
    keys.sort();
    return keys;
  }, [mounted, settings, admin, ops]);

  // ------------------------------
  // tools (reset)
  // ------------------------------
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const resetAllRaneStorage = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("rane_") || k.includes("rane")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    const defaultSettings: AdminSettings = {
      enableDummyData: true,
      enableAdminOverrides: true,
      enableTherapistLocalTasks: true,
    };
    writeLS(SETTINGS_KEY, defaultSettings);
    setSettings(defaultSettings);

    // reset store settings
    resetAdminSettings();
    setAdmin(DEFAULT_ADMIN_SETTINGS);

    // reset ops
    localStorage.removeItem(OPS_KEY);
    setOps(DEFAULT_OPS);

    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "reset",
      summary: `پاکسازی کامل انجام شد (${keysToRemove.length} کلید حذف شد)`,
    });
    setAudit(loadAudit());

    setLastActionMsg(`✅ پاکسازی انجام شد (${keysToRemove.length} کلید حذف شد).`);
  };

  const resetOnlyAdminOverrides = () => {
    localStorage.removeItem("rane_admin_booking_overrides_v1");
    setLastActionMsg("✅ Override های رزرو (ادمین) ریست شد.");
    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "reset",
      summary: "ریست Override های رزرو (ادمین)",
    });
    setAudit(loadAudit());
  };

  const resetOnlyTherapistTasks = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("rane_form_tasks_v1_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setLastActionMsg(`✅ تکالیف/فرم‌های درمانگر ریست شد (${keysToRemove.length} کلید حذف شد).`);
    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "reset",
      summary: `ریست تکالیف/فرم‌های درمانگر (${keysToRemove.length})`,
    });
    setAudit(loadAudit());
  };

  const openConfirm = () => {
    setConfirmText("RESET");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmText("");
  };

  // ------------------------------
  // save / export / import (real admin)
  // ------------------------------
  const emailOk = isEmail(admin.clinic.publicEmail) && isEmail(admin.notifications.adminEmail);
  const noShowAmountOk = !admin.policies.noShowFeeEnabled || (admin.policies.noShowFeeAmount ?? 0) >= 0;

  function persistAdmin(next: StoreAdminSettings) {
    setAdmin(next);
    saveAdminSettings(next);
    setLastActionMsg("✅ تنظیمات کلینیک ذخیره شد.");
    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "save",
      summary: "تنظیمات کلینیک/سیاست‌ها ذخیره شد",
    });
    setAudit(loadAudit());
  }

  function persistOps(next: OpsSettings) {
    setOps(next);
    localStorage.setItem(OPS_KEY, JSON.stringify(next));
    setLastActionMsg("✅ تنظیمات عملیاتی رزرو ذخیره شد.");
    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "save",
      summary: "تنظیمات عملیاتی رزرو ذخیره شد",
    });
    setAudit(loadAudit());
  }

  function exportAll() {
    const payload = {
      version: 1,
      exportedAtISO: new Date().toISOString(),
      adminSettings: admin,
      opsSettings: ops,
      legacyToolsSettings: settings,
    };
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rane-admin-settings-export.json";
    a.click();
    URL.revokeObjectURL(url);

    setLastActionMsg("✅ خروجی JSON گرفته شد.");
    pushAudit({
      id: uid(),
      atISO: new Date().toISOString(),
      action: "export",
      summary: "خروجی JSON از تنظیمات گرفته شد",
    });
    setAudit(loadAudit());
  }

  function importAll(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const data = safeParse<any>(raw);
      if (!data || typeof data !== "object") {
        setLastActionMsg("⛔ فایل Import نامعتبر است.");
        return;
      }

      const nextAdmin = data.adminSettings as StoreAdminSettings | undefined;
      const nextOps = data.opsSettings as OpsSettings | undefined;
      const nextLegacy = data.legacyToolsSettings as AdminSettings | undefined;

      if (nextAdmin && nextAdmin.version === 1) {
        const merged = { ...DEFAULT_ADMIN_SETTINGS, ...nextAdmin };
        saveAdminSettings(merged);
        setAdmin(merged);
      }

      if (nextOps && nextOps.version === 1) {
        const mergedOps = { ...DEFAULT_OPS, ...nextOps };
        localStorage.setItem(OPS_KEY, JSON.stringify(mergedOps));
        setOps(mergedOps);
      }

      if (nextLegacy) {
        const legacy = normalizeSettings(nextLegacy);
        writeLS(SETTINGS_KEY, legacy);
        setSettings(legacy);
      }

      setLastActionMsg("✅ Import انجام شد.");
      pushAudit({
        id: uid(),
        atISO: new Date().toISOString(),
        action: "import",
        summary: "تنظیمات از فایل وارد شد",
      });
      setAudit(loadAudit());
    };
    reader.readAsText(file);
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl font-bold">تنظیمات ادمین</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            مدیریت کلینیک، سیاست‌های رزرو، تنظیمات عملیاتی، و ابزارهای دیباگ/پاکسازی.
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/panel/admin"
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white/90"
          >
            برگشت
          </Link>

          <button
            type="button"
            onClick={exportAll}
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white/90"
          >
            خروجی JSON
          </button>

          <label className="cursor-pointer rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white/90">
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("clinic")}
          className={[
            "rounded-[16px] border px-4 py-3 text-xs font-bold transition",
            tab === "clinic"
              ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-950"
              : "border-emerald-900/10 bg-white/70 text-emerald-950/70 hover:bg-white/90",
          ].join(" ")}
        >
          تنظیمات کلینیک و رزرو
        </button>

        <button
          type="button"
          onClick={() => setTab("tools")}
          className={[
            "rounded-[16px] border px-4 py-3 text-xs font-bold transition",
            tab === "tools"
              ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-950"
              : "border-emerald-900/10 bg-white/70 text-emerald-950/70 hover:bg-white/90",
          ].join(" ")}
        >
          ابزارها و پاکسازی
        </button>
      </div>

      {lastActionMsg ? (
        <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/70">
          {lastActionMsg}
        </div>
      ) : null}

      {!emailOk ? (
        <div className="rounded-[16px] border border-amber-900/10 bg-amber-50/70 px-4 py-3 text-xs font-bold text-amber-900/80">
          فرمت ایمیل‌ها را بررسی کن (ایمیل عمومی یا ایمیل مدیر نامعتبر است).
        </div>
      ) : null}

      {!noShowAmountOk ? (
        <div className="rounded-[16px] border border-amber-900/10 bg-amber-50/70 px-4 py-3 text-xs font-bold text-amber-900/80">
          مبلغ جریمه عدم حضور نامعتبر است.
        </div>
      ) : null}

      {tab === "clinic" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <Card title="مشخصات کلینیک" desc="اطلاعاتی که در بخش‌های عمومی/رزرو/فاکتور استفاده می‌شود.">
              <div className="grid gap-3">
                <div>
                  <FieldLabel>نام کلینیک</FieldLabel>
                  <input
                    value={admin.clinic.clinicName}
                    onChange={(e) =>
                      persistAdmin({ ...admin, clinic: { ...admin.clinic, clinicName: e.target.value } })
                    }
                    className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                    placeholder="مثلاً: کلینیک تخصصی رانه"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <FieldLabel>تلفن عمومی</FieldLabel>
                    <input
                      value={admin.clinic.publicPhone}
                      onChange={(e) =>
                        persistAdmin({ ...admin, clinic: { ...admin.clinic, publicPhone: e.target.value } })
                      }
                      className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                      placeholder="051-xxxxxxx"
                    />
                  </div>
                  <div>
                    <FieldLabel>ایمیل عمومی</FieldLabel>
                    <input
                      value={admin.clinic.publicEmail}
                      onChange={(e) =>
                        persistAdmin({ ...admin, clinic: { ...admin.clinic, publicEmail: e.target.value } })
                      }
                      className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                      placeholder="info@clinic.ir"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>آدرس</FieldLabel>
                  <textarea
                    value={admin.clinic.address}
                    onChange={(e) =>
                      persistAdmin({ ...admin, clinic: { ...admin.clinic, address: e.target.value } })
                    }
                    className="mt-1 min-h-[90px] w-full resize-none rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                    placeholder="آدرس کامل کلینیک"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <FieldLabel>شهر</FieldLabel>
                    <input
                      value={admin.clinic.city}
                      onChange={(e) => persistAdmin({ ...admin, clinic: { ...admin.clinic, city: e.target.value } })}
                      className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                      placeholder="مشهد"
                    />
                  </div>
                  <div>
                    <FieldLabel>منطقه زمانی</FieldLabel>
                    <input
                      value={admin.clinic.timezone}
                      onChange={(e) =>
                        persistAdmin({ ...admin, clinic: { ...admin.clinic, timezone: e.target.value } })
                      }
                      className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                      placeholder="Asia/Tehran"
                    />
                    <HelpText>برای گزارش‌ها و زمان‌بندی رزروها.</HelpText>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="سیاست‌ها و قوانین رزرو" desc="لغو، عدم حضور و الزامات جلسه اول.">
              <div className="grid gap-3">
                <div>
                  <FieldLabel>حداقل زمان لغو قبل از جلسه</FieldLabel>
                  <select
                    value={admin.policies.cancellationHours}
                    onChange={(e) =>
                      persistAdmin({
                        ...admin,
                        policies: { ...admin.policies, cancellationHours: Number(e.target.value) as any },
                      })
                    }
                    className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                  >
                    {[1, 3, 6, 12, 24, 48].map((h) => (
                      <option key={h} value={h}>
                        {h} ساعت
                      </option>
                    ))}
                  </select>
                  <HelpText>در فاز واقعی روی قوانین رزرو اعمال می‌شود.</HelpText>
                </div>

                <SwitchRow
                  label="فعال‌سازی جریمه عدم حضور"
                  checked={admin.policies.noShowFeeEnabled}
                  onChange={(v) => persistAdmin({ ...admin, policies: { ...admin.policies, noShowFeeEnabled: v } })}
                />

                <div>
                  <FieldLabel>مبلغ جریمه عدم حضور (تومان)</FieldLabel>
                  <input
                    inputMode="numeric"
                    value={String(admin.policies.noShowFeeAmount ?? 0)}
                    onChange={(e) => {
                      const n = Number(onlyDigits(e.target.value)) || 0;
                      persistAdmin({ ...admin, policies: { ...admin.policies, noShowFeeAmount: n } });
                    }}
                    disabled={!admin.policies.noShowFeeEnabled}
                    className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none disabled:opacity-60"
                    placeholder="مثلاً 150000"
                  />
                </div>

                <SwitchRow
                  label="الزام تکمیل Intake برای اولین مراجعه"
                  checked={admin.policies.requireIntakeForFirstVisit}
                  onChange={(v) =>
                    persistAdmin({ ...admin, policies: { ...admin.policies, requireIntakeForFirstVisit: v } })
                  }
                />
              </div>
            </Card>

            <Card title="تنظیمات عملیاتی رزرو" desc="مدت جلسه، بافر، سقف رزرو روزانه و ساعات کاری.">
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <FieldLabel>مدت جلسه</FieldLabel>
                    <select
                      value={ops.sessionMinutes}
                      onChange={(e) => persistOps({ ...ops, sessionMinutes: Number(e.target.value) as any })}
                      className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
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
                      className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
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
                      className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                      placeholder="مثلاً 8"
                    />
                  </div>
                </div>

                <div className="rounded-[18px] border border-emerald-900/10 bg-white/80 p-4">
                  <div className="text-xs font-bold text-emerald-950/75">ساعات کاری کلینیک</div>
                  <HelpText>فعلاً ذخیره می‌شود؛ در فاز واقعی روی رزروها اعمال می‌کنیم.</HelpText>

                  <div className="mt-3 grid gap-2">
                    {ops.workingHours.map((d, idx) => (
                      <div
                        key={d.day}
                        className="grid gap-2 rounded-[16px] border border-emerald-900/10 bg-white/80 p-3 md:grid-cols-12 md:items-center"
                      >
                        <div className="md:col-span-3 text-xs font-bold text-emerald-950/80">{d.day}</div>

                        <div className="md:col-span-3">
                          <SwitchRow
                            label={d.enabled ? "فعال" : "غیرفعال"}
                            checked={d.enabled}
                            onChange={(v) => {
                              const next = [...ops.workingHours];
                              next[idx] = { ...next[idx], enabled: v };
                              persistOps({ ...ops, workingHours: next });
                            }}
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
                            disabled={!d.enabled}
                            className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/85 px-3 py-2 text-sm font-bold outline-none disabled:opacity-60"
                            placeholder="09:00"
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
                            disabled={!d.enabled}
                            className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/85 px-3 py-2 text-sm font-bold outline-none disabled:opacity-60"
                            placeholder="18:00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="اطلاع‌رسانی مدیریتی" desc="ایمیل مدیر و گزارش‌های روزانه.">
              <div className="grid gap-3">
                <div>
                  <FieldLabel>ایمیل مدیر</FieldLabel>
                  <input
                    value={admin.notifications.adminEmail}
                    onChange={(e) =>
                      persistAdmin({ ...admin, notifications: { ...admin.notifications, adminEmail: e.target.value } })
                    }
                    className="mt-1 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
                    placeholder="admin@clinic.ir"
                  />
                </div>

                <SwitchRow
                  label="ارسال ایمیل هنگام رزرو جدید"
                  checked={admin.notifications.newBookingEmail}
                  onChange={(v) =>
                    persistAdmin({ ...admin, notifications: { ...admin.notifications, newBookingEmail: v } })
                  }
                />
                <SwitchRow
                  label="ارسال پیامک هنگام رزرو جدید (فاز واقعی)"
                  checked={admin.notifications.newBookingSms}
                  onChange={(v) =>
                    persistAdmin({ ...admin, notifications: { ...admin.notifications, newBookingSms: v } })
                  }
                />
                <SwitchRow
                  label="گزارش روزانه"
                  checked={admin.notifications.dailyReport}
                  onChange={(v) => persistAdmin({ ...admin, notifications: { ...admin.notifications, dailyReport: v } })}
                />
              </div>
            </Card>

            <Card title="امنیت و دسترسی‌ها" desc="سیاست‌های دسترسی (فعلاً ذخیره‌سازی؛ اعمال واقعی مرحله بعد).">
              <div className="grid gap-2">
                <SwitchRow
                  label="اجبار رمز عبور قوی (سیاست)"
                  checked={admin.security.enforceStrongPasswords}
                  onChange={(v) => persistAdmin({ ...admin, security: { ...admin.security, enforceStrongPasswords: v } })}
                />
                <SwitchRow
                  label="درمانگر اجازه ویرایش پروفایل خودش را داشته باشد"
                  checked={admin.security.allowTherapistSelfEdit}
                  onChange={(v) =>
                    persistAdmin({ ...admin, security: { ...admin.security, allowTherapistSelfEdit: v } })
                  }
                />
                <SwitchRow
                  label="مراجع اجازه ویرایش پروفایل خودش را داشته باشد"
                  checked={admin.security.allowClientSelfEdit}
                  onChange={(v) => persistAdmin({ ...admin, security: { ...admin.security, allowClientSelfEdit: v } })}
                />

                <div className="mt-2 rounded-[18px] border border-emerald-900/10 bg-white/80 p-4">
                  <div className="text-xs font-bold text-emerald-950/75">داده‌های تست (یکپارچه)</div>
                  <HelpText>
                    این گزینه با تنظیمات ابزارهای همین صفحه همگام است. (طبق تصمیم شما فعلاً روی mockDb اعمال نمی‌کنیم)
                  </HelpText>
                  <div className="mt-3">
                    <SwitchRow
                      label={admin.data.testDataEnabled ? "فعال" : "غیرفعال"}
                      checked={admin.data.testDataEnabled}
                      onChange={(v) => {
                        persistAdmin({ ...admin, data: { ...admin.data, testDataEnabled: v } });
                        setSettings((p) => ({ ...p, enableDummyData: v }));
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetAdminSettings();
                    setAdmin(DEFAULT_ADMIN_SETTINGS);

                    localStorage.removeItem(OPS_KEY);
                    setOps(DEFAULT_OPS);

                    // legacy هم ریست
                    const legacy: AdminSettings = {
                      enableDummyData: true,
                      enableAdminOverrides: true,
                      enableTherapistLocalTasks: true,
                    };
                    writeLS(SETTINGS_KEY, legacy);
                    setSettings(legacy);

                    setLastActionMsg("✅ بازنشانی تنظیمات کلینیک انجام شد.");
                    pushAudit({
                      id: uid(),
                      atISO: new Date().toISOString(),
                      action: "reset",
                      summary: "بازنشانی تنظیمات کلینیک/رزرو انجام شد",
                    });
                    setAudit(loadAudit());
                  }}
                  className="mt-2 w-full rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white/90"
                >
                  بازنشانی تنظیمات کلینیک
                </button>
              </div>
            </Card>
          </div>

          <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="text-sm font-bold">گزارش آخرین تغییرات (Audit Log سبک)</div>
            <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">
              برای پیگیری تغییرات مهم تنظیمات.
            </div>

            <div className="mt-4 grid gap-2">
              {!mounted ? (
                <div className="text-xs font-bold text-emerald-950/55">در حال بارگذاری…</div>
              ) : audit.length === 0 ? (
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/55">
                  هنوز تغییری ثبت نشده است.
                </div>
              ) : (
                audit.slice(0, 12).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3"
                  >
                    <div className="text-xs font-bold text-emerald-950/75">{a.summary}</div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-950/50">
                      {new Date(a.atISO).toLocaleString("fa-IR")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Tools / legacy cards (همان صفحه فعلی شما + یکپارچه‌تر) */}
          <div className="grid gap-3 md:grid-cols-3">
            <Card
              title="داده‌های تست (Dummy/Mock)"
              desc="برای توسعه سریع UI/UX. فعلاً به mockDb وصل نمی‌کنیم (طبق تصمیم شما)."
            >
              <SwitchRow
                label="فعال باشد"
                checked={settings.enableDummyData}
                onChange={(v) => setSettings((p) => ({ ...p, enableDummyData: v }))}
              />
              <HelpText>این گزینه با تنظیمات کلینیک همگام شده است.</HelpText>
            </Card>

            <Card
              title="Override های ادمین"
              desc="مثل تغییر وضعیت رزروها در پنل ادمین که فعلاً با localStorage ذخیره می‌شود."
            >
              <SwitchRow
                label="فعال باشد"
                checked={settings.enableAdminOverrides}
                onChange={(v) => setSettings((p) => ({ ...p, enableAdminOverrides: v }))}
              />
              <button
                type="button"
                onClick={resetOnlyAdminOverrides}
                className="mt-4 w-full rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white/90"
              >
                ریست Override های رزرو
              </button>
            </Card>

            <Card
              title="تکالیف/فرم‌های درمانگر"
              desc="داده‌هایی مثل تخصیص فرم‌ها که فعلاً در localStorage ذخیره می‌شوند."
            >
              <SwitchRow
                label="ذخیره محلی فعال باشد"
                checked={settings.enableTherapistLocalTasks}
                onChange={(v) => setSettings((p) => ({ ...p, enableTherapistLocalTasks: v }))}
              />
              <button
                type="button"
                onClick={resetOnlyTherapistTasks}
                className="mt-4 w-full rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white/90"
              >
                ریست تکالیف/فرم‌های درمانگر
              </button>
            </Card>
          </div>

          {/* Storage keys */}
          <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold">کلیدهای ذخیره‌شده مربوط به پروژه</div>
                <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">
                  این لیست برای دیباگ است تا دقیقاً بدانیم چه داده‌هایی در مرورگر ذخیره شده‌اند.
                </div>
              </div>

              <button
                type="button"
                onClick={openConfirm}
                className="rounded-[16px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-rose-500/15"
              >
                پاکسازی کامل داده‌های پروژه (خطرناک)
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {!mounted ? (
                <div className="text-xs font-bold text-emerald-950/55">در حال بارگذاری…</div>
              ) : raneKeys.length === 0 ? (
                <div className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/55">
                  کلیدی پیدا نشد.
                </div>
              ) : (
                raneKeys.map((k) => (
                  <div
                    key={k}
                    className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3"
                  >
                    <div className="text-[11px] font-bold text-emerald-950/70">{prettyKey(k)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 text-[11px] font-bold text-emerald-950/45 leading-6">
              پاکسازی کامل یعنی تمام کلیدهایی که با <span className="font-black">rane_</span> شروع می‌شوند یا شامل{" "}
              <span className="font-black">rane</span> هستند حذف می‌شوند.
            </div>
          </div>
        </>
      )}

      {/* Confirm Modal */}
      {mounted && confirmOpen ? (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeConfirm();
          }}
        >
          <div className="absolute inset-0 bg-black/35" />

          <div className="relative w-full max-w-lg rounded-[22px] border border-emerald-900/10 bg-white/95 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold">تأیید پاکسازی کامل</div>
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-3 py-2 text-xs font-bold hover:bg-white"
              >
                بستن
              </button>
            </div>

            <div className="mt-4 rounded-[18px] border border-rose-500/20 bg-rose-500/10 p-4">
              <div className="text-xs font-bold text-emerald-950/80">⚠️ هشدار</div>
              <div className="mt-2 text-[11px] font-bold text-emerald-950/70 leading-6">
                این کار همه داده‌های تست/override/tokens مربوط به پروژه را از مرورگر پاک می‌کند. برای ادامه، عبارت{" "}
                <span className="font-black">RESET</span> را وارد کنید.
              </div>

              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-3 w-full rounded-[16px] border border-rose-500/20 bg-white/85 px-4 py-3 text-xs font-bold outline-none"
                placeholder="RESET"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                disabled={confirmText.trim().toUpperCase() !== "RESET"}
                onClick={() => {
                  resetAllRaneStorage();
                  closeConfirm();
                }}
                className={[
                  "rounded-[16px] px-4 py-3 text-xs font-bold border",
                  confirmText.trim().toUpperCase() === "RESET"
                    ? "border-rose-500/20 bg-rose-500/15 text-emerald-950 hover:bg-rose-500/20"
                    : "border-emerald-900/10 bg-white/70 text-emerald-950/40 cursor-not-allowed",
                ].join(" ")}
              >
                پاکسازی کامل
              </button>

              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-xs font-bold hover:bg-white/90"
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