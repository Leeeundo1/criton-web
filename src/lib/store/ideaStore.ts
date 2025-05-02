import { create } from 'zustand';

interface IdeaState {
  idea: string;
  setIdea: (idea: string) => void;
}

export const useIdeaStore = create<IdeaState>((set) => ({
  idea: '',
  setIdea: (idea: string) => set((state: IdeaState) => ({ ...state, idea })),
})); 