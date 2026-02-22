// src/app/therapists/[id]/page.tsx
import { notFound } from "next/navigation";
import { THERAPISTS } from "@/data/therapists";
import { getBookingsForClient } from "@/data/therapistClientBookings";
type PageProps = {
  // Next.js 16.x: params can be a Promise
  params: Promise<{ id: string }>;
};

export default async function TherapistProfilePage({ params }: PageProps) {
  const { id } = await params; // ✅ مهم: جلوگیری از id خالی
  const decodedId = decodeURIComponent(String(id || ""));

  const therapist =
    THERAPISTS.find((x) => String(x.id) === String(decodedId)) ?? null;

  if (!therapist) notFound();

  // ✅ پیش‌فرض‌ها برای جلوگیری از undefined و ارورهای TS
  const tags = therapist.tags ?? [];
  const education = therapist.education ?? [];
  const certificates = therapist.certificates ?? [];
  const memberships = therapist.memberships ?? [];
  const publications = therapist.publications ?? [];
  const focus = therapist.focus ?? [];
  const approaches = therapist.approaches ?? [];
  const bestFor = therapist.bestFor ?? [];
  const notForArr = therapist.notFor ?? [];
  const languages = therapist.languages ?? ["فارسی"];
  const sessionTypes = therapist.sessionTypes ?? ["آنلاین"];
  const faq = therapist.faq ?? [];

  return (
    <main
      dir="rtl"
      className="min-h-screen w-full py-10"
      style={{
        background:
          "radial-gradient(1000px 650px at 20% 18%, rgba(16,185,129,0.10), transparent 60%)," +
          "radial-gradient(900px 600px at 80% 30%, rgba(45, 212, 191, 0.08), transparent 55%)," +
          "linear-gradient(to bottom, rgba(245, 255, 250, 1), rgba(232, 246, 241, 1))",
      }}
    >
      <div className="relative mx-auto w-full max-w-[1100px] px-4 text-emerald-950">
        <div className="rounded-[44px] border border-emerald-900/10 bg-white/60 backdrop-blur-2xl shadow-[0_50px_140px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="relative px-8 pt-8 pb-8">
            {/* Header */}
            <div className="text-3xl font-bold text-emerald-950">
              {therapist.name}
            </div>

            {therapist.title ? (
              <div className="mt-2 text-sm font-bold text-emerald-950/70">
                {therapist.title}
              </div>
            ) : null}

            <div className="mt-3 text-sm font-bold text-emerald-950/70 leading-7">
              تخصص:{" "}
              <span className="text-emerald-950">{therapist.specialty}</span>
            </div>

            {/* Chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((x) => (
                <span
                  key={x}
                  className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-950/75"
                >
                  {x}
                </span>
              ))}
              {therapist.tone ? (
                <span className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-950/75">
                  {therapist.tone}
                </span>
              ) : null}
              {languages.length ? (
                <span className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-950/75">
                  زبان: {languages.join("، ")}
                </span>
              ) : null}
            </div>

            {/* Bio */}
            {therapist.bio ? (
              <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/70 p-6 text-sm font-bold text-emerald-950/70 leading-7">
                {therapist.bio}
              </div>
            ) : null}

            {/* Quick cards */}
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
                <div className="text-xs font-bold text-emerald-950/55">
                  سابقه
                </div>
                <div className="mt-1 text-sm font-bold text-emerald-950">
                  {typeof therapist.experienceYears === "number"
                    ? `${therapist.experienceYears} سال`
                    : "—"}
                </div>
              </div>

              <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
                <div className="text-xs font-bold text-emerald-950/55">
                  نوع جلسه
                </div>
                <div className="mt-1 text-sm font-bold text-emerald-950">
                  {sessionTypes.length ? sessionTypes.join(" / ") : "—"}
                </div>
              </div>

              <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
                <div className="text-xs font-bold text-emerald-950/55">
                  مکان
                </div>
                <div className="mt-1 text-sm font-bold text-emerald-950">
                  {therapist.location ?? "—"}
                </div>
              </div>

              <div className="rounded-[18px] border border-emerald-900/10 bg-white/70 p-4">
                <div className="text-xs font-bold text-emerald-950/55">
                  هزینه
                </div>
                <div className="mt-1 text-sm font-bold text-emerald-950">
                  {therapist.fee
                    ? `${therapist.fee.amount.toLocaleString()} ${
                        therapist.fee.currency ?? ""
                      } / ${therapist.fee.unit ?? "جلسه"}`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Details blocks */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-6">
                <div className="text-base font-bold text-emerald-950">
                  رزومه و مسیر حرفه‌ای
                </div>
                <ul className="mt-3 space-y-2 text-sm font-bold text-emerald-950/70">
                  {education.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                  {certificates.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                  {memberships.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                  {publications.map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                  {!education.length &&
                  !certificates.length &&
                  !memberships.length &&
                  !publications.length ? (
                    <li>• —</li>
                  ) : null}
                </ul>
              </div>

              <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-6">
                <div className="text-base font-bold text-emerald-950">
                  حوزه‌ها و رویکرد درمانی
                </div>

                <div className="mt-3 text-sm font-bold text-emerald-950/70">
                  <span className="text-emerald-950">حوزه تمرکز:</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {focus.length ? (
                    focus.map((x) => (
                      <span
                        key={x}
                        className="rounded-full border border-emerald-900/10 bg-white/80 px-3 py-1 text-xs font-bold text-emerald-950/75"
                      >
                        {x}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-bold text-emerald-950/55">
                      —
                    </span>
                  )}
                </div>

                <div className="mt-5 text-sm font-bold text-emerald-950/70">
                  <span className="text-emerald-950">رویکردها:</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {approaches.length ? (
                    approaches.map((x) => (
                      <span
                        key={x}
                        className="rounded-full border border-emerald-900/10 bg-white/80 px-3 py-1 text-xs font-bold text-emerald-950/75"
                      >
                        {x}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-bold text-emerald-950/55">
                      —
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-6">
                <div className="text-base font-bold text-emerald-950">
                  مناسب برای
                </div>
                <ul className="mt-3 space-y-2 text-sm font-bold text-emerald-950/70">
                  {bestFor.length ? bestFor.map((x) => <li key={x}>• {x}</li>) : <li>• —</li>}
                </ul>
              </div>

              <div className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-6">
                <div className="text-base font-bold text-emerald-950">
                  ممکن است مناسب نباشد برای
                </div>
                <ul className="mt-3 space-y-2 text-sm font-bold text-emerald-950/70">
                  {notForArr.length ? notForArr.map((x) => <li key={x}>• {x}</li>) : <li>• —</li>}
                </ul>
              </div>
            </div>

            {therapist.availabilityNote ? (
              <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/70 p-6 text-sm font-bold text-emerald-950/70 leading-7">
                <span className="text-emerald-950">زمان‌بندی:</span>{" "}
                {therapist.availabilityNote}
              </div>
            ) : null}

            {faq.length ? (
              <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/70 p-6">
                <div className="text-base font-bold text-emerald-950">
                  پرسش‌های پرتکرار
                </div>
                <div className="mt-4 space-y-3">
                  {faq.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-[18px] border border-emerald-900/10 bg-white/80 p-5"
                    >
                      <div className="text-sm font-bold text-emerald-950">
                        {item.q}
                      </div>
                      <div className="mt-2 text-sm font-bold text-emerald-950/70 leading-7">
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* CTA */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <a
                href="/therapists"
                className="rounded-[18px] px-6 py-3 text-sm font-bold border border-emerald-900/10 bg-white/70 text-emerald-950 hover:bg-white/85"
              >
                بازگشت به لیست درمانگران
              </a>

              <a
                href={`/book?therapistId=${encodeURIComponent(
                  String(therapist.id)
                )}`}
                className="rounded-[18px] bg-emerald-500/90 px-6 py-3 text-sm font-bold text-[#050807] hover:opacity-95"
              >
                رزرو با این درمانگر
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
