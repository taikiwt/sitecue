import { useQueryClient } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { useFetchDrafts } from "@/hooks/useDraftsQuery";
import { useFetchNotes } from "@/hooks/useNotesQuery";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useNotesStore } from "@/store/useNotesStore";
import { GlobalSidebar } from "./GlobalSidebar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	usePathname: vi.fn(() => "/notes"),
	useSearchParams: vi.fn(
		() =>
			new URLSearchParams("domain=inbox") as Partial<
				ReturnType<typeof useSearchParams>
			> as ReturnType<typeof useSearchParams>,
	),
	useRouter: vi.fn(() => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	})),
}));

// Mock react-query
vi.mock("@tanstack/react-query", () => ({
	useQueryClient: vi.fn(() => ({
		invalidateQueries: vi.fn(),
	})),
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
vi.mock("@/app/(dashboard)/_components/UserMenu", () => ({
	UserMenu: () => <div data-testid="user-menu" />,
}));

describe("GlobalSidebar Hierarchical UI & Prefetch", () => {
	it("should determine active state from pathname", () => {
		vi.mocked(usePathname).mockReturnValue("/notes");
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
		);

		vi.mocked(useFetchNotes).mockReturnValue({
			data: [],
			isLoading: false,
		} as Partial<ReturnType<typeof useFetchNotes>> as ReturnType<
			typeof useFetchNotes
		>);
		vi.mocked(useFetchDrafts).mockReturnValue({
			data: [],
			isLoading: false,
		} as Partial<ReturnType<typeof useFetchDrafts>> as ReturnType<
			typeof useFetchDrafts
		>);
		vi.mocked(useNotesStore).mockReturnValue({
			searchResults: null,
		} as Partial<ReturnType<typeof useNotesStore>> as ReturnType<
			typeof useNotesStore
		>);

		render(<GlobalSidebar onSearchOpen={vi.fn()} />);

		// Notes should be active
		const notesLink = screen.getByTitle("Notes").closest("a");
		expect(notesLink?.className).toContain("bg-base-bg text-action scale-105");
	});

	it("should open global new modal in gate mode when Logo button is clicked", () => {
		useLayoutStore.getState().closeGlobalNewModal();

		vi.mocked(usePathname).mockReturnValue("/notes");
		vi.mocked(useSearchParams).mockReturnValue(
			new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
		);

		vi.mocked(useFetchNotes).mockReturnValue({
			data: [],
			isLoading: false,
		} as Partial<ReturnType<typeof useFetchNotes>> as ReturnType<
			typeof useFetchNotes
		>);
		vi.mocked(useFetchDrafts).mockReturnValue({
			data: [],
			isLoading: false,
		} as Partial<ReturnType<typeof useFetchDrafts>> as ReturnType<
			typeof useFetchDrafts
		>);
		vi.mocked(useNotesStore).mockReturnValue({
			searchResults: null,
		} as Partial<ReturnType<typeof useNotesStore>> as ReturnType<
			typeof useNotesStore
		>);

		render(<GlobalSidebar onSearchOpen={vi.fn()} />);

		const newNoteBtn = screen.getByTitle("New Note");
		fireEvent.click(newNoteBtn);

		expect(useLayoutStore.getState().globalNewModal.isOpen).toBe(true);
		expect(useLayoutStore.getState().globalNewModal.mode).toBe("gate");
	});

	it("should invalidate notes and drafts queries when pathname is present", () => {
		const mockInvalidateQueries = vi.fn();
		vi.mocked(useQueryClient).mockReturnValue({
			invalidateQueries: mockInvalidateQueries,
		} as Partial<ReturnType<typeof useQueryClient>> as ReturnType<
			typeof useQueryClient
		>);

		vi.mocked(usePathname).mockReturnValue("/notes");
		vi.mocked(useFetchNotes).mockReturnValue({
			data: [],
			isLoading: false,
		} as Partial<ReturnType<typeof useFetchNotes>> as ReturnType<
			typeof useFetchNotes
		>);
		vi.mocked(useFetchDrafts).mockReturnValue({
			data: [],
			isLoading: false,
		} as Partial<ReturnType<typeof useFetchDrafts>> as ReturnType<
			typeof useFetchDrafts
		>);
		vi.mocked(useNotesStore).mockReturnValue({
			searchResults: null,
		} as Partial<ReturnType<typeof useNotesStore>> as ReturnType<
			typeof useNotesStore
		>);

		render(<GlobalSidebar onSearchOpen={vi.fn()} />);

		expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["notes"] });
		expect(mockInvalidateQueries).toHaveBeenCalledWith({
			queryKey: ["drafts"],
		});
	});
});
