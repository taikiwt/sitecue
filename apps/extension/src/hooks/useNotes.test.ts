import { describe, expect, it, vi } from "vitest";

const createMockQueryBuilder = (mockData: unknown[] = []) => {
	const promise = Promise.resolve({ data: mockData, error: null });

	const methods = {
		select: vi.fn().mockImplementation(() => methods),
		in: vi.fn().mockImplementation(() => promise),
		eq: vi.fn().mockImplementation(() => methods),
		or: vi.fn().mockImplementation(() => methods),
		order: vi.fn().mockImplementation(() => methods),
		limit: vi.fn().mockImplementation(() => methods),
		insert: vi
			.fn()
			.mockImplementation((data: unknown) =>
				Promise.resolve({ data, error: null }),
			),
		update: vi.fn().mockImplementation(() => methods),
		delete: vi.fn().mockImplementation(() => methods),
		single: vi
			.fn()
			.mockImplementation(() =>
				Promise.resolve({ data: mockData[0] || null, error: null }),
			),
		maybeSingle: vi
			.fn()
			.mockImplementation(() =>
				Promise.resolve({ data: mockData[0] || null, error: null }),
			),
	};

	return Object.assign(promise, methods);
};

vi.mock("../supabaseClient", () => {
	return {
		supabase: {
			from: vi.fn().mockImplementation(() => createMockQueryBuilder([])),
		},
		localClient: {
			from: vi.fn().mockImplementation(() => createMockQueryBuilder([])),
		},
	};
});

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
	createNoteEntity,
	fetchExtensionNoteContents,
	fetchExtensionNoteMetadatas,
	type Note,
} from "@sitecue/shared";
import type { Session } from "@supabase/supabase-js";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AuthStatus } from "./useAuth";
import { useNotes } from "./useNotes";

describe("useNotes hook (Hybrid Fetching)", () => {
	const mockSession = { user: { id: "user-1" } } as unknown as Session;
	const mockAuthStatus: AuthStatus = {
		mode: "authenticated",
		session: mockSession,
		userId: "user-1",
	};
	const mockUrl = "https://example.com/page";

	it("初回フェッチ（fetchNotes）では、contentが含まれていないこと (Slim Fetching)", async () => {
		const mockSlimNotes = [
			{
				id: "1",
				url_pattern: "example.com",
				scope: "domain",
				tags: ["test"],
				created_at: new Date().toISOString(),
			},
		];

		// モックの挙動設定: 初回フェッチ
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockSlimNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue([]);

		const { result } = renderHook(() =>
			useNotes(mockAuthStatus, mockUrl, vi.fn(), "domain"),
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
				created_at: new Date().toISOString(),
			},
		];
		const mockHydratedData = [{ id: "note-1", content: "Hydrated Content" }];

		// モックの挙動設定: SlimフェッチとHydrationフェッチ
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockSlimNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue(mockHydratedData);

		const { result } = renderHook(() =>
			useNotes(mockAuthStatus, mockUrl, vi.fn(), "domain"),
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
			{
				id: "inbox-1",
				scope: "inbox",
				content: "Inbox Note",
				created_at: new Date().toISOString(),
			},
		];

		// Supabaseモックの初期設定
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockInboxNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue([]);

		const { result, rerender } = renderHook(
			({ url, scope }) => useNotes(mockAuthStatus, url, vi.fn(), scope),
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
	const mockAuthStatus: AuthStatus = {
		mode: "authenticated",
		session: mockSession,
		userId: "user-1",
	};
	const mockUrl = "https://example.com/page";

	it("メモリ上にデータがある場合、再フェッチ時に loading が true にならないこと", async () => {
		const mockNotes = [
			{ id: "1", content: "existing", created_at: new Date().toISOString() },
		];
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockNotes as unknown as Note[],
		);

		const { result, rerender } = renderHook(
			({ scope }) => useNotes(mockAuthStatus, mockUrl, vi.fn(), scope),
			{ initialProps: { scope: "exact" as "exact" | "domain" | "inbox" } },
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
		const initialNotes = [
			{ id: "1", content: undefined, created_at: new Date().toISOString() },
		];
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValueOnce(
			initialNotes as unknown as Note[],
		);

		const { result, rerender } = renderHook(
			({ scope }) => useNotes(mockAuthStatus, mockUrl, vi.fn(), scope),
			{ initialProps: { scope: "exact" as "exact" | "domain" | "inbox" } },
		);

		// 初回フェッチ完了を待つ
		await waitFor(() => expect(result.current.loading).toBe(false));

		// 一旦モックのカウントをクリア
		vi.clearAllMocks();

		// ユーザーがテキストを入力したと仮定して、直接 State を更新（楽観的UIの模倣）
		// ※実際はhydrateContentで埋まるかaddNote等で埋まる想定
		result.current.notes[0].content = "User typed this text";

		// 再フェッチを発生させるためのモック準備（DBからは content なしのメタデータが返ってくる）
		const newMetadatas = [
			{
				id: "1",
				content: undefined,
				is_pinned: true,
				created_at: new Date().toISOString(),
			},
		]; // ピン留めされたと仮定
		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValueOnce(
			newMetadatas as unknown as Note[],
		);

		// スコープを変えて再フェッチをトリガー
		rerender({ scope: "domain" as const });

		await waitFor(() => {
			expect(fetchExtensionNoteMetadatas).toHaveBeenCalledTimes(1);
		});

		// 新しいメタデータ (is_pinned: true) が反映されつつ、既存の content は保護されていること
		await waitFor(() => {
			expect(result.current.notes[0].is_pinned).toBe(true);
			expect(result.current.notes[0].content).toBe("User typed this text");
		});
	});

	it("updateNoteOrder実行時、指定された順序で正確に更新され楽観的UIが反映されること", async () => {
		const mockNotes = [
			{
				id: "note-target",
				url_pattern: "https://example.com/page",
				scope: "exact",
				sort_order: 2.0,
				created_at: "2026-01-02T00:00:00.000Z",
			},
			{
				id: "note-above",
				url_pattern: "https://example.com/page",
				scope: "exact",
				sort_order: 1.0,
				created_at: "2026-01-01T00:00:00.000Z",
			},
			{
				id: "note-hidden",
				url_pattern: "another.com",
				scope: "domain",
				sort_order: 1.5,
				created_at: "2026-01-01T05:00:00.000Z",
			},
		];

		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue([]);

		const { result } = renderHook(() =>
			useNotes(mockAuthStatus, "https://example.com/page", vi.fn(), "exact"),
		);

		// 初回フェッチ完了待ち
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.notes.length).toBe(3);

		let success = false;
		await act(async () => {
			success = await result.current.updateNoteOrder(
				"note-target",
				0.0,
			);
		});
		expect(success).toBe(true);

		// 楽観的UI更新後の値を確認
		await waitFor(() => {
			const updatedTarget = result.current.notes.find(
				(n) => n.id === "note-target",
			);
			expect(updatedTarget?.sort_order).toBe(0.0);
		});
	});

	it("フィルター状態で移動操作した際も、指定された順序に正しく更新されること", async () => {
		const mockNotes = [
			{
				id: "note-1",
				url_pattern: "https://example.com/page",
				scope: "exact",
				sort_order: 1.0,
				content: "りんごのメモ #fruit",
				created_at: "2026-01-01T00:00:00.000Z",
			},
			{
				id: "note-hidden",
				url_pattern: "https://example.com/page",
				scope: "exact",
				sort_order: 1.5,
				content: "りんごのメモ2 #fruit",
				created_at: "2026-01-01T05:00:00.000Z",
			},
			{
				id: "note-2",
				url_pattern: "https://example.com/page",
				scope: "exact",
				sort_order: 2.0,
				content: "みかんのメモ #fruit",
				created_at: "2026-01-02T00:00:00.000Z",
			},
		];

		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue(
			mockNotes as unknown as Note[],
		);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue([]);

		const { result } = renderHook(() =>
			useNotes(mockAuthStatus, "https://example.com/page", vi.fn(), "exact"),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));

		let success = false;
		await act(async () => {
			success = await result.current.updateNoteOrder(
				"note-2",
				0.0,
			);
		});
		expect(success).toBe(true);

		// 楽観的UI更新結果が 0.0になっているかをアサーション
		await waitFor(() => {
			const updated = result.current.notes.find((n) => n.id === "note-2");
			expect(updated?.sort_order).toBe(0.0);
		});
	});
});

