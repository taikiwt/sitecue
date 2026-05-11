import { render, screen } from "@testing-library/react";
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

	it("loadingかつnotesが0件の時、NoteSkeletonが3つ表示されること", () => {
		render(<NoteList {...mockProps} loading={true} />);

		// NoteSkeleton内の要素（"INFO"などのテキストはSkeletonになっているはずだが、
		// 今回はSkeletonコンポーネント自体の存在や数をチェックする）
		// NoteSkeletonには h-6 w-20 のSkeleton等が含まれる

		// 物理的に3つ分（skel-row-1 が 3つのノート分）あるか確認
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
