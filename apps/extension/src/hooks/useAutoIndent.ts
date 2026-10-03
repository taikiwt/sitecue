import type React from "react";

/**
 * Hook to provide clean auto-indent functionality for command/code textareas.
 * - Tab / Shift+Tab: Inserts / removes 2 spaces indentation (handles single and multi-line selection).
 * - Enter: Preserves leading whitespace indentation from previous line.
 * - Does NOT include Markdown list bullets or bracket pairs.
 */
export function useAutoIndent() {
	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// 🛡️ IME入力中およびChromiumの1打鍵目(keyCode 229 / key Process)を完全遮断
		if (e.nativeEvent.isComposing || e.keyCode === 229 || e.key === "Process") {
			return;
		}

		const textarea = e.currentTarget;
		const { value, selectionStart, selectionEnd } = textarea;

		const insertText = (
			text: string,
			start: number,
			end: number,
			selectStart: number,
			selectEnd: number,
			isDelete = false,
		) => {
			textarea.setSelectionRange(start, end);
			let success = false;
			const command = isDelete ? "delete" : "insertText";

			if (
				typeof document !== "undefined" &&
				typeof document.queryCommandSupported === "function" &&
				typeof document.execCommand === "function" &&
				document.queryCommandSupported(command)
			) {
				try {
					success = document.execCommand(
						command,
						false,
						isDelete ? undefined : text,
					);
				} catch {
					success = false;
				}
			}
			if (!success) {
				textarea.setRangeText(text, start, end, "end");
				textarea.dispatchEvent(new Event("input", { bubbles: true }));
			}
			textarea.setSelectionRange(selectStart, selectEnd);
		};

		// --- 1. Tab / Shift+Tab キーによるインデント制御 (スペース2つ) ---
		if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
			e.preventDefault();
			const isShift = e.shiftKey;

			if (selectionStart !== selectionEnd) {
				// 複数行選択時の一括インデント / アウトデント
				const startOfSelection =
					value.lastIndexOf("\n", selectionStart - 1) + 1;
				const endOfSelection = value.indexOf("\n", selectionEnd);
				const targetEnd = endOfSelection === -1 ? value.length : endOfSelection;
				const selectedChunk = value.slice(startOfSelection, targetEnd);
				const lines = selectedChunk.split("\n");

				let diffStart = 0;
				let diffEnd = 0;

				const newLines = lines.map((line, idx) => {
					if (isShift) {
						let removed = 0;
						let newLine = line;
						if (line.startsWith("  ")) {
							removed = 2;
							newLine = line.slice(2);
						} else if (line.startsWith(" ") || line.startsWith("\t")) {
							removed = 1;
							newLine = line.slice(1);
						}
						if (idx === 0) diffStart -= removed;
						diffEnd -= removed;
						return newLine;
					} else {
						if (idx === 0) diffStart += 2;
						diffEnd += 2;
						return `  ${line}`;
					}
				});

				const newChunk = newLines.join("\n");
				insertText(
					newChunk,
					startOfSelection,
					targetEnd,
					Math.max(startOfSelection, selectionStart + diffStart),
					Math.max(startOfSelection, selectionEnd + diffEnd),
				);
			} else {
				// 単一カーソル時のインデント / アウトデント
				const currentLineStart =
					value.lastIndexOf("\n", selectionStart - 1) + 1;
				const currentLineToCursor = value.slice(
					currentLineStart,
					selectionStart,
				);

				if (isShift) {
					const match = currentLineToCursor.match(/^( {1,2}|\t)/);
					if (match) {
						const removeLen = match[0].length;
						insertText(
							"",
							currentLineStart,
							currentLineStart + removeLen,
							selectionStart - removeLen,
							selectionStart - removeLen,
							true,
						);
					}
				} else {
					insertText(
						"  ",
						selectionStart,
						selectionStart,
						selectionStart + 2,
						selectionStart + 2,
					);
				}
			}
			return;
		}

		// --- 2. Enterキーによる前行インデント継承 ---
		if (
			e.key === "Enter" &&
			!e.shiftKey &&
			!e.ctrlKey &&
			!e.metaKey &&
			!e.altKey
		) {
			if (selectionStart !== selectionEnd) return;

			const currentLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
			const currentLine = value.slice(currentLineStart, selectionStart);

			const indentMatch = currentLine.match(/^[ \t]+/);
			if (!indentMatch) return;

			const indent = indentMatch[0];

			e.preventDefault();
			// インデントのみの行でEnterが押された場合は行頭空白を解除
			if (indent === currentLine) {
				insertText(
					"\n",
					currentLineStart,
					selectionStart,
					currentLineStart + 1,
					currentLineStart + 1,
				);
				return;
			}

			// 前行インデントを継承して改行
			insertText(
				`\n${indent}`,
				selectionStart,
				selectionStart,
				selectionStart + indent.length + 1,
				selectionStart + indent.length + 1,
			);
		}
	};

	return Object.assign(onKeyDown, { onKeyDown });
}
