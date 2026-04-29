import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFetchNotes } from "@/hooks/useNotesQuery";
import { useNotesStore } from "@/store/useNotesStore";
import { NotesContainer } from "./NotesContainer";

vi.mock("@/store/useNotesStore", () => ({
	useNotesStore: vi.fn(),
	groupNotes: vi.fn(() => ({
		inbox: [],
		drafts: [],
		domains: {},
	})),
}));

// モックのセットアップ
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams("?noteId=note-1&q=test"),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	}),
}));

vi.mock("@/hooks/useNotesQuery", () => ({
	useFetchNotes: vi.fn(),
	useFetchNoteContents: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/useDraftsQuery", () => ({
	useFetchDrafts: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/utils/supabase/client", () => ({
	createClient: () => ({
		from: () => ({
			select: () => ({
				ilike: () => ({
					order: () => ({
						order: () => Promise.resolve({ data: [], error: null }),
					}),
				}),
			}),
		}),
	}),
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
		addListener: vi.fn(), // 互換性のため
		removeListener: vi.fn(), // 互換性のため
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

describe("NotesContainer selectedNote resolution", () => {
	it("should prioritize searchResults over cached notes when noteId matches", async () => {
		// キャッシュされたノート（本文なし）
		const mockNotes = [{ id: "note-1", url_pattern: "example.com" }];
		(useFetchNotes as any).mockReturnValue({
			data: mockNotes,
			isLoading: false,
		});

		// 検索結果（本文あり）をモック
		(useNotesStore as any).mockReturnValue({
			searchResults: [
				{
					id: "note-1",
					url_pattern: "example.com",
					content: "Full text content",
				},
			],
			setSearchResults: vi.fn(),
		});

		render(<NotesContainer />);

		// 検索結果のコンテンツが右ペインに表示されることを確認（findByTextで非同期待機）
		const detailContent = await screen.findByTestId("right-pane");
		expect(detailContent.textContent).toBe("Full text content");
	});
});
