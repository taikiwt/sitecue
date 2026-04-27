import { createClient } from "@supabase/supabase-js";

export const getQuotaStatus = async (
	supabaseUrl: string,
	supabaseAnonKey: string,
	authHeader: string,
): Promise<{
	allowed: boolean;
	reason?: string;
	plan?: string;
	userId?: string;
	currentCount?: number;
	newResetAt?: string;
}> => {
	// ユーザーの権限（RLS）でSupabaseクライアントを作成
	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		global: { headers: { Authorization: authHeader } },
	});

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) return { allowed: false, reason: "Unauthorized" };

	// 既存の sitecue_profiles テーブルから現在の利用状況を取得
	const { data: profile, error: profileError } = await supabase
		.from("sitecue_profiles")
		.select("plan, ai_usage_count, ai_usage_reset_at")
		.eq("id", user.id)
		.single();

	if (profileError || !profile)
		return { allowed: false, reason: "Profile not found" };

	const now = new Date();
	const resetAt = new Date(profile.ai_usage_reset_at);
	let currentCount = profile.ai_usage_count;
	let newResetAt = profile.ai_usage_reset_at;

	// リセット日時を過ぎている場合はカウントを0に戻し、次のリセット日を1ヶ月後に設定
	if (now > resetAt) {
		currentCount = 0;
		const nextReset = new Date(now);
		nextReset.setMonth(nextReset.getMonth() + 1);
		newResetAt = nextReset.toISOString();
	}

	// プランごとの上限設定 (例: Freeは3回, Proは100回)
	const limit = profile.plan === "pro" ? 100 : 3;
	if (currentCount >= limit) {
		return {
			allowed: false,
			reason: "Plan limit reached.",
			plan: profile.plan,
		};
	}

	return {
		allowed: true,
		plan: profile.plan,
		userId: user.id,
		currentCount,
		newResetAt,
	};
};

/**
 * AI利用回数をインクリメントする（API通信成功後に呼び出す）
 */
export const consumeQuota = async (
	supabaseUrl: string,
	supabaseAnonKey: string,
	authHeader: string,
	userId: string,
	currentCount: number,
	newResetAt: string,
): Promise<void> => {
	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		global: { headers: { Authorization: authHeader } },
	});

	const { error: updateError } = await supabase
		.from("sitecue_profiles")
		.update({
			ai_usage_count: currentCount + 1,
			ai_usage_reset_at: newResetAt,
		})
		.eq("id", userId);

	if (updateError) {
		console.error("Failed to update AI usage count:", updateError);
	}
};
