/**
 * Chrome拡張機能のブラウザ操作に関連するユーティリティ
 */
export async function getCurrentTabInfo(): Promise<{
	url?: string;
	title?: string;
}> {
	if (typeof chrome !== "undefined" && chrome.tabs) {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			return { url: tab?.url, title: tab?.title };
		} catch (e) {
			console.error("Failed to get current tab info:", e);
			return {};
		}
	}
	// フォールバック（開発環境等）
	return { url: window.location.href, title: document.title };
}
