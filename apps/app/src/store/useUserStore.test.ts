/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { useUserStore } from "./useUserStore";

test("should increment aiUsageCount correctly", () => {
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
