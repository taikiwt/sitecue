import { Hono } from "hono";
import { weaveDocument } from "../services/ai";
import { generateHint, generateReview } from "../services/editorAi";
import type { Bindings, Variables } from "../types";

const ai = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ---------------------------------------------------------
// 🧠 AI Weave (Gemini)
// ---------------------------------------------------------
ai.post("/weave", async (c) => {
	try {
		const user = c.get("user");
		const authHeader = c.req.header("Authorization") ?? "";
		const body = await c.req.json();

		const result = await weaveDocument(c.env, user, authHeader, body);

		return c.json({ result });
	} catch (err: unknown) {
		const error = err as Error;
		console.error("AI Weave Error:", error);

		const isLimitError = error.message.includes("limit reached");
		const status = isLimitError ? 403 : 500;

		return c.json({ error: error.message || "Internal Server Error" }, status);
	}
});

// ---------------------------------------------------------
// 🧠 AI Review
// ---------------------------------------------------------
ai.post("/review", async (c) => {
	const body = await c.req.json();
	const content = body.draft_content as unknown;
	if (typeof content !== "string" || !content) {
		return c.json({ reviews: [] }, 400);
	}

	try {
		const reviews = await generateReview(c.env.GEMINI_API_KEY, content);
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
	const body = await c.req.json();
	const textContext = body.text as unknown;
	if (typeof textContext !== "string" || !textContext) {
		return c.json({ hint: "" }, 400);
	}

	try {
		const hint = await generateHint(c.env.GEMINI_API_KEY, textContext);
		return c.json({ hint });
	} catch (e) {
		const _err = e as Error;
		console.error("AI Hint Error:", _err);
		// Ghost Textの失敗はエディタ操作を止めないようサイレントに空文字を返す
		return c.json({ hint: "" });
	}
});

export default ai;
