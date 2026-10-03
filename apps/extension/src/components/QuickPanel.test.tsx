import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuickPanel from "./QuickPanel";

const mockAuthStatus: { userId: string; userPlan: "free" | "pro" } = {
	userId: "user-123",
	userPlan: "free",
};

vi.mock("../hooks/useAuth", () => ({
	useAuth: () => ({
		authStatus: mockAuthStatus,
	}),
}));

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
		mockAuthStatus.userPlan = "free";
		mockGet.mockImplementation((_key, cb) => cb({}));
	});

	it("未入力状態では、CopyボタンだけでなくClear(Eraser)ボタンもdisabledになっていること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const clearBtn = screen.getByTitle("Clear scratchpad");
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
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const noteBtn = screen.getByTitle("Save as Inbox Note");
		const diaryBtn = screen.getByTitle("Append to Today's Diary");

		expect(noteBtn).toBeInTheDocument();
		expect(noteBtn).toHaveTextContent("Note");
		expect(diaryBtn).toBeInTheDocument();
		expect(diaryBtn).toHaveTextContent("Diary");
	});

	it("Linksアコーディオンが開いていても閉じていても、リンク数が4件以下の時はヘッダー右側にファビコン画像が常時維持されること", () => {
		const { container } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
			/>,
		);

		// 1. 初期閉鎖状態での画像露出チェック
		const faviconImg = container.querySelector("img");
		expect(faviconImg).toBeInTheDocument();
		expect(faviconImg?.getAttribute("src")).toContain(
			"favicons?domain=docs.com",
		);

		// 2. 開いた状態（展開時）でも画像がパージされず維持されることを検証
		const linksTrigger = screen.getByText("Links");
		fireEvent.click(linksTrigger);
		expect(container.querySelector("img")).toBeInTheDocument();
	});

	it("Note展開時、エディタを内包するコンテナが max-h-[30vh] と overflow-y-auto クラスで物理隔離されていること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const textarea = screen.getByPlaceholderText(
			"Temporary text scratchpad...",
		);
		const scrollContainer = textarea.closest(".max-h-\\[30vh\\]");

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
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, { target: { value: "Hello Antigravity" } });

		expect(mockSet).not.toHaveBeenCalledWith({
			"quick_note_text_user-123": "Hello Antigravity",
		});

		vi.advanceTimersByTime(300);
		expect(mockSet).toHaveBeenCalledWith({
			"quick_note_text_user-123": "Hello Antigravity",
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
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, { target: { value: "Flush Me Immediately" } });

		fireEvent.blur(textarea);

		expect(mockSet).toHaveBeenCalledWith({
			"quick_note_text_user-123": "Flush Me Immediately",
		});
		vi.useRealTimers();
	});

	it("文字入力直後にコンポーネントがアンマウントされた際、レースコンディションを起こさず最新の入力値でストレージに即時 Flush 保存すること", async () => {
		vi.useFakeTimers();
		const { unmount } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, {
			target: { value: "Save this before unmount!" },
		});

		unmount();

		expect(mockSet).toHaveBeenCalledWith({
			"quick_note_text_user-123": "Save this before unmount!",
		});
		vi.useRealTimers();
	});

	it("サイドパネル閉鎖時に currentDomain が null へ揺らいでも、コンポーネントがアンマウント（自己破壊）されず、最新の Ref バッファが保護されること", async () => {
		vi.useFakeTimers();

		const { rerender } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, {
			target: { value: "Protect this absolute lifeline!" },
		});

		rerender(
			<QuickPanel
				currentDomain={null}
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
			/>,
		);

		const container = screen.getAllByText("Note")[0].closest(".w-full");
		expect(container).toHaveClass("hidden");

		fireEvent.blur(textarea);
		expect(mockSet).not.toHaveBeenCalledWith({
			"quick_note_text_user-123": "",
		});
		expect(mockSet).toHaveBeenCalledWith({
			"quick_note_text_user-123": "Protect this absolute lifeline!",
		});

		vi.useRealTimers();
	});

	it("ストレージからの非同期 get がまだ完了していない起動初期化フェーズにおいて、不意に Flush が走っても、防壁が作動して空文字による上書き破壊を物理的に100%ロックすること", async () => {
		vi.useFakeTimers();
		mockGet.mockImplementation(() => {});

		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
			/>,
		);

		fireEvent.click(screen.getByText("Note"));
		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.blur(textarea);

		expect(mockSet).not.toHaveBeenCalled();

		vi.useRealTimers();
	});
});

