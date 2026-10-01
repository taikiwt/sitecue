"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const TAB_SYNC_CHANNEL_NAME = "sitecue-cache-sync";

export type TabSyncMessage = {
	type: "INVALIDATE";
	queryKey: readonly unknown[];
};

/**
 * 他タブへキャッシュ無効化シグナルを発行する純粋関数
 */
export function broadcastCacheSync(queryKey: readonly unknown[]): void {
	if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
	try {
		const channel = new BroadcastChannel(TAB_SYNC_CHANNEL_NAME);
		channel.postMessage({
			type: "INVALIDATE",
			queryKey,
		} satisfies TabSyncMessage);
		channel.close();
	} catch (err) {
		console.warn("Failed to broadcast cache sync:", err);
	}
}

/**
 * 他タブからのキャッシュ無効化シグナルを購読し、ローカル TanStack Query を無効化するリスナーフック
 */
export function useTabSync(): void {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (typeof window === "undefined" || !("BroadcastChannel" in window))
			return;

		const channel = new BroadcastChannel(TAB_SYNC_CHANNEL_NAME);
		channel.onmessage = (event: MessageEvent<TabSyncMessage>) => {
			if (
				event.data &&
				event.data.type === "INVALIDATE" &&
				Array.isArray(event.data.queryKey)
			) {
				queryClient.invalidateQueries({ queryKey: event.data.queryKey });
			}
		};

		return () => {
			channel.close();
		};
	}, [queryClient]);
}
