import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DiaryStudioClient } from "./DiaryStudioClient";

// useRouter等のモック化
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/hooks/useDiariesQuery", () => ({
	useUpdateDiary: () => ({ mutateAsync: vi.fn() }),
}));

// useMediaQuery のモック化 (デスクトップ表示をシミュレート)
vi.mock("@/hooks/use-media-query", () => ({
	useMediaQuery: () => true,
}));

// CodeMirrorがテスト環境でクラッシュするのを防ぐ簡易モック
vi.mock("@/components/editor/StudioEditor", () => ({
	StudioEditor: ({
		value,
		onChange,
	}: {
		value: string;
		onChange: (v: string) => void;
	}) =>
		React.createElement("textarea", {
			"data-testid": "mock-editor",
			value,
			onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
				onChange(e.target.value),
		}),
}));

vi.mock("./DiaryMaterialsPane", () => ({
	DiaryMaterialsPane: ({
		onInsert,
	}: {
		onInsert?: (content: string) => void;
	}) =>
		React.createElement(
			"button",
			{
				type: "button",
				"data-testid": "mock-insert-btn",
				onClick: () => onInsert?.("Inserted Text"),
			},
			"Insert",
		),
}));

describe("DiaryStudioClient", () => {
	const queryClient = new QueryClient();
	const setup = (
		initialDiary: Parameters<typeof DiaryStudioClient>[0]["initialDiary"],
	) =>
		render(
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				React.createElement(DiaryStudioClient, {
					initialDiary,
					date: "2026-06-28",
				}),
			),
		);

	it("初期状態（変更なし）ではSaveボタンが非活性であること", () => {
		setup({
			id: "d1",
			user_id: "u1",
			date: "2026-06-28",
			content: "Original Content",
			topics: [],
			created_at: "",
			updated_at: "",
		});
		const saveBtn = screen.getAllByRole("button", { name: /Save Diary/i })[0];
		expect(saveBtn).toBeDisabled();
	});

	it("エディタの内容が変更されたらSaveボタンが活性化すること", async () => {
		setup({
			id: "d1",
			user_id: "u1",
			date: "2026-06-28",
			content: "Original Content",
			topics: [],
			created_at: "",
			updated_at: "",
		});
		const editor = screen.getByTestId("mock-editor");
		fireEvent.change(editor, { target: { value: "Modified Content" } });
		const saveBtn = screen.getAllByRole("button", { name: /Save Diary/i })[0];
		expect(saveBtn).not.toBeDisabled();
	});

	it("素材のインサートボタンを押した際にエディタの末尾にテキストが追記結合されること", () => {
		setup({
			id: "d1",
			user_id: "u1",
			date: "2026-06-28",
			content: "Original",
			topics: [],
			created_at: "",
			updated_at: "",
		});
		const insertBtns = screen.getAllByTestId("mock-insert-btn");
		fireEvent.click(insertBtns[0]);
		const editor = screen.getByTestId("mock-editor") as HTMLTextAreaElement;
		expect(editor.value).toBe("Original\n\nInserted Text");
	});
});
