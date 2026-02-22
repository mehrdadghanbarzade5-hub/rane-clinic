"use client";

import { useEffect, useMemo, useState } from "react";
import { THERAPISTS, Therapist } from "@/data/therapists";
import Link from "next/link";
type Age = "child" | "adult";
type Topic = "anxiety" | "relationships" | "lowMood" | "parenting";
type Urgency = "normal" | "high";

export default function GuidePage() {
  const [age, setAge] = useState<Age | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [urgency, setUrgency] = useState<Urgency | null>(null);
  const [done, setDone] = useState(false);

  // اگر کاربر بعد از دیدن نتیجه، جواب‌ها رو تغییر داد، برگردیم به حالت سوال‌ها
  useEffect(() => {
    if (done) setDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age, topic, urgency]);

  function canFinish() {
    return Boolean(age && topic && urgency);
  }

  const result = useMemo(() => {
    if (!done || !age || !topic || !urgency) return null;

    const list = Array.isArray(THERAPISTS) ? THERAPISTS : [];
    if (list.length === 0) {
      return {
        top2: [],
        urgencyNote: null,
        emptyNote: "در حال حاضر لیست درمانگران بارگذاری نشده یا خالی است.",
      };
    }

    // امتیازدهی ساده (MVP)
    const score = (t: Therapist) => {
      let s = 0;
      const focus = Array.isArray(t.focus) ? t.focus : [];

      // سن
      if (age === "child") {
        if (t.id === "afshar") s += 6;
        else s -= 1;
      } else {
        if (t.id !== "afshar") s += 1;
      }

      // موضوع
      if (topic === "anxiety")
        s += focus.includes("اضطراب") || focus.includes("استرس") ? 5 : 0;

      if (topic === "relationships")
        s += focus.includes("روابط") || focus.includes("مرزبندی") ? 5 : 0;

      if (topic === "lowMood")
        s += focus.includes("خلق پایین") || focus.includes("بی‌انگیزگی") ? 5 : 0;

      if (topic === "parenting")
        s += focus.includes("کودک و نوجوان") || focus.includes("تربیت و رابطه والد-کودک") ? 5 : 0;

      return s;
    };

    const sorted = [...list].sort((a, b) => score(b) - score(a));
    const top2 = sorted.slice(0, 2);

    const reason = (t: Therapist) => {
      const reasons: string[] = [];
      const focus = Array.isArray(t.focus) ? t.focus : [];

      if (age === "child" && t.id === "afshar") reasons.push("به‌صورت تخصصی روی کودک و نوجوان تمرکز دارد.");
      if (topic === "anxiety" && (t.id === "mehr" || focus.includes("اضطراب") || focus.includes("استرس")))
        reasons.push("برای کاهش اضطراب/استرس رویکردهای عملی دارد.");
      if (topic === "relationships" && t.id === "nava") reasons.push("برای روابط و مرزبندی مسیر روشن‌تری ارائه می‌دهد.");
      if (topic === "lowMood" && t.id === "soroush") reasons.push("برای خلق پایین و بی‌انگیزگی، برنامه‌ قدم‌به‌قدم دارد.");
      if (topic === "parenting" && t.id === "afshar") reasons.push("برای دغدغه‌های والد-کودک مناسب‌تر است.");

      if (reasons.length === 0) reasons.push("با محوریت همراهی انسانی و تخصصی می‌تواند شروع امنی باشد.");
      return reasons.slice(0, 2);
    };

    return {
      top2: top2.map((t) => ({ t, reasons: reason(t) })),
      urgencyNote:
        urgency === "high"
          ? "اگر احساس می‌کنی حالت خیلی سنگین یا فوری است، بهتر است همزمان با دریافت نوبت، از حمایت فوری/اورژانسی هم استفاده شود."
          : null,
      emptyNote: top2.length === 0 ? "هیچ درمانگری برای پیشنهاد پیدا نشد." : null,
    };
  }, [done, age, topic, urgency]);

  return (
    <main
  dir="rtl"
  className="min-h-screen text-emerald-950"
  onClickCapture={() => console.log("CLICK CAPTURED")}
>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_800px_at_70%_10%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(900px_700px_at_20%_35%,rgba(14,116,144,0.10),transparent_55%),linear-gradient(to_bottom,rgba(248,250,252,0.92),rgba(240,253,250,0.88))]" />

      <div className="mx-auto max-w-[1100px] px-5 md:px-10 py-12">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">کمک کن مسیرم را پیدا کنم</h1>
            <p className="mt-3 text-sm md:text-base font-bold text-emerald-950/70">
              چند سؤال کوتاه. بعد دو پیشنهاد روشن (بدون اجبار).
            </p>
          </div>

          <a
            href="/"
            className="rounded-[16px] border border-emerald-900/15 bg-white/55 backdrop-blur-xl px-4 py-2 text-sm font-bold hover:bg-white/70"
          >
            بازگشت به خانه
          </a>
        </div>

        <div className="mt-10 rounded-[34px] border border-white/60 bg-white/55 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="p-6 md:p-10">
            {!done ? (
              <>
                <StepBlock
                  title="۱) برای چه سنی؟"
                  options={[
                    { key: "child", label: "کودک یا نوجوان" },
                    { key: "adult", label: "بزرگسال" },
                  ]}
                  value={age}
                  onPick={(v) => setAge(v as Age)}
                />

                <Divider />

                <StepBlock
                  title="۲) موضوع اصلی نزدیک‌تر به کدام است؟"
                  options={[
                    { key: "anxiety", label: "اضطراب / استرس" },
                    { key: "relationships", label: "روابط / مرزبندی" },
                    { key: "lowMood", label: "خلق پایین / بی‌انگیزگی" },
                    { key: "parenting", label: "چالش‌های والد-کودک" },
                  ]}
                  value={topic}
                  onPick={(v) => setTopic(v as Topic)}
                />

                <Divider />

                <StepBlock
                  title="۳) شدت فشار الان چطور است؟"
                  options={[
                    { key: "normal", label: "قابل مدیریت" },
                    { key: "high", label: "زیاد و سنگین" },
                  ]}
                  value={urgency}
                  onPick={(v) => setUrgency(v as Urgency)}
                />

                <div className="mt-10 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!canFinish()}
                    onClick={() => setDone(true)}
                    className={`rounded-[16px] px-5 py-3 text-sm font-bold text-white ${
                      canFinish() ? "bg-emerald-900 hover:opacity-90" : "bg-emerald-900/30 cursor-not-allowed"
                    }`}
                  >
                    پیشنهاد بده
                  </button>

                  <Link
  href="/calm-shelter"
  className="rounded-[16px] border border-emerald-900/15 bg-white/60 px-5 py-3 text-sm font-bold hover:bg-white/75"
>
  چند نفس آرام (پناهگاه آرامش)
</Link>
                </div>
              </>
            ) : (
              <>
                <div className="text-xl md:text-2xl font-bold">پیشنهادهای پیشنهادی برای شروع</div>
                <p className="mt-3 text-sm md:text-base font-bold text-emerald-950/70">
                  این پیشنهادها برای شروع هستند؛ اگر خواستی بعداً دقیق‌تر تنظیم می‌کنیم.
                </p>

                {result?.urgencyNote ? (
                  <div className="mt-6 rounded-[22px] border border-emerald-900/12 bg-white/60 p-5 text-sm font-bold text-emerald-950/70 leading-7">
                    {result.urgencyNote}
                  </div>
                ) : null}

                {result?.emptyNote ? (
                  <div className="mt-6 rounded-[22px] border border-emerald-900/12 bg-white/60 p-5 text-sm font-bold text-emerald-950/70 leading-7">
                    {result.emptyNote}
                  </div>
                ) : null}

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {result?.top2.map(({ t, reasons }) => (
                    <div
                      key={t.id}
                      className="rounded-[28px] border border-emerald-900/10 bg-white/60 p-6 shadow-[0_14px_50px_rgba(0,0,0,0.05)]"
                    >
                      <div className="text-xl font-bold">{t.name}</div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/70">{t.title}</div>

                      <div className="mt-5">
                        <div className="text-sm font-bold">چرا این گزینه؟</div>
                        <ul className="mt-2 text-sm leading-7 font-bold text-emerald-950/70 list-disc pr-5">
                          {reasons.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <a
                          href="/therapists"
                          className="rounded-[16px] border border-emerald-900/15 bg-white/60 px-4 py-2 text-sm font-bold hover:bg-white/75"
                        >
                          مشاهده پروفایل‌ها
                        </a>
                        <a
                          href="#"
                          className="rounded-[16px] bg-emerald-900 px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                        >
                          دریافت نوبت (بعداً)
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setDone(false)}
                    className="rounded-[16px] border border-emerald-900/15 bg-white/60 px-5 py-3 text-sm font-bold hover:bg-white/75"
                  >
                    تغییر پاسخ‌ها
                  </button>
                  <a
                    href="/"
                    className="rounded-[16px] bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                  >
                    بازگشت به خانه
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Divider() {
  return <div className="my-8 h-px w-full bg-emerald-900/10" />;
}

function StepBlock({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: { key: string; label: string }[];
  value: string | null;
  onPick: (key: string) => void;
}) {
  return (
    <div>
      <div className="text-sm md:text-base font-bold text-emerald-950/75">{title}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onPick(o.key)}
              className={[
                "rounded-[999px] px-4 py-2 text-sm font-bold border transition",
                active
                  ? "bg-emerald-900 text-white border-emerald-900"
                  : "bg-white/60 border-emerald-900/15 text-emerald-950 hover:bg-white/75",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}