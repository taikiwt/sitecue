import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
	useCreateNote,
	useDeleteNote,
	useUpdateNote,
} from "@/hooks/useNotesQuery";
import { useUserStore } from "@/store/useUserStore";
import type { Draft } from "../types";
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
	it("renders Edit in Studio link for drafts with correct href", async () => {
		vi.mocked(useCreateNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as any);
		vi.mocked(useUpdateNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as any);
		vi.mocked(useDeleteNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as any);

		const mockDraft: Draft = {
			id: "draft-123",
			content: "Test content",
			title: "Test Draft",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			user_id: "user-1",
			metadata: null,
			template_id: null,
			tags: null,
		};

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
		} as any);

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail isNewNote={true} />
			</QueryClientProvider>,
		);

		const saveButton = screen.getByRole("button", { name: "Save" });
		fireEvent.click(saveButton);

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
		const mockNote = {
			id: "1",
			user_id: "user1",
			url_pattern: "example.com",
			content: "Test Content",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			scope: "domain",
			note_type: "info",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
			is_expanded: false,
			sort_order: 0,
			tags: [],
		};

		vi.mocked(useUpdateNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as any);

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail note={mockNote as any} />
			</QueryClientProvider>,
		);

		expect(screen.getByText("Test Content")).toBeInTheDocument();
		expect(screen.getByText("example.com")).toBeInTheDocument();
	});
});
