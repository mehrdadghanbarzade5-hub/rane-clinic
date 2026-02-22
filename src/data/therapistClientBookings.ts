// src/data/therapistClientBookings.ts
import type { Booking } from "@/data/mockDb";

/**
 * ✅ مطمئن‌ترین روش: نگاشت مستقیم clientId -> bookingIds
 * چون در داده‌های شما Booking ها clientId ندارند.
 * این فایل هیچ چیزی در mockDb.ts تغییر نمی‌دهد => هیچ فایل دیگری ارور نمی‌گیرد.
 */
export const CLIENT_BOOKING_IDS_BY_ID: Record<string, string[]> = {
  // طبق mockDb شما:
  // b-101 و b-102 برای client@rane.com و therapistId: t-1 هستند
  "c-101": ["b-101", "b-102"],

  // اگر برای c-102 رزرو جدا داری، اینجا بگذار
  // مثال: "c-102": ["b-201"],
  "c-102": [],

  "c-103": [],
};

/** نرمال‌سازی امن */
function norm(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/**
 * رزروهای مربوط به یک clientId را برمی‌گرداند:
 * 1) اگر در آینده Booking clientId داشت => از آن استفاده می‌کند
 * 2) اگر نه => با booking.id از Map تطبیق می‌دهد (100% قطعی)
 */
export function getBookingsForClient(
  clientId: string,
  allBookings: Booking[]
): Booking[] {
  const id = norm(clientId);

  // 1) اگر بعضی داده‌ها clientId داشتند
  const byClientId = allBookings.filter((b: any) => norm(b?.clientId) === id);
  if (byClientId.length > 0) return byClientId;

  // 2) تطبیق قطعی با bookingId
  const bookingIds = (CLIENT_BOOKING_IDS_BY_ID[clientId] ?? []).map(norm);
  if (bookingIds.length === 0) return [];

  return allBookings.filter((b) => bookingIds.includes(norm(b.id)));
}
