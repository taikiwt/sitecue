import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const host =
		request.headers.get("x-forwarded-host") || request.headers.get("host");
	if (host) {
		requestUrl.host = host;
	}
	if (requestUrl.hostname === "localhost") {
		requestUrl.hostname = "127.0.0.1";
	}

	const code = requestUrl.searchParams.get("code");
	const next = requestUrl.searchParams.get("next") || "/";

	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return NextResponse.redirect(new URL(next, requestUrl.origin));
		}
		console.error(
			"Auth error in callback:",
			error.message,
			error.name,
			error.status,
		);
	}

	// return the user to an error page with instructions
	return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
}
