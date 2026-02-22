"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Phase = "start" | "how" | "play" | "score";

const SIZE = 4;
const EMPTY = 0;

function makeSolved() {
  const arr = Array.from({ length: SIZE * SIZE }, (_, i) => i + 1);
  arr[arr.length - 1] = EMPTY;
  return arr;
}

function scramble(steps = 160) {
  let board = makeSolved();
  for (let s = 0; s < steps; s++) {
    const e = board.indexOf(EMPTY);
    const r = Math.floor(e / SIZE);
    const c = e % SIZE;

    const candidates: number[] = [];
    if (r > 0) candidates.push(e - SIZE);
    if (r < SIZE - 1) candidates.push(e + SIZE);
    if (c > 0) candidates.push(e - 1);
    if (c < SIZE - 1) candidates.push(e + 1);

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const nb = board.slice();
    [nb[e], nb[pick]] = [nb[pick], nb[e]];
    board = nb;
  }
  return board;
}

function isSolved(board: number[]) {
  const solved = makeSolved();
  return board.every((v, i) => v === solved[i]);
}

function GlassInfo({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white/90 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
      <div className="text-sm font-extrabold text-slate-900">{title}</div>
      <ul className="mt-3 space-y-2 text-sm font-extrabold text-slate-800 leading-7">
        {items.map((t, i) => (
          <li key={i}>• {t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function SliderPuzzlePage() {
  const [phase, setPhase] = useState<Phase>("start");

  const initial = useMemo(() => scramble(180), []);
  const [board, setBoard] = useState<number[]>(initial);
  const [moves, setMoves] = useState(0);

  const reset = (steps = 190) => {
    setBoard(scramble(steps));
    setMoves(0);
  };

  const getValidMoves = (b: number[]) => {
    const e = b.indexOf(EMPTY);
    const r = Math.floor(e / SIZE);
    const c = e % SIZE;

    const valid = new Set<number>();
    if (r > 0) valid.add(e - SIZE);
    if (r < SIZE - 1) valid.add(e + SIZE);
    if (c > 0) valid.add(e - 1);
    if (c < SIZE - 1) valid.add(e + 1);
    return valid;
  };

  const move = (idx: number) => {
    if (phase !== "play") return;

    const valid = getValidMoves(board);
    if (!valid.has(idx)) return;

    const e = board.indexOf(EMPTY);
    const nb = board.slice();
    [nb[e], nb[idx]] = [nb[idx], nb[e]];

    setBoard(nb);
    setMoves((m) => m + 1);

    if (isSolved(nb)) setPhase("score");
  };

  const validMoves = phase === "play" ? getValidMoves(board) : new Set<number>();

  return (
    <main dir="rtl" className="min-h-screen text-slate-900">
      <div
        className="min-h-screen"
        style={{
          background:
            "radial-gradient(1200px 760px at 18% 10%, rgba(45,212,191,0.18), transparent 60%)," +
            "radial-gradient(900px 650px at 85% 20%, rgba(99,102,241,0.12), transparent 55%)," +
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(236,249,247,1))",
        }}
      >
        <div className="mx-auto max-w-[950px] px-5 md:px-16 py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
                پازل اسلایدر ۱۵
              </div>
              <div className="mt-2 text-sm font-extrabold text-slate-800 leading-7">
                مرتب‌سازی ۱ تا ۱۵ با جابه‌جایی قطعه‌ی مجاور خانه‌ی خالی.
              </div>
            </div>

            <Link
              href="/fun"
              className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
            >
              برگشت
            </Link>
          </div>

          <div className="mt-6 rounded-[28px] border border-black/10 bg-white/90 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.10)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-[999px] border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-slate-900">
                  حرکت: {moves}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPhase("how")}
                  className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                >
                  راهنما
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reset(210); // شروع تازه کمی بیشتر اسکرامبل
                    setPhase("play");
                  }}
                  className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
                >
                  شروع جدید
                </button>

                <button
                  type="button"
                  onClick={() => reset(190)}
                  className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                >
                  ریست
                </button>
              </div>
            </div>

            {phase === "start" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <GlassInfo
                  title="شروع سریع"
                  items={[
                    "فقط قطعه‌های مجاور خانه‌ی خالی حرکت می‌کنند.",
                    "هدف: ۱ تا ۱۵ مرتب + خانه خالی آخر.",
                    "با ریتم آرام بازی کن؛ هدف تنظیم ذهن است.",
                  ]}
                />
                <GlassInfo
                  title="فایده برای مغز"
                  items={[
                    "تمرین برنامه‌ریزی و حل مسئله (Executive Function).",
                    "بهبود حافظه کاری در تصمیم‌های پشت‌سرهم.",
                    "افزایش تحمل تأخیر و کاهش عجله (کنترل تکانه).",
                  ]}
                />
              </div>
            ) : null}

            {phase === "how" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <GlassInfo
                  title="راهنمای کامل"
                  items={[
                    "به خانه خالی نگاه کن؛ قطعات کنار آن قابل حرکت‌اند.",
                    "گاهی حل کردن با «برگرداندن» یک اشتباه، سریع‌تر است.",
                    "راهکار ساده: اول ردیف اول، بعد ردیف دوم…",
                  ]}
                />
                <GlassInfo
                  title="نکته آرام‌سازی"
                  items={[
                    "اگر گیر کردی: ۱۰ ثانیه توقف، نفس آرام، بعد ادامه.",
                    "هدف رکوردزنی نیست؛ تمرین ذهنی است.",
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
                    onClick={() => {
                      reset(210);
                      setPhase("play");
                    }}
                    className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
                  >
                    شروع
                  </button>
                </div>
              </div>
            ) : null}

            {phase === "play" ? (
              <div className="mt-6 grid place-items-center">
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
                    width: "min(430px, 100%)",
                  }}
                  role="grid"
                  aria-label="slider puzzle grid"
                >
                  {board.map((v, idx) => {
                    const isEmpty = v === EMPTY;
                    const canMove = validMoves.has(idx);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => move(idx)}
                        disabled={phase !== "play" || isEmpty || !canMove}
                        className={[
                          "h-16 md:h-20 rounded-[18px] border font-extrabold text-lg md:text-xl transition",
                          "shadow-[0_12px_45px_rgba(0,0,0,0.08)]",
                          isEmpty
                            ? "bg-transparent border-transparent"
                            : "bg-white/92 border-black/10 hover:bg-white",
                          "text-slate-900",
                          !isEmpty && canMove ? "ring-1 ring-teal-500/20" : "",
                          !isEmpty && !canMove ? "opacity-80 cursor-not-allowed" : "",
                          "focus:outline-none focus:ring-2 focus:ring-teal-500/25",
                        ].join(" ")}
                        aria-label={isEmpty ? "empty" : `tile-${v}`}
                      >
                        {isEmpty ? "" : v}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-[22px] border border-black/10 bg-white/90 p-5 w-full">
                  <div className="text-sm font-extrabold text-slate-900">نکته</div>
                  <div className="mt-2 text-sm font-extrabold text-slate-800 leading-7">
                    اول سطر اول را درست کن، بعد سطر دوم… این روش برای خیلی‌ها سریع‌تر جواب می‌دهد.
                  </div>
                </div>
              </div>
            ) : null}

            {phase === "score" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <GlassInfo
                  title="نتیجه"
                  items={[
                    "تبریک 🎉 پازل حل شد.",
                    `حرکت‌های شما: ${moves}`,
                    "اگر دوست داشتی یک‌بار دیگر با تمرکز بیشتر امتحان کن.",
                  ]}
                />
                <GlassInfo
                  title="مهارتی که تمرین کردی"
                  items={[
                    "برنامه‌ریزی، انعطاف شناختی، حل مسئله.",
                    "پایداری توجه در چند دقیقه.",
                    "کاهش واکنش‌های عجولانه.",
                  ]}
                />
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      reset(210);
                      setPhase("play");
                    }}
                    className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
                  >
                    دوباره
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reset(190);
                      setPhase("start");
                    }}
                    className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                  >
                    صفحه شروع
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}