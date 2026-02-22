"use client";

import { useEffect } from "react";
import { loadClientSettings } from "@/components/panel/settings/settingsStore";

/**
 * ClientExperienceProvider
 * - تنظیمات مراجع را از settingsStore می‌خواند
 * - Theme و Anxiety Mode را به UI اعمال می‌کند:
 *   - html.dark برای Tailwind dark mode
 *   - body.rane-anxiety برای Anxiety Mode
 */
export default function ClientExperienceProvider() {
  useEffect(() => {
    const apply = () => {
      const s = loadClientSettings();

      // theme
      const theme = s?.preferences?.theme ?? "system";
      const prefersDark =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const shouldDark = theme === "dark" || (theme === "system" && prefersDark);

      const root = document.documentElement;
      root.classList.toggle("dark", shouldDark);
      root.dataset.raneTheme = theme;

      // anxiety mode
      const anxiety = Boolean(s?.preferences?.anxietyMode);
      document.body.classList.toggle("rane-anxiety", anxiety);
      document.body.dataset.raneAnxiety = anxiety ? "1" : "0";
    };

    apply();

    // sync if settings change in another tab/window
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.includes("rane_settings_client") || e.key.includes("rane_settings")) {
        apply();
      }
    };
    window.addEventListener("storage", onStorage);

    // react to OS theme changes if theme=system
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMql = () => apply();
    mql?.addEventListener?.("change", onMql);

    return () => {
      window.removeEventListener("storage", onStorage);
      mql?.removeEventListener?.("change", onMql);
    };
  }, []);

  return null;
}