import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import NoteInput from "./NoteInput";

describe("NoteInput Component", () => {
	it("入力して送信ボタンを押すと、onAddNoteが呼ばれ、入力欄がクリアされること", async () => {
		const user = userEvent.setup();
		const mockOnAddNote = vi.fn().mockResolvedValue(true);

		render(
			<NoteInput
				userPlan="free"
				totalNoteCount={10}
				maxFreeNotes={200}
				onAddNote={mockOnAddNote}
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
		render(
			<NoteInput
				userPlan="free"
				totalNoteCount={200} // 上限
				maxFreeNotes={200}
				onAddNote={vi.fn()}
			/>,
		);

		// テキストボックスが存在しないことを確認
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

		// 警告メッセージが表示されていることを確認
		expect(screen.getByText(/FREE Plan Limit Reached/i)).toBeInTheDocument();
	});
});
