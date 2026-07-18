import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useUserStats(session: Session | null) {
	const [userPlan, setUserPlan] = useState<"free" | "pro">("free");
	const [aiUsageCount, setAiUsageCount] = useState<number>(0);
	const [userStatsLoading, setUserStatsLoading] = useState(true);

	useEffect(() => {
		const userId = session?.user?.id;
		if (!userId) {
			setUserPlan("free");
			setAiUsageCount(0);
			setUserStatsLoading(false);
			return;
		}

		let isMounted = true;
		setUserStatsLoading(true);

		async function fetchStats() {
			try {
				// プロファイル情報（プラン・AI使用数）の取得
				const { data: profile, error: profileError } = await supabase
					.from("sitecue_profiles")
					.select("plan, ai_usage_count")
					.eq("id", userId)
					.maybeSingle();

				if (profileError) throw profileError;
				if (isMounted && profile) {
					setUserPlan((profile.plan as "free" | "pro") || "free");
					setAiUsageCount(profile.ai_usage_count || 0);
				}
			} catch (error) {
				console.error("Failed to fetch user stats:", error);
			} finally {
				if (isMounted) {
					setUserStatsLoading(false);
				}
			}
		}

		fetchStats();

		return () => {
			isMounted = false;
		};
	}, [session]);

	return {
		userPlan,
		aiUsageCount,
		userStatsLoading,
	};
}
