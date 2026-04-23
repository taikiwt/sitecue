import { Hono } from "hono";
import { weaveDocument } from "../services/ai";
import { generateHint, generateReview } from "../services/editorAi";
import { checkAndConsumeQuota } from "../services/quota";
import type { Bindings, Variables } from "../types";

const ai = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ---------------------------------------------------------
// 🧠 AI Weave (Gemini)
// ---------------------------------------------------------
ai.post("/weave", async (c) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

	// 🌟 AI Weave実行前のQuotaチェック
	const quota = await checkAndConsumeQuota(
		c.env.SUPABASE_URL,
		c.env.SUPABASE_ANON_KEY,
		authHeader,
	);
	if (!quota.allowed) {
		return c.json(
			{
				error: quota.reason || "Quota exceeded",
				code: "QUOTA_EXCEEDED",
				plan: quota.plan,
			},
			403,
		);
	}

	try {
		const body = await c.req.json();

		const result = await weaveDocument(c.env, authHeader, body);

		return c.json({ result });
	} catch (err: unknown) {
		const error = err as Error;
		console.error("AI Weave Error:", error);
		return c.json({ error: error.message || "Internal Server Error" }, 500);
	}
});

// ---------------------------------------------------------
// 🧠 AI Review
// ---------------------------------------------------------
ai.post("/review", async (c) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

	// 🌟 AI Review実行前のQuotaチェック
	const quota = await checkAndConsumeQuota(
		c.env.SUPABASE_URL,
		c.env.SUPABASE_ANON_KEY,
		authHeader,
	);
	if (!quota.allowed) {
		return c.json(
			{
				error: quota.reason || "Quota exceeded",
				code: "QUOTA_EXCEEDED",
				plan: quota.plan,
			},
			403,
		);
	}

	const body = await c.req.json();
	const content = body.draft_content as unknown;
	if (typeof content !== "string" || !content) {
		return c.json({ reviews: [] }, 400);
	}

	try {
		const modelName = c.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
		const reviews = await generateReview(
			c.env.GEMINI_API_KEY,
			modelName,
			content,
		);
		return c.json({ reviews });
	} catch (e) {
		const _err = e as Error;
		console.error("AI Review Error:", _err);
		return c.json({ error: "Failed to generate review" }, 500);
	}
});

// ---------------------------------------------------------
// 🧠 AI Hint / Ghost Text
// ---------------------------------------------------------
ai.post("/hint", async (c) => {
	// ⚡ Ghost Text は高頻度のためQuotaチェック対象外
	const body = await c.req.json();
	const textContext = body.text as unknown;
	if (typeof textContext !== "string" || !textContext) {
		return c.json({ hint: "" }, 400);
	}

	try {
		const modelName = c.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";
		const hint = await generateHint(
			c.env.GEMINI_API_KEY,
			modelName,
			textContext,
		);
		return c.json({ hint });
	} catch (e) {
		const _err = e as Error;
		console.error("AI Hint Error:", _err);
		// Ghost Textの失敗はエディタ操作を止めないようサイレントに空文字を返す
		return c.json({ hint: "" });
	}
});

export default ai;
