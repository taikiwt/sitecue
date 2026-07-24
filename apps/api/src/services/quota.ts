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
	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		global: { headers: { Authorization: authHeader } },
	});

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) return { allowed: false, reason: "Unauthorized" };

	const { data: profile, error: profileError } = await supabase
		.from("sitecue_profiles")
		.select("plan, ai_usage_count, ai_usage_reset_at")
		.eq("id", user.id)
		.single();

	if (profileError || !profile)
		return { allowed: false, reason: "Profile not found" };

	const now = new Date();
	const resetAt = profile.ai_usage_reset_at
		? new Date(profile.ai_usage_reset_at)
		: null;
	let currentCount = profile.ai_usage_count;
	let newResetAt = profile.ai_usage_reset_at || now.toISOString();

	if (resetAt && now >= resetAt) {
		currentCount = 0;
		const nextReset = new Date(now);
		nextReset.setMonth(nextReset.getMonth() + 1);
		newResetAt = nextReset.toISOString();

		// アトミックにDBを更新
		await supabase
			.from("sitecue_profiles")
			.update({
				ai_usage_count: 0,
				ai_usage_reset_at: newResetAt,
			})
			.eq("id", user.id);
	}

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
