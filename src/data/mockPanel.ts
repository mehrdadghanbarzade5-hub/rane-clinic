export type TherapistSessionStatus = "scheduled" | "done" | "cancelled" | "no_show";

export type TherapistScheduleItem = {
  id: string;
  clientId: string;
  clientName: string;
  datetimeISO: string; // "2026-02-16T10:30:00"
  durationMin: number; // 45
  type: "online" | "in_person";
  status: TherapistSessionStatus;
};

export type Client = {
  id: string;
  fullName: string;
  phone?: string;
  age?: number;
  topic: "anxiety" | "relationship" | "parenting" | "lowMood" | "other";
  risk: "low" | "medium" | "high";
  active: boolean;
  lastSessionISO?: string;
};

export type Intake = {
  clientId: string;
  submittedAtISO: string;
  summary: string;
  answers: { q: string; a: string }[];
};

export type Referral = {
  id: string;
  fromTherapist: string;
  toTherapist: string;
  clientId: string;
  clientName: string;
  reason: string;
  status: "pending" | "accepted" | "rejected";
  createdAtISO: string;
};

export type TherapistClient = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  lastSession: string;
  nextSession: string;
  status: "در انتظار" | "فعال" | "نیاز به پیگیری" | "بسته شده";
};



export const MOCK_THERAPIST_CLIENTS: TherapistClient[] = [
  {
    id: "c-101",
    name: "مراجع ۱۰۱",
    phone: "09xx xxx xxxx",
    active: true,
    lastSession: "1404/11/12",
    nextSession: "1404/11/26",
    status: "فعال",
  },
  {
    id: "c-102",
    name: "مراجع ۱۰۲",
    phone: "09xx xxx xxxx",
    active: true,
    lastSession: "1404/11/08",
    nextSession: "1404/11/22",
    status: "نیاز به پیگیری",
  },
  {
    id: "c-103",
    name: "مراجع ۱۰۳",
    phone: "09xx xxx xxxx",
    active: false,
    lastSession: "1404/10/29",
    nextSession: "—",
    status: "بسته شده",
  },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: "c-101",
    fullName: "مراجع نمونه ۱۰۱",
    phone: "09xxxxxxxxx",
    age: 27,
    topic: "anxiety",
    risk: "medium",
    active: true,
    lastSessionISO: "2026-02-12T16:00:00",
  },
  {
    id: "c-102",
    fullName: "مراجع نمونه ۱۰۲",
    age: 34,
    topic: "relationship",
    risk: "low",
    active: true,
    lastSessionISO: "2026-02-10T10:30:00",
  },
  {
    id: "c-103",
    fullName: "مراجع نمونه ۱۰۳",
    age: 10,
    topic: "parenting",
    risk: "high",
    active: false,
    lastSessionISO: "2026-01-28T12:00:00",
  },
];

export const MOCK_CLIENT_DETAILS: Record<
  string,
  {
    intakeSummary: string;
    sessions: { id: string; date: string; status: string; title: string }[];
    tasks: { id: string; text: string }[];
    therapistNote: string;
    clientPrivateNote?: string;
  }
> = {
  "c-101": {
    intakeSummary:
      "علائم اضطراب موقعیت‌محور، مشکل خواب، تمرکز پایین. هدف درمان: کاهش نگرانی + روتین خواب.",
    sessions: [
      { id: "s1", date: "1404/11/20", status: "رزرو شده", title: "جلسه ۱" },
      { id: "s2", date: "1404/11/27", status: "رزرو شده", title: "جلسه ۲" },
      { id: "s3", date: "1404/11/13", status: "انجام شده", title: "جلسه ۰" },
    ],
    tasks: [
      { id: "t1", text: "ثبت افکار خودکار روزانه (حداقل ۵ مورد)" },
      { id: "t2", text: "تمرین تنفس ۴-۷-۸ روزی ۲ بار" },
    ],
    therapistNote:
      "روی الگوی نگرانی و اجتناب کار می‌کنیم. در جلسه بعد: بازسازی شناختی.",
    clientPrivateNote:
      "هفته سختی بود، خوابم کم شد ولی تمرین تنفس کمک کرد.",
  },
  "c-102": {
    intakeSummary: "حساسیت اجتماعی و استرس کاری. هدف: مهارت جرأت‌مندی.",
    sessions: [
      { id: "s1", date: "1404/11/22", status: "رزرو شده", title: "جلسه ۱" },
    ],
    tasks: [{ id: "t1", text: "ثبت موقعیت‌های دشوار اجتماعی و پاسخ‌ها" }],
    therapistNote: "شروع با ارزیابی موقعیت‌های برانگیزاننده.",
    clientPrivateNote: "",
  },
  "c-103": {
    intakeSummary: "پیگیری دوره‌ای. هدف: نگهداری و پیشگیری از عود.",
    sessions: [{ id: "s1", date: "1404/11/10", status: "انجام شده", title: "جلسه ۱" }],
    tasks: [{ id: "t1", text: "مرور برنامه خودمراقبتی هفتگی" }],
    therapistNote: "وضعیت پایدار.",
  },
};



export const MOCK_SCHEDULE: TherapistScheduleItem[] = [
  {
    id: "s-9001",
    clientId: "c-101",
    clientName: "مراجع نمونه ۱۰۱",
    datetimeISO: "2026-02-16T10:30:00",
    durationMin: 45,
    type: "online",
    status: "scheduled",
  },
  {
    id: "s-9002",
    clientId: "c-102",
    clientName: "مراجع نمونه ۱۰۲",
    datetimeISO: "2026-02-16T12:00:00",
    durationMin: 45,
    type: "in_person",
    status: "scheduled",
  },
  {
    id: "s-9003",
    clientId: "c-101",
    clientName: "مراجع نمونه ۱۰۱",
    datetimeISO: "2026-02-12T16:00:00",
    durationMin: 45,
    type: "online",
    status: "done",
  },
];

export const MOCK_INTAKES: Intake[] = [
  {
    clientId: "c-101",
    submittedAtISO: "2026-02-05T09:20:00",
    summary:
      "اضطراب موقع تصمیم‌گیری، نگرانی‌های تکرارشونده، اختلال خواب خفیف.",
    answers: [
      { q: "دلیل مراجعه؟", a: "اضطراب و نگرانی دائمی" },
      { q: "شدت مشکل از ۱ تا ۱۰؟", a: "۷" },
      { q: "سابقه درمان؟", a: "ندارد" },
    ],
  },
  {
    clientId: "c-102",
    submittedAtISO: "2026-02-03T11:10:00",
    summary: "تعارض در رابطه و مشکل در مرزبندی.",
    answers: [
      { q: "دلیل مراجعه؟", a: "چالش‌های ارتباطی" },
      { q: "شدت مشکل از ۱ تا ۱۰؟", a: "۵" },
      { q: "هدف درمان؟", a: "بهبود مهارت ارتباطی" },
    ],
  },
];

export const MOCK_REFERRALS: Referral[] = [
  {
    id: "r-1",
    fromTherapist: "therapist@rane.com",
    toTherapist: "therapist2@rane.com",
    clientId: "c-103",
    clientName: "مراجع نمونه ۱۰۳",
    reason: "نیاز به تجربه بیشتر در کار با کودک / ارجاع تخصصی",
    status: "pending",
    createdAtISO: "2026-02-14T14:00:00",
  },
];
