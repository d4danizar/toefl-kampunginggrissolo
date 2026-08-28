import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

/**
 * Konfigurasi NextAuth LENGKAP (Node.js only).
 * File ini menambahkan CredentialsProvider ke authConfig.
 * JANGAN import file ini di middleware.ts (Edge Runtime).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        // Cari user berdasarkan email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        // Return user object yang akan masuk ke JWT callback
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
});
