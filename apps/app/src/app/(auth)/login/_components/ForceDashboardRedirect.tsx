"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface ForceDashboardRedirectProps {
	isSwitch?: boolean;
	nextPath?: string;
}

export function ForceDashboardRedirect({
	isSwitch = false,
	nextPath = "/",
}: ForceDashboardRedirectProps) {
	const router = useRouter();

	useEffect(() => {
		const checkSession = async () => {
			const supabase = createClient();
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (session) {
				if (isSwitch) {
					// アカウント切り替えモードの場合は自動サインアウトを実行してログイン画面を維持
					await supabase.auth.signOut();
					router.refresh();
				} else {
					// SPA ナビゲーションリダイレクト
					router.replace(nextPath);
				}
			}
		};

		checkSession();
	}, [router, isSwitch, nextPath]);

	return null;
}
