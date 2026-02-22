export default function PrivacyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-emerald-950">
      <div className="mx-auto max-w-[900px] px-5 md:px-16 py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold">حریم خصوصی</h1>
        <p className="mt-6 text-sm md:text-base leading-8 text-emerald-950/70 font-bold">
          در کلینیک فوق تخصصی روانشناسی رانه، حفاظت از اطلاعات مراجعین یک اصل بنیادین است.
          اطلاعات شما فقط برای ارائه خدمات درمانی، هماهنگی جلسات و بهبود تجربه درمان استفاده می‌شود.
        </p>

        <div className="mt-10 grid gap-4">
          <section className="rounded-[22px] border border-emerald-900/10 bg-emerald-50/40 p-5">
            <h2 className="text-lg font-extrabold">چه داده‌هایی جمع‌آوری می‌شود؟</h2>
            <ul className="mt-3 list-disc pr-5 text-sm leading-8 text-emerald-950/70 font-bold">
              <li>اطلاعات هویتی و راه‌های تماس (در حد نیاز پذیرش)</li>
              <li>اطلاعات مرتبط با رزرو و پیگیری جلسات</li>
              <li>پرسشنامه‌ها/فرم‌ها و یادداشت‌های درمانی (محرمانه)</li>
            </ul>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">اشتراک‌گذاری اطلاعات</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              اطلاعات شما بدون رضایت شما در اختیار اشخاص ثالث قرار نمی‌گیرد؛ مگر در مواردی که قانون الزام کند
              یا در شرایط خطر فوری برای خود/دیگران که نیاز به اقدام حمایتی باشد.
            </p>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">امنیت</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              دسترسی‌ها محدود و کنترل‌شده است. داده‌های حساس در مسیر واقعی با استانداردهای امنیتی و رمزنگاری محافظت می‌شوند.
            </p>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">تماس</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              برای هر سؤال درباره حریم خصوصی، از طریق بخش «تماس با ما» ارتباط بگیرید.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}