import { create } from "zustand";

export interface UIModalState {
	isOpen: boolean;
	mode: "gate" | "note" | "diary";
}

interface LayoutState {
	isSidebarOpen: boolean;
	setIsSidebarOpen: (isOpen: boolean) => void;
	globalNewModal: UIModalState;
	openGlobalNewModal: (mode: "gate" | "note" | "diary") => void;
	closeGlobalNewModal: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
	isSidebarOpen: true,
	setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
	globalNewModal: {
		isOpen: false,
		mode: "gate",
	},
	openGlobalNewModal: (mode) =>
		set({
			globalNewModal: { isOpen: true, mode },
		}),
	closeGlobalNewModal: () =>
		set((state) => ({
			globalNewModal: { ...state.globalNewModal, isOpen: false },
		})),
}));
