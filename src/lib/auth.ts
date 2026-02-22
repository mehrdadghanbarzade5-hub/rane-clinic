import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

type AppRole = "admin" | "therapist" | "client";

type AuthUser = {
  id: string;
  email: string;
  role: AppRole;
  passwordHash: string; // scrypt hash (hex)
  /**
   * اختیاری:
   * اگر برای هر کاربر salt جدا داشته باشیم، اینجا می‌آید (hex).
   * اگر نبود، از RANE_DEV_SALT_HEX (یا مقدار پیش‌فرض) استفاده می‌کنیم.
   */
  saltHex?: string;
};

const DEFAULT_DEV_SALT_HEX = "00112233445566778899aabbccddeeff";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function scryptHash(password: string, saltHex: string) {
  const salt = Buffer.from(saltHex, "hex");
  const hash = crypto.scryptSync(password, salt, 64) as Buffer;
  return hash.toString("hex");
}

function timingSafeEqualHex(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * کاربران از ENV خوانده می‌شوند (Production-ready).
 * فرمت پیشنهادی:
 * RANE_USERS_JSON='[
 *   {"id":"1","email":"admin@rane.com","role":"admin","passwordHash":"<hex>","saltHex":"<hex>"},
 *   {"id":"2","email":"reyhane.afshar@rane.com","role":"therapist","passwordHash":"<hex>","saltHex":"<hex>"}
 * ]'
 *
 * نکته سازگاری:
 * - اگر saltHex در هر آیتم نبود، از RANE_DEV_SALT_HEX استفاده می‌شود.
 */
function getAuthUsers(): AuthUser[] {
  const json = process.env.RANE_USERS_JSON?.trim();
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        return (parsed as AuthUser[]).map((u) => ({
          ...u,
          email: normalizeEmail(u.email),
        }));
      }
    } catch {
      // ignore -> fallback
    }
  }

  // ✅ Fallback فقط برای DEV
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) return [];

  const devPassword = process.env.RANE_DEV_PASSWORD ?? "1234";
  const devSalt = process.env.RANE_DEV_SALT_HEX ?? DEFAULT_DEV_SALT_HEX;
  const passwordHash = scryptHash(devPassword, devSalt);

  // ✅ کاربران تست (DEV) — شامل دو درمانگر نمونه اولیه
  return [
    { id: "1", email: normalizeEmail("admin@rane.com"), role: "admin", passwordHash, saltHex: devSalt },

    // درمانگر قدیمی نمونه (برای سازگاری با پروژه)
    { id: "2", email: normalizeEmail("therapist@rane.com"), role: "therapist", passwordHash, saltHex: devSalt },

    // ✅ درمانگرهای پنل مستقل (نمونه اولیه)
    { id: "4", email: normalizeEmail("reyhane.afshar@rane.com"), role: "therapist", passwordHash, saltHex: devSalt },
    { id: "5", email: normalizeEmail("amir.noohakhan@rane.com"), role: "therapist", passwordHash, saltHex: devSalt },

    { id: "3", email: normalizeEmail("client@rane.com"), role: "client", passwordHash, saltHex: devSalt },
  ];
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/signin",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = normalizeEmail(credentials.email);
        const users = getAuthUsers();
        const user = users.find((u) => normalizeEmail(u.email) === email);
        if (!user) return null;

        const saltHex = user.saltHex ?? process.env.RANE_DEV_SALT_HEX ?? DEFAULT_DEV_SALT_HEX;
        const inputHash = scryptHash(credentials.password, saltHex);

        const ok = timingSafeEqualHex(inputHash, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, role: user.role } as any;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
