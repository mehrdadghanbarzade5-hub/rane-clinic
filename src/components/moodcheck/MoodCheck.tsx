"use client";

import { useMemo, useState } from "react";

type MoodKey = "calm" | "sad" | "anxious" | "angry" | "numb" | "hopeful";

type MoodItem = {
  key: MoodKey;
  emoji: string;
  label: string;
  supportive: string;
  audioTitle: string;
  isAnxiety?: boolean;
};

export default function MoodCheck() {
  const moods: MoodItem[] = useMemo(
    () => [
      {
        key: "calm",
        emoji: "🙂",
        label: "آرام",
        supportive: "خوبه که این لحظه کمی آرام‌تره. می‌تونی همین حس رو چند دقیقه نگه داری.",
        audioTitle: "🎧 «صدای آرامِ موج»",
      },
      {
        key: "sad",
        emoji: "😔",
        label: "غمگین",
        supportive: "غم می‌تونه سنگین باشه. لازم نیست همین الان همه‌چیز رو درست کنی—فقط دیده شدن کافیه.",
        audioTitle: "🎧 «همراهیِ آرام ۴ دقیقه‌ای»",
      },
      {
        key: "anxious",
        emoji: "😟",
        label: "مضطرب",
        supportive:
          "می‌فهمم… وقتی اضطراب میاد، ذهن دنبال امنیته. همین که اینجا هستی یعنی داری از خودت مراقبت می‌کنی.",
        audioTitle: "🎧 «تنفس آهسته + صدای باران»",
        isAnxiety: true,
      },
      {
        key: "angry",
        emoji: "😡",
        label: "خشمگین",
        supportive: "خشم گاهی مرزهای ما رو یادآوری می‌کنه. اگر دوست داشتی، چند نفس عمیق کمک می‌کنه بدنت آروم‌تر بشه.",
        audioTitle: "🎧 «بازگشت به بدن ۳ دقیقه‌ای»",
      },
      {
        key: "numb",
        emoji: "😐",
        label: "بی‌حس",
        supportive: "بی‌حسی هم یک پیام است. لازم نیست به خودت فشار بیاری—آروم‌آروم برمی‌گردیم به حس کردن.",
        audioTitle: "🎧 «گراندینگ بسیار کوتاه»",
      },
      {
        key: "hopeful",
        emoji: "✨",
        label: "امیدوار",
        supportive: "چه خوب… امید مثل یک نور کوچک عمل می‌کنه. می‌تونی امروز فقط یک قدم کوچک برای خودت برداری.",
        audioTitle: "🎧 «تمرکز آرام ۵ دقیقه‌ای»",
      },
    ],
    []
  );

  const [selected, setSelected] = useState<MoodKey | null>(null);

  const selectedMood = useMemo(() => {
    if (!selected) return null;
    return moods.find((m) => m.key === selected) ?? null;
  }, [selected, moods]);

  function handleAudioSuggestion() {
    // فعلاً چون فایل صوتی واقعی اضافه نشده:
    window.alert("پیشنهاد صوتی ثبت شد. در مرحله کتابخانه صوتی، همین دکمه پخش واقعی خواهد داشت.");
  }

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-[980px]">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-emerald-900">
            امروز چه احساسی داری؟
          </h3>
          <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600">
            هر احساسی که هست، اینجا پذیرفته است.
          </p>
        </div>

        {/* Card */}
        <div className="mt-10 rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="p-6 md:p-10">
            {/* Emoji row */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {moods.map((m) => {
                const isActive = selected === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelected(m.key)}
                    className={[
                      "group inline-flex items-center gap-3 rounded-[18px] border px-4 py-3 transition",
                      "bg-white",
                      isActive
                        ? "border-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                        : "border-zinc-200 hover:border-zinc-300",
                    ].join(" ")}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-sm font-semibold text-emerald-900">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="mx-auto mt-8 h-px w-24 bg-zinc-200/80" />

            {/* Response */}
            {!selectedMood ? (
              <div className="mt-8 text-center">
                <p className="text-sm leading-7 text-zinc-600">
                  یک احساس را انتخاب کن تا یک پیام همدلانه و یک پیشنهاد کوتاه دریافت کنی.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <div className="mx-auto max-w-[720px] rounded-[22px] border border-zinc-200 bg-zinc-50 p-5 md:p-6">
                  <p className="text-base md:text-lg leading-8 text-emerald-900 font-bold">
                    {selectedMood.supportive}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-emerald-900">
                            {selectedMood.audioTitle}
                        </div>
                        <div className="mt-1 text-sm tracking-wide text-zinc-600">
                            پیشنهادی آرام، از کتابخانه حالِ خوب
                        </div>
                    </div>


                    <button
                      type="button"
                      onClick={() => (window.location.href = "/calm-shelter")}
                      className="rounded-[14px] border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-zinc-50"
                    >
                      گوش می‌کنم
                    </button>
                  </div>

                  {selectedMood.isAnxiety ? (
                    <div className="mt-6 rounded-[18px] border border-emerald-200 bg-white p-4">
                      <p className="text-sm leading-7 text-zinc-700">
                        اگر دوست داری، چند دقیقه به <span className="font-semibold text-emerald-900">پناهگاه آرامش</span> بیا —
                        تنفس هدایت‌شده + صدای محیطی.
                      </p>
                      <div className="mt-4">
                        <a
                          href="/calm-shelter"
                          className="inline-flex rounded-[14px] bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                        >
                          رفتن به پناهگاه آرامش
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-sm font-semibold text-zinc-600 hover:text-zinc-800"
                  >
                    انتخاب دوباره
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* فقط برای اینکه لینک اضطراب فعلاً جایی داشته باشد (بعداً با سکشن واقعی جایگزین می‌کنیم) */}
      <div id="calm-shelter" className="h-1" />
    </section>
  );
}
