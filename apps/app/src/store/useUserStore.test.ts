/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUserStore } from "./useUserStore";

describe("useUserStore", () => {
	it("should open and close paywall correctly", () => {
		const { result } = renderHook(() => useUserStore());

		expect(result.current.isPaywallOpen).toBe(false);
		expect(result.current.paywallType).toBe("notes");

		act(() => {
			result.current.openPaywall("drafts");
		});

		expect(result.current.isPaywallOpen).toBe(true);
		expect(result.current.paywallType).toBe("drafts");

		act(() => {
			result.current.closePaywall();
		});

		expect(result.current.isPaywallOpen).toBe(false);
	});

	it("should increment aiUsageCount correctly", () => {
		const { result } = renderHook(() => useUserStore());

		act(() => {
			result.current.setUserData(5, "free");
		});
		expect(result.current.aiUsageCount).toBe(5);

		act(() => {
			result.current.incrementAiUsage();
		});
		expect(result.current.aiUsageCount).toBe(6);
	});
});
