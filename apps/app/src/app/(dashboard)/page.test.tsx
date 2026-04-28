import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LaunchpadPage from "./page";

// 非同期コンポーネントのテスト用モックアップ
vi.mock("@/utils/supabase/server", () => ({
	createClient: vi.fn(() => ({
		from: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockResolvedValue({ data: [], count: 0 }),
	})),
}));

describe("LaunchpadPage UI Micro-interactions", () => {
	it("Start a Draftカードにタッチセーフなアニメーションクラスが付与されていること", async () => {
		// サーバーコンポーネントの解決をシミュレート
		const Page = await LaunchpadPage();
		const { container } = render(Page);

		// Blank Canvasのリンクが対象クラスを持っているか確認
		const blankCanvasCard = screen.getByText("Blank Canvas").closest("a");
		expect(blankCanvasCard).toHaveClass("launchpad-transition");
		expect(blankCanvasCard).toHaveClass("launchpad-card-start");

		// アイコンにも専用クラスが付与されているか
		const icon = container.querySelector(".draft-icon");
		expect(icon).toBeInTheDocument();
	});
});
