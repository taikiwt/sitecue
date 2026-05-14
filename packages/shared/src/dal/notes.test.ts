import { describe, expect, it, vi } from "vitest";
import { fetchNoteContents, fetchNoteMetadatas } from "./notes";

// biome-ignore lint/suspicious/noExplicitAny: モック構築用
type AnyClient = any;

describe("Shared DAL: notes", () => {
	it("fetchNoteMetadatasが正しいクエリチェーンを構築してデータを返すこと", async () => {
		const mockData = [{ id: "note-1", url_pattern: "example.com" }];

		// Supabaseクライアントのメソッドチェーンを正確にモック化
		const mockOrder3 = vi
			.fn()
			.mockResolvedValue({ data: mockData, error: null });
		const mockOrder2 = vi.fn().mockReturnValue({ order: mockOrder3 });
		const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
		const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
		const supabase: AnyClient = { from: mockFrom };

		const res = await fetchNoteMetadatas(supabase, "user-123");

		expect(mockFrom).toHaveBeenCalledWith("sitecue_notes");
		expect(mockSelect).toHaveBeenCalled();
		expect(mockEq).toHaveBeenCalledWith("user_id", "user-123");
		expect(res).toEqual(mockData);
	});

	it("fetchNoteContentsが空配列の時はAPIを叩かずに早期リターンすること", async () => {
		const mockIn = vi.fn();
		const mockSelect = vi.fn().mockReturnValue({ in: mockIn });
		const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
		const supabase: AnyClient = { from: mockFrom };

		const res = await fetchNoteContents(supabase, []);

		expect(res).toEqual([]);
		expect(mockFrom).not.toHaveBeenCalled();
	});
});
