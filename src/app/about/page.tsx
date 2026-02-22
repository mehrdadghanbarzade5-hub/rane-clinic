import Link from "next/link";

export default function AboutPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-emerald-950">
      <div className="mx-auto max-w-[900px] px-5 md:px-16 py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold">درباره رانه</h1>

        <p className="mt-6 text-sm md:text-base leading-8 text-emerald-950/70 font-bold">
          کلینیک فوق تخصصی روانشناسی رانه، با رویکردی انسانی و تخصصی، فضایی امن برای رشد، آرامش و درمان فراهم می‌کند.
          ما باور داریم هر مسیر درمان باید با احترام، محرمانگی و همراهی حرفه‌ای آغاز شود.
        </p>

        <div className="mt-10 grid gap-4">
          <section className="rounded-[22px] border border-emerald-900/10 bg-white/70 p-5">
            <h2 className="text-lg font-extrabold">چه چیزی رانه را متفاوت می‌کند؟</h2>
            <ul className="mt-3 list-disc pr-5 text-sm leading-8 text-emerald-950/70 font-bold">
              <li>محرمانگی و امنیت به‌عنوان اصل</li>
              <li>طراحی مسیر درمان واقعی و قابل پیگیری</li>
              <li>تجربه کاربری آرام و انسانی (Anxiety Mode)</li>
              <li>ترکیب نگاه انسانی با ابزارهای مدرن (Modern Human Tech)</li>
            </ul>
          </section>

          <section className="rounded-[22px] border border-emerald-900/10 bg-emerald-50/40 p-5">
            <h2 className="text-lg font-extrabold">شروع مسیر</h2>
            <p className="mt-3 text-sm leading-8 text-emerald-950/70 font-bold">
              اگر آماده‌ای، همین حالا مسیر را شروع کن یا درمانگران را ببین.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="rounded-[16px] bg-emerald-900 px-5 py-3 text-sm font-extrabold text-white hover:opacity-90"
              >
                شروع مسیر
              </Link>
              <Link
                href="/therapists"
                className="rounded-[16px] border border-emerald-900/10 bg-white/70 px-5 py-3 text-sm font-extrabold text-emerald-950 hover:bg-white"
              >
                درمانگران
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}