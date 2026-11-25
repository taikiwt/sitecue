import type { Draft, Note } from "@sitecue/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrashContainer } from "./TrashContainer";

const mockRestoreMutateAsync = vi.fn().mockResolvedValue({});
const mockPermanentlyDeleteMutateAsync = vi.fn().mockResolvedValue("trash-1");
const mockEmptyTrashMutateAsync = vi.fn().mockResolvedValue(undefined);

const mockRestoreDraftMutateAsync = vi.fn().mockResolvedValue({});
const mockPermanentlyDeleteDraftMutateAsync = vi
	.fn()
	.mockResolvedValue("draft-trash-1");
const mockEmptyTrashDraftsMutateAsync = vi.fn().mockResolvedValue(undefined);

let mockTrashNotes: Note[] = [];
let mockTrashDrafts: Draft[] = [];

vi.mock("@/hooks/useNotesQuery", () => ({
	TRASH_NOTES_QUERY_KEY: ["trash-notes"],
	useFetchTrashNotes: () => ({
		data: mockTrashNotes,
		isLoading: false,
	}),
	useRestoreNote: () => ({
		mutateAsync: mockRestoreMutateAsync,
		isPending: false,
	}),
	usePermanentlyDeleteNote: () => ({
		mutateAsync: mockPermanentlyDeleteMutateAsync,
		isPending: false,
	}),
	useEmptyTrashNotes: () => ({
		mutateAsync: mockEmptyTrashMutateAsync,
		isPending: false,
	}),
}));

vi.mock("@/hooks/useDraftsQuery", () => ({
	TRASH_DRAFTS_QUERY_KEY: ["trash-drafts"],
	useFetchTrashDrafts: () => ({
		data: mockTrashDrafts,
		isLoading: false,
	}),
	useRestoreDraft: () => ({
		mutateAsync: mockRestoreDraftMutateAsync,
		isPending: false,
	}),
	usePermanentlyDeleteDraft: () => ({
		mutateAsync: mockPermanentlyDeleteDraftMutateAsync,
		isPending: false,
	}),
	useEmptyTrashDrafts: () => ({
		mutateAsync: mockEmptyTrashDraftsMutateAsync,
		isPending: false,
	}),
}));

vi.mock("@/store/useUserStore", () => ({
	useUserStore: () => ({
		plan: "free",
		openPaywall: vi.fn(),
	}),
}));

function renderTrash() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<TrashContainer />
		</QueryClientProvider>,
	);
}

describe("TrashContainer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const twoDaysAgo = new Date(
			Date.now() - 2 * 24 * 60 * 60 * 1000,
		).toISOString();
		const oneDayAgo = new Date(
			Date.now() - 1 * 24 * 60 * 60 * 1000,
		).toISOString();

		mockTrashNotes = [
			{
				id: "trash-1",
				user_id: "u-1",
				url_pattern: "example.com/article",
				content: "Deleted note body",
				note_type: "info",
				scope: "exact",
				is_resolved: false,
				is_pinned: false,
				is_favorite: false,
				is_expanded: false,
				sort_order: 0,
				created_at: twoDaysAgo,
				updated_at: twoDaysAgo,
				deleted_at: twoDaysAgo,
				draft_id: null,
				tags: [],
			},
		];

		mockTrashDrafts = [
			{
				id: "draft-trash-1",
				user_id: "u-1",
				title: "Deleted Draft Title",
				content: "Deleted draft body",
				tags: [],
				metadata: null,
				template_id: null,
				created_at: oneDayAgo,
				updated_at: oneDayAgo,
				deleted_at: oneDayAgo,
			},
		];
	});

	it("ゴミ箱内のノートとドラフトの両方を描画し、フィルタ切替ができること", async () => {
		renderTrash();

		expect(screen.getByText("Trash")).toBeInTheDocument();
		expect(screen.getByText("Deleted note body")).toBeInTheDocument();
		expect(screen.getByText("Deleted Draft Title")).toBeInTheDocument();
		expect(screen.getByText("Deleted draft body")).toBeInTheDocument();
		expect(screen.getByText("DRAFT")).toBeInTheDocument();

		// Notes フィルタ
		fireEvent.click(screen.getByRole("button", { name: "Notes" }));
		expect(screen.getByText("Deleted note body")).toBeInTheDocument();
		expect(screen.queryByText("Deleted Draft Title")).not.toBeInTheDocument();

		// Drafts フィルタ
		fireEvent.click(screen.getByRole("button", { name: "Drafts" }));
		expect(screen.queryByText("Deleted note body")).not.toBeInTheDocument();
		expect(screen.getByText("Deleted Draft Title")).toBeInTheDocument();

		// All フィルタ
		fireEvent.click(screen.getByRole("button", { name: "All" }));
		expect(screen.getByText("Deleted note body")).toBeInTheDocument();
		expect(screen.getByText("Deleted Draft Title")).toBeInTheDocument();
	});

	it("ドラフトの復元ボタンで useRestoreDraft が呼ばれること", async () => {
		renderTrash();

		fireEvent.click(screen.getByRole("button", { name: "Drafts" }));
		const restoreBtn = screen.getByRole("button", { name: /Restore/i });
		fireEvent.click(restoreBtn);

		await waitFor(() => {
			expect(mockRestoreDraftMutateAsync).toHaveBeenCalledWith("draft-trash-1");
		});
	});

	it("ドラフトの Delete Forever 確認後に完全削除が実行されること", async () => {
		renderTrash();

		fireEvent.click(screen.getByRole("button", { name: "Drafts" }));
		const deleteForeverBtn = screen.getByRole("button", {
			name: /Delete Forever/i,
		});
		fireEvent.click(deleteForeverBtn);

		const confirmBtn = await screen.findByRole("button", {
			name: /^Delete Forever$/i,
		});
		fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(mockPermanentlyDeleteDraftMutateAsync).toHaveBeenCalledWith(
				"draft-trash-1",
			);
		});
	});

	it("Empty Trash 確認後にノートとドラフトの双方が空になること", async () => {
		renderTrash();

		const emptyTrashBtn = screen.getByRole("button", { name: /Empty Trash/i });
		fireEvent.click(emptyTrashBtn);

		const confirmBtn = await screen.findByRole("button", {
			name: /^Empty Trash$/i,
		});
		fireEvent.click(confirmBtn);

		await waitFor(() => {
			expect(mockEmptyTrashMutateAsync).toHaveBeenCalledTimes(1);
			expect(mockEmptyTrashDraftsMutateAsync).toHaveBeenCalledTimes(1);
		});
	});
});
