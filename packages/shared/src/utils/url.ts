export function getSafeUrl(urlString: string): URL | null {
  try {
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

export function normalizeUrl(url: string, scope: "domain" | "exact"): string {
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
}

/**
 * 現在のURLから、検索対象となる全てのURLパターンを取得する
 */
export function getScopeUrls(currentUrl: string): { domain: string; exact: string } {
  return {
    domain: normalizeUrl(currentUrl, "domain"),
    exact: normalizeUrl(currentUrl, "exact"),
  };
}
