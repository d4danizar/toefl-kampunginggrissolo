"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateToeflScore } from "@/lib/scoring";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ============================================================
// Helper: Verifikasi user session
// ============================================================

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ============================================================
// Types
// ============================================================

export type SaveResult = {
  success: boolean;
  error?: string;
};

// ============================================================
// 1. saveProgress — Auto-save jawaban (tanpa menyelesaikan tes)
// ============================================================

export async function saveProgress(
  sessionId: string,
  answers: Record<string, string>
): Promise<SaveResult> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verifikasi ownership
    const testSession = await prisma.testSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, isCompleted: true },
    });

    if (!testSession) {
      return { success: false, error: "Sesi tes tidak ditemukan." };
    }

    if (testSession.userId !== userId) {
      return { success: false, error: "Anda tidak memiliki akses ke sesi ini." };
    }

    if (testSession.isCompleted) {
      return { success: false, error: "Sesi tes sudah selesai." };
    }

    // Update answers saja (tanpa mengubah isCompleted)
    await prisma.testSession.update({
      where: { id: sessionId },
      data: { answers },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "Sesi login Anda telah berakhir." };
    }
    return { success: false, error: "Gagal menyimpan progress." };
  }
}

// ============================================================
// 2. submitTest — Submit, grading, dan selesaikan tes
// ============================================================

export async function submitTest(
  sessionId: string,
  answers: Record<string, string>
): Promise<SaveResult> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Verifikasi ownership
    const testSession = await prisma.testSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, batchId: true, isCompleted: true },
    });

    if (!testSession) {
      return { success: false, error: "Sesi tes tidak ditemukan." };
    }

    if (testSession.userId !== userId) {
      return { success: false, error: "Anda tidak memiliki akses ke sesi ini." };
    }

    if (testSession.isCompleted) {
      return { success: false, error: "Sesi tes sudah diselesaikan sebelumnya." };
    }

    // -------------------------------------------------------
    // Grading: ambil kunci jawaban dari database (batch-scoped)
    // -------------------------------------------------------
    const questions = await prisma.question.findMany({
      where: { batchId: testSession.batchId },
      select: {
        id: true,
        section: true,
        correctAnswer: true,
      },
    });

    // Hitung jawaban benar per section
    let correctListening = 0;
    let correctStructure = 0;
    let correctReading = 0;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      if (userAnswer && userAnswer === question.correctAnswer) {
        switch (question.section) {
          case "LISTENING":
            correctListening++;
            break;
          case "STRUCTURE":
            correctStructure++;
            break;
          case "READING":
            correctReading++;
            break;
        }
      }
    }

    // Kalkulasi skor TOEFL
    const toeflScore = calculateToeflScore(
      correctListening,
      correctStructure,
      correctReading
    );

    // Finalize: simpan answers, skor, set endTime, mark completed
    await prisma.testSession.update({
      where: { id: sessionId },
      data: {
        answers,
        score: toeflScore.totalScore,
        endTime: new Date(),
        isCompleted: true,
      },
    });

    revalidatePath("/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "Sesi login Anda telah berakhir." };
    }
    return { success: false, error: "Gagal mengirim jawaban." };
  }

  // Redirect di luar try-catch agar NEXT_REDIRECT tidak tertangkap
  redirect(`/result/${sessionId}`);
}
