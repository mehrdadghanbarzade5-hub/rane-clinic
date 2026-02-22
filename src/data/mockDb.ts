export type BookingStatus = "pending" | "confirmed" | "done" | "canceled";

export type Therapist = {
  id: string;
  name: string;
  specialties: string[];
  /**
   * ✅ برای پنل مستقل (نمونه اولیه)
   * اگر وجود داشته باشد، می‌توانیم داده‌ها را با session.user.email جدا کنیم.
   */
  email?: string;
};

export type Booking = {
  id: string;

  // ✅ برای وصل شدن رزرو به پروفایل مراجع (مثل c-101)
  clientId?: string;

  clientEmail: string;
  therapistId: string;
  startsAtISO: string; // ISO string
  endsAtISO: string;
  status: BookingStatus;

  // what client can see
  therapistTasks: { id: string; title: string; done: boolean }[];
  therapistNoteToClient: string;

  // client private note (for therapist only) - no DB yet => localStorage will override
  clientPrivateNoteSeed?: string;
};

// ===============================
// ✅ Test/Dummy Data Toggle
// - اگر این مقدار false شود، فقط داده‌های پایه می‌ماند
// - برای خاموش کردن راحت در .env.local:
//   NEXT_PUBLIC_RANE_TEST_DATA=0
// ===============================
const ENABLE_TEST_DATA = process.env.NEXT_PUBLIC_RANE_TEST_DATA !== "0";

// ===============================
// ✅ Therapist accounts (Prototype: فقط ۲ درمانگر)
// ===============================
export type TherapistAccount = {
  therapistId: string;
  email: string;
  displayName: string; // نام رسمی نمایشی
};

export const THERAPIST_ACCOUNTS: TherapistAccount[] = [
  {
    therapistId: "t-2",
    email: "amir.noohakhan@rane.com",
    displayName: "دکتر امیرحسین نوحه‌خوان",
  },
  {
    therapistId: "t-1",
    email: "reyhane.afshar@rane.com",
    displayName: "دکتر ریحانه افشار",
  },
];

function normEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

export function getTherapistIdByEmail(email: string): string | null {
  const e = normEmail(email);
  const acc = THERAPIST_ACCOUNTS.find((a) => normEmail(a.email) === e);
  return acc?.therapistId ?? null;
}

export function getTherapistAccountByEmail(email: string): TherapistAccount | null {
  const e = normEmail(email);
  return THERAPIST_ACCOUNTS.find((a) => normEmail(a.email) === e) ?? null;
}

// ===============================
// Helpers (time)
// ===============================
const now = new Date();

function addDaysISO(days: number) {
  const x = new Date(now);
  x.setDate(x.getDate() + days);
  return x.toISOString();
}

function addDaysMinutesISO(days: number, minutesFromStart: number) {
  const x = new Date(now);
  x.setDate(x.getDate() + days);
  x.setMinutes(x.getMinutes() + minutesFromStart);
  return x.toISOString();
}

// ===============================
// Therapists
// ===============================
export const therapists: Therapist[] = [
  {
    id: "t-1",
    name: "ریحانه افشار",
    email: "reyhane.afshar@rane.com",
    specialties: ["کودک", "اضطراب", "تنظیم هیجان"],
  },
  {
    id: "t-2",
    name: "امیرحسین نوحه‌خوان",
    email: "amir.noohakhan@rane.com",
    specialties: ["اوتیسم", "بازی‌درمانی", "نیازهای ویژه"],
  },

  // ✅ درمانگرهای تستی اضافی (صرفاً برای تست UI/لیست‌ها) — قابل خاموش شدن
  ...(ENABLE_TEST_DATA
    ? ([
        {
          id: "t-x1",
          name: "درمانگر تستی ۱",
          email: "test.therapist1@rane.com",
          specialties: ["مشاوره فردی", "استرس"],
        },
        {
          id: "t-x2",
          name: "درمانگر تستی ۲",
          email: "test.therapist2@rane.com",
          specialties: ["زوج‌درمانی", "ارتباط"],
        },
      ] satisfies Therapist[])
    : []),
];

