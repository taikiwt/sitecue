import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContributionTimeline } from "./ContributionTimeline";

// requireUser のモック化
vi.mock("@/utils/supabase/server", () => ({
	requireUser: vi.fn().mockResolvedValue({
		user: { id: "user-123" },
		supabase: {
			from: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						gte: vi.fn().mockReturnValue({
							order: vi.fn().mockResolvedValue({
								data: [
									{
										id: "note-exact-1",
										content: "This is an exact match note content",
										scope: "exact",
										url_pattern: "https://qiita.com/stock-feed",
										created_at: new Date().toISOString(),
										note_type: "idea",
									},
									{
										id: "note-inbox-1",
										content: "Inbox short note",
										scope: "inbox",
										url_pattern: "inbox",
										created_at: new Date().toISOString(),
										note_type: "info",
									},
								],
								error: null,
							}),
						}),
					}),
				}),
			}),
		},
	}),
}));

// custom-link のモック化
vi.mock("@/components/ui/custom-link", () => ({
	CustomLink: ({
		children,
		href,
		className,
	}: {
		children: React.ReactNode;
		href: string;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

describe("ContributionTimeline Component", () => {
	it("データベースの生の値 'exact' を露出させず、規約通りのURLパラメータおよび動的パスが構築されること", async () => {
		const JSX = await ContributionTimeline();
		render(JSX);

		expect(screen.queryByText("exact")).toBeNull();

		// 1. Exactノートの検証
		const titleElement = screen.getByText("https://qiita.com/stock-feed");
		const linkElement = titleElement.closest("a");
		const href = linkElement?.getAttribute("href");
		expect(href).toContain("domain=qiita.com");
		expect(href).toContain(
			`exact=${encodeURIComponent("https://qiita.com/stock-feed")}`,
		);
		expect(href).toContain("noteId=note-exact-1");

		// 2. Inboxノートの検証 (不要なexact/domainクエリがパージされていること)
		const inboxElement = screen.getByText("Inbox");
		const inboxLink = inboxElement.closest("a");
		const inboxHref = inboxLink?.getAttribute("href");
		expect(inboxHref).toBe("/notes?view=inbox&noteId=note-inbox-1");
	});
});
