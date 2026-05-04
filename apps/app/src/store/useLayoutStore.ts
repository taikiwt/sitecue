import { create } from "zustand";

interface LayoutState {
	isSidebarOpen: boolean;
	setIsSidebarOpen: (isOpen: boolean) => void;
	isMobileHeaderVisible: boolean;
	setIsMobileHeaderVisible: (isVisible: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
	isSidebarOpen: true,
	setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
	isMobileHeaderVisible: true,
	setIsMobileHeaderVisible: (isVisible) =>
		set({ isMobileHeaderVisible: isVisible }),
}));
