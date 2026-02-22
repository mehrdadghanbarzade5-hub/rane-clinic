import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SiteModeDock from "@/components/site/SiteModeDock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RANE",
  description: "RANE Clinic Prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div id="rane-app">{children}</div>

          {/* ✅ فقط یک Dock لوگویی (ورود + حالت اضطراب + EN) */}
          <SiteModeDock signinHref="/auth/signin" />
        </Providers>
      </body>
    </html>
  );
}