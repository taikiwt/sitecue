import { supabase } from "../src/supabaseClient";
import { getScopeUrls } from "../src/utils/url";

export default defineBackground(() => {
	// --- ここに元々の background.ts の中身をそのまま配置 ---
	// 例:
	// chrome.sidePanel.setPanelBehavior({ openPanelOnActionIconClick: true });
	// chrome.tabs.onUpdated.addListener(...) など
	// Enable side panel on action click
	chrome.sidePanel
		.setPanelBehavior({ openPanelOnActionClick: true })
		.catch((error: unknown) => console.error(error));

	console.log("SiteCue background script loaded.");

	// --- Helper Functions ---

	/**
	 * Fetches note count for the current URL and updates the badge.
	 */
	async function updateBadge(tabId: number, url: string) {
		if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
			// Clear badge if not a valid HTTP/HTTPS URL
			await chrome.action.setBadgeText({ tabId, text: "" });
			return;
		}

		const { domain, exact } = getScopeUrls(url);

		try {
			// We need to check for notes that match EITHER:
			// 1. scope = 'domain' AND url_pattern = domain
			// 2. scope = 'exact' AND url_pattern = exact
			// AND user_id matches current user (handled by RLS automatically if session exists)

			// Supabase query:
			// select count(*) from sitecue_notes where (scope = 'domain' and url_pattern = domain) or (scope = 'exact' and url_pattern = exact)

			// Since we can't easily do complex ORs with .eq() syntax on the same column in one go without raw filters,
			// let's try the .or() syntax.

			const { count, error } = await supabase
				.rpc(
					"get_matching_notes",
					{ p_domain: domain, p_exact: exact },
					{ count: "exact", head: true },
				)
				.eq("is_resolved", false);

			if (error) {
				console.error("Error fetching note count:", error);
				// If auth error, maybe clear badge or show '?'
				await chrome.action.setBadgeText({ tabId, text: "" });
				return;
			}

			const countStr = count && count > 0 ? count.toString() : "";
			await chrome.action.setBadgeText({ tabId, text: countStr });
			if (count && count > 0) {
				await chrome.action.setBadgeBackgroundColor({
					tabId,
					color: "#3B82F6",
				}); // Blue
				await chrome.action.setBadgeTextColor({ tabId, color: "#FFFFFF" }); // White
			}
		} catch (err) {
			console.error("Unexpected error in updateBadge:", err);
			await chrome.action.setBadgeText({ tabId, text: "" });
		}
	}

	// --- Event Listeners ---

	// 1. Tab Activated (Switched)
	chrome.tabs.onActivated.addListener(async (activeInfo) => {
		try {
			const tab = await chrome.tabs.get(activeInfo.tabId);
			if (tab.url) {
				await updateBadge(activeInfo.tabId, tab.url);
			}
		} catch (error) {
			console.debug(
				"[SiteCue] Tab closed or unavailable before badge update:",
				error,
			);
		}
	});

	// 2. Tab Updated (Navigated/Reloaded)
	chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
		// リロード時は changeInfo.url が undefined になるが、
		// Chromeがバッジをクリアしてしまうため status === "complete" で再描画する
		if (changeInfo.url || changeInfo.status === "complete") {
			if (tab.url) {
				await updateBadge(tabId, tab.url);
			}
		}
	});

	// 3. Message from Side Panel (Note created/deleted)
	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message.type === "REFRESH_BADGE") {
			// 非同期処理を即時実行関数（IIFE）でラップして実行
			(async () => {
				try {
					const tabs = await chrome.tabs.query({
						active: true,
						currentWindow: true,
					});
					if (tabs.length > 0 && tabs[0].id && tabs[0].url) {
						await updateBadge(tabs[0].id, tabs[0].url);
					}
					sendResponse({ status: "ok" });
				} catch (error) {
					console.error("[SiteCue] Failed to refresh badge:", error);
					sendResponse({ status: "error", error });
				}
			})();

			// 非同期で sendResponse を呼ぶために true を返す (Manifest V3 必須)
			return true;
		}

		if (message.type === "TEST_SESSION_REFRESH") {
			// Trigger manual session refresh test
			// biome-ignore lint/suspicious/noExplicitAny: test hacking
			(self as any).testSessionRefresh?.();
			sendResponse({ status: "test_started" });
			return false; // Sync response
		}
	});

	// --- Session Auto-Refresh & Monitoring ---

	/**
	 * Checks if the current session is close to expiring (within 5 minutes)
	 * and refreshes it if necessary.
	 */
	async function checkSession() {
		console.log("[Session Check] Checking session status...");
		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();

		if (error || !session) {
			console.log("[Session Check] No active session.");
			return;
		}

		const expiresAt = session.expires_at || 0; // unix timestamp in seconds
		const now = Math.floor(Date.now() / 1000);
		const timeRemaining = expiresAt - now;

		console.log(`[Session Check] Expires in: ${timeRemaining}s`);

		// If expires in less than 5 minutes (300s), refresh it
		if (timeRemaining < 300) {
			console.log("[Session Check] Session expiring soon... Refreshing...");
			const { data, error: refreshError } =
				await supabase.auth.refreshSession();

			if (refreshError) {
				console.error("[Session Check] Refresh failed:", refreshError);
			} else {
				console.log(
					"[Session Check] Session successfully refreshed!",
					data.session?.expires_at,
				);
			}
		}
	}

	// Monitor auth state changes (Logging)
	supabase.auth.onAuthStateChange((event, session) => {
		console.log(`[Auth Debug] Event: ${event}`);
		if (session) {
			const expiresAt = new Date(
				(session.expires_at || 0) * 1000,
			).toLocaleString();
			console.log(`[Auth Debug] Session expires at: ${expiresAt}`);
		}
	});

	// Run checkSession every 1 minute
	setInterval(checkSession, 60 * 1000);

	/**
	 * Manually trigger a session refresh test.
	 * call this from the DevTools console: chrome.runtime.sendMessage({ type: 'TEST_SESSION_REFRESH' })
	 */
	// biome-ignore lint/suspicious/noExplicitAny: test hacking
	(self as any).testSessionRefresh = async () => {
		console.log("[Test] Starting session refresh test...");

		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();

		if (error || !session) {
			console.error("[Test] No active session to test with.", error);
			return;
		}

		// 1. Set a fake session that expires in 5 seconds
		const currentTimestamp = Math.floor(Date.now() / 1000);
		const newExpiresAt = currentTimestamp + 5;

		const fakeExpiringSession = {
			...session,
			expires_at: newExpiresAt,
			expires_in: 5,
		};

		console.log(
			`[Test] Setting local session to expire in 5 seconds (${new Date(newExpiresAt * 1000).toLocaleString()})...`,
		);

		// Apply the fake session locally
		const { error: setErrors } =
			await supabase.auth.setSession(fakeExpiringSession);

		if (setErrors) {
			console.error("[Test] Failed to set expiring session:", setErrors);
			return;
		}

		console.log("[Test] Wrapper session set. Waiting for auto-refresh...");

		// 2. Force the check to run after 6 seconds (to simulate the interval hitting)
		setTimeout(() => {
			console.log("[Test] 6 seconds passed. Forcing checkSession()...");
			checkSession();
		}, 6000);
	};
});
