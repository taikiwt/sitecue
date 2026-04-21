import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import type { GroupedNotes, Note } from "@/app/notes/types";
import { useNotesStore } from "@/store/useNotesStore";
import { GlobalSidebar } from "./GlobalSidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(() => "/notes"),
	useSearchParams: vi.fn(
		() =>
			new URLSearchParams("domain=inbox") as unknown as ReturnType<
				typeof useSearchParams
			>,
	),
	useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock useNotesStore
vi.mock("@/store/useNotesStore", () => ({
	useNotesStore: vi.fn(),
}));

// Mock UserMenu to avoid Supabase calls
vi.mock("@/app/_components/UserMenu", () => ({
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

describe("GlobalSidebar Hierarchical UI & Prefetch", () => {
	it("should open Domains parent, then open child domain, and trigger prefetch", async () => {
		const user = userEvent.setup();
		const mockFetchContentForIds = vi.fn();

		vi.mocked(useNotesStore).mockImplementation((selector) => {
			const state = {
				groupedNotes: mockGroupedNotes,
				fetchContentForIds: mockFetchContentForIds,
			};
			return selector
				? selector(
						state as unknown as ReturnType<typeof useNotesStore.getState>,
					)
				: state;
		});

		render(<GlobalSidebar />);

		// 1. 親の Domains アコーディオンを開く
		const domainsParentButton = screen.getByRole("button", {
			name: /Domains/i,
		});
		await user.click(domainsParentButton);

		// 2. 子の github.com アコーディオンを探して開く
		const childDomainButton = screen.getByText("github.com");
		await user.click(childDomainButton);

		// 開いた瞬間にプリフェッチが発火することを検証
		expect(mockFetchContentForIds).toHaveBeenCalledWith(["n1"]);
	});

	it("should determine active state from pathname and searchParams", () => {
		vi.mocked(usePathname).mockReturnValue("/notes");
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("domain=inbox") as unknown as ReturnType<
				typeof useSearchParams
			>,
		);

		vi.mocked(useNotesStore).mockImplementation((selector) => {
			const state = {
				groupedNotes: mockGroupedNotes,
				fetchContentForIds: vi.fn(),
			};
			return selector
				? selector(
						state as unknown as ReturnType<typeof useNotesStore.getState>,
					)
				: state;
		});

		render(<GlobalSidebar />);

		// Inbox should be active
		const inboxLink = screen.getByText("Inbox").closest("a");
		expect(inboxLink?.className).toContain("bg-base-bg text-action shadow-sm");
	});
});
