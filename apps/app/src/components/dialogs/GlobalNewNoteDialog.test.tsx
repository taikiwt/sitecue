import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserStore } from "@/store/useUserStore";
import { GlobalNewNoteDialog } from "./GlobalNewNoteDialog";

// next/navigation のモック
const mockReplace = vi.fn();
const searchParams = new URLSearchParams("globalNew=note");
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: mockReplace }),
	useSearchParams: () => searchParams,
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
});
