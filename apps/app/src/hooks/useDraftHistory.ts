import { useCallback, useState } from "react";

export function useDraftHistory(initialContent: string) {
	const [history, setHistory] = useState<string[]>([initialContent]);
	const [historyIndex, setHistoryIndex] = useState(0);

	const pushToHistory = useCallback(
		(newContent: string) => {
			if (newContent === history[historyIndex]) return;

			const newHistory = history.slice(0, historyIndex + 1);
			newHistory.push(newContent);
			if (newHistory.length > 20) {
				newHistory.shift();
			}
			setHistory(newHistory);
			setHistoryIndex(newHistory.length - 1);
		},
		[history, historyIndex],
	);

	const handleUndo = useCallback(() => {
		if (historyIndex > 0) {
			const targetIndex = historyIndex - 1;
			setHistoryIndex(targetIndex);
			return history[targetIndex]; // UI側で content を更新するために返す
		}
		return null;
	}, [history, historyIndex]);

	const handleRedo = useCallback(() => {
		if (historyIndex < history.length - 1) {
			const targetIndex = historyIndex + 1;
			setHistoryIndex(targetIndex);
			return history[targetIndex]; // UI側で content を更新するために返す
		}
		return null;
	}, [history, historyIndex]);

	return {
		historyIndex,
		historyLength: history.length,
		pushToHistory,
		handleUndo,
		handleRedo,
	};
}
