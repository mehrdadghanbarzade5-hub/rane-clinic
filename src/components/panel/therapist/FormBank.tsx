"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { MOCK_THERAPIST_CLIENTS_MINI } from "@/data/mockDb";

type MiniClient = {
  id: string;
  fullName?: string;
  therapistEmail?: string;
};

type FormTemplate = {
  id: string;
  title: string;
  category: string; // مثلا: "اضطراب" / "اوتیسم" / "ارزیابی"
  estimatedMin: number;
  description: string;
  tags: string[];
};

type AssignedFormTask = {
  id: string;
  formId: string;
  formTitle: string;
  clientId: string;
  clientName: string;
  therapistEmail: string;
  assignedAtISO: string;
  status: "assigned" | "completed";
};

function nowISO() {
  return new Date().toISOString();
}

function safeArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function shortISO(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR");
  } catch {
    return iso;
  }
}

// ✅ تست/دامی — اگر خواستی خاموشش کنی: NEXT_PUBLIC_RANE_TEST_DATA=0
const ENABLE_TEST_DATA = process.env.NEXT_PUBLIC_RANE_TEST_DATA !== "0";

// ✅ فعلاً داخل همین کامپوننت Dummy می‌گذاریم تا UI کامل تست شود.
const BASE_FORMS: FormTemplate[] = [
  {
    id: "f-gad7",
    title: "GAD-7 (غربال اضطراب)",
    category: "اضطراب",
    estimatedMin: 3,
    description: "پرسشنامه ۷ سؤالی برای غربال اضطراب (صرفاً تست UI).",
    tags: ["GAD-7", "غربال", "اضطراب"],
  },
  {
    id: "f-phq9",
    title: "PHQ-9 (افسردگی)",
    category: "خلق",
    estimatedMin: 5,
    description: "پرسشنامه ۹ سؤالی برای بررسی علائم افسردگی (Dummy).",
    tags: ["PHQ-9", "افسردگی"],
  },
  {
    id: "f-sleep",
    title: "ثبت الگوی خواب (۳ روز)",
    category: "خواب",
    estimatedMin: 7,
    description: "فرم ثبت ساعات خواب/بیداری و کیفیت خواب (Dummy).",
    tags: ["خواب", "پایش"],
  },
];

const EXTRA_FORMS: FormTemplate[] = ENABLE_TEST_DATA
  ? [
      {
        id: "f-autism-screen",
        title: "چک‌لیست غربال اوتیسم (نمونه)",
        category: "اوتیسم",
        estimatedMin: 10,
        description: "چک‌لیست نمونه برای تست مسیر ارجاع و ارزیابی (Dummy).",
        tags: ["اوتیسم", "غربال"],
      },
      {
        id: "f-intake-mini",
        title: "فرم Intake کوتاه (نمونه)",
        category: "ارزیابی",
        estimatedMin: 6,
        description: "فرم نمونه برای اطلاعات اولیه (Dummy).",
        tags: ["Intake", "ارزیابی"],
      },
    ]
  : [];

const DUMMY_FORMS: FormTemplate[] = [...BASE_FORMS, ...EXTRA_FORMS];

