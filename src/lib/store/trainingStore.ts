import { create } from 'zustand';

interface TrainingState {
  answers: { [index: number]: string };
  setAnswer: (index: number, text: string) => void;
  resetAnswers: () => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  answers: {},
  setAnswer: (index, text) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [index]: text,
      },
    })),
  resetAnswers: () => set({ answers: {} }),
})); 