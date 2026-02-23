export const dynamic = "force-dynamic";
export const revalidate = 0;
import { Suspense } from "react";
import BookingWizard from "@/components/book/BookingWizard";

function LoadingFallback() {
  return (
    <div className="rounded-[20px] border border-emerald-900/10 bg-white/60 p-6 text-sm font-bold text-emerald-950/70">
      در حال آماده‌سازی فرم رزرو...
    </div>
  );
}

export default function BookPage() {
  return (
    <main dir="rtl" className="min-h-screen text-emerald-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_800px_at_70%_10%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(900px_700px_at_20%_35%,rgba(14,116,144,0.10),transparent_55%),linear-gradient(to_bottom,rgba(248,250,252,0.92),rgba(240,253,250,0.88))]" />

      <div className="mx-auto max-w-[1100px] px-5 md:px-10 py-12">
        <h1 className="text-3xl md:text-4xl font-bold">رزرو نوبت</h1>
        <p className="mt-3 text-sm md:text-base font-bold text-emerald-950/70">
          چند قدم کوتاه تا ثبت درخواست.
        </p>

        <div className="mt-10 rounded-[34px] border border-white/60 bg-white/55 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="p-6 md:p-10">
            <Suspense fallback={<LoadingFallback />}>
              <BookingWizard />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}