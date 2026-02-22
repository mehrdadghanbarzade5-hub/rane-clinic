"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type FooterLink = { label: string; href: string };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-extrabold text-emerald-950 tracking-wide">{children}</div>;
}

function FooterLinkItem({ href, label }: FooterLink) {
  return (
    <Link
      href={href}
      className="text-sm font-bold text-emerald-950/70 hover:text-emerald-950 transition"
    >
      {label}
    </Link>
  );
}

export default function SiteFooter() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "ok" | "err">(null);

  const quickLinks: FooterLink[] = [
    { label: "رزرو جلسه", href: "/book" },
    { label: "درمانگران", href: "/therapists" },
    { label: "اتاق آرامش", href: "/calm-shelter" },
    { label: "رسانه (کتابخانه حال خوب)", href: "/#media" },
  ];

  const clinicLinks: FooterLink[] = [
    { label: "درباره رانه", href: "/about" },
    { label: "راهنمای شروع مسیر", href: "/guide" },
    { label: "سؤالات پرتکرار", href: "/faq" },
    { label: "تماس با ما", href: "/contact" },
  ];

  const legalLinks: FooterLink[] = [
    { label: "حریم خصوصی", href: "/privacy" },
    { label: "شرایط استفاده", href: "/terms" },
    { label: "سیاست کنسلی/تعویق", href: "/policies" },
  ];

  const socialLinks: FooterLink[] = [
    { label: "اینستاگرام", href: "#" },
    { label: "تلگرام", href: "#" },
    { label: "یوتیوب", href: "#" },
  ];

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!v || !v.includes("@")) {
      setStatus("err");
      return;
    }
    setStatus("ok");
    setEmail("");
    setTimeout(() => setStatus(null), 2500);
  };

  return (
    <footer dir="rtl" className="mt-24">
      <div
        className="relative border-t border-emerald-900/10"
        style={{
          background:
            "radial-gradient(1100px 620px at 15% -10%, rgba(16,185,129,0.18), transparent 60%)," +
            "radial-gradient(900px 520px at 85% 10%, rgba(45,212,191,0.16), transparent 55%)," +
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(232,246,241,1))",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />

        <div className="mx-auto max-w-[1200px] px-5 md:px-16 py-14">
          {/* === Top grid === */}
          <div className="grid gap-10 md:grid-cols-12">
            {/* Brand card */}
            <div className="md:col-span-5">
              <div className="rounded-[30px] border border-emerald-900/10 bg-white/55 backdrop-blur-2xl shadow-[0_40px_140px_rgba(0,0,0,0.10)] p-7">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-[150px]">
                    <Image src="/logo.png" alt="RANE" fill className="object-contain" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <div className="text-[14px] font-extrabold tracking-[0.18em] text-emerald-950">
                      RANE
                    </div>
                    <div className="text-[12px] font-bold text-emerald-950/60">Modern Human Tech</div>
                  </div>
                </div>

                <p className="mt-5 text-sm font-bold leading-7 text-emerald-950/72">
                  کلینیک فوق تخصصی روانشناسی رانه — فضایی امن برای رشد، آرامش و درمان، با همراهی تخصصی و
                  محرمانگی.
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] border border-emerald-900/10 bg-white/65 p-4">
                    <div className="text-xs font-extrabold text-emerald-950">تماس</div>
                    <div className="mt-2 text-sm font-bold text-emerald-950/75">09159861183</div>
                    <div className="mt-1 text-sm font-bold text-emerald-950/70">05136073626</div>
                  </div>

                  <div className="rounded-[20px] border border-emerald-900/10 bg-white/65 p-4">
                    <div className="text-xs font-extrabold text-emerald-950">آدرس</div>
                    <div className="mt-2 text-sm font-bold leading-6 text-emerald-950/75">
                      مشهد، کلینیک فوق تخصصی روانشناسی رانه
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <form onSubmit={onSubscribe} className="mt-6">
                  <div className="text-xs font-extrabold text-emerald-950">خبرنامه حال خوب</div>
                  <div className="mt-2 text-[11px] font-bold text-emerald-950/55 leading-6">
                    هفته‌ای یک پیام کوتاه برای آرامش و مهارت‌های مراقبت از خود. (فعلاً Mock)
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ایمیل شما"
                      className="flex-1 rounded-[18px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold outline-none placeholder:text-emerald-950/35"
                    />
                    <button
                      type="submit"
                      className="rounded-[18px] bg-emerald-950 px-4 py-3 text-sm font-extrabold text-white hover:opacity-90"
                    >
                      عضویت
                    </button>
                  </div>

                  {status === "ok" ? (
                    <div className="mt-3 rounded-[18px] border border-emerald-600/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-950/85">
                      ✅ ثبت شد (Mock).
                    </div>
                  ) : null}

                  {status === "err" ? (
                    <div className="mt-3 rounded-[18px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-emerald-950/85">
                      لطفاً یک ایمیل معتبر وارد کنید.
                    </div>
                  ) : null}
                </form>
              </div>
            </div>

            {/* Links */}
            <div className="md:col-span-7">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-[30px] border border-emerald-900/10 bg-white/45 backdrop-blur-2xl p-7 shadow-[0_25px_90px_rgba(0,0,0,0.06)]">
                  <SectionTitle>دسترسی سریع</SectionTitle>
                  <div className="mt-4 grid gap-2">
                    {quickLinks.map((l) => (
                      <FooterLinkItem key={l.label} {...l} />
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-emerald-900/10 bg-white/45 backdrop-blur-2xl p-7 shadow-[0_25px_90px_rgba(0,0,0,0.06)]">
                  <SectionTitle>کلینیک</SectionTitle>
                  <div className="mt-4 grid gap-2">
                    {clinicLinks.map((l) => (
                      <FooterLinkItem key={l.label} {...l} />
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-emerald-900/10 bg-white/45 backdrop-blur-2xl p-7 shadow-[0_25px_90px_rgba(0,0,0,0.06)]">
                  <SectionTitle>قوانین و شبکه‌ها</SectionTitle>

                  <div className="mt-4 grid gap-2">
                    {legalLinks.map((l) => (
                      <FooterLinkItem key={l.label} {...l} />
                    ))}
                  </div>

                  <div className="mt-6 h-px w-full bg-emerald-900/10" />

                  <div className="mt-5 grid gap-2">
                    {socialLinks.map((l) => (
                      <a
                        key={l.label}
                        href={l.href}
                        className="text-sm font-bold text-emerald-950/70 hover:text-emerald-950 transition"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[20px] border border-emerald-900/10 bg-white/60 p-4">
                    <div className="text-xs font-extrabold text-emerald-950">یادآوری محرمانگی</div>
                    <div className="mt-2 text-[11px] font-bold leading-6 text-emerald-950/60">
                      اطلاعات شما محرمانه است. در صورت خطر فوری، با اورژانس/مراکز حمایتی تماس بگیرید.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Trust strip (FULL WIDTH) */}
          <div className="mt-8 rounded-[30px] border border-emerald-900/10 bg-white/45 backdrop-blur-2xl p-7 shadow-[0_25px_90px_rgba(0,0,0,0.06)]">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-emerald-900/10 bg-white/65 p-5">
                <div className="text-xs font-extrabold text-emerald-950">رزرو امن</div>
                <div className="mt-2 text-[11px] font-bold leading-6 text-emerald-950/60">
                  فرایند رزرو و پذیرش با استانداردهای امنیتی (MVP).
                </div>
              </div>

              <div className="rounded-[22px] border border-emerald-900/10 bg-white/65 p-5">
                <div className="text-xs font-extrabold text-emerald-950">پشتیبانی</div>
                <div className="mt-2 text-[11px] font-bold leading-6 text-emerald-950/60">
                  پاسخگویی در ساعات کاری و پیگیری درخواست‌ها.
                </div>
              </div>

              <div className="rounded-[22px] border border-emerald-900/10 bg-white/65 p-5">
                <div className="text-xs font-extrabold text-emerald-950">حریم خصوصی</div>
                <div className="mt-2 text-[11px] font-bold leading-6 text-emerald-950/60">
                  دسترسی کنترل‌شده و محافظت از داده‌های حساس.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-[11px] font-bold text-emerald-950/55">© {year} RANE — تمامی حقوق محفوظ است.</div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-emerald-950/55">
              <span className="rounded-[999px] border border-emerald-900/10 bg-white/60 px-3 py-2">
                نسخه: Prototype
              </span>
              <span className="rounded-[999px] border border-emerald-900/10 bg-white/60 px-3 py-2">
                Test/Dummy Data: فعال (قابل خاموش شدن)
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}