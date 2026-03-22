import { expect, test } from "@playwright/test";

test.describe("Core Redirect and Auth Flow", () => {
	// 1. Scenario A: Unauthenticated redirect retention
	test("Scenario A: Unauthenticated users are redirected to login with next parameter", async ({
		page,
	}) => {
		const targetUrl = "/weave?url=https://example.com&context_id=123";
		await page.goto(targetUrl);

		// Playwright wait for redirect
		await page.waitForURL("**/login**");

		// Get current URL
		const currentUrl = new URL(page.url());
		expect(currentUrl.pathname).toBe("/login");

		// Validate that the next parameter is preserved
		const nextParam = currentUrl.searchParams.get("next");
		expect(nextParam).toContain("/weave");
		const expectedUrlParam = encodeURIComponent("https://example.com");
		expect(nextParam).toContain(`url=${expectedUrlParam}`);
	});

	// 2. Scenario B: Session injection via local Supabase API and authenticated verification
	test("Scenario B: Authenticated users can access protected pages directly", async ({
		page,
		request,
		context,
	}) => {
		// Generate unique email to avoid duplicates
		const uniqueEmail = `test-${Date.now()}@example.com`;
		const password = "password123";
		const supabaseUrl =
			process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
		const anonKey =
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
			"sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

		// Sign up via Supabase GoTrue directly
		const response = await request.post(`${supabaseUrl}/auth/v1/signup`, {
			headers: {
				apikey: anonKey,
				Authorization: `Bearer ${anonKey}`,
				"Content-Type": "application/json",
			},
			data: {
				email: uniqueEmail,
				password: password,
			},
		});

		// Check response status
		expect(response.ok()).toBeTruthy();

		// Local supabase auto-confirms by default unless configured otherwise
		const authData = await response.json();
		expect(authData.access_token).toBeDefined();

		// Create cookies in the format @supabase/ssr expects.
		// For local dev, project id/ref is usually "127" domain
		// The domain is 127.0.0.1, making the standard string sb-127001-auth-token or explicitly using project ID.
		// Usually local supabase project_id is just random or "127" if we extract from URL.
		// Actually, Next.js uses standard parsed domain from NEXT_PUBLIC_SUPABASE_URL.
		// Local URL "http://127.0.0.1:54321" results in "http://127.0.0.1:54321". The @supabase/ssr parser makes project ref `127.0.0.1:54321` host? No, it takes the subdomain.
		// Actually, for 127.0.0.1, @supabase/ssr sets the cookie name as `sb-127-auth-token`.

		// The response from GoTrue /signup is exactly the Session object (access_token, refresh_token, user, expires_at, etc)
		const sessionStr = JSON.stringify(authData);

		// @supabase/ssr base64url encodes the session object with a 'base64-' prefix
		const base64UrlSession =
			"base64-" + Buffer.from(sessionStr, "utf-8").toString("base64url");

		const chunkSize = 3180;
		const chunks = Math.ceil(base64UrlSession.length / chunkSize);
		const cookiesToSet = [];
		for (let i = 0; i < chunks; i++) {
			cookiesToSet.push({
				name: `sb-127-auth-token.${i}`, // The standard chunk format for 127.0.0.1 is `sb-127-auth-token`
				value: base64UrlSession.substring(i * chunkSize, (i + 1) * chunkSize),
				domain: "127.0.0.1",
				path: "/",
				sameSite: "Lax" as const,
				secure: false,
			});
		}

		await context.addCookies(cookiesToSet);

		// Now navigate to protected page
		const targetUrl = "/weave?url=https://example.com&context_id=123";
		await page.goto(targetUrl);

		// Expect NOT to be redirected to login
		// Wait for the next framework to mount and settle
		await page.waitForLoadState("networkidle");
		const currentUrl = new URL(page.url());

		// If it's authenticated properly, it should stay at /weave
		expect(currentUrl.pathname).toBe("/weave");
		expect(currentUrl.searchParams.get("url")).toBe("https://example.com");

		// Validate Dashboard UI is visible
		await expect(page.locator("body")).toContainText(/Context Weaver/i);
	});
});
