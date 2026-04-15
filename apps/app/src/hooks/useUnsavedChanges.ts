import { useEffect, useId } from "react";
import { useEditorStore } from "@/store/useEditorStore";

/**
 * Hook to prevent accidental navigation when there are unsaved changes.
 * @param isDirty Whether there are unsaved changes.
 */
export const useUnsavedChanges = (isDirty: boolean) => {
	const setDirtySource = useEditorStore((state) => state.setDirtySource);
	const removeDirtySource = useEditorStore((state) => state.removeDirtySource);
	const hookId = useId();

	// propsの変更をIDごとにグローバルストアに同期
	useEffect(() => {
		setDirtySource(hookId, isDirty);
		// アンマウント時にこのコンポーネントの状態をリセット
		return () => removeDirtySource(hookId);
	}, [isDirty, setDirtySource, removeDirtySource, hookId]);

	// ブラウザ標準の離脱防止（リロード・タブ閉じ用）
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [isDirty]);
};
