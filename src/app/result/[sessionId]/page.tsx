import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 600)
    return {
      label: "Advanced",
      color: "text-green-700",
      bgColor: "bg-green-50 border-green-200",
    };
  if (score >= 500)
    return {
      label: "Intermediate",
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-200",
    };
  if (score >= 400)
    return {
      label: "Elementary",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50 border-yellow-200",
    };
  return {
    label: "Basic",
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
  };
}

export default async function ResultPage({
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
  // 2. Ambil test session + user + batch
  // -------------------------------------------------------
  const testSession = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          institution: true,
        },
      },
      batch: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!testSession) {
    redirect("/dashboard");
  }

  // Cek ownership
  if (testSession.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Cek apakah tes sudah selesai
  if (!testSession.isCompleted) {
    redirect("/dashboard");
  }

  // -------------------------------------------------------
  // 3. Hitung detail skor per section (dari answers)
  // -------------------------------------------------------
  const answers =
    testSession.answers && typeof testSession.answers === "object"
      ? (testSession.answers as Record<string, string>)
      : {};

  const questions = await prisma.question.findMany({
    where: { batchId: testSession.batchId },
    select: { id: true, section: true, correctAnswer: true },
  });

  let correctL = 0,
    totalL = 0;
  let correctS = 0,
    totalS = 0;
  let correctR = 0,
    totalR = 0;

  for (const q of questions) {
    switch (q.section) {
      case "LISTENING":
        totalL++;
        if (answers[q.id] === q.correctAnswer) correctL++;
        break;
      case "STRUCTURE":
        totalS++;
        if (answers[q.id] === q.correctAnswer) correctS++;
        break;
      case "READING":
        totalR++;
        if (answers[q.id] === q.correctAnswer) correctR++;
        break;
    }
  }

  const totalScore = testSession.score ?? 0;
  const level = getScoreLevel(totalScore);

  // -------------------------------------------------------
  // 4. Render
  // -------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Certificate Card */}
        <Card className="overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-center text-white">
            <p className="text-sm font-medium uppercase tracking-widest opacity-80">
              Hasil Ujian
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              TOEFL Prediction Test
            </h1>
            <p className="mt-1 text-sm opacity-80">{testSession.batch.name}</p>
          </div>

          <CardContent className="p-6 sm:p-8">
            {/* Peserta info */}
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {testSession.user.name}
              </h2>
              {testSession.user.institution && (
                <p className="text-sm text-muted-foreground">
                  {testSession.user.institution}
                </p>
              )}
            </div>

            {/* Total Score — prominent */}
            <div className="mb-8 text-center">
              <div
                className={`inline-block rounded-2xl border-2 px-10 py-6 ${level.bgColor}`}
              >
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Total Skor
                </p>
                <p className="mt-1 text-6xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
                  {totalScore}
                </p>
                <p className={`mt-2 text-sm font-semibold ${level.color}`}>
                  {level.label}
                </p>
              </div>
            </div>

            {/* Section scores */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <SectionScoreCard
                title="Listening"
                correct={correctL}
                total={totalL}
                color="bg-blue-500"
              />
              <SectionScoreCard
                title="Structure"
                correct={correctS}
                total={totalS}
                color="bg-indigo-500"
              />
              <SectionScoreCard
                title="Reading"
                correct={correctR}
                total={totalR}
                color="bg-purple-500"
              />
            </div>

            {/* Detail info */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Detail Ujian
              </h3>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Ujian</span>
                  <span className="font-medium">
                    {formatDate(testSession.startTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waktu Mulai</span>
                  <span className="font-medium">
                    {formatTime(testSession.startTime)}
                  </span>
                </div>
                {testSession.endTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Waktu Selesai
                    </span>
                    <span className="font-medium">
                      {formatTime(testSession.endTime)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Soal Dijawab
                  </span>
                  <span className="font-medium">
                    {Object.keys(answers).length}/{questions.length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="text-center">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              ← Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Section Score Card
// ============================================================

function SectionScoreCard({
  title,
  correct,
  total,
  color,
}: {
  title: string;
  correct: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="rounded-lg border bg-white p-4 text-center">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold">
        {correct}
        <span className="text-base font-normal text-muted-foreground">
          /{total}
        </span>
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{percentage}% benar</p>
    </div>
  );
}
