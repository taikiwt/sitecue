import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchModal } from "./SearchModal";

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

// Mock useSearchNotes hook
const mockSearchNotes = vi.fn();
const mockFetchNoteContents = vi.fn();
vi.mock("@/hooks/useNotesQuery", () => ({
	useSearchNotes: (q: string) => mockSearchNotes(q),
	useFetchNoteContents: () => ({ mutate: mockFetchNoteContents }),
}));

describe("SearchModal Context Jump", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should navigate to exact domain and set noteId when a note is clicked", async () => {
		const user = userEvent.setup();

		// Setup mock return value for search
		mockSearchNotes.mockReturnValue({
			data: [
				{
					id: "note-123",
					content: "Test Note Content",
					scope: "exact",
					url_pattern: "https://example.com/path",
					note_type: "info",
					created_at: new Date().toISOString(),
				},
			],
			isLoading: false,
		});

		render(<SearchModal isOpen={true} onClose={vi.fn()} />);

		// Type in search box
		const input = screen.getByPlaceholderText(/search notes/i);
		await user.type(input, "Test");

		// Press Enter to trigger search
		await user.keyboard("{Enter}");

		// Wait for result to appear
		const noteResult = await screen.findByText("Test Note Content");
		await user.click(noteResult);

		// Verify navigation
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("domain=example.com"),
			);
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("exact=https%3A%2F%2Fexample.com%2Fpath"),
			);
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("noteId=note-123"),
			);
		});
	});

	it("should navigate to inbox for inbox scope notes", async () => {
		const user = userEvent.setup();

		mockSearchNotes.mockReturnValue({
			data: [
				{
					id: "note-inbox",
					content: "Inbox Note",
					scope: "inbox",
					url_pattern: "",
					note_type: "info",
					created_at: new Date().toISOString(),
				},
			],
			isLoading: false,
		});

		render(<SearchModal isOpen={true} onClose={vi.fn()} />);

		const input = screen.getByPlaceholderText(/search notes/i);
		await user.type(input, "Inbox");
		await user.keyboard("{Enter}");

		const noteResult = await screen.findByText("Inbox Note");
		await user.click(noteResult);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("domain=inbox"),
			);
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("noteId=note-inbox"),
			);
		});
	});

	it("should not trigger search on input change, only on submit", async () => {
		const user = userEvent.setup();
		mockSearchNotes.mockReturnValue({ data: [], isLoading: false });

		render(<SearchModal isOpen={true} onClose={vi.fn()} />);

		const input = screen.getByPlaceholderText(/search notes/i);
		fireEvent.change(input, { target: { value: "Test" } });

		// 途中経過で呼ばれていないことを確認
		expect(mockSearchNotes).not.toHaveBeenCalledWith("Test");

		// hit enter
		fireEvent.keyDown(input, { key: "Enter" });

		await waitFor(() => {
			expect(mockSearchNotes).toHaveBeenCalledWith("Test");
		});
	});

	it("should clear input and results when clear button is clicked", async () => {
		// Setup mock to return a result when query is "Test"
		mockSearchNotes.mockImplementation((q) => {
			if (q === "Test") {
				return {
					data: [
						{
							id: "1",
							content: "Test Result",
							url_pattern: "test.com",
							scope: "domain",
							note_type: "info",
							created_at: new Date().toISOString(),
						},
					],
					isLoading: false,
				};
			}
			return { data: [], isLoading: false };
		});

		render(<SearchModal isOpen={true} onClose={vi.fn()} />);

		const input = screen.getByPlaceholderText("Search notes...");

		// 文字を入力し、Enterで検索実行
		fireEvent.change(input, { target: { value: "Test" } });
		fireEvent.keyDown(input, { key: "Enter" });

		// 結果が表示されていることを確認
		expect(await screen.findByText("Test Result")).toBeInTheDocument();

		// クリアボタンを押下
		const clearButton = screen.getByRole("button", { name: /clear search/i });
		fireEvent.click(clearButton);

		// inputと結果が両方クリアされていることを確認
		expect(input).toHaveValue("");
		expect(screen.queryByText("Test Result")).not.toBeInTheDocument();
		expect(
			screen.getByText(
				"Type and press Enter to search your notes across domains",
			),
		).toBeInTheDocument();
	});
});
