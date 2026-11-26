"use client";

import { useTranslation } from "react-i18next";
import { toIntlLocale } from "@/lib/dateFormat";

export function T({
	k,
	values,
}: {
	k: string;
	values?: Record<string, string | number>;
}) {
	const { t } = useTranslation();
	return <>{values ? t(k, values) : t(k)}</>;
}

export function LocalizedDate({ dateStr }: { dateStr: string }) {
	const { i18n } = useTranslation();
	return (
		<>{new Date(dateStr).toLocaleDateString(toIntlLocale(i18n.language))}</>
	);
}
