import type { SupabaseClient } from "@supabase/supabase-js";

export interface UserProfileData {
	id: string;
	plan: "free" | "pro";
	ai_usage_count: number;
	ai_usage_reset_at: string | null;
}

/**
 * ユーザープロファイルを取得し、リセット期限（ai_usage_reset_at）を超えている場合は
 * オンデマンドで ai_usage_count を 0 にリセットし次回リセット日（1ヶ月後）に更新して返却する (Lazy Reset)。
 */
export async function fetchOrResetUserProfile(
	supabase: SupabaseClient,
	userId: string,
): Promise<UserProfileData | null> {
	const { data: profile, error } = await supabase
		.from("sitecue_profiles")
		.select("id, plan, ai_usage_count, ai_usage_reset_at")
		.eq("id", userId)
		.single();

	if (error || !profile) return null;

	const now = new Date();
	const resetAt = profile.ai_usage_reset_at
		? new Date(profile.ai_usage_reset_at)
		: null;

	if (resetAt && now >= resetAt) {
		const nextReset = new Date(now);
		nextReset.setMonth(nextReset.getMonth() + 1);
		const newResetAtStr = nextReset.toISOString();

		const { data: updated, error: updateError } = await supabase
			.from("sitecue_profiles")
			.update({
				ai_usage_count: 0,
				ai_usage_reset_at: newResetAtStr,
			})
			.eq("id", userId)
			.select("id, plan, ai_usage_count, ai_usage_reset_at")
			.single();

		if (!updateError && updated) {
			return {
				id: updated.id,
				plan: (updated.plan as "free" | "pro") || "free",
				ai_usage_count: updated.ai_usage_count,
				ai_usage_reset_at: updated.ai_usage_reset_at,
			};
		}
	}

	return {
		id: profile.id,
		plan: (profile.plan as "free" | "pro") || "free",
		ai_usage_count: profile.ai_usage_count,
		ai_usage_reset_at: profile.ai_usage_reset_at,
	};
}
