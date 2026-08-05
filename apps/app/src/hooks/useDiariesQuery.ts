"use client";

import type { Diary } from "@sitecue/shared";
import {
	appendDiaryLog,
	fetchDiariesList,
	fetchDiaryByDate,
	updateDiaryContent,
} from "@sitecue/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export function useFetchDiaries() {
	return useQuery({
		queryKey: ["diaries"],
		queryFn: async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return [];
			return fetchDiariesList(supabase, user.id);
		},
	});
}

export function useFetchDiaryByDate(date: string, initialData?: Diary | null) {
	const queryClient = useQueryClient();

	return useQuery({
		queryKey: ["diaries", date],
		enabled: !!date,
		initialData: () => {
			if (initialData) return initialData;
			if (!date) return undefined;
			const cachedDiaries = queryClient.getQueryData<Diary[]>(["diaries"]);
			return cachedDiaries?.find((d) => d.date === date);
		},
		queryFn: async (): Promise<Diary | null> => {
			if (!date) return null;
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return null;
			return fetchDiaryByDate(supabase, user.id, date);
		},
		staleTime: 5 * 60 * 1000,
	});
}

export function useAppendDiary() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			date,
			text,
			topics,
		}: {
			date: string;
			text: string;
			topics?: string[];
		}) => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Unauthenticated");
			return appendDiaryLog(supabase, user.id, date, text, topics);
		},
		onSuccess: (newDiary) => {
			// プレフィックス一致を用いて関連キャッシュを一括同期
			queryClient.setQueriesData<Diary[]>({ queryKey: ["diaries"] }, (old) => {
				if (!old) return [newDiary];
				const exists = old.some((d) => d.date === newDiary.date);
				if (exists) {
					return old.map((d) => (d.date === newDiary.date ? newDiary : d));
				}
				return [newDiary, ...old].sort((a, b) => b.date.localeCompare(a.date));
			});
		},
	});
}

export function useUpdateDiary() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			date,
			text,
			topics,
		}: {
			date: string;
			text: string;
			topics?: string[];
		}) => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Unauthenticated");
			return updateDiaryContent(supabase, user.id, date, text, topics);
		},
		onSuccess: (newDiary) => {
			queryClient.setQueriesData<Diary[]>({ queryKey: ["diaries"] }, (old) => {
				if (!old) return [newDiary];
				const exists = old.some((d) => d.date === newDiary.date);
				if (exists) {
					return old.map((d) => (d.date === newDiary.date ? newDiary : d));
				}
				return [newDiary, ...old].sort((a, b) => b.date.localeCompare(a.date));
			});
		},
	});
}
