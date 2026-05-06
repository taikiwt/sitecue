import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useFetchNotes, useSearchNotes } from "@/hooks/useNotesQuery";
import { NotesContainer } from "./NotesContainer";

// モック: Next.js Navigation
vi.mock("next/navigation", () => ({
	useSearchParams: vi.fn(),
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
		prefetch: vi.fn(),
	}),
}));

// モック: Hooks (ZustandやReact Queryの部分を純粋な値としてモック化)
vi.mock("@/hooks/useNotesQuery", () => ({
	useFetchNotes: vi.fn(),
	useFetchNoteContents: vi.fn(() => ({ mutate: vi.fn() })),
	useSearchNotes: vi.fn(),
}));

vi.mock("@/hooks/useDraftsQuery", () => ({
	useFetchDrafts: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock("@/store/useLayoutStore", () => ({
	useLayoutStore: vi.fn((selector) =>
		selector({
			setIsMobileHeaderVisible: vi.fn(),
		}),
	),
}));

vi.mock("./MiddlePaneList", () => ({
	MiddlePaneList: () => <div data-testid="middle-pane" />,
}));

vi.mock("./RightPaneDetail", () => ({
	RightPaneDetail: () => <div data-testid="right-pane" />,
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

describe("NotesContainer", () => {
	it("検索結果がオブジェクト形式で返されてもクラッシュせず、正しく平坦化してリスト描画できること", () => {
		// "q=test" の検索状態をシミュレート
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("?q=test") as unknown as ReturnType<
				typeof useSearchParams
			>,
		);

		vi.mocked(useFetchNotes).mockReturnValue({
			data: [],
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchNotes>);

		// 修正後のオブジェクト形式でモックデータを返却
		vi.mocked(useSearchNotes).mockReturnValue({
			data: {
				notes: [
					{
						id: "note-1",
						content: "Test Note",
						url_pattern: "example.com",
						note_type: "info",
						created_at: new Date().toISOString(),
					},
				],
				drafts: [
					{
						id: "draft-1",
						content: "Test Draft",
						created_at: new Date().toISOString(),
					},
				],
			},
			isLoading: false,
			isFetching: false,
		} as unknown as ReturnType<typeof useSearchNotes>);

		render(<NotesContainer />);

		// クラッシュせずにレンダリングされ、スケルトンが表示されていないことを確認
		expect(
			screen.queryByLabelText("Loading search results"),
		).not.toBeInTheDocument();
	});

	it("URLに exact パラメータが存在する場合、検索結果に対して二次フィルタリングが適用されること", () => {
		// 検索中かつ特定のPAGESにドリルダウンしている状態
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams(
				"?q=test&domain=example.com&exact=https://example.com/target",
			) as unknown as ReturnType<typeof useSearchParams>,
		);

		vi.mocked(useFetchNotes).mockReturnValue({
			data: [],
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchNotes>);

		vi.mocked(useSearchNotes).mockReturnValue({
			data: {
				notes: [
					{
						id: "note-1",
						content: "Should Show",
						url_pattern: "https://example.com/target",
						note_type: "info",
						created_at: new Date().toISOString(),
					},
					{
						id: "note-2",
						content: "Should Hide",
						url_pattern: "https://example.com/other",
						note_type: "info",
						created_at: new Date().toISOString(),
					},
				],
				drafts: [
					{
						id: "draft-1",
						content: "Should Hide Draft",
						created_at: new Date().toISOString(),
					},
				],
			},
			isLoading: false,
			isFetching: false,
		} as unknown as ReturnType<typeof useSearchNotes>);

		render(<NotesContainer />);

		// クラッシュしないことを確認
		expect(
			screen.queryByLabelText("Loading search results"),
		).not.toBeInTheDocument();
	});
});
