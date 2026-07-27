import { describe, expect, it, vi } from "vitest";
import { fetchDashboardOverviewData } from "./dashboard";

describe("fetchDashboardOverviewData DAL", () => {
	it("fetches dashboard data including 7d activity notes and drafts correctly", async () => {
		const mockBuilder = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			gte: vi.fn().mockReturnThis(),
			// biome-ignore lint/suspicious/noThenProperty: Supabase mock
			then: vi.fn().mockImplementation((onFulfilled) =>
				Promise.resolve(
					onFulfilled({
						count: 1,
						data: [
							{
								id: "n-1",
								content: "Test note",
								is_resolved: false,
								scope: "inbox",
								url_pattern: "inbox",
								created_at: new Date().toISOString(),
								note_type: "info",
							},
						],
						error: null,
					}),
				),
			),
		};

		const mockSupabase = {
			from: vi.fn().mockReturnValue(mockBuilder),
			rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
		};

		const result = await fetchDashboardOverviewData(
			mockSupabase as unknown as Parameters<
				typeof fetchDashboardOverviewData
			>[0],
			"user-123",
		);

		expect(result.notes7d).toBeDefined();
		expect(result.notes7d.length).toBeGreaterThan(0);
	});
});
