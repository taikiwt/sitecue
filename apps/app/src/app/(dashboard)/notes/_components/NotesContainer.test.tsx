import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useFetchNotes, useSearchNotes } from "@/hooks/useNotesQuery";
import { NotesContainer } from "./NotesContainer";

// モックのセットアップ
vi.mock("next/navigation", () => ({
	useSearchParams: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	}),
}));

vi.mock("@/store/useNotesStore", () => ({
	groupNotes: vi.fn(() => ({
		inbox: [],
		drafts: [],
		domains: {},
	})),
}));

vi.mock("@/hooks/useNotesQuery", () => ({
	useFetchNotes: vi.fn(),
	useSearchNotes: vi.fn(),
	useFetchNoteContents: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/useDraftsQuery", () => ({
	useFetchDrafts: () => ({ data: [], isLoading: false }),
}));

vi.mock("./MiddlePaneList", () => ({
	MiddlePaneList: () => <div data-testid="middle-pane" />,
}));

vi.mock("./RightPaneDetail", () => ({
	RightPaneDetail: ({ note }: { note: any }) => (
		<div data-testid="right-pane">{note?.content || "No Content"}</div>
	),
}));

// window.matchMedia のモック
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

describe("NotesContainer Search Behavior", () => {
	it("URLパラメータにqが存在し、検索中の場合、スケルトンが表示されること", () => {
		vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("?q=test") as any);

		(useFetchNotes as any).mockReturnValue({ data: [], isLoading: false });
		(useSearchNotes as any).mockReturnValue({
			data: [],
			isLoading: true,
			isFetching: true,
		});

		render(<NotesContainer />);

		expect(screen.getByLabelText("Loading search results")).toBeInTheDocument();
		expect(screen.getByLabelText("Loading search results")).toHaveAttribute(
			"aria-busy",
			"true",
		);
	});

	it("検索結果が返ってきた場合、検索結果が表示されること", async () => {
		vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("?q=test") as any);

		const mockSearchResults = [
			{ id: "note-1", url_pattern: "example.com", content: "Search Result" },
		];

		(useFetchNotes as any).mockReturnValue({ data: [], isLoading: false });
		(useSearchNotes as any).mockReturnValue({
			data: mockSearchResults,
			isLoading: false,
			isFetching: false,
		});

		render(<NotesContainer />);

		// MiddlePaneList が表示されていることを確認 (スケルトンが消えている)
		expect(screen.queryByLabelText("Loading search results")).not.toBeInTheDocument();
		expect(screen.getByTestId("middle-pane")).toBeInTheDocument();
	});

	it("noteIdが指定されている場合、キャッシュより検索結果のデータを優先して表示すること", async () => {
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("?q=test&noteId=note-1") as any,
		);

		const mockNotes = [{ id: "note-1", url_pattern: "example.com" }];
		const mockSearchResults = [
			{
				id: "note-1",
				url_pattern: "example.com",
				content: "Full text content from search",
			},
		];

		(useFetchNotes as any).mockReturnValue({ data: mockNotes, isLoading: false });
		(useSearchNotes as any).mockReturnValue({
			data: mockSearchResults,
			isLoading: false,
			isFetching: false,
		});

		render(<NotesContainer />);

		const detailContent = await screen.findByTestId("right-pane");
		expect(detailContent.textContent).toBe("Full text content from search");
	});
});
