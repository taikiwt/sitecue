import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
	emptyTrashDraftsEntity,
	fetchDraftsList,
	fetchTrashDrafts,
	permanentlyDeleteDraftEntity,
	restoreDraftEntity,
	softDeleteDraftEntity,
} from "./drafts";

describe("Shared DAL: drafts", () => {
	it("fetchDraftsListが論理削除済みを除外して更新日時降順で取得すること", async () => {
		const mockData = [{ id: "draft-1", title: "Draft 1", deleted_at: null }];
		const mockOrder = vi
			.fn()
			.mockResolvedValue({ data: mockData, error: null });
		const mockIs = vi.fn().mockReturnValue({ order: mockOrder });
		const mockEq = vi.fn().mockReturnValue({ is: mockIs });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		const res = await fetchDraftsList(supabase, "user-1");

		expect(mockFrom).toHaveBeenCalledWith("sitecue_drafts");
		expect(mockSelect).toHaveBeenCalledWith("*");
		expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
		expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
		expect(mockOrder).toHaveBeenCalledWith("updated_at", { ascending: false });
		expect(res).toEqual(mockData);
	});

	it("softDeleteDraftEntityがdeleted_atとupdated_atを設定して更新すること", async () => {
		const mockDraft = { id: "draft-1", deleted_at: "2026-11-25T00:00:00Z" };
		const mockSingle = vi
			.fn()
			.mockResolvedValue({ data: mockDraft, error: null });
		const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
		const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
		const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		const res = await softDeleteDraftEntity(supabase, "draft-1");

		expect(mockFrom).toHaveBeenCalledWith("sitecue_drafts");
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				deleted_at: expect.any(String),
				updated_at: expect.any(String),
			}),
		);
		expect(mockEq).toHaveBeenCalledWith("id", "draft-1");
		expect(res).toEqual(mockDraft);
	});

	it("restoreDraftEntityがdeleted_atをnullに戻して更新すること", async () => {
		const mockDraft = { id: "draft-1", deleted_at: null };
		const mockSingle = vi
			.fn()
			.mockResolvedValue({ data: mockDraft, error: null });
		const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
		const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
		const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		const res = await restoreDraftEntity(supabase, "draft-1");

		expect(mockFrom).toHaveBeenCalledWith("sitecue_drafts");
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				deleted_at: null,
				updated_at: expect.any(String),
			}),
		);
		expect(mockEq).toHaveBeenCalledWith("id", "draft-1");
		expect(res).toEqual(mockDraft);
	});

	it("fetchTrashDraftsが保持期間内の論理削除済みドラフトを降順で取得すること", async () => {
		const mockData = [{ id: "draft-1", deleted_at: "2026-11-24T00:00:00Z" }];
		const mockOrder = vi
			.fn()
			.mockResolvedValue({ data: mockData, error: null });
		const mockGte = vi.fn().mockReturnValue({ order: mockOrder });
		const mockNot = vi.fn().mockReturnValue({ gte: mockGte });
		const mockEq = vi.fn().mockReturnValue({ not: mockNot });
		const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		const res = await fetchTrashDrafts(supabase, "user-1", 7);

		expect(mockFrom).toHaveBeenCalledWith("sitecue_drafts");
		expect(mockSelect).toHaveBeenCalledWith("*");
		expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
		expect(mockNot).toHaveBeenCalledWith("deleted_at", "is", null);
		expect(mockGte).toHaveBeenCalledWith("deleted_at", expect.any(String));
		expect(mockOrder).toHaveBeenCalledWith("deleted_at", { ascending: false });
		expect(res).toEqual(mockData);
	});

	it("permanentlyDeleteDraftEntityが物理削除してIDを返すこと", async () => {
		const mockEq = vi.fn().mockResolvedValue({ error: null });
		const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });
		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		const res = await permanentlyDeleteDraftEntity(supabase, "draft-1");

		expect(mockFrom).toHaveBeenCalledWith("sitecue_drafts");
		expect(mockDelete).toHaveBeenCalled();
		expect(mockEq).toHaveBeenCalledWith("id", "draft-1");
		expect(res).toBe("draft-1");
	});

	it("emptyTrashDraftsEntityが論理削除済みドラフトを一括物理削除すること", async () => {
		const mockNot = vi.fn().mockResolvedValue({ error: null });
		const mockEq = vi.fn().mockReturnValue({ not: mockNot });
		const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
		const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });
		const supabase = { from: mockFrom } as unknown as SupabaseClient;

		await emptyTrashDraftsEntity(supabase, "user-1");

		expect(mockFrom).toHaveBeenCalledWith("sitecue_drafts");
		expect(mockDelete).toHaveBeenCalled();
		expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
		expect(mockNot).toHaveBeenCalledWith("deleted_at", "is", null);
	});
});
