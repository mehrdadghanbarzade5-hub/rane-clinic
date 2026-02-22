"use client";

import { useEffect, useMemo, useState } from "react";

export default function ClientPrivateNote({
  bookingId,
  seed,
}: {
  bookingId: string;
  seed?: string;
}) {
  const key = useMemo(() => `rane_client_private_note_${bookingId}`, [bookingId]);
  const [val, setVal] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    setVal(saved ?? seed ?? "");
  }, [key, seed]);

  return (
    <div className="mt-3 rounded-[18px] border border-emerald-900/10 bg-white/80 p-4">
      <div className="text-sm font-bold">یادداشت خصوصی من (برای درمانگر)</div>
      <div className="mt-1 text-xs font-bold text-emerald-950/55 leading-6">
        اختیاری است. فقط درمانگر باید ببیند (فعلاً Mock + ذخیره محلی).
      </div>

      <textarea
        value={val}
        onChange={(e) => {
          const next = e.target.value;
          setVal(next);
          window.localStorage.setItem(key, next);
        }}
        rows={4}
        className="mt-3 w-full rounded-[16px] border border-emerald-900/10 bg-white/80 px-4 py-3 text-sm font-bold outline-none"
        placeholder="اگر نکته‌ای هست که دوست داری درمانگر بداند، اینجا بنویس…"
      />
    </div>
  );
}
