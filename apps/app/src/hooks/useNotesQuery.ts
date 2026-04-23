"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Note } from "@/app/notes/types";
import { createClient } from "@/utils/supabase/client";

export const NOTES_QUERY_KEY = ["notes"];

export function useFetchNotes() {
	return useQuery({
		queryKey: NOTES_QUERY_KEY,
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
		mutationFn: async (newNote: Partial<Note>) => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			const { data, error } = await supabase
				.from("sitecue_notes")
				.insert({
					...newNote,
					user_id: user.id,
					is_expanded: false,
					is_favorite: false,
					is_pinned: false,
					is_resolved: false,
					sort_order: 0,
				})
				.select()
				.single();

			if (error) throw error;
			return data as Note;
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
			updates: Partial<Note>;
		}) => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("sitecue_notes")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data as Note;
		},
		onSuccess: (updatedNote) => {
			// Optimistically update the list if needed, or just invalidate
			queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) => {
				if (!old) return old;
				return old.map((note) =>
					note.id === updatedNote.id ? updatedNote : note,
				);
			});
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

			queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) => {
				if (!old) return old;
				return old.map((note) =>
					contentMap.has(note.id)
						? { ...note, content: contentMap.get(note.id) as string }
						: note,
				);
			});
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
