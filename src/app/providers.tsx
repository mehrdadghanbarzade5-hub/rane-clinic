"use client";

import AuthSessionProvider from "@/components/auth/SessionProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