export default function FormBank({ therapistEmail }: { therapistEmail: string }) {
  const LS_KEY = `rane_form_tasks_v1_${therapistEmail}`;

  const clients = useMemo(() => safeArray<MiniClient>(MOCK_THERAPIST_CLIENTS_MINI), []);
  const scopedClients = useMemo(
    () => clients.filter((c) => c.therapistEmail === therapistEmail),
    [clients, therapistEmail]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("همه");

  // assign modal state
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  // assigned tasks
  const [tasks, setTasks] = useState<AssignedFormTask[]>([]);

  // init tasks from localStorage
  useEffect(() => {
    const fromLS = readLS<AssignedFormTask[]>(LS_KEY);
    setTasks(fromLS && fromLS.length ? fromLS : []);
  }, [LS_KEY]);

  // persist
  useEffect(() => {
    writeLS(LS_KEY, tasks);
  }, [tasks, LS_KEY]);

  const closeAssign = () => {
    setAssignOpen(false);
    setSelectedForm(null);
    setSelectedClientId("");
    setAssignError(null);
  };

  // ESC close modal
  useEffect(() => {
    if (!assignOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAssign();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [assignOpen]);

  const categories = useMemo(() => {
    const set = new Set<string>(["همه"]);
    for (const f of DUMMY_FORMS) set.add(f.category);
    return Array.from(set.values());
  }, []);

  const filteredForms = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return DUMMY_FORMS.filter((f) => {
      const catOk = category === "همه" ? true : f.category === category;
      if (!catOk) return false;
      if (!q) return true;

      const hay = `${f.title} ${f.description} ${f.category} ${f.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  const openAssign = (form: FormTemplate) => {
    setSelectedForm(form);
    setSelectedClientId("");
    setAssignError(null);
    setAssignOpen(true);
  };

  const submitAssign = () => {
    if (!selectedForm) return;
    const c = scopedClients.find((x) => x.id === selectedClientId);
    if (!c) {
      setAssignError("لطفاً مراجع را انتخاب کنید.");
      return;
    }

    const newTask: AssignedFormTask = {
      id: `ft_${Date.now()}`,
      formId: selectedForm.id,
      formTitle: selectedForm.title,
      clientId: c.id,
      clientName: c.fullName || c.id,
      therapistEmail,
      assignedAtISO: nowISO(),
      status: "assigned",
    };

    setTasks((prev) => [newTask, ...prev]);
    closeAssign();
  };

  const markDone = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const myTasks = useMemo(
    () => tasks.filter((t) => t.therapistEmail === therapistEmail),
    [tasks, therapistEmail]
  );

  const canAssign = Boolean(selectedForm) && Boolean(selectedClientId);

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl font-bold text-emerald-950">فرم‌ها و تست‌ها</div>
          <div className="mt-2 text-sm font-bold text-emerald-950/70 leading-7">
            فقط درمانگر به این بخش دسترسی دارد. انتخاب فرم → انتخاب مراجع → ثبت به‌عنوان «تکلیف»
            <span className="text-emerald-950/55"> (فعلاً Dummy/Mock)</span>.
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href="/panel/therapist"
            className="rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-xs font-bold text-emerald-950 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            برگشت
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-[22px] border border-emerald-900/10 bg-white/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-sm font-bold text-emerald-950">جستجو و فیلتر</div>
        <div className="mt-2 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="grid gap-2">
            <div className="text-[11px] font-bold text-emerald-950/60">جستجو</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={[
                "w-full rounded-[16px] border border-emerald-900/10 bg-white px-4 py-3",
                "text-xs font-bold text-emerald-950 placeholder:text-emerald-950/35 outline-none",
                "focus:ring-2 focus:ring-emerald-500/25",
              ].join(" ")}
              placeholder="جستجو: اضطراب، خواب، GAD-7 ..."
            />
          </div>

          <div className="grid gap-2">
            <div className="text-[11px] font-bold text-emerald-950/60">دسته‌بندی</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={[
                "w-full rounded-[16px] border border-emerald-900/10 bg-white px-3 py-3",
                "text-xs font-bold text-emerald-950 outline-none",
                "focus:ring-2 focus:ring-emerald-500/25",
              ].join(" ")}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Forms list */}
      <div className="grid gap-3">
        {filteredForms.map((f) => (
          <div
            key={f.id}
            className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[240px]">
                <div className="text-sm font-bold text-emerald-950">{f.title}</div>
                <div className="mt-1 text-xs font-bold text-emerald-950/60">
                  دسته: {f.category} — زمان تقریبی: {f.estimatedMin} دقیقه
                </div>
              </div>

              <button
                type="button"
                onClick={() => openAssign(f)}
                className={[
                  "rounded-[16px] border border-emerald-500/20 bg-emerald-500/90 px-4 py-3",
                  "text-xs font-bold text-[#050807] hover:opacity-95",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                ].join(" ")}
              >
                اختصاص به مراجع
              </button>
            </div>

            <div className="mt-3 text-xs font-bold text-emerald-950/75 leading-7">
              {f.description}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {f.tags.map((t) => (
                <span
                  key={`${f.id}-${t}`}
                  className="rounded-[999px] border border-emerald-900/10 bg-white px-3 py-1 text-[11px] font-bold text-emerald-950/70"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}

        {filteredForms.length === 0 ? (
          <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-4 text-xs font-bold text-emerald-950/70">
            موردی پیدا نشد.
          </div>
        ) : null}
      </div>

      {/* Assigned tasks */}
      <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-sm font-bold text-emerald-950">تکالیف فرم‌های اختصاص داده شده (این درمانگر)</div>
        <div className="mt-3 grid gap-2">
          {myTasks.map((t) => (
            <div key={t.id} className="rounded-[18px] border border-emerald-900/10 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-emerald-950">
                  {t.formTitle} → {t.clientName}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "rounded-[999px] border px-3 py-1 text-[11px] font-bold",
                      t.status === "completed"
                        ? "bg-emerald-900/10 text-emerald-950/70 border-emerald-900/10"
                        : "bg-emerald-500/15 text-emerald-950/80 border-emerald-500/20",
                    ].join(" ")}
                  >
                    {t.status === "completed" ? "تکمیل شده" : "ارسال شده"}
                  </span>

                  {t.status !== "completed" ? (
                    <button
                      type="button"
                      onClick={() => markDone(t.id)}
                      className={[
                        "rounded-[14px] border border-emerald-500/20 bg-emerald-500/90 px-3 py-2",
                        "text-[11px] font-bold text-[#050807] hover:opacity-95",
                        "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                      ].join(" ")}
                    >
                      علامت‌گذاری انجام شد
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => removeTask(t.id)}
                    className={[
                      "rounded-[14px] border border-emerald-900/10 bg-white px-3 py-2",
                      "text-[11px] font-bold text-emerald-950/80 hover:bg-white/90",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                    ].join(" ")}
                    title="حذف (فقط تست)"
                  >
                    حذف
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[11px] font-bold text-emerald-950/60">
                تاریخ تخصیص: {shortISO(t.assignedAtISO)} — شناسه مراجع: {t.clientId}
              </div>

              <div className="mt-2">
                <Link
                  href={`/panel/therapist/clients/${t.clientId}`}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  رفتن به پرونده مراجع
                </Link>
              </div>
            </div>
          ))}

          {myTasks.length === 0 ? (
            <div className="text-xs font-bold text-emerald-950/65">
              هنوز فرمی به‌عنوان تکلیف اختصاص داده نشده است.
            </div>
          ) : null}
        </div>

        <div className="mt-3 text-[11px] font-bold text-emerald-950/55 leading-6">
          نکته: این داده‌ها فعلاً فقط برای تست UI/UX در <span className="font-black">localStorage</span> ذخیره می‌شود.
          برای خاموش کردن داده تست: <span className="font-black">NEXT_PUBLIC_RANE_TEST_DATA=0</span>
        </div>
      </div>

      {/* Assign Modal */}
      {mounted && assignOpen && selectedForm
        ? createPortal(
            <div
              className={[
                "fixed inset-0 z-[99999] flex items-center justify-center p-4",
                "bg-black/35 backdrop-blur-[2px]",
              ].join(" ")}
              role="dialog"
              aria-modal="true"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeAssign();
              }}
            >
              <div
                className={[
                  "relative w-full max-w-xl overflow-hidden",
                  "rounded-[26px] border border-emerald-900/10",
                  "bg-white shadow-[0_30px_120px_rgba(0,0,0,0.35)]",
                ].join(" ")}
              >
                {/* Top accent */}
                <div className="h-2 w-full bg-emerald-500/80" />

                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-sm font-black text-emerald-950">اختصاص فرم به مراجع</div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-950/60">
                      فرم انتخابی را بررسی کنید، سپس مراجع را انتخاب و ارسال کنید.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeAssign}
                    className={[
                      "shrink-0 rounded-[14px] border border-emerald-900/10 bg-white px-3 py-2",
                      "text-xs font-bold text-emerald-950 hover:bg-white/90",
                      "focus:outline-none focus:ring-2 focus:ring-emerald-500/25",
                    ].join(" ")}
                  >
                    بستن
                  </button>
                </div>

                {/* Body */}
                <div className="px-5 pb-5">
                  <div className="rounded-[20px] border border-emerald-900/10 bg-emerald-500/10 p-4">
                    <div className="text-xs font-black text-emerald-950">{selectedForm.title}</div>
                    <div className="mt-2 text-[11px] font-bold text-emerald-950/70 leading-6">
                      {selectedForm.description}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-[999px] border border-emerald-900/10 bg-white px-3 py-1 text-[11px] font-bold text-emerald-950/70">
                        دسته: {selectedForm.category}
                      </span>
                      <span className="rounded-[999px] border border-emerald-900/10 bg-white px-3 py-1 text-[11px] font-bold text-emerald-950/70">
                        زمان: {selectedForm.estimatedMin} دقیقه
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <div className="text-xs font-black text-emerald-950">انتخاب مراجع</div>
                    <select
                      value={selectedClientId}
                      onChange={(e) => {
                        setSelectedClientId(e.target.value);
                        if (assignError) setAssignError(null);
                      }}
                      className={[
                        "w-full rounded-[16px] border border-emerald-900/10 bg-white px-3 py-3",
                        "text-xs font-bold text-emerald-950 outline-none",
                        "focus:ring-2 focus:ring-emerald-500/25",
                      ].join(" ")}
                    >
                      <option value="">— انتخاب کنید —</option>
                      {scopedClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName || c.id}
                        </option>
                      ))}
                    </select>

                    {assignError ? (
                      <div className="rounded-[14px] border border-emerald-900/10 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-950/80 leading-5">
                        {assignError}
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-emerald-950/55 leading-5">
                        بعد از ثبت، این فرم در بخش «تکالیف فرم‌های اختصاص داده شده» و همچنین در پرونده مراجع قابل مشاهده خواهد بود.
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={submitAssign}
                      disabled={!canAssign}
                      className={[
                        "rounded-[16px] border px-4 py-3 text-xs font-black transition",
                        canAssign
                          ? "border-emerald-500/20 bg-emerald-500/90 text-[#050807] hover:opacity-95"
                          : "border-emerald-900/10 bg-emerald-500/20 text-emerald-950/45 cursor-not-allowed",
                        "focus:outline-none focus:ring-2 focus:ring-emerald-500/25",
                      ].join(" ")}
                    >
                      ثبت و ارسال به‌عنوان تکلیف
                    </button>

                    <button
                      type="button"
                      onClick={closeAssign}
                      className={[
                        "rounded-[16px] border border-emerald-900/10 bg-white px-4 py-3",
                        "text-xs font-bold text-emerald-950 hover:bg-white/90",
                        "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                      ].join(" ")}
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}