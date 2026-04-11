import { useEffect } from "react";

/**
 * Hook to prevent accidental navigation when there are unsaved changes.
 * @param isDirty Whether there are unsaved changes.
 */
export const useUnsavedChanges = (isDirty: boolean) => {
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
