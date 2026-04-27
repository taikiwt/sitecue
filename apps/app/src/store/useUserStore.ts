import { create } from "zustand";

interface UserState {
	aiUsageCount: number;
	plan: string;
	setUserData: (count: number, plan: string) => void;
	incrementAiUsage: () => void;
}

export const useUserStore = create<UserState>((set) => ({
	aiUsageCount: 0,
	plan: "free",
	setUserData: (count, plan) => set({ aiUsageCount: count, plan }),
	incrementAiUsage: () =>
		set((state) => ({ aiUsageCount: state.aiUsageCount + 1 })),
}));
