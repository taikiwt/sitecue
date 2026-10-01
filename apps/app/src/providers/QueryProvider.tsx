"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useTabSync } from "@/hooks/useTabSync";

function TabSyncListener() {
	useTabSync();
	return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Set default stale time to 5 minutes to reduce unnecessary refetches
						staleTime: 1000 * 60 * 5,
						// Workers 10ms CPU制限・Burst Fetch防止のため、ウィンドウフォーカス時の自動再フェッチを無効化
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<TabSyncListener />
			{children}
		</QueryClientProvider>
	);
}
