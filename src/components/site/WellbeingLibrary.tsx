"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PodcastItem = {
  id: string;
  title: string;
  description: string;
  durationMin?: number;
  src: string; // public/audio/...
  isDummy?: boolean;
  tag: string;
  mood: "calm" | "insight" | "skill";
};

const PODCASTS: PodcastItem[] = [
  {
    id: "p-grief",
    title: "سوگ‌های نادیده گرفته شده",
    description: "وقتی سوگ دیده نمی‌شود؛ بدن و روان چه واکنشی نشان می‌دهند و چطور ترمیم شروع می‌شود؟",
    durationMin: 12,
    src: "/audio/sogha-ye-nadide-gerefte-shode.mp3",
    isDummy: true,
    tag: "سوگ",
    mood: "insight",
  },
  {
    id: "p-self-sabotage",
    title: "خود تخریبی پنهان",
    description: "الگوهای خاموشی که ما را از اهدافمان دور می‌کند و راه‌های شکستن چرخه.",
    durationMin: 11,
    src: "/audio/khod-takhribi-penhan.mp3",
    isDummy: true,
    tag: "الگوها",
    mood: "insight",
  },
  {
    id: "p-toxic-perfectionism",
    title: "کمال‌گرایی سمی",
    description: "وقتی استانداردهای غیرواقعی، عزت‌نفس را می‌بلعند؛ مرز کمال‌گرایی سالم کجاست؟",
    durationMin: 10,
    src: "/audio/kamal-garaei-somi.mp3",
    isDummy: true,
    tag: "کمال‌گرایی",
    mood: "insight",
  },
  {
    id: "p-why-hate-kids",
    title: "چرا از بچه‌هامون متنفریم؟",
    description: "خستگی والدگری، فشار روانی و راه‌های بازسازی رابطه با کودک و خود.",
    durationMin: 14,
    src: "/audio/chera-az-bachehamoon-motanaferim.mp3",
    isDummy: true,
    tag: "والدگری",
    mood: "insight",
  },
  {
    id: "p-fomo-compare",
    title: "فومو و سندرم مقایسه",
    description: "چرا شبکه‌های اجتماعی اضطراب را زیاد می‌کنند و چطور چرخه مقایسه را متوقف کنیم؟",
    durationMin: 9,
    src: "/audio/fomo-va-sandrom-moghayese.mp3",
    isDummy: true,
    tag: "شبکه‌های اجتماعی",
    mood: "insight",
  },
  {
    id: "p-say-no",
    title: "مهارت نه گفتن بدون عذاب وجدان",
    description: "نه گفتن محترمانه، بدون درگیری درونی؛ تکنیک‌های عملی و جمله‌های آماده.",
    durationMin: 13,
    src: "/audio/nah-goftan-bedoon-azab-vojdan.mp3",
    isDummy: true,
    tag: "مهارت",
    mood: "skill",
  },
  {
    id: "p-procrastination",
    title: "اهمال‌کاری وقتی مغز باستانی ما توی دنیای مدرن گیر میکنه",
    description: "چرا شروع سخت است؟ نقش مغز و پاداش فوری، و یک برنامه کوچک برای اقدام.",
    durationMin: 15,
    src: "/audio/ahmal-kari-maghz-bastani.mp3",
    isDummy: true,
    tag: "اقدام",
    mood: "skill",
  },
  {
    id: "p-panic-toolbox",
    title: "جعبه ابزار آرامش، درمان پنیک",
    description: "تمرین‌های سریع برای لحظه پنیک + برنامه کوتاه برای کاهش تکرار حملات.",
    durationMin: 16,
    src: "/audio/jabe-abzar-aramesh-panik.mp3",
    isDummy: true,
    tag: "آرامش",
    mood: "calm",
  },
];

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function useRaneModes() {
  const [modes, setModes] = useState({ isDark: false, isAnxiety: false });

  useEffect(() => {
    const read = () => ({
      isDark: document.documentElement.classList.contains("dark"),
      isAnxiety: document.body.classList.contains("rane-anxiety"),
    });

    setModes(read());

    const obs = new MutationObserver(() => setModes(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => obs.disconnect();
  }, []);

  return modes;
}

function moodLabel(m: PodcastItem["mood"]) {
  if (m === "calm") return "آرامش";
  if (m === "skill") return "مهارت";
  return "بینش";
}

function moodAccent(m: PodcastItem["mood"]) {
  if (m === "calm") return "from-emerald-500/25 via-teal-500/10 to-transparent";
  if (m === "skill") return "from-emerald-600/20 via-lime-500/10 to-transparent";
  return "from-teal-500/20 via-emerald-500/10 to-transparent";
}

export default function WellbeingLibrary() {
  const { isDark, isAnxiety } = useRaneModes();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSec, setProgressSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolume] = useState(0.9);

  const [q, setQ] = useState("");
  const [filterMood, setFilterMood] = useState<PodcastItem["mood"] | "all">("all");

  const activeItem = useMemo(
    () => PODCASTS.find((x) => x.id === activeId) ?? null,
    [activeId]
  );

  const filtered = useMemo(() => {
    const qq = q.trim();
    return PODCASTS.filter((p) => {
      const okMood = filterMood === "all" ? true : p.mood === filterMood;
      const okQ = !qq
        ? true
        : `${p.title} ${p.description} ${p.tag}`.toLowerCase().includes(qq.toLowerCase());
      return okMood && okQ;
    });
  }, [q, filterMood]);

  // init audio element once
  useEffect(() => {
    const el = new Audio();
    el.preload = "metadata";
    el.volume = clamp01(volume);

    const onTime = () => setProgressSec(el.currentTime || 0);
    const onMeta = () => setDurationSec(el.duration || 0);
    const onEnd = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    audioRef.current = el;

    return () => {
      el.pause();
      el.src = "";
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = clamp01(volume);
  }, [volume]);

  function loadAndPlay(item: PodcastItem) {
    const el = audioRef.current;
    if (!el) return;

    if (activeId === item.id) {
      if (el.paused) el.play().catch(() => {});
      else el.pause();
      return;
    }

    setActiveId(item.id);
    setProgressSec(0);
    setDurationSec(0);

    el.pause();
    el.currentTime = 0;
    el.src = item.src;

    el.play().catch(() => {});
  }

  function seekTo(sec: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, sec));
  }

  const wrapBg = isDark
    ? "bg-slate-950/40 border-white/10"
    : "bg-white/55 border-emerald-900/10";

  const textStrong = isDark ? "text-slate-100" : "text-emerald-950";
  const textMute = isDark ? "text-slate-300/80" : "text-emerald-950/60";

  return (
    <section id="media" className="py-28">
      <div className="mx-auto max-w-[1200px]">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-[34px] border p-6 md:p-10 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.10)]">
          {/* background glow */}
          <div
            className={[
              "pointer-events-none absolute inset-0",
              isDark
                ? "bg-[radial-gradient(900px_500px_at_20%_20%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(800px_500px_at_80%_40%,rgba(45,212,191,0.14),transparent_55%),linear-gradient(to_bottom,rgba(2,6,23,0.65),rgba(2,6,23,0.35))]"
                : "bg-[radial-gradient(900px_500px_at_20%_20%,rgba(16,185,129,0.15),transparent_60%),radial-gradient(800px_500px_at_80%_40%,rgba(45,212,191,0.12),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,0.75),rgba(255,255,255,0.50))]",
            ].join(" ")}
          />
          {/* soft grain */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.35)_1px,transparent_0)] [background-size:14px_14px]" />

          <div className="relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <div className={`text-3xl md:text-4xl font-extrabold leading-relaxed ${textStrong}`}>
                  🌱کتابخانه‌ی صوتی حال خوب
                </div>
                <div className={`mt-3 text-sm md:text-base font-bold leading-8 ${textMute}`}>
                  پادکست‌های کوتاه و کاربردی برای آرامش، بینش و مهارت‌های روزمره.
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(["all", "calm", "insight", "skill"] as const).map((m) => {
                    const active = filterMood === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFilterMood(m)}
                        className={[
                          "rounded-[999px] border px-4 py-2 text-xs font-extrabold transition",
                          active
                            ? "border-emerald-600/20 bg-emerald-500/18"
                            : isDark
                            ? "border-white/10 bg-slate-900/35 hover:bg-slate-900/50"
                            : "border-emerald-900/10 bg-white/55 hover:bg-white/75",
                          isDark ? "text-slate-100" : "text-emerald-950",
                        ].join(" ")}
                      >
                        {m === "all" ? "همه" : moodLabel(m as any)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* search */}
              <div className="w-full md:w-[380px]">
                <div className={["rounded-[20px] border p-3", wrapBg].join(" ")}>
                  <div className={`text-[11px] font-bold ${textMute}`}>جستجو</div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="مثلاً: پنیک، کمال‌گرایی، فومو…"
                    className={[
                      "mt-2 w-full rounded-[16px] border px-4 py-3 text-sm font-bold outline-none",
                      isDark
                        ? "border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-300/40"
                        : "border-emerald-900/10 bg-white/65 text-emerald-950 placeholder:text-emerald-950/35",
                    ].join(" ")}
                  />
                </div>
              </div>
            </div>

            {/* Mini player (sticky inside section) */}
            {activeItem ? (
              <div className="mt-8 rounded-[26px] border border-emerald-900/10 bg-white/55 backdrop-blur-2xl p-5 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm md:text-base font-extrabold text-emerald-950">
                      در حال پخش: {activeItem.title}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-950/55">
                      {activeItem.tag} • {moodLabel(activeItem.mood)} {activeItem.isDummy ? " • (Placeholder)" : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const el = audioRef.current;
                        if (!el) return;
                        if (el.paused) el.play().catch(() => {});
                        else el.pause();
                      }}
                      className="rounded-[16px] border border-emerald-600/20 bg-emerald-500/15 px-4 py-2 text-xs font-extrabold text-emerald-950 hover:bg-emerald-500/20"
                    >
                      {isPlaying ? "توقف" : "پخش"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const el = audioRef.current;
                        if (!el) return;
                        el.pause();
                        el.currentTime = 0;
                        setIsPlaying(false);
                      }}
                      className="rounded-[16px] border border-emerald-900/10 bg-white/60 px-4 py-2 text-xs font-extrabold text-emerald-950 hover:bg-white/80"
                    >
                      از ابتدا
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950/55">
                    <span>{formatTime(progressSec)}</span>
                    <span>{formatTime(durationSec)}</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, durationSec || 1)}
                    value={Math.min(durationSec || 0, progressSec)}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="mt-2 w-full accent-emerald-600"
                  />

                  {!isAnxiety ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => seekTo(Math.max(0, progressSec - 15))}
                        className="rounded-[18px] border border-emerald-900/10 bg-white/60 px-4 py-3 text-xs font-extrabold text-emerald-950 hover:bg-white/80"
                      >
                        ۱۵- ثانیه
                      </button>
                      <button
                        type="button"
                        onClick={() => seekTo(Math.min(durationSec || 0, progressSec + 15))}
                        className="rounded-[18px] border border-emerald-900/10 bg-white/60 px-4 py-3 text-xs font-extrabold text-emerald-950 hover:bg-white/80"
                      >
                        ۱۵+ ثانیه
                      </button>
                      <div className="rounded-[18px] border border-emerald-900/10 bg-white/60 px-4 py-3">
                        <div className="text-[11px] font-extrabold text-emerald-950">صدا</div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="mt-2 w-full accent-emerald-600"
                        />
                        <div className="mt-1 text-[10px] font-bold text-emerald-950/55">
                          {Math.round(volume * 100)}٪
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Cards */}
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {filtered.map((p) => {
                const isActive = p.id === activeId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadAndPlay(p)}
                    className={[
                      "group text-right rounded-[26px] border p-5 md:p-6 transition relative overflow-hidden",
                      "shadow-[0_18px_70px_rgba(0,0,0,0.08)] backdrop-blur-2xl",
                      isActive
                        ? "border-emerald-600/25 bg-white/70"
                        : "border-emerald-900/10 bg-white/55 hover:bg-white/70",
                    ].join(" ")}
                  >
                    {/* accent glow */}
                    <div className={["pointer-events-none absolute inset-0 bg-gradient-to-br", moodAccent(p.mood)].join(" ")} />
                    {/* subtle border ring */}
                    <div className="pointer-events-none absolute inset-[10px] rounded-[20px] border border-white/25" />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base md:text-lg font-extrabold text-emerald-950">
                            {p.title}
                          </div>
                          <div className="mt-2 text-xs md:text-sm font-bold leading-7 text-emerald-950/60">
                            {p.description}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <div className="rounded-[999px] border border-emerald-900/10 bg-white/60 px-3 py-1 text-[11px] font-extrabold text-emerald-950/80">
                            {moodLabel(p.mood)}
                          </div>
                          <div className="rounded-[999px] border border-emerald-900/10 bg-white/60 px-3 py-1 text-[11px] font-bold text-emerald-950/70">
                            {p.tag}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-[11px] font-bold text-emerald-950/55">
                          {typeof p.durationMin === "number" ? `حدوداً ${p.durationMin} دقیقه` : "—"}
                          {p.isDummy ? " • فایل تست" : ""}
                        </div>

                        <div
                          className={[
                            "rounded-[16px] px-4 py-2 text-xs font-extrabold border transition",
                            isActive && isPlaying
                              ? "border-emerald-600/25 bg-emerald-500/18"
                              : "border-emerald-900/10 bg-white/65 group-hover:bg-white/85",
                          ].join(" ")}
                        >
                          {isActive && isPlaying ? "در حال پخش" : isActive ? "ادامه" : "پخش"}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className={`mt-10 text-center text-[11px] font-bold leading-6 ${textMute}`}>
              {" "}
              <span className="font-black">اینجا فقط با شنیدن می‌تونی آرامش بیشتر رو تجربه کنی🌱</span>{" "}
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}