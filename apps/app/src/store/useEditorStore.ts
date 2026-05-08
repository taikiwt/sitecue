import { create } from "zustand";

interface EditorState {
	dirtyMap: Record<string, boolean>;
	isDirty: boolean;
	pendingContent: string | null;
	setDirtySource: (id: string, isDirty: boolean) => void;
	removeDirtySource: (id: string) => void;
	setIsDirty: (isDirty: boolean) => void; // 既存コード互換用
	setPendingContent: (content: string | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
	dirtyMap: {},
	isDirty: false,
	pendingContent: null,
	setDirtySource: (id, isDirty) => {
		const newMap = { ...get().dirtyMap, [id]: isDirty };
		set({
			dirtyMap: newMap,
			isDirty: Object.values(newMap).some(Boolean),
		});
	},
	removeDirtySource: (id) => {
		const newMap = { ...get().dirtyMap };
		delete newMap[id];
		set({
			dirtyMap: newMap,
			isDirty: Object.values(newMap).some(Boolean),
		});
	},
	setIsDirty: (isDirty) => set({ isDirty }),
	setPendingContent: (content) => set({ pendingContent: content }),
}));
