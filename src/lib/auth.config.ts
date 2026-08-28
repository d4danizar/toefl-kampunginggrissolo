import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi NextAuth yang EDGE-SAFE.
 * File ini di-import oleh proxy.ts.
 * JANGAN import bcrypt, prisma, atau modul Node.js berat lainnya di sini.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * JWT callback: dipanggil setiap kali JWT dibuat atau diupdate.
     * Pada sign-in pertama, `user` tersedia dari authorize().
     * Pada request berikutnya, data sudah ada di `token`.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as "USER" | "ADMIN";
      }
      return token;
    },

    /**
     * Session callback: mengekspos data dari JWT ke client-side session.
     */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },

    /**
     * Authorized callback: dipanggil oleh proxy untuk setiap request.
     * Menentukan apakah request diizinkan atau di-redirect.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // -------------------------------------------------------
      // Auth pages (/login, /register) — redirect jika sudah login
      // -------------------------------------------------------
      if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // -------------------------------------------------------
      // Admin pages (/admin/*) — hanya role ADMIN
      // -------------------------------------------------------
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) return false; // → redirect ke /login
        const role = (auth?.user as { role?: string })?.role;
        if (role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // -------------------------------------------------------
      // Protected pages (/dashboard/*, /test/*) — harus login
      // -------------------------------------------------------
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/test")) {
        if (!isLoggedIn) return false; // → redirect ke /login
        return true;
      }

      // -------------------------------------------------------
      // Public pages (/, dll) — akses bebas
      // -------------------------------------------------------
      return true;
    },
  },
  providers: [], // Providers di-inject di auth.ts (Node.js environment)
} satisfies NextAuthConfig;
