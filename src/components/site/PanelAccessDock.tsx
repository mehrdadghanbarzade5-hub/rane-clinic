"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type DockMode = "right" | "left";

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

function useScrolled(threshold = 120) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

export default function PanelAccessDock({
  mode = "right",
  signinHref = "/auth/signin",
}: {
  mode?: DockMode;
  signinHref?: string;
}) {
  const { isDark, isAnxiety } = useRaneModes();
  const [open, setOpen] = useState(false);

  const scrolled = useScrolled(140);

  // Anxiety Mode: برای کاهش استرس hover، باز شدن با کلیک
  const shouldUseHover = useMemo(() => !isAnxiety, [isAnxiety]);

  // ✅ جایگاه: بالا-راست (هماهنگ با هدر)
  const side = mode === "right" ? "right-5 md:right-10" : "left-5 md:left-10";
  const align = mode === "right" ? "items-end" : "items-start";

  // ✅ همیشه بالای صفحه، اما زیر هدر sticky شما
  const topPos = scrolled ? "top-6" : "top-24 md:top-28";

  const logoSize = scrolled ? 44 : 54;
  const imgSize = scrolled ? 28 : 34;

  return (
    <div
      className={["fixed z-[9999]", topPos, side].join(" ")}
      onMouseEnter={shouldUseHover ? () => setOpen(true) : undefined}
      onMouseLeave={shouldUseHover ? () => setOpen(false) : undefined}
      style={isAnxiety ? { filter: "saturate(0.97) contrast(1.02)" } : undefined}
    >
      <div className={["relative flex flex-col gap-3", align].join(" ")}>
        {/* دکمه لوگو */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-label="ورود به پنل‌ها"
          className={[
            "relative flex items-center justify-center rounded-full",
            "shadow-[0_20px_60px_rgba(0,0,0,0.14)]",
            "border transition-all duration-300",
            isDark ? "bg-slate-950/80 border-white/10" : "bg-white/80 border-emerald-900/15",
            open ? "scale-[1.04]" : "scale-100",
            "backdrop-blur-xl",
          ].join(" ")}
          style={{ height: logoSize, width: logoSize }}
        >
          <Image
            src="/logo.png"
            alt="RANE Panel Access"
            width={imgSize}
            height={imgSize}
            className="object-contain"
            priority
          />
        </button>

        {/* پنل بازشونده */}
        <div
          className={[
            "transition-all duration-300",
            open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none",
          ].join(" ")}
        >
          <div
            className={[
              "min-w-[220px] rounded-[20px] border px-5 py-4 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.16)]",
              isDark
                ? "bg-slate-950/92 border-white/10 text-slate-100"
                : "bg-white/92 border-emerald-900/15 text-emerald-950",
            ].join(" ")}
          >
            <div className="text-xs font-bold mb-3 opacity-70">ورود به پنل‌ها</div>

            <Link
              href={signinHref}
              className={[
                "block rounded-[14px] px-4 py-2 text-sm font-extrabold text-center transition",
                isDark ? "bg-emerald-500/15 hover:bg-emerald-500/25" : "bg-emerald-500/15 hover:bg-emerald-500/25",
              ].join(" ")}
            >
              ورود
            </Link>

            <div className="mt-2 text-[11px] opacity-60 text-center">ادمین • درمانگر • مراجع</div>

            {!shouldUseHover ? (
              <div className="mt-2 text-[10px] opacity-60 text-center">برای باز/بسته کردن کلیک کن</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}