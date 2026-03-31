// 対象: apps/app/src/app/login/page.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createClient } from "@/utils/supabase/client";
import LoginPage from "./page";

// モックのオーバーライド: useSearchParamsでnextパラメータを再現 [cite: 1, 2, 3]
vi.mock("next/navigation", () => ({
	useSearchParams: () =>
		new URLSearchParams("next=%2Fweave%3Furl%3Dexample.com%26context_id%3D123"),
}));

vi.mock("@/utils/supabase/client");

describe("LoginPage Component", () => {
	it("Googleログイン時に、nextパラメータがredirectToに正しく引き継がれること", async () => {
		const user = userEvent.setup();
		const mockSignInWithOAuth = vi
			.fn()
			.mockResolvedValue({ data: {}, error: null });

		// Supabaseクライアントのモック [cite: 1, 2, 3]
		vi.mocked(createClient).mockReturnValue({
			auth: {
				signInWithOAuth: mockSignInWithOAuth,
			},
		} as unknown as ReturnType<typeof createClient>);

		render(<LoginPage />);

		const loginButton = screen.getByRole("button", {
			name: /Sign in with Google/i,
		});
		await user.click(loginButton);

		expect(mockSignInWithOAuth).toHaveBeenCalledWith({
			provider: "google",
			options: {
				// エンコードされたnextパラメータが正しく付与されているかを検証
				redirectTo: expect.stringContaining(
					"/auth/callback?next=%2Fweave%3Furl%3Dexample.com%26context_id%3D123",
				),
			},
		});
	});
});
