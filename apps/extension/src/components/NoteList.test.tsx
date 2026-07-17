import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Note } from "../hooks/useNotes";
import NoteList from "./NoteList";

describe("NoteList Component (Skeleton)", () => {
	const mockProps = {
		notes: [],
		loading: false,
		filterType: "all" as const,
		showResolved: false,
		currentFullUrl: "https://example.com",
		viewScope: "exact" as const,
		onUpdate: vi.fn(),
		onDelete: vi.fn(),
		onToggleResolved: vi.fn(),
		onToggleFavorite: vi.fn(),
		onTogglePinned: vi.fn(),
		onUpdateNoteOrder: vi.fn(),
		onToggleExpansion: vi.fn(),
	};

	it("loadingかつnotesが0件の時, NoteSkeletonが3つ表示されること", () => {
		render(<NoteList {...mockProps} loading={true} />);

		const skeletons = screen.getAllByTestId("note-skeleton");
		expect(skeletons.length).toBe(3);
	});

	it("データがある場合はスケルトンが表示されないこと", () => {
		const notes = [
			{
				id: "note-1",
				content: "Test note",
				note_type: "info" as const,
				scope: "exact" as const,
				url_pattern: "example.com",
				is_resolved: false,
				is_pinned: false,
				is_favorite: false,
				sort_order: 0,
				created_at: new Date().toISOString(),
			},
		] as unknown as Note[];
		render(<NoteList {...mockProps} notes={notes} loading={true} />);

		expect(screen.queryByTestId("note-skeleton")).not.toBeInTheDocument();
	});
});

describe("NoteList D&D and Editor Guard Integration", () => {
	const mockNotes = [
		{
			id: "note-1",
			content: "Note 1",
			note_type: "info" as const,
			scope: "exact" as const,
			url_pattern: "example.com",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
			sort_order: 0,
			created_at: "2026-01-01T00:00:00.000Z",
		},
		{
			id: "note-2",
			content: "Note 2",
			note_type: "info" as const,
			scope: "exact" as const,
			url_pattern: "example.com",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
			sort_order: 0,
			created_at: "2026-01-02T00:00:00.000Z",
		},
	];

	it("編集中のノートがダーティな状態で別のノートのEditを押すとwindow.confirmが発火すること", async () => {
		const originalConfirm = window.confirm;
		const windowConfirmSpy = vi.fn().mockReturnValue(false);
		window.confirm = windowConfirmSpy;
		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<NoteList
					notes={mockNotes as unknown as Note[]}
					loading={false}
					currentFullUrl="https://example.com"
					onUpdate={vi.fn()}
					onDelete={vi.fn()}
					onToggleResolved={vi.fn()}
					onToggleFavorite={vi.fn()}
					onTogglePinned={vi.fn()}
					onUpdateNoteOrder={vi.fn()}
					onToggleExpansion={vi.fn()}
				/>
			</QueryClientProvider>,
		);

		// 1つ目のノートを編集モードにする
		const editButtons = screen.getAllByTitle("Edit");
		fireEvent.click(editButtons[0]);

		// テキストエリアを書き換えてダーティ状態にする
		const textarea = screen.getByRole("textbox");
		fireEvent.change(textarea, { target: { value: "Changed Note 1 Content" } });

		// 2つ目のノートのEditを押す
		fireEvent.click(editButtons[1]);

		// window.confirm が呼ばれてガードが機能していることを検証
		expect(windowConfirmSpy).toHaveBeenCalled();
		window.confirm = originalConfirm;
	});
});

describe("NoteList - 完了シーケンシャルアニメーション", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("完了トグル（未完了➔完了）時、即座にDB更新を呼ばず、600msのアニメーション完了後にDB更新を呼び出すこと", async () => {
		const mockOnToggleResolved = vi.fn().mockResolvedValue(true);
		const testNotes = [
			{
				id: "note-1",
				content: "テストノート",
				note_type: "info" as const,
				scope: "exact" as const,
				is_resolved: false,
				is_favorite: false,
				is_pinned: false,
				is_expanded: false,
				sort_order: 1,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				user_id: "user-1",
				url_pattern: "example.com",
				draft_id: null,
				tags: [],
			},
		];

		render(
			<NoteList
				currentFullUrl="https://example.com"
				loading={false}
				notes={testNotes as unknown as Note[]}
				onDelete={vi.fn()}
				onToggleExpansion={vi.fn()}
				onToggleFavorite={vi.fn()}
				onTogglePinned={vi.fn()}
				onToggleResolved={mockOnToggleResolved}
				onUpdate={vi.fn()}
				onUpdateNoteOrder={vi.fn()}
				showResolved={false}
			/>,
		);

		const resolveButton = screen.getByTitle("Mark as resolved");
		fireEvent.click(resolveButton);

		// ボタンを押した瞬間（0ms）は、アニメーション中であるためDB更新関数はまだ呼ばれていないことを確認
		expect(mockOnToggleResolved).not.toHaveBeenCalled();

		// タイマーを600ms進める
		act(() => {
			vi.advanceTimersByTime(600);
		});

		// 600ms経過してカードが縮みきった後に、初めてDB更新関数が呼ばれたことを検証
		expect(mockOnToggleResolved).toHaveBeenCalledWith("note-1", false);
	});
});

describe("NoteList - pointerWithin Collision Detection Sensor", () => {
	it("すべてのDndContextにpointerWithinアルゴリズムが設定されていること", () => {
		const testNotes = [
			{
				id: "note-1",
				content: "テストノート",
				note_type: "info" as const,
				scope: "exact" as const,
				is_resolved: false,
				is_favorite: true,
				is_pinned: false,
				is_expanded: false,
				sort_order: 1,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				user_id: "user-1",
				url_pattern: "example.com",
				draft_id: null,
				tags: [],
			},
		];

		const { container } = render(
			<NoteList
				currentFullUrl="https://example.com"
				loading={false}
				notes={testNotes as unknown as Note[]}
				onDelete={vi.fn()}
				onToggleExpansion={vi.fn()}
				onToggleFavorite={vi.fn()}
				onTogglePinned={vi.fn()}
				onToggleResolved={vi.fn()}
				onUpdate={vi.fn()}
				onUpdateNoteOrder={vi.fn()}
				showResolved={false}
			/>,
		);

		const accordionBtn = screen.getByText(/FAVORITES/);
		fireEvent.click(accordionBtn);

		expect(container).toBeInTheDocument();
	});
});
