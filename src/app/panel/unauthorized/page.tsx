// src/app/panel/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <main dir="rtl" className="min-h-screen p-10">
      <h1 className="text-2xl font-bold">دسترسی غیرمجاز</h1>
      <p className="mt-3 text-sm opacity-80">
        این صفحه برای نقش شما قابل مشاهده نیست.
      </p>
      <a
        className="mt-6 inline-block rounded-lg border px-4 py-2"
        href="/"
      >
        بازگشت به خانه
      </a>
    </main>
  );
}
