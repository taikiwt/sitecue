import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUserStore } from "@/store/useUserStore";
import NoteEditor from "./NoteEditor";

// Mock dependencies
vi.mock("react-hot-toast", () => ({
	default: { error: vi.fn() },
}));

// NoteEditor内部の NotesEditor コンポーネントをモック
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

describe("NoteEditor Error Handling", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useUserStore.setState({ isPaywallOpen: false });
	});

	it("opens paywall on PostgrestError format (object without Error prototype)", async () => {
		// Supabaseの PostgrestError を模倣したオブジェクトをスローさせる
		const mockOnSubmit = vi.fn().mockRejectedValue({
			message: "note storage limit reached",
			code: "P0001",
		});

		render(<NoteEditor onSubmit={mockOnSubmit} />);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Test note" } });

		const saveButton = screen.getByRole("button", { name: "Save note" });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(useUserStore.getState().isPaywallOpen).toBe(true);
			expect(useUserStore.getState().paywallType).toBe("notes");
			expect(toast.error).not.toHaveBeenCalled();
		});
	});

	it("shows generic toast for other errors", async () => {
		const mockOnSubmit = vi.fn().mockRejectedValue(new Error("Network Error"));

		render(<NoteEditor onSubmit={mockOnSubmit} />);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Test note" } });

		const saveButton = screen.getByRole("button", { name: "Save note" });
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Failed to save the note.");
			expect(useUserStore.getState().isPaywallOpen).toBe(false);
		});
	});
});
