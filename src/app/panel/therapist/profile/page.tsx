// src/app/panel/therapist/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type ProfileSettings = {
  displayName: string;
  title: string; // عنوان/سمت
  specialties: string; // رشته‌ای (با کاما جدا)
  sessionFee: string; // عدد/متن
  sessionMode: "online" | "inperson" | "both";
  referralAccepting: boolean;
  notificationsEmail: boolean;
  notificationsSms: boolean;
  bio: string;
  updatedAtISO?: string;
};

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

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function prettyFaDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const DEFAULT_SETTINGS: ProfileSettings = {
  displayName: "درمانگر",
  title: "روانشناس",
  specialties: "اضطراب، افسردگی، کودک و نوجوان",
  sessionFee: "—",
  sessionMode: "both",
  referralAccepting: true,
  notificationsEmail: true,
  notificationsSms: false,
  bio: "—",
  updatedAtISO: undefined,
};

export default function TherapistProfilePage() {
  const { data: session, status } = useSession();

  const email = useMemo(() => {
    return normalizeEmail((session?.user as any)?.email);
  }, [session]);

  const role = useMemo(() => {
    return ((session?.user as any)?.role as string | undefined) ?? "therapist";
  }, [session]);

  const LS_KEY = useMemo(() => {
    return email ? `rane_therapist_profile_v1_${email}` : `rane_therapist_profile_v1_guest`;
  }, [email]);

  const [form, setForm] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [savedAtISO, setSavedAtISO] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // init from LS
  useEffect(() => {
    if (!email) return;
    const fromLS = readLS<ProfileSettings>(LS_KEY);
    if (fromLS) {
      setForm({
        ...DEFAULT_SETTINGS,
        ...fromLS,
      });
      setSavedAtISO(fromLS.updatedAtISO ?? null);
      setDirty(false);
      return;
    }

    // seed based on known prototype accounts (بدون import اضافه)
    const seededName =
      email === "reyhane.afshar@rane.com"
        ? "دکتر ریحانه افشار"
        : email === "amir.noohakhan@rane.com"
        ? "دکتر امیرحسین نوحه‌خوان"
        : "درمانگر";

    const initial: ProfileSettings = {
      ...DEFAULT_SETTINGS,
      displayName: seededName,
      updatedAtISO: undefined,
    };

    setForm(initial);
    setSavedAtISO(null);
    setDirty(false);
  }, [LS_KEY, email]);

  function setField<K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function save() {
    if (!email) return;
    const payload: ProfileSettings = { ...form, updatedAtISO: nowISO() };
    writeLS(LS_KEY, payload);
    setSavedAtISO(payload.updatedAtISO ?? null);
    setDirty(false);
  }

  function reset() {
    if (!email) return;
    const fromLS = readLS<ProfileSettings>(LS_KEY);
    if (fromLS) {
      setForm({ ...DEFAULT_SETTINGS, ...fromLS });
      setSavedAtISO(fromLS.updatedAtISO ?? null);
      setDirty(false);
      return;
    }
    setForm(DEFAULT_SETTINGS);
    setSavedAtISO(null);
    setDirty(false);
  }

  // UI states
  if (status === "loading") {
    return (
      <>
        <div className="text-2xl font-bold">پروفایل من</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          در حال بارگذاری...
        </div>
      </>
    );
  }

  if (!session?.user) {
    return (
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
        <div className="text-sm font-bold">دسترسی محدود</div>
        <div className="mt-2 text-xs font-bold text-emerald-950/55 leading-7">
          برای مشاهده پروفایل باید وارد حساب درمانگر شوید.
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

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold">پروفایل من</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            اطلاعات پایه و تنظیمات حرفه‌ای درمانگر (فعلاً Mock با ذخیره محلی).
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={!dirty}
            className={[
              "rounded-[16px] px-4 py-3 text-sm font-bold border transition",
              dirty
                ? "border-emerald-500/20 bg-emerald-500/90 text-[#050807] hover:opacity-95"
                : "border-emerald-900/10 bg-white/70 text-emerald-950/45 cursor-not-allowed",
            ].join(" ")}
          >
            ذخیره تغییرات
          </button>

          <button
            onClick={reset}
            className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
          >
            بازنشانی
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-4">
        <div className="text-xs font-bold text-emerald-950/55 leading-7">
          آخرین ذخیره: <span className="text-emerald-950/80">{prettyFaDate(savedAtISO ?? undefined)}</span>
          <br />
          ایمیل: <span className="text-emerald-950/80">{email || "—"}</span> • نقش:{" "}
          <span className="text-emerald-950/80">{role}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {/* Account */}
        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
          <div className="text-sm font-bold">حساب</div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">نام نمایشی</div>
              <input
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold outline-none"
                placeholder="مثلاً: دکتر ..."
              />
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">عنوان/سمت</div>
              <input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold outline-none"
                placeholder="مثلاً: روانشناس کودک"
              />
            </div>

            <div className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950/70 leading-7">
              نکته: این بخش فعلاً Mock است و داده‌ها فقط در مرورگر ذخیره می‌شوند.
            </div>
          </div>
        </div>

        {/* Professional Settings */}
        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
          <div className="text-sm font-bold">تنظیمات حرفه‌ای</div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">حوزه‌ها/تخصص‌ها</div>
              <input
                value={form.specialties}
                onChange={(e) => setField("specialties", e.target.value)}
                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold outline-none"
                placeholder="با کاما جدا کن: اضطراب، ..."
              />
              <div className="text-[11px] font-bold text-emerald-950/45 leading-6">
                راهنما: با «،» یا «,» جدا کنید تا بعداً به شکل تگ نمایش بدهیم.
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">تعرفه جلسه</div>
              <input
                value={form.sessionFee}
                onChange={(e) => setField("sessionFee", e.target.value)}
                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold outline-none"
                placeholder="مثلاً: ۷۵۰ هزار تومان"
              />
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-bold text-emerald-950/60">نوع جلسات</div>
              <select
                value={form.sessionMode}
                onChange={(e) => setField("sessionMode", e.target.value as any)}
                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="both">آنلاین و حضوری</option>
                <option value="online">فقط آنلاین</option>
                <option value="inperson">فقط حضوری</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Referral + Notifications + Bio */}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
          <div className="text-sm font-bold">تنظیمات ارجاع</div>

          <div className="mt-4 flex items-start justify-between gap-3 rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3">
            <div>
              <div className="text-xs font-bold">پذیرش ارجاع‌ها</div>
              <div className="mt-1 text-[11px] font-bold text-emerald-950/50 leading-6">
                اگر خاموش باشد، در نسخه‌های بعدی ارجاع‌ها برای شما محدود می‌شود.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setField("referralAccepting", !form.referralAccepting)}
              className={[
                "rounded-[999px] border px-3 py-2 text-xs font-bold transition",
                form.referralAccepting
                  ? "border-emerald-500/20 bg-emerald-500/90 text-[#050807]"
                  : "border-emerald-900/10 bg-white/70 text-emerald-950/70 hover:bg-white/90",
              ].join(" ")}
            >
              {form.referralAccepting ? "روشن" : "خاموش"}
            </button>
          </div>
        </div>

        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
          <div className="text-sm font-bold">اعلان‌ها</div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setField("notificationsEmail", !form.notificationsEmail)}
              className={[
                "flex items-center justify-between rounded-[16px] border px-4 py-3 text-xs font-bold transition",
                form.notificationsEmail
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-950/80"
                  : "border-emerald-900/10 bg-white/70 text-emerald-950/70 hover:bg-white/90",
              ].join(" ")}
            >
              <span>اعلان ایمیلی</span>
              <span className="text-emerald-950/55">{form.notificationsEmail ? "فعال" : "غیرفعال"}</span>
            </button>

            <button
              type="button"
              onClick={() => setField("notificationsSms", !form.notificationsSms)}
              className={[
                "flex items-center justify-between rounded-[16px] border px-4 py-3 text-xs font-bold transition",
                form.notificationsSms
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-950/80"
                  : "border-emerald-900/10 bg-white/70 text-emerald-950/70 hover:bg-white/90",
              ].join(" ")}
            >
              <span>اعلان پیامکی</span>
              <span className="text-emerald-950/55">{form.notificationsSms ? "فعال" : "غیرفعال"}</span>
            </button>

            <div className="text-[11px] font-bold text-emerald-950/45 leading-6">
              فعلاً Mock است و فقط ذخیره محلی انجام می‌شود.
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
          <div className="text-sm font-bold">بیو/یادداشت معرفی</div>
          <div className="mt-2 text-[11px] font-bold text-emerald-950/45 leading-6">
            یک متن کوتاه برای معرفی رویکرد، مخاطب هدف یا سبک درمانی.
          </div>

          <textarea
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            className="mt-3 min-h-[130px] w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-3 py-2 text-xs font-bold outline-none"
            placeholder="مثلاً: رویکرد CBT، تمرکز بر اضطراب..."
          />
        </div>
      </div>
    </>
  );
}
