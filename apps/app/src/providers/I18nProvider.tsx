"use client";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { ssrI18n, syncUserLanguage } from "@/locales/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		let isMounted = true;
		void syncUserLanguage().then(() => {
			if (isMounted) {
				setIsHydrated(true);
			}
		});
		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<I18nextProvider i18n={isHydrated ? i18n : ssrI18n}>
			{children}
		</I18nextProvider>
	);
}
