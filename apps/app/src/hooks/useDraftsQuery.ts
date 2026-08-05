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

export function useFetchDraft(id?: string, initialData?: Draft) {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: [...DRAFTS_QUERY_KEY, id],
		enabled: !!id,
		initialData: () => {
			if (initialData) return initialData;
			if (!id) return undefined;
			const cached = queryClient.getQueryData<
				Draft[] | { drafts: Draft[]; notes: unknown[] }
			>(DRAFTS_QUERY_KEY);

			if (!cached) return undefined;
			if (Array.isArray(cached)) {
				return cached.find((d) => d.id === id);
			}
			if ("drafts" in cached && Array.isArray(cached.drafts)) {
				return cached.drafts.find((d) => d.id === id);
			}
			return undefined;
		},
		queryFn: async (): Promise<Draft | undefined> => {
			if (!id) return undefined;
			const supabase = createClient();
			const { data, error } = await supabase
				.from("sitecue_drafts")
				.select("*, sitecue_templates(*)")
				.eq("id", id)
				.maybeSingle();

			if (error) throw error;
			if (!data) return undefined;

			return {
				...data,
				metadata: data.metadata as Draft["metadata"],
				sitecue_templates:
					data.sitecue_templates as unknown as Draft["sitecue_templates"],
			} as Draft;
		},
		staleTime: 5 * 60 * 1000,
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
			queryClient.setQueryData([...DRAFTS_QUERY_KEY, newDraft.id], newDraft);
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
			queryClient.setQueryData(
				[...DRAFTS_QUERY_KEY, updatedDraft.id],
				updatedDraft,
			);
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
