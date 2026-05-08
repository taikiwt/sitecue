import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserStore } from "@/store/useUserStore";
import { useEditorStore } from "@/store/useEditorStore";
import { GlobalNewNoteDialog } from "./GlobalNewNoteDialog";

// next/navigation のモック
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("react-hot-toast", () => ({
	default: { error: vi.fn() },
}));

// カスタムフックのモック
const mockMutateAsync = vi.fn().mockRejectedValue({
	message: "note storage limit reached",
	code: "P0001",
});

vi.mock("@/hooks/useNotesQuery", () => ({
	useCreateNote: () => ({
		mutateAsync: mockMutateAsync,
	}),
}));

// NotesEditor のモック
vi.mock("@/components/editor/NotesEditor", () => ({
	NotesEditor: ({
		onChange,
		value,
	}: {
		onChange: (val: string) => void;
		value: string;
	}) => (
		<textarea
			data-testid="notes-editor"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

describe("GlobalNewNoteDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useUserStore.setState({ isPaywallOpen: false });
		mockUseSearchParams.mockReturnValue(new URLSearchParams("globalNew=note"));
	});

	it("closes itself and opens paywall when limit reached error occurs", async () => {
		render(<GlobalNewNoteDialog />);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Test note" } });

		const saveButton = screen.getByRole("button", { name: "Save Note" });
		fireEvent.click(saveButton);

		await waitFor(() => {
			// 1. handleCancel が呼ばれ、URLのパラメータから globalNew が消去されること
			expect(mockReplace).toHaveBeenCalled();
			// 2. Paywall が開くこと
			expect(useUserStore.getState().isPaywallOpen).toBe(true);
			expect(useUserStore.getState().paywallType).toBe("notes");
			// 3. 汎用エラーが出ないこと
			expect(toast.error).not.toHaveBeenCalled();
		});
	});

	it("sanitizes 'all' reserved words from search parameters", async () => {
		// モックの URLSearchParams を "exact=all&domain=all" で再定義
		const params = new URLSearchParams("globalNew=note&exact=all&domain=all");
		mockUseSearchParams.mockReturnValue(params);

		render(<GlobalNewNoteDialog />);

		// Inbox状態なのでURLのInput自体が存在しないことを確認
		expect(
			screen.queryByPlaceholderText(
				"[example.com/page](https://example.com/page)",
			),
		).not.toBeInTheDocument();

		// Inboxボタンが default variant (通常 bg-primary などのクラスを持つが、ここでは role で確認)
		const inboxButton = screen.getByRole("button", { name: "inbox" });
		expect(inboxButton).toHaveClass("capitalize");
	});

	it("falls back to domain scope when domain is valid and not 'all'", async () => {
		const params = new URLSearchParams("globalNew=note&domain=example.com");
		mockUseSearchParams.mockReturnValue(params);

		render(<GlobalNewNoteDialog />);

		expect(
			screen.getByPlaceholderText(
				"[example.com/page](https://example.com/page)",
			),
		).toHaveValue("example.com");
		const domainButton = screen.getByRole("button", { name: "domain" });
		expect(domainButton).toBeInTheDocument();
	});

	it("disables Save button when scope requires URL but it is empty", async () => {
		const params = new URLSearchParams("globalNew=note&domain=example.com");
		mockUseSearchParams.mockReturnValue(params);

		render(<GlobalNewNoteDialog />);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Test note" } });

		const saveButton = screen.getByRole("button", { name: "Save Note" });

		// 最初はURLが入っているので有効
		expect(saveButton).not.toBeDisabled();

		// URLを空にする
		const urlInput = screen.getByPlaceholderText(
			"[example.com/page](https://example.com/page)",
		);
		fireEvent.change(urlInput, { target: { value: "   " } }); // trimして空になる値

		// 無効化されることを確認
		expect(saveButton).toBeDisabled();

		// Inboxに変更するとURLが不要になるので有効になることを確認
		const inboxButton = screen.getByRole("button", { name: "inbox" });
		fireEvent.click(inboxButton);
		expect(saveButton).not.toBeDisabled();
	});

	it("promotes to studio correctly and saves pending content", async () => {
		render(<GlobalNewNoteDialog />);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Draft idea for studio" } });

		const promoteBtn = screen.getByRole("button", {
			name: "Edit in Studio",
		});
		fireEvent.click(promoteBtn);

		// Storeに値が保持されたことの確認
		expect(useEditorStore.getState().pendingContent).toBe(
			"Draft idea for studio",
		);
		// ダイアログを閉じるための replace が呼ばれたことの確認
		expect(mockReplace).toHaveBeenCalled();
		// Studio画面へ遷移したことの確認
		expect(mockPush).toHaveBeenCalledWith("/studio/new");
	});
});