// ===============================
// Bookings (جلسات/رزروها)
// ===============================
const BASE_BOOKINGS: Booking[] = [
  {
    id: "b-101",
    clientId: "c-101",
    clientEmail: "client@rane.com",
    therapistId: "t-1",
    startsAtISO: addDaysMinutesISO(2, 0),
    endsAtISO: addDaysMinutesISO(2, 50),
    status: "confirmed",
    therapistTasks: [
      { id: "task-1", title: "تمرین تنفس ۴-۷-۸ (روزانه ۲ بار)", done: false },
      { id: "task-2", title: "ثبت احساسات روزانه (۳ خط)", done: true },
    ],
    therapistNoteToClient: "در جلسه بعد روی محرک‌های اصلی اضطراب کار می‌کنیم.",
    clientPrivateNoteSeed: "گاهی شب‌ها شدت نگرانی بالا می‌رود.",
  },
  {
    id: "b-102",
    clientId: "c-101",
    clientEmail: "client@rane.com",
    therapistId: "t-1",
    startsAtISO: addDaysMinutesISO(-7, 0),
    endsAtISO: addDaysMinutesISO(-7, 50),
    status: "done",
    therapistTasks: [{ id: "task-3", title: "نوشتن ۳ موقعیت استرس‌زا و واکنش‌ها", done: true }],
    therapistNoteToClient:
      "پیشرفت خوب بود. در هفته‌ی آینده یک موقعیت را انتخاب کن و روی مواجهه‌ی تدریجی کار کن.",
    clientPrivateNoteSeed: "وقتی فشار کاری زیاد می‌شود، زود کلافه می‌شوم.",
  },
  {
    id: "b-201",
    clientId: "c-201",
    clientEmail: "someone@rane.com",
    therapistId: "t-2",
    startsAtISO: addDaysMinutesISO(3, 0),
    endsAtISO: addDaysMinutesISO(3, 45),
    status: "pending",
    therapistTasks: [{ id: "task-x", title: "فرم Intake را تکمیل کنید", done: false }],
    therapistNoteToClient: "برای شروع درمان، تکمیل پرسشنامه جلسه اول ضروری است.",
  },
];

