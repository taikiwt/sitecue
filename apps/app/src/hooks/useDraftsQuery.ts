"use client";

import type { Draft } from "@sitecue/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_QUERY_KEY } from "@/hooks/useDashboardQuery";
import { NOTES_QUERY_KEY } from "@/hooks/useNotesQuery";
import { createClient } from "@/utils/supabase/client";

export const DRAFTS_QUERY_KEY = ["drafts"];

export function useFetchDrafts(initialData?: Draft[]) {
	return useQuery({
		queryKey: DRAFTS_QUERY_KEY,
		initialData,
		queryFn: async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			const { data, error } = await supabase
				.from("sitecue_drafts")
				.select("*")
				.eq("user_id", user.id)
				.order("updated_at", { ascending: false });

			if (error) throw error;
			return (data as Draft[]) || [];
		},
	});
}

export function useCreateDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newDraft: Partial<Draft>) => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			const { data, error } = await supabase
				.from("sitecue_drafts")
				.insert({
					...newDraft,
					user_id: user.id,
				})
				.select()
				.single();

			if (error) throw error;
			return data as Draft;
		},
		onSuccess: (newDraft) => {
			queryClient.setQueriesData<
				Draft[] | { drafts: Draft[]; notes: unknown[] }
			>({ queryKey: DRAFTS_QUERY_KEY }, (old) => {
				if (!old) return [newDraft];
				if (Array.isArray(old)) {
					return [newDraft, ...old.filter((d) => d.id !== newDraft.id)];
				}
				if ("drafts" in old) {
					return {
						...old,
						drafts: [
							newDraft,
							...old.drafts.filter((d) => d.id !== newDraft.id),
						],
					};
				}
				return old;
			});
			queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
		},
	});
}

export function useUpdateDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<Draft>;
		}) => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("sitecue_drafts")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data as Draft;
		},
		onSuccess: (updatedDraft) => {
			queryClient.setQueriesData<
				Draft[] | { drafts: Draft[]; notes: unknown[] }
			>({ queryKey: DRAFTS_QUERY_KEY }, (old) => {
				if (!old) return old;
				if (Array.isArray(old)) {
					return old.map((d) => (d.id === updatedDraft.id ? updatedDraft : d));
				}
				if ("drafts" in old) {
					return {
						...old,
						drafts: old.drafts.map((d) =>
							d.id === updatedDraft.id ? updatedDraft : d,
						),
					};
				}
				return old;
			});
			queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
		},
	});
}

export function useDeleteDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_drafts")
				.delete()
				.eq("id", id);

			if (error) throw error;
			return id;
		},
		onSuccess: (deletedId) => {
			queryClient.setQueriesData<
				Draft[] | { drafts: Draft[]; notes: unknown[] }
			>({ queryKey: DRAFTS_QUERY_KEY }, (old) => {
				if (!old) return old;
				if (Array.isArray(old)) {
					return old.filter((d) => d.id !== deletedId);
				}
				if ("drafts" in old) {
					return {
						...old,
						drafts: old.drafts.filter((d) => d.id !== deletedId),
					};
				}
				return old;
			});
			queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
		},
	});
}
