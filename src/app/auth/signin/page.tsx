"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

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
          فعلاً با اکانت‌های تستی وارد شوید (بدون دیتابیس).
        </div>

        <div className="mt-6 grid gap-3">
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-3 text-sm font-bold outline-none"
            placeholder="ایمیل"
            autoComplete="off"
          />

          <input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded-[18px] border border-emerald-900/10 bg-white/80 px-5 py-3 text-sm font-bold outline-none"
            placeholder="رمز"
            type="password"
            autoComplete="off"
          />

          <button
            onClick={async () => {
              if (loading) return;

              setLoading(true);
              setError(null);

              const cleanEmail = email.trim().toLowerCase();
              const cleanPassword = password;

              const res = await signIn("credentials", {
                email: cleanEmail,
                password: cleanPassword,
                redirect: false,
              });

              setLoading(false);

              // ✅ موفق
              if (res?.ok) {
                router.push("/after-login");
                router.refresh();
                return;
              }

              // ❌ ناموفق
              // NextAuth معمولاً res.error را می‌دهد (مثلاً "CredentialsSignin")
              // ما پیام انسانی نمایش می‌دهیم
              setError("ایمیل یا رمز اشتباه است، یا این کاربر فعلاً دسترسی ندارد.");
            }}
            className={[
              "rounded-[18px] px-6 py-3 text-sm font-bold transition",
              loading
                ? "bg-emerald-500/25 text-emerald-950/40 cursor-not-allowed"
                : "bg-emerald-500/90 text-[#050807] hover:opacity-95",
            ].join(" ")}
            disabled={loading}
          >
            {loading ? "در حال ورود..." : "ورود"}
          </button>

          {/* ✅ پیام خطا */}
          {error ? (
            <div className="mt-1 rounded-[16px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-900/80 leading-6">
              {error}
            </div>
          ) : null}

          <div className="mt-2 text-xs font-bold text-emerald-950/55 leading-6">
            تست:
            <br />
            admin@rane.com / 1234
            <br />
            therapist@rane.com / 1234
            <br />
            client@rane.com / 1234
            <br />
            <span className="text-emerald-950/70">
              درمانگرهای پنل مستقل:
              <br />
              reyhane.afshar@rane.com / 1234
              <br />
              amir.noohakhan@rane.com / 1234
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
