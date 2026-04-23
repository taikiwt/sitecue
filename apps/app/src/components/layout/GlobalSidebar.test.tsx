import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useFetchDrafts } from "@/hooks/useDraftsQuery";
import { useFetchNoteContents, useFetchNotes } from "@/hooks/useNotesQuery";
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

// Mock Hooks
vi.mock("@/hooks/useNotesQuery", () => ({
	useFetchNotes: vi.fn(),
	useFetchNoteContents: vi.fn(),
}));

vi.mock("@/hooks/useDraftsQuery", () => ({
	useFetchDrafts: vi.fn(),
}));

// Mock useNotesStore
vi.mock("@/store/useNotesStore", async () => {
	const actual = (await vi.importActual(
		"@/store/useNotesStore",
	)) as unknown as object;
	return {
		...actual,
		useNotesStore: vi.fn(),
	};
});

// Mock UserMenu to avoid Supabase calls
vi.mock("@/app/_components/UserMenu", () => ({
	UserMenu: () => <div data-testid="user-menu" />,
}));

const mockNotes = [
	{
		id: "n1",
		url_pattern: "github.com",
		scope: "domain",
		note_type: "info",
		created_at: new Date().toISOString(),
	},
];

describe("GlobalSidebar Hierarchical UI & Prefetch", () => {
	it("should open Domains parent, then open child domain, and trigger prefetch", async () => {
		const user = userEvent.setup();
		const mockMutate = vi.fn();

		vi.mocked(useFetchNotes).mockReturnValue({
			data: mockNotes,
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchNotes>);
		vi.mocked(useFetchDrafts).mockReturnValue({
			data: [],
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchDrafts>);
		vi.mocked(useFetchNoteContents).mockReturnValue({
			mutate: mockMutate,
		} as unknown as ReturnType<typeof useFetchNoteContents>);
		vi.mocked(useNotesStore).mockReturnValue({
			searchResults: null,
		} as unknown as ReturnType<typeof useNotesStore>);

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
		expect(mockMutate).toHaveBeenCalledWith(["n1"]);
	});

	it("should determine active state from pathname and searchParams", () => {
		vi.mocked(usePathname).mockReturnValue("/notes");
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("domain=inbox") as unknown as ReturnType<
				typeof useSearchParams
			>,
		);

		vi.mocked(useFetchNotes).mockReturnValue({
			data: [],
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchNotes>);
		vi.mocked(useFetchDrafts).mockReturnValue({
			data: [],
			isLoading: false,
		} as unknown as ReturnType<typeof useFetchDrafts>);
		vi.mocked(useNotesStore).mockReturnValue({
			searchResults: null,
		} as unknown as ReturnType<typeof useNotesStore>);

		render(<GlobalSidebar />);

		// Inbox should be active
		const inboxLink = screen.getByText("Inbox").closest("a");
		expect(inboxLink?.className).toContain("bg-base-bg text-action shadow-sm");
	});
});
