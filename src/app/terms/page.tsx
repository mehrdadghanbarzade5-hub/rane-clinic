export default function TermsPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-emerald-950">
      <div className="mx-auto max-w-[900px] px-5 md:px-16 py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold">شرایط استفاده</h1>
        <p className="mt-6 text-sm md:text-base leading-8 text-emerald-950/70 font-bold">
          استفاده از وب‌سایت و خدمات کلینیک رانه به معنی پذیرش این شرایط است.
          هدف این متن، شفاف‌سازی حقوق و مسئولیت‌ها برای تجربه‌ای امن و حرفه‌ای است.
        </p>

        <div className="mt-10 grid gap-4">
          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">حساب کاربری و دسترسی</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              حفظ محرمانگی اطلاعات ورود بر عهده کاربر است. در صورت مشاهده فعالیت مشکوک، موضوع را اطلاع دهید.
            </p>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">محدوده خدمات</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              محتوای سایت جایگزین خدمات اورژانسی نیست. در شرایط خطر فوری، با اورژانس و مراکز حمایتی تماس بگیرید.
            </p>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">مالکیت محتوا</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              محتوای آموزشی/رسانه‌ای سایت صرفاً برای استفاده شخصی است و تکثیر تجاری بدون مجوز مجاز نیست.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}