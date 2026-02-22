import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ClientProfilePage() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email ?? "—";
  const role = (session?.user as any)?.role ?? "client";

  // فعلاً چون دیتابیس نداریم، اطلاعات پایه از سشن میاد.
  // بعداً: نام/موبایل/تاریخ تولد/... از DB پر میشه.
  return (
    <>
      <div className="text-2xl font-bold">پروفایل من</div>
      <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
        اطلاعات حساب و تنظیمات پایه (فعلاً بدون دیتابیس).
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-bold">اطلاعات حساب</div>
          <div className="mt-3 grid gap-2 text-xs font-bold text-emerald-950/70">
            <div className="flex items-center justify-between rounded-[14px] border border-emerald-900/10 bg-white/80 px-4 py-3">
              <span className="text-emerald-950/55">ایمیل</span>
              <span>{email}</span>
            </div>
            <div className="flex items-center justify-between rounded-[14px] border border-emerald-900/10 bg-white/80 px-4 py-3">
              <span className="text-emerald-950/55">نقش</span>
              <span>{role}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-emerald-900/10 bg-white/80 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-bold">تنظیمات</div>
          <div className="mt-3 text-xs font-bold text-emerald-950/60 leading-6">
            این بخش فعلاً نمایشی است. بعداً اینجا می‌گذاریم:
            <br />- شماره تماس
            <br />- اطلاعات پایه
            <br />- تنظیمات اعلان‌ها
            <br />- تنظیمات حریم خصوصی
          </div>
        </div>
      </div>
    </>
  );
}
