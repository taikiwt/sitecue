import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n, {
	LANGUAGE_STORAGE_KEY,
	setUserLanguage,
	syncLanguageFromStorage,
} from "./i18n";

describe("Extension i18n Configuration & Storage Sync", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await i18n.changeLanguage("en");
	});

	it("デフォルト（en）で英語の辞書キーが正しく解決されること", () => {
		expect(i18n.t("filter.page")).toBe("Page");
		expect(i18n.t("quick.tabNote")).toBe("Note");
		expect(i18n.t("header.guestWarning")).toContain(
			"Temporary local storage for trial use",
		);
	});

	it("setUserLanguage('ja') 実行時に日本語へ切り替わり、chrome.storage.local に保存されること", async () => {
		await setUserLanguage("ja");

		expect(i18n.language).toBe("ja");
		expect(i18n.t("filter.page")).toBe("ページ");
		expect(i18n.t("filter.inbox")).toBe("インボックス");
		expect(i18n.t("quick.tabNote")).toBe("ノート");
		expect(i18n.t("quick.clear")).toBe("テキストを空にする");
		expect(chrome.storage.local.set).toHaveBeenCalledWith({
			[LANGUAGE_STORAGE_KEY]: "ja",
		});
	});

	it("syncLanguageFromStorage 実行時、ストレージに保存された言語設定が復元されること", async () => {
		vi.mocked(
			chrome.storage.local.get as (
				keys: string,
			) => Promise<Record<string, unknown>>,
		).mockResolvedValueOnce({
			[LANGUAGE_STORAGE_KEY]: "ja",
		});

		await syncLanguageFromStorage();

		expect(i18n.language).toBe("ja");
		expect(i18n.t("diary.today")).toBe("今日");
	});
});
