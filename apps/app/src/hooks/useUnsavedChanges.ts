import { useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";

/**
 * Hook to prevent accidental navigation when there are unsaved changes.
 * @param isDirty Whether there are unsaved changes.
 */
export const useUnsavedChanges = (isDirty: boolean) => {
	const setIsDirty = useEditorStore((state) => state.setIsDirty);

	// propsの変更をグローバルストアに同期
	useEffect(() => {
		setIsDirty(isDirty);
		// アンマウント時に状態をリセット
		return () => setIsDirty(false);
	}, [isDirty, setIsDirty]);

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
