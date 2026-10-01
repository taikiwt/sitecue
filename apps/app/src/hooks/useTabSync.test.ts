/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	broadcastCacheSync,
	TAB_SYNC_CHANNEL_NAME,
	useTabSync,
} from "./useTabSync";

interface MockChannelInstance {
	name: string;
	postMessage: ReturnType<typeof vi.fn>;
	close: ReturnType<typeof vi.fn>;
	onmessage: ((ev: MessageEvent) => void) | null;
}

describe("useTabSync & broadcastCacheSync", () => {
	let postMessageMock: ReturnType<typeof vi.fn>;
	let closeMock: ReturnType<typeof vi.fn>;
	let channelInstances: MockChannelInstance[];

	beforeEach(() => {
		channelInstances = [];
		postMessageMock = vi.fn();
		closeMock = vi.fn();

		// BroadcastChannel のモック (new で呼べるよう function を使用)
		// biome-ignore lint/complexity/useArrowFunction: Constructor mock for new BroadcastChannel in Vitest
		globalThis.BroadcastChannel = vi.fn(function (name: string) {
			const instance: MockChannelInstance = {
				name,
				postMessage: postMessageMock,
				close: closeMock,
				onmessage: null,
			};
			channelInstances.push(instance);
			return instance;
		}) as unknown as typeof BroadcastChannel;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("broadcastCacheSync が指定されたチャンネルと queryKey でメッセージを送信して閉じること", () => {
		broadcastCacheSync(["notes"]);

		expect(globalThis.BroadcastChannel).toHaveBeenCalledWith(
			TAB_SYNC_CHANNEL_NAME,
		);
		expect(postMessageMock).toHaveBeenCalledWith({
			type: "INVALIDATE",
			queryKey: ["notes"],
		});
		expect(closeMock).toHaveBeenCalled();
	});

	it("useTabSync がメッセージを受信した際に queryClient.invalidateQueries を実行すること", () => {
		const queryClient = new QueryClient();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);

		const { unmount } = renderHook(() => useTabSync(), { wrapper });

		expect(channelInstances.length).toBeGreaterThan(0);
		const listenerInstance = channelInstances[0];

		// 受信シミュレーション
		if (listenerInstance.onmessage) {
			listenerInstance.onmessage({
				data: {
					type: "INVALIDATE",
					queryKey: ["notes"],
				},
			} as MessageEvent);
		}

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notes"] });

		// アンマウント時に channel.close が呼ばれること
		unmount();
		expect(closeMock).toHaveBeenCalled();
	});
});
