import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Note } from "../types";
import { MiddlePaneList } from "./MiddlePaneList";

// Mock Supabase client
vi.mock("@/utils/supabase/client", () => ({
	createClient: vi.fn(() => ({
		from: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		in: vi.fn().mockResolvedValue({ error: null }),
	})),
}));

// Mock Next.js navigation
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh: refreshMock,
	}),
	useSearchParams: () => new URLSearchParams(),
}));

const mockItems: Note[] = [
	{
		id: "note-1",
		content: "Note 1",
		note_type: "info",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		user_id: "user-1",
		scope: "inbox",
		url_pattern: "",
		is_expanded: false,
		is_favorite: false,
		is_pinned: false,
		is_resolved: false,
		sort_order: 0,
		draft_id: null,
	},
	{
		id: "note-2",
		content: "Note 2",
		note_type: "idea",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		user_id: "user-1",
		scope: "inbox",
		url_pattern: "",
		is_expanded: false,
		is_favorite: false,
		is_pinned: false,
		is_resolved: false,
		sort_order: 1,
		draft_id: null,
	},
];

describe("MiddlePaneList Bulk Actions", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("should show checkboxes and action bar when selection is enabled", async () => {
		const user = userEvent.setup();
		render(
			<MiddlePaneList
				items={mockItems}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		// Initially no action bar
		expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();

		// Enable select mode first
		const selectModeButton = screen.getByTitle("Select Mode");
		await user.click(selectModeButton);

		// Check the first note
		const checkboxes = screen.getAllByRole("checkbox");
		expect(checkboxes).toHaveLength(2);

		await user.click(checkboxes[0]);

		// Now action bar should be visible
		expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

		// Cancel selection
		await user.click(screen.getByRole("button", { name: /cancel/i }));
		expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
	});

	it("should hide resolved notes by default and show them when toggle is clicked", async () => {
		const user = userEvent.setup();
		render(
			<MiddlePaneList
				items={[
					...mockItems,
					{
						...mockItems[0],
						id: "resolved-note",
						content: "Resolved Content",
						is_resolved: true,
					},
				]}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);
		expect(screen.queryByText("Resolved Content")).not.toBeInTheDocument();

		const toggleBtn = screen.getByTitle("Show Resolved Notes");
		await user.click(toggleBtn);
		expect(screen.getByText("Resolved Content")).toBeInTheDocument();
	});

	it("should filter notes by note_type when filter buttons are clicked", async () => {
		const user = userEvent.setup();
		render(
			<MiddlePaneList
				items={mockItems}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		// Initially both notes should be visible
		expect(screen.getByText("Note 1")).toBeInTheDocument(); // info note
		expect(screen.getByText("Note 2")).toBeInTheDocument(); // idea note

		// Click Idea filter
		const ideaFilterBtn = screen.getByTitle("Idea");
		await user.click(ideaFilterBtn);

		// Only Note 2 (idea) should be visible
		expect(screen.queryByText("Note 1")).not.toBeInTheDocument();
		expect(screen.getByText("Note 2")).toBeInTheDocument();

		// Click All filter
		const allFilterBtn = screen.getByRole("button", { name: "All" });
		await user.click(allFilterBtn);

		// Both should be visible again
		expect(screen.getByText("Note 1")).toBeInTheDocument();
		expect(screen.getByText("Note 2")).toBeInTheDocument();
	});
});