// ✅ داده‌های تستی اضافه برای افزایش پوشش تست در پنل درمانگر/مراجع
const EXTRA_TEST_BOOKINGS: Booking[] = ENABLE_TEST_DATA
  ? [
      // ---------------------------
      // CLIENT اصلی تست: client@rane.com  (c-101) → داده‌های متنوع برای پنل مراجع
      // ---------------------------
      {
        id: "b-105",
        clientId: "c-101",
        clientEmail: "client@rane.com",
        therapistId: "t-1",
        startsAtISO: addDaysMinutesISO(6, 0),
        endsAtISO: addDaysMinutesISO(6, 50),
        status: "pending",
        therapistTasks: [{ id: "task-105-1", title: "ثبت افکار خودکار (روزانه)", done: false }],
        therapistNoteToClient: "این هفته تمرکز روی افکار خودکار و بازسازی شناختی است.",
        clientPrivateNoteSeed: "گاهی افکار مزاحم ناگهانی می‌آید.",
      },
      {
        id: "b-106",
        clientId: "c-101",
        clientEmail: "client@rane.com",
        therapistId: "t-1",
        startsAtISO: addDaysMinutesISO(10, 0),
        endsAtISO: addDaysMinutesISO(10, 50),
        status: "confirmed",
        therapistTasks: [{ id: "task-106-1", title: "تمرین ریلکسیشن عضلانی (۳ روز)", done: false }],
        therapistNoteToClient: "قبل از جلسه بعد تمرین ریلکسیشن را انجام بده.",
        clientPrivateNoteSeed: "با ریلکسیشن بهتر می‌خوابم.",
      },
      {
        id: "b-107",
        clientId: "c-101",
        clientEmail: "client@rane.com",
        therapistId: "t-1",
        startsAtISO: addDaysMinutesISO(-2, 0),
        endsAtISO: addDaysMinutesISO(-2, 50),
        status: "done",
        therapistTasks: [{ id: "task-107-1", title: "مواجهه تدریجی با موقعیت کوچک", done: true }],
        therapistNoteToClient: "عالی بود—قدم بعدی افزایش تدریجی مواجهه است.",
        clientPrivateNoteSeed: "وقتی وارد جمع شدم اولش سخت بود ولی بهتر شد.",
      },
      {
        id: "b-108",
        clientId: "c-101",
        clientEmail: "client@rane.com",
        therapistId: "t-2",
        startsAtISO: addDaysMinutesISO(-9, 0),
        endsAtISO: addDaysMinutesISO(-9, 45),
        status: "canceled",
        therapistTasks: [],
        therapistNoteToClient: "—",
        clientPrivateNoteSeed: "این جلسه را مجبور شدم کنسل کنم.",
      },

      // ---------------------------
      // درمانگر t-1 (افشار): چند جلسه آینده/گذشته برای چند مراجع مختلف
      // ---------------------------
      {
        id: "b-103",
        clientId: "c-102",
        clientEmail: "client102@rane.com",
        therapistId: "t-1",
        startsAtISO: addDaysMinutesISO(1, 0),
        endsAtISO: addDaysMinutesISO(1, 50),
        status: "pending",
        therapistTasks: [{ id: "task-103-1", title: "ثبت الگوی خواب (۳ روز)", done: false }],
        therapistNoteToClient: "لطفاً الگوی خواب را ثبت کن تا جلسه بعد تحلیل کنیم.",
        clientPrivateNoteSeed: "بدون دلیل از خواب می‌پرم.",
      },
      {
        id: "b-104",
        clientId: "c-103",
        clientEmail: "client103@rane.com",
        therapistId: "t-1",
        startsAtISO: addDaysMinutesISO(-14, 0),
        endsAtISO: addDaysMinutesISO(-14, 50),
        status: "done",
        therapistTasks: [{ id: "task-104-1", title: "لیست محرک‌های اضطراب (حداقل ۵ مورد)", done: true }],
        therapistNoteToClient: "محرک‌ها مشخص شد؛ قدم بعدی مواجهه تدریجی است.",
        clientPrivateNoteSeed: "در محیط‌های شلوغ خیلی مضطرب می‌شوم.",
      },
      {
        id: "b-109",
        clientId: "c-104",
        clientEmail: "client104@rane.com",
        therapistId: "t-1",
        startsAtISO: addDaysMinutesISO(14, 0),
        endsAtISO: addDaysMinutesISO(14, 50),
        status: "confirmed",
        therapistTasks: [{ id: "task-109-1", title: "ثبت چرخه افکار-احساس-رفتار", done: false }],
        therapistNoteToClient: "چرخه را ثبت کن تا جلسه بعد بررسی کنیم.",
        clientPrivateNoteSeed: "وقتی استرس زیاد می‌شود سریع عصبانی می‌شوم.",
      },

      // ---------------------------
      // درمانگر t-2 (نوحه‌خوان): چند جلسه برای تست history/upcoming
      // ---------------------------
      {
        id: "b-202",
        clientId: "c-202",
        clientEmail: "client202@rane.com",
        therapistId: "t-2",
        startsAtISO: addDaysMinutesISO(5, 0),
        endsAtISO: addDaysMinutesISO(5, 45),
        status: "confirmed",
        therapistTasks: [{ id: "task-202-1", title: "تمرین تعامل والد-کودک (۱۵ دقیقه)", done: false }],
        therapistNoteToClient: "تمرین تعامل را انجام دهید و مشاهده‌ها را بنویسید.",
        clientPrivateNoteSeed: "کودک دیر ارتباط می‌گیرد.",
      },
      {
        id: "b-203",
        clientId: "c-201",
        clientEmail: "someone@rane.com",
        therapistId: "t-2",
        startsAtISO: addDaysMinutesISO(-3, 0),
        endsAtISO: addDaysMinutesISO(-3, 45),
        status: "done",
        therapistTasks: [{ id: "task-203-1", title: "لیست علایق کودک برای بازی‌درمانی", done: true }],
        therapistNoteToClient: "جلسه خوب بود؛ علایق کودک برای طراحی بازی‌ها مهم است.",
        clientPrivateNoteSeed: "با اسباب‌بازی‌های خاص همکاری می‌کند.",
      },
      {
        id: "b-204",
        clientId: "c-204",
        clientEmail: "client204@rane.com",
        therapistId: "t-2",
        startsAtISO: addDaysMinutesISO(-1, 0),
        endsAtISO: addDaysMinutesISO(-1, 45),
        status: "canceled",
        therapistTasks: [],
        therapistNoteToClient: "—",
        clientPrivateNoteSeed: "—",
      },
      {
        id: "b-205",
        clientId: "c-205",
        clientEmail: "client205@rane.com",
        therapistId: "t-2",
        startsAtISO: addDaysMinutesISO(2, 0),
        endsAtISO: addDaysMinutesISO(2, 45),
        status: "pending",
        therapistTasks: [{ id: "task-205-1", title: "تکمیل فرم Intake (ضروری)", done: false }],
        therapistNoteToClient: "قبل از جلسه اول، فرم intake را کامل کنید.",
        clientPrivateNoteSeed: "می‌خواهم مطمئن شوم همه چیز را درست گفته‌ام.",
      },
    ]
  : [];

export const bookings: Booking[] = [...BASE_BOOKINGS, ...EXTRA_TEST_BOOKINGS];

