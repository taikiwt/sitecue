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

describe("LeftPaneNavigation Hierarchical UI & Prefetch", () => {
	it("should open Domains parent, then open child domain, and trigger prefetch", async () => {
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

		// 1. 親の Domains アコーディオンを開く (初期は閉じている想定のテスト)
		const domainsParentButton = screen.getByRole("button", { name: /Domains/i });
		await user.click(domainsParentButton);

		// 2. 子の github.com アコーディオンを探して開く
		const childDomainButton = screen.getByText("github.com");
		await user.click(childDomainButton);

		// 開いた瞬間にプリフェッチが発火することを検証
		expect(mockFetchContentForIds).toHaveBeenCalledWith(["n1"]);
	});
});