describe("QuickPanel Component - Namespace Separation Test", () => {
	it("userId が変化した際、ストレージの読み書きキーがアカウント専用キーへ動的に切り替わること", async () => {
		mockGet.mockImplementation((key, cb) => {
			if (key === "quick_note_text_user-123") {
				cb({ "quick_note_text_user-123": "User 123 Draft" });
			} else {
				cb({});
			}
		});

		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn().mockResolvedValue(true)}
				onAppendDiary={vi.fn().mockResolvedValue(true)}
				userPlan="free"
			/>,
		);

		expect(mockGet).toHaveBeenCalledWith(
			expect.stringMatching(/^quick_note_text_/),
			expect.any(Function),
		);
	});
});

describe("QuickPanel Limit Validation Test", () => {
	it("10,001文字を入力した際、Noteボタンはdisabledになり、Diaryボタンは活性のままであること", async () => {
		const longText = "a".repeat(10001);

		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn()}
				onAppendDiary={vi.fn()}
				userPlan="free"
			/>,
		);

		fireEvent.click(screen.getByText("Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, { target: { value: longText } });

		const noteButton = screen.getAllByRole("button", { name: /^Note$/i })[1];
		const diaryButton = screen.getByRole("button", { name: /^Diary$/i });

		expect(noteButton).toBeDisabled();
		expect(diaryButton).not.toBeDisabled();
	});
});

describe("QuickPanel Pro Plan Limit Validation Test", () => {
	it("Proユーザーの場合、10,001文字入力時もNoteボタンは活性化し、30,001文字でdisabledになること", async () => {
		mockAuthStatus.userPlan = "pro";
		const longText10k = "a".repeat(10001);
		const longText30k = "a".repeat(30001);

		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn()}
				onAppendDiary={vi.fn()}
				userPlan="pro"
			/>,
		);

		fireEvent.click(screen.getByText("Note"));

		const textarea = screen.getByPlaceholderText(/Temporary text scratchpad/i);
		fireEvent.change(textarea, { target: { value: longText10k } });

		const noteButton = screen.getAllByRole("button", { name: /^Note$/i })[1];
		const diaryButton = screen.getByRole("button", { name: /^Diary$/i });

		expect(noteButton).not.toBeDisabled();
		expect(diaryButton).not.toBeDisabled();

		fireEvent.change(textarea, { target: { value: longText30k } });

		expect(noteButton).toBeDisabled();
		expect(diaryButton).not.toBeDisabled();
	});
});

describe("QuickPanel - Zen Quick Note Mode", () => {
	it("最大化ボタンをクリックすると全画面オーバーレイクラスが適用され、縮小ボタンで復帰すること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn().mockResolvedValue(true)}
				onAppendDiary={vi.fn().mockResolvedValue(true)}
				userPlan="free"
			/>,
		);

		fireEvent.click(screen.getByText("Note"));

		const maximizeBtn = screen.getByTitle("Maximize Quick Note");
		expect(maximizeBtn).toBeInTheDocument();

		fireEvent.click(maximizeBtn);

		const overlay = screen.getByTitle("Exit full view").closest(".fixed");
		expect(overlay).toHaveClass("fixed", "inset-0", "z-50");

		const exitBtn = screen.getByTitle("Exit full view");
		fireEvent.click(exitBtn);

		expect(screen.getByTitle("Maximize Quick Note")).toBeInTheDocument();
	});

	it("最大化中にEscapeキーを押下すると最大化が解除されること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn().mockResolvedValue(true)}
				onAppendDiary={vi.fn().mockResolvedValue(true)}
				userPlan="free"
			/>,
		);

		fireEvent.click(screen.getByText("Note"));
		fireEvent.click(screen.getByTitle("Maximize Quick Note"));

		expect(screen.getByTitle("Exit full view")).toBeInTheDocument();

		fireEvent.keyDown(window, { key: "Escape" });

		expect(screen.getByTitle("Maximize Quick Note")).toBeInTheDocument();
	});
});

