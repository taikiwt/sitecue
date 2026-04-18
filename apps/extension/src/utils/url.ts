export interface TabInfo {
	url: string | null;
	title: string | null;
}

export const getCurrentTabInfo = async (): Promise<TabInfo> => {
	// 1. Chrome拡張機能として動いている場合
	if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		return {
			url: tabs[0]?.url || null,
			title: tabs[0]?.title || null,
		};
	}

	// 2. ローカル開発（Webブラウザ）の場合
	return {
		url: window.location.href,
		title: document.title,
	};
};

export const getCurrentUrl = async (): Promise<string | null> => {
	const info = await getCurrentTabInfo();
	return info.url;
};

export function getSafeUrl(urlString: string): URL | null {
	try {
		if (!urlString.startsWith("http")) return null;
		return new URL(urlString);
	} catch (_error) {
		return null;
	}
}

export function normalizeUrlForGrouping(url: string): string {
	let normalized = url.replace(/^(https?:\/\/)?(www\.)?/, "");
	if (normalized.endsWith("/")) {
		normalized = normalized.slice(0, -1);
	}
	return normalized;
}

export const normalizeUrl = (
	url: string,
	scope: "domain" | "exact",
): string => {
	const safeUrl = getSafeUrl(url);
	if (!safeUrl) {
		return normalizeUrlForGrouping(url);
	}

	if (scope === "domain") {
		return normalizeUrlForGrouping(safeUrl.host);
	} else {
		return normalizeUrlForGrouping(
			safeUrl.host + safeUrl.pathname + safeUrl.search,
		);
	}
};

/**
 * 現在のURLから、検索対象となる全てのURLパターンを取得する
 */
export const getScopeUrls = (
	currentUrl: string,
): { domain: string; exact: string } => {
	return {
		domain: normalizeUrl(currentUrl, "domain"),
		exact: normalizeUrl(currentUrl, "exact"),
	};
};
