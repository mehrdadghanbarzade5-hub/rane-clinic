// src/app/panel/client/settings/ClientSettingsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CLIENT_SETTINGS,
  loadClientSettings,
  resetClientSettings,
  saveClientSettings,
  type ClientSettings,
} from "@/components/panel/settings/settingsStore";

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

export default function ClientSettingsClient() {
  // ✅ جلوگیری از Hydration mismatch:
  // - هیچ خواندنی از localStorage داخل render انجام نمی‌دهیم
  const [mounted, setMounted] = useState(false);

  // state اصلی تنظیمات
  const [settings, setSettings] = useState<ClientSettings>(DEFAULT_CLIENT_SETTINGS);

  // baseline: آخرین نسخه ذخیره‌شده‌ای که صفحه با آن شروع کرده
  const [baselineJSON, setBaselineJSON] = useState<string>(() =>
    JSON.stringify(DEFAULT_CLIENT_SETTINGS)
  );

  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);

    const stored = loadClientSettings();
    setSettings(stored);

    // baseline برای محاسبه isDirty
    setBaselineJSON(JSON.stringify(stored));
  }, []);

  const isDirty = useMemo(() => {
    // قبل از mount هیچ چیزی را dirty نشان نده (برای SSR/CSR یکسان)
    if (!mounted) return false;
    return JSON.stringify(settings) !== baselineJSON;
  }, [mounted, settings, baselineJSON]);

  function persist(next: ClientSettings) {
    setSettings(next);
    saveClientSettings(next);
    setSavedAt(Date.now());

    // ✅ baseline را اینجا تغییر نمی‌دهیم تا مفهوم "تغییرات نسبت به آخرین ذخیره صفحه" حفظ شود
    // اگر بخواهیم بعد از ذخیره وضعیت "همه چیز ذخیره است" شود، baseline را هم آپدیت می‌کنیم:
    setBaselineJSON(JSON.stringify(next));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
        <div className="flex flex-col gap-1">
          <div className="text-base font-extrabold text-emerald-950">تنظیمات پنل مراجع</div>
          <div className="text-xs leading-5 text-emerald-950/60">
            پروفایل، ترجیحات (Dark/Anxiety Mode)، اعلان‌ها و امنیت. ذخیره‌سازی فعلاً Mock (پایدار) است.
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-[11px] text-emerald-950/55">
            وضعیت:{" "}
            {isDirty ? (
              <span className="font-bold text-amber-700/90">تغییرات ذخیره نشده</span>
            ) : (
              <span className="font-bold text-emerald-700/90">همه چیز ذخیره است</span>
            )}
            {savedAt ? (
              <span className="mr-2 text-emerald-950/45">
                (آخرین ذخیره: {new Date(savedAt).toLocaleTimeString("fa-IR")})
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              resetClientSettings();
              setSettings(DEFAULT_CLIENT_SETTINGS);
              setBaselineJSON(JSON.stringify(DEFAULT_CLIENT_SETTINGS));
              setSavedAt(Date.now());
            }}
            className="rounded-[14px] border border-emerald-900/10 bg-white/60 px-3 py-2 text-xs font-bold text-emerald-950/75 hover:bg-white/80"
          >
            بازنشانی به حالت پیش‌فرض
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title="پروفایل" desc="اطلاعات ضروری برای پرونده و تماس اضطراری.">
          <div className="grid gap-3">
            <div>
              <FieldLabel>نام و نام خانوادگی</FieldLabel>
              <input
                value={settings.profile.fullName}
                onChange={(e) =>
                  persist({ ...settings, profile: { ...settings.profile, fullName: e.target.value } })
                }
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <FieldLabel>شماره موبایل</FieldLabel>
                <input
                  value={settings.profile.phone}
                  onChange={(e) =>
                    persist({ ...settings, profile: { ...settings.profile, phone: e.target.value } })
                  }
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                  placeholder="09xxxxxxxxx"
                />
              </div>
              <div>
                <FieldLabel>شهر</FieldLabel>
                <input
                  value={settings.profile.city}
                  onChange={(e) =>
                    persist({ ...settings, profile: { ...settings.profile, city: e.target.value } })
                  }
                  className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                  placeholder="مشهد"
                />
              </div>
            </div>

            <div>
              <FieldLabel>تماس اضطراری</FieldLabel>
              <input
                value={settings.profile.emergencyContact}
                onChange={(e) =>
                  persist({ ...settings, profile: { ...settings.profile, emergencyContact: e.target.value } })
                }
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
                placeholder="نام + شماره"
              />
              <HelpText>برای شرایط خاص/بحرانی و هماهنگی‌های ضروری.</HelpText>
            </div>
          </div>
        </Card>

        <Card title="ترجیحات تجربه کاربری" desc="هماهنگ با Anxiety Mode پروژه.">
          <div className="grid gap-3">
            <div>
              <FieldLabel>تم ظاهری</FieldLabel>
              <select
                value={settings.preferences.theme}
                onChange={(e) =>
                  persist({ ...settings, preferences: { ...settings.preferences, theme: e.target.value as any } })
                }
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
              >
                <option value="system">سیستم</option>
                <option value="light">روشن</option>
                <option value="dark">تیره</option>
              </select>
              <HelpText>الان به Theme واقعی وصل شده و روی کل پنل مراجع اعمال می‌شود.</HelpText>
            </div>

            <Switch
              checked={settings.preferences.anxietyMode}
              onChange={(v) => persist({ ...settings, preferences: { ...settings.preferences, anxietyMode: v } })}
              label="فعال‌سازی Anxiety Mode"
            />
          </div>
        </Card>

        <Card title="اعلان‌ها" desc="یادآوری‌ها و پیام‌های مهم مرتبط با جلسات.">
          <div className="grid gap-2">
            <Switch
              checked={settings.notifications.emailReminders}
              onChange={(v) => persist({ ...settings, notifications: { ...settings.notifications, emailReminders: v } })}
              label="یادآوری جلسه با ایمیل"
            />
            <Switch
              checked={settings.notifications.smsReminders}
              onChange={(v) => persist({ ...settings, notifications: { ...settings.notifications, smsReminders: v } })}
              label="یادآوری جلسه با پیامک (فاز واقعی)"
            />
            <Switch
              checked={settings.notifications.weeklyDigest}
              onChange={(v) => persist({ ...settings, notifications: { ...settings.notifications, weeklyDigest: v } })}
              label="خلاصه هفتگی"
            />
            <Switch
              checked={settings.notifications.marketing}
              onChange={(v) => persist({ ...settings, notifications: { ...settings.notifications, marketing: v } })}
              label="پیام‌های اطلاع‌رسانی عمومی (اختیاری)"
            />
          </div>
        </Card>

        <Card title="امنیت" desc="سیاست‌های امنیتی پایه (فعلاً Mock).">
          <div className="grid gap-3">
            <Switch
              checked={settings.security.loginAlerts}
              onChange={(v) => persist({ ...settings, security: { ...settings.security, loginAlerts: v } })}
              label="هشدار ورودهای مشکوک"
            />
            <Switch
              checked={settings.security.twoFactorEnabled}
              onChange={(v) => persist({ ...settings, security: { ...settings.security, twoFactorEnabled: v } })}
              label="ورود دو مرحله‌ای (Mock)"
            />

            <div>
              <FieldLabel>تایم‌اوت جلسه</FieldLabel>
              <select
                value={settings.security.sessionTimeoutMin}
                onChange={(e) =>
                  persist({
                    ...settings,
                    security: { ...settings.security, sessionTimeoutMin: Number(e.target.value) as any },
                  })
                }
                className="mt-1 w-full rounded-[14px] border border-emerald-900/10 bg-white/60 p-3 text-sm outline-none"
              >
                {[15, 30, 60, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} دقیقه
                  </option>
                ))}
              </select>
              <HelpText>در فاز واقعی به سشن/توکن متصل می‌کنیم.</HelpText>
            </div>

            <div className="mt-2 rounded-[14px] border border-emerald-900/10 bg-white/60 p-3">
              <FieldLabel>داده‌های تست (Test/Dummy Data)</FieldLabel>
              <HelpText>برای دمو/آزمایش وجود دارد و هر زمان لازم باشد می‌توانی خاموشش کنی.</HelpText>
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
      </div>
    </div>
  );
}