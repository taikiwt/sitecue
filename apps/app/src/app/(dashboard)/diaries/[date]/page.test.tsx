import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DiaryStudioClient } from "./_components/DiaryStudioClient";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/useDiariesQuery", () => ({
	useFetchDiaries: vi.fn(() => ({ data: [] })),
	useFetchDiaryByDate: vi.fn(() => ({ data: null, isLoading: false })),
	useUpdateDiary: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("./_components/DiaryMaterialsPane", () => ({
	DiaryMaterialsPane: () =>
		React.createElement(
			"div",
			{ "data-testid": "materials-pane" },
			"Materials",
		),
}));

// CodeMirrorエディタのクラッシュを防ぐため textarea へ安全にモック化
vi.mock("@/components/editor/StudioEditor", () => ({
	StudioEditor: ({
		value,
		onChange,
	}: {
		value: string;
		onChange: (v: string) => void;
	}) =>
		React.createElement("textarea", {
			"data-testid": "mock-code-editor",
			value,
			onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
				onChange(e.target.value),
		}),
}));

describe("DiaryStudioClient - AppShell Asset Reuse Validation", () => {
	it("固定ヘッダーに Diary Studio のタイトルと日付、および chars カウンターが美しく出現すること", () => {
		const mockDiary = {
			id: "d1",
			user_id: "u1",
			date: "2026-06-21",
			content: "Hello",
			topics: [],
			created_at: "",
			updated_at: "",
		};
		render(
			React.createElement(DiaryStudioClient, {
				date: "2026-06-21",
				initialDiary: mockDiary,
			}),
		);

		expect(screen.getAllByText("Diary Studio")[0]).toBeInTheDocument();
		expect(screen.getAllByText("2026-06-21")[0]).toBeInTheDocument();
		expect(screen.getAllByText("Save Diary")[0]).toBeInTheDocument();
		expect(screen.getAllByText("5 chars")[0]).toBeInTheDocument();
	});

	it("メインの執筆キャンバスが読み込まれ、グレー背景ではなくメイン背景（bg-base-bg）が担保されていること", () => {
		const mockDiary = {
			id: "d1",
			user_id: "u1",
			date: "2026-06-21",
			content: "Hello",
			topics: [],
			created_at: "",
			updated_at: "",
		};
		const { container } = render(
			React.createElement(DiaryStudioClient, {
				date: "2026-06-21",
				initialDiary: mockDiary,
			}),
		);

		const editor = screen.getAllByTestId("mock-code-editor")[0];
		expect(editor).toBeInTheDocument();

		// bg-base-bg がレイアウトに付与されていることの検証
		const mainPanel = container.querySelector(".bg-base-bg");
		expect(mainPanel).toBeInTheDocument();
	});
});
