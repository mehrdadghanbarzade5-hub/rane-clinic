// src/app/fun/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";

// ✅ کاورهای واقعی داخل پروژه (همان مسیرهایی که گفتی)
import memoryThumb from "./memory/memory.png";
import sliderThumb from "./slider/slider.png";
import mazeThumb from "./maze/maze.png";

type Category = "all" | "memory" | "attention" | "logic" | "relaxation";
type Tone = "ok" | "info" | "warm";

const LS_SETTINGS_KEY = "rane_admin_settings_v1";

const GAMES = [
  {
    slug: "memory",
    title: "حافظه و تطبیق (Memory & Match)",
    desc: "دو کارت را رو کن، جفت‌ها را پیدا کن و با کمترین حرکت بازی را تمام کن.",
    meta: "حافظه کاری • توجه • ۲–۶ دقیقه",
    badge: "حافظه",
    category: "memory",
    tone: "ok" as Tone,
    thumb: memoryThumb,
  },
  {
    slug: "slider",
    title: "پازل اسلایدر ۱۵ (Slider Puzzle)",
    desc: "قطعه‌ها را جابه‌جا کن تا اعداد ۱ تا ۱۵ مرتب شوند و خانه‌ی خالی آخر بماند.",
    meta: "حل مسئله • برنامه‌ریزی • ۳–۱۰ دقیقه",
    badge: "توجه",
    category: "attention",
    tone: "info" as Tone,
    thumb: sliderThumb,
  },
  {
    slug: "maze",
    title: "هزارتو آرام (Maze)",
    desc: "با کلیدهای جهت‌دار از شروع به خروج برس؛ برخورد با دیوارها امتیاز را کم می‌کند.",
    meta: "توجه فضایی • آرام‌سازی • ۱–۵ دقیقه",
    badge: "آرام‌سازی",
    category: "relaxation",
    tone: "warm" as Tone,
    thumb: mazeThumb,
  },
] as const;

type Game = (typeof GAMES)[number];

function cn(...x: Array<string | false | null | undefined>) {
  return x.filter(Boolean).join(" ");
}

const TEXT = {
  title: "text-emerald-950",
  strong: "text-emerald-950",
  body: "text-emerald-900",
  subtle: "text-emerald-800",
  micro: "text-emerald-800",
} as const;

function toneKit(t: Tone) {
  // ✅ همه در طیف سبز/تیل (بدون متن سفید)
  if (t === "info") {
    return {
      badge: "bg-teal-50 text-teal-950 border-teal-900/15",
      title: "text-teal-950",
      ring: "focus-visible:ring-teal-500/55",
      // ✅ دکمه قابل‌دیدن
      startBtn:
        "bg-teal-200 text-teal-950 border-teal-900/15 hover:bg-teal-300 active:bg-teal-200",
      // accent برای قاب/لاین‌ها
      accentLine: "bg-teal-900/10",
    };
  }
  if (t === "warm") {
    return {
      badge: "bg-emerald-50 text-emerald-950 border-emerald-900/15",
      title: "text-emerald-950",
      ring: "focus-visible:ring-emerald-500/55",
      startBtn:
        "bg-emerald-200 text-emerald-950 border-emerald-900/15 hover:bg-emerald-300 active:bg-emerald-200",
      accentLine: "bg-emerald-900/10",
    };
  }
  return {
    badge: "bg-emerald-50 text-emerald-950 border-emerald-900/15",
    title: "text-emerald-950",
    ring: "focus-visible:ring-emerald-500/55",
    startBtn:
      "bg-emerald-200 text-emerald-950 border-emerald-900/15 hover:bg-emerald-300 active:bg-emerald-200",
    accentLine: "bg-emerald-900/10",
  };
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-emerald-900/10",
        "bg-white/80 backdrop-blur px-3 py-2 text-[11px] font-semibold",
        "shadow-[0_10px_24px_rgba(0,0,0,0.08)]",
        "text-emerald-950"
      )}
    >
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      {children}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full rounded-2xl border border-emerald-900/10 bg-white/80 backdrop-blur p-4",
        "shadow-[0_14px_40px_rgba(0,0,0,0.10)]",
        "transition hover:-translate-y-[1px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/55"
      )}
      aria-pressed={checked}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-right">
          <div className={cn("text-sm font-semibold", TEXT.strong)}>{label}</div>
          {desc ? (
            <div className={cn("mt-1 text-[12px] leading-6 font-medium", TEXT.subtle)}>
              {desc}
            </div>
          ) : null}
        </div>

        <span
          className={cn(
            "relative h-7 w-12 rounded-full border",
            checked ? "border-emerald-900/20 bg-emerald-100" : "border-emerald-900/20 bg-white"
          )}
        >
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full",
              "shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-all duration-200",
              checked ? "right-1 bg-emerald-900" : "right-6 bg-emerald-700"
            )}
          />
        </span>
      </div>
    </button>
  );
}

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  // ✅ فعال: بک‌گراند سبز روشن + متن تیره (بدون سفید)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 px-5 rounded-full text-sm font-semibold transition whitespace-nowrap border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/55",
        active
          ? "bg-emerald-200 text-emerald-950 border-emerald-900/15 shadow-[0_12px_24px_rgba(0,0,0,0.10)]"
          : "bg-white text-emerald-950 border-emerald-900/10 hover:bg-emerald-50 shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
      )}
    >
      {label}
    </button>
  );
}

