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

		// Determine status code based on error message or type if needed.
		// For now, keeping it simple as per original logic.
		const isLimitError = error.message.includes("limit reached");
		const status = isLimitError ? 403 : 500;

		return c.json({ error: error.message || "Internal Server Error" }, status);
	}
});

export default ai;
