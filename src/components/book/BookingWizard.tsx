"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { STEPS, StepId } from "@/components/booking/BookingSteps";
import { mockSlots, Slot, BusyLevel } from "@/components/booking/mockSlots";
import { THERAPISTS as therapists } from "@/data/therapists";

type VisitedAnswer = "yes" | "no" | null; // yes=قبلا مراجعه داشته، no=اولین مراجعه
type Topic = { id: string; title: string; hint: string; tags: string[] };

const TOPICS: Topic[] = [
  { id: "anxiety", title: "اضطراب و فشار ذهنی", hint: "وقتی ذهن بی‌وقفه درگیر است.", tags: ["اضطراب"] },
  { id: "mood", title: "خلق پایین و بی‌انگیزگی", hint: "وقتی انرژی کم شده یا امید دور شده.", tags: ["افسردگی"] },
  { id: "relations", title: "روابط و خانواده", hint: "وقتی ارتباط‌ها نیاز به بازسازی دارند.", tags: ["روابط", "خانواده"] },
  { id: "child", title: "کودک و نوجوان", hint: "مسیر امن برای رشد و همراهی.", tags: ["کودک", "نوجوان", "والدگری"] },
];

function levelLabel(level: BusyLevel) {
  if (level === "quiet") return "خلوت";
  if (level === "normal") return "متعادل";
  return "شلوغ";
}

function buildFallbackSlots(date: string): Slot[] {
  // اسلات‌های ثابت و “لوکس” (همه قابل رزرو)
  const times = ["09:00", "10:30", "12:00", "14:00", "16:00", "18:00", "20:00"];

  // یک الگوی سبک شلوغ/خلوت بر اساس روز (برای تنوع)
  const day = Number(date.slice(-2)) || 1;

  return times.map((time, i) => {
    const mod = (day + i) % 3;
    const level: BusyLevel = mod === 0 ? "quiet" : mod === 1 ? "normal" : "busy";

    return {
      time,
      level,
      available: true,
    };
  });
}


