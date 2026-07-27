"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ServiceWorkerRegister() {
	const router = useRouter();

	useEffect(() => {
		if (
			!("serviceWorker" in navigator) ||
			process.env.NODE_ENV !== "production"
		) {
			return;
		}

		navigator.serviceWorker
			.register("/sw.js")
			.catch((error) => console.error("SW registration failed:", error));

		const handleRefresh = async () => {
			if (document.visibilityState === "visible") {
				try {
					const registration = await navigator.serviceWorker.ready;
					await registration.update();
				} catch (e) {
					console.error("SW update failed:", e);
				}
				router.refresh();
			}
		};

		window.addEventListener("visibilitychange", handleRefresh);
		window.addEventListener("focus", handleRefresh);

		return () => {
			window.removeEventListener("visibilitychange", handleRefresh);
			window.removeEventListener("focus", handleRefresh);
		};
	}, [router]);

	return null;
}
