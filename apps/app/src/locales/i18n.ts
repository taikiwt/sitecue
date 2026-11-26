import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ja from "./ja.json";

export const LANGUAGE_STORAGE_KEY = "sitecue_user_language";
export type SupportedLanguage = "en" | "ja";

export function detectPreferredLanguage(): SupportedLanguage {
	if (typeof window !== "undefined") {
		try {
			const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
			if (saved === "en" || saved === "ja") {
				return saved;
			}
		} catch {
			// ignore storage access errors
		}
		if (
			typeof navigator !== "undefined" &&
			typeof navigator.language === "string" &&
			navigator.language.toLowerCase().startsWith("ja")
		) {
			return "ja";
		}
	}
	return "en";
}

if (!i18n.isInitialized) {
	void i18n.use(initReactI18next).init({
		resources: {
			en: { translation: en },
			ja: { translation: ja },
		},
		lng: "en",
		fallbackLng: "en",
		interpolation: {
			escapeValue: false,
		},
	});
}

// SSR およびクライアント初回ハイドレーション専用の不変インスタンス（常に "en" を維持）
export const ssrI18n = i18n.createInstance();
void ssrI18n.init({
	resources: {
		en: { translation: en },
		ja: { translation: ja },
	},
	lng: "en",
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
});

export async function syncUserLanguage(): Promise<SupportedLanguage> {
	const preferred = detectPreferredLanguage();
	if (i18n.language !== preferred) {
		await i18n.changeLanguage(preferred);
	}
	if (typeof document !== "undefined") {
		document.documentElement.lang = preferred;
	}
	return preferred;
}

export async function setUserLanguage(lang: SupportedLanguage): Promise<void> {
	await i18n.changeLanguage(lang);
	if (typeof window !== "undefined") {
		try {
			window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
		} catch {
			// ignore storage access errors
		}
	}
	if (typeof document !== "undefined") {
		document.documentElement.lang = lang;
	}
}

export default i18n;
