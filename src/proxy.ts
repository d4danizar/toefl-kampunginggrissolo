import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (pengganti middleware.ts).
 * Berjalan di Node.js runtime (bukan Edge), tapi tetap menggunakan
 * authConfig (tanpa bcrypt/prisma) untuk separation of concerns.
 *
 * Logic proteksi route ada di callback `authorized` pada auth.config.ts.
 */
const { auth } = NextAuth(authConfig);

export async function proxy(request: NextRequest) {
  // `auth` mengembalikan session/null setelah menjalankan callbacks.
  // Jika `authorized` callback return false → redirect ke signIn page.
  // Jika `authorized` callback return Response → gunakan Response tersebut.
  // Jika `authorized` callback return true → lanjutkan request.
  const response = await auth(request as any, {} as any);
  return response;
}

export const config = {
  // Jalankan proxy untuk semua route KECUALI:
  // - API auth routes (agar NextAuth API tetap bisa diakses)
  // - Static files (_next/static, _next/image, favicon.ico)
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