function ProgressLine({ pct }: { pct: number }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-2 w-[260px] rounded-full bg-emerald-900/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function GameCover({ src, title }: { src: StaticImageData; title: string }) {
  return (
    <div className="w-full overflow-hidden rounded-t-2xl bg-emerald-50">
      <Image
        src={src}
        alt={title}
        width={1200}
        height={675}
        className="h-[160px] w-full object-cover md:h-[170px]"
        priority={false}
      />
      <div className="pointer-events-none -mt-[160px] h-[160px] w-full bg-gradient-to-t from-white/75 via-white/10 to-transparent md:-mt-[170px] md:h-[170px]" />
    </div>
  );
}

function GameCard({ g }: { g: Game }) {
  const t = toneKit(g.tone);

  return (
    <Link
      href={`/fun/${g.slug}`}
      className={cn(
        "block rounded-2xl overflow-hidden bg-white/82 backdrop-blur",
        "border border-emerald-900/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)]",
        "transition hover:-translate-y-[2px] hover:shadow-[0_26px_90px_rgba(0,0,0,0.14)]",
        "focus-visible:outline-none focus-visible:ring-2",
        t.ring
      )}
      aria-label={`شروع بازی ${g.title}`}
    >
      {/* ✅ کاور حتماً اینجاست */}
      <GameCover src={g.thumb} title={g.title} />

      <div className="p-5 text-right">
        <div className="flex items-center justify-between gap-3">
          <div className={cn("text-lg font-semibold", t.title)}>{g.title}</div>
          <span className={cn("text-[11px] font-semibold rounded-full px-3 py-1.5 border", t.badge)}>
            {g.badge}
          </span>
        </div>

        <div className={cn("mt-2 text-sm leading-7 font-medium", TEXT.body)}>{g.desc}</div>
        <div className="mt-3 text-[12px] font-semibold text-emerald-900">{g.meta}</div>

        <div className="mt-4 h-px w-full bg-emerald-900/10" />

        {/* ✅ دکمه شروع واضح */}
        <div className="mt-4 flex items-center justify-center">
          <span
            className={cn(
              "h-10 w-[150px] rounded-full inline-flex items-center justify-center",
              "text-sm font-semibold border transition",
              "shadow-[0_16px_34px_rgba(0,0,0,0.12)]",
              t.startBtn
            )}
          >
            شروع بازی
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FunHubPage() {
  const [anxietyMode, setAnxietyMode] = useState(false);
  const [dummyEnabled, setDummyEnabled] = useState(true);
  const [category, setCategory] = useState<Category>("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { enableDummyData?: boolean };
      if (typeof parsed.enableDummyData === "boolean") setDummyEnabled(parsed.enableDummyData);
    } catch {
      // ignore
    }
  }, []);

  const weekly = useMemo(() => {
    const total = 7;
    const done = dummyEnabled ? 4 : 2;
    const pct = Math.round((done / total) * 100);
    return { total, done, pct };
  }, [dummyEnabled]);

  const filtered = useMemo(() => {
    if (category === "all") return GAMES;
    return GAMES.filter((g) => g.category === category);
  }, [category]);

  const chips = useMemo(
    () => ["راهنمای داخل هر بازی", "کوتاه و امن", "بدون رقابت", dummyEnabled ? "Test/Dummy فعال" : "Test/Dummy غیرفعال"],
    [dummyEnabled]
  );

  return (
    <main
  dir="rtl"
  className="min-h-screen text-emerald-950"
  style={{
    background:
      `
      radial-gradient(1200px 700px at 15% 10%, rgba(22,185,129,0.25), transparent 60%),
      radial-gradient(900px 600px at 85% 15%, rgba(20,184,166,0.15), transparent 65%),
      radial-gradient(900px 500px at 50% 95%, rgba(22,185,129,0.12), transparent 70%),
      linear-gradient(to bottom, #ffffff, #f0fdfa)
      `,
  }}
>
      {/* ✅ بک‌گراند سبز ملایم اما زنده‌تر (بدون شلوغی) */}
      <div className="relative min-h-screen overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(1200px 700px at 18% 10%, rgba(16,185,129,0.22), transparent 62%)," +
              "radial-gradient(950px 560px at 86% 16%, rgba(20,184,166,0.18), transparent 64%)," +
              "radial-gradient(920px 560px at 44% 88%, rgba(16,185,129,0.14), transparent 66%)," +
              "linear-gradient(to bottom, rgba(255,255,255,1), rgba(238,255,249,1))",
          }}
        />
        {/* موج/هاله پایین */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-44 left-1/2 -translate-x-1/2 h-[600px] w-[1400px] rounded-full blur-3xl opacity-75 -z-10"
          style={{
            background:
              "conic-gradient(from 90deg, rgba(16,185,129,0.20), rgba(20,184,166,0.16), rgba(16,185,129,0.20))",
          }}
        />
        {/* نقطه‌های ریز */}
        <div aria-hidden className="pointer-events-none absolute top-28 left-12 h-2 w-2 rounded-full bg-emerald-300/70 -z-10" />
        <div aria-hidden className="pointer-events-none absolute top-52 right-16 h-2 w-2 rounded-full bg-teal-300/70 -z-10" />
        <div aria-hidden className="pointer-events-none absolute top-72 left-28 h-1.5 w-1.5 rounded-full bg-emerald-400/60 -z-10" />

        <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-10">
          {/* Header (سبک‌تر و مرتب‌تر) */}
          <header className="sticky top-4 z-40">
            <div className="rounded-2xl bg-white/80 backdrop-blur border border-emerald-900/10 shadow-[0_10px_28px_rgba(0,0,0,0.08)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/"
                  className={cn(
                    "h-10 px-5 rounded-full inline-flex items-center justify-center",
                    "bg-white border border-emerald-900/10 text-emerald-950 font-semibold",
                    "shadow-[0_10px_24px_rgba(0,0,0,0.08)] hover:bg-emerald-50 transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/55"
                  )}
                >
                  بازگشت به خانه
                </Link>

                <div className="text-right leading-tight">
                  <div className="text-[13px] font-semibold tracking-[0.18em] text-emerald-950">
                    RANE / FUN HUB
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-emerald-800">
                    بازی‌ها و فعالیت‌های شناختی
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="h-8" />

          {/* ✅ دو باکس بالایی (همان ساختار، خلوت‌تر) */}
          <section className="grid gap-6 md:grid-cols-12 md:items-start">
            <div className="md:col-span-7">
              <div className="rounded-3xl bg-white/75 backdrop-blur border border-emerald-900/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-6">
                <h1 className="text-[30px] md:text-[40px] font-semibold text-emerald-950">
                  بازی و سرگرمیِ ذهن
                </h1>
                <p className={cn("mt-3 text-[14px] md:text-[15px] leading-7 font-medium", TEXT.body)}>
                  اینجا قرار نیست رکورد بزنی — فقط چند دقیقه بازیِ سبک برای تمرکز، توقف ذهن شلوغ،
                  و یک حس خوبِ کوتاه.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <Chip key={c}>{c}</Chip>
                  ))}
                </div>

                <div className="mt-6 h-px w-full bg-emerald-900/10" />

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/fun/memory"
                    className="h-10 px-5 rounded-full inline-flex items-center justify-center border border-emerald-900/15 bg-emerald-200 text-emerald-950 font-semibold hover:bg-emerald-300 transition shadow-[0_12px_24px_rgba(0,0,0,0.10)]"
                  >
                    شروع با حافظه
                  </Link>
                  <Link
                    href="/fun/maze"
                    className="h-10 px-5 rounded-full inline-flex items-center justify-center border border-emerald-900/15 bg-teal-200 text-emerald-950 font-semibold hover:bg-teal-300 transition shadow-[0_12px_24px_rgba(0,0,0,0.10)]"
                  >
                    شروع با هزارتو
                  </Link>
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-3xl bg-white/75 backdrop-blur border border-emerald-900/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-6">
                <div className={cn("text-sm font-semibold", TEXT.strong)}>پیشنهاد سریع</div>
                <div className={cn("mt-2 text-sm leading-7 font-medium", TEXT.body)}>
                  یکی را انتخاب کن. اگر خسته شدی یا ذهن سنگین شد، توقف کن. هدف «آرام‌سازی» است نه رقابت.
                </div>

                <div className="mt-4">
                  <Toggle
                    checked={anxietyMode}
                    onChange={setAnxietyMode}
                    label="حالت اضطراب (موشن کمتر، کنتراست امن‌تر)"
                    desc="اگر با حرکت و شلوغی راحت نیستی، این حالت بهتر است."
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-900/10 bg-emerald-50 p-4">
                  <div className="text-[12px] font-semibold text-emerald-950">نکته</div>
                  <div className="mt-1 text-[12px] leading-6 font-medium text-emerald-900">
                    هر وقت خواستی می‌تونی بازی رو متوقف کنی و بری «آرامش» یا «رزرو».
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/media"
                      className="h-10 px-4 rounded-full inline-flex items-center justify-center border border-emerald-900/15 bg-white text-emerald-950 font-semibold hover:bg-emerald-100 transition"
                    >
                      رفتن به آرامش
                    </Link>
                    <Link
                      href="/book"
                      className="h-10 px-4 rounded-full inline-flex items-center justify-center border border-emerald-900/15 bg-emerald-200 text-emerald-950 font-semibold hover:bg-emerald-300 transition"
                    >
                      رزرو/شروع مسیر
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Divider مثل نمونه */}
          <div className="mt-10 h-px w-full bg-emerald-900/10" />

          {/* Tabs + Progress */}
          <section className="mt-8 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-emerald-800">
                پیشرفت هفتگی:{" "}
                <span className="text-emerald-950">
                  <span dir="ltr">
                    {weekly.done} / {weekly.total}
                  </span>{" "}
                  بازی تکمیل‌شده
                </span>
              </div>
              <ProgressLine pct={weekly.pct} />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto">
              <Tab active={category === "all"} label="همه" onClick={() => setCategory("all")} />
              <Tab active={category === "memory"} label="حافظه" onClick={() => setCategory("memory")} />
              <Tab active={category === "attention"} label="توجه" onClick={() => setCategory("attention")} />
              <Tab active={category === "logic"} label="منطق" onClick={() => setCategory("logic")} />
              <Tab active={category === "relaxation"} label="آرام‌سازی" onClick={() => setCategory("relaxation")} />
            </div>
          </section>

          {/* Cards */}
          <section className="mt-8 grid gap-6 md:grid-cols-3">
            {filtered.map((g) => (
              <GameCard key={g.slug} g={g} />
            ))}
          </section>

          {/* CTA */}
          <section className="mt-10 rounded-3xl overflow-hidden border border-emerald-900/10 shadow-[0_18px_70px_rgba(0,0,0,0.10)] bg-white/80 backdrop-blur">
            <div
              className="p-10 text-center"
              style={{
                background:
                  "radial-gradient(900px 300px at 20% 10%, rgba(16,185,129,0.20), transparent 60%)," +
                  "radial-gradient(900px 300px at 85% 20%, rgba(20,184,166,0.16), transparent 60%)," +
                  "radial-gradient(900px 300px at 40% 95%, rgba(16,185,129,0.16), transparent 60%)",
              }}
            >
              <div className="text-[22px] md:text-[26px] font-semibold text-emerald-950">
                هر روز ذهن‌ات را فعال نگه دار!
              </div>
              <div className={cn("mt-3 text-[14px] md:text-[15px] leading-7 font-medium", TEXT.body)}>
                تمرین‌های کوتاه روزانه برای بهبود سلامت شناختی. قدم‌های کوچک می‌تواند تغییر بزرگ بسازد.
              </div>

              <div className="mt-6 flex items-center justify-center">
                <Link
                  href="/fun/memory"
                  className="h-11 px-8 rounded-full inline-flex items-center justify-center border border-emerald-900/15 bg-emerald-200 text-emerald-950 font-semibold hover:bg-emerald-300 transition shadow-[0_16px_38px_rgba(0,0,0,0.12)]"
                >
                  همین الان شروع کن
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-12 border-t border-emerald-900/10 pt-10">
            <div className="grid gap-10 md:grid-cols-4 text-right">
              <div>
                <div className={cn("text-sm font-semibold", TEXT.strong)}>درباره ما</div>
                <div className={cn("mt-3 space-y-2 text-sm font-medium", TEXT.body)}>
                  <div>تیم ما</div>
                  <div>رویکرد</div>
                </div>
              </div>

              <div>
                <div className={cn("text-sm font-semibold", TEXT.strong)}>خدمات</div>
                <div className={cn("mt-3 space-y-2 text-sm font-medium", TEXT.body)}>
                  <div>کلینیک</div>
                  <div>رزرو</div>
                </div>
              </div>

              <div>
                <div className={cn("text-sm font-semibold", TEXT.strong)}>منابع</div>
                <div className={cn("mt-3 space-y-2 text-sm font-medium", TEXT.body)}>
                  <div>سؤالات متداول</div>
                  <div>رسانه</div>
                  <div>پشتیبانی</div>
                  <div>حریم خصوصی</div>
                </div>
              </div>

              <div>
                <div className={cn("text-sm font-semibold", TEXT.strong)}>میانبر</div>
                <div className={cn("mt-3 space-y-2 text-sm font-medium", TEXT.body)}>
                  <div>
                    <Link className="hover:underline" href="/media">
                      رفتن به آرامش
                    </Link>
                  </div>
                  <div>
                    <Link className="hover:underline" href="/book">
                      رزرو/شروع مسیر
                    </Link>
                  </div>
                  <div className="text-emerald-900 font-semibold">
                    {dummyEnabled ? "Test/Dummy فعال" : "Test/Dummy غیرفعال"}
                  </div>
                </div>
              </div>
            </div>

            <div className={cn("mt-8 pb-6 text-center text-xs font-semibold", TEXT.subtle)}>
              © RANE Clinic — Fun Hub (Prototype)
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}