"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Phase = "start" | "how" | "play" | "score";
type Card = { id: string; emoji: string; matched: boolean };

const DUMMY_EMOJIS = ["🫧", "🌿", "🌙", "⭐️", "🍃", "🧠", "🕊️", "💎", "🌸", "🧩", "🫶", "☁️"]; // Dummy/Test set
const SETTINGS = {
  defaultPairs: 8,
  minPairs: 6,
  maxPairs: 12,
  flipLockMsMatch: 260,
  flipLockMsMismatch: 520,
};

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function cryptoRandom() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto;
    if (c?.getRandomValues) {
      const a = new Uint32Array(1);
      c.getRandomValues(a);
      return String(a[0]);
    }
  } catch {
    // ignore
  }
  return String(Math.floor(Math.random() * 1_000_000_000));
}

function buildDeck(pairsCount: number) {
  const pairs = clamp(pairsCount, SETTINGS.minPairs, SETTINGS.maxPairs);
  const emojis = DUMMY_EMOJIS.slice(0, pairs);

  const cards: Card[] = emojis.flatMap((e, idx) => [
    { id: `c-${idx}-a-${cryptoRandom()}`, emoji: e, matched: false },
    { id: `c-${idx}-b-${cryptoRandom()}`, emoji: e, matched: false },
  ]);

  return shuffle(cards);
}

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main dir="rtl" className="min-h-screen text-slate-900">
      <div
        className="min-h-screen"
        style={{
          background:
            "radial-gradient(1200px 760px at 15% 10%, rgba(34,211,238,0.18), transparent 60%)," +
            "radial-gradient(900px 650px at 85% 20%, rgba(168,85,247,0.12), transparent 55%)," +
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(236,249,247,1))",
        }}
      >
        <div className="mx-auto max-w-[980px] px-5 md:px-16 py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{title}</div>
              <div className="mt-2 text-sm font-extrabold text-slate-800 leading-7">{subtitle}</div>
            </div>

            <Link
              href="/fun"
              className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
            >
              برگشت
            </Link>
          </div>

          <div className="mt-6 rounded-[28px] border border-black/10 bg-white/90 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.10)] p-6 text-slate-900">
            {children}
          </div>

          <div className="mt-6 text-xs font-extrabold text-slate-800 leading-6">
            نکته فنی: ایموجی‌ها در این نسخه «داده تست» هستند و به‌سادگی قابل تعویض با آیکن/تصویر اختصاصی شما می‌باشند.
          </div>
        </div>
      </div>
    </main>
  );
}