// ===============================
// Derived exports for therapist panel (نسخه فعلی)
// ⚠️ این exportها را دست نمی‌زنیم تا چیزی در UI فعلی نشکند.
// ===============================
export type TherapistClientListItem = {
  id: string;
  fullName: string;
  email: string;
  status: "active" | "inactive";
  lastSessionAtISO?: string;
  nextSessionAtISO?: string;
};

export type ClientDetails = {
  id: string;
  fullName: string;
  email: string;

  intakeSummary: string;
  intakeFields: { label: string; value: string }[];

  sessions: { id: string; date: string; status: string; title: string }[];
  upcoming: { id: string; date: string; time: string; status: string; title: string }[];

  tasks: { id: string; text: string; due?: string; done: boolean }[];

  therapistNote: string; // یادداشت درمانگر برای مراجع (قابل مشاهده برای مراجع)
  clientPrivateNote: string; // یادداشت خصوصی مراجع (فقط برای درمانگر)
  therapistPrivateNote: string; // یادداشت خصوصی درمانگر (اختیاری)
};

function toDateLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

function toTimeLabel(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * لیست مراجعین درمانگر (برای صفحه /panel/therapist/clients)
 * از روی bookings استخراج می‌شود تا به دیتای واقعی mock شما وصل باشد.
 */
export const MOCK_THERAPIST_CLIENTS: TherapistClientListItem[] = Array.from(
  new Map(
    bookings.map((b) => {
      const id = `c-${b.id}`; // یکتا برای هر رزرو (در نسخه فعلی)
      const fullName =
        (typeof b.clientEmail === "string" && b.clientEmail.includes("@")
          ? b.clientEmail.split("@")[0]
          : "مراجع") || "مراجع";

      const email = b.clientEmail ?? "unknown@rane.com";

      return [
        id,
        {
          id,
          fullName,
          email,
          status: "active",
          lastSessionAtISO: b.startsAtISO,
          nextSessionAtISO: b.startsAtISO,
        },
      ] as const;
    })
  ).values()
);

/**
 * جزئیات هر مراجع (برای صفحه /panel/therapist/clients/[id])
 * کلیدش id همان MOCK_THERAPIST_CLIENTS است.
 */
export const MOCK_CLIENT_DETAILS: Record<string, ClientDetails> = Object.fromEntries(
  MOCK_THERAPIST_CLIENTS.map((c) => {
    // یک booking مرتبط پیدا کنیم (بر اساس ایمیل)
    const related = bookings
      .filter((b) => (b.clientEmail ?? "") === c.email)
      .sort((a, b) => (a.startsAtISO > b.startsAtISO ? 1 : -1));

    const upcoming = related
      .filter((b) => b.status === "pending" || b.status === "confirmed")
      .slice(0, 3)
      .map((b) => ({
        id: b.id,
        date: toDateLabel(b.startsAtISO),
        time: toTimeLabel(b.startsAtISO),
        status: b.status,
        title: "جلسه درمان",
      }));

    const sessions = related.slice(0, 8).map((b) => ({
      id: b.id,
      date: toDateLabel(b.startsAtISO),
      status: b.status,
      title: "جلسه درمان",
    }));

    const tasks =
      related[0]?.therapistTasks?.map((t: any, idx: number) => ({
        id: t.id ?? `task-${idx + 1}`,
        text: t.title ?? t.text ?? "تکلیف درمانی",
        done: Boolean(t.done),
      })) ?? [];

    const therapistNote = related[0]?.therapistNoteToClient ?? "—";

    // ✅ Intake dummy متناسب‌تر (برای تست UI)
    const intakeSummary = ENABLE_TEST_DATA
      ? "خلاصه Intake (Dummy): اطلاعات اولیه مراجع، هدف درمان، شدت علائم و وضعیت تکمیل فرم."
      : "خلاصه Intake (Mock): اطلاعات اولیه جلسه اول و وضعیت تکمیل پرسشنامه.";

    const intakeFields = ENABLE_TEST_DATA
      ? [
          { label: "هدف درمان", value: "کاهش اضطراب / بهبود خواب (تستی)" },
          { label: "شدت علائم", value: "متوسط (تستی)" },
          { label: "اولویت‌ها", value: "مدیریت استرس، تنظیم هیجان (تستی)" },
          { label: "ترجیح جلسات", value: "آنلاین (تستی)" },
        ]
      : [
          { label: "هدف درمان", value: "کاهش اضطراب و بهبود خواب" },
          { label: "شدت علائم", value: "متوسط" },
          { label: "اولویت‌ها", value: "مدیریت استرس، تنظیم هیجان" },
        ];

    return [
      c.id,
      {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        intakeSummary,
        intakeFields,
        sessions,
        upcoming,
        tasks,
        therapistNote,
        clientPrivateNote: ENABLE_TEST_DATA ? "یادداشت خصوصی مراجع (Dummy) — فقط درمانگر می‌بیند." : "—",
        therapistPrivateNote: ENABLE_TEST_DATA ? "یادداشت خصوصی درمانگر (Dummy) — فقط خود درمانگر." : "—",
      } satisfies ClientDetails,
    ] as const;
  })
);

// ===============================
// ✅ New scoped helpers (برای پنل مستقل ۲ درمانگر)
// ===============================
export function getBookingsForTherapistEmail(therapistEmail: string): Booking[] {
  const therapistId = getTherapistIdByEmail(therapistEmail);
  if (!therapistId) return [];
  return bookings.filter((b) => b.therapistId === therapistId);
}

export function getTherapistClientListForEmail(therapistEmail: string): TherapistClientListItem[] {
  const scoped = getBookingsForTherapistEmail(therapistEmail);

  // تجمیع بر اساس clientId (اگر هست) وگرنه email
  const map = new Map<string, TherapistClientListItem>();

  for (const b of scoped) {
    const key = b.clientId ?? `email:${normEmail(b.clientEmail)}`;
    const fullName =
      (typeof b.clientEmail === "string" && b.clientEmail.includes("@")
        ? b.clientEmail.split("@")[0]
        : "مراجع") || "مراجع";

    const prev = map.get(key);
    const item: TherapistClientListItem = {
      id: b.clientId ?? `c-${b.id}`, // برای سازگاری
      fullName: prev?.fullName ?? fullName,
      email: b.clientEmail,
      status: "active",
      lastSessionAtISO: prev?.lastSessionAtISO ?? b.startsAtISO,
      nextSessionAtISO: prev?.nextSessionAtISO ?? b.startsAtISO,
    };

    const starts = b.startsAtISO;
    const isPast = new Date(starts).getTime() < Date.now();
    const isFuture = !isPast;

    if (b.status === "done") {
      if (!item.lastSessionAtISO || starts > item.lastSessionAtISO) item.lastSessionAtISO = starts;
    }

    if ((b.status === "pending" || b.status === "confirmed") && isFuture) {
      if (!item.nextSessionAtISO || starts < item.nextSessionAtISO) item.nextSessionAtISO = starts;
    }

    map.set(key, item);
  }

  return Array.from(map.values());
}

export function getClientDetailsForTherapistEmail(
  therapistEmail: string,
  clientIdOrFallbackId: string
): ClientDetails | null {
  const scoped = getBookingsForTherapistEmail(therapistEmail);
  if (!scoped.length) return null;

  // تلاش اول: clientId دقیق
  const byClientId = scoped.filter((b) => b.clientId === clientIdOrFallbackId);

  // تلاش دوم: اگر آی‌دی صفحه از نوع c-b-xxx بود (fallback)، با bookings.id مچ کن
  const fallbackBookingId = clientIdOrFallbackId.startsWith("c-") ? clientIdOrFallbackId.slice(2) : "";
  const byBookingId = fallbackBookingId ? scoped.filter((b) => b.id === fallbackBookingId) : [];

  const related = (byClientId.length ? byClientId : byBookingId.length ? byBookingId : []).sort((a, b) =>
    a.startsAtISO > b.startsAtISO ? 1 : -1
  );

  if (!related.length) return null;

  const email = related[0].clientEmail;
  const fullName =
    (typeof email === "string" && email.includes("@") ? email.split("@")[0] : "مراجع") || "مراجع";

  const upcoming = related
    .filter((b) => b.status === "pending" || b.status === "confirmed")
    .slice(0, 3)
    .map((b) => ({
      id: b.id,
      date: toDateLabel(b.startsAtISO),
      time: toTimeLabel(b.startsAtISO),
      status: b.status,
      title: "جلسه درمان",
    }));

  const sessions = related.slice(0, 8).map((b) => ({
    id: b.id,
    date: toDateLabel(b.startsAtISO),
    status: b.status,
    title: "جلسه درمان",
  }));

  const tasks =
    related[0]?.therapistTasks?.map((t: any, idx: number) => ({
      id: t.id ?? `task-${idx + 1}`,
      text: t.title ?? t.text ?? "تکلیف درمانی",
      done: Boolean(t.done),
    })) ?? [];

  const therapistNote = related[0]?.therapistNoteToClient ?? "—";

  const intakeSummary = ENABLE_TEST_DATA
    ? "خلاصه Intake (Dummy-Scoped): هدف درمان، علائم اصلی، اولویت‌ها و وضعیت فرم (صرفاً تست)."
    : "خلاصه Intake (محدوده درمانگر): اطلاعات اولیه جلسه اول و وضعیت تکمیل پرسشنامه.";

  const intakeFields = ENABLE_TEST_DATA
    ? [
        { label: "هدف درمان", value: "کاهش اضطراب (Dummy)" },
        { label: "شدت علائم", value: "متوسط (Dummy)" },
        { label: "اولویت‌ها", value: "تنظیم هیجان (Dummy)" },
      ]
    : [
        { label: "هدف درمان", value: "—" },
        { label: "شدت علائم", value: "—" },
        { label: "اولویت‌ها", value: "—" },
      ];

  return {
    id: related[0].clientId ?? `c-${related[0].id}`,
    fullName,
    email,
    intakeSummary,
    intakeFields,
    sessions,
    upcoming,
    tasks,
    therapistNote,
    clientPrivateNote: related[0]?.clientPrivateNoteSeed ?? "—",
    therapistPrivateNote: ENABLE_TEST_DATA ? "یادداشت خصوصی درمانگر (Dummy)" : "—",
  };
}

// ===============================
// Referrals
// ===============================
export type ReferralStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type Referral = {
  id: string;
  createdAtISO: string;

  fromTherapistEmail: string;
  fromTherapistName: string;

  toTherapistEmail: string;
  toTherapistName: string;

  clientId: string; // مثل: c-101
  clientName: string; // مثل: "مراجع نمونه ۱۰۱"
  reason: string; // علت ارجاع
  notes?: string; // توضیحات تکمیلی

  status: ReferralStatus;

  // اگر پذیرفته شد:
  decidedAtISO?: string;

  // ✅ برای آیتم‌های بعدی (نمایش یادداشت مقصد)
  toTherapistNote?: string;
};

function isoNowPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const BASE_REFERRALS: Referral[] = [
  // نمونه‌های قبلی را نگه می‌داریم (برای اینکه چیزی نشکند)
  {
    id: "r-501",
    createdAtISO: isoNowPlusDays(-4),
    fromTherapistEmail: "therapist@rane.com",
    fromTherapistName: "درمانگر (نمونه)",
    toTherapistEmail: "therapist2@rane.com",
    toTherapistName: "درمانگر همکار (نمونه)",
    clientId: "c-101",
    clientName: "مراجع ۱۰۱",
    reason: "نیاز به ارزیابی تخصصی‌تر / رویکرد متفاوت",
    notes: "در صورت امکان جلسه‌ی اول هفته‌ی آینده تنظیم شود.",
    status: "pending",
  },
  {
    id: "r-502",
    createdAtISO: isoNowPlusDays(-12),
    fromTherapistEmail: "therapist2@rane.com",
    fromTherapistName: "درمانگر همکار (نمونه)",
    toTherapistEmail: "therapist@rane.com",
    toTherapistName: "درمانگر (نمونه)",
    clientId: "c-102",
    clientName: "مراجع ۱۰۲",
    reason: "ارجاع جهت ادامه‌ی درمان",
    notes: "پرونده و خلاصه‌ی جلسات پیوست شده (Mock).",
    status: "accepted",
    decidedAtISO: isoNowPlusDays(-9),
  },
  {
    id: "r-503",
    createdAtISO: isoNowPlusDays(-20),
    fromTherapistEmail: "therapist@rane.com",
    fromTherapistName: "درمانگر (نمونه)",
    toTherapistEmail: "therapist3@rane.com",
    toTherapistName: "درمانگر سوم (نمونه)",
    clientId: "c-103",
    clientName: "مراجع ۱۰۳",
    reason: "عدم تطابق زمان‌بندی و نیاز به درمانگر جایگزین",
    status: "rejected",
    decidedAtISO: isoNowPlusDays(-18),
  },
];

// ✅ نمونه‌های جدید برای دو درمانگر واقعی (برای تست پنل مستقل)
const EXTRA_TEST_REFERRALS: Referral[] = ENABLE_TEST_DATA
  ? [
      {
        id: "r-601",
        createdAtISO: isoNowPlusDays(-2),
        fromTherapistEmail: "reyhane.afshar@rane.com",
        fromTherapistName: "دکتر ریحانه افشار",
        toTherapistEmail: "amir.noohakhan@rane.com",
        toTherapistName: "دکتر امیرحسین نوحه‌خوان",
        clientId: "c-101",
        clientName: "مراجع ۱۰۱",
        reason: "نیاز به تخصص اوتیسم/بازی‌درمانی (Dummy)",
        notes: "در صورت امکان، جلسه ارزیابی اولیه تنظیم شود. (Dummy)",
        status: "pending",
      },
      {
        id: "r-602",
        createdAtISO: isoNowPlusDays(-10),
        fromTherapistEmail: "amir.noohakhan@rane.com",
        fromTherapistName: "دکتر امیرحسین نوحه‌خوان",
        toTherapistEmail: "reyhane.afshar@rane.com",
        toTherapistName: "دکتر ریحانه افشار",
        clientId: "c-201",
        clientName: "مراجع ۲۰۱",
        reason: "درخواست ادامه درمان در حوزه اضطراب/تنظیم هیجان (Dummy)",
        status: "accepted",
        decidedAtISO: isoNowPlusDays(-7),
        toTherapistNote: "پذیرفته شد—لطفاً زمان جلسه اول را تعیین کنید. (Dummy)",
      },
      {
        id: "r-603",
        createdAtISO: isoNowPlusDays(-6),
        fromTherapistEmail: "reyhane.afshar@rane.com",
        fromTherapistName: "دکتر ریحانه افشار",
        toTherapistEmail: "amir.noohakhan@rane.com",
        toTherapistName: "دکتر امیرحسین نوحه‌خوان",
        clientId: "c-103",
        clientName: "مراجع ۱۰۳",
        reason: "عدم هم‌خوانی زمان‌بندی و نیاز به انتقال (Dummy)",
        status: "rejected",
        decidedAtISO: isoNowPlusDays(-5),
        toTherapistNote: "متأسفانه ظرفیت تکمیل است. (Dummy)",
      },
    ]
  : [];

export const referrals: Referral[] = [...BASE_REFERRALS, ...EXTRA_TEST_REFERRALS];

export function getReferralsForTherapistEmail(therapistEmail: string) {
  const e = normEmail(therapistEmail);
  return referrals.filter(
    (r) => normEmail(r.toTherapistEmail) === e || normEmail(r.fromTherapistEmail) === e
  );
}

// ===============================
// Mini mocks (برای سازگاری با فایل‌های قدیمی احتمالی)
// ===============================
export const MOCK_THERAPISTS_MINI = [
  { name: "درمانگر A", email: "therapist@rane.com" },
  { name: "درمانگر B", email: "therapist2@rane.com" },
  { name: "درمانگر C", email: "therapist3@rane.com" },

  ...(ENABLE_TEST_DATA
    ? [
        { name: "دکتر ریحانه افشار", email: "reyhane.afshar@rane.com" },
        { name: "دکتر امیرحسین نوحه‌خوان", email: "amir.noohakhan@rane.com" },
      ]
    : []),
];

export const MOCK_THERAPIST_CLIENTS_MINI = [
  {
    id: "c-101",
    fullName: "مراجع ۱۰۱",
    email: "client101@rane.com",
    therapistEmail: "therapist@rane.com",
  },
  {
    id: "c-102",
    fullName: "مراجع ۱۰۲",
    email: "client102@rane.com",
    therapistEmail: "therapist@rane.com",
  },
  {
    id: "c-201",
    fullName: "مراجع ۲۰۱",
    email: "client201@rane.com",
    therapistEmail: "therapist2@rane.com",
  },

  ...(ENABLE_TEST_DATA
    ? [
        {
          id: "c-202",
          fullName: "مراجع ۲۰۲ (Dummy)",
          email: "client202@rane.com",
          therapistEmail: "amir.noohakhan@rane.com",
        },
        {
          id: "c-103",
          fullName: "مراجع ۱۰۳ (Dummy)",
          email: "client103@rane.com",
          therapistEmail: "reyhane.afshar@rane.com",
        },
      ]
    : []),
];

export const MOCK_REFERRALS = [
  {
    id: "ref-01",
    clientId: "c-201",
    clientName: "مراجع ۲۰۱",
    fromTherapistEmail: "therapist2@rane.com",
    fromTherapistName: "درمانگر B",
    toTherapistEmail: "therapist@rane.com",
    toTherapistName: "درمانگر A",
    reason: "ارجاع برای ادامه درمان با تمرکز CBT",
    status: "pending",
    createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },

  ...(ENABLE_TEST_DATA
    ? ([
        {
          id: "ref-02",
          clientId: "c-101",
          clientName: "مراجع ۱۰۱ (Dummy)",
          fromTherapistEmail: "reyhane.afshar@rane.com",
          fromTherapistName: "دکتر ریحانه افشار",
          toTherapistEmail: "amir.noohakhan@rane.com",
          toTherapistName: "دکتر امیرحسین نوحه‌خوان",
          reason: "ارجاع برای ارزیابی تخصصی (Dummy)",
          status: "pending",
          createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          updatedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
        {
          id: "ref-03",
          clientId: "c-202",
          clientName: "مراجع ۲۰۲ (Dummy)",
          fromTherapistEmail: "amir.noohakhan@rane.com",
          fromTherapistName: "دکتر امیرحسین نوحه‌خوان",
          toTherapistEmail: "reyhane.afshar@rane.com",
          toTherapistName: "دکتر ریحانه افشار",
          reason: "ارجاع برای ادامه درمان اضطراب (Dummy)",
          status: "accepted",
          createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
          updatedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          decisionNote: "پذیرفته شد (Dummy)",
          decidedByEmail: "reyhane.afshar@rane.com",
          decidedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
      ] as const)
    : []),
] as const;
// ======================================================
// 🟣 Therapeutic Forms Bank (NEW SECTION)
// ======================================================

export type TherapeuticForm = {
  id: string;
  title: string;
  category: string;
  description: string;
  estimatedMinutes: number;
};

export type FormAssignmentStatus = "assigned" | "completed";

export type FormAssignment = {
  id: string;
  formId: string;
  clientId: string;
  therapistEmail: string;
  assignedAtISO: string;
  status: FormAssignmentStatus;
  completedAtISO?: string;
};

// ===============================
// 🟢 Forms (Bank)
// ===============================

const BASE_THERAPEUTIC_FORMS: TherapeuticForm[] = [
  {
    id: "form-gad7",
    title: "مقیاس اضطراب GAD-7",
    category: "اضطراب",
    description: "ارزیابی شدت اضطراب در دو هفته اخیر.",
    estimatedMinutes: 5,
  },
  {
    id: "form-phq9",
    title: "مقیاس افسردگی PHQ-9",
    category: "افسردگی",
    description: "ارزیابی علائم افسردگی در دو هفته اخیر.",
    estimatedMinutes: 5,
  },
];

const EXTRA_TEST_FORMS: TherapeuticForm[] = ENABLE_TEST_DATA
  ? [
      {
        id: "form-autism-screen",
        title: "چک‌لیست غربالگری اوتیسم (Dummy)",
        category: "اوتیسم",
        description: "بررسی اولیه شاخص‌های طیف اوتیسم (تستی).",
        estimatedMinutes: 10,
      },
      {
        id: "form-sleep",
        title: "پرسشنامه کیفیت خواب (Dummy)",
        category: "خواب",
        description: "ارزیابی کیفیت و الگوی خواب (تستی).",
        estimatedMinutes: 7,
      },
    ]
  : [];

export const therapeuticForms: TherapeuticForm[] = [
  ...BASE_THERAPEUTIC_FORMS,
  ...EXTRA_TEST_FORMS,
];

// ===============================
// 🟢 Assignments (Form → Client)
// ===============================

const BASE_FORM_ASSIGNMENTS: FormAssignment[] = [];

const EXTRA_TEST_ASSIGNMENTS: FormAssignment[] = ENABLE_TEST_DATA
  ? [
      {
        id: "assign-1",
        formId: "form-gad7",
        clientId: "c-101",
        therapistEmail: "reyhane.afshar@rane.com",
        assignedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        status: "assigned",
      },
      {
        id: "assign-2",
        formId: "form-autism-screen",
        clientId: "c-201",
        therapistEmail: "amir.noohakhan@rane.com",
        assignedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        status: "completed",
        completedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      },
    ]
  : [];

export const formAssignments: FormAssignment[] = [
  ...BASE_FORM_ASSIGNMENTS,
  ...EXTRA_TEST_ASSIGNMENTS,
];

// ===============================
// 🟢 Scoped Helpers
// ===============================

export function getFormsForTherapist() {
  return therapeuticForms;
}

export function getFormAssignmentsForTherapist(therapistEmail: string) {
  const e = normEmail(therapistEmail);
  return formAssignments.filter((a) => normEmail(a.therapistEmail) === e);
}

export function getFormAssignmentsForClient(
  therapistEmail: string,
  clientId: string
) {
  const e = normEmail(therapistEmail);
  return formAssignments.filter(
    (a) => normEmail(a.therapistEmail) === e && a.clientId === clientId
  );
}