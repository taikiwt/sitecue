import { create } from "zustand";

export type LimitType = "notes" | "drafts" | "ai";

interface UserState {
	aiUsageCount: number;
	plan: string;
	isPaywallOpen: boolean;
	paywallType: LimitType;
	setUserData: (count: number, plan: string) => void;
	incrementAiUsage: () => void;
	openPaywall: (type: LimitType) => void;
	closePaywall: () => void;
}

export const useUserStore = create<UserState>((set) => ({
	aiUsageCount: 0,
	plan: "free",
	isPaywallOpen: false,
	paywallType: "notes",
	setUserData: (count, plan) => set({ aiUsageCount: count, plan }),
	incrementAiUsage: () =>
		set((state) => ({ aiUsageCount: state.aiUsageCount + 1 })),
	openPaywall: (type) => set({ isPaywallOpen: true, paywallType: type }),
	closePaywall: () => set({ isPaywallOpen: false }),
}));