function GlassInfo({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.08)] text-slate-900">
      <div className="text-sm font-extrabold text-slate-900">{title}</div>
      <ul className="mt-3 space-y-2 text-sm font-extrabold text-slate-800 leading-7">
        {items.map((t, i) => (
          <li key={i}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function MemoryGamePage() {
  const [phase, setPhase] = useState<Phase>("start");

  const [pairsCount, setPairsCount] = useState<number>(SETTINGS.defaultPairs);

  const [deck, setDeck] = useState<Card[]>(() => buildDeck(SETTINGS.defaultPairs));
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);

  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  const [busy, setBusy] = useState(false);

  const allMatched = useMemo(() => deck.length > 0 && deck.every((c) => c.matched), [deck]);

  const reset = (opts?: { newDeck?: boolean; toPhase?: Phase }) => {
    setMoves(0);
    setSeconds(0);
    setOpenIds([]);
    setBusy(false);

    if (opts?.newDeck) {
      setDeck(buildDeck(pairsCount));
    } else {
      setDeck((d) => shuffle(d.map((c) => ({ ...c, matched: false }))));
    }

    if (opts?.toPhase) setPhase(opts.toPhase);
  };

  useEffect(() => {
    if (phase !== "play") {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && allMatched) setPhase("score");
  }, [phase, allMatched]);

  const canFlip = (id: string) => {
    if (phase !== "play") return false;
    if (busy) return false;
    if (openIds.includes(id)) return false;

    const c = deck.find((x) => x.id === id);
    if (!c || c.matched) return false;

    if (openIds.length >= 2) return false;
    return true;
  };

  const flip = (id: string) => {
    if (!canFlip(id)) return;

    const nextOpen = [...openIds, id];
    setOpenIds(nextOpen);

    if (nextOpen.length !== 2) return;

    setBusy(true);
    setMoves((m) => m + 1);

    const [a, b] = nextOpen;
    const ca = deck.find((x) => x.id === a);
    const cb = deck.find((x) => x.id === b);

    if (!ca || !cb) {
      window.setTimeout(() => {
        setOpenIds([]);
        setBusy(false);
      }, SETTINGS.flipLockMsMismatch);
      return;
    }

    const isMatch = ca.emoji === cb.emoji;

    if (isMatch) {
      setDeck((d) => d.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)));
      window.setTimeout(() => {
        setOpenIds([]);
        setBusy(false);
      }, SETTINGS.flipLockMsMatch);
    } else {
      window.setTimeout(() => {
        setOpenIds([]);
        setBusy(false);
      }, SETTINGS.flipLockMsMismatch);
    }
  };

  const cols = useMemo(() => {
    const total = pairsCount * 2;
    if (total <= 16) return 4;
    if (total <= 20) return 5;
    return 6;
  }, [pairsCount]);

  const topStatus = useMemo(() => {
    if (phase === "play") {
      const matched = deck.filter((c) => c.matched).length / 2;
      return `جفت‌های پیدا شده: ${matched} از ${pairsCount}`;
    }
    if (phase === "score") return "تمام شد ✅";
    if (phase === "how") return "راهنما";
    return "آماده شروع";
  }, [phase, deck, pairsCount]);

  return (
    <PageShell title="بازی حافظه" subtitle="کارت‌ها را رو کن، جفت‌ها را پیدا کن؛ هدف: کمترین حرکت + زمان.">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[999px] border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-900">
            حرکت: {moves}
          </span>
          <span className="rounded-[999px] border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-900">
            زمان: {formatTime(seconds)}
          </span>
          <span
            className="rounded-[999px] border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-800"
            aria-live="polite"
          >
            {topStatus}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty */}
          <label className="flex items-center gap-2 rounded-[14px] border border-black/10 bg-white px-3 py-2 text-sm font-extrabold text-slate-900">
            <span className="text-xs font-black text-slate-900">سختی</span>
            <select
              className="bg-transparent outline-none text-sm font-extrabold text-slate-900"
              value={pairsCount}
              onChange={(e) => {
                const v = clamp(Number(e.target.value), SETTINGS.minPairs, SETTINGS.maxPairs);
                setPairsCount(v);
                if (phase !== "play") {
                  setDeck(buildDeck(v));
                  setOpenIds([]);
                  setMoves(0);
                  setSeconds(0);
                }
              }}
              disabled={phase === "play"}
              aria-label="difficulty"
            >
              {Array.from({ length: SETTINGS.maxPairs - SETTINGS.minPairs + 1 }, (_, i) => SETTINGS.minPairs + i).map(
                (n) => (
                  <option key={n} value={n}>
                    {n} جفت
                  </option>
                )
              )}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setPhase("how")}
            className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
          >
            راهنما
          </button>

          <button
            type="button"
            disabled={phase === "play" && busy}
            onClick={() => reset({ newDeck: true, toPhase: "play" })}
            className={[
              "rounded-[14px] px-4 py-2 text-sm font-extrabold transition text-slate-900",
              "border border-teal-500/25 bg-teal-500/18 hover:bg-teal-500/24",
              phase === "play" && busy ? "opacity-80 cursor-not-allowed" : "",
            ].join(" ")}
            aria-disabled={phase === "play" && busy}
          >
            شروع جدید
          </button>

          <button
            type="button"
            disabled={phase !== "play" || busy}
            onClick={() => reset({ newDeck: false, toPhase: "play" })}
            className={[
              "rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white transition",
              phase !== "play" || busy ? "opacity-80 cursor-not-allowed" : "",
            ].join(" ")}
          >
            ریست
          </button>
        </div>
      </div>

      {/* Phases */}
      {phase === "start" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <GlassInfo
            title="شروع سریع"
            items={[
              "هر بار دو کارت را باز کن.",
              "اگر مشابه باشند، جفت می‌شوند و باز می‌مانند.",
              "اگر مشابه نباشند، بسته می‌شوند.",
              "هدف: همه جفت‌ها با کمترین حرکت و زمان.",
            ]}
          />
          <GlassInfo
            title="فایده برای مغز"
            items={[
              "تقویت حافظه کاری و یادسپاری کوتاه‌مدت.",
              "بهبود توجه انتخابی (تمرکز روی الگوها).",
              "تمرین کنترل تکانه (عجله نکردن در انتخاب).",
              "کمک به آرام‌سازی ذهن با ریتم کوتاه و امن.",
            ]}
          />

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPhase("how")}
              className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
            >
              راهنما
            </button>
            
            <Link
              href="/fun/memory"
              className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
            >
              شروع بازی
            </Link>
          </div>
        </div>
      ) : null}

      {phase === "how" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <GlassInfo
            title="راهنمای کامل"
            items={[
              "روی یک کارت کلیک کن تا باز شود.",
              "کارت دوم را انتخاب کن: این یک «حرکت» حساب می‌شود.",
              "اگر جفت شد: قفل می‌شود و جلو می‌روی.",
              "اگر جفت نشد: بعد از لحظه‌ای بسته می‌شود.",
              "برای نتیجه بهتر: الگوها را گروه‌بندی کن (مثلاً گوشه‌ها، سطرها).",
            ]}
          />
          <GlassInfo
            title="پیشنهاد کوتاه (آرامش)"
            items={[
              "اگر استرس داری: ۲ دقیقه بازی کن و توقف.",
              "نفس آرام: یک دم ۴ ثانیه، بازدم ۶ ثانیه.",
              "هدف این بازی رکورد نیست؛ تنظیم ذهن است.",
            ]}
          />
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPhase("start")}
              className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
            >
              برگشت
            </button>
            <button
              type="button"
              onClick={() => reset({ newDeck: true, toPhase: "play" })}
              className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
            >
              شروع
            </button>
          </div>
        </div>
      ) : null}

      {phase === "play" ? (
        <>
          <div
            className="mt-6 grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            role="grid"
            aria-label="memory grid"
          >
            {deck.map((c, idx) => {
              const isOpen = openIds.includes(c.id);
              const faceUp = isOpen || c.matched;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => flip(c.id)}
                  disabled={!canFlip(c.id)}
                  className={[
                    "h-20 md:h-24 rounded-[18px] border font-black text-2xl md:text-3xl transition select-none",
                    "shadow-[0_12px_45px_rgba(0,0,0,0.08)]",
                    faceUp ? "bg-white border-black/10" : "bg-white/80 border-black/10 hover:bg-white",
                    c.matched ? "ring-2 ring-teal-500/25" : "",
                    !canFlip(c.id) && !faceUp ? "opacity-80 cursor-not-allowed" : "",
                    "focus:outline-none focus:ring-2 focus:ring-teal-500/25",
                    "text-slate-900",
                  ].join(" ")}
                  aria-label={`card-${idx + 1}`}
                  aria-pressed={faceUp}
                  role="gridcell"
                >
                  {faceUp ? c.emoji : "•"}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[22px] border border-black/10 bg-white p-5 text-slate-900">
            <div className="text-sm font-extrabold text-slate-900">نکته</div>
            <div className="mt-2 text-sm font-extrabold text-slate-800 leading-7">
              برای بهتر شدن: کارت‌های باز شده را ذهنی دسته‌بندی کن (مثلاً گوشه‌ها/وسط/سطر بالا).
              {busy ? " (در حال بررسی...)" : ""}
            </div>
          </div>
        </>
      ) : null}

      {phase === "score" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <GlassInfo
            title="نتیجه"
            items={[
              "تبریک 🎉 همه جفت‌ها پیدا شد.",
              `سختی: ${pairsCount} جفت`,
              `تعداد حرکت‌ها: ${moves}`,
              `زمان: ${formatTime(seconds)}`,
              "اگر دوست داشتی، دوباره بازی کن و این بار با ریتم آرام‌تر.",
            ]}
          />
          <GlassInfo
            title="فایده‌ای که همین حالا تمرین کردی"
            items={[
              "حافظه کاری + توجه انتخابی.",
              "تصمیم‌گیری بدون عجله.",
              "تنظیم ذهن از طریق یک فعالیت کوتاه و امن.",
            ]}
          />
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => reset({ newDeck: true, toPhase: "play" })}
              className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
            >
              دوباره بازی کن
            </button>
            <button
              type="button"
              onClick={() => reset({ newDeck: true, toPhase: "start" })}
              className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
            >
              صفحه شروع
            </button>
          </div>
        </div>
      ) : null}

      {phase === "play" ? (
        <div className="mt-6 text-xs font-extrabold text-slate-800 leading-6">
          برای تغییر سختی، اول بازی را تمام کن یا «شروع جدید» بزن.
        </div>
      ) : null}
    </PageShell>
  );
}