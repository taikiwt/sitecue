import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";

// Mock hooks
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
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
		// Right node should not be in the document if Drawer is closed
		expect(screen.queryByTestId("right-node")).not.toBeInTheDocument();
	});
});
