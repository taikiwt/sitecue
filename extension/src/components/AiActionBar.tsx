import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

// 安全装置：指定ミリ秒を超えたら強制的にPromiseをRejectする
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
	let timeoutId: ReturnType<typeof setTimeout>;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(
			() => reject(new Error("Timeout: 処理が長すぎます")),
			ms,
		);
	});
	return Promise.race([promise, timeoutPromise]).finally(() =>
		clearTimeout(timeoutId),
	);
};

interface AiActionBarProps {
	currentFullUrl: string;
	session: Session;
}

export default function AiActionBar({
	currentFullUrl,
	session,
}: AiActionBarProps) {
	const [isWeaving, setIsWeaving] = useState(false);

	const handleWeave = async () => {
		if (!currentFullUrl) return;
		setIsWeaving(true);
		try {
			const urlObj = new URL(currentFullUrl);
			const originPattern = `${urlObj.origin}/*`;
			const granted = await chrome.permissions.request({
				origins: [originPattern],
			});
			if (!granted) {
				throw new Error("Permission denied");
			}

			const dashboardUrl =
				import.meta.env.VITE_WEB_URL || "http://127.0.0.1:3000";
			const cleanUrl = currentFullUrl.replace(/^https?:\/\//, "");

			const tabs = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			const tab = tabs[0];
			let contextId = "";

			if (tab?.id) {
				const results = await withTimeout(
					chrome.scripting.executeScript({
						target: { tabId: tab.id },
						func: () => document.body.innerText.slice(0, 50000),
					}),
					3000,
				);

				if (results?.[0]?.result) {
					const pageText = results[0].result as string;

					const supabase = createClient(
						import.meta.env.VITE_SUPABASE_URL,
						import.meta.env.VITE_SUPABASE_ANON_KEY,
						{
							global: {
								headers: {
									Authorization: `Bearer ${session.access_token}`,
								},
							},
						},
					);

					const { data, error } = await supabase
						.from("sitecue_page_contents")
						.insert({
							user_id: session.user.id,
							url: currentFullUrl,
							content: pageText,
						})
						.select()
						.single();

					if (!error && data) {
						contextId = data.id as string;
					}
				}
			}

			let targetUrl = `${dashboardUrl}/weave?url=${encodeURIComponent(cleanUrl)}`;
			if (contextId) {
				targetUrl += `&context_id=${contextId}`;
			}
			window.open(targetUrl, "_blank");
			window.close();
		} catch (err: unknown) {
			console.warn(
				"Weave aborted:",
				err instanceof Error ? err.message : "Unknown error",
			);
			const dashboardUrl =
				import.meta.env.VITE_WEB_URL || "http://127.0.0.1:3000";
			const cleanUrl = currentFullUrl.replace(/^https?:\/\//, "");
			window.open(
				`${dashboardUrl}/weave?url=${encodeURIComponent(cleanUrl)}`,
				"_blank",
			);
			toast.error("Failed to prepare context. Opening standard weave.");
		} finally {
			setIsWeaving(false);
		}
	};

	return (
		<div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
			<button
				type="button"
				disabled={isWeaving}
				onClick={handleWeave}
				className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-neutral-900 transition-colors shadow-sm w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isWeaving ? (
					<>
						<Loader2
							className="w-4 h-4 animate-spin text-neutral-600"
							aria-hidden="true"
						/>
						錬成準備中...
					</>
				) : (
					"✨ Weave"
				)}
			</button>
		</div>
	);
}
