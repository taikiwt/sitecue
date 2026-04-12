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
import type { Note } from "../types";
import { RightPaneDetail } from "./RightPaneDetail";

// Define mock type to avoid 'any'
type SupabaseMock = {
	from: Mock;
	update: Mock;
	delete: Mock;
	eq: Mock;
};

type Mock = ReturnType<typeof vi.fn>;

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
// Next.js useRouter mock
const refreshMock = vi.fn();
const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh: refreshMock,
		push: pushMock,
		replace: replaceMock,
	}),
	useSearchParams: () => new URLSearchParams("filter=all&sort=newest"),
}));

// Supabase client mock to trigger fetch-based MSW interception
// We override the default mock in vitest.setup.ts
vi.mock("@/utils/supabase/client", () => ({
	createClient: vi.fn(),
}));

// Setup MSW server for this test
const server = setupServer();

describe("RightPaneDetail Component Phase 1 Improvements", () => {
	let supabaseMock: SupabaseMock;

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
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockResolvedValue({ error: null }),
		} as unknown as SupabaseMock;
		vi.mocked(createClient).mockReturnValue(
			supabaseMock as unknown as ReturnType<typeof createClient>,
		);

		// Minimal MSW handler to satisfy network rules even if we use mocks for logic
		server.use(
			http.patch("*/rest/v1/sitecue_notes*", () => {
				return HttpResponse.json({ success: true });
			}),
			http.delete("*/rest/v1/sitecue_notes*", () => {
				return HttpResponse.json({ success: true });
			}),
		);
	});

	it("should NOT display Scope selection heading in the popover (removed in Phase 2.5)", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		// Open popover
		const moreButton = screen.getByLabelText(/more options/i);
		await user.click(moreButton);

		// Check that "Scope" label (the heading) is NOT present
		// We use a exact match to avoid matching "Edit Scope/URL" button
		expect(screen.queryByText(/^Scope$/i)).not.toBeInTheDocument();
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
	});

	it("should show delete confirmation dialog and handle deletion", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		// Open popover
		const moreButton = screen.getByLabelText(/more options/i);
		await user.click(moreButton);

		// Click Delete Note
		const deleteButton = screen.getByText(/Delete Note/i);
		await user.click(deleteButton);

		// Verify dialog is shown
		expect(screen.getByText(/Are you absolutely sure/i)).toBeInTheDocument();

		// Click Confirm Delete
		const confirmButton = screen.getByRole("button", { name: /^Delete$/ });
		await user.click(confirmButton);

		// Verify deletion call
		expect(supabaseMock.from).toHaveBeenCalledWith("sitecue_notes");
		expect(supabaseMock.delete).toHaveBeenCalled();
		// Should maintain other params but remove noteId
		expect(replaceMock).toHaveBeenCalledWith("/notes?filter=all&sort=newest");
		expect(refreshMock).toHaveBeenCalled();
	});

	it("should show edit metadata dialog and handle updates", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		// Open popover
		const moreButton = screen.getByLabelText(/more options/i);
		await user.click(moreButton);

		// Click Edit Scope/URL
		const editButton = screen.getByText(/Edit Scope\/URL/i);
		await user.click(editButton);

		// Verify dialog is shown
		expect(
			await screen.findByText(/Edit Note Scope & URL/i),
		).toBeInTheDocument();

		// Update URL
		const urlInput = await screen.findByLabelText(/Source URL/i);
		await user.clear(urlInput);
		await user.type(urlInput, "new-example.com");

		// After clearing, scope defaults to Inbox. Select Page back.
		const selectTrigger = screen.getByRole("combobox");
		await user.click(selectTrigger);
		const pageOption = await screen.findByRole("option", { name: /Page/i });
		await user.click(pageOption);

		// Click Save
		const saveButton = screen.getByText(/Save changes/i);
		await user.click(saveButton);

		// Verify update call
		expect(supabaseMock.from).toHaveBeenCalledWith("sitecue_notes");
		expect(supabaseMock.update).toHaveBeenCalledWith(
			expect.objectContaining({
				url_pattern: "new-example.com",
			}),
		);
	});

	it("should force Inbox scope and disable others when URL is empty", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		// Open edit dialog
		const moreButton = screen.getByLabelText(/more options/i);
		await user.click(moreButton);
		const editButton = screen.getByText(/Edit Scope\/URL/i);
		await user.click(editButton);

		// Clear URL
		const urlInput = await screen.findByLabelText(/Source URL/i);
		await user.clear(urlInput);

		// Verify Scope is forced to Inbox (Value "inbox")
		expect(await screen.findByText("Inbox")).toBeInTheDocument();

		// Click Select Trigger to see options
		const selectTrigger = screen.getByRole("combobox");
		await user.click(selectTrigger);

		// Base-UI/Radix uses data-disabled instead of aria-disabled
		const pageOption = await screen.findByRole("option", { name: /Page/i });
		const domainOption = await screen.findByRole("option", { name: /Domain/i });
		expect(pageOption).toHaveAttribute("data-disabled");
		expect(domainOption).toHaveAttribute("data-disabled");
	});

	it("should cleanse URL when saving with domain scope", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		// Open edit dialog
		const moreButton = screen.getByLabelText(/more options/i);
		await user.click(moreButton);
		const editButton = screen.getByText(/Edit Scope\/URL/i);
		await user.click(editButton);

		// Set URL to full path and Scope to Domain
		const urlInput = await screen.findByLabelText(/Source URL/i);
		await user.clear(urlInput);
		await user.type(urlInput, "https://github.com/taikiwt/sitecue/issues/1");

		const selectTrigger = screen.getByRole("combobox");
		await user.click(selectTrigger);
		const domainOption = await screen.findByRole("option", { name: /Domain/i });
		await user.click(domainOption);

		// Save
		const saveButton = screen.getByText(/Save changes/i);
		await user.click(saveButton);

		// Verify that only the hostname was saved
		expect(supabaseMock.update).toHaveBeenCalledWith(
			expect.objectContaining({
				url_pattern: "github.com",
				scope: "domain",
			}),
		);
	});

	it("should clear URL when saving with inbox scope", async () => {
		const user = userEvent.setup();
		render(<RightPaneDetail note={mockNote as unknown as Note} />);

		// Open edit dialog
		const moreButton = screen.getByLabelText(/more options/i);
		await user.click(moreButton);
		const editButton = screen.getByText(/Edit Scope\/URL/i);
		await user.click(editButton);

		// Set Scope to Inbox
		const selectTrigger = screen.getByRole("combobox");
		await user.click(selectTrigger);
		const inboxOption = await screen.findByRole("option", { name: /Inbox/i });
		await user.click(inboxOption);

		// Save
		const saveButton = screen.getByText(/Save changes/i);
		await user.click(saveButton);

		// Verify that URL was cleared
		expect(supabaseMock.update).toHaveBeenCalledWith(
			expect.objectContaining({
				url_pattern: "",
				scope: "inbox",
			}),
		);
	});
});
