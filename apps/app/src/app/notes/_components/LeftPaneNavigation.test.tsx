/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useNotesStore } from "@/store/useNotesStore";
import type { GroupedNotes, Note } from "../types";
import { LeftPaneNavigation } from "./LeftPaneNavigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
}));

// Mock useNotesStore
vi.mock("@/store/useNotesStore", () => ({
	useNotesStore: vi.fn(),
}));

// Mock UserMenu to avoid Supabase calls
vi.mock("../../_components/UserMenu", () => ({
	UserMenu: () => <div data-testid="user-menu" />,
}));

const mockGroupedNotes = {
	inbox: [],
	drafts: [],
	domains: {
		"github.com": {
			domainNotes: [
				{
					id: "n1",
					url_pattern: "github.com",
					scope: "domain",
					content: undefined,
				} as unknown as Note,
			],
			pages: {},
		},
	},
} as unknown as GroupedNotes;

describe("LeftPaneNavigation", () => {
	it("should keep DOMAINS closed by default and fetch content on open", async () => {
		const user = userEvent.setup();
		const mockFetchContentForIds = vi.fn();

		vi.mocked(useNotesStore).mockImplementation((selector) => {
			return selector({
				fetchContentForIds: mockFetchContentForIds,
			} as unknown as Parameters<typeof selector>[0]);
		});

		render(
			<LeftPaneNavigation
				groupedNotes={mockGroupedNotes}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
			/>,
		);

		// ドメイン名が表示されていることを確認
		const triggerButton = screen.getByRole("button", {
			name: /github\.com/i,
		});
		expect(triggerButton).toBeDefined();

		// 最初はアコーディオンが閉じていることを確認
		expect(triggerButton.getAttribute("aria-expanded")).toBe("false");

		// クリックして開く
		await user.click(triggerButton);

		// 開いた瞬間に、該当ドメインのノートID("n1")で fetchContentForIds が呼ばれることを検証
		expect(mockFetchContentForIds).toHaveBeenCalledWith(["n1"]);
		expect(triggerButton.getAttribute("aria-expanded")).toBe("true");
	});
});
