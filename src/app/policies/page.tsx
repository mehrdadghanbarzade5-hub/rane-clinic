export default function PoliciesPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-emerald-950">
      <div className="mx-auto max-w-[900px] px-5 md:px-16 py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold">سیاست کنسلی/تعویق</h1>
        <p className="mt-6 text-sm md:text-base leading-8 text-emerald-950/70 font-bold">
          برای حفظ نظم درمان و احترام به زمان درمانگر و مراجع، قوانین کنسلی/تعویق به شکل شفاف اعلام می‌شود.
        </p>

        <div className="mt-10 grid gap-4">
          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">تعویق جلسه</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              برای تغییر زمان جلسه، لطفاً در اولین فرصت هماهنگ کنید تا نزدیک‌ترین زمان آزاد پیشنهاد شود.
            </p>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">کنسلی</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              سیاست دقیق هزینه‌ها/جریمه‌ها در نسخه واقعی و مطابق مقررات پرداخت/رزرو تعریف و نمایش داده می‌شود.
              (در حال حاضر: Prototype)
            </p>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-emerald-50/40 p-5">
            <h2 className="text-lg font-extrabold">هماهنگی سریع</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              برای هماهنگی سریع با پذیرش تماس بگیرید.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}