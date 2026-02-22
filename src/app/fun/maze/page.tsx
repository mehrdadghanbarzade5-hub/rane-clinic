"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Phase = "start" | "how" | "play" | "score";
type Cell = 0 | 1; // 0=path, 1=wall

const W = 13; // بهتر است فرد باشد
const H = 9;  // بهتر است فرد باشد

const START = { x: 1, y: 1 };
const EXIT = { x: W - 2, y: H - 2 };

function idx(x: number, y: number) {
  return y * W + x;
}

function inBounds(x: number, y: number) {
  return x >= 0 && y >= 0 && x < W && y < H;
}

// تولید هزارتو تصادفی (Perfect Maze) با DFS
function generateMaze(): Cell[] {
  // همه دیوار
  const grid: Cell[] = Array.from({ length: W * H }, () => 1);

  // سلول‌های قابل کندن روی مختصات فرد
  const carve = (x: number, y: number) => {
    grid[idx(x, y)] = 0;
  };

  const directions = [
    { dx: 2, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: 0, dy: -2 },
  ];

  const shuffle = <T,>(arr: T[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // شروع
  carve(START.x, START.y);
  const stack: { x: number; y: number }[] = [{ x: START.x, y: START.y }];

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const dirs = shuffle(directions);

    let moved = false;
    for (const { dx, dy } of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;

      if (!inBounds(nx, ny)) continue;
      // فقط نقاط فرد معتبرند (تا دیوارها بین‌شان بماند)
      if (nx % 2 === 0 || ny % 2 === 0) continue;

      if (grid[idx(nx, ny)] === 1) {
        // دیوار بین دو سلول را هم باز کن
        const wx = cur.x + dx / 2;
        const wy = cur.y + dy / 2;

        carve(wx, wy);
        carve(nx, ny);

        stack.push({ x: nx, y: ny });
        moved = true;
        break;
      }
    }

    if (!moved) stack.pop();
  }

  // اطمینان از باز بودن خروج و شروع
  grid[idx(START.x, START.y)] = 0;
  grid[idx(EXIT.x, EXIT.y)] = 0;

  // اگر خروج تصادفاً جدا افتاد (خیلی بعیده)، یک تونل ساده وصلش کن
  // (ایمن‌سازی برای هر حالت)
  const connectExitIfNeeded = () => {
    // یک مسیر Manhattan ساده از خروج به نزدیک‌ترین مسیر
    // اگر خود خروج دیواره نبود، ولی اطرافش دیوار بود، بازش می‌کنیم
    const around = [
      { x: EXIT.x - 1, y: EXIT.y },
      { x: EXIT.x + 1, y: EXIT.y },
      { x: EXIT.x, y: EXIT.y - 1 },
      { x: EXIT.x, y: EXIT.y + 1 },
    ].filter((p) => inBounds(p.x, p.y));

    const hasOpenNeighbor = around.some((p) => grid[idx(p.x, p.y)] === 0);
    if (hasOpenNeighbor) return;

    // یک تونل به سمت بالا/چپ باز کن تا به مسیر برسیم
    for (let x = EXIT.x; x >= 1; x--) {
      grid[idx(x, EXIT.y)] = 0;
      if (grid[idx(x, EXIT.y - 1)] === 0) break;
    }
    for (let y = EXIT.y; y >= 1; y--) {
      grid[idx(EXIT.x, y)] = 0;
      if (grid[idx(EXIT.x - 1, y)] === 0) break;
    }
  };

  connectExitIfNeeded();
  return grid;
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

export default function MazePage() {
  const [phase, setPhase] = useState<Phase>("start");
  const [maze, setMaze] = useState<Cell[]>(() => generateMaze());
  const [pos, setPos] = useState(START);
  const [steps, setSteps] = useState(0);

  const reset = (regen = false) => {
    if (regen) setMaze(generateMaze());
    setPos(START);
    setSteps(0);
  };

  const canMove = (nx: number, ny: number) => {
    if (!inBounds(nx, ny)) return false;
    return maze[idx(nx, ny)] === 0;
  };

  const doMove = (dx: number, dy: number) => {
    if (phase !== "play") return;

    setPos((p) => {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (!canMove(nx, ny)) return p;

      setSteps((s) => s + 1);
      if (nx === EXIT.x && ny === EXIT.y) setPhase("score");

      return { x: nx, y: ny };
    });
  };

  // کیبورد
  useEffect(() => {
    if (phase !== "play") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") doMove(0, -1);
      if (e.key === "ArrowDown") doMove(0, 1);
      if (e.key === "ArrowLeft") doMove(-1, 0);
      if (e.key === "ArrowRight") doMove(1, 0);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const legend = useMemo(() => {
    return (
      <div className="mt-3 text-[11px] font-extrabold text-slate-800">
        دیوار: ▪︎ مسیر: □ شروع: ● خروج: ◆
      </div>
    );
  }, []);

  return (
    <main dir="rtl" className="min-h-screen text-slate-900">
      <div
        className="min-h-screen"
        style={{
          background:
            "radial-gradient(1200px 760px at 20% 10%, rgba(251,191,36,0.16), transparent 60%)," +
            "radial-gradient(900px 650px at 85% 20%, rgba(34,211,238,0.14), transparent 55%)," +
            "linear-gradient(to bottom, rgba(255,255,255,1), rgba(236,249,247,1))",
        }}
      >
        <div className="mx-auto max-w-[950px] px-5 md:px-16 py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900">هزارتو آرام</div>
              <div className="mt-2 text-sm font-extrabold text-slate-800 leading-7">
                با جهت‌ها از شروع به خروج برس. دیوارها قابل عبور نیستند.
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
                  قدم: {steps}
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
                    reset(true); // ✅ هر بار نقشه جدید جذاب
                    setPhase("play");
                  }}
                  className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
                >
                  شروع بازی
                </button>

                <button
                  type="button"
                  onClick={() => reset(true)} // ریست + نقشه جدید
                  className="rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                >
                  ریست (نقشه جدید)
                </button>
              </div>
            </div>

            {phase === "start" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <GlassInfo
                  title="شروع سریع"
                  items={[
                    "با Arrow Keys یا دکمه‌های روی صفحه حرکت کن.",
                    "به دیوار برخورد کنی، حرکت انجام نمی‌شود.",
                    "هدف: رسیدن به خروج (◆).",
                  ]}
                />
                <GlassInfo
                  title="فایده برای مغز"
                  items={[
                    "تقویت توجه فضایی و جهت‌یابی.",
                    "تمرین کنترل تکانه (حرکت‌های حساب‌شده).",
                    "تنظیم ذهن با یک چالش کوچک و قابل کنترل.",
                  ]}
                />
              </div>
            ) : null}

            {phase === "how" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <GlassInfo
                  title="راهنمای کامل"
                  items={[
                    "حرکت با کیبورد: ↑ ↓ ← →",
                    "حرکت با موبایل: دکمه‌های جهت‌دار زیر نقشه",
                    "چپ و راست مطابق جهت دیداری نقشه کار می‌کنند ✅",
                    "هدف رسیدن به خروج (◆) است.",
                  ]}
                />
                <GlassInfo
                  title="نکته آرام‌سازی"
                  items={[
                    "اگر گیر کردی: یک قدم عقب، سپس مسیر دیگر.",
                    "هدف اینجا آرامش و تمرکز است نه سرعت.",
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
                      reset(true);
                      setPhase("play");
                    }}
                    className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
                  >
                    شروع
                  </button>
                </div>
                {legend}
              </div>
            ) : null}

            {phase === "play" ? (
              <>
                <div className="mt-6 grid place-items-center">
                  {/* ✅ خیلی مهم: خود گرید را LTR می‌کنیم تا چپ/راست برعکس نشود */}
                  <div dir="ltr">
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${W}, 18px)`,
                      }}
                      role="grid"
                      aria-label="maze grid"
                    >
                      {Array.from({ length: W * H }).map((_, i) => {
                        const x = i % W;
                        const y = Math.floor(i / W);

                        const isWall = maze[i] === 1;
                        const isPlayer = x === pos.x && y === pos.y;
                        const isExit = x === EXIT.x && y === EXIT.y;
                        const isStart = x === START.x && y === START.y;

                        return (
                          <div
                            key={i}
                            className={[
                              "h-[18px] w-[18px] rounded-[6px] border",
                              isWall
                                ? "bg-slate-900/12 border-black/10"
                                : "bg-white/90 border-black/10",
                              isExit ? "ring-2 ring-teal-500/25" : "",
                            ].join(" ")}
                          >
                            <div className="h-full w-full grid place-items-center text-[10px] font-black text-slate-900">
                              {isPlayer ? "●" : isExit ? "◆" : isStart ? "·" : ""}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {legend}
                </div>

                {/* کنترل موبایل */}
                <div className="mt-6 grid place-items-center">
                  <div className="rounded-[22px] border border-black/10 bg-white/90 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
                    <div className="text-[11px] font-extrabold text-slate-900 text-center">
                      کنترل سریع (موبایل/لمس)
                    </div>

                    <div className="mt-3 grid gap-2 place-items-center">
                      <button
                        type="button"
                        onClick={() => doMove(0, -1)}
                        className="w-24 rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                      >
                        ↑
                      </button>

                      <div className="flex items-center gap-2">
                        {/* با LTR شدن گرید، این‌ها دقیقاً درست عمل می‌کنند */}
                        <button
                          type="button"
                          onClick={() => doMove(-1, 0)}
                          className="w-24 rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                        >
                          ← چپ
                        </button>

                        <button
                          type="button"
                          onClick={() => doMove(1, 0)}
                          className="w-24 rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                        >
                          راست →
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => doMove(0, 1)}
                        className="w-24 rounded-[14px] border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-white"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {phase === "score" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <GlassInfo
                  title="نتیجه"
                  items={[
                    "آفرین ✅ به خروج رسیدی.",
                    `تعداد قدم‌ها: ${steps}`,
                    "اگر دوست داشتی دوباره بازی کن و این بار مسیر کوتاه‌تری پیدا کن.",
                  ]}
                />
                <GlassInfo
                  title="مهارتی که تمرین کردی"
                  items={[
                    "توجه فضایی و جهت‌یابی.",
                    "تصمیم‌گیری آرام و بدون عجله.",
                    "پایداری ذهن در یک چالش کوتاه.",
                  ]}
                />
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      reset(true);
                      setPhase("play");
                    }}
                    className="rounded-[14px] border border-teal-500/25 bg-teal-500/18 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-teal-500/24"
                  >
                    دوباره
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reset(true);
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