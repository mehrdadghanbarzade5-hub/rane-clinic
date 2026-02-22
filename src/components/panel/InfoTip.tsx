// src/components/panel/therapist/InfoTip.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function InfoTip({
  title,
  summary,
  details,
}: {
  title: string;
  summary?: string;
  details: string[];
}) {
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Close on ESC + lock body scroll when open
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);

    // lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // focus close button
    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open]);

  return (
    <div className="relative inline-flex items-center gap-2">
      {summary ? (
        <div className="text-[11px] font-bold text-emerald-950/55 leading-5">
          {summary}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex h-7 w-7 items-center justify-center",
          "rounded-full border border-emerald-900/10 bg-white/75",
          "text-xs font-black text-emerald-950/80",
          "hover:bg-white/95 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]",
          "transition",
          "relative z-10 pointer-events-auto",
        ].join(" ")}
        aria-label="راهنما"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        title="راهنما"
      >
        !
      </button>

      {/* Modal */}
      {open ? (
        <div
          className="fixed inset-0 z-[9999]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-title`}
          id={dialogId}
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-label="بستن راهنما"
          />

          {/* Dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className={[
                "w-full max-w-[560px]",
                "rounded-[26px] border border-emerald-900/10",
                "bg-white/90 backdrop-blur-2xl",
                "shadow-[0_30px_120px_rgba(0,0,0,0.18)]",
                "overflow-hidden",
                "animate-[ranePop_160ms_ease-out]",
              ].join(" ")}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-emerald-900/10 bg-white/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      id={`${dialogId}-title`}
                      className="text-base font-extrabold text-emerald-950"
                    >
                      {title}
                    </div>
                    <div className="mt-1 text-[12px] font-bold text-emerald-950/60 leading-6">
                      نکات کلیدی این بخش را اینجا می‌بینید. اگر سوالی دارید، دقیقاً طبق همین موارد عمل کنید.
                    </div>
                  </div>

                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    className={[
                      "shrink-0",
                      "rounded-[14px] border border-emerald-900/10",
                      "bg-white/70 px-3 py-2",
                      "text-xs font-bold text-emerald-950",
                      "hover:bg-white/95 transition",
                    ].join(" ")}
                  >
                    بستن
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <div className="grid gap-2">
                  {details.map((t, i) => (
                    <div
                      key={`${title}-${i}`}
                      className={[
                        "rounded-[18px] border border-emerald-900/10 bg-white/70",
                        "px-4 py-3",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            "mt-0.5 h-6 w-6 shrink-0",
                            "rounded-full border border-emerald-500/20 bg-emerald-500/10",
                            "flex items-center justify-center",
                            "text-[11px] font-extrabold text-emerald-950/80",
                          ].join(" ")}
                        >
                          {i + 1}
                        </div>
                        <div className="text-xs font-bold text-emerald-950/75 leading-7">
                          {t}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-emerald-950/45">
                    نکته: این راهنما برای تست/نسخه MVP است و بعداً می‌تواند با محتوای واقعی جایگزین شود.
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={[
                      "rounded-[16px] border border-emerald-500/20",
                      "bg-emerald-500/90 px-5 py-3",
                      "text-xs font-extrabold text-[#050807]",
                      "hover:opacity-95 transition",
                    ].join(" ")}
                  >
                    متوجه شدم
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* local keyframes (بدون فایل CSS جدا) */}
          <style jsx global>{`
            @keyframes ranePop {
              from {
                transform: translateY(8px) scale(0.985);
                opacity: 0;
              }
              to {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      ) : null}
    </div>
  );
}
