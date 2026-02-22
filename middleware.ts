import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // اگر اصلاً لاگین نیست
        if (!token) return false;

        // محدودیت نقش‌ها
        if (path.startsWith("/panel/admin")) return token.role === "admin";
        if (path.startsWith("/panel/therapist")) return token.role === "therapist";
        if (path.startsWith("/panel/client")) return token.role === "client";

        return true;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: ["/panel/:path*"],
};
