import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// Mock hooks
import { useRouter, useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";

// Mock hooks
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		forward: vi.fn(),
		refresh: vi.fn(),
	})),
	useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/hooks/use-media-query", () => ({
	useMediaQuery: vi.fn(),
}));

describe("ResponsiveNotesLayout", () => {
	it("renders both panes when isDesktop is true", () => {
		vi.mocked(useMediaQuery).mockReturnValue(true);

		render(
			<ResponsiveNotesLayout
				middleNode={<div data-testid="middle-node">Middle</div>}
				rightNode={<div data-testid="right-node">Right</div>}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		expect(screen.getByTestId("middle-node")).toBeInTheDocument();
		expect(screen.getByTestId("right-node")).toBeInTheDocument();
	});

	it("renders only middle pane when isDesktop is false and no detail is selected", () => {
		vi.mocked(useMediaQuery).mockReturnValue(false);

		render(
			<ResponsiveNotesLayout
				middleNode={<div data-testid="middle-node">Middle</div>}
				rightNode={<div data-testid="right-node">Right</div>}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		expect(screen.getByTestId("middle-node")).toBeInTheDocument();
		const stack = screen.getByTestId("mobile-detail-stack");
		expect(stack.className).toContain("translate-x-full");
		expect(stack).toHaveAttribute("aria-hidden", "true");
	});

	it("applies scroll lock to main content when drawer is open on mobile", () => {
		vi.mocked(useMediaQuery).mockReturnValue(false);

		const { container } = render(
			<ResponsiveNotesLayout
				middleNode={<div data-testid="middle-node">Middle</div>}
				rightNode={<div data-testid="right-node">Right</div>}
				selectedNoteId="note-1"
				selectedDraftId={null}
			/>,
		);
		const main = container.querySelector("main");
		expect(main).toHaveClass("pointer-events-none");
		expect(main).toHaveAttribute("aria-hidden", "true");
		// inert属性が正しく付与されていることを確認
		expect(main).toHaveAttribute("inert");
	});

	it("モバイル環境でStack要素が正しくレンダリングされ、閉じるボタンが機能するか", async () => {
		vi.mocked(useMediaQuery).mockReturnValue(false); // Mobile
		const push = vi.fn();
		vi.mocked(useRouter).mockReturnValue({
			push,
			replace: vi.fn(),
			prefetch: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
		});
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams(
				"noteId=123",
			) as unknown as ReturnType<typeof useSearchParams>,
		);

		render(
			<ResponsiveNotesLayout
				middleNode={<div data-testid="middle">List</div>}
				rightNode={<div data-testid="right">Detail</div>}
				selectedNoteId="123"
				selectedDraftId={null}
			/>,
		);

		// クラス名に translate-x-0 が含まれること（開いている状態）
		const stack = screen.getByTestId("mobile-detail-stack");
		expect(stack.className).toContain("translate-x-0");



		// 戻るボタンのクリック
		const backButton = screen.getByRole("button", { name: /Notes/i });
		fireEvent.click(backButton);

		// アニメーション用に300ms待機してからpushされることを検証
		await waitFor(() => {
			expect(push).toHaveBeenCalledWith("/notes?");
		}, { timeout: 500 });
	});
});
