import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginScreen from "./LoginScreen";

describe("LoginScreen Component - Isolated Guest Button", () => {
	const defaultProps = {
		authError: null,
		authLoading: false,
		handleSocialLogin: vi.fn(),
		onGuestLogin: vi.fn(),
	};

	it("ログイン画面において、ソーシャルログインとゲスト導線エリアが説明文付きで正しく分離していること", () => {
		render(<LoginScreen {...defaultProps} />);

		// ソーシャルログインボタンの存在チェック
		expect(
			screen.getByRole("button", { name: /continue with google/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /continue with github/i }),
		).toBeInTheDocument();

		// エリア分離用説明テキストの存在チェック
		expect(
			screen.getByText(/Or try it out instantly without an account:/i),
		).toBeInTheDocument();
	});

	it("ゲストモードボタンがカプセル型形状を維持し、クリックで正しくonGuestLoginハンドラーが発火すること", () => {
		const onGuestLoginMock = vi.fn();
		render(<LoginScreen {...defaultProps} onGuestLogin={onGuestLoginMock} />);

		const guestButton = screen.getByRole("button", {
			name: /continue as guest \(local only\)/i,
		});
		expect(guestButton).toBeInTheDocument();

		// プロジェクト規約であるカプセル型（rounded-full）が適用されているかチェック
		expect(guestButton.className).toContain("rounded-full");

		// クリックイベントの疎通検証
		fireEvent.click(guestButton);
		expect(onGuestLoginMock).toHaveBeenCalledTimes(1);
	});
});
