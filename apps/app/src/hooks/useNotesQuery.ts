"use client";

import type { CreateNoteInput, NoteType, ViewScope } from "@sitecue/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Draft, Note } from "@/app/(dashboard)/notes/types";
import { createNoteEntity, updateNoteEntity } from "@/lib/dal/notes";
import { createClient } from "@/utils/supabase/client";

export const NOTES_QUERY_KEY = ["notes"];

export function useFetchNotes() {
	return useQuery({
		queryKey: NOTES_QUERY_KEY,
		staleTime: 5 * 60 * 1000, // 5分間はバックグラウンドフェッチによる上書きを防ぐ
		queryFn: async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			const { data, error } = await supabase
				.from("sitecue_notes")
				.select(
					"id, user_id, url_pattern, scope, note_type, is_pinned, is_resolved, is_favorite, is_expanded, sort_order, created_at, updated_at, draft_id, tags",
				)
				.eq("user_id", user.id)
				.order("is_pinned", { ascending: false })
				.order("sort_order", { ascending: true })
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data as Note[]) || [];
		},
	});
}

export function useCreateNote() {
	const queryClient = useQueryClient();

	return useMutation({
		// Mutationの引数を CreateNoteInput へ厳格化
		mutationFn: async (input: CreateNoteInput) => {
			const supabase = createClient();
			return await createNoteEntity(supabase, input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
		},
	});
}

export function useUpdateNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: {
				content?: string;
				note_type?: NoteType;
				scope?: ViewScope;
				currentUrl?: string;
				is_resolved?: boolean;
				is_pinned?: boolean;
				is_favorite?: boolean;
				is_expanded?: boolean;
			};
		}) => {
			const supabase = createClient();
			return await updateNoteEntity(supabase, id, updates);
		},
		onSuccess: (updatedNote) => {
			// プレフィックス一致でキャッシュを一括分配・更新する規約を順守
			queryClient.setQueriesData<Note[] | { notes: Note[]; drafts: unknown[] }>(
				{ queryKey: NOTES_QUERY_KEY },
				(old) => {
					if (!old) return old;
					if (Array.isArray(old)) {
						return old.map((note) =>
							note.id === updatedNote.id ? updatedNote : note,
						);
					}
					if ("notes" in old) {
						return {
							...old,
							notes: old.notes.map((note) =>
								note.id === updatedNote.id ? updatedNote : note,
							),
						};
					}
					return old;
				},
			);
		},
	});
}

export function useDeleteNote() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_notes")
				.delete()
				.eq("id", id);

			if (error) throw error;
			return id;
		},
		onSuccess: (deletedId) => {
			queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) => {
				if (!old) return old;
				return old.filter((note) => note.id !== deletedId);
			});
		},
	});
}

/**
 * Lazily fetch content for multiple notes and update the query cache.
 */
export function useFetchNoteContents() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (ids: string[]) => {
			if (ids.length === 0) return [];
			const supabase = createClient();

			const { data, error } = await supabase
				.from("sitecue_notes")
				.select("id, content")
				.in("id", ids);

			if (error) throw error;
			return data || [];
		},
		onSuccess: (contents) => {
			if (contents.length === 0) return;

			const contentMap = new Map(contents.map((n) => [n.id, n.content]));

			queryClient.setQueriesData<Note[] | { notes: Note[]; drafts: Draft[] }>(
				{ queryKey: NOTES_QUERY_KEY },
				(old) => {
					if (!old) return old;

					const updateNote = (n: Note): Note =>
						contentMap.has(n.id)
							? { ...n, content: contentMap.get(n.id) as string | undefined }
							: n;

					if (Array.isArray(old)) {
						return old.map(updateNote); // 通常リスト
					}
					if ("notes" in old) {
						return { ...old, notes: old.notes.map(updateNote) }; // 検索結果オブジェクト
					}
					return old;
				},
			);
		},
	});
}

export function useUpsertNotes() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (notes: Partial<Note>[]) => {
			if (notes.length === 0) return [];
			const supabase = createClient();
			const { data, error } = await supabase
				.from("sitecue_notes")
				.upsert(notes)
				.select();

			if (error) throw error;
			return data as Note[];
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
		},
	});
}

export function useDeleteNotes() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (ids: string[]) => {
			if (ids.length === 0) return [];
			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_notes")
				.delete()
				.in("id", ids);

			if (error) throw error;
			return ids;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
		},
	});
}

export function useSearchNotes(
	q?: string,
	tags?: string,
	options: { enabled?: boolean } = {},
) {
	return useQuery({
		queryKey: [...NOTES_QUERY_KEY, "search", q, tags],
		queryFn: async () => {
			if (!q && !tags) return { notes: [], drafts: [] };
			const supabase = createClient();

			let notesQuery = q
				? supabase.rpc("search_notes", { search_query: q })
				: supabase
						.from("sitecue_notes")
						.select(
							"id, user_id, url_pattern, scope, note_type, content, is_pinned, is_resolved, is_favorite, is_expanded, sort_order, created_at, updated_at, draft_id, tags",
						);

			if (tags) {
				const tagsArray = tags.split(",");
				notesQuery = notesQuery.contains("tags", tagsArray);
			}

			let draftsQuery = q
				? supabase.rpc("search_drafts", { search_query: q })
				: supabase.from("sitecue_drafts").select("*");

			if (tags) {
				const tagsArray = tags.split(",");
				draftsQuery = draftsQuery.contains("tags", tagsArray);
			}

			// 並列実行でレイテンシを抑える
			const [notesResult, draftsResult] = await Promise.all([
				notesQuery
					.order("is_pinned", { ascending: false })
					.order("created_at", { ascending: false }),
				draftsQuery.order("updated_at", { ascending: false }),
			]);

			if (notesResult.error) throw notesResult.error;
			if (draftsResult.error) throw draftsResult.error;

			return {
				notes: (notesResult.data as Note[]) || [],
				drafts: (draftsResult.data as Draft[]) || [],
			};
		},
		staleTime: 5 * 60 * 1000,
		...options,
	});
}
