// src/lib/adminState.ts

export const DISABLED_THERAPISTS_KEY = "rane_admin_disabled_therapists_v1";

const EVT = "rane-admin-disabled-therapists-updated";

function readLS<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function emit() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(EVT));
  } catch {
    // ignore
  }
}

function normEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

/**
 * گرفتن لیست ایمیل‌های غیرفعال (Disabled)
 */
export function getDisabledTherapists(): string[] {
  const list = readLS<string[]>(DISABLED_THERAPISTS_KEY);
  return Array.isArray(list) ? list.map(normEmail).filter(Boolean) : [];
}

/**
 * ست کردن مستقیم لیست غیرفعال‌ها
 */
export function setDisabledTherapists(next: string[]) {
  const clean = (Array.isArray(next) ? next : []).map(normEmail).filter(Boolean);
  // unique
  const uniq = Array.from(new Set(clean));
  writeLS(DISABLED_THERAPISTS_KEY, uniq);
  emit();
  return uniq;
}

/**
 * بررسی فعال بودن درمانگر
 */
export function isTherapistActive(email?: string): boolean {
  if (!email) return true;
  const disabled = getDisabledTherapists();
  return !disabled.includes(normEmail(email));
}

/**
 * تغییر وضعیت درمانگر (toggle disabled)
 */
export function toggleTherapistDisabled(email: string) {
  const disabled = getDisabledTherapists();
  const n = normEmail(email);

  const next = disabled.includes(n) ? disabled.filter((e) => e !== n) : [n, ...disabled];
  return setDisabledTherapists(next);
}

/**
 * همگام‌سازی بین صفحات:
 * - وقتی در یک صفحه تغییر دادیم، صفحه‌ی دیگر هم فوراً آپدیت شود
 */
export function subscribeDisabledTherapists(cb: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === DISABLED_THERAPISTS_KEY) cb();
  };

  const onCustom = () => cb();

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVT, onCustom);
  };
}

/**
 * ✅ رفع مشکل «برعکس شدن وضعیت‌ها» (Semantic Fix)
 *
 * اگر قبلاً اشتباه ذخیره شده باشد (مثلاً لیستِ فعال‌ها را به‌عنوان disabled ذخیره کرده باشند)
 * این تابع با توجه به ایمیل‌های شناخته‌شده، تشخیص می‌دهد و اصلاح می‌کند.
 */
export function ensureDisabledTherapistsSemantic(knownEmails: string[]) {
  const known = (Array.isArray(knownEmails) ? knownEmails : [])
    .map(normEmail)
    .filter(Boolean);

  if (known.length === 0) return getDisabledTherapists();

  const stored = getDisabledTherapists();
  if (stored.length === 0) return stored;

  // اگر بیشترِ ایمیل‌های شناخته‌شده داخل stored باشند، احتمالاً stored در واقع "enabled list" بوده
  const knownSet = new Set(known);
  const storedKnownCount = stored.filter((e) => knownSet.has(e)).length;

  // Heuristic: اگر بیش از نصف known ها داخل stored بود => احتمال زیاد لیست فعال‌هاست
  if (storedKnownCount > Math.floor(known.length / 2)) {
    // invert: disabled = known - stored
    const storedSet = new Set(stored);
    const fixed = known.filter((e) => !storedSet.has(e));
    return setDisabledTherapists(fixed);
  }

  // در غیر این صورت، همان disabled واقعی است
  return stored;
}