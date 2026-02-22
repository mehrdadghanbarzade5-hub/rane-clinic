import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ClientIntakePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";

  return (
    <>
      <div className="text-2xl font-bold">پرسشنامه جلسه اول (Intake)</div>
      <div className="mt-2 text-sm font-bold text-emerald-950/60 leading-7">
        وضعیت این بخش فعلاً Mock است و بعداً به فرم واقعی وصل می‌شود.
      </div>

      <div className="mt-6 rounded-[22px] border border-emerald-900/10 bg-white/80 p-5">
        <div className="text-sm font-bold">کاربر: {email || "—"}</div>
        <div className="mt-2 text-xs font-bold text-emerald-950/60 leading-6">
          - وضعیت: در انتظار / تکمیل (Mock) <br />
          - بعداً همینجا فرم واقعی Intake قرار می‌گیرد.
        </div>
      </div>
    </>
  );
}
