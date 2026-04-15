import { createClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import type { Bindings, Variables } from "../types";

export const authMiddleware = async (
	c: Context<{ Bindings: Bindings; Variables: Variables }>,
	next: Next,
) => {
	if (c.req.path === "/") return next(); // allow health check

	const authHeader = c.req.header("Authorization");
	if (!authHeader)
		return c.json({ error: "Missing Authorization header" }, 401);

	const token = authHeader.replace("Bearer ", "");
	const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
		global: { headers: { Authorization: `Bearer ${token}` } },
	});

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return c.json({ error: "Invalid or expired token" }, 401);
	}

	c.set("user", user);
	await next();
};
