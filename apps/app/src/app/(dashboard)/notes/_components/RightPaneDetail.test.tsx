import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Draft } from "../types";
import { RightPaneDetail } from "./RightPaneDetail";

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

// HoverRevealLink のモック
vi.mock("@/components/ui/hover-reveal-link", () => ({
	HoverRevealLink: ({
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
		const mockDraft: Draft = {
			id: "draft-123",
			content: "Test content",
			title: "Test Draft",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			user_id: "user-1",
			metadata: null,
			template_id: null,
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
});
