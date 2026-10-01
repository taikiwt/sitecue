import { type NextRequest, NextResponse } from "next/server";

// Supabase の Auth Cookie（単体および chunked cookie: sb-<project>-auth-token / sb-<project>-auth-token.0 等）に合致する正規表現
const SB_AUTH_COOKIE_REGEX = /^sb-.*-auth-token(\.\d+)?$/;

export async function updateSession(request: NextRequest) {
	// オプトアウト方式: 認証不要な公開ルートをホワイトリストとして定義
	const publicRoutes = ["/login", "/auth/callback", "/pricing"];
	const isPublicRoute =
		publicRoutes.includes(request.nextUrl.pathname) ||
		request.nextUrl.pathname.startsWith("/api/");

	// 認証Cookieの存在確認（高速軽量チェック: <0.05ms）
	const hasAuthCookie = request.cookies
		.getAll()
		.some(
			(cookie) =>
				SB_AUTH_COOKIE_REGEX.test(cookie.name) && Boolean(cookie.value),
		);

	if (!hasAuthCookie && !isPublicRoute) {
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

	return NextResponse.next({
		request,
	});
}

// 静的アセット等の除外設定
export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
