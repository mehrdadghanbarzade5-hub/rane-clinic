// src/app/after-login/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

import { getTherapistAccountByEmail } from "@/data/mockDb";

export default function AfterLogin() {
  const { data, status } = useSession();

  const role = useMemo(() => {
    return ((data?.user as any)?.role as string | undefined) ?? undefined;
  }, [data]);

  const email = useMemo(() => {
    return typeof (data?.user as any)?.email === "string" ? String((data?.user as any).email) : "";
  }, [data]);

  const therapistAccount = useMemo(() => {
    if (!email) return null;
    return getTherapistAccountByEmail(email);
  }, [email]);

  useEffect(() => {
    if (status !== "authenticated") return;

    if (role === "admin") {
      window.location.href = "/panel/admin";
      return;
    }

    if (role === "client") {
      window.location.href = "/panel/client";
      return;
    }

    if (role === "therapist") {
      // ✅ فقط ۲ درمانگر نمونه اولیه اجازه ورود به پنل مستقل را دارند
      if (therapistAccount) {
        window.location.href = "/panel/therapist";
        return;
      }
      // اگر therapist است ولی نمونه اولیه نیست، همین صفحه پیام هماهنگ نشان می‌دهد
      return;
    }

    window.location.href = "/";
  }, [status, role, therapistAccount]);

  // UI هماهنگ با صفحه ورود (پس‌زمینه + کارت شیشه‌ای)
  const backgroundStyle = {
    background:
      "radial-gradient(1000px 650px at 20% 18%, rgba(16,185,129,0.10), transparent 60%)," +
      "radial-gradient(900px 600px at 80% 30%, rgba(45, 212, 191, 0.08), transparent 55%)," +
      "linear-gradient(to bottom, rgba(245, 255, 250, 1), rgba(232, 246, 241, 1))",
  } as const;

  if (status === "loading") {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4 py-10 text-emerald-950"
        style={backgroundStyle}
      >
        <div className="w-full max-w-[520px] rounded-[28px] border border-emerald-900/10 bg-white/70 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.10)] p-7">
          <div className="text-2xl font-bold">در حال بررسی…</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            لطفاً چند ثانیه صبر کنید.
          </div>
        </div>
      </main>
    );
  }

  if (status !== "authenticated") {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4 py-10 text-emerald-950"
        style={backgroundStyle}
      >
        <div className="w-full max-w-[520px] rounded-[28px] border border-emerald-900/10 bg-white/70 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.10)] p-7">
          <div className="text-2xl font-bold">وارد نشده‌اید</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            برای ورود به پنل، ابتدا وارد حساب شوید.
          </div>

          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="inline-flex rounded-[18px] px-6 py-3 text-sm font-bold bg-emerald-500/90 text-[#050807] hover:opacity-95 transition"
            >
              رفتن به صفحه ورود
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // اگر therapist است ولی نمونه اولیه نیست
  if (role === "therapist" && !therapistAccount) {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4 py-10 text-emerald-950"
        style={backgroundStyle}
      >
        <div className="w-full max-w-[520px] rounded-[28px] border border-emerald-900/10 bg-white/70 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.10)] p-7">
          <div className="text-2xl font-bold">حساب درمانگر فعال نیست</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            در نسخه فعلی، پنل مستقل فقط برای این دو درمانگر فعال است:
            <br />• دکتر ریحانه افشار (reyhane.afshar@rane.com)
            <br />• دکتر امیرحسین نوحه‌خوان (amir.noohakhan@rane.com)
            <br />
            <br />
            شما با این ایمیل وارد شده‌اید:
            <span className="mr-2 text-emerald-950/80">{email || "—"}</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/auth/signin"
              className="rounded-[18px] px-6 py-3 text-sm font-bold bg-emerald-500/90 text-[#050807] hover:opacity-95 transition"
            >
              ورود با حساب دیگر
            </Link>

            <Link
              href="/"
              className="rounded-[18px] border border-emerald-900/10 bg-white/70 px-6 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90 transition"
            >
              بازگشت به سایت
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // حالت انتقال
  return (
    <main
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4 py-10 text-emerald-950"
      style={backgroundStyle}
    >
      <div className="w-full max-w-[520px] rounded-[28px] border border-emerald-900/10 bg-white/70 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.10)] p-7">
        <div className="text-2xl font-bold">در حال انتقال به پنل شما…</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          لطفاً چند لحظه صبر کنید.
        </div>
      </div>
    </main>
  );
}
