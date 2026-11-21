import { useCallback, useEffect, useRef, useState } from "react";

export type QuickPanelTab = "none" | "note" | "command";
export type QuickNoteViewMode = "edit" | "preview";

const isValidTab = (val: unknown): val is QuickPanelTab =>
	val === "none" || val === "note" || val === "command";

export function useQuickStorage(userId: string) {
	const tabStorageKey = `quick_panel_tab_${userId}`;
	const noteStorageKey = `quick_note_text_${userId}`;
	const codeStorageKey = `quick_code_text_${userId}`;
	const viewModeStorageKey = `quick_note_view_mode_${userId}`;

	const [activeSection, setActiveSection] = useState<QuickPanelTab>(() => {
		if (typeof localStorage !== "undefined") {
			try {
				const cached = localStorage.getItem(tabStorageKey);
				if (isValidTab(cached)) return cached;
			} catch {
				// ignore storage access error
			}
		}
		return "note";
	});
	const [noteText, setNoteText] = useState("");
	const [codeText, setCodeText] = useState("");
	const [noteViewMode, setNoteViewMode] = useState<QuickNoteViewMode>("edit");

	const noteTextRef = useRef("");
	const codeTextRef = useRef("");
	const noteDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const codeDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isNoteStorageLoadedRef = useRef(false);
	const isCodeStorageLoadedRef = useRef(false);

	const flushNoteStorage = useCallback(() => {
		if (!isNoteStorageLoadedRef.current) return;
		if (noteDebounceTimerRef.current) {
			clearTimeout(noteDebounceTimerRef.current);
			noteDebounceTimerRef.current = null;
		}
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local.set({ [noteStorageKey]: noteTextRef.current });
		}
	}, [noteStorageKey]);

	const flushCodeStorage = useCallback(() => {
		if (!isCodeStorageLoadedRef.current) return;
		if (codeDebounceTimerRef.current) {
			clearTimeout(codeDebounceTimerRef.current);
			codeDebounceTimerRef.current = null;
		}
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local.set({ [codeStorageKey]: codeTextRef.current });
		}
	}, [codeStorageKey]);

	useEffect(() => {
		isNoteStorageLoadedRef.current = false;
		isCodeStorageLoadedRef.current = false;

		if (typeof localStorage !== "undefined") {
			try {
				const cachedTab = localStorage.getItem(tabStorageKey);
				if (isValidTab(cachedTab)) {
					setActiveSection(cachedTab);
				}
			} catch {
				// ignore
			}
		}

		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local.get(tabStorageKey, (result) => {
				const storedTab = (result as Record<string, unknown>)[tabStorageKey];
				const resolvedTab: QuickPanelTab = isValidTab(storedTab)
					? storedTab
					: "note";
				setActiveSection(resolvedTab);
				if (typeof localStorage !== "undefined") {
					try {
						localStorage.setItem(tabStorageKey, resolvedTab);
					} catch {
						// ignore
					}
				}
			});
			chrome.storage.local.get(noteStorageKey, (result) => {
				const storedText = (result as Record<string, unknown>)[noteStorageKey];
				const nextText = typeof storedText === "string" ? storedText : "";
				setNoteText(nextText);
				noteTextRef.current = nextText;
				isNoteStorageLoadedRef.current = true;
			});
			chrome.storage.local.get(viewModeStorageKey, (result) => {
				const storedMode = (result as Record<string, unknown>)[
					viewModeStorageKey
				];
				if (storedMode === "preview" || storedMode === "edit") {
					setNoteViewMode(storedMode);
				}
			});
			chrome.storage.local.get(codeStorageKey, (result) => {
				const storedCode = (result as Record<string, unknown>)[codeStorageKey];
				const nextCode = typeof storedCode === "string" ? storedCode : "";
				setCodeText(nextCode);
				codeTextRef.current = nextCode;
				isCodeStorageLoadedRef.current = true;
			});
		}
	}, [tabStorageKey, noteStorageKey, viewModeStorageKey, codeStorageKey]);

	const updateActiveSection = useCallback(
		(nextTab: QuickPanelTab) => {
			setActiveSection(nextTab);
			if (typeof localStorage !== "undefined") {
				try {
					localStorage.setItem(tabStorageKey, nextTab);
				} catch {
					// ignore
				}
			}
			if (typeof chrome !== "undefined" && chrome.storage?.local) {
				chrome.storage.local.set({ [tabStorageKey]: nextTab });
			}
		},
		[tabStorageKey],
	);

	const handleNoteTextChange = useCallback(
		(val: string) => {
			if (!isNoteStorageLoadedRef.current) return;
			setNoteText(val);
			noteTextRef.current = val;

			if (noteDebounceTimerRef.current) {
				clearTimeout(noteDebounceTimerRef.current);
			}
			noteDebounceTimerRef.current = setTimeout(() => {
				if (typeof chrome !== "undefined" && chrome.storage?.local) {
					chrome.storage.local.set({ [noteStorageKey]: val });
				}
				noteDebounceTimerRef.current = null;
			}, 300);
		},
		[noteStorageKey],
	);

	const handleCodeTextChange = useCallback(
		(val: string) => {
			if (!isCodeStorageLoadedRef.current) return;
			setCodeText(val);
			codeTextRef.current = val;

			if (codeDebounceTimerRef.current) {
				clearTimeout(codeDebounceTimerRef.current);
			}
			codeDebounceTimerRef.current = setTimeout(() => {
				if (typeof chrome !== "undefined" && chrome.storage?.local) {
					chrome.storage.local.set({ [codeStorageKey]: val });
				}
				codeDebounceTimerRef.current = null;
			}, 300);
		},
		[codeStorageKey],
	);

	const toggleNoteViewMode = useCallback(() => {
		setNoteViewMode((prev) => {
			const nextMode: QuickNoteViewMode = prev === "edit" ? "preview" : "edit";
			if (typeof chrome !== "undefined" && chrome.storage?.local) {
				chrome.storage.local.set({ [viewModeStorageKey]: nextMode });
			}
			return nextMode;
		});
	}, [viewModeStorageKey]);

	useEffect(() => {
		const handlePageHide = () => {
			flushNoteStorage();
			flushCodeStorage();
		};
		window.addEventListener("pagehide", handlePageHide);
		return () => {
			window.removeEventListener("pagehide", handlePageHide);
			flushNoteStorage();
			flushCodeStorage();
		};
	}, [flushNoteStorage, flushCodeStorage]);

	return {
		activeSection,
		updateActiveSection,
		noteText,
		handleNoteTextChange,
		flushNoteStorage,
		codeText,
		handleCodeTextChange,
		flushCodeStorage,
		noteViewMode,
		toggleNoteViewMode,
	};
}
