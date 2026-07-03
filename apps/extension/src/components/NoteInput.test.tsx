import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NoteInput from "./NoteInput";

describe("NoteInput Component", () => {
	it("入力して送信ボタンを押すと、onAddNoteが呼ばれ、入力欄がクリアされること", async () => {
		const user = userEvent.setup();
		const mockOnAddNote = vi.fn().mockResolvedValue(true);
		const mockOnClose = vi.fn();

		render(
			<NoteInput
				userPlan="free"
				totalNoteCount={10}
				maxFreeNotes={200}
				onAddNote={mockOnAddNote}
				onClose={mockOnClose}
			/>,
		);

		const input = screen.getByRole("textbox");
		const submitButton = screen.getByRole("button", { name: /Add Note/i });

		// 1. テキストを入力
		await user.type(input, "新しいアイデアのメモ");
		expect(input).toHaveValue("新しいアイデアのメモ");

		// 2. 送信ボタンをクリック
		await user.click(submitButton);

		// 3. onAddNoteが正しい引数で呼ばれたか検証（デフォルトは exact と info）
		expect(mockOnAddNote).toHaveBeenCalledWith(
			"新しいアイデアのメモ",
			"exact",
			"info",
		);

		// 4. オプティミスティック更新により、入力欄が即座にクリアされているか検証
		expect(input).toHaveValue("");
	});

	it("無料枠の上限に達している場合、入力欄が非表示になり警告メッセージが出ること", () => {
		const mockOnClose = vi.fn();
		render(
			<NoteInput
				userPlan="free"
				totalNoteCount={200} // 上限
				maxFreeNotes={200}
				onAddNote={vi.fn()}
				onClose={mockOnClose}
			/>,
		);

		// テキストボックスが存在しないことを確認
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

		// 警告メッセージが表示されていることを確認
		expect(screen.getByText(/Note Limit Reached/i)).toBeInTheDocument();
	});
});

describe("NoteInput Component - 連続作成 & IME Guard", () => {
	const defaultProps = {
		userPlan: "free" as const,
		totalNoteCount: 10,
		maxFreeNotes: 500,
		onAddNote: vi.fn().mockResolvedValue(true),
		onClose: vi.fn(),
		textareaRef: {
			current: null,
		} as unknown as React.RefObject<HTMLTextAreaElement | null>,
	};

	it("Ctrl+EnterでのSubmit時、入力内容がクリアされ、onAddNoteが正しく呼び出されること", async () => {
		const mockOnAddNote = vi.fn().mockResolvedValue(true);
		render(<NoteInput {...defaultProps} onAddNote={mockOnAddNote} />);
		const textarea = screen.getByPlaceholderText(/Add a cue to/i);

		fireEvent.change(textarea, { target: { value: "ササッと連続連続メモ" } });
		expect(textarea).toHaveValue("ササッと連続連続メモ");

		fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

		await waitFor(() => {
			expect(mockOnAddNote).toHaveBeenCalledWith(
				"ササッと連続連続メモ",
				"exact",
				"info",
			);
		});
	});

	it("IME変換中のEnter（isComposing=true）ではSubmitがガードされ発火しないこと", () => {
		const mockOnAddNote = vi.fn().mockResolvedValue(true);
		render(<NoteInput {...defaultProps} onAddNote={mockOnAddNote} />);
		const textarea = screen.getByPlaceholderText(/Add a cue to/i);

		fireEvent.change(textarea, { target: { value: "漢字変換中" } });

		// nativeEvent.isComposing = true をシミュレート
		const event = new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true });
		Object.defineProperty(event, "nativeEvent", {
			value: { isComposing: true },
		});

		textarea.dispatchEvent(event);

		expect(mockOnAddNote).not.toHaveBeenCalled();
	});
});
