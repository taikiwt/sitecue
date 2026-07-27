"use client";

import { fetchDashboardOverviewData } from "@sitecue/shared/dal";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export const DASHBOARD_QUERY_KEY = ["dashboard", "data"];

export function useFetchDashboardData() {
	return useQuery({
		queryKey: DASHBOARD_QUERY_KEY,
		staleTime: 5 * 60 * 1000,
		queryFn: async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Unauthenticated");

			return await fetchDashboardOverviewData(supabase, user.id);
		},
	});
}
