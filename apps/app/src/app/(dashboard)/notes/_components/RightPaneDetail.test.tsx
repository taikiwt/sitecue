import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Note } from "../types";
import { RightPaneDetail } from "./RightPaneDetail";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/useDiariesQuery", () => ({
	useFetchDiaries: () => ({ data: [] }),
}));

vi.mock("@/hooks/useNotesQuery", () => ({
	useCreateNote: () => ({ mutateAsync: vi.fn() }),
	useUpdateNote: () => ({ mutateAsync: vi.fn() }),
	useDeleteNote: () => ({ mutateAsync: vi.fn() }),
}));

describe("RightPaneDetail - SWRBoundary Key Isolation", () => {
	it("bypasses skeleton immediately (0ms) when note with content is selected", () => {
		const noteWithContent = {
			id: "note-cached-1",
			created_at: "2026-07-28T00:00:00Z",
			updated_at: "2026-07-28T00:00:00Z",
			content: "Cached Note Content Here",
			note_type: "info",
			scope: "inbox",
			url_pattern: "",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
		} as Note;

		render(<RightPaneDetail note={noteWithContent} />);

		// 0ms でスケルトンが出ずに即座に本文が表示されること
		expect(screen.queryByTestId("detail-skeleton")).not.toBeInTheDocument();
		expect(screen.getByText("Cached Note Content Here")).toBeInTheDocument();
	});

	it("renders detailed aligned skeleton when isLoading is true even without note", () => {
		render(<RightPaneDetail isLoading={true} />);

		const skeleton = screen.getByTestId("detail-skeleton");
		expect(skeleton).toBeInTheDocument();
		// 本文エリアの min-h-50 が骨格として確保されていること
		expect(skeleton.querySelector(".min-h-50")).toBeInTheDocument();
	});

	it("renders aligned skeleton when switching to a note with undefined content", () => {
		const partialNote = {
			id: "note-uncached-2",
			created_at: "2026-07-28T00:00:00Z",
			updated_at: "2026-07-28T00:00:00Z",
			content: undefined as unknown as string,
			note_type: "info",
			scope: "inbox",
			url_pattern: "",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
		} as Note;

		render(<RightPaneDetail note={partialNote} />);

		const skeleton = screen.getByTestId("detail-skeleton");
		expect(skeleton).toBeInTheDocument();
		expect(skeleton.querySelector(".min-h-50")).toBeInTheDocument();
	});
});

describe("RightPaneDetail - SWRBoundary with isDataReady", () => {
	it("renders content immediately (0ms) when note.content is cached and defined", () => {
		const cachedNote = {
			id: "cached-note-1",
			created_at: "2026-07-28T00:00:00Z",
			updated_at: "2026-07-28T00:00:00Z",
			content: "Instant Cached Body",
			note_type: "info",
			scope: "inbox",
			url_pattern: "",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
		} as Note;

		render(<RightPaneDetail note={cachedNote} />);

		expect(screen.queryByTestId("detail-skeleton")).not.toBeInTheDocument();
		expect(screen.getByText("Instant Cached Body")).toBeInTheDocument();
	});
});
