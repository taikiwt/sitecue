import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SidePanel from "./SidePanel";

// Mock hooks
vi.mock("./supabaseClient", () => ({
	supabase: {
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			or: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn().mockReturnThis(),
			maybeSingle: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
		})),
	},
}));

vi.mock("./hooks/useAuth", () => ({
	useAuth: vi.fn(() => ({
		session: { user: { id: "user-1" } },
		authLoading: false,
		authError: null,
		sessionLoading: false,
		handleLogout: vi.fn(),
		handleSocialLogin: vi.fn(),
	})),
}));

vi.mock("./hooks/useCurrentTab", () => ({
	useCurrentTab: () => ({
		currentFullUrl: "https://example.com/page",
		url: "https://example.com/page",
		title: "Example Page",
	}),
}));

vi.mock("./hooks/useUserStats", () => ({
	useUserStats: () => ({
		userPlan: "free",
		totalNoteCount: 10,
		setTotalNoteCount: vi.fn(),
		userStatsLoading: false,
	}),
}));

const mockNotes = [
	{
		id: "1",
		content: "Exact Note",
		note_type: "info",
		scope: "exact",
		url_pattern: "example.com/page",
		is_resolved: false,
		is_pinned: false,
		is_favorite: false,
		sort_order: 1,
		created_at: new Date().toISOString(),
	},
	{
		id: "2",
		content: "Domain Note",
		note_type: "alert",
		scope: "domain",
		url_pattern: "example.com",
		is_resolved: false,
		is_pinned: false,
		is_favorite: false,
		sort_order: 2,
		created_at: new Date().toISOString(),
	},
	{
		id: "3",
		content: "Inbox Note",
		note_type: "info",
		scope: "inbox",
		url_pattern: "inbox",
		is_resolved: false,
		is_pinned: false,
		is_favorite: false,
		sort_order: 3,
		created_at: new Date().toISOString(),
	},
	{
		id: "4",
		content: "Other Page Note",
		note_type: "info",
		scope: "exact",
		url_pattern: "other.com/page",
		is_resolved: false,
		is_pinned: false,
		is_favorite: false,
		sort_order: 4,
		created_at: new Date().toISOString(),
	},
	{
		id: "5",
		content: "Favorite Note (Other Scope)",
		note_type: "idea",
		scope: "exact",
		url_pattern: "other.com/page",
		is_resolved: false,
		is_pinned: false,
		is_favorite: true, // お気に入り
		sort_order: 5,
		created_at: new Date().toISOString(),
	},
];

vi.mock("./hooks/useNotes", () => ({
	useNotes: vi.fn(() => ({
		notes: mockNotes,
		loading: false,
		addNote: vi.fn(),
		updateNote: vi.fn(),
		deleteNote: vi.fn(),
		toggleResolved: vi.fn(),
		toggleFavorite: vi.fn(),
		togglePinned: vi.fn(),
		updateNoteOrder: vi.fn(),
		toggleNoteExpansion: vi.fn(),
	})),
}));

