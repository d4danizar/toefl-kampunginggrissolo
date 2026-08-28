import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TestState {
  // State
  answers: Record<string, string>; // { questionId: "A" | "B" | "C" | "D" }
  isSaving: boolean;
  isDirty: boolean; // ada perubahan belum di-save

  // Actions
  setAnswer: (questionId: string, answer: string) => void;
  initAnswers: (initialAnswers: Record<string, string>) => void;
  setIsSaving: (isSaving: boolean) => void;
  markSaved: () => void;
}

export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      answers: {},
      isSaving: false,
      isDirty: false,

      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
          isDirty: true,
        })),

      initAnswers: (initialAnswers) =>
        set((state) => ({
          // Gabungkan jawaban dari server dan local storage.
          // Prioritaskan local storage karena bisa jadi lebih baru jika belum sempat ter-autosave ke DB saat disconnect.
          answers: { ...initialAnswers, ...state.answers },
          isDirty: Object.keys(state.answers).length > 0, 
        })),

      setIsSaving: (isSaving) => set({ isSaving }),

      markSaved: () => set({ isDirty: false }),
    }),
    {
      name: "toefl_cbt_answers", // Key untuk localStorage
      partialize: (state) => ({ answers: state.answers }), // Hanya persisten state answers
    }
  )
);
