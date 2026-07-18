import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuickPanel from "./QuickPanel";

vi.mock("../hooks/useQuickLinks", () => ({
	useQuickLinks: () => ({
		links: [
			{
				id: "1",
				label: "Docs",
				target_url: "https://docs.com",
				type: "related",
				domain: "example.com",
			},
		],
		loading: false,
		addLink: vi.fn(),
		updateLink: vi.fn(),
		deleteLink: vi.fn(),
	}),
}));

const mockGet = vi.fn();
const mockSet = vi.fn();

vi.stubGlobal("chrome", {
	storage: {
		local: {
			get: mockGet,
			set: mockSet,
		},
	},
});

describe("QuickPanel Component - Secondary Layout Guarding & Refined Layout", () => {
	const mockOnAddNote = vi.fn().mockResolvedValue(true);
	const mockOnAppendDiary = vi.fn().mockResolvedValue(true);

	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockImplementation((_key, cb) => cb({}));
	});

	it("未入力状態では、CopyボタンだけでなくClear(Eraser)ボタンもdisabledになっていること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);
		fireEvent.click(screen.getByText("Quick Note"));

		const clearBtn = screen.getByTitle("Clear text");
		const copyBtn = screen.getByTitle("Copy text");

		expect(clearBtn).toBeDisabled();
		expect(copyBtn).toBeDisabled();
	});

	it("送信カプセルボタン(Note/Diary)が存在し、紙飛行機アイコンと正しいツールチップを持っていること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);
		fireEvent.click(screen.getByText("Quick Note"));

		const noteBtn = screen.getByTitle("Save as Inbox Note");
		const diaryBtn = screen.getByTitle("Append to Today's Diary");

		expect(noteBtn).toBeInTheDocument();
		expect(noteBtn).toHaveTextContent("Note");
		expect(diaryBtn).toBeInTheDocument();
		expect(diaryBtn).toHaveTextContent("Diary");
	});

	it("Quick Linksアコーディオンが開いていても閉じていても、リンク数が4件以下の時はヘッダー右側にファビコン画像が常時維持されること", () => {
		const { container } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);

		// 1. 初期閉鎖状態での画像露出チェック
		const faviconImg = container.querySelector("img");
		expect(faviconImg).toBeInTheDocument();
		expect(faviconImg?.getAttribute("src")).toContain(
			"favicons?domain=docs.com",
		);

		// 2. 開いた状態（展開時）でも画像がパージされず維持されることを検証
		const linksTrigger = screen.getByText("Quick Links");
		fireEvent.click(linksTrigger);
		expect(container.querySelector("img")).toBeInTheDocument();
	});

	it("Quick Note展開時、エディタを内包するコンテナが max-h-[30vh] と overflow-y-auto クラスで物理隔離されていること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);
		fireEvent.click(screen.getByText("Quick Note"));

		const textarea = screen.getByPlaceholderText(
			"Temporary text scratchpad... (Cross-site session persistent)",
		);
		const scrollContainer = textarea.parentElement;

		expect(scrollContainer).toHaveClass("max-h-[30vh]");
		expect(scrollContainer).toHaveClass("overflow-y-auto");
	});
});
