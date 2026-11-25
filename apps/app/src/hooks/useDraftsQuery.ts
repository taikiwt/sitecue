"use client";

import {
	createDraftEntity,
	type Draft,
	emptyTrashDraftsEntity,
	fetchDraftById,
	fetchDraftsList,
	fetchTrashDrafts,
	permanentlyDeleteDraftEntity,
	restoreDraftEntity,
	softDeleteDraftEntity,
	updateDraftEntity,
} from "@sitecue/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DASHBOARD_QUERY_KEY } from "@/hooks/useDashboardQuery";
import { NOTES_QUERY_KEY } from "@/hooks/useNotesQuery";
import { broadcastCacheSync } from "@/hooks/useTabSync";
import { createClient } from "@/utils/supabase/client";

export const DRAFTS_QUERY_KEY = ["drafts"];
export const TRASH_DRAFTS_QUERY_KEY = ["trash-drafts"];

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

			return await fetchDraftsList(supabase, user.id);
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
			return await fetchDraftById(supabase, id);
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

			return await createDraftEntity(supabase, user.id, newDraft);
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
			broadcastCacheSync(DRAFTS_QUERY_KEY);
			broadcastCacheSync(DASHBOARD_QUERY_KEY);
			broadcastCacheSync(NOTES_QUERY_KEY);
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
			return await updateDraftEntity(supabase, id, updates);
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
			broadcastCacheSync(DRAFTS_QUERY_KEY);
			broadcastCacheSync(DASHBOARD_QUERY_KEY);
			broadcastCacheSync(NOTES_QUERY_KEY);
		},
	});
}

export function useDeleteDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const supabase = createClient();
			return await softDeleteDraftEntity(supabase, id);
		},
		onSuccess: (deletedDraft) => {
			const deletedId = deletedDraft.id;
			queryClient.removeQueries({
				queryKey: [...DRAFTS_QUERY_KEY, deletedId],
				exact: true,
			});
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
			queryClient.setQueriesData<
				| Array<{ id: string; draft_id?: string | null }>
				| {
						notes: Array<{ id: string; draft_id?: string | null }>;
						drafts: unknown[];
				  }
			>({ queryKey: NOTES_QUERY_KEY }, (old) => {
				if (!old) return old;
				if (Array.isArray(old)) {
					return old.filter((n) => n.draft_id !== deletedId);
				}
				if ("notes" in old) {
					return {
						...old,
						notes: old.notes.filter((n) => n.draft_id !== deletedId),
					};
				}
				return old;
			});
			queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: TRASH_DRAFTS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
			broadcastCacheSync(DRAFTS_QUERY_KEY);
			broadcastCacheSync(TRASH_DRAFTS_QUERY_KEY);
			broadcastCacheSync(DASHBOARD_QUERY_KEY);
			broadcastCacheSync(NOTES_QUERY_KEY);
		},
	});
}

export function useFetchTrashDrafts(retentionDays: number) {
	return useQuery({
		queryKey: [...TRASH_DRAFTS_QUERY_KEY, retentionDays],
		staleTime: 60 * 1000,
		queryFn: async (): Promise<Draft[]> => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			return await fetchTrashDrafts(supabase, user.id, retentionDays);
		},
	});
}

export function useRestoreDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const supabase = createClient();
			return await restoreDraftEntity(supabase, id);
		},
		onSuccess: (restoredDraft) => {
			queryClient.setQueriesData<Draft[]>(
				{ queryKey: TRASH_DRAFTS_QUERY_KEY },
				(old) => {
					if (!old || !Array.isArray(old)) return old;
					return old.filter((d) => d.id !== restoredDraft.id);
				},
			);
			queryClient.invalidateQueries({ queryKey: TRASH_DRAFTS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DRAFTS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			broadcastCacheSync(TRASH_DRAFTS_QUERY_KEY);
			broadcastCacheSync(DRAFTS_QUERY_KEY);
			broadcastCacheSync(NOTES_QUERY_KEY);
			broadcastCacheSync(DASHBOARD_QUERY_KEY);
		},
	});
}

export function usePermanentlyDeleteDraft() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const supabase = createClient();
			return await permanentlyDeleteDraftEntity(supabase, id);
		},
		onSuccess: (deletedId) => {
			queryClient.setQueriesData<Draft[]>(
				{ queryKey: TRASH_DRAFTS_QUERY_KEY },
				(old) => {
					if (!old || !Array.isArray(old)) return old;
					return old.filter((d) => d.id !== deletedId);
				},
			);
			queryClient.invalidateQueries({ queryKey: TRASH_DRAFTS_QUERY_KEY });
			broadcastCacheSync(TRASH_DRAFTS_QUERY_KEY);
		},
	});
}

export function useEmptyTrashDrafts() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");
			await emptyTrashDraftsEntity(supabase, user.id);
		},
		onSuccess: () => {
			queryClient.setQueriesData<Draft[]>(
				{ queryKey: TRASH_DRAFTS_QUERY_KEY },
				() => [],
			);
			queryClient.invalidateQueries({ queryKey: TRASH_DRAFTS_QUERY_KEY });
			broadcastCacheSync(TRASH_DRAFTS_QUERY_KEY);
		},
	});
}
