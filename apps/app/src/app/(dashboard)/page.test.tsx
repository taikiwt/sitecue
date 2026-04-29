import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NOTES_LIMIT } from "@/constants/limits";
import LaunchpadPage from "./page";

// Next.js Server Component 用の Supabase モック
vi.mock("@/utils/supabase/server", () => {
	const mockSupabaseBuilder = {
		select: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		// biome-ignore lint/suspicious/noThenProperty: Supabase mock needs to be thenable
		then: vi.fn().mockImplementation((onFulfilled) => {
			return Promise.resolve(onFulfilled({ count: 450, data: [] }));
		}),
	};
	return {
		createClient: vi.fn().mockResolvedValue({
			from: vi.fn().mockReturnValue(mockSupabaseBuilder),
		}),
	};
});

describe("LaunchpadPage - Note Limit Warning", () => {
	it("renders warning banner when notesCount is at or above WARNING_THRESHOLD", async () => {
		// Async Server Component を解決してレンダリング
		const Page = await LaunchpadPage();
		render(Page);

		// 警告メッセージが表示されていることを確認
		const warningText = `Note storage almost full (450/${NOTES_LIMIT.MAX_FREE}). Upgrade to unlock unlimited notes.`;
		expect(screen.getByText(warningText)).toBeInTheDocument();
		expect(screen.getByText("Upgrade")).toBeInTheDocument();
	});
});