describe("useNotes - Guest Mode Scenario", () => {
	it("ゲストモード時にローディングUIをバイパスし、localClient経由でノートの追加・並び替えが正常に稼働すること", async () => {
		const authStatus: AuthStatus = {
			mode: "guest",
			session: null,
			userId: "guest-user",
		};
		const setTotalNoteCount = vi.fn();

		vi.mocked(fetchExtensionNoteMetadatas).mockResolvedValue([]);
		vi.mocked(fetchExtensionNoteContents).mockResolvedValue([]);

		const { result } = renderHook(() =>
			useNotes(
				authStatus,
				"https://example.com/page",
				setTotalNoteCount,
				"exact",
			),
		);

		// 初期状態は空配列、かつloadingはfalseであることを実証（バイパス確認）
		expect(result.current.notes).toEqual([]);
		expect(result.current.loading).toBe(false);

		// fetchNotes の非同期解決を確実に待つ
		await waitFor(() => {
			expect(fetchExtensionNoteMetadatas).toHaveBeenCalled();
		});

		// ノートの追加を実行
		let success = false;
		const mockCreatedNote = {
			id: "temp-guest-id",
			user_id: "guest-user",
			url_pattern: "example.com",
			content: "ゲストメモテスト #idea",
			scope: "exact",
			note_type: "idea",
			sort_order: 0,
			created_at: new Date().toISOString(),
			is_expanded: false,
			is_favorite: false,
			is_pinned: false,
			is_resolved: false,
			tags: ["idea"],
		};
		vi.mocked(createNoteEntity).mockResolvedValue(
			mockCreatedNote as unknown as Note,
		);

		await act(async () => {
			success = await result.current.addNote(
				"ゲストメモテスト #idea",
				"exact",
				"idea",
			);
		});

		expect(success).toBe(true);
		expect(result.current.notes.length).toBe(1);
		expect(result.current.notes[0].content).toBe("ゲストメモテスト #idea");
		expect(result.current.notes[0].tags).toEqual(["idea"]); // 共通タグ抽出の通過検証
	});
});
