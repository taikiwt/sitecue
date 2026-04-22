import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Toaster } from "react-hot-toast";
import { vi } from "vitest";
import { server } from "../../../vitest.setup";
import DraftEditor from "./DraftEditor";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
	useSearchParams: () => new URLSearchParams("pane=review"),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: true,
		media: query,
		onchange: null,
		addListener: vi.fn(), // Deprecated
		removeListener: vi.fn(), // Deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock Supabase Auth / Client
vi.mock("@/utils/supabase/client", () => {
	const mockSupabase = {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: { id: "test-user-id" } },
			}),
			getSession: vi.fn().mockResolvedValue({
				data: {
					session: { access_token: "mock-token", user: { id: "test-user-id" } },
				},
			}),
		},
		from: vi.fn(() => ({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: { plan: "pro", ai_usage_count: 10 },
				error: null,
			}),
			order: vi.fn().mockResolvedValue({ data: [], error: null }),
		})),
	};
	return { createClient: () => mockSupabase };
});

const mockDraft = {
	id: "draft-1",
	content: "Test Content",
	title: "Test Title",
	metadata: { slug: "test-slug" },
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	user_id: "test-user-id",
	template_id: null,
};

describe("DraftEditor - Error Handling", () => {
	test("Weave機能がAPIエラーになった際、エラーメッセージがトーストで表示されること", async () => {
		// APIエラーをモック
		server.use(
			http.post("*/ai/weave", () => {
				return HttpResponse.json(
					{ error: "Internal Server Error" },
					{ status: 500 },
				);
			}),
		);

		const user = userEvent.setup();
		render(
			<>
				<Toaster />
				<DraftEditor initialDraft={mockDraft} template={null} />
			</>,
		);

		// DraftEditor.tsx では、左サイドバーの「WEAVE」ボタン等があるか、
		// StudioReviewPane.tsx 経由で呼び出されるのでそのボタンを探す。
		// プロンプトに合わせて /weave/i を使用
		const weaveButton = await screen.findByRole("button", { name: /weave/i });
		await user.click(weaveButton);

		// ローディングの検証は省き、最終的なトーストメッセージの描画を待機
		expect(
			await screen.findByText(
				"AIサーバーが混み合っています。少し待ってから再度お試しください。",
			),
		).toBeInTheDocument();
	});
});
