"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("admin@rane.com");
  const [password, setPassword] = useState("1234");
  const [loading, setLoading] = useState(false);

  return (
    <main
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4 py-10 text-emerald-950"
      style={{
        background:
          "radial-gradient(1000px 650px at 20% 18%, rgba(16,185,129,0.10), transparent 60%)," +
          "radial-gradient(900px 600px at 80% 30%, rgba(45, 212, 191, 0.08), transparent 55%)," +
          "linear-gradient(to bottom, rgba(245, 255, 250, 1), rgba(232, 246, 241, 1))",
      }}
    >
      <div className="w-full max-w-[520px] rounded-[28px] border border-emerald-900/10 bg-white/70 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.10)] p-7">
        <div className="text-2xl font-bold">ورود به پنل</div>
        <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
          با اکانت‌های تستی وارد شوید (فعلاً بدون دیتابیس).
        </div>

        <div className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-3 text-sm font-bold outline-none"
            placeholder="ایمیل"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-3 text-sm font-bold outline-none"
            placeholder="رمز"
            type="password"
          />

          <button
            onClick={async () => {
              setLoading(true);
              await signIn("credentials", {
                email,
                password,
                callbackUrl: "/panel",
              });
              setLoading(false);
            }}
            className={[
              "rounded-[18px] px-6 py-3 text-sm font-bold transition",
              loading
                ? "bg-emerald-500/25 text-emerald-950/40 cursor-not-allowed"
                : "bg-emerald-500/90 text-[#050807] hover:opacity-95",
            ].join(" ")}
            disabled={loading}
          >
            ورود
          </button>

          <div className="mt-2 text-xs font-bold text-emerald-950/55 leading-6">
            تست سریع:
            <br />
            admin@rane.com / 1234
            <br />
            therapist@rane.com / 1234
            <br />
            client@rane.com / 1234
          </div>
        </div>
      </div>
    </main>
  );
}
