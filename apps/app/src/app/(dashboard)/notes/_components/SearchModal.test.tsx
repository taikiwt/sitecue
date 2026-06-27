import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchModal } from "./SearchModal";

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

// Mock useSearchNotes hook
const mockSearchNotes = vi.fn();
const mockFetchNoteContents = vi.fn();
vi.mock("@/hooks/useNotesQuery", () => ({
	useSearchNotes: (q: string) => mockSearchNotes(q),
	useFetchNoteContents: () => ({ mutate: mockFetchNoteContents }),
}));

const mockFetchDiaries = vi.fn(() => ({ data: [] as any[] }));
vi.mock("@/hooks/useDiariesQuery", () => ({
	useFetchDiaries: () => mockFetchDiaries(),
	useAppendDiary: () => ({ mutate: vi.fn() }),
	useUpdateDiary: () => ({ mutate: vi.fn() }),
}));

describe("SearchModal Context Jump", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should navigate to exact domain and set noteId when a note is clicked", async () => {
		const user = userEvent.setup();

		// Setup mock return value for search
		mockSearchNotes.mockReturnValue({
			data: {
				notes: [
					{
						id: "note-123",
						content: "Test Note Content",
						scope: "exact",
						url_pattern: "https://example.com/path",
						note_type: "info",
						created_at: new Date().toISOString(),
					},
				],
				drafts: [],
			},
			isLoading: false,
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		render(
			<QueryClientProvider client={queryClient}>
				<SearchModal isOpen={true} onClose={vi.fn()} />
			</QueryClientProvider>,
		);

		// Type in search box
		const input = screen.getByPlaceholderText(/search notes/i);
		await user.type(input, "Test");

		// Press Enter to trigger search
		await user.keyboard("{Enter}");

		// Wait for result to appear
		const noteResult = await screen.findByText("Test Note Content");
		await user.click(noteResult);

		// Verify navigation
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("domain=example.com"),
			);
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("exact=https%3A%2F%2Fexample.com%2Fpath"),
			);
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("noteId=note-123"),
			);
		});
	});

	it("should navigate to inbox for inbox scope notes", async () => {
		const user = userEvent.setup();

		mockSearchNotes.mockReturnValue({
			data: {
				notes: [
					{
						id: "note-inbox",
						content: "Inbox Note",
						scope: "inbox",
						url_pattern: "",
						note_type: "info",
						created_at: new Date().toISOString(),
					},
				],
				drafts: [],
			},
			isLoading: false,
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		render(
			<QueryClientProvider client={queryClient}>
				<SearchModal isOpen={true} onClose={vi.fn()} />
			</QueryClientProvider>,
		);

		const input = screen.getByPlaceholderText(/search notes/i);
		await user.type(input, "Inbox");
		await user.keyboard("{Enter}");

		const noteResult = await screen.findByText("Inbox Note");
		await user.click(noteResult);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("domain=inbox"),
			);
			expect(mockPush).toHaveBeenCalledWith(
				expect.stringContaining("noteId=note-inbox"),
			);
		});
	});

	it("should not trigger search on input change, only on submit", async () => {
		const _user = userEvent.setup();
		mockSearchNotes.mockReturnValue({
			data: { notes: [], drafts: [] },
			isLoading: false,
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		render(
			<QueryClientProvider client={queryClient}>
				<SearchModal isOpen={true} onClose={vi.fn()} />
			</QueryClientProvider>,
		);

		const input = screen.getByPlaceholderText(/search notes/i);
		fireEvent.change(input, { target: { value: "Test" } });

		// 途中経過で呼ばれていないことを確認
		expect(mockSearchNotes).not.toHaveBeenCalledWith("Test");

		// hit enter
		fireEvent.keyDown(input, { key: "Enter" });

		await waitFor(() => {
			expect(mockSearchNotes).toHaveBeenCalledWith("Test");
		});
	});

	it("should clear input and results when clear button is clicked", async () => {
		// Setup mock to return a result when query is "Test"
		mockSearchNotes.mockImplementation((q) => {
			if (q === "Test") {
				return {
					data: {
						notes: [
							{
								id: "1",
								content: "Test Result",
								url_pattern: "test.com",
								scope: "domain",
								note_type: "info",
								created_at: new Date().toISOString(),
							},
						],
						drafts: [],
					},
					isLoading: false,
				};
			}
			return { data: { notes: [], drafts: [] }, isLoading: false };
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		render(
			<QueryClientProvider client={queryClient}>
				<SearchModal isOpen={true} onClose={vi.fn()} />
			</QueryClientProvider>,
		);

		const input = screen.getByPlaceholderText("Search notes...");

		// 文字を入力し、Enterで検索実行
		fireEvent.change(input, { target: { value: "Test" } });
		fireEvent.keyDown(input, { key: "Enter" });

		// 結果が表示されていることを確認
		expect(await screen.findByText("Test Result")).toBeInTheDocument();

		// クリアボタンを押下
		const clearButton = screen.getByRole("button", { name: /clear search/i });
		fireEvent.click(clearButton);

		// inputと結果が両方クリアされていることを確認
		expect(input).toHaveValue("");
		expect(screen.queryByText("Test Result")).not.toBeInTheDocument();
		expect(
			screen.getByText(
				"Type and press Enter to search your notes across domains",
			),
		).toBeInTheDocument();
	});

	it("should render drafts and navigate on click", async () => {
		const user = userEvent.setup();
		const mockDrafts = [
			{
				id: "draft-1",
				title: "My Secret Draft",
				content: "Writing something...",
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				user_id: "user-1",
				metadata: null,
				template_id: null,
				tags: [],
			},
		];

		mockSearchNotes.mockReturnValue({
			data: { notes: [], drafts: mockDrafts },
			isLoading: false,
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		render(
			<QueryClientProvider client={queryClient}>
				<SearchModal isOpen={true} onClose={vi.fn()} />
			</QueryClientProvider>,
		);

		const input = screen.getByPlaceholderText(/search notes/i);
		await user.type(input, "Secret");
		await user.keyboard("{Enter}");

		await waitFor(() => {
			expect(screen.getByText("Drafts")).toBeInTheDocument();
			expect(screen.getByText("My Secret Draft")).toBeInTheDocument();
		});

		const draftResult = screen.getByText("My Secret Draft");
		await user.click(draftResult);

		expect(mockPush).toHaveBeenCalledWith("/notes?view=drafts&draftId=draft-1");
	});

	it("should cancel noise in pages when domain matches", async () => {
		const user = userEvent.setup();
		const mockNotes = [
			{
				id: "1",
				url_pattern: "example.com",
				scope: "domain",
				content: "domain note",
				created_at: new Date().toISOString(),
			},
			{
				id: "2",
				url_pattern: "https://example.com/page-1",
				scope: "exact",
				content: "page note",
				created_at: new Date().toISOString(),
			},
		];

		mockSearchNotes.mockReturnValue({
			data: { notes: mockNotes, drafts: [] },
			isLoading: false,
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		render(
			<QueryClientProvider client={queryClient}>
				<SearchModal isOpen={true} onClose={vi.fn()} />
			</QueryClientProvider>,
		);

		const input = screen.getByPlaceholderText(/search notes/i);
		// Focus timer is 100ms, so wait for it to settle
		await new Promise((resolve) => setTimeout(resolve, 150));
		await user.type(input, "example");
		await user.keyboard("{Enter}");

		await waitFor(() => {
			expect(screen.getByText("Domains")).toBeInTheDocument();
			expect(screen.getByText("example.com")).toBeInTheDocument();
			// Pagesセクションはレンダリングされないか、該当ページが含まれていないことを確認
			expect(
				screen.queryByText("https://example.com/page-1"),
			).not.toBeInTheDocument();
		});
	});

	it("グローバル検索で日記データが検索され、クリック時に正しいコンテキストパラメータにジャンプすること", async () => {
		const user = userEvent.setup();
		mockSearchNotes.mockReturnValue({
			data: { notes: [], drafts: [] },
			isLoading: false,
		});
		mockFetchDiaries.mockReturnValue({
			data: [
				{
					user_id: "user-1",
					date: "2026-06-27",
					content: "Diaries integrated test text line\nSecond line",
					topics: ["test"],
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			],
		});

		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		render(
			<QueryClientProvider client={queryClient}>
				<SearchModal isOpen={true} onClose={vi.fn()} />
			</QueryClientProvider>,
		);

		const input = screen.getByPlaceholderText(/search notes/i);
		// Focus timer is 100ms, so wait for it to settle
		await new Promise((resolve) => setTimeout(resolve, 150));
		await user.type(input, "integrated");
		await user.keyboard("{Enter}");

		// セクションおよび本文スニペット（一行目）の存在を確認
		await waitFor(() => {
			expect(screen.getByText("Diaries")).toBeInTheDocument();
			expect(
				screen.getByText("Diaries integrated test text line"),
			).toBeInTheDocument();
		});

		// クリックによる厳密なパラメータ遷移を検証
		const diaryResult = screen.getByText("Diaries integrated test text line");
		await user.click(diaryResult);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith(
				"/notes?view=diaries&year=2026&month=06&date=2026-06-27",
			);
		});
	});
});
