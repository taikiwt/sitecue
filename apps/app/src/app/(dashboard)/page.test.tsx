import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LaunchpadPage from "./page";

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

vi.mock("@sitecue/shared", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@sitecue/shared")>();
	return {
		...actual,
		fetchTopDomainActivity: vi.fn().mockResolvedValue([
			{ domain: "github.com", noteCount: 5 },
			{ domain: "127.0.0.1", noteCount: 2 },
		]),
		fetchDashboardDomainActivity: vi.fn().mockResolvedValue([
			{
				domain: "github.com",
				total_count: 5,
				domain_notes: [
					{ id: "n1", content: "GitHub Note", is_resolved: false },
				],
				top_pages: [],
			},
			{
				domain: "127.0.0.1",
				total_count: 2,
				domain_notes: [{ id: "n2", content: "Local Note", is_resolved: true }],
				top_pages: [],
			},
		]),
	};
});

describe("LaunchpadPage - RSC Streaming & Dashboard UI", () => {
	it("renders all streaming sections correctly including Recent Items and local domain icon", async () => {
		const PageComponent = await LaunchpadPage();

		await act(async () => {
			render(PageComponent);
		});

		expect(await screen.findByText("Weekly Progress")).toBeInTheDocument();
		expect(await screen.findByText("Today's Focus")).toBeInTheDocument();
		expect(await screen.findByText("Domain Activity")).toBeInTheDocument();
		expect(await screen.findByText("github.com")).toBeInTheDocument();
		expect(await screen.findByText("127.0.0.1")).toBeInTheDocument();
		expect(await screen.findByText("Activity Log")).toBeInTheDocument();
	});
});
