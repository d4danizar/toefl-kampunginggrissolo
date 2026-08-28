import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TestEngine } from "./test-engine";

// Tipe question yang AMAN dikirim ke client (tanpa correctAnswer)
export type SafeQuestion = {
  id: string;
  text: string;
  section: "LISTENING" | "STRUCTURE" | "READING";
  passage: string | null;
  audioUrl: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export default async function TestPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  // -------------------------------------------------------
  // 1. Verifikasi auth
  // -------------------------------------------------------
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // -------------------------------------------------------
  // 2. Ambil test session & verifikasi ownership
  // -------------------------------------------------------
  const testSession = await prisma.testSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      batchId: true,
      answers: true,
      isCompleted: true,
      startTime: true,
      batch: {
        select: {
          durationMinutes: true,
        },
      },
    },
  });

  if (!testSession) {
    redirect("/dashboard");
  }

  // Cek ownership: hanya user yang membuat sesi yang boleh akses
  if (testSession.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Cek apakah tes sudah selesai
  if (testSession.isCompleted) {
    redirect("/dashboard");
  }

  // -------------------------------------------------------
  // 3. Ambil questions untuk batch ini (TANPA correctAnswer!)
  // -------------------------------------------------------
  const questions: SafeQuestion[] = await prisma.question.findMany({
    where: { batchId: testSession.batchId },
    select: {
      id: true,
      text: true,
      section: true,
      passage: true,
      audioUrl: true,
      optionA: true,
      optionB: true,
      optionC: true,
      optionD: true,
      // correctAnswer TIDAK di-select — mencegah kecurangan
    },
    orderBy: [{ section: "asc" }, { createdAt: "asc" }],
  });

  // -------------------------------------------------------
  // 4. Parse initial answers jika ada (dari auto-save sebelumnya)
  // -------------------------------------------------------
  const initialAnswers: Record<string, string> =
    testSession.answers && typeof testSession.answers === "object"
      ? (testSession.answers as Record<string, string>)
      : {};

  return (
    <TestEngine
      sessionId={testSession.id}
      questions={questions}
      initialAnswers={initialAnswers}
      startTime={testSession.startTime.toISOString()}
      durationMinutes={testSession.batch?.durationMinutes || 120}
    />
  );
}