function isValidIranianNationalId(input: string) {
  const code = (input || "").replace(/\D/g, "");
  if (code.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(code)) return false; // مثل 1111111111

  const check = Number(code[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(code[i]) * (10 - i);
  const r = sum % 11;
  return (r < 2 && check === r) || (r >= 2 && check === 11 - r);
}

function normalizePhone(input: string) {
  const digits = (input || "").replace(/\D/g, "");
  // اجازه می‌دیم کاربر 09... یا 9... وارد کنه
  if (digits.startsWith("0")) return digits;
  if (digits.startsWith("9")) return "0" + digits;
  return digits;
}

export default function BookingWizard({
  initialTherapistId,
}: {
  initialTherapistId?: string | null;
}) {

  const [step, setStep] = useState<StepId>("topic");

  // مرحله 1: موضوع
  const [topicId, setTopicId] = useState<string | null>(null);
  const selectedTopic = useMemo(
    () => TOPICS.find((t) => t.id === topicId) ?? null,
    [topicId]
  );

  // مرحله 2: درمانگر
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const therapistIdFromUrl = searchParams.get("therapistId");
  const preselectedTherapistId = therapistIdFromUrl ?? initialTherapistId ?? null;

  useEffect(() => {
    if (!preselectedTherapistId) return;

    // چک کنیم درمانگر واقعاً وجود دارد
    const exists = therapists.some((t: any) => String(t.id) === String(preselectedTherapistId));
    if (!exists) return;

    // انتخاب درمانگر
    setSelectedTherapistId(String(preselectedTherapistId));

    // اگر کاربر از صفحه درمانگر آمده، منطقی است مستقیم ببریم مرحله انتخاب زمان
    setStep("slot");

    // اگر قبلاً اسلاتی انتخاب شده بود (مثلاً برگشت)، پاک شود
    setSelectedSlot(null);
  }, [preselectedTherapistId]);

  useEffect(() => {
    if (!therapistIdFromUrl) return;

    // اگر درمانگر وجود داشت، از قبل انتخابش کن
    const exists = therapists.some((t: any) => String(t.id) === String(therapistIdFromUrl));
    if (exists) {
      setSelectedTherapistId(String(therapistIdFromUrl));
      // اگر کاربر مستقیم از پروفایل آمد، منطقی است مرحله درمانگر را رد کنیم
      // (اختیاری) اگر خواستی همینجا قدم بعدی را فعال کنیم:
      // setStep("slot");
    }
  }, [therapistIdFromUrl]);

  // آیا نمایش همه درمانگرها فعال است؟
  const [showAllTherapists, setShowAllTherapists] = useState(false);

  // ✅ پیشنهادهای نزدیک‌تر به موضوع انتخاب‌شده
  const normalizeTag = (s: string) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک");

  const normalize = (s: string) =>
    String(s || "")
      .trim()
      .toLowerCase()
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک");

  const recommendedTherapists = useMemo(() => {
    if (!selectedTopic) return [];

    const topicTags = (selectedTopic.tags ?? []).map(normalize);

    return (therapists as any[]).filter((t) => {
      const therapistTags = (t.tags ?? []).map(normalize);
      // پیشنهاد = هر درمانگری که حداقل یکی از تگ‌های موضوع را داشته باشد
      return topicTags.some((tag) => therapistTags.includes(tag));
    });
  }, [selectedTopic, therapists]);




  // ✅ لیست همه درمانگرها
  const allTherapists = therapists;

  // ✅ لیست نهایی برای نمایش در UI (این مهم‌ترین قطعه برای رفع ارورهای map/length است)
  const therapistsToShow = useMemo(() => {
    return showAllTherapists ? allTherapists : recommendedTherapists;
  }, [showAllTherapists, allTherapists, recommendedTherapists]);

  // درمانگر انتخاب‌شده (از لیست کامل پیدا می‌کنیم که همیشه موجود باشد)
  const selectedTherapist = useMemo(
    () => allTherapists.find((t: any) => String(t.id) === String(selectedTherapistId)) ?? null,
    [allTherapists, selectedTherapistId]
  );



  // مرحله 3: نوبت
  const [date, setDate] = useState<string>("2026-02-14");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // 1) اول از mockSlots بخون
  // 2) اگر نبود، خودکار بساز تا سیستم همیشه کار کنه
  const slotsForDay: Slot[] = useMemo(() => {
    const fromMock = (mockSlots as any)[date] as Slot[] | undefined;
    if (fromMock && fromMock.length) return fromMock;

    // اگر تاریخ در mock نبود، اسلات آزمایشی تولید کن
    return buildFallbackSlots(date);
  }, [date]);


  // مرحله 4: سابقه مراجعه؟
  const [visited, setVisited] = useState<VisitedAnswer>(null);

  // اطلاعات مراجع
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [age, setAge] = useState(""); // سن (عدد)
  const [hasInsurance, setHasInsurance] = useState<"yes" | "no" | "">(""); // بیمه دارید؟
  const [insuranceType, setInsuranceType] = useState(""); // نوع بیمه

  // مرحله 5: فرم اولین مراجعه (خلاقانه/پیشرفته‌تر)
  const [intake, setIntake] = useState({
    ageRange: "" as "" | "زیر 18" | "18 تا 25" | "26 تا 35" | "36 تا 50" | "بالای 50",
    preferredStyle: "" as "" | "کوتاه و واضح" | "آرام و همدلانه" | "تحلیلی و دقیق",
    mainConcern: "" as "" | "اضطراب" | "خلق پایین" | "روابط" | "تمرکز" | "خواب" | "دیگر",
    otherConcern: "",
    goals: [] as string[],
    timePreference: "" as "" | "صبح" | "ظهر" | "عصر" | "فرقی ندارد",
    pressureNow: "" as "" | "قابل مدیریت" | "زیاد و سنگین",
    firstSessionFocus: "" as "" | "آرام‌سازی و سبک‌تر شدن" | "فهمیدن ریشه‌ها" | "راهکار عملی" | "ترکیبی",
    isChildClient: false,
    childAge: "",
    relationToChild: "" as "" | "مادر" | "پدر" | "سرپرست" | "دیگر",
    relationOther: "",
    notes: "",
  });

  // مرحله 6: تایید نهایی (قوانین)
  const [agree, setAgree] = useState(false);

  // نتیجه ثبت
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string>("");

  // پاکسازی منطقی وقتی مسیر عوض می‌شود
  function resetAfterTopicChange(newTopicId: string) {
    setTopicId(newTopicId);
    setSelectedTherapistId(null);
    setSelectedSlot(null);
    setVisited(null);
    setAgree(false);
    setSubmitted(false);
    setTrackingCode("");
    setShowAllTherapists(false);
  }

  function resetAfterTherapistChange(id: string) {
    setSelectedTherapistId(id);
    setSelectedSlot(null);
    setAgree(false);
    setSubmitted(false);
    setTrackingCode("");
  }

  // ترتیب مرحله‌ها (با شرط رد شدن intake)
  function nextStepId(current: StepId): StepId {
    const order: StepId[] = ["topic", "therapist", "slot", "visited", "intake", "confirm"];
    const idx = order.indexOf(current);
    if (idx === -1 || idx === order.length - 1) return current;

    const proposed = order[idx + 1];

    // اگر کاربر قبلا مراجعه داشته، intake رد شود
    if (proposed === "intake" && visited === "yes") return "confirm";
    return proposed;
  }

  function prevStepId(current: StepId): StepId {
    const order: StepId[] = ["topic", "therapist", "slot", "visited", "intake", "confirm"];
    const idx = order.indexOf(current);
    if (idx <= 0) return current;

    // اگر از confirm برگردیم و intake حذف شده، به visited برگرد
    if (current === "confirm" && visited === "yes") return "visited";

    return order[idx - 1];
  }

  const phoneNorm = useMemo(() => normalizePhone(phone), [phone]);
  const phoneOk = useMemo(() => /^09\d{9}$/.test(phoneNorm), [phoneNorm]);
  const nationalOk = useMemo(() => isValidIranianNationalId(nationalId), [nationalId]);
  const ageNumber = useMemo(() => Number(String(age).replace(/\D/g, "")), [age]);
  const ageOk = useMemo(() => ageNumber >= 1 && ageNumber <= 120, [ageNumber]);
  const insuranceOk = useMemo(() => {
    if (!hasInsurance) return false; // هنوز انتخاب نکرده

    if (hasInsurance === "no") return true;

    // اگر بله
    return insuranceType.trim().length >= 2;
  }, [hasInsurance, insuranceType]);

  // اعتبارسنجی مرحله‌ها
  const canGoNext = useMemo(() => {
    if (submitted) return false;

    if (step === "topic") return !!topicId;
    if (step === "therapist") return !!selectedTherapistId;
    if (step === "slot") return !!selectedSlot;

    if (step === "visited") {
      if (visited === null) return false;
      if (!fullName.trim()) return false;
      if (!phoneOk) return false;
      if (!nationalOk) return false;
      if (!ageOk) return false;
      if (!insuranceOk) return false;
      return true;
    }


    if (step === "intake") {
      if (!fullName.trim()) return false;
      if (!phoneOk) return false;
      if (!nationalOk) return false;

      if (!intake.ageRange) return false;
      if (!intake.preferredStyle) return false;
      if (!intake.mainConcern) return false;
      if (intake.mainConcern === "دیگر" && !intake.otherConcern.trim()) return false;

      if (!intake.pressureNow) return false;
      if (!intake.firstSessionFocus) return false;

      if (!intake.timePreference) return false;

      if (selectedTopic?.id === "child" || intake.isChildClient) {
        if (!String(intake.childAge || "").trim()) return false;
        if (!intake.relationToChild) return false;
        if (intake.relationToChild === "دیگر" && !intake.relationOther.trim()) return false;
      }

      return true;
    }

    if (step === "confirm") {
      if (!agree) return false;
      return true;
    }

    return true;
  }, [
    submitted,
    step,
    topicId,
    selectedTherapistId,
    selectedSlot,
    visited,
    fullName,
    phoneOk,
    nationalOk,
    ageOk,
    insuranceOk,
    intake,
    agree,
    selectedTopic,
  ]);

  function next() {
    if (!canGoNext) return;
    setStep(nextStepId(step));
  }

  function prev() {
    setStep(prevStepId(step));
  }

  function handleSubmit() {
    if (!canGoNext) return;

    // کد پیگیری نمونه
    const code = `RANE-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    setTrackingCode(code);
    setSubmitted(true);
  }

  // بک‌گراند لوکس و روشن‌تر (به سبک فرم Guide)
  return (
    <div
      className="min-h-screen w-full py-10"
      style={{
        background:
          "radial-gradient(1000px 650px at 20% 18%, rgba(16,185,129,0.10), transparent 60%)," +
          "radial-gradient(900px 600px at 80% 30%, rgba(45, 212, 191, 0.08), transparent 55%)," +
          "linear-gradient(to bottom, rgba(245, 255, 250, 1), rgba(232, 246, 241, 1))",
      }}
    >
      <div className="relative mx-auto w-full max-w-[1100px] px-4 text-emerald-950">
        {/* Shell */}
        <div className="rounded-[44px] border border-emerald-900/10 bg-white/60 backdrop-blur-2xl shadow-[0_50px_140px_rgba(0,0,0,0.12)] overflow-hidden">
          {/* subtle highlight */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-48 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          {/* Header */}
          <div className="relative px-8 pt-8 pb-6">
            <div className="text-3xl font-bold text-emerald-950">شروع مسیر</div>
            <div className="mt-2 text-sm font-bold text-emerald-950/60">
              چند قدم ساده — بدون عجله، در فضای امن.
            </div>

            {/* Stepper */}
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              {STEPS.map((s) => {
                const active = s.id === step;
                const done = STEPS.findIndex((x) => x.id === s.id) < STEPS.findIndex((x) => x.id === step);
                const hiddenIntake = s.id === "intake" && visited === "yes";

                return (
                  <div key={s.id} className={`flex items-center gap-3 ${hiddenIntake ? "opacity-40" : ""}`}>
                    <div
                      className={[
                        "rounded-full px-4 py-2 text-sm font-bold border transition",
                        active
                          ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20 shadow-[0_18px_50px_rgba(16,185,129,0.18)]"
                          : done
                          ? "bg-emerald-950/5 text-emerald-950 border-emerald-900/10"
                          : "bg-white/60 text-emerald-950/65 border-emerald-900/10",
                      ].join(" ")}
                    >
                      {s.label}
                    </div>
                    {s.id !== "confirm" && <div className="h-px w-8 bg-emerald-900/10" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="relative px-8 pb-8">
            <div className="rounded-[34px] border border-emerald-900/10 bg-white/70 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
              {/* SUCCESS */}
              {submitted ? (
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-950">نوبت شما ثبت شد ✅</div>
                  <div className="mt-2 text-sm font-bold text-emerald-950/65 leading-7">
                    برای هماهنگی نهایی، پیامک/تماس ارسال می‌شود. اگر نیاز داشتید چیزی را اصلاح کنید، از همین صفحه می‌توانید
                    دوباره رزرو را انجام دهید.
                  </div>

                  <div className="mt-6 grid gap-3">
                    <div className="rounded-[20px] border border-emerald-900/10 bg-white/70 p-5">
                      <div className="text-sm font-bold text-emerald-950/60">کد پیگیری</div>
                      <div className="mt-1 text-xl font-bold text-emerald-950">{trackingCode || "—"}</div>
                    </div>

                    <div className="rounded-[20px] border border-emerald-900/10 bg-white/70 p-5">
                      <div className="text-sm font-bold text-emerald-950/60">خلاصه نوبت</div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/80 leading-7">
                        موضوع: {selectedTopic?.title ?? "—"} <br />
                        درمانگر: {selectedTherapist?.name ?? "—"} <br />
                        زمان:{" "}
                        {selectedSlot ? `${date} — ${selectedSlot.time} (${levelLabel(selectedSlot.level)})` : "—"} <br />
                        نام: {fullName || "—"} <br />
                        تماس: {phoneNorm || "—"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // شروع دوباره (بدون پاک کردن اطلاعات هویتی)
                      setSubmitted(false);
                      setTrackingCode("");
                      setAgree(false);
                      setStep("topic");
                      setSelectedSlot(null);
                      setVisited(null);
                    }}
                    className="mt-6 rounded-[18px] bg-emerald-500/90 px-6 py-3 text-sm font-bold text-[#050807] hover:opacity-95"
                  >
                    رزرو جدید
                  </button>
                </div>
              ) : (
                <>
                  {/* STEP: TOPIC */}
                  {step === "topic" && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-950">موضوع را مشخص کنیم</div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/65 leading-7">
                        این انتخاب تشخیص نیست؛ فقط کمک می‌کند درمانگرهای مناسب‌تر را سریع‌تر ببینید.
                      </div>

                      <div className="mt-3 text-sm font-bold text-emerald-950/55">
                        اگر مطمئن نیستید، نزدیک‌ترین گزینه را انتخاب کنید؛ بعداً قابل تغییر است.
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {TOPICS.map((t) => {
                          const active = t.id === topicId;
                          return (
                            <button
                              key={t.id}
                              onClick={() => resetAfterTopicChange(t.id)}
                              className={[
                                "text-right rounded-[22px] border p-5 transition",
                                active
                                  ? "border-emerald-500/25 bg-emerald-500/10 shadow-[0_22px_70px_rgba(16,185,129,0.12)]"
                                  : "border-emerald-900/10 bg-white/60 hover:bg-white/80",
                              ].join(" ")}
                            >
                              <div className="text-base font-bold text-emerald-950">{t.title}</div>
                              <div className="mt-1 text-sm font-bold text-emerald-950/65">{t.hint}</div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-5">
                        <a
                          href="/guide"
                          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:opacity-90"
                        >
                          مطمئن نیستم؛ کمکم کن انتخاب کنم
                          <span className="text-emerald-700/60">↗</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* STEP: THERAPIST */}
                  {/* STEP: THERAPIST */}
                  {step === "therapist" && (
                    <div className="text-right">

                      <div className="text-xl font-bold text-emerald-950">
                        درمانگر را انتخاب کنید
                      </div>

                      <div className="mt-2 text-sm font-bold text-emerald-950/65 leading-7">
                        می‌توانید بدون فیلتر ادامه دهید.
                        درمانگرهایی در تخصص مورد نظر شما پیشنهاد شده است.
                      </div>

                      <div className="mt-4 rounded-[18px] border border-emerald-900/10 bg-white/60 p-4 text-sm font-bold text-emerald-950/70">
                        موضوع انتخاب‌شده:
                        <span className="text-emerald-950 mr-2">
                          {selectedTopic?.title ?? "—"}
                        </span>
                      </div>

                      {/* دکمه نمایش همه درمانگرها */}
                      <div className="mt-4 flex justify-end">
                        {!showAllTherapists && (
                          <button
                            onClick={() => setShowAllTherapists(true)}
                            className="rounded-[14px] border border-emerald-900/10 bg-white/80 px-4 py-2 text-xs font-bold text-emerald-950 hover:opacity-95"
                          >
                            نمایش همه درمانگرها
                          </button>
                        )}
                      </div>

                      {/* لیست درمانگرها */}
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {therapistsToShow.map((t: any) => {
                          const active = String(t.id) === String(selectedTherapistId);
                          const tags: string[] = (t.tags ?? []).slice(0, 3);
                          const tone: string | undefined = t.tone;

                          return (
                            <button
                              key={t.id}
                              onClick={() => resetAfterTherapistChange(String(t.id))}
                              className={[
                                "text-right rounded-[22px] border p-5 transition",
                                active
                                  ? "border-emerald-500/25 bg-emerald-500/10 shadow-[0_22px_70px_rgba(16,185,129,0.12)]"
                                  : "border-emerald-900/10 bg-white/60 hover:bg-white/80",
                              ].join(" ")}
                            >
                              <div className="text-base font-bold text-emerald-950">
                                {t.name}
                              </div>

                              <div className="mt-1 text-sm font-bold text-emerald-950/65">
                                {t.specialty}
                              </div>

                              {(tags.length > 0 || tone) && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {tags.map((x) => (
                                    <span
                                      key={x}
                                      className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-950/75"
                                    >
                                      {x}
                                    </span>
                                  ))}

                                  {tone && (
                                    <span className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-950/75">
                                      {tone}
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  )}


                  {/* STEP: SLOT */}
                  {step === "slot" && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-950">زمان جلسه را انتخاب کنید</div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/65 leading-7">
                        برچسب «خلوت/متعادل/شلوغ» فقط برای آگاهی است؛ هر زمانِ آزاد قابل رزرو است.
                      </div>

                      <div className="mt-4 rounded-[18px] border border-emerald-900/10 bg-white/60 p-4 text-sm font-bold text-emerald-950/70">
                        درمانگر انتخاب‌شده:{" "}
                        <span className="text-emerald-950">{selectedTherapist?.name ?? "—"}</span>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <label className="text-sm font-bold text-emerald-950/65">تاریخ:</label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => {
                            setDate(e.target.value);
                            setSelectedSlot(null);
                          }}
                          className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-2 text-sm font-bold text-emerald-950 outline-none"
                        />
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-3">
                        {slotsForDay.length === 0 && (
                          <div className="text-sm font-bold text-emerald-950/65">
                            برای این تاریخ، زمان آزمایشی تعریف نشده.
                          </div>
                        )}

                        {slotsForDay.map((s, idx) => {
                          const active = selectedSlot?.time === s.time;
                          const disabled = !s.available;

                          return (
                            <button
                              key={idx}
                              disabled={disabled}
                              onClick={() => setSelectedSlot(s)}
                              className={[
                                "rounded-[18px] border p-4 text-right transition",
                                disabled
                                  ? "bg-white/40 border-emerald-900/10 text-emerald-950/35 cursor-not-allowed"
                                  : active
                                  ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20 shadow-[0_18px_60px_rgba(16,185,129,0.16)]"
                                  : "bg-white/60 border-emerald-900/10 text-emerald-950 hover:bg-white/80",
                              ].join(" ")}
                            >
                              <div className="text-base font-bold">{s.time}</div>
                              <div className={`text-xs font-bold mt-1 ${disabled ? "opacity-60" : "opacity-80"}`}>
                                {levelLabel(s.level)}
                                {!s.available ? " • پر شده" : ""}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-6 rounded-[18px] border border-emerald-900/10 bg-white/60 p-4 text-sm font-bold text-emerald-950/70">
                        انتخاب شما:{" "}
                        <span className="text-emerald-950">
                          {selectedSlot
                            ? `${date} — ${selectedSlot.time} (${levelLabel(selectedSlot.level)})`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* STEP: VISITED */}
                  {step === "visited" && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-950">برای هماهنگی نهایی</div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/65 leading-7">
                        آیا تا به حال به روانشناس یا درمانگر مراجعه کرده‌اید؟
                      </div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/55 leading-7">
                        منظور ما هر تجربه‌ی مراجعه است؛ حتی اگر مربوط به سال‌های قبل باشد.
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => setVisited("yes")}
                          className={[
                            "rounded-[16px] px-5 py-3 text-sm font-bold border transition",
                            visited === "yes"
                              ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                              : "bg-white/60 border-emerald-900/10 text-emerald-950 hover:bg-white/80",
                          ].join(" ")}
                        >
                          بله، تجربه مراجعه داشته‌ام
                        </button>

                        <button
                          onClick={() => setVisited("no")}
                          className={[
                            "rounded-[16px] px-5 py-3 text-sm font-bold border transition",
                            visited === "no"
                              ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                              : "bg-white/60 border-emerald-900/10 text-emerald-950 hover:bg-white/80",
                          ].join(" ")}
                        >
                          خیر، اولین مراجعه‌ام است
                        </button>
                      </div>

                      {/* اطلاعات هویتی */}
                      <div className="mt-7 grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-1">
                          <div className="text-sm font-bold text-emerald-950/65 mb-2">نام و نام خانوادگی</div>
                          <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                            placeholder="مثلاً: محمد احمدی"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <div className="text-sm font-bold text-emerald-950/65 mb-2">شماره تماس</div>
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                            placeholder="مثلاً: 09123456789"
                            inputMode="numeric"
                          />
                          <div className="md:col-span-1">
                            <div className="text-sm font-bold text-emerald-950/65 mb-2">سن</div>
                            <input
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                              placeholder="مثلاً: 29"
                              inputMode="numeric"
                            />
                            {!ageOk && age.trim().length > 0 && (
                              <div className="mt-2 text-xs font-bold text-emerald-950/55">
                                سن را به صورت عدد بین ۱ تا ۱۲۰ وارد کنید.
                              </div>
                            )}
                          </div>

                          {!phoneOk && phone.trim().length > 0 && (
                            <div className="mt-2 text-xs font-bold text-emerald-950/55">
                              شماره را به فرم 09xxxxxxxxx وارد کنید.
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-1">
                          <div className="text-sm font-bold text-emerald-950/65 mb-2">کد ملی</div>
                          <input
                            value={nationalId}
                            onChange={(e) => setNationalId(e.target.value)}
                            className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                            placeholder="10 رقم"
                            inputMode="numeric"
                          />
                          {!nationalOk && nationalId.trim().length > 0 && (
                            <div className="mt-2 text-xs font-bold text-emerald-950/55">
                              کد ملی معتبر نیست (چک کنید ۱۰ رقم درست باشد).
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 rounded-[18px] border border-emerald-900/10 bg-white/60 p-4">
                        <div className="text-sm font-bold text-emerald-950/65 mb-3">آیا بیمه دارید؟</div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHasInsurance("yes");
                            }}
                            className={[
                              "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                              hasInsurance === "yes"
                                ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                            ].join(" ")}
                          >
                            بله
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setHasInsurance("no");
                              setInsuranceType(""); // اگر خیر شد، نوع بیمه پاک شود
                            }}
                            className={[
                              "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                              hasInsurance === "no"
                                ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                            ].join(" ")}
                          >
                            خیر
                          </button>
                        </div>

                        {hasInsurance === "yes" && (
                          <div className="mt-4">
                            <div className="text-sm font-bold text-emerald-950/65 mb-2">نوع بیمه</div>
                            <input
                              value={insuranceType}
                              onChange={(e) => setInsuranceType(e.target.value)}
                              className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                              placeholder="مثلاً: تأمین اجتماعی / سلامت / نیروهای مسلح / تکمیلی ..."
                            />
                            {hasInsurance === "yes" && insuranceType.trim().length > 0 && insuranceType.trim().length < 2 && (
                              <div className="mt-2 text-xs font-bold text-emerald-950/55">
                                لطفاً نوع بیمه را کوتاه وارد کنید.
                              </div>
                            )}
                          </div>
                        )}

                        {!hasInsurance && (
                          <div className="mt-3 text-xs font-bold text-emerald-950/55">
                            برای ادامه، یکی از گزینه‌ها را انتخاب کنید.
                          </div>
                        )}
                      </div>


                      <div className="mt-5 rounded-[18px] border border-emerald-900/10 bg-white/60 p-4 text-sm font-bold text-emerald-950/70 leading-7">
                        اطلاعات شما محرمانه است و فقط برای هماهنگی جلسه استفاده می‌شود.
                      </div>
                    </div>
                  )}

                  {/* STEP: INTAKE */}
                  {step === "intake" && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-950">فرم اولین مراجعه</div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/65 leading-7">
                        چند انتخاب کوتاه؛ برای اینکه جلسه‌ی اول دقیق‌تر و راحت‌تر شروع شود.
                      </div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/55 leading-7">
                        هیچ پاسخ درست/غلطی وجود ندارد. هرچقدر دوست دارید جلو بروید.
                      </div>

                      {/* Age */}
                      <div className="mt-6 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">حدود سن</div>
                        <div className="grid gap-2 md:grid-cols-5">
                          {["زیر 18", "18 تا 25", "26 تا 35", "36 تا 50", "بالای 50"].map((x) => (
                            <button
                              key={x}
                              onClick={() => setIntake((p) => ({ ...p, ageRange: x as any }))}
                              className={[
                                "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                                intake.ageRange === x
                                  ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                  : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                              ].join(" ")}
                            >
                              {x}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* preferredStyle */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">ترجیح شما در سبک گفتگو</div>
                        <div className="flex flex-wrap gap-2">
                          {["کوتاه و واضح", "آرام و همدلانه", "تحلیلی و دقیق"].map((x) => (
                            <button
                              key={x}
                              onClick={() => setIntake((p) => ({ ...p, preferredStyle: x as any }))}
                              className={[
                                "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                                intake.preferredStyle === x
                                  ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                  : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                              ].join(" ")}
                            >
                              {x}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* mainConcern */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">بیشتر برای کدام موضوع آمده‌اید؟</div>
                        <div className="grid gap-2 md:grid-cols-3">
                          {["اضطراب", "خلق پایین", "روابط", "تمرکز", "خواب", "دیگر"].map((x) => (
                            <button
                              key={x}
                              onClick={() => setIntake((p) => ({ ...p, mainConcern: x as any }))}
                              className={[
                                "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                                intake.mainConcern === x
                                  ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                  : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                              ].join(" ")}
                            >
                              {x}
                            </button>
                          ))}
                        </div>

                        {intake.mainConcern === "دیگر" && (
                          <div className="mt-3">
                            <input
                              value={intake.otherConcern}
                              onChange={(e) => setIntake((p) => ({ ...p, otherConcern: e.target.value }))}
                              className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                              placeholder="کوتاه بنویسید: مثلاً «حملات پانیک»"
                            />
                          </div>
                        )}
                      </div>

                      {/* goals */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">
                          از جلسه چه می‌خواهید؟ (می‌توانید چند مورد را انتخاب کنید)
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {[
                            "فقط می‌خواهم سبک‌تر شوم",
                            "می‌خواهم مسیرم روشن‌تر شود",
                            "می‌خواهم یک راهکار عملی بگیرم",
                            "می‌خواهم فقط دیده و شنیده شوم",
                          ].map((g) => {
                            const checked = intake.goals.includes(g);
                            return (
                              <label
                                key={g}
                                className="flex items-center gap-3 rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setIntake((p) => ({
                                      ...p,
                                      goals: e.target.checked ? [...p.goals, g] : p.goals.filter((x) => x !== g),
                                    }));
                                  }}
                                />
                                <span className="text-sm font-bold text-emerald-950/80">{g}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* pressureNow */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">این فشار الان چطور است؟</div>
                        <div className="flex flex-wrap gap-2">
                          {["قابل مدیریت", "زیاد و سنگین"].map((x) => (
                            <button
                              key={x}
                              onClick={() => setIntake((p) => ({ ...p, pressureNow: x as any }))}
                              className={[
                                "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                                intake.pressureNow === x
                                  ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                  : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                              ].join(" ")}
                            >
                              {x}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* firstSessionFocus */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">دوست دارید جلسه اول بیشتر کدام باشد؟</div>
                        <div className="grid gap-2 md:grid-cols-2">
                          {["آرام‌سازی و سبک‌تر شدن", "فهمیدن ریشه‌ها", "راهکار عملی", "ترکیبی"].map((x) => (
                            <button
                              key={x}
                              onClick={() => setIntake((p) => ({ ...p, firstSessionFocus: x as any }))}
                              className={[
                                "rounded-[14px] px-4 py-2 text-sm font-bold border transition text-right",
                                intake.firstSessionFocus === x
                                  ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                  : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                              ].join(" ")}
                            >
                              {x}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* child conditional */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-bold text-emerald-950/75">اگر مراجعه برای کودک/نوجوان است</div>
                            <div className="mt-1 text-xs font-bold text-emerald-950/55">
                              فقط برای آماده‌سازی بهتر جلسه.
                            </div>
                          </div>

                          <label className="inline-flex items-center gap-2 text-sm font-bold text-emerald-950/75">
                            <input
                              type="checkbox"
                              checked={intake.isChildClient || selectedTopic?.id === "child"}
                              onChange={(e) =>
                                setIntake((p) => ({
                                  ...p,
                                  isChildClient: e.target.checked,
                                }))
                              }
                              disabled={selectedTopic?.id === "child"}
                            />
                            فعال
                          </label>
                        </div>

                        {(selectedTopic?.id === "child" || intake.isChildClient) && (
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="md:col-span-1">
                              <div className="text-xs font-bold text-emerald-950/55 mb-2">سن کودک/نوجوان</div>
                              <input
                                value={intake.childAge}
                                onChange={(e) => setIntake((p) => ({ ...p, childAge: e.target.value }))}
                                className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                                placeholder="مثلاً: 12"
                                inputMode="numeric"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <div className="text-xs font-bold text-emerald-950/55 mb-2">نسبت شما با کودک</div>
                              <div className="flex flex-wrap gap-2">
                                {["مادر", "پدر", "سرپرست","خودِ کودک/نوجوان", "دیگر"].map((x) => (
                                  <button
                                    key={x}
                                    onClick={() => setIntake((p) => ({ ...p, relationToChild: x as any }))}
                                    className={[
                                      "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                                      intake.relationToChild === x
                                        ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                        : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                                    ].join(" ")}
                                  >
                                    {x}
                                  </button>
                                ))}
                              </div>

                              {intake.relationToChild === "دیگر" && (
                                <div className="mt-3">
                                  <input
                                    value={intake.relationOther}
                                    onChange={(e) => setIntake((p) => ({ ...p, relationOther: e.target.value }))}
                                    className="w-full rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                                    placeholder="مثلاً: عمو / خاله / ... "
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* timePreference */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">ترجیح زمان جلسه</div>
                        <div className="flex flex-wrap gap-2">
                          {["صبح", "ظهر", "عصر", "فرقی ندارد"].map((x) => (
                            <button
                              key={x}
                              onClick={() => setIntake((p) => ({ ...p, timePreference: x as any }))}
                              className={[
                                "rounded-[14px] px-4 py-2 text-sm font-bold border transition",
                                intake.timePreference === x
                                  ? "bg-emerald-500/90 text-[#050807] border-emerald-500/20"
                                  : "bg-white/70 text-emerald-950 border-emerald-900/10 hover:bg-white/85",
                              ].join(" ")}
                            >
                              {x}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* notes */}
                      <div className="mt-4 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <div className="text-sm font-bold text-emerald-950/75 mb-3">اگر دوست دارید، یک جمله کوتاه</div>
                        <textarea
                          value={intake.notes}
                          onChange={(e) => setIntake((p) => ({ ...p, notes: e.target.value }))}
                          className="w-full min-h-[110px] rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-3 text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-950/35"
                          placeholder="مثلاً: این روزها بیشتر..."
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP: CONFIRM */}
                  {step === "confirm" && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-950">تأیید و ثبت نهایی</div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/65">یک نگاه کوتاه قبل از ثبت:</div>

                      <div className="mt-6 grid gap-3">
                        <div className="rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                          <div className="text-sm font-bold text-emerald-950/60">موضوع</div>
                          <div className="mt-1 text-base font-bold text-emerald-950">{selectedTopic?.title ?? "—"}</div>
                        </div>

                        <div className="rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                          <div className="text-sm font-bold text-emerald-950/60">درمانگر</div>
                          <div className="mt-1 text-base font-bold text-emerald-950">{selectedTherapist?.name ?? "—"}</div>
                        </div>

                        <div className="rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                          <div className="text-sm font-bold text-emerald-950/60">نوبت</div>
                          <div className="mt-1 text-base font-bold text-emerald-950">
                            {selectedSlot ? `${date} — ${selectedSlot.time} (${levelLabel(selectedSlot.level)})` : "—"}
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                          <div className="text-sm font-bold text-emerald-950/60">مشخصات مراجع</div>
                          <div className="mt-2 text-sm font-bold text-emerald-950/80 leading-7">
                            نام و نام خانوادگی: {fullName || "—"} <br />
                            شماره تماس: {phoneNorm || "—"} <br />
                            کد ملی: {nationalId || "—"}
                            سن: {age || "—"} <br />
                            بیمه: {hasInsurance === "yes" ? `بله (${insuranceType || "—"})` : hasInsurance === "no" ? "خیر" : "—"}
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                          <div className="text-sm font-bold text-emerald-950/60">سابقه مراجعه</div>
                          <div className="mt-1 text-base font-bold text-emerald-950">
                            {visited === "yes" ? "تجربه مراجعه داشته‌ام" : visited === "no" ? "اولین مراجعه" : "—"}
                          </div>
                        </div>

                        {visited === "no" && (
                          <div className="rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                            <div className="text-sm font-bold text-emerald-950/60">خلاصه فرم اولین مراجعه</div>
                            <div className="mt-2 text-sm font-bold text-emerald-950/80 leading-7">
                              حدود سن: {intake.ageRange || "—"} <br />
                              سبک گفتگو: {intake.preferredStyle || "—"} <br />
                              موضوع اصلی:{" "}
                              {intake.mainConcern === "دیگر"
                                ? `دیگر: ${intake.otherConcern || "—"}`
                                : intake.mainConcern || "—"}{" "}
                              <br />
                              شدت فشار: {intake.pressureNow || "—"} <br />
                              اولویت جلسه اول: {intake.firstSessionFocus || "—"} <br />
                              ترجیح زمان: {intake.timePreference || "—"} <br />
                              هدف‌ها: {intake.goals.length ? intake.goals.join("، ") : "—"}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Agreement */}
                      <div className="mt-6 rounded-[20px] border border-emerald-900/10 bg-white/60 p-5">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={agree}
                            onChange={(e) => setAgree(e.target.checked)}
                            className="mt-1"
                          />
                          <span className="text-sm font-bold text-emerald-950/75 leading-7">
                            با قوانین و حریم خصوصی موافقم. اطلاعات من فقط برای هماهنگی جلسه استفاده می‌شود.
                          </span>
                        </label>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={!agree}
                        className={[
                          "mt-6 rounded-[18px] px-6 py-3 text-sm font-bold transition",
                          agree
                            ? "bg-emerald-500/90 text-[#050807] hover:opacity-95"
                            : "bg-emerald-500/25 text-emerald-950/40 cursor-not-allowed",
                        ].join(" ")}
                      >
                        ثبت نهایی
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer buttons */}
            {!submitted && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={prev}
                  disabled={step === "topic"}
                  className={[
                    "rounded-[18px] px-6 py-3 text-sm font-bold border transition",
                    step === "topic"
                      ? "bg-white/40 text-emerald-950/30 border-emerald-900/10 cursor-not-allowed"
                      : "bg-white/60 border-emerald-900/10 text-emerald-950 hover:bg-white/80",
                  ].join(" ")}
                >
                  مرحله قبل
                </button>

                <button
                  onClick={next}
                  disabled={!canGoNext}
                  className={[
                    "rounded-[18px] px-8 py-3 text-sm font-bold transition",
                    canGoNext
                      ? "bg-emerald-500/90 text-[#050807] hover:opacity-95"
                      : "bg-emerald-500/25 text-emerald-950/40 cursor-not-allowed",
                  ].join(" ")}
                >
                  ادامه
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
