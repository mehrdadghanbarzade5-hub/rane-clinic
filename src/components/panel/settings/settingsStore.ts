// src/components/panel/settings/settingsStore.ts
"use client";

export type NotificationPrefs = {
  emailReminders: boolean;
  smsReminders: boolean;
  marketing: boolean;
  weeklyDigest: boolean;
};

export type SecurityPrefs = {
  twoFactorEnabled: boolean; // (Mock) فقط UI + ذخیره
  sessionTimeoutMin: 15 | 30 | 60 | 120;
  loginAlerts: boolean;
};

export type ClientSettings = {
  version: 1;
  profile: {
    fullName: string;
    phone: string;
    city: string;
    emergencyContact: string;
  };
  preferences: {
    theme: "system" | "light" | "dark";
    anxietyMode: boolean;
    language: "fa"; // فعلاً تک‌زبانه
  };
  notifications: NotificationPrefs;
  security: SecurityPrefs;
  data: {
    testDataEnabled: boolean; // ✅ طبق قانون شما: امکان غیرفعال‌سازی ساده داده‌های تست
  };
};

export type AdminSettings = {
  version: 1;
  clinic: {
    clinicName: string;
    publicPhone: string;
    publicEmail: string;
    address: string;
    city: string;
    timezone: string; // مثل Asia/Tehran
  };
  policies: {
    cancellationHours: 1 | 3 | 6 | 12 | 24 | 48;
    noShowFeeEnabled: boolean;
    noShowFeeAmount: number; // تومان
    requireIntakeForFirstVisit: boolean;
  };
  notifications: {
    adminEmail: string;
    newBookingEmail: boolean;
    newBookingSms: boolean;
    dailyReport: boolean;
  };
  security: {
    enforceStrongPasswords: boolean; // (Mock) سیاست
    allowTherapistSelfEdit: boolean; // اجازه ویرایش پروفایل توسط درمانگر
    allowClientSelfEdit: boolean; // اجازه ویرایش پروفایل توسط مراجع
  };
  data: {
    testDataEnabled: boolean; // ✅ خاموش/روشن کردن داده تست در کل سیستم (Mock)
  };
};

const CLIENT_KEY = "rane_settings_client_v1";
const ADMIN_KEY = "rane_settings_admin_v1";

export const DEFAULT_CLIENT_SETTINGS: ClientSettings = {
  version: 1,
  profile: {
    fullName: "مراجع نمونه",
    phone: "09xxxxxxxxx",
    city: "مشهد",
    emergencyContact: "نام + شماره",
  },
  preferences: {
    theme: "system",
    anxietyMode: false,
    language: "fa",
  },
  notifications: {
    emailReminders: true,
    smsReminders: false,
    marketing: false,
    weeklyDigest: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeoutMin: 60,
    loginAlerts: true,
  },
  data: {
    testDataEnabled: true,
  },
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  version: 1,
  clinic: {
    clinicName: "کلینیک تخصصی رانه",
    publicPhone: "051-xxxxxxx",
    publicEmail: "info@example.com",
    address: "آدرس نمونه (قابل تغییر)",
    city: "مشهد",
    timezone: "Asia/Tehran",
  },
  policies: {
    cancellationHours: 12,
    noShowFeeEnabled: false,
    noShowFeeAmount: 0,
    requireIntakeForFirstVisit: true,
  },
  notifications: {
    adminEmail: "admin@example.com",
    newBookingEmail: true,
    newBookingSms: false,
    dailyReport: true,
  },
  security: {
    enforceStrongPasswords: true,
    allowTherapistSelfEdit: true,
    allowClientSelfEdit: true,
  },
  data: {
    testDataEnabled: true,
  },
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadClientSettings(): ClientSettings {
  const data = safeParse<ClientSettings>(typeof window !== "undefined" ? localStorage.getItem(CLIENT_KEY) : null);
  if (!data || data.version !== 1) return DEFAULT_CLIENT_SETTINGS;
  return { ...DEFAULT_CLIENT_SETTINGS, ...data };
}

export function saveClientSettings(next: ClientSettings) {
  localStorage.setItem(CLIENT_KEY, JSON.stringify(next));
}

export function resetClientSettings() {
  localStorage.removeItem(CLIENT_KEY);
}

export function loadAdminSettings(): AdminSettings {
  const data = safeParse<AdminSettings>(typeof window !== "undefined" ? localStorage.getItem(ADMIN_KEY) : null);
  if (!data || data.version !== 1) return DEFAULT_ADMIN_SETTINGS;
  return { ...DEFAULT_ADMIN_SETTINGS, ...data };
}

export function saveAdminSettings(next: AdminSettings) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(next));
}

export function resetAdminSettings() {
  localStorage.removeItem(ADMIN_KEY);
}