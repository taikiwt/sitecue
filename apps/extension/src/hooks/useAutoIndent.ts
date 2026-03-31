import type React from "react";

/**
 * Hook to provide auto-indent functionality for a textarea.
 * It preserves the indentation from the previous line when Enter is pressed.
 * It also clears the indentation if Enter is pressed on a line containing only indentation.
 */
export function useAutoIndent() {
	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		// Only handle Enter key without any modifiers
		if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
			return;
		}

		const textarea = e.currentTarget;
		const { value, selectionStart, selectionEnd } = textarea;

		// If there is a selection, we let the default behavior take over
		if (selectionStart !== selectionEnd) {
			return;
		}

		// Find the start of the current line
		const currentLineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
		const currentLine = value.slice(currentLineStart, selectionStart);

		// Extract leading whitespace (indentation)
		const indentMatch = currentLine.match(/^[ \t]+/);
		if (!indentMatch) {
			return;
		}

		const indent = indentMatch[0];

		/**
		 * Helper to insert text while preserving undo history if possible.
		 * Uses document.execCommand("insertText") as a preferred method.
		 */
		const insertText = (
			text: string,
			selectionOverrideStart?: number,
			selectionOverrideEnd?: number,
		) => {
			let success = false;

			if (
				selectionOverrideStart !== undefined &&
				selectionOverrideEnd !== undefined
			) {
				textarea.setSelectionRange(
					selectionOverrideStart,
					selectionOverrideEnd,
				);
			}

			// 空文字の場合はネイティブの削除コマンドを使用する
			const command = text === "" ? "delete" : "insertText";

			// Try document.execCommand first to preserve undo history
			if (document.queryCommandSupported(command)) {
				success = document.execCommand(
					command,
					false,
					text === "" ? undefined : text,
				);
			}

			// Fallback to manual manipulation if execCommand failed or is not supported
			if (!success) {
				// setRangeTextで selectionMode を "end" に強制する
				const start = selectionOverrideStart ?? textarea.selectionStart;
				const end = selectionOverrideEnd ?? textarea.selectionEnd;
				textarea.setRangeText(text, start, end, "end");

				// Manually trigger 'input' event so React updates its state
				textarea.dispatchEvent(new Event("input", { bubbles: true }));
			}
		};

		// Case 1: If the line has ONLY indentation and user presses Enter, clear the indentation
		if (indent === currentLine) {
			e.preventDefault();
			insertText("", currentLineStart, selectionStart);
			return;
		}

		// Case 2: Indentation exists, insert a newline and the same indentation
		e.preventDefault();
		insertText(`\n${indent}`);
	};

	return onKeyDown;
}
