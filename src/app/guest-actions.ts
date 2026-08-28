"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function registerGuestUser(name: string, phone: string) {
  // Format email unik berdasarkan nomor WA
  const cleanPhone = phone.replace(/\D/g, "");
  const email = `${cleanPhone}@guest.toefl.com`;
  const password = "guestpassword123";

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "USER",
        },
      });
    } else {
      // Update nama jika ada perubahan
      if (user.name !== name) {
        await prisma.user.update({ where: { email }, data: { name } });
      }
    }

    return { success: true, email, password };
  } catch (error) {
    console.error("Guest registration error:", error);
    return { success: false, error: "Gagal mendaftarkan peserta." };
  }
}

export async function createGuestSession(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "User tidak ditemukan" };

    // Cari batch aktif (karena ini mode kilat, kita ambil batch aktif pertama)
    // Jika Anda punya Shared Token, Anda bisa memodifikasi where ini:
    const batch = await prisma.batch.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!batch) {
      return { success: false, error: "Tidak ada jadwal ujian yang aktif saat ini." };
    }

    let testSession = await prisma.testSession.findFirst({
      where: { userId: user.id, batchId: batch.id },
    });

    if (!testSession) {
      testSession = await prisma.testSession.create({
        data: {
          userId: user.id,
          batchId: batch.id,
        },
      });
    }

    return { success: true, sessionId: testSession.id };
  } catch (error) {
    console.error("Create session error:", error);
    return { success: false, error: "Gagal membuat sesi ujian." };
  }
}