describe("SidePanel Component", () => {
	it("グリッドレイアウトが正しく適用されていること", () => {
		const { container } = render(<SidePanel />);
		const mainDiv = container.querySelector(".grid");
		expect(mainDiv).toHaveClass("grid-rows-[auto_auto_auto_1fr_auto]");
	});

	it("フィルターの切り替えで表示されるノートが連動して変わること", async () => {
		render(<SidePanel />);

		// デフォルトは Exact スコープ
		expect(screen.getByText("Exact Note")).toBeInTheDocument();

		// Info フィルターをクリック
		const infoFilterButton = screen.getByTitle("Filter by Info");
		fireEvent.click(infoFilterButton);

		// Exact Note (info) は表示され、Favorite Note (idea) は消えるはず
		expect(screen.getByText("Exact Note")).toBeInTheDocument();
		expect(
			screen.queryByText("Favorite Note (Other Scope)"),
		).not.toBeInTheDocument();
	});

	it("検索入力で表示されるノートが連動して変わること", async () => {
		render(<SidePanel />);

		const searchInput = screen.getByPlaceholderText("Search...");
		fireEvent.change(searchInput, { target: { value: "Exact" } });

		// Exact Note だけが表示されるはず
		expect(screen.getByText("Exact Note")).toBeInTheDocument();
		expect(screen.queryByText("Domain Note")).not.toBeInTheDocument();
	});

	it("タブ（viewScope）の切り替えで表示されるノートがフィルタリングされ、他ドメインのノートが隔離されること", async () => {
		render(<SidePanel />);

		// 1. 最初は Page (exact) タブが選択されているはず
		expect(screen.getByText("Exact Note")).toBeInTheDocument();
		expect(screen.queryByText("Domain Note")).not.toBeInTheDocument();
		expect(screen.queryByText("Inbox Note")).not.toBeInTheDocument();

		// 他ドメインの通常ノート (Note 4) は表示されないこと
		expect(screen.queryByText("Other Page Note")).not.toBeInTheDocument();

		// お気に入りであれば、他ドメインのノート (Note 5) も表示される
		const favoritesButton = screen.getByText(/FAVORITES/);
		fireEvent.click(favoritesButton);
		expect(screen.getByText("Favorite Note (Other Scope)")).toBeInTheDocument();

		// 2. Domain タブに切り替え
		const domainTab = screen.getByRole("button", { name: /Domain/ });
		fireEvent.click(domainTab);

		expect(screen.queryByText("Exact Note")).not.toBeInTheDocument();
		expect(screen.getByText("Domain Note")).toBeInTheDocument();
		expect(screen.queryByText("Inbox Note")).not.toBeInTheDocument();
		// お気に入りであれば、他ドメイン・他スコープであっても表示される（グローバルお気に入り）
		expect(screen.getByText("Favorite Note (Other Scope)")).toBeInTheDocument();

		// 3. Inbox タブに切り替え
		const inboxTab = screen.getByRole("button", { name: /Inbox/ });
		fireEvent.click(inboxTab);

		expect(screen.queryByText("Exact Note")).not.toBeInTheDocument();
		expect(screen.queryByText("Domain Note")).not.toBeInTheDocument();
		expect(screen.getByText("Inbox Note")).toBeInTheDocument();
		// ただし Inbox タブでは、Page/Domain スコープのお気に入りは表示されない（隔離）
		expect(
			screen.queryByText("Favorite Note (Other Scope)"),
		).not.toBeInTheDocument();
	});

	it("他ドメインのお気に入りノートを解除したとき、即座に画面から消えること", async () => {
		// すでに vi.mock でモック化されている useNotes を取得
		const { useNotes } = await import("./hooks/useNotes");
		const mockUseNotes = vi.mocked(useNotes);

		const { rerender } = render(<SidePanel />);

		// お気に入りセクションを開く
		const favoritesButton = screen.getByText(/FAVORITES/);
		fireEvent.click(favoritesButton);
		expect(screen.getByText("Favorite Note (Other Scope)")).toBeInTheDocument();

		// モックの返り値を「お気に入り解除後」の状態に更新
		const updatedNotes = mockNotes.map((n) =>
			n.id === "5" ? { ...n, is_favorite: false } : n,
		);

		mockUseNotes.mockReturnValue({
			notes: updatedNotes,
			loading: false,
			addNote: vi.fn(),
			updateNote: vi.fn(),
			deleteNote: vi.fn(),
			toggleResolved: vi.fn(),
			toggleFavorite: vi.fn(),
			togglePinned: vi.fn(),
			updateNoteOrder: vi.fn(),
			toggleNoteExpansion: vi.fn(),
		} as unknown as ReturnType<typeof useNotes>);

		rerender(<SidePanel />);

		// お気に入りを解除した他ドメインのノートは、現在の Page タブから消えるはず
		expect(
			screen.queryByText("Favorite Note (Other Scope)"),
		).not.toBeInTheDocument();
	});
});
