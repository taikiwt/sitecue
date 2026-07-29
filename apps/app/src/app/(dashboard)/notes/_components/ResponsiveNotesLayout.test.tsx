import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";

// useMediaQuery のモック
vi.mock("@/hooks/use-media-query", () => ({
	useMediaQuery: (query: string) => query.includes("1024px"),
}));

// next/navigation のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
}));

describe("ResponsiveNotesLayout - App Shell & Hydration Class Checks", () => {
	it("renders PC大画面コンテナに hidden lg:flex クラスが付与されていること", () => {
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
});
