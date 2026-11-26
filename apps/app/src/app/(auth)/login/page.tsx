import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LoginClient } from "./_components/LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string; switch?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const nextPath = resolvedSearchParams.next || "/";
	const isSwitch = resolvedSearchParams.switch === "true";

	const handleLogin = async (formData: FormData) => {
		"use server";
		const provider = formData.get("provider") as "google" | "github";
		const supabase = await createClient();

		const headersList = await headers();
		const host =
			headersList.get("x-forwarded-host") ||
			headersList.get("host") ||
			"127.0.0.1:3000";
		const protocol = headersList.get("x-forwarded-proto") || "http";
		const safeHost = host.includes("localhost")
			? host.replace("localhost", "127.0.0.1")
			: host;
		const origin = `${protocol}://${safeHost}`;

		const queryParams: Record<string, string> = {
			prompt: "select_account",
		};

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
				queryParams,
			},
		});

		if (error) {
			console.error("OAuth error:", error);
			redirect("/login?error=auth");
		}

		if (data?.url) {
			redirect(data.url);
		}
	};

	return (
		<LoginClient
			isSwitch={isSwitch}
			nextPath={nextPath}
			loginAction={handleLogin}
		/>
	);
}
