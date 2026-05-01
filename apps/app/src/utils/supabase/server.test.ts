import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { requireUser } from "./server";

// next/navigation のモック
vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

// next/headers のモック
vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({
		getAll: vi.fn().mockReturnValue([]),
		set: vi.fn(),
	}),
}));

// @supabase/ssr のモック
vi.mock("@supabase/ssr", () => ({
	createServerClient: vi.fn().mockReturnValue({
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: null },
				error: { message: "No user" },
			}),
		},
	}),
}));

describe("requireUser DAL", () => {
	it("未認証ユーザーの場合、指定した currentPath をエンコードしてリダイレクトする", async () => {
		await requireUser("/studio/new?template_id=xyz");

		// EncodeURIComponent でエンコードされた値が渡されるかを検証
		expect(redirect).toHaveBeenCalledWith(
			"/login?next=%2Fstudio%2Fnew%3Ftemplate_id%3Dxyz",
		);
	});
});
