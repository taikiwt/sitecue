import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { appendDiaryLog } from "./diaries";

describe("Shared Diaries DAL: appendDiaryLog", () => {
	it("初回入力時にタイムスタンプ [HH:MM] が正しく先頭に添えられて保存されること", async () => {
		const mockSingle = vi.fn().mockResolvedValue({
			data: {
				user_id: "u1",
				date: "2026-06-21",
				content: "[17:45]\nFirst hello",
				topics: [],
			},
			error: null,
		});
		const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
		const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

		const mockMaybeSingle = vi
			.fn()
			.mockResolvedValue({ data: null, error: null });
		const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
		const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
		const mockSelectFetch = vi.fn().mockReturnValue({ eq: mockEq1 });

		const mockFrom = vi.fn().mockImplementation((table) => {
			if (table === "sitecue_diaries") {
				return { select: mockSelectFetch, upsert: mockUpsert };
			}
			return {};
		});

		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		// タイムスタンプ時間を固定化
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-21T17:45:00"));

		const res = await appendDiaryLog(
			supabase,
			"u1",
			"2026-06-21",
			"First hello",
		);

		expect(res.content).toBe("[17:45]\nFirst hello");
		vi.useRealTimers();
	});

	it("2回目以降の追記時、末尾に改行2つ（\\n\\n）を挟んでアトミックに追記結合されること", async () => {
		const mockSingle = vi.fn().mockResolvedValue({
			data: {
				user_id: "u1",
				date: "2026-06-21",
				content: "[17:45]\nFirst hello\n\n[18:00]\nSecond burst",
				topics: [],
			},
			error: null,
		});
		const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
		const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

		const mockMaybeSingle = vi.fn().mockResolvedValue({
			data: { content: "[17:45]\nFirst hello", topics: [] },
			error: null,
		});
		const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
		const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
		const mockSelectFetch = vi.fn().mockReturnValue({ eq: mockEq1 });

		const mockFrom = vi.fn().mockImplementation((table) => {
			if (table === "sitecue_diaries") {
				return { select: mockSelectFetch, upsert: mockUpsert };
			}
			return {};
		});

		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-06-21T18:00:00"));

		await appendDiaryLog(supabase, "u1", "2026-06-21", "Second burst");

		expect(mockUpsert).toHaveBeenCalledWith(
			expect.objectContaining({
				content: "[17:45]\nFirst hello\n\n[18:00]\nSecond burst",
			}),
		);
		vi.useRealTimers();
	});

	it("トピック数が10個を超える、または50文字を超えるトピックがある場合は即座にDAL層で例外をスローすること", async () => {
		const supabase = { from: vi.fn() } as unknown as SupabaseClient;
		const longTopic = "a".repeat(51);

		await expect(
			appendDiaryLog(supabase, "u1", "2026-06-21", "hello", [longTopic]),
		).rejects.toThrow("Topic length cannot exceed 50 characters");

		const excessTopics = Array(11).fill("topic");
		await expect(
			appendDiaryLog(supabase, "u1", "2026-06-21", "hello", excessTopics),
		).rejects.toThrow("Maximum 10 topics allowed");
	});
});
