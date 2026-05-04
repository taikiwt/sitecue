import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileBottomNav } from "./MobileBottomNav";

// next/navigationのモック
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
}));

describe("MobileBottomNav", () => {
	it("renders correctly within Suspense boundary without crashing", () => {
		const { container } = render(
			<MobileBottomNav onSearchOpen={vi.fn()} />
		);
		// DOMの取得検証
		expect(container.querySelector("nav")).toBeInTheDocument();
	});
});
