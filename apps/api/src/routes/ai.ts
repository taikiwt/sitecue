import { Hono } from "hono";
import { weaveDocument } from "../services/ai";
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
// 🧠 AI Review (PoC Mock)
// ---------------------------------------------------------
ai.post("/review", async (c) => {
	return c.json({
		reviews: [
			{
				type: "info",
				content:
					"モック: 導入部分が長いため、結論を先に持ってくる構成も検討できます。",
			},
			{
				type: "idea",
				content:
					"モック: ここで具体的なユースケースを一つ挙げると説得力が増します。",
			},
		],
	});
});

// ---------------------------------------------------------
// 🧠 AI Hint / Ghost Text (PoC Mock)
// ---------------------------------------------------------
ai.post("/hint", async (c) => {
	return c.json({
		hint: "モック: この課題に対する具体的な解決策として、",
	});
});

export default ai;
