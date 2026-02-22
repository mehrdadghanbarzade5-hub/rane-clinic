"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Role = "admin" | "therapist" | "client";

const NAV: Record<Role, { href: string; label: string }[]> = {
  admin: [
    { href: "/panel/admin", label: "داشبورد" },
    { href: "/panel/admin/therapists", label: "درمانگرها" },
    { href: "/panel/admin/bookings", label: "رزروها" },
    { href: "/panel/admin/settings", label: "تنظیمات" },
  ],
  therapist: [
    { href: "/panel/therapist", label: "داشبورد" },
    { href: "/panel/therapist/forms", label: "فرم‌ها و تست‌ها" },
    { href: "/panel/therapist/schedule", label: "زمان‌بندی" },
    { href: "/panel/therapist/clients", label: "مراجعین" },
    { href: "/panel/therapist/referrals", label: "ارجاع‌ها" },
    { href: "/panel/therapist/profile", label: "پروفایل من" },
  ],
  client: [
    { href: "/panel/client", label: "داشبورد" },
    { href: "/panel/client/bookings", label: "رزروهای من" },
    { href: "/panel/client/intake", label: "پرسشنامه" },
    { href: "/panel/client/profile", label: "پروفایل من" },
    // اگر در NAV اضافه‌اش کردی، اینجا هم می‌آید. (الزامی نیست)
    { href: "/panel/client/settings", label: "تنظیمات" },
  ],
};

function uniqByHref(items: { href: string; label: string }[]) {
  const seen = new Set<string>();
  return items.filter((it) => {
    if (seen.has(it.href)) return false;
    seen.add(it.href);
    return true;
  });
}

function isActivePath(pathname: string, href: string) {
  if (!pathname || !href) return false;
  if (pathname === href) return true;
  const withSlash = href.endsWith("/") ? href : `${href}/`;
  return pathname.startsWith(withSlash);
}

function readRootModes() {
  if (typeof document === "undefined") return { isDark: false, isAnxiety: false };
  const isDark = document.documentElement.classList.contains("dark");
  const isAnxiety = document.body.classList.contains("rane-anxiety");
  return { isDark, isAnxiety };
}

export default function PanelShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = useMemo(() => uniqByHref(NAV[role]), [role]);

  // ✅ چون dark/anxiety توسط Provider روی html/body اعمال می‌شود،
  // اینجا آنها را رصد می‌کنیم تا UI Shell واقعاً تغییر کند.
  const [{ isDark, isAnxiety }, setModes] = useState(() => ({ isDark: false, isAnxiety: false }));

  useEffect(() => {
    // initial
    setModes(readRootModes());

    // observe changes on <html class="dark"> and body class
    const obs = new MutationObserver(() => {
      setModes(readRootModes());
    });

    try {
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-rane-theme"] });
      obs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-rane-anxiety"] });
    } catch {
      // ignore
    }

    return () => obs.disconnect();
  }, []);

  // ✅ رنگ‌ها/پس‌زمینه‌ها: Light / Dark / Anxiety (نرم‌تر)
  const shellText = isDark ? "text-slate-100" : "text-emerald-950";

  const shellBg = isDark
    ? // Dark background
      "radial-gradient(1000px 650px at 20% 18%, rgba(16,185,129,0.10), transparent 60%)," +
      "radial-gradient(900px 600px at 80% 30%, rgba(45, 212, 191, 0.10), transparent 55%)," +
      "linear-gradient(to bottom, rgba(2, 6, 23, 1), rgba(3, 7, 18, 1))"
    : // Light background (همان قبلی)
      "radial-gradient(1000px 650px at 20% 18%, rgba(16,185,129,0.10), transparent 60%)," +
      "radial-gradient(900px 600px at 80% 30%, rgba(45, 212, 191, 0.08), transparent 55%)," +
      "linear-gradient(to bottom, rgba(245, 255, 250, 1), rgba(232, 246, 241, 1))";

  // Anxiety mode: کاهش کنتراست/فشار بصری
  const shellFilter = isAnxiety ? "saturate(0.95) contrast(0.98)" : "none";

  const panelCardClass = [
    "rounded-[26px] border backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.08)]",
    isDark
      ? "border-white/10 bg-slate-900/50"
      : "border-emerald-900/10 bg-white/65",
  ].join(" ");

  const buttonBase =
    "rounded-[16px] border px-4 py-3 text-sm font-bold transition";

  const navItemClass = (active: boolean) =>
    [
      "rounded-[16px] px-4 py-3 text-sm font-bold border transition",
      active
        ? isDark
          ? "bg-emerald-500/30 text-slate-100 border-emerald-500/30 shadow-[0_14px_40px_rgba(16,185,129,0.10)]"
          : "bg-emerald-500/90 text-[#050807] border-emerald-500/20 shadow-[0_14px_40px_rgba(16,185,129,0.14)]"
        : isDark
          ? "bg-slate-900/40 text-slate-200 border-white/10 hover:bg-slate-900/60"
          : "bg-white/70 text-emerald-950/70 border-emerald-900/10 hover:bg-white/90",
    ].join(" ");

  return (
    <div
      dir="rtl"
      className={`min-h-screen w-full ${shellText}`}
      style={{
        background: shellBg,
        filter: shellFilter,
      }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8">
        <div className="grid gap-4 md:grid-cols-12">
          {/* Sidebar */}
          <aside className="md:col-span-3">
            <div className={`${panelCardClass} p-5`}>
              <div className="text-lg font-bold">پنل</div>
              <div className={`mt-1 text-xs font-bold ${isDark ? "text-slate-300/80" : "text-emerald-950/55"}`}>
                نقش: {role}
              </div>

              <nav className="mt-4 grid gap-2">
                {items.map((it, idx) => {
                  const active = isActivePath(pathname, it.href);
                  return (
                    <Link key={`${it.href}-${idx}`} href={it.href} className={navItemClass(active)}>
                      {it.label}
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className={[
                  "mt-4 w-full",
                  buttonBase,
                  isDark
                    ? "border-white/10 bg-slate-900/40 text-slate-100 hover:bg-slate-900/60"
                    : "border-emerald-900/10 bg-white/70 text-emerald-950 hover:bg-white/90",
                ].join(" ")}
              >
                خروج
              </button>
            </div>
          </aside>

          {/* Content */}
          <section className="md:col-span-9">
            <div className={`${panelCardClass} p-6`}>{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}