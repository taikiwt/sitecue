import { createNoteEntity, updateNoteEntity } from "@sitecue/shared";
import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import type { Bindings, Variables } from "../types";

const notes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ---------------------------------------------------------
// 📑 メモの取得 (READ)
// ---------------------------------------------------------
notes.get("/", async (c) => {
	const url = c.req.query("url");

	const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
		global: { headers: { Authorization: c.req.header("Authorization") ?? "" } },
	});

	let query = supabase.from("sitecue_notes").select("*");

	if (url) {
		query = query.eq("url_pattern", url);
	}

	const { data, error } = await query;

	if (error) return c.json({ error: error.message }, 500);
	return c.json(data);
});

// ---------------------------------------------------------
// ➕ メモの作成 (CREATE)
// ---------------------------------------------------------
notes.post("/", async (c) => {
	try {
		const { url_pattern, content } = await c.req.json();
		const user = c.get("user");
		const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
			global: {
				headers: { Authorization: c.req.header("Authorization") ?? "" },
			},
		});

		const data = await createNoteEntity(supabase, user.id, {
			content,
			scope: "exact", // Default to exact for API creates unless otherwise specified
			note_type: "info", // Default note type
			currentUrl: url_pattern,
		});

		return c.json(data, 201);
	} catch (_err) {
		return c.json({ error: "Invalid JSON body" }, 400);
	}
});

// ---------------------------------------------------------
// 📝 メモの更新 (UPDATE)
// ---------------------------------------------------------
notes.put("/", async (c) => {
	try {
		const { id, content } = await c.req.json();

		if (!id) {
			return c.json({ error: "Note ID is required" }, 400);
		}

		const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
			global: {
				headers: { Authorization: c.req.header("Authorization") ?? "" },
			},
		});

		const data = await updateNoteEntity(supabase, id, { content });

		return c.json(data);
	} catch (err) {
		if (err instanceof Error && err.message.includes("Note not found")) {
			return c.json({ error: "Note not found or permission denied" }, 404);
		}
		return c.json({ error: "Invalid JSON body" }, 400);
	}
});

export default notes;
