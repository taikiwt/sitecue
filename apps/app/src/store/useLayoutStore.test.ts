import { beforeEach, describe, expect, it } from "vitest";
import { useLayoutStore } from "./useLayoutStore";

describe("useLayoutStore", () => {
	beforeEach(() => {
		// 初期状態にリセット
		useLayoutStore.setState({
			isSidebarOpen: true,
			isMobileHeaderVisible: true,
		});
	});

	it("モバイルヘッダーの表示状態の初期値は true であること", () => {
		expect(useLayoutStore.getState().isMobileHeaderVisible).toBe(true);
	});

	it("setIsMobileHeaderVisible で状態を更新できること", () => {
		useLayoutStore.getState().setIsMobileHeaderVisible(false);
		expect(useLayoutStore.getState().isMobileHeaderVisible).toBe(false);

		useLayoutStore.getState().setIsMobileHeaderVisible(true);
		expect(useLayoutStore.getState().isMobileHeaderVisible).toBe(true);
	});
});
