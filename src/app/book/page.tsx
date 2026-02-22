import BookingWizard from "@/components/book/BookingWizard";

export default function BookPage({
  searchParams,
}: {
  searchParams?: { therapistId?: string };
}) {
  const initialTherapistId = searchParams?.therapistId ?? null;

  return (
    <main
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4 py-10
                 bg-gradient-to-b from-emerald-50 via-white to-emerald-50"
    >
      {/* هاله‌های خیلی لطیف برای لوکس شدن */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-56 left-1/4 h-[520px] w-[520px] rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[1180px]">
        <BookingWizard initialTherapistId={initialTherapistId} />
      </div>
    </main>
  );
}
