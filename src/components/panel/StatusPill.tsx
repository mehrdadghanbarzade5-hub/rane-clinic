"use client";

import React from "react";

export type StatusPillValue =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "scheduled"
  | "done"
  | "active"
  | "inactive"
  | "new"
  | string;

type Props = {
  /** برای سازگاری با کدهای قدیمی */
  status?: StatusPillValue;
  /** برای سازگاری با کدهای جدید */
  value?: StatusPillValue;
  className?: string;
};

function normalize(v: StatusPillValue): string {
  return String(v || "").toLowerCase();
}

function labelOf(v: string) {
  switch (v) {
    case "pending":
      return "در انتظار";
    case "accepted":
      return "پذیرفته شد";
    case "declined":
      return "رد شد";
    case "cancelled":
      return "لغو شد";
    case "scheduled":
      return "scheduled";
    case "done":
      return "done";
    case "active":
      return "فعال";
    case "inactive":
      return "غیرفعال";
    case "new":
      return "جدید";
    default:
      return v || "—";
  }
}

function styleOf(v: string) {
  // دقیقاً در روح طراحی شما (emerald + سفید/شفاف)
  switch (v) {
    case "accepted":
    case "done":
    case "active":
      return "bg-emerald-500/15 text-emerald-950 border-emerald-500/20";
    case "pending":
    case "scheduled":
    case "new":
      return "bg-emerald-500/10 text-emerald-950/80 border-emerald-900/10";
    case "declined":
    case "cancelled":
    case "inactive":
      return "bg-white/70 text-emerald-950/60 border-emerald-900/10";
    default:
      return "bg-white/70 text-emerald-950/60 border-emerald-900/10";
  }
}

export default function StatusPill({ status, value, className }: Props) {
  const raw = normalize((value ?? status ?? "—") as StatusPillValue);
  const text = labelOf(raw);
  const cls = styleOf(raw);

  return (
    <span
      className={[
        "rounded-[999px] border px-3 py-1 text-xs font-bold",
        cls,
        className || "",
      ].join(" ")}
      title={text}
    >
      {text}
    </span>
  );
}
