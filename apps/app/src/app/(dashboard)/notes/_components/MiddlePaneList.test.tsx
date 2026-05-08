import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { groupNotes } from "@/store/useNotesStore";
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
const mockPush = vi.fn();
const mockReplace = vi.fn();
const searchParamsMock = vi.fn(() => new URLSearchParams());
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh: refreshMock,
		push: mockPush,
		replace: mockReplace,
	}),
	usePathname: () => "/notes",
	useSearchParams: () => searchParamsMock(),
}));

// Mock useUpdateNote
vi.mock("@/hooks/useNotesQuery", () => ({
	useUpdateNote: () => ({ mutate: vi.fn() }),
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
		tags: null,
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
		tags: null,
	},
];

const mockGroupedNotes = {
	inbox: mockItems,
	drafts: [],
	domains: {},
};

describe("MiddlePaneList Bulk Actions", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		searchParamsMock.mockReturnValue(new URLSearchParams());
		vi.useRealTimers();
	});

	it("should show checkboxes and action bar when selection is enabled", async () => {
		const user = userEvent.setup();
		render(
			<MiddlePaneList
				items={mockItems}
				groupedNotes={mockGroupedNotes}
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
				groupedNotes={mockGroupedNotes}
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
				groupedNotes={mockGroupedNotes}
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
		const ideaFilterBtn = screen.getByLabelText("Idea");
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

describe("MiddlePaneList Hierarchy & SSOT", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		searchParamsMock.mockReturnValue(new URLSearchParams());
		vi.useRealTimers();
	});

	it("renders 'Domain Notes' correctly in domain pages view", () => {
		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{
					domains: { "example.com": { domainNotes: [], pages: {} } },
					inbox: [],
					drafts: [],
				}}
				currentView={null}
				currentDomain="example.com"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);
		expect(screen.getByText("Domain Notes")).toBeDefined();
	});

	it("keeps exact=all in New Note button href", () => {
		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView={null}
				currentDomain="example.com"
				currentExact="all"
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);
		const newNoteLink = screen.getByTitle("New Note here");
		expect(newNoteLink.getAttribute("href")).toContain("exact=all");
	});
});

describe("MiddlePaneList Layout Verification", () => {
	afterEach(() => {
		cleanup();
	});

	it("should have a mobile spacer and not have pt-14 on root div", () => {
		const { container } = render(
			<MiddlePaneList
				items={mockItems}
				groupedNotes={mockGroupedNotes}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		// Check root div does not have pt-14
		const rootDiv = container.firstChild as HTMLElement;
		expect(rootDiv.className).not.toContain("pt-14");

		// Check spacer exists inside scroll container
		const scrollContainer = container.querySelector(".flex-1.overflow-y-auto");
		expect(scrollContainer).toBeInTheDocument();

		// モバイル用のパディング（スペーサーの代わり）を確認
		expect(scrollContainer?.className).toContain("pb-28");
		expect(scrollContainer?.className).toContain("md:pb-0");
	});

	it("should have a mobile spacer in domains view", () => {
		const { container } = render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{
					domains: { "example.com": { domainNotes: [], pages: {} } },
					inbox: [],
					drafts: [],
				}}
				currentView="domains"
				currentDomain={null}
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		const scrollContainer = container.querySelector(".flex-1.overflow-y-auto");
		expect(scrollContainer).toBeInTheDocument();

		// モバイル用のパディング（スペーサーの代わり）を確認
		expect(scrollContainer?.className).toContain("pb-28");
		expect(scrollContainer?.className).toContain("md:pb-0");
	});
});

