"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import MoodCheck from "@/components/moodcheck/MoodCheck";
import WellbeingLibrary from "@/components/site/WellbeingLibrary";
import SiteFooter from "@/components/site/SiteFooter";

export default function HomePage() {
  const [videoReady, setVideoReady] = useState(false);

  const scrollToMedia = () => {
    const el = document.getElementById("media");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main dir="rtl" className="min-h-screen bg-white text-emerald-900">
      <div className="mx-auto max-w-[1200px] px-5 md:px-16">
        <header className="sticky top-5 z-50">
          <div>
            <div className="flex items-center justify-between rounded-[20px] border border-zinc-200/60 bg-white/60 px-4 py-3 backdrop-blur-xl shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-[110px] md:h-9 md:w-[125px]">
                  <Image src="/logo.png" alt="RANE" fill priority className="object-contain" />
                </div>

                <div className="hidden md:flex flex-col leading-tight">
                  <span className="text-[13px] font-semibold tracking-[0.22em] text-emerald-900">
                    RANE
                  </span>
                  <span className="text-[12px] md:text-[13px] tracking-wide text-zinc-600">
                    روان سالم • امید • نیروی درون • همدلی
                  </span>
                </div>
              </div>

              <nav className="hidden items-center gap-6 text-sm text-zinc-700 md:flex">
  <a href="#" className="hover:text-zinc-900">خانه</a>
  <a href="/therapists" className="hover:text-zinc-900">درمانگران</a>

  {/* ✅ رسانه: اسکرول نرم به کتابخانه حال خوب */}
  <button
    type="button"
    onClick={scrollToMedia}
    className="hover:text-zinc-900"
  >
    رسانه
  </button>

  {/* ✅ سرگرمی: ورود به صفحه بازی‌ها */}
  <Link href="/fun" className="hover:text-zinc-900">
    سرگرمی
  </Link>

  <a href="/calm-shelter" className="hover:text-zinc-900">اتاق آرامش</a>
</nav>

              <div className="flex items-center gap-2">
                <a
                  href="#"
                  className="rounded-[14px] border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-white"
                >
                  کمک کن مسیرم را پیدا کنم
                </a>
                <Link
                  href="/book"
                  className="rounded-[14px] bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  شروع مسیر
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="pt-24 md:pt-28 pb-16 md:pb-24">
          <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-6 md:order-2">
              <div className="relative h-[380px] md:h-[500px] rounded-[32px] overflow-hidden bg-gradient-to-br from-zinc-100 to-white shadow-[0_28px_80px_rgba(0,0,0,0.10)] border border-white/60">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-white/50 to-transparent" />
                <div className="pointer-events-none absolute inset-[10px] z-10 rounded-[26px] border border-black/5" />

                <div className="absolute inset-0">
                  <video
                    className={`h-full w-full object-contain transition-opacity duration-700 ${
                      videoReady ? "opacity-100" : "opacity-0"
                    }`}
                    src="/hero/hero.mp4"
                    poster="/hero/poster.jpg"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    onCanPlay={() => setVideoReady(true)}
                  />

                  <div
                    className={`absolute inset-0 bg-white transition-opacity duration-700 ${
                      videoReady ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-6 md:order-1">
              <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
                اینجا، رشد از درون آغاز می‌شود.
              </h1>

              <p className="mt-9 max-w-xl text-base md:text-lg leading-8 text-zinc-600">
                فضایی امن برای فهم عمیق‌تر خود، با رویکردی انسانی و تخصصی.
              </p>

              <div className="mt-12 flex flex-wrap gap-3">
                <a
                  href="/book"
                  className="rounded-[14px] bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  شروع مسیر
                </a>

                <a
                  href="/guide"
                  className="rounded-[14px] border border-zinc-200 px-5 py-3 text-sm font-semibold hover:bg-zinc-50"
                >
                  کمک کن مسیرم را پیدا کنم
                </a>

                <button
                  type="button"
                  onClick={scrollToMedia}
                  className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-5 py-3 text-sm font-semibold hover:bg-white"
                >
                  رفتن به کتابخانه‌ی صوتی حال خوب
                </button>
              </div>

              <div className="mt-12 h-px w-40 bg-zinc-200/70" />
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl leading-relaxed font-bold text-emerald-900">
              در رانه، رشد از یک لحظه‌ی امن آغاز می‌شود.
            </h2>

            <p className="mt-8 text-lg leading-9 font-bold text-emerald-900">
              اینجا قرار نیست عجله‌ای باشد.
              <br />
              در رانه، هر مسیر با احترام، محرمانگی و همراهی تخصصی آغاز می‌شود.
            </p>

            <div className="mt-12 flex justify-center">
              <div className="relative h-[2px] w-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <MoodCheck />

        <WellbeingLibrary />
      </div>

      {/* ✅ Footer */}
      <SiteFooter />
    </main>
  );
}