"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ============================================================
// Helper: Verifikasi user session
// ============================================================

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Silakan login terlebih dahulu.");
  }
  return session;
}

// ============================================================
// Types
// ============================================================

export type ActiveBatch = {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
};

export type TestHistoryItem = {
  id: string;
  batchName: string;
  score: number | null;
  endTime: Date | null;
};

export type ValidateResult = {
  success: boolean;
  error?: string;
};

// ============================================================
// 1. getActiveBatches — Ambil batch yang aktif
// ============================================================

export async function getActiveBatches(): Promise<ActiveBatch[]> {
  await requireAuth();

  const batches = await prisma.batch.findMany({
    where: { isActive: true },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
    },
  });

  return batches;
}

// ============================================================
// 1.5. getTestHistory — Ambil riwayat ujian user
// ============================================================

export async function getTestHistory(): Promise<TestHistoryItem[]> {
  const session = await requireAuth();

  const history = await prisma.testSession.findMany({
    where: {
      userId: session.user.id,
      isCompleted: true,
    },
    orderBy: {
      endTime: "desc",
    },
    include: {
      batch: {
        select: {
          name: true,
        },
      },
    },
  });

  return history.map((session) => ({
    id: session.id,
    batchName: session.batch.name,
    score: session.score,
    endTime: session.endTime,
  }));
}

// ============================================================
// 2. validateAndStartTest — Validasi token & mulai sesi tes
// ============================================================

export async function validateAndStartTest(
  prevState: ValidateResult,
  formData: FormData
): Promise<ValidateResult> {
  let testSessionId: string | null = null;

  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const batchId = formData.get("batchId") as string;
    const tokenCode = (formData.get("tokenCode") as string)?.trim();

    // -------------------------------------------------------
    // Validasi input
    // -------------------------------------------------------
    if (!batchId || !tokenCode) {
      return { success: false, error: "Batch ID dan kode akses wajib diisi." };
    }

    // -------------------------------------------------------
    // Cari Batch yang cocok
    // -------------------------------------------------------
    const batch = await prisma.batch.findFirst({
      where: {
        id: batchId,
        sharedToken: tokenCode,
        isActive: true,
      },
    });

    if (!batch) {
      return {
        success: false,
        error: "Kode akses tidak valid atau sesi ujian telah ditutup.",
      };
    }

    // -------------------------------------------------------
    // Cek apakah user sudah punya sesi ujian di batch ini
    // -------------------------------------------------------
    let testSession = await prisma.testSession.findFirst({
      where: {
        userId,
        batchId: batch.id,
      },
    });

    if (!testSession) {
      // Buat sesi baru
      testSession = await prisma.testSession.create({
        data: {
          userId,
          batchId: batch.id,
        },
      });
    }

    testSessionId = testSession.id;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Terjadi kesalahan sistem. Silakan coba lagi." };
  }

  // Redirect di luar blok try-catch agar tidak tertangkap sebagai error oleh Next.js
  if (testSessionId) {
    redirect(`/test/${testSessionId}`);
  }

  return { success: false, error: "Gagal memulai tes." };
}
