import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";
import { useMediaQuery } from "@/hooks/use-media-query";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-media-query", () => ({
	useMediaQuery: vi.fn(),
}));

describe("ResponsiveNotesLayout", () => {
	it("1024px以上のデスクトップ環境でmiddleとrightを並列描画すること", () => {
		vi.mocked(useMediaQuery).mockImplementation((query) => query.includes("min-width: 1024px"));

		render(
			<ResponsiveNotesLayout
				middleNode={<div>Middle List</div>}
				rightNode={<div>Right Detail</div>}
				selectedNoteId="note-1"
				selectedDraftId={null}
			/>
		);

		expect(screen.getByText("Middle List")).toBeDefined();
		expect(screen.getByText("Right Detail")).toBeDefined();
	});

	it("768px-1023pxのiPad縦持ち環境で部分オーバーレイ・コンテキストが成立すること", () => {
		vi.mocked(useMediaQuery).mockImplementation((query) => query.includes("max-width: 1023px"));

		render(
			<ResponsiveNotesLayout
				middleNode={<div>Middle List</div>}
				rightNode={<div>Right Detail</div>}
				selectedNoteId="note-1"
				selectedDraftId={null}
			/>
		);

		expect(screen.getByText("Middle List")).toBeDefined();
		expect(screen.getByText("Right Detail")).toBeDefined();
	});
});
