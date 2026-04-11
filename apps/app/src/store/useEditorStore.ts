import { create } from "zustand";

interface EditorState {
	isDirty: boolean;
	setIsDirty: (isDirty: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
	isDirty: false,
	setIsDirty: (isDirty) => set({ isDirty }),
}));
