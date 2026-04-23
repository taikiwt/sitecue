"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Template } from "@/../../../../types/app";
import { createClient } from "@/utils/supabase/client";

export const TEMPLATES_QUERY_KEY = ["templates"];

export function useFetchTemplates(initialData?: Template[]) {
	return useQuery({
		queryKey: TEMPLATES_QUERY_KEY,
		initialData,
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("sitecue_templates")
				.select("*")
				.order("created_at", { ascending: true });

			if (error) throw error;
			return (data as Template[]) || [];
		},
	});
}

export function useCreateTemplate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (newTemplate: Partial<Template>) => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("User not authenticated");

			const { data, error } = await supabase
				.from("sitecue_templates")
				.insert({
					...newTemplate,
					user_id: user.id,
				})
				.select()
				.single();

			if (error) throw error;
			return data as Template;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
		},
	});
}

export function useUpdateTemplate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<Template>;
		}) => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("sitecue_templates")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data as Template;
		},
		onSuccess: (updatedTemplate) => {
			queryClient.setQueryData<Template[]>(TEMPLATES_QUERY_KEY, (old) => {
				if (!old) return old;
				return old.map((template) =>
					template.id === updatedTemplate.id ? updatedTemplate : template,
				);
			});
		},
	});
}

export function useDeleteTemplate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_templates")
				.delete()
				.eq("id", id);

			if (error) throw error;
			return id;
		},
		onSuccess: (deletedId) => {
			queryClient.setQueryData<Template[]>(TEMPLATES_QUERY_KEY, (old) => {
				if (!old) return old;
				return old.filter((template) => template.id !== deletedId);
			});
		},
	});
}
