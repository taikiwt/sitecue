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
import {
	useCreateNote,
	useDeleteNote,
	useUpdateNote,
} from "@/hooks/useNotesQuery";
import { useUserStore } from "@/store/useUserStore";
import { createMockDraft, createMockNote } from "../../../../mocks/factories";
import { RightPaneDetail } from "./RightPaneDetail";

// useNotesQuery のモック
vi.mock("@/hooks/useNotesQuery", () => ({
	useCreateNote: vi.fn(),
	useUpdateNote: vi.fn(),
	useDeleteNote: vi.fn(),
}));

// next/navigation のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	useSearchParams: () => new URLSearchParams("?new=true"),
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
	}: {
		href: string;
		text: string;
		icon: ReactNode;
	}) => (
		<a href={href} data-testid="hover-reveal-link">
			{icon}
			<span>{text}</span>
		</a>
	),
}));

describe("RightPaneDetail", () => {
	const writeTextMock = vi.fn().mockResolvedValue(undefined);

	beforeEach(() => {
		vi.clearAllMocks();
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
});
