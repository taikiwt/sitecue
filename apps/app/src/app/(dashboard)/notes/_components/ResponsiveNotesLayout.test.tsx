import { render, screen } from "@testing-library/react";
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
		expect(screen.queryByTestId("right-node")).not.toBeInTheDocument();
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

	it("delays routing and simplifies parameter deletion when closing the drawer on mobile", async () => {
		vi.useFakeTimers();
		vi.mocked(useMediaQuery).mockReturnValue(false);
		const push = vi.fn();
		vi.mocked(useRouter).mockReturnValue({
			push,
			replace: vi.fn(),
			prefetch: vi.fn(),
			back: vi.fn(),
			forward: vi.fn(),
			refresh: vi.fn(),
		});
		// searchParams をモックし、view=drafts が存在している状態をシミュレート
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("view=drafts&draftId=draft-1"),
		);

		render(
			<ResponsiveNotesLayout
				middleNode={<div data-testid="middle-node">Middle</div>}
				rightNode={<div data-testid="right-node">Right</div>}
				selectedNoteId={null}
				selectedDraftId="draft-1"
			/>,
		);

		const backButton = screen.getByRole("button", { name: /notes/i });
		backButton.click();

		// Should not have called push yet
		expect(push).not.toHaveBeenCalled();

		// Fast-forward 300ms
		vi.advanceTimersByTime(300);

		// draftId が削除され、view=drafts が維持されることを確認
		expect(push).toHaveBeenCalledWith("/notes?view=drafts");

		vi.useRealTimers();
	});
});
