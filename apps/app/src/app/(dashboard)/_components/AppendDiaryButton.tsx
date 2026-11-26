"use client";

import { useTranslation } from "react-i18next";
import { useLayoutStore } from "@/store/useLayoutStore";

export function AppendDiaryButton() {
	const { t } = useTranslation();
	const openGlobalNewModal = useLayoutStore(
		(state) => state.openGlobalNewModal,
	);

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		openGlobalNewModal("diary");
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="text-[11px] text-neutral-400 hover:text-action font-mono tracking-wide uppercase transition-colors underline decoration-dotted underline-offset-4 cursor-pointer"
		>
			{t("dashboard.appendTodayDiary")}
		</button>
	);
}
