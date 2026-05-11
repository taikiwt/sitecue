import type { Session } from "@supabase/supabase-js";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { supabase } from "../supabaseClient";
import { useNotes } from "./useNotes";

// Supabaseのモック
vi.mock("../supabaseClient", () => ({
	supabase: {
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		or: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
	},
}));

describe("useNotes hook (Hybrid Fetching)", () => {
	const mockSession = { user: { id: "user-1" } } as unknown as Session;
	const mockUrl = "https://example.com/page";

	it("初回フェッチ（fetchNotes）では、contentが含まれていないこと (Slim Fetching)", async () => {
		const mockSlimNotes = [
			{ id: "1", url_pattern: "example.com", scope: "domain", tags: ["test"] },
		];

		// モックの挙動設定: 初回フェッチ
		vi.mocked(supabase.from).mockReturnValue({
			select: vi.fn().mockImplementation((query) => {
				// content が含まれていないことを期待
				if (query.includes("content")) {
					return { or: vi.fn().mockResolvedValue({ data: [], error: null }) };
				}
				return {
					or: vi.fn().mockReturnValue({
						order: vi.fn().mockReturnValue({
							order: vi
								.fn()
								.mockResolvedValue({ data: mockSlimNotes, error: null }),
						}),
					}),
				};
			}),
		});

		const { result } = renderHook(() =>
			useNotes(mockSession, mockUrl, vi.fn(), "domain"),
		);

		await waitFor(() => {
			expect(result.current.notes.length).toBe(1);
		});

		expect(result.current.notes[0].content).toBeUndefined();
	});

	it("fetchNotes完了後、自動的にhydrateContentが走り、contentがマージされること", async () => {
		const mockSlimNotes = [
			{
				id: "note-1",
				url_pattern: "example.com",
				scope: "domain",
				tags: ["test"],
			},
		];
		const mockHydratedData = [{ id: "note-1", content: "Hydrated Content" }];

		// モックの挙動設定: SlimフェッチとHydrationフェッチ
		vi.mocked(supabase.from).mockImplementation(() => ({
			select: vi.fn().mockImplementation((query) => {
				if (query === "id, content") {
					// Hydrationフェッチ
					return {
						or: vi
							.fn()
							.mockResolvedValue({ data: mockHydratedData, error: null }),
					};
				}
				// Slimフェッチ
				return {
					or: vi.fn().mockReturnValue({
						order: vi.fn().mockReturnValue({
							order: vi
								.fn()
								.mockResolvedValue({ data: mockSlimNotes, error: null }),
						}),
					}),
				};
			}),
		}));

		const { result } = renderHook(() =>
			useNotes(mockSession, mockUrl, vi.fn(), "domain"),
		);

		// 最初はcontentがない
		await waitFor(() => {
			expect(result.current.notes.length).toBe(1);
		});

		// 少し待つとcontentが注入される
		await waitFor(
			() => {
				expect(result.current.notes[0].content).toBe("Hydrated Content");
			},
			{ timeout: 2000 },
		);
	});

	it("Inbox閲覧中にURLが変化しても、再フェッチ（supabase.from呼び出し）が走らないこと", async () => {
		const mockInboxNotes = [
			{ id: "inbox-1", scope: "inbox", content: "Inbox Note" },
		];

		// Supabaseモックの初期設定
		vi.mocked(supabase.from).mockImplementation(() => ({
			select: vi.fn().mockImplementation(() => ({
				or: vi.fn().mockReturnValue({
					order: vi.fn().mockReturnValue({
						order: vi
							.fn()
							.mockResolvedValue({ data: mockInboxNotes, error: null }),
					}),
				}),
			})),
		}));

		const { result, rerender } = renderHook(
			({ url, scope }) => useNotes(mockSession, url, vi.fn(), scope),
			{
				initialProps: {
					url: mockUrl,
					scope: "inbox" as "exact" | "domain" | "inbox",
				},
			},
		);

		// 初回ロード待ち
		await waitFor(() => {
			expect(result.current.notes.length).toBe(1);
		});

		// from の呼び出し回数をリセット
		vi.clearAllMocks();

		// URLのみを変更して再レンダリング
		rerender({ url: "https://another-page.com", scope: "inbox" as const });

		// 少し待っても supabase.from が呼ばれていないことを確認
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(supabase.from).not.toHaveBeenCalled();

		// 逆に、スコープが domain に変わった場合はフェッチが走るはず
		rerender({ url: "https://another-page.com", scope: "domain" as const });
		await waitFor(() => {
			expect(supabase.from).toHaveBeenCalledWith("sitecue_notes");
		});
	});
});
