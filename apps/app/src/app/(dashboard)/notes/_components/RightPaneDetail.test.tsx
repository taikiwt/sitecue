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

// CustomLink のモックが必要な場合は適宜追加
vi.mock("@/components/ui/custom-link", () => ({
	CustomLink: ({
		href,
		children,
		className,
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
		} as Partial<ReturnType<typeof useCreateNote>> as ReturnType<
			typeof useCreateNote
		>);
		vi.mocked(useUpdateNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as Partial<ReturnType<typeof useUpdateNote>> as ReturnType<
			typeof useUpdateNote
		>);
		vi.mocked(useDeleteNote).mockReturnValue({
			mutateAsync: vi.fn(),
		} as Partial<ReturnType<typeof useDeleteNote>> as ReturnType<
			typeof useDeleteNote
		>);

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
		// Supabase クライアントが投げるエラーをシミュレート
		vi.mocked(useCreateNote).mockReturnValue({
			mutateAsync: vi
				.fn()
				.mockRejectedValue(new Error("note storage limit reached")),
		} as Partial<ReturnType<typeof useCreateNote>> as ReturnType<
			typeof useCreateNote
		>);

		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<RightPaneDetail isNewNote={true} />
			</QueryClientProvider>,
		);

		// コンテンツを入力してSaveを発火
		const saveButton = screen.getByRole("button", { name: "Save" });
		fireEvent.click(saveButton);

		// Store の状態が更新されることを検証
		await waitFor(() => {
			expect(useUserStore.getState().isPaywallOpen).toBe(true);
			expect(useUserStore.getState().paywallType).toBe("notes");
		});
	});
});
