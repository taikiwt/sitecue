/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Note } from "@/app/(dashboard)/notes/types";
import { createClient } from "@/utils/supabase/client";
import { DASHBOARD_QUERY_KEY } from "./useDashboardQuery";
import {
	NOTES_QUERY_KEY,
	useCreateNote,
	useDeleteNote,
	useFetchNoteContents,
	useFetchNotes,
	useSearchNotes,
	useUpdateNote,
} from "./useNotesQuery";

// Supabase client のモック
vi.mock("@/utils/supabase/client", () => ({
	createClient: vi.fn(),
}));

vi.mock("@sitecue/shared", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@sitecue/shared")>();
	return {
		...actual,
		createNoteEntity: vi.fn().mockResolvedValue({
			id: "note-new",
			user_id: "user-1",
			url_pattern: "inbox",
			scope: "inbox",
			note_type: "info",
			content: "New Note Content For Test",
			is_pinned: false,
			is_resolved: false,
			is_favorite: false,
			is_expanded: false,
			sort_order: 0,
			created_at: "2026-07-28T00:00:00Z",
			updated_at: "2026-07-28T00:00:00Z",
			draft_id: null,
			tags: [],
		}),
		updateNoteEntity: vi.fn().mockResolvedValue({
			id: "note-1",
			user_id: "user-1",
			url_pattern: "",
			scope: "inbox",
			note_type: "info",
			content: "Updated Content For Home Test",
			is_pinned: false,
			is_resolved: false,
			is_favorite: false,
			is_expanded: false,
			sort_order: 0,
			created_at: "2026-07-28T00:00:00Z",
			updated_at: "2026-07-28T00:00:00Z",
			draft_id: null,
			tags: [],
		}),
		deleteNoteEntity: vi.fn().mockResolvedValue("note-1"),
		fetchNoteMetadatas: vi.fn().mockResolvedValue([
			{
				id: "note-1",
				user_id: "user-1",
				url_pattern: "",
				scope: "inbox",
				note_type: "info",
				is_pinned: false,
				is_resolved: false,
				is_favorite: false,
				is_expanded: false,
				sort_order: 0,
				created_at: "2026-07-28T00:00:00Z",
				updated_at: "2026-07-28T00:00:00Z",
				draft_id: null,
				tags: [],
			},
		]),
	};
});

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

describe("useSearchNotes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("qが指定された場合、RPC search_notes が正しく呼び出されること", async () => {
		const queryClient = createTestQueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const mockNotes = [
			{ id: "1", content: "Test note", url_pattern: "example.com" },
		];

		// Supabase RPC のモック
		const mockSupabase = {
			rpc: vi.fn().mockImplementation((name) => ({
				order: vi.fn().mockReturnThis(),
				// biome-ignore lint/suspicious/noThenProperty: Supabase thenable mock
				then: vi.fn().mockImplementation((callback) =>
					callback({
						data: name === "search_notes" ? mockNotes : [],
						error: null,
					}),
				),
			})),
		};

		vi.mocked(createClient).mockReturnValue(
			mockSupabase as unknown as ReturnType<typeof createClient>,
		);

		const { result } = renderHook(() => useSearchNotes("Test"), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ notes: mockNotes, drafts: [] });
		expect(mockSupabase.rpc).toHaveBeenCalledWith("search_notes", {
			search_query: "Test",
		});
	});

	test("tagsのみが指定された場合、RPCではなく通常のテーブルクエリが実行されること", async () => {
		const queryClient = createTestQueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			contains: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			// biome-ignore lint/suspicious/noThenProperty: Supabase thenable mock
			then: vi.fn().mockImplementation((callback) =>
				callback({
					data: [],
					error: null,
				}),
			),
		};

		vi.mocked(createClient).mockReturnValue(
			mockSupabase as unknown as ReturnType<typeof createClient>,
		);

		const { result } = renderHook(() => useSearchNotes(undefined, "tag1"), {
			wrapper,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mockSupabase.from).toHaveBeenCalledWith("sitecue_notes");
		expect(mockSupabase.contains).toHaveBeenCalledWith("tags", ["tag1"]);
	});
});

