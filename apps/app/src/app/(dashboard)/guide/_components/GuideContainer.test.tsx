import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuideContainer } from "./GuideContainer";

describe("GuideContainer", () => {
	it("初期表示（All）で Basecamp と Extension のショートカットおよび機能ガイドが表示され、戻るリンクを持つこと", () => {
		render(<GuideContainer />);

		expect(screen.getByText("Guide & Shortcuts")).toBeInTheDocument();
		expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
		expect(screen.getByText("Features & Button Placement")).toBeInTheDocument();

		const backLink = screen.getByRole("link", {
			name: /Go back to Launchpad/i,
		});
		expect(backLink).toHaveAttribute("href", "/");

		// Basecamp と Extension の双方が表示されること
		expect(screen.getByText("Draft Studio & AI Weave")).toBeInTheDocument();
		expect(
			screen.getByText("Side Panel Header & Context Lock"),
		).toBeInTheDocument();
	});

	it("Basecamp / Extension フィルタボタンで表示項目が絞り込まれること", () => {
		render(<GuideContainer />);

		// Basecamp のみに絞り込み
		fireEvent.click(screen.getByRole("button", { name: "Basecamp" }));
		expect(screen.getByText("Draft Studio & AI Weave")).toBeInTheDocument();
		expect(
			screen.queryByText("Side Panel Header & Context Lock"),
		).not.toBeInTheDocument();

		// Extension のみに絞り込み
		fireEvent.click(screen.getByRole("button", { name: "Extension" }));
		expect(
			screen.queryByText("Draft Studio & AI Weave"),
		).not.toBeInTheDocument();
		expect(
			screen.getByText("Side Panel Header & Context Lock"),
		).toBeInTheDocument();

		// All に戻す
		fireEvent.click(screen.getByRole("button", { name: "All" }));
		expect(screen.getByText("Draft Studio & AI Weave")).toBeInTheDocument();
		expect(
			screen.getByText("Side Panel Header & Context Lock"),
		).toBeInTheDocument();
	});
});
