import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { fetchOrResetUserProfile } from "./profiles";

describe("Shared DAL: profiles (Lazy Reset)", () => {
	it("リセット日未到達の場合、現在のカウントとプランがそのまま返却されること", async () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 10);

		const mockSingle = vi.fn().mockResolvedValue({
			data: {
				id: "user-1",
				plan: "free",
				ai_usage_count: 2,
				ai_usage_reset_at: futureDate.toISOString(),
			},
			error: null,
		});

		const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		const result = await fetchOrResetUserProfile(supabase, "user-1");

		expect(result).toEqual({
			id: "user-1",
			plan: "free",
			ai_usage_count: 2,
			ai_usage_reset_at: futureDate.toISOString(),
		});
		expect(mockSelect).toHaveBeenCalledWith(
			"id, plan, ai_usage_count, ai_usage_reset_at",
		);
	});

	it("リセット日を過ぎている場合、ai_usage_count が 0 に更新され最新情報が返却されること", async () => {
		const pastDate = new Date();
		pastDate.setDate(pastDate.getDate() - 5);

		const mockSingleFetch = vi.fn().mockResolvedValue({
			data: {
				id: "user-1",
				plan: "free",
				ai_usage_count: 3,
				ai_usage_reset_at: pastDate.toISOString(),
			},
			error: null,
		});

		const mockSingleUpdate = vi.fn().mockResolvedValue({
			data: {
				id: "user-1",
				plan: "free",
				ai_usage_count: 0,
				ai_usage_reset_at: new Date().toISOString(),
			},
			error: null,
		});

		const mockUpdateSelect = vi
			.fn()
			.mockReturnValue({ single: mockSingleUpdate });
		const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
		const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

		const mockFetchEq = vi.fn().mockReturnValue({ single: mockSingleFetch });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockFetchEq });

		const mockFrom = vi.fn().mockImplementation((table) => {
			if (table === "sitecue_profiles") {
				return { select: mockSelect, update: mockUpdate };
			}
			return {};
		});

		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		const result = await fetchOrResetUserProfile(supabase, "user-1");

		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				ai_usage_count: 0,
			}),
		);
		expect(result?.ai_usage_count).toBe(0);
	});
});
