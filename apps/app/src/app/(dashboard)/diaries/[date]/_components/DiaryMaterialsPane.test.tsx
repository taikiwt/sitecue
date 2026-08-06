import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DiaryMaterialsPane } from "./DiaryMaterialsPane";

vi.mock("@/utils/supabase/client", () => ({
	createClient: () => ({
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }),
		},
	}),
}));

vi.mock("@sitecue/shared", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@sitecue/shared")>();
	return {
		...actual,
		fetchNotesByDate: vi.fn().mockResolvedValue([
			{
				id: "note-1",
				content: "Test Diary Note Content",
				note_type: "info",
				created_at: "2026-08-06T10:00:00Z",
				updated_at: "2026-08-06T10:00:00Z",
				url_pattern: "example.com",
				user_id: "u-1",
				is_expanded: false,
				is_favorite: false,
				is_pinned: false,
				is_resolved: false,
				sort_order: 0,
				scope: "exact",
				draft_id: null,
			},
		]),
		fetchDraftsByDate: vi.fn().mockResolvedValue([]),
	};
});

describe("DiaryMaterialsPane Component", () => {
	it("ノートカードが表示され、Insert to Editor ボタンが存在しないこと", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		render(
			<QueryClientProvider client={queryClient}>
				<DiaryMaterialsPane date="2026-08-06" />
			</QueryClientProvider>,
		);

		expect(
			await screen.findByText("Test Diary Note Content"),
		).toBeInTheDocument();
		expect(screen.queryByTitle("Insert to Editor")).not.toBeInTheDocument();
	});
});
