"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import templateData from "@/data/longman-template.json";

// ============================================================
// Helper: Verifikasi admin session
// ============================================================

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Akses admin diperlukan.");
  }
  return session;
}

// ============================================================
// Types
// ============================================================

export type BatchWithStats = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sharedToken: string | null;
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  createdAt: Date;
};

export type ActionResult = {
  success: boolean;
  error?: string;
};

// ============================================================
// 1. getBatches — Ambil semua batch
// ============================================================

export async function getBatches(): Promise<BatchWithStats[]> {
  await requireAdmin();

  const batches = await prisma.batch.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      sharedToken: true,
      startDate: true,
      endDate: true,
      durationMinutes: true,
      createdAt: true,
    },
  });

  return batches;
}

// ============================================================
// 2. createBatch — Buat batch baru
// ============================================================

export async function createBatch(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const durationMinutesStr = formData.get("durationMinutes") as string;
    const durationMinutes = durationMinutesStr ? parseInt(durationMinutesStr, 10) : 120;

    // Validasi
    if (!name || !startDate || !endDate) {
      return { success: false, error: "Nama, tanggal mulai, dan tanggal selesai wajib diisi." };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return { success: false, error: "Tanggal selesai harus setelah tanggal mulai." };
    }

    const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const sharedToken = `TF-${randomCode}`;

    // Gunakan transaksi agar batch dan soal terbuat secara atomik
    await prisma.$transaction(async (tx) => {
      const newBatch = await tx.batch.create({
        data: {
          name,
          description: description || null,
          sharedToken,
          startDate: start,
          endDate: end,
          durationMinutes,
        },
      });

      // templateData di-import di atas file
      const questionsToInsert = templateData.map((q: any, index: number) => {
        // Beri jeda 10ms per soal agar sorting createdAt terurut sempurna
        const date = new Date();
        date.setMilliseconds(date.getMilliseconds() + (index * 10));

        return {
          text: q.text,
          section: q.section,
          passage: q.passage || null,
          audioUrl: q.audioUrl || null,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          batchId: newBatch.id,
          createdAt: date,
        };
      });

      await tx.question.createMany({
        data: questionsToInsert,
      });
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Gagal membuat batch. Silakan coba lagi." };
  }
}

// ============================================================
// 3. toggleBatchStatus — Toggle status aktif batch
// ============================================================

export async function toggleBatchStatus(
  batchId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.batch.update({
      where: { id: batchId },
      data: { isActive },
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Gagal mengubah status batch." };
  }
}

export async function deleteBatch(batchId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.batch.delete({ where: { id: batchId } });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Gagal menghapus batch." };
  }
}

export async function regenerateBatchToken(batchId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const sharedToken = `TF-${randomCode}`;
    
    await prisma.batch.update({
      where: { id: batchId },
      data: { sharedToken },
    });
    
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Gagal generate ulang kode akses." };
  }
}

export async function updateBatch(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const durationMinutesStr = formData.get("durationMinutes") as string;
    const durationMinutes = durationMinutesStr ? parseInt(durationMinutesStr, 10) : 120;

    if (!id || !name || !startDate || !endDate) {
      return { success: false, error: "Data wajib tidak boleh kosong." };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return { success: false, error: "Tanggal selesai harus setelah tanggal mulai." };
    }

    await prisma.batch.update({
      where: { id },
      data: {
        name,
        description: description || null,
        startDate: start,
        endDate: end,
        durationMinutes,
      },
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Gagal memperbarui batch." };
  }
}
