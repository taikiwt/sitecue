import type { Session } from "@supabase/supabase-js";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useNotes } from "./useNotes";

// @sitecue/sharedのモック
vi.mock("@sitecue/shared", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@sitecue/shared")>();
	return {
		...actual,
		fetchExtensionNoteMetadatas: vi.fn(),
		fetchExtensionNoteContents: vi.fn(),
		updateNoteEntity: vi.fn(),
		deleteNoteEntity: vi.fn(),
		createNoteEntity: vi.fn(),
	};
});

import {
	fetchExtensionNoteContents,
	fetchExtensionNoteMetadatas,
	type Note,
} from "@sitecue/shared";

describe("useNotes hook (Hybrid Fetching)", () => {
	const mockSession = { user: { id: "user-1" } } as unknown as Session;
	const mockUrl = "https://example.com/page";

	it("初回フェッチ（fetchNotes）では、contentが含まれていないこと (Slim Fetching)", async () => {
		const mockSlimNotes = [
			{ id: "1", url_pattern: "example.com", scope: "domain", tags: ["test"] },
		];

		// モックの挙動設定: 初回フェッチ
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockSlimNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue([]);

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
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockSlimNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue(mockHydratedData);

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
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockInboxNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue([]);

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

		// 少し待っても fetchExtensionNoteMetadatas が呼ばれていないことを確認
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(fetchExtensionNoteMetadatas).not.toHaveBeenCalled();

		// 逆に、スコープが domain に変わった場合はフェッチが走るはず
		rerender({ url: "https://another-page.com", scope: "domain" as const });
		await waitFor(() => {
			expect(fetchExtensionNoteMetadatas).toHaveBeenCalled();
		});
	});
});

describe("useNotes - Silent Refetching", () => {
	const mockSession = { user: { id: "user-1" } } as unknown as Session;
	const mockUrl = "https://example.com/page";

	it("メモリ上にデータがある場合、再フェッチ時に loading が true にならないこと", async () => {
		const mockNotes = [{ id: "1", content: "existing" }];
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockNotes as unknown as Note[],
		);

		const { result, rerender } = renderHook(
			({ scope }) => useNotes(mockSession, mockUrl, vi.fn(), scope),
			{ initialProps: { scope: "exact" as const } },
		);

		// 初回フェッチ待ち
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.notes.length).toBe(1);

		// 一旦モックのカウントをクリア
		vi.clearAllMocks();

		// スコープを変えて再フェッチをトリガー
		rerender({ scope: "domain" as const });

		// Silent Refetching: loading は false のままのはず
		expect(result.current.loading).toBe(false);

		await waitFor(() => {
			expect(fetchExtensionNoteMetadatas).toHaveBeenCalledTimes(1);
		});
	});

	it("再フェッチ時に既存の content が新しいメタデータにマージされて保護されること", async () => {
		// 初期状態のモック（メタデータのみ）
		const initialNotes = [{ id: "1", content: undefined }];
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValueOnce(
			initialNotes as unknown as Note[],
		);

		const { result, rerender } = renderHook(
			({ scope }) => useNotes(mockSession, mockUrl, vi.fn(), scope),
			{ initialProps: { scope: "exact" as const } },
		);

		// 初回フェッチ完了を待つ
		await waitFor(() => expect(result.current.loading).toBe(false));

		// 一旦モックのカウントをクリア
		vi.clearAllMocks();

		// ユーザーがテキストを入力したと仮定して、直接 State を更新（楽観的UIの模倣）
		// ※実際はhydrateContentで埋まるかaddNote等で埋まる想定
		result.current.notes[0].content = "User typed this text";

		// 再フェッチを発生させるためのモック準備（DBからは content なしのメタデータが返ってくる）
		const newMetadatas = [{ id: "1", content: undefined, is_pinned: true }]; // ピン留めされたと仮定
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValueOnce(
			newMetadatas as unknown as Note[],
		);

		// スコープを変えて再フェッチをトリガー
		rerender({ scope: "domain" as const });

		await waitFor(() => {
			expect(fetchExtensionNoteMetadatas).toHaveBeenCalledTimes(1);
		});

		// 新しいメタデータ (is_pinned: true) が反映されつつ、既存の content は保護されていること
		expect(result.current.notes[0].is_pinned).toBe(true);
		expect(result.current.notes[0].content).toBe("User typed this text");
	});
});
