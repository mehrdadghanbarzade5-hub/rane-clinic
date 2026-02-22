"use client";

import { useMemo, useState } from "react";
import { THERAPISTS } from "@/data/therapists";

type FilterTag = "همه" | string;

export default function TherapistsPage() {
  const [tag, setTag] = useState<FilterTag>("همه");
  const [q, setQ] = useState("");

  const allTags = useMemo(() => {
    const set = new Set<string>();
    THERAPISTS.forEach((t) => (t.tags || []).forEach((x) => set.add(x)));
    return ["همه", ...Array.from(set)];
  }, []);

  const list = useMemo(() => {
    const query = q.trim();
    return THERAPISTS.filter((t) => {
      const matchesTag = tag === "همه" ? true : (t.tags || []).includes(tag);
      const matchesQ = !query
        ? true
        : [t.name, t.specialty, t.tone, ...(t.tags || [])]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());
      return matchesTag && matchesQ;
    });
  }, [tag, q]);

  return (
    <main
      dir="rtl"
      className="min-h-screen px-4 py-10 text-emerald-950"
      style={{
        background:
          "radial-gradient(1000px 650px at 20% 18%, rgba(16,185,129,0.10), transparent 60%)," +
          "radial-gradient(900px 600px at 80% 30%, rgba(45, 212, 191, 0.08), transparent 55%)," +
          "linear-gradient(to bottom, rgba(245, 255, 250, 1), rgba(232, 246, 241, 1))",
      }}
    >
      <div className="mx-auto w-full max-w-[1180px]">
        {/* Header */}
        <div className="rounded-[28px] border border-emerald-900/10 bg-white/60 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.10)] p-7">
          <div className="text-3xl font-bold">درمانگران رانه</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
            درمانگرها را بر اساس «موضوع/تخصص» فیلتر کنید یا با حس ارتباط انتخاب کنید.
          </div>

          {/* Controls */}
          <div className="mt-6 grid gap-3 md:grid-cols-12">
            <div className="md:col-span-7">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-[18px] border border-emerald-900/10 bg-white/70 px-5 py-3 text-sm font-bold outline-none placeholder:text-emerald-950/35"
                placeholder="جستجو: نام درمانگر، تخصص، برچسب‌ها…"
              />
            </div>

            <div className="md:col-span-5">
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 8).map((x) => {
                  const active = x === tag;
                  return (
                    <button
                      key={x}
                      onClick={() => setTag(x)}
                      className={[
                        "rounded-full px-4 py-2 text-sm font-bold border transition",
                        active
                          ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20 shadow-[0_14px_40px_rgba(16,185,129,0.14)]"
                          : "bg-white/70 text-emerald-950/70 border-emerald-900/10 hover:bg-white/90",
                      ].join(" ")}
                    >
                      {x}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-950/45">
                (برای موضوعات و اطلاعات بیشتر می‌توانید به پروفایل درمانگران مراجعه کنید.)
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {list.map((t) => (
            <div
              key={String(t.id)}
              className="rounded-[26px] border border-emerald-900/10 bg-white/60 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.08)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold">{t.name}</div>
                  <div className="mt-1 text-sm font-bold text-emerald-950/65">
                    {t.specialty}
                  </div>
                </div>

                <span className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-950/70">
                  {t.tone}
                </span>
              </div>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(t.tags || []).slice(0, 4).map((x) => (
                  <span
                    key={x}
                    className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-950/70"
                  >
                    {x}
                  </span>
                ))}
              </div>

              {/* Action */}
              <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`/therapists/${encodeURIComponent(String(t.id))}`}
                className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-5 py-3 text-sm font-bold text-emerald-950 hover:bg-white/90"
              >
                مشاهده پروفایل
              </a>

              <a
                href={`/book?therapistId=${encodeURIComponent(String(t.id))}`}
                className="rounded-[16px] bg-emerald-500/90 px-5 py-3 text-sm font-bold text-[#050807] hover:opacity-95"
              >
                رزرو با این درمانگر
              </a>
            </div>

            </div>
          ))}
        </div>

        {list.length === 0 && (
          <div className="mt-8 rounded-[24px] border border-emerald-900/10 bg-white/60 p-6 text-sm font-bold text-emerald-950/65">
            نتیجه‌ای پیدا نشد. فیلتر را تغییر بده یا عبارت جستجو را کوتاه‌تر کن.
          </div>
        )}
      </div>
    </main>
  );
}
