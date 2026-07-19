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

	it("文字入力時は 300ms 以内であればストレージの物理書き込みを実行しないこと", async () => {
		vi.useFakeTimers();
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);
		fireEvent.click(screen.getByText("Quick Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, { target: { value: "Hello Antigravity" } });

		// 300ms 未満の時点では chrome.storage.local.set は呼ばれていないことを検証
		expect(mockSet).not.toHaveBeenCalledWith({
			quick_note_text: "Hello Antigravity",
		});

		// タイマーを 300ms 進めることで初めて実行されることの証明
		vi.advanceTimersByTime(300);
		expect(mockSet).toHaveBeenCalledWith({
			quick_note_text: "Hello Antigravity",
		});
		vi.useRealTimers();
	});

	it("高速タイピング中に onBlur（フォーカスアウト）した際は、即座に Flush（強制同期）を実行すること", async () => {
		vi.useFakeTimers();
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);
		fireEvent.click(screen.getByText("Quick Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, { target: { value: "Flush Me Immediately" } });

		// デバウンス時間を待たずにフォーカスアウトイベントを発火
		fireEvent.blur(textarea);

		// 0ms で即座にストレージへ書き込まれていることをアサーション
		expect(mockSet).toHaveBeenCalledWith({
			quick_note_text: "Flush Me Immediately",
		});
		vi.useRealTimers();
	});

	it("文字入力直後にコンポーネントがアンマウントされた際、レースコンディションを起こさず最新の入力値でストレージに即時 Flush 保存すること", async () => {
		vi.useFakeTimers();
		const mockOnAddNote = vi.fn().mockResolvedValue(true);
		const mockOnAppendDiary = vi.fn().mockResolvedValue(true);
		const { unmount } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);
		fireEvent.click(screen.getByText("Quick Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		// 高速入力アクションを発火
		fireEvent.change(textarea, {
			target: { value: "Save this before unmount!" },
		});

		// 300msデバウンスの消化を待たずに、即座にアンマウント（サイドパネル閉鎖をエミュレート）
		unmount();

		// 安全装置が作動し、最新値で正しく物理保存されていることを厳密に検証
		expect(mockSet).toHaveBeenCalledWith({
			quick_note_text: "Save this before unmount!",
		});
		vi.useRealTimers();
	});

	it("サイドパネル閉鎖時に currentDomain が null へ揺らいでも、コンポーネントがアンマウント（自己破壊）されず、最新の Ref バッファが保護されること", async () => {
		vi.useFakeTimers();
		const mockOnAddNote = vi.fn().mockResolvedValue(true);
		const mockOnAppendDiary = vi.fn().mockResolvedValue(true);

		// 初期状態（ドメインが存在する状態）でレンダリング
		const { rerender } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);
		fireEvent.click(screen.getByText("Quick Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, {
			target: { value: "Protect this absolute lifeline!" },
		});

		// サイドパネル閉鎖の瞬間（currentDomain が null になる揺らぎ）をエミュレートして再レンダリング（rerender）
		rerender(
			<QuickPanel
				currentDomain={null}
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);

		// コンポーネントが物理消滅（return null）せず、DOM上に構造（hidden状態のdiv）として生き残っていることを検証
		const headerContainer = screen.getByText("Quick Note").closest("div");
		const container = headerContainer?.parentElement;
		expect(container).toHaveClass("hidden");

		// この極限状態（pagehide等の発火）において、空文字ではなく正しい値がストレージへ Flush されることを証明
		fireEvent.blur(textarea);
		expect(mockSet).not.toHaveBeenCalledWith({ quick_note_text: "" });
		expect(mockSet).toHaveBeenCalledWith({
			quick_note_text: "Protect this absolute lifeline!",
		});

		vi.useRealTimers();
	});

	it("ストレージからの非同期 get がまだ完了していない起動初期化フェーズにおいて、不意に Flush が走っても、防壁が作動して空文字による上書き破壊を物理的に100%ロックすること", async () => {
		vi.useFakeTimers();
		const mockOnAddNote = vi.fn().mockResolvedValue(true);
		const mockOnAppendDiary = vi.fn().mockResolvedValue(true);

		// get のコールバックがまだ解決されていない（＝ロード未完了）状態を作るため、mockGetの実装を一時的にコールバックを呼ばない形にする
		mockGet.mockImplementation(() => {});

		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
			/>,
		);

		// このロード未完了の隙（isStorageLoadedRef.current === false）に、強制的に外部からアンマウントやBlur等でFlushを誘発
		// テキストエリアを取得して blur をエミュレート
		fireEvent.click(screen.getByText("Quick Note"));
		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.blur(textarea);

		// ロック（防壁）が正常作動し、空文字での上書き保存（chrome.storage.local.set）が絶対に実行されていないことを厳密に実証！
		expect(mockSet).not.toHaveBeenCalled();

		vi.useRealTimers();
	});
});
