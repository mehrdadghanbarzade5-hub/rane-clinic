"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className="rounded-[14px] border border-emerald-900/10 bg-white/70 px-4 py-2 text-sm font-bold text-emerald-950 hover:bg-white/90"
    >
      خروج
    </button>
  );
}
