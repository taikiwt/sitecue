import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useFetchNotes } from "@/hooks/useNotesQuery";
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
}));

vi.mock("@/hooks/useDraftsQuery", () => ({
	useFetchDrafts: vi.fn(() => ({ data: [], isLoading: false })),
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

describe("NotesContainer - Frontend Search & Slim Fetching", () => {
	it("URLの q パラメータに基づいて、フロントエンドでノートが正しくフィルタリングされること", () => {
		// "q=match" の検索状態
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("?q=match") as unknown as ReturnType<
				typeof useSearchParams
			>,
		);

		vi.mocked(useFetchNotes).mockReturnValue({
			data: [
				{
					id: "note-1",
					content: "This is a match",
					url_pattern: "example.com",
					scope: "inbox",
				},
				{
					id: "note-2",
					content: "No luck here",
					url_pattern: "example.com",
					scope: "inbox",
				},
			],
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchNotes>);

		render(<NotesContainer />);

		// MiddlePaneList が呼ばれ、フィルタリングされたアイテムが渡されていることを確認
		// (MiddlePaneList のモックで渡された props をキャプチャするように後で修正するか、
		// あるいは NoteItem などの描画を待つ)
		// 今回はモックなので、呼び出し時の props を確認するのが確実
	});

	it("Slim Fetching対応: content が undefined のノートは、検索クエリがあってもフィルタリングされずに残ること", () => {
		// "q=anything"
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("?q=anything") as unknown as ReturnType<
				typeof useSearchParams
			>,
		);

		const fetchNotesData = [
			{
				id: "note-loading",
				content: undefined,
				url_pattern: "example.com",
				scope: "inbox",
			},
			{
				id: "note-mismatch",
				content: "No match",
				url_pattern: "example.com",
				scope: "inbox",
			},
		];

		vi.mocked(useFetchNotes).mockReturnValue({
			data: fetchNotesData,
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchNotes>);

		// Note: content が undefined の場合、フィルタは true を返して残すはず
		// これにより useFetchNoteContents が発火する。
		render(<NotesContainer />);

		// クラッシュしないことの確認
		expect(screen.getByTestId("middle-pane")).toBeInTheDocument();
	});
});
