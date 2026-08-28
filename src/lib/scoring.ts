// ============================================================
// TOEFL ITP Score Conversion (Aproksimasi)
// ============================================================
//
// Tabel konversi berdasarkan standar TOEFL ITP:
// - Listening Comprehension : 50 soal → skala 31–68
// - Structure & Written Exp : 40 soal → skala 31–68
// - Reading Comprehension   : 50 soal → skala 31–67
//
// Skor akhir = round(((L + S + R) × 10) / 3)
// Range total: ~310 – 677
// ============================================================

export type ToeflScore = {
  totalScore: number;
  listeningScore: number;
  structureScore: number;
  readingScore: number;
  listeningCorrect: number;
  structureCorrect: number;
  readingCorrect: number;
};

// Lookup table: index = jumlah benar → value = scaled score
// Sumber: aproksimasi tabel konversi ETS TOEFL ITP

const LISTENING_TABLE: number[] = [
  // 0-50 correct → scaled score
  24, 25, 26, 27, 28, 29, 30, 31, 32, 33, // 0-9
  34, 35, 35, 36, 37, 38, 38, 39, 40, 41, // 10-19
  41, 42, 43, 44, 44, 45, 46, 47, 47, 48, // 20-29
  49, 50, 51, 52, 52, 53, 54, 55, 56, 57, // 30-39
  57, 58, 59, 60, 61, 62, 63, 64, 65, 66, // 40-49
  68,                                       // 50
];

const STRUCTURE_TABLE: number[] = [
  // 0-40 correct → scaled score
  20, 21, 22, 23, 25, 26, 27, 29, 31, 33, // 0-9
  35, 37, 38, 40, 41, 42, 43, 44, 45, 46, // 10-19
  47, 48, 49, 50, 51, 52, 53, 54, 55, 56, // 20-29
  57, 58, 59, 60, 61, 63, 64, 65, 66, 67, // 30-39
  68,                                       // 40
];

const READING_TABLE: number[] = [
  // 0-50 correct → scaled score
  21, 22, 23, 23, 24, 25, 26, 27, 28, 29, // 0-9
  30, 31, 33, 34, 35, 36, 37, 38, 39, 40, // 10-19
  41, 42, 43, 44, 44, 45, 46, 47, 48, 48, // 20-29
  49, 50, 51, 52, 52, 53, 54, 55, 56, 56, // 30-39
  57, 58, 59, 60, 61, 62, 63, 64, 65, 66, // 40-49
  67,                                       // 50
];

function lookupScore(
  table: number[],
  correct: number,
  maxQuestions: number
): number {
  // Clamp ke range valid
  const clamped = Math.max(0, Math.min(correct, maxQuestions));
  return table[clamped] ?? table[table.length - 1];
}

export function calculateToeflScore(
  correctListening: number,
  correctStructure: number,
  correctReading: number
): ToeflScore {
  const listeningScore = lookupScore(LISTENING_TABLE, correctListening, 50);
  const structureScore = lookupScore(STRUCTURE_TABLE, correctStructure, 40);
  const readingScore = lookupScore(READING_TABLE, correctReading, 50);

  // Rumus TOEFL ITP: ((L + S + R) × 10) / 3
  const totalScore = Math.round(
    ((listeningScore + structureScore + readingScore) * 10) / 3
  );

  return {
    totalScore,
    listeningScore,
    structureScore,
    readingScore,
    listeningCorrect: correctListening,
    structureCorrect: correctStructure,
    readingCorrect: correctReading,
  };
}
