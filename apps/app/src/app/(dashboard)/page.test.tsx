import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LaunchpadPage from "./page";

// Next.js Server Component mock for Supabase & Auth
vi.mock("@/utils/supabase/server", () => {
	const mockBuilder = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		gte: vi.fn().mockReturnThis(),
		// biome-ignore lint/suspicious/noThenProperty: Supabase mock needs to be thenable
		then: vi.fn().mockImplementation((onFulfilled) => {
			return Promise.resolve(
				onFulfilled({
					count: 0,
					data: [],
					error: null,
				}),
			);
		}),
	};

	const mockSupabase = {
		from: vi.fn().mockReturnValue(mockBuilder),
	};

	return {
		requireUser: vi.fn().mockResolvedValue({
			supabase: mockSupabase,
			user: { id: "test-user-id" },
		}),
		createClient: vi.fn().mockResolvedValue(mockSupabase),
	};
});

// Mock shared DAL functions
vi.mock("@sitecue/shared", () => ({
	fetchTopDomainActivity: vi.fn().mockResolvedValue([
		{ domain: "github.com", noteCount: 5 },
		{ domain: "127.0.0.1", noteCount: 2 }, // IP fallback test
	]),
	fetchDashboardDomainActivity: vi.fn().mockResolvedValue([
		{ domain: "github.com", note_count: 5, domain_notes: [], top_pages: [] },
		{ domain: "127.0.0.1", note_count: 2, domain_notes: [], top_pages: [] },
	]),
}));

describe("LaunchpadPage - High Density Linear Style UI", () => {
	it("renders refined sections correctly", async () => {
		// Resolve Async Server Component
		const PageComponent = await LaunchpadPage();

		await act(async () => {
			render(PageComponent);
		});

		// 1. Verify voxel bar capacity metrics text is completely removed
		expect(
			screen.queryByText("Total processed capacity"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("Total processed capacity: 42 notes"),
		).not.toBeInTheDocument();

		// 2. Verify new dashboard sections render correctly
		expect(await screen.findByText("Weekly Progress")).toBeInTheDocument();
		expect(await screen.findByText("Notes Captured")).toBeInTheDocument();
		expect(await screen.findByText("Drafts Created")).toBeInTheDocument();

		// 3. Verify Today's Focus / Recap section renders
		expect(await screen.findByText("Today's Focus")).toBeInTheDocument();

		// 4. Verify Domain Activity grid header and cards render (including IP domain)
		expect(await screen.findByText("Domain Activity")).toBeInTheDocument();
		expect(await screen.findByText("github.com")).toBeInTheDocument();
		expect(await screen.findByText("127.0.0.1")).toBeInTheDocument();

		// 5. Verify Activity Log timeline renders
		expect(await screen.findByText("Activity Log")).toBeInTheDocument();
	});
});
