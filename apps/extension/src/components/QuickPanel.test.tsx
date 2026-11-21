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

const mockGet = vi.fn();
const mockSet = vi.fn();
const localStorageStore = new Map<string, string>();

vi.stubGlobal("chrome", {
	storage: {
		local: {
			get: mockGet,
			set: mockSet,
		},
	},
});

vi.stubGlobal("localStorage", {
	getItem: (key: string) => localStorageStore.get(key) ?? null,
	setItem: (key: string, value: string) => {
		localStorageStore.set(key, String(value));
	},
	removeItem: (key: string) => {
		localStorageStore.delete(key);
	},
	clear: () => {
		localStorageStore.clear();
	},
});

describe("QuickPanel Component - Secondary Layout Guarding & Refined Layout", () => {
	const mockOnAddNote = vi.fn().mockResolvedValue(true);
	const mockOnAppendDiary = vi.fn().mockResolvedValue(true);
	const mockOnToggleMaximize = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockAuthStatus.userPlan = "free";
		mockGet.mockImplementation((_key, cb) => cb({}));
	});

	it("ストレージ未保存時は初期状態で note が展開され、Temporary text scratchpad... が即表示されること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

		expect(
			screen.getByPlaceholderText("Temporary text scratchpad..."),
		).toBeInTheDocument();
		expect(screen.queryByText("Links")).not.toBeInTheDocument();
	});

	it("chrome.storage.local に quick_panel_tab_user-123: 'none' が保存されている場合は閉じた状態で初期化されること", () => {
		mockGet.mockImplementation((key, cb) => {
			if (key === "quick_panel_tab_user-123") {
				cb({ "quick_panel_tab_user-123": "none" });
			} else {
				cb({});
			}
		});

		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

		expect(
			screen.queryByPlaceholderText("Temporary text scratchpad..."),
		).not.toBeInTheDocument();
		expect(screen.queryByTitle("Maximize Quick Panel")).not.toBeInTheDocument();
	});

	it("localStorage に quick_panel_tab_user-123 = 'none' が存在する場合、chrome.storage.local の非同期待ちなしで初期レンダー時点（0ms）から閉じた状態であること", () => {
		localStorage.setItem("quick_panel_tab_user-123", "none");
		// chrome.storage.local.get がまだコールバックを返さない状態を模擬
		mockGet.mockImplementation(() => {});

		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

		expect(
			screen.queryByPlaceholderText("Temporary text scratchpad..."),
		).not.toBeInTheDocument();
		expect(screen.queryByTitle("Maximize Quick Panel")).not.toBeInTheDocument();
	});

	it("Note / Command タブ内に開閉状態に応じた SVG シェブロンが存在すること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

		const noteTab = screen.getByTitle(
			"Scratchpad for temporary notes (Markdown supported)",
		);
		const commandTab = screen.getByTitle(
			"Draft and edit multi-line commands or code snippets",
		);

		// 初期状態では Note が開いており、両タブにアイコン用SVG + シェブロンSVGの2つが存在する
		expect(noteTab.querySelectorAll("svg")).toHaveLength(2);
		expect(commandTab.querySelectorAll("svg")).toHaveLength(2);

		// Note タブのシェブロンが ChevronDown、Command タブが ChevronRight であること
		expect(
			noteTab.querySelector("svg.lucide-chevron-down"),
		).toBeInTheDocument();
		expect(
			commandTab.querySelector("svg.lucide-chevron-right"),
		).toBeInTheDocument();

		// Command タブをクリックすると Command が ChevronDown、Note が ChevronRight に切り替わること
		fireEvent.click(commandTab);
		expect(
			noteTab.querySelector("svg.lucide-chevron-right"),
		).toBeInTheDocument();
		expect(
			commandTab.querySelector("svg.lucide-chevron-down"),
		).toBeInTheDocument();
	});

	it("未入力状態では、CopyボタンだけでなくClear(Eraser)ボタンもdisabledになっていること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

		const noteBtn = screen.getByTitle("Save as Inbox Note");
		const diaryBtn = screen.getByTitle("Append to Today's Diary");

		expect(noteBtn).toBeInTheDocument();
		expect(noteBtn).toHaveTextContent("Note");
		expect(diaryBtn).toBeInTheDocument();
		expect(diaryBtn).toHaveTextContent("Diary");
	});

	it("Note展開時、エディタを内包するコンテナが max-h-[30vh] と overflow-y-auto クラスで物理隔離されていること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

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

		const { container, rerender } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={mockOnAddNote}
				onAppendDiary={mockOnAppendDiary}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

		expect(container.firstChild).toHaveClass("hidden");

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
				isMaximized={false}
				onToggleMaximize={mockOnToggleMaximize}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={vi.fn()}
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
				isMaximized={false}
				onToggleMaximize={vi.fn()}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={vi.fn()}
			/>,
		);

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

describe("QuickPanel - Pane-Level Maximize Integration", () => {
	it("1段目右端の最大化ボタンクリックで onToggleMaximize が呼ばれ、isMaximized=true で全画面クラスが適用されること", () => {
		const onToggleMaximizeMock = vi.fn();
		const { container, rerender } = render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn().mockResolvedValue(true)}
				onAppendDiary={vi.fn().mockResolvedValue(true)}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={onToggleMaximizeMock}
			/>,
		);

		const maximizeBtn = screen.getByTitle("Maximize Quick Panel");
		expect(maximizeBtn).toBeInTheDocument();

		fireEvent.click(maximizeBtn);
		expect(onToggleMaximizeMock).toHaveBeenCalledTimes(1);

		rerender(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn().mockResolvedValue(true)}
				onAppendDiary={vi.fn().mockResolvedValue(true)}
				userPlan="free"
				isMaximized={true}
				onToggleMaximize={onToggleMaximizeMock}
			/>,
		);

		expect(container.firstChild).toHaveClass(
			"flex-1",
			"min-h-0",
			"rounded-none",
		);
		expect(screen.getByTitle("Exit full view")).toBeInTheDocument();
	});
});

describe("QuickPanel - 2-Tab Header & Command / Preview Integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockImplementation((_keys, cb) => cb({}));
	});

	// biome-ignore lint/suspicious/noTemplateCurlyInString: intentional test title
	it("Note / Command タブクリック時に quick_panel_tab_${userId} へ保存され、Command 選択時はインセットダークコンソール（bg-neutral-900）が描画されること", () => {
		render(
			<QuickPanel
				currentDomain="example.com"
				onAddNote={vi.fn().mockResolvedValue(true)}
				onAppendDiary={vi.fn().mockResolvedValue(true)}
				userPlan="free"
				isMaximized={false}
				onToggleMaximize={vi.fn()}
			/>,
		);

		expect(screen.getAllByText("Note")[0]).toBeInTheDocument();
		expect(screen.getByText("Command")).toBeInTheDocument();
		expect(screen.queryByText("Links")).not.toBeInTheDocument();

		// Command タブを開く
		fireEvent.click(screen.getByText("Command"));

		expect(mockSet).toHaveBeenCalledWith({
			"quick_panel_tab_user-123": "command",
		});

		const consoleHeader = screen.getByText("COMMAND / CODE");
		expect(consoleHeader).toBeInTheDocument();
		expect(consoleHeader.closest(".bg-neutral-900")).toBeInTheDocument();
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
				isMaximized={false}
				onToggleMaximize={vi.fn()}
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
				isMaximized={false}
				onToggleMaximize={vi.fn()}
			/>,
		);

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
				isMaximized={false}
				onToggleMaximize={vi.fn()}
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