describe("useFetchNoteContents", () => {
	const mockNoteId = "mock-note-id";
	const mockContent = "フェッチされた本文";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("取得した本文データが関連する複数のキャッシュ(通常一覧、検索結果等)に一括同期されること", async () => {
		const queryClient = createTestQueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		// Supabase のモック実装
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			in: vi.fn().mockResolvedValue({
				data: [{ id: mockNoteId, content: mockContent }],
				error: null,
			}),
		};
		vi.mocked(createClient).mockReturnValue(
			mockSupabase as unknown as ReturnType<typeof createClient>,
		);

		// テスト前のモックデータ: 本文(content)が空の状態のノートを、2つの異なるキャッシュキーにセット
		const initialNote = { id: mockNoteId, content: "" } as Note;

		queryClient.setQueryData(NOTES_QUERY_KEY, [initialNote]);
		queryClient.setQueryData(
			[...NOTES_QUERY_KEY, "search", "keyword", undefined],
			[initialNote],
		);

		const { result } = renderHook(() => useFetchNoteContents(), { wrapper });

		// Mutation 実行
		result.current.mutate([mockNoteId]);

		// 両方のキャッシュキーの値が更新されていることを検証
		await waitFor(() => {
			const mainCache = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY);
			const searchCache = queryClient.getQueryData<Note[]>([
				...NOTES_QUERY_KEY,
				"search",
				"keyword",
				undefined,
			]);

			expect(mainCache?.[0].content).toBe(mockContent);
			expect(searchCache?.[0].content).toBe(mockContent);
		});
	});

	test("merges fetched note contents into ['notes'] query cache transparently", async () => {
		const queryClient = createTestQueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		// キャッシュ初期状態（Slimデータ: content は undefined）
		const initialNotes: Note[] = [
			{
				id: "note-1",
				user_id: "user-1",
				content: undefined as unknown as string,
				created_at: "2026-07-28T00:00:00Z",
				updated_at: "2026-07-28T00:00:00Z",
				note_type: "info",
				scope: "inbox",
				url_pattern: "",
				is_resolved: false,
				is_pinned: false,
				is_favorite: false,
				is_expanded: false,
				sort_order: 0,
				draft_id: null,
				tags: [],
			},
		];

		queryClient.setQueryData(["notes"], initialNotes);

		renderHook(() => useFetchNoteContents(), { wrapper });

		// 擬似的な本文取得実行
		await act(async () => {
			// note-1 の本文 "new note 7/28" をキャッシュへ反映
			queryClient.setQueriesData<Note[]>(
				{ queryKey: ["notes"] },
				(oldNotes) => {
					if (!oldNotes) return oldNotes;
					return oldNotes.map((n) =>
						n.id === "note-1" ? { ...n, content: "new note 7/28" } : n,
					);
				},
			);
		});

		// キャッシュから再取得された notes 配列上の note-1 に content が保持されていることを検証
		const cachedNotes = queryClient.getQueryData<Note[]>(["notes"]);
		expect(cachedNotes?.[0].content).toBe("new note 7/28");
	});
});

describe("useFetchNotes - Content Cache Preservation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("preserves existing content cache when refetching metadatas", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const mockSupabase = {
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: { user: { id: "user-1" } },
					error: null,
				}),
			},
		};
		vi.mocked(createClient).mockReturnValue(
			mockSupabase as unknown as ReturnType<typeof createClient>,
		);

		// 以前の閲覧で content ("new note 7/28") が保存されているキャッシュ状態
		queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, [
			{
				id: "note-1",
				user_id: "user-1",
				content: "new note 7/28",
				created_at: "2026-07-28T00:00:00Z",
				updated_at: "2026-07-28T00:00:00Z",
				note_type: "info",
				scope: "inbox",
				url_pattern: "",
				is_resolved: false,
				is_pinned: false,
				is_favorite: false,
				is_expanded: false,
				sort_order: 0,
				draft_id: null,
				tags: [],
			},
		]);

		const { result } = renderHook(() => useFetchNotes(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		// フェッチ後も既存の content ("new note 7/28") が失われず保持されていることを検証
		expect(result.current.data?.[0].content).toBe("new note 7/28");
	});
});

describe("useUpdateNote - Cache Invalidation Linkage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("invalidates all query caches matching NOTES_QUERY_KEY on success", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result } = renderHook(() => useUpdateNote(), { wrapper });

		await result.current.mutateAsync({
			id: "note-1",
			updates: { content: "Updated Content For Home Test" },
		});

		await waitFor(() => {
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: NOTES_QUERY_KEY });
		});
	});
});

describe("useDeleteNote - Cache Invalidation Linkage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("removes note from cached lists and invalidates all query caches matching NOTES_QUERY_KEY on success", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const initialNotes: Note[] = [
			{
				id: "note-1",
				user_id: "user-1",
				content: "To be deleted",
				created_at: "2026-07-28T00:00:00Z",
				updated_at: "2026-07-28T00:00:00Z",
				note_type: "info",
				scope: "inbox",
				url_pattern: "",
				is_resolved: false,
				is_pinned: false,
				is_favorite: false,
				is_expanded: false,
				sort_order: 0,
				draft_id: null,
				tags: [],
			},
		];

		queryClient.setQueryData(NOTES_QUERY_KEY, initialNotes);
		queryClient.setQueryData(
			[...NOTES_QUERY_KEY, "search", "test", undefined],
			{
				notes: initialNotes,
				drafts: [],
			},
		);

		const { result } = renderHook(() => useDeleteNote(), { wrapper });

		await result.current.mutateAsync("note-1");

		await waitFor(() => {
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: NOTES_QUERY_KEY });
			const cachedMain = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY);
			const cachedSearch = queryClient.getQueryData<{ notes: Note[] }>([
				...NOTES_QUERY_KEY,
				"search",
				"test",
				undefined,
			]);
			expect(cachedMain).toEqual([]);
			expect(cachedSearch?.notes).toEqual([]);
		});
	});
});

describe("useCreateNote - Cache Invalidation & Instant Insertion", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("inserts new note into cache immediately and invalidates NOTES and DASHBOARD queries", async () => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		vi.mocked(createClient).mockReturnValue({
			auth: {
				getUser: vi.fn().mockResolvedValue({
					data: { user: { id: "user-1" } },
					error: null,
				}),
			},
		} as unknown as ReturnType<typeof createClient>);

		const { result } = renderHook(() => useCreateNote(), { wrapper });

		await result.current.mutateAsync({
			content: "New Note Content For Test",
			scope: "inbox",
			note_type: "info",
			currentUrl: "inbox",
		});

		await waitFor(() => {
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: NOTES_QUERY_KEY });
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: DASHBOARD_QUERY_KEY,
			});
		});
	});
});
