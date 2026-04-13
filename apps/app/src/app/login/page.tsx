import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const nextPath = resolvedSearchParams.next || "/";

	const handleLogin = async (formData: FormData) => {
		"use server";
		const provider = formData.get("provider") as "google" | "github";
		const supabase = await createClient();

		// ヘッダーから安全にオリジンを取得（本番/ローカル対応）
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

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
		<div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="flex justify-center mb-8">
					<div className="flex items-center gap-3">
						<Image
							src="/logo.svg"
							alt="sitecue logo"
							width={40}
							height={40}
							priority
							className="drop-shadow-sm"
						/>
						<h1 className="text-3xl font-bold tracking-tight text-neutral-900">
							sitecue
						</h1>
					</div>
				</div>
				<h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-neutral-900">
					Welcome to Base Camp
				</h2>
				<p className="mt-3 text-center text-neutral-500">
					The hub for your thoughts and creative workflow.
				</p>
			</div>

			<div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
				<form action={handleLogin} className="grid gap-4">
					<Button
						type="submit"
						name="provider"
						value="google"
						variant="outline"
						className="w-full h-12 rounded-xl gap-3 text-sm font-semibold"
					>
						<svg
							className="h-5 w-5"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Sign in with Google
					</Button>

					<Button
						type="submit"
						name="provider"
						value="github"
						className="w-full h-12 rounded-xl gap-3 bg-[#24292F] text-white hover:bg-[#24292F]/90 text-sm font-semibold"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
						</svg>
						Sign in with GitHub
					</Button>
				</form>

				<div className="mt-8 text-center">
					<p className="text-xs text-neutral-500">
						By continuing, you agree to our{" "}
						<a
							href="https://grey-throat-c6a.notion.site/Privacy-Policy-for-sitecue-30eee95bb40780f396f0e27e417db8bf"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-neutral-900"
						>
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
