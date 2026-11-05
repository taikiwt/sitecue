import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ja from "./ja.json";

export const LANGUAGE_STORAGE_KEY = "sitecue_user_language";
export type SupportedLanguage = "en" | "ja";

const getInitialLanguage = (): SupportedLanguage => {
	if (typeof navigator !== "undefined" && navigator.language) {
		return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
	}
	return "en";
};

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		ja: { translation: ja },
	},
	lng: getInitialLanguage(),
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
});

export async function syncLanguageFromStorage(): Promise<void> {
	if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
		try {
			const res = await chrome.storage.local.get(LANGUAGE_STORAGE_KEY);
			const saved = res[LANGUAGE_STORAGE_KEY];
			if (saved === "en" || saved === "ja") {
				await i18n.changeLanguage(saved);
			}
		} catch (e) {
			console.error("Failed to load language preference:", e);
		}
	}
}

export async function setUserLanguage(lang: SupportedLanguage): Promise<void> {
	await i18n.changeLanguage(lang);
	if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
		try {
			await chrome.storage.local.set({ [LANGUAGE_STORAGE_KEY]: lang });
		} catch (e) {
			console.error("Failed to save language preference:", e);
		}
	}
}

// 起動時にストレージから非同期復元
void syncLanguageFromStorage();

export default i18n;
