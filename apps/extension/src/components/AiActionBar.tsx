import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
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
	aiUsageCount: number;
	userPlan: "free" | "pro";
}

export default function AiActionBar({
	currentFullUrl,
	session,
	aiUsageCount,
	userPlan,
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

	const isLimitReached =
		userPlan === "pro" ? aiUsageCount >= 100 : aiUsageCount >= 3;

	return (
		<div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
			<button
				type="button"
				disabled={isWeaving || isLimitReached}
				onClick={handleWeave}
				title={
					isLimitReached
						? "Plan limit reached."
						: "Weave page content and notes into something new."
				}
				className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-md hover:bg-neutral-800 hover:text-white transition-all duration-200 shadow-sm w-full disabled:opacity-50 disabled:cursor-not-allowed group"
			>
				{isWeaving ? (
					<>
						<Loader2
							className="w-4 h-4 animate-spin text-current"
							aria-hidden="true"
						/>
						✨ Preparing context...
					</>
				) : (
					`✨ Weave (${userPlan === "pro" ? "Pro" : "Free"}: ${aiUsageCount} / ${
						userPlan === "pro" ? 100 : 3
					})`
				)}
			</button>
		</div>
	);
}
