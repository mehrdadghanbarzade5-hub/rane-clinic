"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type SoundKey = "ambient" | "ocean" | "rain";
type Phase = "inhale" | "hold1" | "exhale" | "hold2";
type BreathState = "idle" | "running" | "paused" | "finished";

const SOUND_SRC: Record<SoundKey, string> = {
  ambient: "/calm/ambient.mp3",
  ocean: "/calm/ocean.mp3",
  rain: "/calm/rain.mp3",
};

const BREATH = { inhale: 4, hold1: 1, exhale: 6, hold2: 1 };
const CYCLE = BREATH.inhale + BREATH.hold1 + BREATH.exhale + BREATH.hold2;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function CalmShelterPage() {
  const searchParams = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---- Audio ----
  const [sound, setSound] = useState<SoundKey>("ambient");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);

  // ---- Breath ----
  const [breathState, setBreathState] = useState<BreathState>("idle");
  const [phase, setPhase] = useState<Phase>("inhale");
  const [t, setT] = useState(0); // seconds in cycle
  const [cycleCount, setCycleCount] = useState(0);
  const totalCycles = 3; // می‌تونی اگر خواستی 2 یا 4 هم کنی

  // متن‌ها (گفتی حذف نشه — این‌ها ثابت‌اند)
  const title = "پناهگاه آرامش";
  const topLine =
    "تو در امنیتی… همین حالا لازم نیست چیزی را حل کنی. فقط یک نفس آرام… و یک قدم کوچک برای خودت.";
  const subtitle =
    "چند دقیقه برای نفس‌کشیدن. بدون عجله. بدون قضاوت.";
  const helperLine =
    "اگر اضطراب داری، همینجا بمان. لازم نیست تنها ازش عبور کنی.";
  const guidance =
    "یک دم آرام… سپس بازدم طولانی‌تر. اگر دوست داشتی، این چرخه را چند بار تکرار کن.";

  // ---- Init: sound from URL ----
  useEffect(() => {
    const s = searchParams.get("sound");
    if (s === "ambient" || s === "ocean" || s === "rain") setSound(s);
  }, [searchParams]);

  // ---- Audio volume ----
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = clamp(volume, 0, 1);
  }, [volume]);

  // ---- Change sound ----
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const wasPlaying = isPlaying;
    el.pause();
    el.load();
    el.volume = clamp(volume, 0, 1);

    if (wasPlaying) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound]);

  async function toggleAudio() {
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await el.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
      alert("برای شروع صدا یک‌بار روی دکمه «شروع صدا» کلیک کن.");
    }
  }

  function stopAudio() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
  }

  // ---- Breath timer: only when running ----
  useEffect(() => {
    if (breathState !== "running") return;

    const id = window.setInterval(() => {
      setT((prev) => {
        const next = prev + 0.1;
        if (next >= CYCLE) {
          // یک چرخه کامل شد
          setCycleCount((c) => {
            const nc = c + 1;
            if (nc >= totalCycles) {
              // تمرین تمام شد
              setBreathState("finished");
            }
            return nc;
          });
          return 0;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(id);
  }, [breathState]);

  // ---- Phase from time ----
  useEffect(() => {
    if (breathState === "finished") return; // بعد از پایان، phase لازم نیست
    if (breathState === "paused" || breathState === "idle") {
      // هیچ
    }

    const x = t;
    if (x < BREATH.inhale) setPhase("inhale");
    else if (x < BREATH.inhale + BREATH.hold1) setPhase("hold1");
    else if (x < BREATH.inhale + BREATH.hold1 + BREATH.exhale) setPhase("exhale");
    else setPhase("hold2");
  }, [t, breathState]);

  // ---- Breath controls ----
  function startBreath() {
    setCycleCount(0);
    setT(0);
    setPhase("inhale");
    setBreathState("running");
  }

  function toggleBreath() {
    if (breathState === "idle" || breathState === "finished") {
      startBreath();
      return;
    }
    if (breathState === "running") setBreathState("paused");
    else if (breathState === "paused") setBreathState("running");
  }

  function resetBreath() {
    setBreathState("idle");
    setCycleCount(0);
    setT(0);
    setPhase("inhale");
  }

  // ---- UI helpers ----
  const phaseLabel =
    breathState === "finished"
      ? "آرام"
      : phase === "inhale"
      ? "دم"
      : phase === "exhale"
      ? "بازدم"
      : "مکث";

  // scale logic (دایره مثل ویدیو بزرگ/کوچک شود؛ بعد از پایان pulse نرم)
  const progress = useMemo(() => {
    if (breathState === "finished") return 0.5;

    if (phase === "inhale") {
      return clamp(t / BREATH.inhale, 0, 1);
    }
    if (phase === "hold1") return 1;
    if (phase === "exhale") {
      const start = BREATH.inhale + BREATH.hold1;
      const x = t - start;
      return 1 - clamp(x / BREATH.exhale, 0, 1);
    }
    return 0; // hold2
  }, [t, phase, breathState]);

  // کلاس انیمیشن دایره
  const circleAnim =
    breathState === "finished"
      ? "animate-softPulse"
      : breathState === "paused"
      ? ""
      : phase === "inhale"
      ? "animate-breathIn"
      : phase === "exhale"
      ? "animate-breathOut"
      : "animate-breathHold";

  // شمارنده‌ی ثانیه‌ی باقی‌مانده در فاز (نمایشی، لوکس)
  const secLeft = useMemo(() => {
    if (breathState === "finished") return 0;
    const x = t;
    if (x < BREATH.inhale) return Math.ceil(BREATH.inhale - x);
    if (x < BREATH.inhale + BREATH.hold1) return Math.ceil(BREATH.inhale + BREATH.hold1 - x);
    if (x < BREATH.inhale + BREATH.hold1 + BREATH.exhale)
      return Math.ceil(BREATH.inhale + BREATH.hold1 + BREATH.exhale - x);
    return Math.ceil(CYCLE - x);
  }, [t, breathState]);

  const containerText = "text-emerald-950";
  const secondaryText = "text-emerald-950/70";

  return (
    <main dir="rtl" className={`min-h-screen ${containerText}`}>
      {/* پس‌زمینه رنگی آرامش‌بخش (نه سفید خشک) */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_800px_at_70%_10%,rgba(16,185,129,0.14),transparent_60%),radial-gradient(900px_700px_at_20%_35%,rgba(14,116,144,0.12),transparent_55%),linear-gradient(to_bottom,rgba(248,250,252,0.92),rgba(240,253,250,0.88))]" />
      {/* هاله‌های متحرک خیلی نرم */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl animate-[float1_12s_ease-in-out_infinite]" />
        <div className="absolute top-44 -left-28 h-80 w-80 rounded-full bg-teal-500/12 blur-3xl animate-[float2_14s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-120px] left-1/3 h-96 w-96 rounded-full bg-emerald-700/10 blur-3xl animate-[float3_16s_ease-in-out_infinite]" />
      </div>

      <div className="mx-auto max-w-[1100px] px-5 md:px-10 pt-10 pb-16">
        {/* هدر کوچک داخل پنل مرکزی + دکمه برگشت فارسی */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-950">{title}</h1>
            <p className={`mt-2 text-sm md:text-base leading-7 ${secondaryText}`}>{subtitle}</p>
          </div>

          <a
            href="/"
            className="rounded-[16px] border border-emerald-900/15 bg-white/55 backdrop-blur-xl px-4 py-2 text-sm font-bold text-emerald-950 hover:bg-white/70"
          >
            بازگشت به صفحه اصلی
          </a>
        </div>

        {/* پنل مرکزی یک‌دست */}
        <section className="mt-8 rounded-[34px] border border-white/60 bg-white/55 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.08)]">
          <div className="px-6 md:px-10 pt-10 md:pt-12 pb-10">
            {/* متن امن (تک خط، حفظ متن) */}
            <div className="mx-auto max-w-[900px] rounded-[26px] border border-emerald-900/10 bg-white/60 px-6 py-5 text-center shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
              <p className="text-[16px] md:text-[18px] leading-[2.1] font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                {topLine}
              </p>
            </div>

            {/* داخل پنل: دو ستون (یک‌دست، بدون باکس‌های شلوغ) */}
            <div className="mt-10 grid gap-10 md:grid-cols-12 md:items-start">
              {/* تنفس (ستون اصلی) */}
              <div className="md:col-span-7">
                <div className="relative overflow-hidden rounded-[30px] border border-emerald-900/10 bg-white/45">
                  {/* پس‌زمینه خیلی ظریف داخل همین بخش */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_0%,rgba(16,185,129,0.14),transparent_70%)]" />
                  <div className="relative p-7 md:p-10">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-emerald-950/70">تمرین تنفس</div>
                      <div className="text-sm font-bold text-emerald-950">
                        {phaseLabel}{breathState === "finished" ? "" : ` • ${secLeft}s`}
                      </div>
                    </div>

                    {/* دایره تنفس */}
                    <div className="mt-8 flex justify-center">
                      <div className="relative h-[270px] w-[270px] md:h-[320px] md:w-[320px]">
                        {/* هاله پشت */}
                        <div className="absolute inset-0 rounded-full bg-emerald-500/12 blur-2xl animate-softGlow" />

                        {/* دایره اصلی */}
                        <div
                          className={[
                            "absolute inset-0 rounded-full border border-emerald-900/15 bg-white/55 shadow-[0_40px_120px_rgba(0,0,0,0.10)] backdrop-blur-xl",
                            circleAnim,
                          ].join(" ")}
                          style={{
                            transform: `scale(${0.86 + progress * 0.24})`,
                            transition:
                              breathState === "paused" ? "none" : "transform 900ms ease-in-out",
                          }}
                        />

                        {/* حلقه داخلی */}
                        <div
                          className="absolute inset-[18px] rounded-full border border-emerald-900/10"
                          style={{
                            transform: `scale(${0.96 + progress * 0.04})`,
                            transition:
                              breathState === "paused" ? "none" : "transform 900ms ease-in-out",
                          }}
                        />

                        {/* متن داخل دایره */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <div className="text-[18px] md:text-[20px] font-bold text-emerald-950/70">
                            {breathState === "finished" ? "تمام شد" : phaseLabel}
                          </div>

                          <div className="mt-2 text-[26px] md:text-[32px] font-bold text-emerald-950">
                            {breathState === "finished" ? "آرام…" : "با من"}
                          </div>

                          <div className="mt-4 h-px w-28 bg-emerald-900/15" />

                          <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button
                              onClick={toggleBreath}
                              className="rounded-[16px] bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                            >
                              {breathState === "running"
                                ? "توقف تمرین"
                                : breathState === "paused"
                                ? "ادامه تمرین"
                                : breathState === "finished"
                                ? "شروع دوباره"
                                : "شروع تمرین"}
                            </button>

                            <button
                              onClick={resetBreath}
                              className="rounded-[16px] border border-emerald-900/15 bg-white/60 px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-white/75"
                            >
                              بازنشانی
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* توضیح (متن حذف نشود) */}
                    <div className="mt-8 text-center">
                      <div className="text-[18px] md:text-[20px] font-bold text-emerald-950">
                        دم {BREATH.inhale} ثانیه • بازدم {BREATH.exhale} ثانیه
                      </div>
                      <p className={`mt-3 text-[14px] md:text-[15px] font-bold leading-8 ${secondaryText}`}>
                        {guidance}
                      </p>
                      <p className={`mt-4 text-[13px] md:text-[14px] font-bold leading-7 ${secondaryText}`}>
                        چرخه انجام‌شده: {cycleCount} از {totalCycles}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* صدا (ستون دوم) */}
              <div className="md:col-span-5">
                <div className="rounded-[30px] border border-emerald-900/10 bg-white/45 p-7 md:p-8">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-emerald-950/70">صدای محیطی</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleAudio}
                        className="rounded-[16px] bg-emerald-900 px-4 py-2 text-[13px] font-bold text-white hover:opacity-90"
                      >
                        {isPlaying ? "توقف صدا" : "شروع صدا"}
                      </button>
                      <button
                        onClick={stopAudio}
                        className="rounded-[16px] border border-emerald-900/15 bg-white/60 px-4 py-2 text-[13px] font-bold hover:bg-white/75"
                      >
                        قطع کامل
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Pill active={sound === "rain"} onClick={() => setSound("rain")} label="باران" />
                    <Pill active={sound === "ocean"} onClick={() => setSound("ocean")} label="موج دریا" />
                    <Pill active={sound === "ambient"} onClick={() => setSound("ambient")} label="محیط آرام" />
                  </div>

                  <div className="mt-6">
                    <div className={`flex items-center justify-between text-[13px] font-bold ${secondaryText}`}>
                      <span>حجم صدا</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="mt-3 w-full accent-emerald-800"
                      aria-label="Volume"
                    />
                  </div>

                  {/* متن همدلانه (حذف نشود) */}
                  <p className={`mt-6 text-[14px] md:text-[15px] font-bold leading-8 ${secondaryText}`}>
                    {helperLine}
                  </p>

                  <audio ref={audioRef} src={SOUND_SRC[sound]} loop preload="auto" />
                </div>

                {/* خط جداکننده ظریف داخل پنل (لوکس) */}
                <div className="mt-8 flex justify-center">
                  <div className="relative h-[2px] w-44 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/45 to-transparent" />
                  </div>
                </div>

                <p className={`mt-6 text-center text-[12px] md:text-[13px] font-bold ${secondaryText}`}>
                  اگر دوست داشتی، بعد از چند نفس آرام می‌توانی به صفحه‌ی اصلی برگردی و مسیرت را ادامه بدهی.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* انیمیشن‌ها */}
      <style jsx global>{`
        @keyframes float1 {
          0% { transform: translate(0px, 0px); }
          50% { transform: translate(-16px, 12px); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes float2 {
          0% { transform: translate(0px, 0px); }
          50% { transform: translate(14px, -10px); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes float3 {
          0% { transform: translate(0px, 0px); }
          50% { transform: translate(-12px, -9px); }
          100% { transform: translate(0px, 0px); }
        }

        @keyframes softGlow {
          0% { opacity: .45; transform: scale(0.98); }
          50% { opacity: .82; transform: scale(1.03); }
          100% { opacity: .45; transform: scale(0.98); }
        }
        .animate-softGlow { animation: softGlow 6s ease-in-out infinite; }

        /* این پالس بعد از پایان تمرین: خیلی نرم، مثل ضربان اما آرام */
        @keyframes softPulse {
          0% { transform: scale(0.98); }
          50% { transform: scale(1.01); }
          100% { transform: scale(0.98); }
        }
        .animate-softPulse { animation: softPulse 2.8s ease-in-out infinite; }

        /* اگر بخواهی phase-based هم داشته باشیم (الان scale با progress انجام میشه، این‌ها فقط برای “حس” کمک می‌کنند) */
        @keyframes breathInFx { 0% { filter: saturate(1.0); } 100% { filter: saturate(1.08); } }
        @keyframes breathOutFx { 0% { filter: saturate(1.08); } 100% { filter: saturate(1.0); } }
        @keyframes breathHoldFx { 0% { filter: saturate(1.05); } 100% { filter: saturate(1.05); } }
        .animate-breathIn { animation: breathInFx ${BREATH.inhale}s ease-in-out infinite; }
        .animate-breathOut { animation: breathOutFx ${BREATH.exhale}s ease-in-out infinite; }
        .animate-breathHold { animation: breathHoldFx 1.2s ease-in-out infinite; }
      `}</style>
    </main>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-[999px] px-4 py-2 text-[13px] font-bold transition",
        active
          ? "bg-emerald-900 text-white"
          : "border border-emerald-900/15 bg-white/55 text-emerald-950 hover:bg-white/75",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
