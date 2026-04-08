export function getSafeUrl(urlString: string): URL | null {
	try {
		// http/httpsから始まらない場合は弾く
		if (!urlString.startsWith("http")) return null;
		return new URL(urlString);
	} catch (_error) {
		return null;
	}
}

/**
 * グルーピング用のURL正規化
 * - プロトコル (http://, https://) を削除
 * - www. を削除
 * - 末尾の / を削除
 */
export function normalizeUrlForGrouping(url: string): string {
	let normalized = url.replace(/^(https?:\/\/)?(www\.)?/, "");
	if (normalized.endsWith("/")) {
		normalized = normalized.slice(0, -1);
	}
	return normalized;
}
