import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as useDiariesQuery from "@/hooks/useDiariesQuery";
import {
	useCreateNote,
	useDeleteNote,
	useUpdateNote,
} from "@/hooks/useNotesQuery";
import { useUserStore } from "@/store/useUserStore";
import { createMockDraft, createMockNote } from "../../../../mocks/factories";
import { RightPaneDetail } from "./RightPaneDetail";

vi.mock("@/hooks/useNotesQuery", () => ({
	useCreateNote: vi.fn(),
	useUpdateNote: vi.fn(),
	useDeleteNote: vi.fn(),
}));

vi.mock("@/hooks/useDiariesQuery", () => ({
	useFetchDiaries: vi.fn(() => ({ data: [] })),
	useAppendDiary: vi.fn(() => ({ mutate: vi.fn() })),
}));

let mockSearchParams = new URLSearchParams("?new=true");

// next/navigation のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	useSearchParams: () => mockSearchParams,
}));

// react-hot-toast のモック
vi.mock("react-hot-toast", () => ({
	default: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// CustomLink のモック
vi.mock("@/components/ui/custom-link", () => ({
	CustomLink: ({
		children,
		className,
		href,
	}: {
		href: string;
		children: ReactNode;
		className?: string;
	}) => (
		<a href={href} className={className} data-testid="custom-link">
			{children}
		</a>
	),
}));

// HoverRevealButton のモック
vi.mock("@/components/ui/hover-reveal-button", () => ({
	HoverRevealButton: ({
		href,
		text,
		icon,
		onClick,
	}: {
		href?: string;
		text: string;
		icon: ReactNode;
		onClick?: () => void;
	}) =>
		href ? (
			<a href={href} data-testid="hover-reveal-link" onClick={onClick}>
				{icon}
				<span>{text}</span>
			</a>
		) : (
			<button type="button" onClick={onClick} data-testid="hover-reveal-button">
				{icon}
				<span>{text}</span>
			</button>
		),
}));

describe("RightPaneDetail", () => {
	const writeTextMock = vi.fn().mockResolvedValue(undefined);

	beforeEach(() => {
		vi.clearAllMocks();
		mockSearchParams = new URLSearchParams("?new=true");
		Object.assign(navigator, {
			clipboard: {
				writeText: writeTextMock,
			},
		});
	});

	it("renders Edit in Studio link for drafts with correct href", async () => {
		vi.mocked(useCreateNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as unknown as ReturnType<typeof useCreateNote>);
		vi.mocked(useUpdateNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as unknown as ReturnType<typeof useUpdateNote>);
		vi.mocked(useDeleteNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as unknown as ReturnType<typeof useDeleteNote>);

		const mockDraft = createMockDraft({
			id: "draft-123",
			content: "Test content",
			title: "Test Draft",
			user_id: "user-1",
		});

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail draft={mockDraft} />
			</QueryClientProvider>,
		);

		const editLink = await screen.findByTestId("hover-reveal-link");
		expect(editLink).toHaveAttribute("href", "/studio/draft-123");
		expect(editLink).toHaveTextContent("Edit in Studio");
	});

	it("shows paywall modal when storage limit is reached", async () => {
		vi.mocked(useCreateNote).mockReturnValue({
			mutateAsync: vi
				.fn()
				.mockRejectedValue(new Error("note storage limit reached")),
		} as unknown as ReturnType<typeof useCreateNote>);

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail isNewNote={true} />
			</QueryClientProvider>,
		);

		const saveButton = screen.getByRole("button", { name: "Save" });
		await act(async () => {
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			expect(useUserStore.getState().isPaywallOpen).toBe(true);
			expect(useUserStore.getState().paywallType).toBe("notes");
		});
	});

	it("renders empty state when no note or draft is provided", () => {
		render(<RightPaneDetail />);
		expect(
			screen.getByText("Please select a note or draft from the list"),
		).toBeInTheDocument();
	});

	it("renders note content correctly with separated layout", async () => {
		const mockNote = createMockNote({
			id: "1",
			user_id: "user1",
			url_pattern: "example.com",
			content: "Test Content",
		});

		vi.mocked(useUpdateNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as unknown as ReturnType<typeof useUpdateNote>);

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail note={mockNote} />
			</QueryClientProvider>,
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
		expect(screen.getByText("example.com")).toBeInTheDocument();
	});

	it("copies formatted Source URL correctly via InlineCopyButton", async () => {
		const mockNote = createMockNote({
			id: "1",
			user_id: "user1",
			url_pattern: "example.com",
			content: "Test Content",
			scope: "exact",
		});

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail note={mockNote} />
			</QueryClientProvider>,
		);

		// Source URL copy button has title="Copy to clipboard"
		const copyButtons = screen.getAllByTitle("Copy to clipboard");
		await act(async () => {
			fireEvent.click(copyButtons[0]);
		});

		expect(writeTextMock).toHaveBeenCalledWith("https://example.com");
	});

	it("copies note content without success toast", async () => {
		const mockNote = createMockNote({
			id: "1",
			user_id: "user1",
			content: "Test Content",
			scope: "inbox", // Force inbox to hide Source URL button
		});

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail note={mockNote} />
			</QueryClientProvider>,
		);

		const copyButtons = screen.getAllByTitle("Copy to clipboard");
		// Now it should be the only one (or the first one)
		await act(async () => {
			fireEvent.click(copyButtons[0]);
		});

		expect(writeTextMock).toHaveBeenCalledWith("Test Content");
		expect(toast.success).not.toHaveBeenCalled();
	});

	it("opens edit mode, updates metadata and content simultaneously, and saves", async () => {
		const mockNote = createMockNote({
			id: "1",
			user_id: "user1",
			content: "Test Content",
			scope: "exact",
			url_pattern: "https://example.com/page",
			note_type: "info",
		});

		const mutateAsyncMock = vi.fn();
		vi.mocked(useUpdateNote).mockReturnValue({
			mutateAsync: mutateAsyncMock,
		} as unknown as ReturnType<typeof useUpdateNote>);

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail note={mockNote} />
			</QueryClientProvider>,
		);

		// 1. メインのEditボタン（テキスト="Edit"のリンク/ボタン）をクリック
		const editButton = screen.getByText("Edit");
		await act(async () => {
			fireEvent.click(editButton);
		});

		// 2. Note Type を 'idea' に変更
		const ideaButton = screen.getByRole("button", { name: "idea" });
		await act(async () => {
			fireEvent.click(ideaButton);
		});

		// 3. Scope を 'Domain' に変更（Selectではなくボタンのクリックへ変更）
		const domainButton = screen.getByRole("button", { name: "Domain" });
		await act(async () => {
			fireEvent.click(domainButton);
		});

		// 4. URLを入力（Scopeがdomainになったためplaceholderが変わっているはず）
		const urlInput = screen.getByPlaceholderText("example.com");
		await act(async () => {
			fireEvent.change(urlInput, { target: { value: "changed-domain.com" } });
		});

		// 5. Save ボタンをクリック
		const saveButton = screen.getByRole("button", { name: "Save" });
		await act(async () => {
			fireEvent.click(saveButton);
		});

		// 6. API呼び出しが正しい引数で行われたか検証
		expect(mutateAsyncMock).toHaveBeenCalledWith({
			id: "1",
			updates: {
				content: "Test Content",
				currentUrl: "changed-domain.com",
				scope: "domain",
				note_type: "idea",
			},
		});
	});

	it("opens delete dialog after clicking delete in more menu with delay", async () => {
		vi.useFakeTimers();
		const mockNote = createMockNote({
			id: "1",
			user_id: "user1",
			content: "Test Content",
		});

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail note={mockNote} />
			</QueryClientProvider>,
		);

		// Open more menu
		const moreButton = screen.getByLabelText("More options");
		await act(async () => {
			fireEvent.click(moreButton);
		});

		// Check if menu is open (Delete Note should be visible)
		const deleteButton = screen.getByRole("button", { name: "Delete Note" });
		expect(deleteButton).toBeInTheDocument();

		// Click delete button
		await act(async () => {
			fireEvent.click(deleteButton);
		});

		// Dialog should NOT be immediately open due to setTimeout
		expect(
			screen.queryByText("Are you absolutely sure?"),
		).not.toBeInTheDocument();

		// Advance timers
		await act(async () => {
			vi.advanceTimersByTime(150);
		});

		// Now dialog should be visible
		expect(screen.getByText("Are you absolutely sure?")).toBeInTheDocument();

		vi.useRealTimers();
	});

	it("does not render diary when date param exists but current view is not diaries", () => {
		// view=drafts だが、過去の遺物として date=2026-06-21 が残っている状況
		mockSearchParams = new URLSearchParams("?view=drafts&date=2026-06-21");

		// useFetchDiaries がモックデータ（該当日の日記）を返す状態を作る
		vi.spyOn(useDiariesQuery, "useFetchDiaries").mockReturnValue({
			data: [
				{
					date: "2026-06-21",
					content: "This is a leaked diary text",
					updated_at: new Date().toISOString(),
				},
			],
		} as unknown as ReturnType<typeof useDiariesQuery.useFetchDiaries>);

		render(<RightPaneDetail />);

		// 日記の内容が詳細ビューに貫通（リーク）していないことを検証
		expect(
			screen.queryByText("This is a leaked diary text"),
		).not.toBeInTheDocument();
		// 代わりに適切な空状態（Please select a note...）が表示されていることを確認
		expect(
			screen.getByText("Please select a note or draft from the list"),
		).toBeInTheDocument();
	});
});