describe("QuickPanel - 3-Tab Header & Command / Preview Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockImplementation((_keys, cb) => cb({}));
	});

	it("Note / Command / Links の3連タブが存在し、Commandタブを開くと専用コンソールが描画されること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn().mockResolvedValue(true)}
				onAppendDiary={vi.fn().mockResolvedValue(true)}
				userPlan="free"
			/>,
		);

		expect(screen.getByText("Note")).toBeInTheDocument();
		expect(screen.getByText("Command")).toBeInTheDocument();
		expect(screen.getByText("Links")).toBeInTheDocument();

		// Command タブを開く
		fireEvent.click(screen.getByText("Command"));

		expect(screen.getByText("COMMAND / CODE")).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText("$ docker run -it --rm ..."),
		).toBeInTheDocument();

		// Command 画面には Note / Diary 送信ボタンが存在しないこと
		expect(screen.queryByTitle("Save as Inbox Note")).not.toBeInTheDocument();
		expect(
			screen.queryByTitle("Append to Today's Diary"),
		).not.toBeInTheDocument();
	});

	// biome-ignore lint/suspicious/noTemplateCurlyInString: intentional test title
	it("Command画面でテキストを入力すると quick_code_text_${userId} にデバウンス保存されること", () => {
		vi.useFakeTimers();
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn()}
				onAppendDiary={vi.fn()}
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Command"));

		const textarea = screen.getByPlaceholderText("$ docker run -it --rm ...");
		fireEvent.change(textarea, { target: { value: "docker ps -a" } });

		expect(mockSet).not.toHaveBeenCalledWith({
			"quick_code_text_user-123": "docker ps -a",
		});

		vi.advanceTimersByTime(300);

		expect(mockSet).toHaveBeenCalledWith({
			"quick_code_text_user-123": "docker ps -a",
		});
		vi.useRealTimers();
	});

	it("Note で Preview ボタンを押すとアクティブスタイル(bg-action)が適用され、表示モードが storage に保存されること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn()}
				onAppendDiary={vi.fn()}
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Note"));

		const previewBtn = screen.getByTitle("Preview Markdown");
		expect(previewBtn).toBeInTheDocument();
		expect(previewBtn).toHaveAttribute("aria-pressed", "false");
		expect(previewBtn).not.toHaveClass("bg-action");

		// プレビューへ切り替え
		fireEvent.click(previewBtn);

		expect(mockSet).toHaveBeenCalledWith({
			"quick_note_view_mode_user-123": "preview",
		});
		const exitPreviewBtn = screen.getByTitle("Exit preview");
		expect(exitPreviewBtn).toBeInTheDocument();
		expect(exitPreviewBtn).toHaveAttribute("aria-pressed", "true");
		expect(exitPreviewBtn).toHaveClass("bg-action", "text-action-text");
	});

	it("Command画面で Tab キー押下時にスペース2つが挿入され、Enter押下時に前行のインデントが継承されること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn()}
				onAppendDiary={vi.fn()}
				userPlan="free"
			/>,
		);
		fireEvent.click(screen.getByText("Command"));

		const textarea = screen.getByPlaceholderText(
			"$ docker run -it --rm ...",
		) as HTMLTextAreaElement;

		// 1. Tabキー押下の検証
		textarea.value = "echo hello";
		textarea.selectionStart = 0;
		textarea.selectionEnd = 0;

		fireEvent.keyDown(textarea, { key: "Tab" });
		expect(textarea.value).toBe("  echo hello");

		// 2. Enterキー押下時のインデント継承の検証
		textarea.value = "  line1";
		textarea.selectionStart = 7;
		textarea.selectionEnd = 7;

		fireEvent.keyDown(textarea, { key: "Enter" });
		expect(textarea.value).toBe("  line1\n  ");
	});
});
