import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/panel")) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // اگر لاگین نیست
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  const role = (token as any).role;

  if (pathname.startsWith("/panel/admin") && role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/panel/therapist") && role !== "therapist") {
    const url = req.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/panel/client") && role !== "client") {
    const url = req.nextUrl.clone();
    url.pathname = "/panel";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
