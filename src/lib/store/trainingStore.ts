import { create } from 'zustand';

// Define Answers type for clarity
type Answers = { [index: number]: string };

// Export the interface
export interface TrainingState {
  answers: Answers;
  setAnswer: (index: number, text: string) => void;
  resetAnswers: () => void;
  initializeAnswers: (initialAnswers: Answers) => void;
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
  initializeAnswers: (initialAnswers) => set({ answers: initialAnswers }),
})); 