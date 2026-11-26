import { beforeEach, describe, expect, it } from "vitest";
import i18n, {
	detectPreferredLanguage,
	LANGUAGE_STORAGE_KEY,
	setUserLanguage,
	ssrI18n,
	syncUserLanguage,
} from "./i18n";

describe("Basecamp i18n configuration & language detection", () => {
	beforeEach(async () => {
		window.localStorage.clear();
		Object.defineProperty(window.navigator, "language", {
			value: "en-US",
			configurable: true,
		});
		await i18n.changeLanguage("en");
		document.documentElement.lang = "en";
	});

	it("localStorage に保存された言語を最優先で検出すること", () => {
		window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "ja");
		expect(detectPreferredLanguage()).toBe("ja");

		window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
		Object.defineProperty(window.navigator, "language", {
			value: "ja-JP",
			configurable: true,
		});
		expect(detectPreferredLanguage()).toBe("en");
	});

	it("localStorage が未設定の場合、navigator.language が ja で始まれば ja を自動検出すること", () => {
		Object.defineProperty(window.navigator, "language", {
			value: "ja-JP",
			configurable: true,
		});
		expect(detectPreferredLanguage()).toBe("ja");
	});

	it("localStorage が未設定かつ英語環境の場合は en にフォールバックすること", () => {
		Object.defineProperty(window.navigator, "language", {
			value: "en-GB",
			configurable: true,
		});
		expect(detectPreferredLanguage()).toBe("en");
	});

	it("setUserLanguage で i18n.language・localStorage・html[lang] が同期更新され、ssrI18n は en のまま不変であること", async () => {
		await setUserLanguage("ja");
		expect(i18n.language).toBe("ja");
		expect(ssrI18n.language).toBe("en");
		expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ja");
		expect(document.documentElement.lang).toBe("ja");
	});

	it("syncUserLanguage でブラウザ言語に応じた同期が行われ、ssrI18n は en のまま不変であること", async () => {
		Object.defineProperty(window.navigator, "language", {
			value: "ja",
			configurable: true,
		});
		const resolved = await syncUserLanguage();
		expect(resolved).toBe("ja");
		expect(i18n.language).toBe("ja");
		expect(ssrI18n.language).toBe("en");
		expect(document.documentElement.lang).toBe("ja");
	});
});
