"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Draft } from "@/../../../../types/app";
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
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
			queryClient.setQueryData<Draft[]>(DRAFTS_QUERY_KEY, (old) => {
				if (!old) return old;
				return old.map((draft) =>
					draft.id === updatedDraft.id ? updatedDraft : draft,
				);
			});
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
			queryClient.setQueryData<Draft[]>(DRAFTS_QUERY_KEY, (old) => {
				if (!old) return old;
				return old.filter((draft) => draft.id !== deletedId);
			});
		},
	});
}
