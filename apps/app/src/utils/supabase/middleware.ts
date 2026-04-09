import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => {
						request.cookies.set(name, value);
					});
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) => {
						supabaseResponse.cookies.set(name, value, options);
					});
				},
			},
		},
	);

	// refresh session if expired - required for Server Components
	// https://supabase.com/docs/guides/auth/server-side/nextjs
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const protectedRoutes = ["/", "/notes", "/studio"];
	const isProtectedRoute =
		protectedRoutes.includes(request.nextUrl.pathname) ||
		request.nextUrl.pathname.startsWith("/studio/");

	if (!user && isProtectedRoute) {
		// no user, potentially respond by redirecting the user to the login page
		let baseUrl = request.url;
		const host =
			request.headers.get("x-forwarded-host") || request.headers.get("host");
		if (host) {
			const protocol = request.headers.get("x-forwarded-proto") || "http";
			baseUrl = `${protocol}://${host}`;
		}

		const redirectUrl = new URL("/login", baseUrl);
		if (redirectUrl.hostname === "localhost") {
			redirectUrl.hostname = "127.0.0.1";
		}
		// biome-ignore format: User preference for single line
		redirectUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
		return NextResponse.redirect(redirectUrl);
	}

	if (user && request.nextUrl.pathname.startsWith("/login")) {
		// logged in user should not see login page
		let baseUrl = request.url;
		const host =
			request.headers.get("x-forwarded-host") || request.headers.get("host");
		if (host) {
			const protocol = request.headers.get("x-forwarded-proto") || "http";
			baseUrl = `${protocol}://${host}`;
		}

		const redirectUrl = new URL("/", baseUrl);
		if (redirectUrl.hostname === "localhost") {
			redirectUrl.hostname = "127.0.0.1";
		}
		return NextResponse.redirect(redirectUrl);
	}

	return supabaseResponse;
}
