import { create } from "zustand";

interface LayoutState {
	isSidebarOpen: boolean;
	setIsSidebarOpen: (isOpen: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
	isSidebarOpen: true,
	setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
