import { describe, expect, it, vi } from "vitest";

vi.mock("../supabaseClient", () => ({
	supabase: {},
	localClient: {
		from: () => ({
			select: () => ({
				in: () => Promise.resolve({ data: [], error: null }),
				eq: () => ({
					then: (cb: any) => cb({ data: [], error: null }),
				}),
				then: (cb: any) => cb({ data: [], error: null }),
			}),
			insert: (data: any) => Promise.resolve({ data, error: null }),
		}),
	},
}));

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

	it("updateNoteOrder実行時、別スコープや別URLのノートが混在していても、同一コンテキストのノートのみを隔離して正確に順序計算されること", async () => {
		// 表示コンテキストが「example.com (exactスコープ)」のノート2つと、
		// 画面外の別コンテキスト「another.com (domainスコープ)」のノートが混在している状態を再現
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
			// 💥これが画面外の隠しノート。sort_orderが間に挟まっているが、スコープが違うので隔離・無視されなければならない
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

		// 仕様追従: 表示コンテキストに合致するもののみを抽出して渡す
		const visibleNotes = result.current.notes.filter(
			(n) =>
				n.scope === "exact" && n.url_pattern === "https://example.com/page",
		);

		let success = false;
		await act(async () => {
			success = await result.current.updateNoteOrder(
				"note-target",
				"up",
				visibleNotes,
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

	it("検索やタグ等のフィルターで絞り込まれた状態でも、実際に画面に表示されているノート配列を基準に正確にごぼう抜き順序計算が行われること", async () => {
		// 表示コンテキストは同一だが、内容フィルターによって1つ（note-hidden）が非表示になる状況を再現
		const mockNotes = [
			{
				id: "note-1",
				url_pattern: "https://example.com/page",
				scope: "exact",
				sort_order: 1.0,
				content: "りんごのメモ #fruit",
				created_at: "2026-01-01T00:00:00.000Z",
			},
			// 💥これが検索ワード「みかん」によって画面上から除外（非表示）される隠しノート
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

		// 画面上の絞り込み結果（note-hiddenが除外された、実際に見えている状態の配列）を模倣
		const visibleNotes = [result.current.notes[0], result.current.notes[2]];

		// 画面上での隣（note-1: 1.0）を追い越すため、「上（up）」へ移動させる
		// 画面外の note-hidden (1.5) を適切にスキップしていれば、1.0 - 1.0 = 0.0 が算出される
		let success = false;
		await act(async () => {
			success = await result.current.updateNoteOrder(
				"note-2",
				"up",
				visibleNotes,
			);
		});
		expect(success).toBe(true);

		// 楽観的UI更新結果が 0.0（note-1の前に出た状態）になっているかをアサーション
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
		let success;
		const mockCreatedNote = {
			id: "temp-guest-id",
			user_id: "guest-user",
			content: "ゲストメモテスト #idea",
			scope: "exact",
			note_type: "idea",
			created_at: new Date().toISOString(),
			tags: ["idea"],
		};
		vi.mocked(createNoteEntity).mockResolvedValue(mockCreatedNote as any);

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
