// apps/app/src/app/weave/WeaveUI.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import WeaveUI from "./WeaveUI";

// Next.jsのフックをモック化して context_id を付与
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useSearchParams: () =>
		new URLSearchParams("url=example.com&context_id=dummy-uuid-1234"),
}));

describe("WeaveUI Component (Context Relay)", () => {
	const mockNotes = [
		{
			id: "note-1",
			content: "テスト用のメモ内容",
			url_pattern: "example.com",
			created_at: "2026-03-16T00:00:00Z",
			note_type: "idea" as const,
		},
	];

	it("context_id が存在する場合、APIに送信されて錬成結果が表示されること", async () => {
		const user = userEvent.setup();
		render(<WeaveUI initialNotes={mockNotes} />);

		// メモを選択
		const checkbox = screen.getByRole("checkbox");
		if (!checkbox.checked) {
			await user.click(checkbox);
		}

		const generateButton = screen.getByRole("button", { name: /錬成する/i });
		expect(generateButton).not.toBeDisabled();

		// ボタンをクリック
		await user.click(generateButton);

		// ローディング検証は省き、最終結果を待つ (testing/SKILL.md 準拠)
		const resultElement = await screen.findByText(/テスト用モック生成データ/);
		expect(resultElement).toBeInTheDocument();
	});
});
