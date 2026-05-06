/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Note } from "@/app/(dashboard)/notes/types";
import { createClient } from "@/utils/supabase/client";
import {
	NOTES_QUERY_KEY,
	useFetchNoteContents,
	useSearchNotes,
} from "./useNotesQuery";

// Supabase client のモック
vi.mock("@/utils/supabase/client", () => ({
	createClient: vi.fn(),
}));

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
});
