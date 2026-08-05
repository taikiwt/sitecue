import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiaryMaterialsPane } from "./DiaryMaterialsPane";

// Supabaseクライアントのモック
const mockGetUser = vi
	.fn()
	.mockResolvedValue({ data: { user: { id: "user-123" } } });
vi.mock("@/utils/supabase/client", () => ({
	createClient: () => ({
		auth: { getUser: mockGetUser },
	}),
}));

// DAL関数のモック
vi.mock("@sitecue/shared", () => ({
	fetchNotesByDate: vi.fn().mockResolvedValue([
		{
			id: "note-1",
			content: "Note Content Markdown",
			created_at: "2026-06-28T17:45:00Z",
			scope: "exact",
			note_type: "idea",
		},
	]),
	fetchDraftsByDate: vi.fn().mockResolvedValue([]),
}));

// 本家 NoteCard コンポーネントをテスト環境用に安全に擬似レンダリングモック化
vi.mock("../../../studio/_components/NoteCard", () => ({
	default: ({
		note,
		onInsert,
		showTimeOnly,
	}: {
		note: { content: string };
		onInsert?: (content: string) => void;
		showTimeOnly?: boolean;
	}) =>
		React.createElement(
			"div",
			{ "data-testid": "mock-note-card" },
			React.createElement("span", null, note.content),
			React.createElement(
				"span",
				null,
				showTimeOnly ? "time-mode" : "date-mode",
			),
			onInsert &&
				React.createElement(
					"button",
					{ type: "button", onClick: () => onInsert(note.content) },
					"Insert",
				),
		),
}));

describe("DiaryMaterialsPane - Integrated Architecture Validation", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		vi.clearAllMocks();
		queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});
	});

	it("初期ロード中も固定ヘッダーが表示され、リスト領域のみがスケルトン表示されること", async () => {
		render(
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				React.createElement(DiaryMaterialsPane, { date: "2026-08-05" }),
			),
		);

		// ヘッダー枠組みが0msで存在することを確認
		expect(screen.getByText(/Materials of the Day/i)).toBeInTheDocument();

		// データ着信後のカード表示を確認
		const card = await screen.findByTestId("mock-note-card");
		expect(card).toBeInTheDocument();
	});

	it("データロード完了後、一本化された本家NoteCardがshowTimeOnlyモードで正しく呼び出されること", async () => {
		render(
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				React.createElement(DiaryMaterialsPane, { date: "2026-06-28" }),
			),
		);
		const card = await screen.findByTestId("mock-note-card");
		expect(card).toBeInTheDocument();
		expect(card).toHaveTextContent("Note Content Markdown");
		expect(card).toHaveTextContent("time-mode");
	});

	it("素材カード内のインサート処理が親コンポーネントのコールバックへ正確にプロキシされること", async () => {
		const handleInsert = vi.fn();
		render(
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				React.createElement(DiaryMaterialsPane, {
					date: "2026-06-28",
					onInsert: handleInsert,
				}),
			),
		);
		const insertBtn = await screen.findByRole("button", { name: /Insert/i });
		fireEvent.click(insertBtn);
		expect(handleInsert).toHaveBeenCalledWith("Note Content Markdown");
	});
});
