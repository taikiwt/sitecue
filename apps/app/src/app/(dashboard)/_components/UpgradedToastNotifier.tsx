"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export function UpgradedToastNotifier() {
	const { t } = useTranslation();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (searchParams.get("upgraded") === "true") {
			toast.success(t("dashboard.upgradedToast"), { duration: 4000 });
			queryClient.invalidateQueries();
			const url = new URL(window.location.href);
			url.searchParams.delete("upgraded");
			window.history.replaceState({}, "", url.pathname + url.search);
		}
	}, [searchParams, queryClient, t]);

	return null;
}
