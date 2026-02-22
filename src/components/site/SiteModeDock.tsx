"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SitePrefs = {
  anxiety: boolean;
  lang: "fa" | "en";
};

const KEY = "rane_site_prefs_v1";

function readPrefs(): SitePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { anxiety: false, lang: "fa" };
    const j = JSON.parse(raw) as Partial<SitePrefs>;
    return {
      anxiety: typeof j.anxiety === "boolean" ? j.anxiety : false,
      lang: j.lang === "en" ? "en" : "fa",
    };
  } catch {
    return { anxiety: false, lang: "fa" };
  }
}

function writePrefs(p: SitePrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

function useRaneModes() {
  const [modes, setModes] = useState({ isDark: false, isAnxiety: false });

  useEffect(() => {
    const read = () => ({
      isDark: document.documentElement.classList.contains("dark"),
      isAnxiety: document.documentElement.classList.contains("rane-anxiety"),
    });

    setModes(read());

    const obs = new MutationObserver(() => setModes(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => obs.disconnect();
  }, []);

  return modes;
}

export default function SiteModeDock({ signinHref = "/auth/signin" }: { signinHref?: string }) {
  const { isDark, isAnxiety } = useRaneModes();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<SitePrefs>({ anxiety: false, lang: "fa" });

  const shouldUseHover = useMemo(() => !isAnxiety, [isAnxiety]);

  const label = useMemo(() => {
    const a = prefs.anxiety ? "اضطراب: روشن" : "اضطراب: خاموش";
    const l = prefs.lang === "fa" ? "FA" : "EN";
    return `${a} • ${l}`;
  }, [prefs]);

  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  useEffect(() => {
    const html = document.documentElement;

    html.classList.toggle("rane-anxiety", prefs.anxiety);
    html.setAttribute("lang", prefs.lang);
    html.setAttribute("dir", prefs.lang === "fa" ? "rtl" : "ltr");

    writePrefs(prefs);
  }, [prefs]);

  return (
    <>
      <style jsx global>{`
        html.rane-anxiety body {
          background: radial-gradient(1200px 700px at 70% 0%, rgba(45, 212, 191, 0.18), transparent 60%),
            radial-gradient(1000px 700px at 10% 20%, rgba(16, 185, 129, 0.12), transparent 55%),
            linear-gradient(to bottom, rgba(246, 252, 251, 1), rgba(233, 247, 244, 1));
        }
        html.rane-anxiety * {
          scroll-behavior: smooth;
        }
        @media (prefers-reduced-motion: no-preference) {
          html.rane-anxiety * {
            transition-duration: 160ms !important;
            animation-duration: 160ms !important;
          }
        }
      `}</style>

      {/* ✅ فقط یک باکس کوچک پایین-راست (بدون هیچ wrapper فول‌اسکرین) */}
      <div
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[99999]"
        style={isAnxiety ? { filter: "saturate(0.95) contrast(1.05)" } : undefined}
        onMouseLeave={shouldUseHover ? () => setOpen(false) : undefined}
      >
        <div className="relative flex items-end gap-3 flex-row-reverse">
          {/* پنجره */}
          <div
            className={[
              "transition-all duration-300",
              open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none",
            ].join(" ")}
          >
            <div
              className={[
                "w-[360px] md:w-[460px]",
                "rounded-[20px] border px-4 py-3 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.16)]",
                isDark
                  ? "bg-slate-950/92 border-white/10 text-slate-100"
                  : "bg-white/92 border-emerald-900/15 text-emerald-950",
                isAnxiety ? "ring-1 ring-teal-500/35" : "",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-bold opacity-70">ورود و حالت‌ها</div>

                <div
                  className={[
                    "text-[10px] font-extrabold px-3 py-1 rounded-[999px] border",
                    prefs.anxiety ? "border-teal-500/25 bg-teal-500/15" : "border-emerald-900/10 bg-white/60",
                  ].join(" ")}
                >
                  {prefs.anxiety ? "ANXIETY ON" : "ANXIETY OFF"} • {prefs.lang.toUpperCase()}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href={signinHref}
                  className="flex-1 rounded-[14px] px-4 py-2 text-sm font-extrabold text-center transition border bg-teal-500/15 hover:bg-teal-500/22 border-teal-500/20"
                >
                  ورود به پنل‌ها
                </Link>

                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, anxiety: !p.anxiety }))}
                  className={[
                    "rounded-[14px] px-4 py-2 text-sm font-extrabold transition border whitespace-nowrap",
                    prefs.anxiety
                      ? "bg-teal-500/22 hover:bg-teal-500/28 border-teal-500/25"
                      : "bg-white/70 hover:bg-white/85 border-emerald-900/12",
                    isDark ? "text-slate-100" : "text-emerald-950",
                  ].join(" ")}
                >
                  {prefs.anxiety ? "اضطراب روشن" : "اضطراب خاموش"}
                </button>

                <button
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, lang: p.lang === "fa" ? "en" : "fa" }))}
                  className={[
                    "rounded-[14px] px-4 py-2 text-sm font-extrabold transition border whitespace-nowrap bg-white/70 hover:bg-white/85",
                    isDark ? "border-white/10 text-slate-100" : "border-emerald-900/12 text-emerald-950",
                  ].join(" ")}
                >
                  {prefs.lang === "fa" ? "EN" : "FA"}
                </button>
              </div>

              <div className="mt-2 text-[11px] opacity-60">
                {prefs.lang === "fa" ? "ادمین • درمانگر • مراجع" : "Admin • Therapist • Client"} — {label}
                {!shouldUseHover ? <span className="mr-2 text-[10px] opacity-60">• برای باز/بسته کردن کلیک کن</span> : null}
              </div>
            </div>
          </div>

          {/* لوگو */}
          <button
            type="button"
            onClick={() => {
              if (!shouldUseHover) setOpen((p) => !p);
            }}
            onMouseEnter={shouldUseHover ? () => setOpen(true) : undefined}
            aria-label="ورود و حالت‌ها"
            className={[
              "relative flex items-center justify-center rounded-full",
              "shadow-[0_20px_60px_rgba(0,0,0,0.14)]",
              "border transition-all duration-300 backdrop-blur-xl",
              isDark ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-emerald-900/15",
              open ? "scale-[1.04]" : "scale-100",
              prefs.anxiety ? "ring-2 ring-teal-500/35" : "",
            ].join(" ")}
            style={{ height: 54, width: 54 }}
          >
            <Image src="/logo.png" alt="RANE Dock" width={34} height={34} className="object-contain" priority />
          </button>
        </div>
      </div>
    </>
  );
}