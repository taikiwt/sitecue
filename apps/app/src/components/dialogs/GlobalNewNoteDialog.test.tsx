import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorStore } from "@/store/useEditorStore";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useUserStore } from "@/store/useUserStore";
import { GlobalNewNoteDialog } from "./GlobalNewNoteDialog";

// next/navigation のモック
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush, replace: mockReplace }),
	useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("react-hot-toast", () => ({
	default: { error: vi.fn(), success: vi.fn() },
}));

// カスタムフックのモック
const mockMutateAsync = vi.fn().mockRejectedValue({
	message: "note storage limit reached",
	code: "P0001",
});

vi.mock("@/hooks/useNotesQuery", () => ({
	useCreateNote: () => ({
		mutateAsync: mockMutateAsync,
	}),
}));

vi.mock("@/hooks/useDiariesQuery", () => ({
	useFetchDiaries: vi.fn(() => ({ data: [] })),
	useAppendDiary: () => ({
		mutateAsync: vi.fn().mockResolvedValue({}),
	}),
}));

// NotesEditor のモック
vi.mock("@/components/editor/NotesEditor", () => ({
	NotesEditor: ({
		onChange,
		value,
	}: {
		onChange: (val: string) => void;
		value: string;
	}) => (
		<textarea
			data-testid="notes-editor"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

describe("GlobalNewNoteDialog (Zustand In-Memory Context)", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		vi.clearAllMocks();
		queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		useUserStore.setState({ isPaywallOpen: false });
		useLayoutStore.setState({
			globalNewModal: { isOpen: false, mode: "gate" },
		});
		mockUseSearchParams.mockReturnValue(new URLSearchParams(""));
	});

	it("ZustandストアがOpenの時にダイアログが正常にマウントされ、初期ゲート画面が表示されること", async () => {
		useLayoutStore.getState().openGlobalNewModal("gate");

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		expect(screen.getByText("What would you like to capture?")).toBeDefined();
		expect(screen.getByText("Quick Note")).toBeDefined();
		expect(screen.getByText("Daily Diary")).toBeDefined();
	});

	it("インメモリでのモード切り替え（Note）がスムーズに行われること", async () => {
		useLayoutStore.getState().openGlobalNewModal("gate");

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		const quickNoteButton = screen.getByText("Quick Note");
		fireEvent.click(quickNoteButton);

		expect(screen.getByText("Quick Note Mode")).toBeDefined();
		expect(screen.getByText("Scope")).toBeDefined();
	});

	it("closes itself and opens paywall when limit reached error occurs", async () => {
		useLayoutStore.getState().openGlobalNewModal("note");

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Test note" } });

		const saveButton = screen.getByRole("button", { name: "Save Note" });
		fireEvent.click(saveButton);

		await waitFor(() => {
			// 1. ZustandのModalがクローズされること
			expect(useLayoutStore.getState().globalNewModal.isOpen).toBe(false);
			// 2. Paywall が開くこと
			expect(useUserStore.getState().isPaywallOpen).toBe(true);
			expect(useUserStore.getState().paywallType).toBe("notes");
			// 3. 汎用エラーが出ないこと
			expect(toast.error).not.toHaveBeenCalled();
		});
	});

	it("sanitizes 'all' reserved words from search parameters via passive sync", async () => {
		const params = new URLSearchParams(
			"globalNew=note&intent=note&exact=all&domain=all",
		);
		mockUseSearchParams.mockReturnValue(params);

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		// Passive sync should open the modal in note mode
		expect(useLayoutStore.getState().globalNewModal.isOpen).toBe(true);
		expect(useLayoutStore.getState().globalNewModal.mode).toBe("note");

		// Inbox状態なのでURLのInput自体が存在しないことを確認
		expect(
			screen.queryByPlaceholderText(
				"[example.com/page](https://example.com/page)",
			),
		).not.toBeInTheDocument();

		const inboxButton = screen.getByRole("button", { name: "inbox" });
		expect(inboxButton).toHaveClass("capitalize");
	});

	it("falls back to domain scope when domain is valid and not 'all' via passive sync", async () => {
		const params = new URLSearchParams(
			"globalNew=note&intent=note&domain=example.com",
		);
		mockUseSearchParams.mockReturnValue(params);

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		expect(
			screen.getByPlaceholderText(
				"[example.com/page](https://example.com/page)",
			),
		).toHaveValue("example.com");
		const domainButton = screen.getByRole("button", { name: "domain" });
		expect(domainButton).toBeInTheDocument();
	});

	it("disables Save button when scope requires URL but it is empty", async () => {
		useLayoutStore.getState().openGlobalNewModal("note");

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		// Set scope to domain
		const domainBtn = screen.getByRole("button", { name: "domain" });
		fireEvent.click(domainBtn);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Test note" } });

		const saveButton = screen.getByRole("button", { name: "Save Note" });

		// URLがないので無効
		expect(saveButton).toBeDisabled();

		// URLを入力する
		const urlInput = screen.getByPlaceholderText(
			"[example.com/page](https://example.com/page)",
		);
		fireEvent.change(urlInput, { target: { value: "example.com" } });

		// 有効化されることを確認
		expect(saveButton).not.toBeDisabled();

		// URLを空にする
		fireEvent.change(urlInput, { target: { value: "   " } }); // trimして空になる値

		// 無効化されることを確認
		expect(saveButton).toBeDisabled();

		// Inboxに変更するとURLが不要になるので有効になることを確認
		const inboxButton = screen.getByRole("button", { name: "inbox" });
		fireEvent.click(inboxButton);
		expect(saveButton).not.toBeDisabled();
	});

	it("promotes to studio correctly and saves pending content", async () => {
		useLayoutStore.getState().openGlobalNewModal("note");

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		const editor = screen.getByTestId("notes-editor");
		fireEvent.change(editor, { target: { value: "Draft idea for studio" } });

		const promoteBtn = screen.getByRole("button", {
			name: "Edit in Studio",
		});
		fireEvent.click(promoteBtn);

		// Storeに値が保持されたことの確認
		expect(useEditorStore.getState().pendingContent).toBe(
			"Draft idea for studio",
		);
		// ダイアログが閉じられたことの確認
		expect(useLayoutStore.getState().globalNewModal.isOpen).toBe(false);
		// Studio画面へ遷移したことの確認
		expect(mockPush).toHaveBeenCalledWith("/studio/new");
	});

	it("renders diary input layout when globalNewModal mode is 'diary'", async () => {
		useLayoutStore.getState().openGlobalNewModal("diary");

		render(
			<QueryClientProvider client={queryClient}>
				<GlobalNewNoteDialog />
			</QueryClientProvider>,
		);

		// New Note title should not be rendered
		expect(screen.queryByText("New Note")).toBeNull();

		// Large text area should be present
		const textarea = screen.getByPlaceholderText(
			"Write down your thoughts for today... (No title required)",
		);
		expect(textarea).toBeInTheDocument();
	});
});