describe("MiddlePaneList Tab and Search Interactions", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		searchParamsMock.mockReturnValue(new URLSearchParams());
		vi.useRealTimers();
	});

	it("updates URL params when tab is clicked or search is submitted", async () => {
		const user = userEvent.setup();
		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		// タブのクリック
		const domainsTab = screen.getByRole("button", { name: /Domains/i });
		await user.click(domainsTab);
		expect(mockPush).toHaveBeenCalledWith(
			expect.stringContaining("view=domains"),
		);

		// 検索の実行
		const searchInput = screen.getByPlaceholderText("Search notes...");
		await user.type(searchInput, "test query{Enter}");
		expect(mockPush).toHaveBeenCalledWith(
			expect.stringContaining("q=test+query"),
		);
	});

	it("cleans up context parameters when switching tabs", async () => {
		const user = userEvent.setup();
		// Mock searchParams to have pollution
		searchParamsMock.mockReturnValue(
			new URLSearchParams(
				"view=domains&domain=example.com&exact=all&noteId=123&q=test",
			),
		);

		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="domains"
				currentDomain="example.com"
				currentExact="all"
				selectedNoteId="123"
				selectedDraftId={null}
			/>,
		);

		const inboxTab = screen.getByRole("button", { name: /Inbox/i });
		await user.click(inboxTab);

		// mockPush should be called with ONLY view=inbox
		const pushCall = mockPush.mock.calls[0][0];
		const resultParams = new URLSearchParams(pushCall.split("?")[1]);

		expect(resultParams.get("view")).toBe("inbox");
		expect(resultParams.has("domain")).toBe(false);
		expect(resultParams.has("exact")).toBe(false);
		expect(resultParams.has("noteId")).toBe(false);
		expect(resultParams.has("q")).toBe(false);
	});

	it("clears search input when clear button is clicked", async () => {
		const user = userEvent.setup();
		searchParamsMock.mockReturnValue(new URLSearchParams("view=inbox&q=test"));

		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		const searchInput = screen.getByPlaceholderText(
			"Search notes...",
		) as HTMLInputElement;
		expect(searchInput.value).toBe("test");

		const clearButton = screen.getByLabelText("Clear search");
		await user.click(clearButton);

		expect(searchInput.value).toBe("");
		expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining("q="));
	});

	it("excludes 'inbox' from domains list", () => {
		const notes: Note[] = [
			{
				...mockItems[0],
				id: "inbox-note",
				scope: "inbox",
				url_pattern: "inbox",
			},
			{
				...mockItems[0],
				id: "domain-note",
				scope: "domain",
				url_pattern: "https://example.com",
			},
		];
		const groupedNotes = groupNotes(notes, []);

		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={groupedNotes}
				currentView="domains"
				currentDomain={null}
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		expect(screen.getByText("example.com")).toBeDefined();
		expect(screen.queryByText("inbox")).not.toBeInTheDocument();
	});

	it("filters domains list based on search query", async () => {
		const groupedNotes = {
			domains: {
				"apple.com": { domainNotes: [], pages: {} },
				"google.com": { domainNotes: [], pages: {} },
			},
			inbox: [],
			drafts: [],
		};

		// 検索クエリを 'google' に設定
		searchParamsMock.mockReturnValue(
			new URLSearchParams("view=domains&q=google"),
		);

		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={groupedNotes}
				currentView="domains"
				currentDomain={null}
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		expect(screen.getByText("google.com")).toBeDefined();
		expect(screen.queryByText("apple.com")).not.toBeInTheDocument();
	});

	it("updates URL with debounce when typing in search input", async () => {
		vi.useFakeTimers();

		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		const searchInput = screen.getByPlaceholderText("Search notes...");
		fireEvent.change(searchInput, { target: { value: "debounced" } });

		// advance timers to trigger the debounce
		vi.advanceTimersByTime(300);

		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining("q=debounced"),
		);

		vi.useRealTimers();
	});
});

describe("MiddlePaneList Back Button", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		searchParamsMock.mockReturnValue(new URLSearchParams());
		vi.useRealTimers();
	});

	it("shows the back button when in a domain drilldown", () => {
		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="domains"
				currentDomain="example.com"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		expect(screen.getByTitle("Go back")).toBeInTheDocument();
	});

	it("hides the back button when not in a drilldown", () => {
		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="domains"
				currentDomain={null}
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		expect(screen.queryByTitle("Go back")).not.toBeInTheDocument();
	});

	it("hides the back button when currentDomain is 'inbox'", () => {
		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="inbox"
				currentDomain="inbox"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		expect(screen.queryByTitle("Go back")).not.toBeInTheDocument();
	});

	it("removes 'exact' parameter when clicking back from exact view", async () => {
		const user = userEvent.setup();
		searchParamsMock.mockReturnValue(
			new URLSearchParams("view=domains&domain=example.com&exact=all"),
		);

		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="domains"
				currentDomain="example.com"
				currentExact="all"
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		const backBtn = screen.getByTitle("Go back");
		await user.click(backBtn);

		const pushCall = mockPush.mock.calls[0][0];
		const resultParams = new URLSearchParams(pushCall.split("?")[1]);

		expect(resultParams.get("domain")).toBe("example.com");
		expect(resultParams.has("exact")).toBe(false);
	});

	it("removes 'domain' parameter and sets view=domains when clicking back from domain view", async () => {
		const user = userEvent.setup();
		searchParamsMock.mockReturnValue(
			new URLSearchParams("view=domains&domain=example.com"),
		);

		render(
			<MiddlePaneList
				items={[]}
				groupedNotes={{ domains: {}, inbox: [], drafts: [] }}
				currentView="domains"
				currentDomain="example.com"
				currentExact={null}
				selectedNoteId={null}
				selectedDraftId={null}
			/>,
		);

		const backBtn = screen.getByTitle("Go back");
		await user.click(backBtn);

		const pushCall = mockPush.mock.calls[0][0];
		const resultParams = new URLSearchParams(pushCall.split("?")[1]);

		expect(resultParams.has("domain")).toBe(false);
		expect(resultParams.has("exact")).toBe(false);
		expect(resultParams.get("view")).toBe("domains");
	});
});
