import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
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
					notes={mockNotes as any}
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
