"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

/**
 * ForceDashboardRedirect
 *
 * ログイン済みの場合にネイティブの window.location.replace("/") を実行し、
 * Next.js のキャッシュ/ナビゲーションバグ（認証済みユーザーが /login に留まる等）を
 * ハードリロードを伴って強制的に解消するコンポーネント。
 */
export function ForceDashboardRedirect() {
	useEffect(() => {
		const checkSession = async () => {
			const supabase = createClient();
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (session) {
				// ハードリダイレクト
				window.location.replace("/");
			}
		};

		checkSession();
	}, []);

	return null;
}
