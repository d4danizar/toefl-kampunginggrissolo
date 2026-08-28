"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { useTestStore } from "@/store/useTestStore";
import { saveProgress, submitTest } from "../actions";
import type { SafeQuestion } from "./page";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ============================================================
// Types
// ============================================================

interface TestEngineProps {
  sessionId: string;
  questions: SafeQuestion[];
  initialAnswers: Record<string, string>;
  startTime: string;
  durationMinutes: number;
}

type Section = "LISTENING" | "STRUCTURE" | "READING";

const SECTION_LABELS: Record<Section, string> = {
  LISTENING: "Listening",
  STRUCTURE: "Structure",
  READING: "Reading",
};

const AUTO_SAVE_INTERVAL = 30_000; // 30 detik

// ============================================================
// Component
// ============================================================

export function TestEngine({
  sessionId,
  questions,
  initialAnswers,
  startTime,
  durationMinutes,
}: TestEngineProps) {
  const { answers, isSaving, isDirty, setAnswer, initAnswers, setIsSaving, markSaved } =
    useTestStore();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const answersRef = useRef(answers);

  // Sync ref untuk auto-save interval
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Inisialisasi jawaban dari server (saat pertama load / refresh)
  useEffect(() => {
    initAnswers(initialAnswers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------
  // Auto-save setiap 30 detik
  // -------------------------------------------------------
  const performSave = useCallback(async () => {
    const currentAnswers = answersRef.current;
    if (Object.keys(currentAnswers).length === 0) return;

    setIsSaving(true);
    setSaveStatus("Menyimpan...");

    const result = await saveProgress(sessionId, currentAnswers);

    setIsSaving(false);
    if (result.success) {
      markSaved();
      setSaveStatus("Tersimpan");
      setTimeout(() => setSaveStatus(""), 3000);
    } else {
      setSaveStatus("Gagal menyimpan");
      setTimeout(() => setSaveStatus(""), 5000);
    }
  }, [sessionId, setIsSaving, markSaved]);

  useEffect(() => {
    const interval = setInterval(() => {
      const store = useTestStore.getState();
      if (store.isDirty && !store.isSaving) {
        performSave();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [performSave]);

  // -------------------------------------------------------
  // Timer & Auto-Submit
  // -------------------------------------------------------
  const EXAM_DURATION_MS = durationMinutes * 60 * 1000; 
  const [timeLeft, setTimeLeft] = useState<number>(EXAM_DURATION_MS);
  
  useEffect(() => {
    const end = new Date(startTime).getTime() + EXAM_DURATION_MS;
    
    const tick = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, end - now);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(timerInterval);
        // Force submit when time is up
        startSubmitTransition(async () => {
          await submitTest(sessionId, answersRef.current);
        });
      }
    };

    // Panggil sekali untuk inisialisasi awal, lalu set interval 1 detik
    tick();
    const timerInterval = setInterval(tick, 1000);
    return () => clearInterval(timerInterval);
  }, [startTime, sessionId]);

  // Format MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // -------------------------------------------------------
  // Kelompokkan soal berdasarkan section
  // -------------------------------------------------------
  const questionsBySection: Record<Section, SafeQuestion[]> = {
    LISTENING: questions.filter((q) => q.section === "LISTENING"),
    STRUCTURE: questions.filter((q) => q.section === "STRUCTURE"),
    READING: questions.filter((q) => q.section === "READING"),
  };

  const availableSections = (
    Object.keys(questionsBySection) as Section[]
  ).filter((s) => questionsBySection[s].length > 0);

  // -------------------------------------------------------
  // Hitung progress (abaikan instruksi)
  // -------------------------------------------------------
  const regularQuestions = questions.filter(q => q.optionA !== "INSTRUCTION");
  const totalQuestions = regularQuestions.length;
  const answeredCount = Object.keys(answers).length;

  // -------------------------------------------------------
  // Smart Resume: Tentukan tab aktif & Auto-Scroll
  // -------------------------------------------------------
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (availableSections.length === 0) return "";
    for (const section of availableSections) {
      const sectionQuestions = questionsBySection[section].filter(q => q.optionA !== "INSTRUCTION");
      const isCompleted = sectionQuestions.every(q => initialAnswers[q.id]);
      if (!isCompleted) return section;
    }
    return availableSections[availableSections.length - 1];
  });

  useEffect(() => {
    if (!activeTab) return;
    const sectionQuestions = questionsBySection[activeTab as Section] || [];
    const firstUnanswered = sectionQuestions.find(
      q => q.optionA !== "INSTRUCTION" && !initialAnswers[q.id]
    );

    if (firstUnanswered) {
      setTimeout(() => {
        const el = document.getElementById(`q-${firstUnanswered.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, []); // Run ONCE on mount

  // -------------------------------------------------------
  // Handle submit
  // -------------------------------------------------------
  function handleSubmit() {
    startSubmitTransition(async () => {
      await submitTest(sessionId, answers);
    });
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              TOEFL Prediction Test
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {answeredCount}/{totalQuestions} terjawab
              </span>
              {saveStatus && (
                <span
                  className={`text-xs ${
                    saveStatus === "Tersimpan"
                      ? "text-green-600"
                      : saveStatus === "Gagal menyimpan"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {saveStatus}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`text-lg font-mono font-bold px-3 py-1 rounded-md border ${timeLeft < 300000 ? "text-red-600 bg-red-50 border-red-200 animate-pulse" : "text-slate-700 bg-slate-100 border-slate-200"}`}>
              {formatTime(timeLeft)}
            </div>

            {/* Submit button */}
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogTrigger
                render={<Button variant="destructive" size="sm" />}
              >
                Submit Ujian
              </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Konfirmasi Submit</DialogTitle>
                <DialogDescription>
                  Anda telah menjawab {answeredCount} dari {totalQuestions}{" "}
                  soal.
                  {answeredCount < totalQuestions && (
                    <>
                      {" "}
                      Masih ada{" "}
                      <strong>{totalQuestions - answeredCount} soal</strong>{" "}
                      yang belum dijawab.
                    </>
                  )}
                  {" "}Apakah Anda yakin ingin mengirim jawaban? Tindakan ini
                  tidak dapat dibatalkan.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSubmitDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Kembali
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Ya, Submit Sekarang"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{
              width: `${
                totalQuestions > 0
                  ? (answeredCount / totalQuestions) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </header>

      {/* Main content with Tabs */}
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {availableSections.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                Belum ada soal yang tersedia untuk sesi ini.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full justify-start">
              {availableSections.map((section) => {
                const sectionAnswered = questionsBySection[section].filter(
                  (q) => answers[q.id]
                ).length;
                const sectionTotal = questionsBySection[section].filter(
                  (q) => q.optionA !== "INSTRUCTION"
                ).length;

                return (
                  <TabsTrigger key={section} value={section}>
                    {SECTION_LABELS[section]}
                    <span className="ml-1.5 text-xs opacity-60">
                      ({sectionAnswered}/{sectionTotal})
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {availableSections.map((section) => {
              let questionCounter = 1;
              return (
              <TabsContent key={section} value={section}>
                <div className="space-y-6">
                  {questionsBySection[section].map((question) => {
                    const isInstruction = question.optionA === "INSTRUCTION";
                    const currentNumber = isInstruction ? 0 : questionCounter++;

                    return (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        number={currentNumber}
                        selectedAnswer={answers[question.id] || ""}
                        onAnswerChange={(answer) =>
                          setAnswer(question.id, answer)
                        }
                        isInstruction={isInstruction}
                      />
                    );
                  })}
                </div>
              </TabsContent>
            )})}
          </Tabs>
        )}
      </main>
    </div>
  );
}

// ============================================================
// QuestionCard Component
// ============================================================

function QuestionCard({
  question,
  number,
  selectedAnswer,
  onAnswerChange,
  isInstruction,
}: {
  question: SafeQuestion;
  number: number;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  isInstruction?: boolean;
}) {
  if (isInstruction) {
    return (
      <Card id={`q-${question.id}`} className="border-l-4 border-l-blue-500 shadow-sm bg-blue-50/50 mb-8">
        <CardContent className="p-6">
          <div className="prose prose-sm sm:prose-base max-w-none text-blue-900">
            {question.text.split("\n").map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">
                {line.startsWith("**") && line.endsWith("**") ? (
                  <strong>{line.replace(/\*\*/g, "")}</strong>
                ) : line.startsWith("*") && line.endsWith("*") ? (
                  <em>{line.replace(/\*/g, "")}</em>
                ) : (
                  line
                )}
              </p>
            ))}
          </div>
          {question.audioUrl && (
            <div className="mt-4 rounded-lg bg-white p-3 border border-blue-100 shadow-sm">
              <audio controls src={question.audioUrl} className="w-full" preload="none">
                Browser Anda tidak mendukung pemutar audio.
              </audio>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const options = [
    { value: "A", label: question.optionA },
    { value: "B", label: question.optionB },
    { value: "C", label: question.optionC },
    { value: "D", label: question.optionD },
  ];

  const questionContent = (
    <>
      {/* Question number + text */}
      <div className="mb-4">
        <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 mb-2">
          Soal {number}
        </span>
        <p className="text-sm leading-relaxed sm:text-base">{question.text}</p>
      </div>

      {/* Audio player for LISTENING section */}
      {question.section === "LISTENING" && question.audioUrl && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <audio
            controls
            src={question.audioUrl}
            className="w-full"
            preload="none"
          >
            Browser Anda tidak mendukung pemutar audio.
          </audio>
        </div>
      )}

      {/* Answer options */}
      <RadioGroup
        value={selectedAnswer}
        onValueChange={onAnswerChange}
        className="space-y-2"
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
              selectedAnswer === option.value
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <RadioGroupItem
              value={option.value}
              id={`${question.id}-${option.value}`}
              className="mt-0.5"
            />
            <span className="flex-1 text-sm leading-relaxed">
              <span className="mr-2 font-semibold">{option.value}.</span>
              {option.label}
            </span>
          </label>
        ))}
      </RadioGroup>
    </>
  );

  return (
    <Card
      id={`q-${question.id}`}
      className={`transition-colors ${
        selectedAnswer ? "border-blue-200 bg-blue-50/30" : ""
      }`}
    >
      <CardContent className="p-4 sm:p-6">
        {question.passage ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Passage Container (Split Screen) */}
            <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-gray-50/80 p-4">
              <div className="font-serif text-sm leading-relaxed text-gray-800 text-justify whitespace-pre-wrap">
                {question.passage}
              </div>
            </div>
            {/* Question Content */}
            <div>
              {questionContent}
            </div>
          </div>
        ) : (
          questionContent
        )}
      </CardContent>
    </Card>
  );
}
