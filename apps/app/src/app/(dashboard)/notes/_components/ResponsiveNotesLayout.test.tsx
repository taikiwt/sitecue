import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";

let mockMediaQueryMatches = false;

// useMediaQuery のモック
vi.mock("@/hooks/use-media-query", () => ({
	useMediaQuery: () => mockMediaQueryMatches,
}));

// next/navigation のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
}));

describe("ResponsiveNotesLayout - Mobile Animation & PopState Integration", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockMediaQueryMatches = false; // モバイル画面 (767px以下) をシミュレート
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders PC大画面コンテナに hidden lg:flex クラスが付与されていること", () => {
		mockMediaQueryMatches = true; // PC画面 (1024px以上)
		const { container } = render(
			<ResponsiveNotesLayout
				middleNode={<div data-testid="middle">Middle</div>}
				rightNode={<div data-testid="right">Right</div>}
				selectedDraftId={null}
				selectedNoteId="note-123"
			/>,
		);

		const pcContainer = container.querySelector(".hidden.lg\\:flex");
		expect(pcContainer).toBeInTheDocument();
		expect(screen.getByTestId("middle")).toBeInTheDocument();
		expect(screen.getByTestId("right")).toBeInTheDocument();
	});

	it("popstate イベント発火時に duration-0 クラスがモバイル詳細スタックに一時付与されること", () => {
		mockMediaQueryMatches = false; // モバイル画面
		render(
			<ResponsiveNotesLayout
				middleNode={<div data-testid="middle">Middle</div>}
				rightNode={<div data-testid="right">Right</div>}
				selectedDraftId={null}
				selectedNoteId="note-123"
			/>,
		);

		const mobileStack = screen.getByTestId("mobile-detail-stack");
		expect(mobileStack).toHaveClass("duration-300");

		// popstate イベントを発火
		act(() => {
			window.dispatchEvent(new Event("popstate"));
		});

		// duration-0 クラスが付与されること
		expect(mobileStack).toHaveClass("duration-0");

		// 200ms 経過後、duration-300 に復元すること
		act(() => {
			vi.advanceTimersByTime(200);
		});

		expect(mobileStack).toHaveClass("duration-300");
		expect(mobileStack).not.toHaveClass("duration-0");
	});
});
