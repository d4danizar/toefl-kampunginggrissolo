"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registerUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const institution = formData.get("institution") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // -------------------------------------------------------
  // Validasi input
  // -------------------------------------------------------
  if (!name || !email || !password) {
    return { error: "Nama, email, dan password wajib diisi." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format email tidak valid." };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  if (password !== confirmPassword) {
    return { error: "Password dan konfirmasi password tidak cocok." };
  }

  // -------------------------------------------------------
  // Cek apakah email sudah terdaftar
  // -------------------------------------------------------
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Email sudah terdaftar. Silakan gunakan email lain." };
  }

  // -------------------------------------------------------
  // Hash password & simpan user baru
  // -------------------------------------------------------
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      institution: institution || null,
    },
  });

  redirect("/login?registered=true");
}
