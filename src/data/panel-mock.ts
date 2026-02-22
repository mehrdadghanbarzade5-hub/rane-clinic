// src/data/panel-mock.ts
export type Role = "admin" | "therapist" | "client";

export type SessionStatus = "pending" | "confirmed" | "done" | "canceled";

export type ClientSession = {
  id: string;
  therapistName: string;
  dateISO: string; // "2026-02-18T10:30:00"
  durationMin: number;
  status: SessionStatus;
  verifyStatus: "در انتظار تایید" | "تایید شد" | "لغو شد";
  paymentStatus: "پرداخت نشده" | "پرداخت شده" | "بازپرداخت";
  meetingType: "حضوری" | "آنلاین";
  roomOrLink?: string;
};

export type TherapistTask = {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  dueISO?: string;
};

export type TherapistNote = {
  sessionId: string;
  noteFromTherapist: string; // قابل مشاهده توسط مراجع
};

export type ClientPrivateNote = {
  sessionId: string;
  privateNoteForTherapist?: string; // اختیاری - فقط درمانگر ببیند
};

export type IntakeForm = {
  clientId: string;
  clientName: string;
  submittedISO: string;
  summary: string;
  riskLevel: "کم" | "متوسط" | "بالا";
};

export type Referral = {
  id: string;
  fromTherapist: string;
  toTherapist: string;
  clientName: string;
  reason: string;
  status: "در انتظار" | "پذیرفته شد" | "رد شد";
};

export const MOCK = {
  client: {
    stats: {
      upcoming: 1,
      payments: 0,
      intake: "در انتظار",
    },
    sessions: [
      {
        id: "S-101",
        therapistName: "دکتر ریحانه افشار",
        dateISO: "2026-02-18T10:30:00",
        durationMin: 50,
        status: "confirmed",
        verifyStatus: "تایید شد",
        paymentStatus: "پرداخت نشده",
        meetingType: "آنلاین",
        roomOrLink: "https://meet.example.com/rane/S-101",
      },
      {
        id: "S-088",
        therapistName: "آقای امیرحسین نوحه‌خوان",
        dateISO: "2026-02-10T18:00:00",
        durationMin: 50,
        status: "done",
        verifyStatus: "تایید شد",
        paymentStatus: "پرداخت شده",
        meetingType: "حضوری",
        roomOrLink: "اتاق ۳",
      },
    ] as ClientSession[],
    tasks: [
      {
        id: "T-1",
        sessionId: "S-101",
        title: "تمرین تنفس ۴-۷-۸",
        description: "روزانه ۲ بار، هر بار ۴ چرخه انجام شود و حس کلی ثبت شود.",
        dueISO: "2026-02-18T23:59:00",
      },
    ] as TherapistTask[],
    therapistNotes: [
      {
        sessionId: "S-101",
        noteFromTherapist:
          "پیشرفت خوب بوده. این هفته روی تنظیم هیجان و خواب تمرکز کنیم.",
      },
    ] as TherapistNote[],
    clientPrivateNotes: [
      {
        sessionId: "S-101",
        privateNoteForTherapist: "",
      },
    ] as ClientPrivateNote[],
  },

  therapist: {
    stats: {
      weekSessions: 5,
      activeClients: 8,
      newMessages: 0,
    },
    schedule: [
      { time: "09:00", title: "جلسه S-101 (آنلاین)", client: "مراجع: N." },
      { time: "11:00", title: "جلسه S-102 (حضوری)", client: "مراجع: A." },
      { time: "16:00", title: "سوپرویژن", client: "داخلی" },
    ],
    intakes: [
      {
        clientId: "C-21",
        clientName: "مراجع N.",
        submittedISO: "2026-02-15T12:10:00",
        summary: "اضطراب، خواب نامنظم، نگرانی دائمی.",
        riskLevel: "متوسط",
      },
    ] as IntakeForm[],
    referrals: [
      {
        id: "R-1",
        fromTherapist: "دکتر ریحانه افشار",
        toTherapist: "آقای امیرحسین نوحه‌خوان",
        clientName: "مراجع A.",
        reason: "نیاز به بازی‌درمانی تخصصی",
        status: "در انتظار",
      },
    ] as Referral[],
  },

  admin: {
    stats: {
      therapists: 6,
      todayBookings: 2,
      newRequests: 1,
    },
    analytics: {
      totalSessions: 124,
      returnRate: "41%",
      transferRate: "8%",
    },
    busyHours: [
      { day: "شنبه", peak: "18:00-21:00", low: "09:00-11:00" },
      { day: "دوشنبه", peak: "17:00-20:00", low: "10:00-12:00" },
    ],
    content: [
      { id: "M-1", title: "مقاله: مدیریت اضطراب", status: "منتشر شده" },
      { id: "M-2", title: "تمرین: ذهن‌آگاهی ۵ دقیقه‌ای", status: "پیش‌نویس" },
    ],
    languages: [{ code: "fa", status: "فعال" }, { code: "en", status: "به‌زودی" }],
  },
};
