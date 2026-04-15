import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middlewares/auth";
import ai from "./routes/ai";
import notes from "./routes/notes";
import type { Bindings, Variables } from "./types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
	"/*",
	cors({
		origin: ["http://127.0.0.1:3000", "https://app.sitecue.app"],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.get("/", (c) => {
	return c.text("SiteCue API is running.");
});

// Auth Middleware (Global except for /) - handled inside middleware for specificity
app.use("/*", authMiddleware);

app.route("/notes", notes);
app.route("/ai", ai);

export default app;
