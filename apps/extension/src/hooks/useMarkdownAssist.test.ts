import { renderHook } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMarkdownAssist } from "./useMarkdownAssist";

describe("useMarkdownAssist Refined Unit Test Suite", () => {
	let textarea: HTMLTextAreaElement;

	beforeEach(() => {
		textarea = document.createElement("textarea");
		document.body.appendChild(textarea);

		document.queryCommandSupported = vi.fn().mockReturnValue(true);
		document.execCommand = vi
			.fn()
			.mockImplementation((command, _showUI, value) => {
				const { selectionStart, selectionEnd } = textarea;
				const currentVal = textarea.value;

				if (command === "insertText" && typeof value === "string") {
					textarea.value =
						currentVal.slice(0, selectionStart) +
						value +
						currentVal.slice(selectionEnd);
					textarea.selectionStart = selectionStart + value.length;
					textarea.selectionEnd = textarea.selectionStart;
					return true;
				}
				if (command === "delete") {
					textarea.value =
						currentVal.slice(0, selectionStart) +
						currentVal.slice(selectionEnd);
					textarea.selectionStart = selectionStart;
					textarea.selectionEnd = selectionStart;
					return true;
				}
				return false;
			});
	});

	afterEach(() => {
		document.body.removeChild(textarea);
	});

	const createMockKeyboardEvent = (
		key: string,
		options: Partial<React.KeyboardEvent<HTMLTextAreaElement>> = {},
	) => {
		return {
			key,
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			currentTarget: textarea,
			nativeEvent: { isComposing: false },
			...options,
		} as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
	};

	it("リストバレット行の任意の位置でTabを押した際、行頭にインデント（入れ子）が強制追加されること", () => {
		const { result } = renderHook(() => useMarkdownAssist());
		textarea.value = "- item text";
		// カーソルは "- item" の末尾（中央）に配置
		textarea.selectionStart = 6;
		textarea.selectionEnd = 6;

		const event = createMockKeyboardEvent("Tab");
		result.current.onKeyDown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		// 行頭に "  " が挿入されるが、カーソル位置は正しく2文字右（8）にずれること
		expect(textarea.value).toBe("  - item text");
		expect(textarea.selectionStart).toBe(8);
	});

	it("空のバレット行でもう一度Enterを押した際、マーカーが消去されクリーンな改行コードへ置換されること", () => {
		const { result } = renderHook(() => useMarkdownAssist());
		textarea.value = "- first\n- ";
		textarea.selectionStart = textarea.value.length;
		textarea.selectionEnd = textarea.value.length;

		const event = createMockKeyboardEvent("Enter");
		result.current.onKeyDown(event);

		expect(event.preventDefault).toHaveBeenCalled();
		// "- " が綺麗に消え、改行コード1つ（\n）へアトミック置換され、次行先頭（インデックス9）に着地する
		expect(textarea.value).toBe("- first\n\n");
		expect(textarea.selectionStart).toBe(9);
	});

	it("バッククォート（`）の入力時は自動閉じが発生せず、お節介を完全にパージ（引き算）できていること", () => {
		const { result } = renderHook(() => useMarkdownAssist());
		textarea.value = "";
		textarea.selectionStart = 0;
		textarea.selectionEnd = 0;

		const event = createMockKeyboardEvent("`");
		result.current.onKeyDown(event);

		// preventDefault が呼ばれず、標準入力動作を貫通（阻害しない）することを保証する
		expect(event.preventDefault).not.toHaveBeenCalled();
		expect(textarea.value).toBe(""); // 自動閉じ（``）のインメモリ挿入が発生しない
	});
});
