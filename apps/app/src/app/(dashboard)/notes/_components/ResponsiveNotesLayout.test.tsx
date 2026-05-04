import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";

// next/navigation のモック
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
	useSearchParams: vi.fn(() => new URLSearchParams("?new=note")),
}));

// MatchMedia のモック (Mobile環境をシミュレート)
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false, // モバイル (min-width: 768px -> false)
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

describe("ResponsiveNotesLayout", () => {
	it("URLに new=note が含まれる場合、モバイル環境で詳細ペイン(Dialog)が開くこと", () => {
		render(
			<ResponsiveNotesLayout
				middleNode={<div>Middle Pane</div>}
				rightNode={<div>Right Pane Detail</div>}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		// Dialogが開いて、Right Pane Detail がレンダリングされていることを検証
		expect(screen.getByText("Right Pane Detail")).toBeInTheDocument();
	});
});
