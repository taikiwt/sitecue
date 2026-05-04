import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserStore } from "@/store/useUserStore";
import { GlobalNewNoteDialog } from "./GlobalNewNoteDialog";

// next/navigation のモック
const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: mockReplace }),
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

		// 1. exact=all が null に変換され、urlPattern が空、scope が inbox になることを確認
		// (domain=all も inbox に変換されるため、最終的に inbox スコープが優先される)
		expect(screen.getByPlaceholderText("example.com/page")).toHaveValue("");

		// scope selector の表示を確認
		const scopeTrigger = screen.getByRole("combobox");
		expect(scopeTrigger).toHaveTextContent("Inbox");
	});

	it("falls back to domain scope when domain is valid and not 'all'", async () => {
		const params = new URLSearchParams("globalNew=note&domain=example.com");
		mockUseSearchParams.mockReturnValue(params);

		render(<GlobalNewNoteDialog />);

		expect(screen.getByPlaceholderText("example.com/page")).toHaveValue(
			"example.com",
		);
		expect(screen.getByRole("combobox")).toHaveTextContent("Domain");
	});
});
