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

		const { data, error } = await supabase
			.from("sitecue_notes")
			.insert({
				user_id: user.id,
				url_pattern,
				content,
			})
			.select();

		if (error) return c.json({ error: error.message }, 500);
		return c.json(data[0], 201);
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

		const { data, error } = await supabase
			.from("sitecue_notes")
			.update({ content })
			.eq("id", id)
			.select();

		if (error) return c.json({ error: error.message }, 500);

		if (!data || data.length === 0) {
			return c.json({ error: "Note not found or permission denied" }, 404);
		}

		return c.json(data[0]);
	} catch (_err) {
		return c.json({ error: "Invalid JSON body" }, 400);
	}
});

export default notes;
