import { beforeEach, describe, expect, it } from "vitest";
import { useLayoutStore } from "./useLayoutStore";

describe("useLayoutStore", () => {
	beforeEach(() => {
		// 初期状態にリセット
		useLayoutStore.setState({
			isSidebarOpen: true,
		});
	});

	it("サイドバーの表示状態の初期値は true であること", () => {
		expect(useLayoutStore.getState().isSidebarOpen).toBe(true);
	});

	it("setIsSidebarOpen で状態を更新できること", () => {
		useLayoutStore.getState().setIsSidebarOpen(false);
		expect(useLayoutStore.getState().isSidebarOpen).toBe(false);

		useLayoutStore.getState().setIsSidebarOpen(true);
		expect(useLayoutStore.getState().isSidebarOpen).toBe(true);
	});
});
