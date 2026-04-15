/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GlobalNewNoteDialog from "./GlobalNewNoteDialog";

// next/navigation のモック (URLパラメータでモーダルを開いた状態を再現)
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
	useSearchParams: () =>
		new URLSearchParams("globalNew=note&exact=https://example.com/page"),
}));

describe("GlobalNewNoteDialog UI Verification", () => {
	it("renders correct labels and correctly maps exact scope to Page", async () => {
		render(<GlobalNewNoteDialog />);

		// 課題5: "Note"ラベルの検証
		expect(await screen.findByText("Note")).toBeInTheDocument();

		// 課題2: "exact" の値が "Page" として画面に表示されているか検証
		expect(await screen.findByText("Page")).toBeInTheDocument();
	});
});
