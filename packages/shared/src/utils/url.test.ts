import { describe, it, expect } from "vitest";
import {
  getSafeUrl,
  normalizeUrlForGrouping,
  normalizeUrl,
  getScopeUrls,
} from "./url";

describe("URL Utilities", () => {
  it("getSafeUrl: http/httpsから始まる正しいURLのみをパースすること", () => {
    expect(getSafeUrl("https://example.com/path"))?.toBeInstanceOf(URL);
    expect(getSafeUrl("inbox")).toBeNull();
    expect(getSafeUrl("ftp://example.com")).toBeNull();
  });

  it("normalizeUrlForGrouping: プロトコル、www、末尾のスラッシュを削除すること", () => {
    expect(normalizeUrlForGrouping("https://www.example.com/path/")).toBe("example.com/path");
    expect(normalizeUrlForGrouping("http://example.com")).toBe("example.com");
  });

  it("normalizeUrl: 指定スコープに応じて正しく正規化すること", () => {
    const url = "https://www.example.com/path?q=1";
    expect(normalizeUrl(url, "domain")).toBe("example.com");
    expect(normalizeUrl(url, "exact")).toBe("example.com/path?q=1");
    // 特殊パターン(inbox等)のフォールバック検証
    expect(normalizeUrl("inbox", "exact")).toBe("inbox");
  });

  it("getScopeUrls: domainとexactの両スコープのURLオブジェクトを返すこと", () => {
    const res = getScopeUrls("https://www.sitecue.app/notes/");
    expect(res).toEqual({
      domain: "sitecue.app",
      exact: "sitecue.app/notes",
    });
  });
});
