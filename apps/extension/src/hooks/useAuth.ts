import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type AuthStatus =
	| { mode: "authenticated"; session: Session; userId: string }
	| { mode: "guest"; session: null; userId: "guest-user" }
	| { mode: "loading"; session: null; userId: null };

export function useAuth() {
	const [session, setSession] = useState<Session | null>(null);
	const [authLoading, setAuthLoading] = useState(false);
	const [authError, setAuthError] = useState<string | null>(null);
	const [sessionLoading, setSessionLoading] = useState(true);

	const [isGuest, setIsGuest] = useState<boolean>(false);

	// 📋 起動時に chrome.storage.local からゲスト状態を非同期フェッチ
	useEffect(() => {
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			chrome.storage.local.get("sitecue_guest_mode").then((res) => {
				if (res.sitecue_guest_mode === true) {
					setIsGuest(true);
				}
			});
		} else if (typeof localStorage !== "undefined") {
			setIsGuest(localStorage.getItem("sitecue_guest_mode") === "true");
		}
	}, []);

	const handleGuestLogin = () => {
		setIsGuest(true);
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			chrome.storage.local.set({ sitecue_guest_mode: true });
		}
		if (typeof localStorage !== "undefined") {
			localStorage.setItem("sitecue_guest_mode", "true");
		}
	};

	const handleGuestLogout = () => {
		setIsGuest(false);
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			chrome.storage.local.remove("sitecue_guest_mode");
		}
		if (typeof localStorage !== "undefined") {
			localStorage.removeItem("sitecue_guest_mode");
		}

		// 🛡️ 認証セッション残渣をアトミックに完全消し込み
		supabase.auth.signOut();

		// ログアウトした瞬間にService Workerへバッジ再計算を即時命令する
		if (
			typeof chrome !== "undefined" &&
			chrome.runtime &&
			chrome.runtime.sendMessage
		) {
			chrome.runtime.sendMessage({ type: "REFRESH_BADGE" });
		}
	};

	const authStatus: AuthStatus = isGuest
		? { mode: "guest", session: null, userId: "guest-user" }
		: sessionLoading
			? { mode: "loading", session: null, userId: null }
			: session
				? { mode: "authenticated", session, userId: session.user.id }
				: { mode: "loading", session: null, userId: null };

	useEffect(() => {
		let hasResolved = false;

		// 🛡️ タイムアウト安全装置（サーキットブレーカー: 200ms）
		// Supabaseの接続ハングから画面描画を物理防御する
		const timeoutId = setTimeout(() => {
			if (!hasResolved) {
				console.warn(
					"Supabase session fetching timed out. Failsafe activated.",
				);
				setSessionLoading(false);
			}
		}, 200);

		supabase.auth.getSession().then(({ data: { session } }) => {
			if (!hasResolved) {
				hasResolved = true;
				clearTimeout(timeoutId);
				setSession(session);
				setSessionLoading(false);
			}
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			// 遅延着信時、または通常の認証状態変化時はここで安全にマージ
			if (!hasResolved) {
				hasResolved = true;
				clearTimeout(timeoutId);
			}
			setSession(session);
			setSessionLoading(false);
		});

		return () => {
			hasResolved = true;
			clearTimeout(timeoutId);
			subscription.unsubscribe();
		};
	}, []);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		if (
			typeof chrome !== "undefined" &&
			chrome.storage &&
			chrome.storage.local
		) {
			chrome.storage.local.remove("sitecue_guest_mode");
		}
	};

	const handleSocialLogin = async (provider: "google" | "github") => {
		setAuthLoading(true);
		setAuthError(null);

		try {
			// 1. Get Extension ID for redirect URL
			const redirectUrl = chrome.identity.getRedirectURL();

			// 2. Start OAuth flow with Supabase
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: redirectUrl,
					skipBrowserRedirect: true,
					queryParams: {
						prompt: "select_account",
					},
				},
			});

			if (error) throw error;
			if (!data?.url) throw new Error("No OAuth URL returned");

			// console.log("【デバッグ用】実際に渡されるURL:", data.url);

			// 3. Launch Chrome Web Auth Flow
			chrome.identity.launchWebAuthFlow(
				{
					url: data.url,
					interactive: true,
				},
				async (redirectUri) => {
					if (chrome.runtime.lastError) {
						setAuthError(
							chrome.runtime.lastError.message || "Authentication failed",
						);
						setAuthLoading(false);
						return;
					}

					if (!redirectUri) {
						setAuthError("No redirect URI returned");
						setAuthLoading(false);
						return;
					}

					// 4. Parse the hash from the redirect URI
					const url = new URL(redirectUri);
					const hash = url.hash.substring(1);
					const params = new URLSearchParams(hash);

					const accessToken = params.get("access_token");
					const refreshToken = params.get("refresh_token");

					if (!accessToken || !refreshToken) {
						const errorDescription =
							params.get("error_description") || "Authentication incomplete";
						setAuthError(errorDescription);
						setAuthLoading(false);
						return;
					}

					// 5. Set the session in Supabase
					const { error: sessionError } = await supabase.auth.setSession({
						access_token: accessToken,
						refresh_token: refreshToken,
					});

					if (sessionError) {
						setAuthError(sessionError.message);
					}

					setAuthLoading(false);
				},
			);
			// biome-ignore lint/suspicious/noExplicitAny: Supabase error object
		} catch (err: any) {
			console.error("Login failed:", err);
			setAuthError(err.message || "An unexpected error occurred");
			setAuthLoading(false);
		}
	};

	return {
		session,
		authLoading,
		authError,
		sessionLoading,
		handleLogout,
		handleSocialLogin,
		authStatus,
		handleGuestLogin,
		handleGuestLogout,
	};
}
