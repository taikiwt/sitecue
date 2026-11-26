export type AppLocale = "en" | "ja";

export function toIntlLocale(lang: string): string {
	return lang.startsWith("ja") ? "ja-JP" : "en-US";
}

export function formatShortDateTime(dateStr: string, lang: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString(toIntlLocale(lang), {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatLongDateTime(dateStr: string, lang: string): string {
	const date = new Date(dateStr);
	return date.toLocaleString(toIntlLocale(lang), {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatDiaryFullDate(dateStr: string, lang: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString(toIntlLocale(lang), {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function formatDiaryDayLabel(dateStr: string, lang: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString(toIntlLocale(lang), {
		day: "numeric",
		weekday: "short",
	});
}
