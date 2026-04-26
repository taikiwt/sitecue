import { describe, expect, it } from "bun:test";
import app from "./index";

describe("API Router", () => {
	it("should return running status on /", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toBe("sitecue API is running.");
	});

	it("should block /notes without authorization", async () => {
		const res = await app.request("/notes");
		expect(res.status).toBe(401);
		const data = (await res.json()) as { error: string };
		expect(data.error).toBe("Missing Authorization header");
	});

	it("should block /ai/weave without authorization", async () => {
		const res = await app.request("/ai/weave", {
			method: "POST",
		});
		expect(res.status).toBe(401);
		const data = (await res.json()) as { error: string };
		expect(data.error).toBe("Missing Authorization header");
	});
});
