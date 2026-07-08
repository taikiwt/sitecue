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
				onAppendDiary={vi.fn()}
				onClose={mockOnClose}
			/>,
		);

		const input = screen.getByPlaceholderText(/Add a cue to/i);
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
				onAppendDiary={vi.fn()}
				onClose={mockOnClose}
			/>,
		);

		// テキストボックスが存在しないことを確認
		expect(
			screen.queryByPlaceholderText(/Add a cue to/i),
		).not.toBeInTheDocument();

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
		onAppendDiary: vi.fn().mockResolvedValue(true),
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

describe("NoteInput + Diary Integration Split Test", () => {
	it("ノート入力欄でのCtrl+Enterと、日記入力欄でのCtrl+Enterが個別に正しいハンドラーをトリガーすること", async () => {
		const mockAddNote = vi.fn().mockResolvedValue(true);
		const mockAppendDiary = vi.fn().mockResolvedValue(true);
		const mockClose = vi.fn();

		render(
			<NoteInput
				userPlan="free"
				totalNoteCount={10}
				maxFreeNotes={500}
				onAddNote={mockAddNote}
				onAppendDiary={mockAppendDiary}
				onClose={mockClose}
			/>,
		);

		// 1. ノート用テキストエリアの検証
		const noteTextarea = screen.getByPlaceholderText(/Add a cue to/i);
		fireEvent.change(noteTextarea, {
			target: { value: "Note Content via Test" },
		});
		fireEvent.keyDown(noteTextarea, { key: "Enter", ctrlKey: true });
		expect(mockAddNote).toHaveBeenCalledWith(
			"Note Content via Test",
			"exact",
			"info",
		);
		expect(mockAppendDiary).not.toHaveBeenCalled();

		vi.clearAllMocks();

		// 2. 日記用テキストエリアの検証
		const diaryTextarea = screen.getByPlaceholderText(
			/Append to today's diary/i,
		);
		fireEvent.change(diaryTextarea, {
			target: { value: "Diary Segment via Test" },
		});
		fireEvent.keyDown(diaryTextarea, { key: "Enter", ctrlKey: true });
		expect(mockAppendDiary).toHaveBeenCalledWith("Diary Segment via Test");
		expect(mockAddNote).not.toHaveBeenCalled();
	});

	it("日記入力欄で送信ボタンを押すとonAppendDiaryが呼ばれ、成功時にonCloseが呼ばれること", async () => {
		const mockAppendDiary = vi.fn().mockResolvedValue(true);
		const mockClose = vi.fn();
		render(
			<NoteInput
				maxFreeNotes={500}
				onAddNote={vi.fn()}
				onAppendDiary={mockAppendDiary}
				onClose={mockClose}
				totalNoteCount={10}
				userPlan="free"
			/>,
		);

		const diaryTextarea = screen.getByPlaceholderText(
			/Append to today's diary/i,
		);
		fireEvent.change(diaryTextarea, {
			target: { value: "Test Submit Button" },
		});

		// 日記の島の送信ボタン (title="Append to Diary" 等で特定)
		const diarySubmitBtn = screen.getByTitle("Append to Diary");
		fireEvent.click(diarySubmitBtn);

		await waitFor(() => {
			expect(mockAppendDiary).toHaveBeenCalledWith("Test Submit Button");
			expect(mockClose).toHaveBeenCalled(); // 成功時クローズ
		});
	});
});
