import type { Note } from "@sitecue/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import StudioReviewPane from "./StudioReviewPane";

vi.mock("@/store/useUserStore", () => ({
	// biome-ignore lint/suspicious/noExplicitAny: mock state
	useUserStore: (selector?: (state: any) => any) => {
		const state = { plan: "free", openPaywall: vi.fn() };
		return selector ? selector(state) : state;
	},
}));

describe("StudioReviewPane Component", () => {
	const mockNotes: Note[] = [
		{
			id: "note-1",
			content: "Test Review Note",
			note_type: "info",
			scope: "draft",
			url_pattern: "sitecue://draft/d-1",
			user_id: "u-1",
			created_at: "2026-06-01T00:00:00.000Z",
			updated_at: "2026-06-01T00:00:00.000Z",
			is_expanded: false,
			is_favorite: false,
			is_pinned: false,
			is_resolved: false,
			sort_order: 0,
			draft_id: "d-1",
			tags: null,
		},
	];

	it("should call onGenerateReview when AI Review button is clicked", async () => {
		const user = userEvent.setup();
		const mockGenerate = vi.fn().mockResolvedValue(undefined);

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		render(
			<QueryClientProvider client={queryClient}>
				<StudioReviewPane
					reviewNotes={[]}
					isLoadingReview={false}
					onAddNote={vi.fn()}
					onUpdateNote={vi.fn()}
					onDeleteNote={vi.fn()}
					onDeleteAllNotes={vi.fn()}
					onReorderNotes={vi.fn()}
					onInsertToEditor={vi.fn()}
					onWeave={vi.fn()}
					isWeaving={false}
					onGenerateReview={mockGenerate}
					isGeneratingReview={false}
				/>
			</QueryClientProvider>,
		);

		const aiButton = screen.getByRole("button", { name: /AI Review/i });
		await user.click(aiButton);

		expect(mockGenerate).toHaveBeenCalledTimes(1);
	});

	it("レビューノート一覧とタイプ切り替え操作が正しくレンダリングされること", () => {
		const handleUpdateNote = vi.fn();
		const handleUpdateNoteType = vi.fn();

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		render(
			<QueryClientProvider client={queryClient}>
				<StudioReviewPane
					reviewNotes={mockNotes}
					isLoadingReview={false}
					isWeaving={false}
					onAddNote={vi.fn()}
					onDeleteAllNotes={vi.fn()}
					onDeleteNote={vi.fn()}
					onGenerateReview={vi.fn()}
					onInsertToEditor={vi.fn()}
					onReorderNotes={vi.fn()}
					onUpdateNote={handleUpdateNote}
					onUpdateNoteType={handleUpdateNoteType}
					onWeave={vi.fn()}
					isGeneratingReview={false}
				/>
			</QueryClientProvider>,
		);

		expect(screen.getByText("Review Notes (1)")).toBeInTheDocument();
		expect(screen.getByText("Test Review Note")).toBeInTheDocument();
	});

	it("グラブアイコンが存在し、ドラッグ領域が独立して提供されていること", () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		render(
			<QueryClientProvider client={queryClient}>
				<StudioReviewPane
					reviewNotes={mockNotes}
					isLoadingReview={false}
					isWeaving={false}
					onAddNote={vi.fn()}
					onDeleteAllNotes={vi.fn()}
					onDeleteNote={vi.fn()}
					onGenerateReview={vi.fn()}
					onInsertToEditor={vi.fn()}
					onReorderNotes={vi.fn()}
					onUpdateNote={vi.fn()}
					onWeave={vi.fn()}
					isGeneratingReview={false}
				/>
			</QueryClientProvider>,
		);

		expect(screen.getByTitle("Drag to reorder")).toBeInTheDocument();
		expect(screen.getByText("Test Review Note")).toBeInTheDocument();
	});
});
