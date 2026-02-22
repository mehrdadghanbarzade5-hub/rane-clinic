"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SoundKey = "rain" | "ocean" | "ambient";

export default function CalmShelter() {
  const sounds = useMemo(
    () => [
      { key: "rain" as const, label: "باران", src: "/calm/rain.mp3" },
      { key: "ocean" as const, label: "موج دریا", src: "/calm/ocean.mp3" },
      { key: "ambient" as const, label: "محیط آرام", src: "/calm/ambient.mp3" },
    ],
    []
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [sound, setSound] = useState<SoundKey>("rain");
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);

  // تنفس: 4 ثانیه دم + 6 ثانیه بازدم (آرام و لوکس)
  const inhaleSec = 4;
  const exhaleSec = 6;

  // وقتی صدا عوض شد، اگر در حال پخش بود ادامه بده
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.volume = volume;

    if (playing) {
      // برای تعویض نرم‌تر
      el.pause();
      el.load();
      el
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      el.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound]);

  // ولوم
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  // توقف/شروع
  async function togglePlay() {
    const el = audioRef.current;
    if (!el) return;

    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }

    try {
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      window.alert("پخش صدا اجازه داده نشد. یک‌بار روی دکمه پخش کلیک کن.");
    }
  }

  function stopAll() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
  }

  return (
    <section id="calm-shelter" className="py-24">
      <div className="mx-auto max-w-[980px]">
        {/* عنوان */}
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-emerald-900">
            پناهگاه آرامش
          </h3>
          <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600">
            چند دقیقه برای نفس‌کشیدن. بدون عجله. بدون قضاوت.
          </p>
        </div>

        {/* کارت اصلی */}
        <div className="mt-10 rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="p-6 md:p-10">
            {/* متن امن */}
            <div className="mx-auto max-w-[760px] rounded-[22px] border border-zinc-200 bg-zinc-50 p-5 md:p-6">
              <p className="text-base md:text-lg leading-8 font-bold text-emerald-900">
                تو در امنیتی. همین حالا لازم نیست چیزی را حل کنی.
                <br />
                فقط یک نفس آرام… و یک قدم کوچک برای خودت.
              </p>
            </div>

            {/* کنترل‌ها */}
            <div className="mt-8 grid gap-6 md:grid-cols-12 md:items-center">
              {/* انتخاب صدا */}
              <div className="md:col-span-7">
                <div className="text-sm font-semibold text-zinc-700">
                  انتخاب صدای محیطی
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {sounds.map((s) => {
                    const active = s.key === sound;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSound(s.key)}
                        className={[
                          "rounded-[16px] border px-4 py-2 text-sm font-semibold transition",
                          active
                            ? "border-emerald-300 bg-white text-emerald-900 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                        ].join(" ")}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* پخش/توقف */}
              <div className="md:col-span-5">
                <div className="flex flex-wrap items-center justify-start md:justify-end gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="rounded-[14px] bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {playing ? "توقف موقت" : "شروع صدا"}
                  </button>

                  <button
                    type="button"
                    onClick={stopAll}
                    className="rounded-[14px] border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-zinc-50"
                  >
                    توقف کامل
                  </button>
                </div>

                {/* ولوم */}
                <div className="mt-4 flex items-center gap-3 md:justify-end">
                  <span className="text-sm text-zinc-600">صدا</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-40"
                    aria-label="Volume"
                  />
                </div>
              </div>
            </div>

            {/* تنفس */}
            <div className="mt-10">
              <div className="text-sm font-semibold text-zinc-700 text-center">
                تنفس هدایت‌شده (آرام)
              </div>

              <div className="mt-4 flex justify-center">
                <div className="relative w-full max-w-[520px] rounded-[22px] border border-zinc-200 bg-white p-6 text-center">
                  <div className="text-emerald-900 font-bold text-lg">
                    دم {inhaleSec} ثانیه • بازدم {exhaleSec} ثانیه
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">
                    یک دم آرام… سپس بازدم طولانی‌تر.  
                    اگر دوست داشتی، این ریتم را ۳ چرخه تکرار کن.
                  </p>

                  {/* موج خیلی ظریف */}
                  <div className="mt-6 flex justify-center">
                    <div className="relative h-[2px] w-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/45 to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* عنصر پخش‌کننده صدا */}
            <audio ref={audioRef} loop src={sounds.find((s) => s.key === sound)?.src} />
          </div>
        </div>
      </div>
    </section>
  );
}
