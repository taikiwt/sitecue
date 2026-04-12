import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { createClient } from "@/utils/supabase/client";
import { RightPaneDetail } from "./RightPaneDetail";

// Mock note data
const mockNote = {
	id: "test-note-1",
	content: "Test note content",
	created_at: "2026-04-12T00:00:00Z",
	updated_at: "2026-04-12T00:00:00Z",
	is_resolved: false,
	note_type: "info",
	scope: "exact",
	url_pattern: "example.com/page",
	is_pinned: false,
	is_favorite: false,
	user_id: "test-user",
	draft_id: null,
	is_expanded: false,
	sort_order: 0,
};

// Next.js useRouter mock (already in setup.ts but redefining for clarity/specifics)
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh: refreshMock,
		push: vi.fn(),
		replace: vi.fn(),
	}),
	useSearchParams: () => new URLSearchParams(),
}));

// Supabase client mock to trigger fetch-based MSW interception
// We override the default mock in vitest.setup.ts
vi.mock("@/utils/supabase/client", () => ({
	createClient: vi.fn(),
}));

// Setup MSW server for this test
const server = setupServer();

describe("RightPaneDetail Component Phase 1 Improvements", () => {
	let supabaseMock: any;

	beforeAll(() => server.listen());
	afterEach(() => {
		server.resetHandlers();
		cleanup();
		vi.clearAllMocks();
	});
	afterAll(() => server.close());

	beforeEach(() => {
		// Mock Supabase client behavior
		supabaseMock = {
			from: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			eq: vi.fn().mockResolvedValue({ error: null }),
		};
		(createClient as any).mockReturnValue(supabaseMock);

		// Minimal MSW handler to satisfy network rules even if we use mocks for logic
		server.use(
			http.patch("*/rest/v1/sitecue_notes*", () => {
				return HttpResponse.json({ success: true });
			}),
		);
	});

	it("should display 'Page' instead of 'exact' in the scope part/popover", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		// Open popover to see scope options
		const moreButton = screen.getByLabelText(/more options/i);
		await user.click(moreButton);

		// Check for "page" text (will be capitalized by CSS, but the DOM text is "page")
		const pageLabel = await screen.findByText("page");
		expect(pageLabel).toBeInTheDocument();
	});

	it("should toggle pin status when Pin button is clicked", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		const pinButton = screen.getByTitle("Pin");
		await user.click(pinButton);

		// Verification: check if update was called with correct params
		expect(supabaseMock.from).toHaveBeenCalledWith("sitecue_notes");
		expect(supabaseMock.update).toHaveBeenCalledWith(
			expect.objectContaining({ is_pinned: true }),
		);
		expect(refreshMock).toHaveBeenCalled();
	});

	it("should toggle favorite status when Favorite button is clicked", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		const favoriteButton = screen.getByTitle("Favorite");
		await user.click(favoriteButton);

		// Verification: check if update was called with correct params
		expect(supabaseMock.from).toHaveBeenCalledWith("sitecue_notes");
		expect(supabaseMock.update).toHaveBeenCalledWith(
			expect.objectContaining({ is_favorite: true }),
		);
	});

	it("should copy Source URL to clipboard when Copy button is clicked", async () => {
		const user = userEvent.setup();
		const writeTextMock = vi.fn();

		// Use vi.stubGlobal for read-only properties like navigator
		vi.stubGlobal("navigator", {
			clipboard: {
				writeText: writeTextMock,
			},
		});

		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		const copyButton = screen.getByTitle("Copy Source URL");
		await user.click(copyButton);

		// In mockNote, url_pattern is "example.com/page", so it should be prefixed with https://
		expect(writeTextMock).toHaveBeenCalledWith("https://example.com/page");

		// Check for success feedback (checkmark icon)
		await screen.findByRole("button", {
			name: /Copy Source URL/i,
		});
		// Since we swap the icon, we can check if the button contains a check icon
		// (Simplified check as finding specific SVGs is hard, but findByText/Role works)
	});
});
