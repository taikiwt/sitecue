import {
	getSafeUrl,
	getScopeUrls,
	normalizeUrl,
	normalizeUrlForGrouping,
} from "@sitecue/shared";

export { getSafeUrl, getScopeUrls, normalizeUrl, normalizeUrlForGrouping };

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
