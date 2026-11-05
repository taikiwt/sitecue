import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthStatus } from "../hooks/useAuth";
import Header from "./Header";

// 必要最低限のグローバルオブジェクトのモック
vi.stubGlobal("import", {
	meta: { env: { VITE_WEB_URL: "https://test.sitecue.app" } },
});

describe("Header Component - Guest Mode UI & Disclaimer", () => {
	const defaultProps = {
		url: "https://example.com/page",
		title: "Example Page",
		domain: "example.com",
		session: null,
		onLogout: vi.fn(),
	};

	it("ゲストモード時に右上アバターが横長カプセル型のGuestボタンへモーフィングされること", () => {
		const authStatus: AuthStatus = {
			mode: "guest",
			session: null,
			userId: "guest-user",
		};

		render(<Header {...defaultProps} authStatus={authStatus} />);

		// Guestというテキストが描画されているかチェック
		const guestButton = screen.getByRole("button", { name: /guest/i });
		expect(guestButton).toBeInTheDocument();
		expect(guestButton.className).toContain("rounded-full");
		expect(guestButton.className).toContain("bg-neutral-800");
	});

	it("Guestボタンクリックで展開されるメニュー内に、言語切替・リスク警告・免責事項・サインイン昇格ボタンが正しく存在すること", () => {
		const authStatus: AuthStatus = {
			mode: "guest",
			session: null,
			userId: "guest-user",
		};
		const onLogoutMock = vi.fn();

		render(
			<Header
				{...defaultProps}
				authStatus={authStatus}
				onLogout={onLogoutMock}
			/>,
		);

		// メニューを開く
		const guestButton = screen.getByRole("button", { name: /guest/i });
		fireEvent.click(guestButton);

		// 言語切替セクションの確認
		expect(screen.getByText("Language")).toBeInTheDocument();
		const jaButton = screen.getByRole("button", { name: "JA" });
		expect(jaButton).toBeInTheDocument();

		// 1段目: 警告セクション（改訂後の英語文言）
		expect(
			screen.getByText(/Local Storage Only: Temporary local storage/i),
		).toBeInTheDocument();

		// 2段目: 免責セクション
		expect(
			screen.getByText(/Current local notes will not be synced/i),
		).toBeInTheDocument();

		// 3段目: ログイン導線ボタン
		const signInButton = screen.getByRole("button", {
			name: /^sign in$/i,
		});
		expect(signInButton).toBeInTheDocument();
		expect(signInButton.className).toContain("rounded-full");

		// JAボタンクリックで日本語UIへリアルタイムに切り替わることを検証
		fireEvent.click(jaButton);
		expect(screen.getByText("言語")).toBeInTheDocument();
		expect(
			screen.getByText(
				/ローカル保存のみ: ブラウザのキャッシュを使った一時的な保存状態/i,
			),
		).toBeInTheDocument();

		// サインインボタンクリックでonLogoutが発火すること
		const jaSignInButton = screen.getByRole("button", { name: "サインイン" });
		fireEvent.click(jaSignInButton);
		expect(onLogoutMock).toHaveBeenCalledTimes(1);
	});
});
