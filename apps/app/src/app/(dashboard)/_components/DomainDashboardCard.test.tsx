import type { DashboardDomainActivity } from "@sitecue/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DomainDashboardCard } from "./DomainDashboardCard";

const mockData: DashboardDomainActivity = {
	domain: "example.com",
	total_count: 12,
	domain_notes: [{ id: "1", content: "Domain note content" }],
	top_pages: [
		{
			page_url: "https://example.com/blog/1",
			page_title: "React Hooks Guide",
			page_count: 5,
			page_notes: [{ id: "2", content: "Page note content" }],
		},
	],
};

describe("DomainDashboardCard", () => {
	it("renders domain and nested page structure with exact URL parameter routing and complete context links", () => {
		render(<DomainDashboardCard data={mockData} />);

		// ドメイン情報の検証
		expect(screen.getByText("example.com")).toBeInTheDocument();
		expect(screen.getByText("12 notes")).toBeInTheDocument();

		// ネストされたページ情報の検証
		expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();
		expect(screen.getByText("5 notes")).toBeInTheDocument();

		// ドメインおよびページ直下のノートスニペットの検証
		expect(screen.getByText("Domain note content")).toBeInTheDocument();
		expect(screen.getByText("Page note content")).toBeInTheDocument();

		// 英語ラベル化（日本語の排除）の検証
		expect(screen.getByText("Open")).toBeInTheDocument();

		// 各リンクが正しいクエリパラメータ（/notes?domain=... 形式）を持っているかの検証
		const links = screen.getAllByRole("link");

		const domainLink = links.find(
			(l) => l.getAttribute("href") === "/notes?domain=example.com&view=domain",
		);
		const pageLink = links.find(
			(l) =>
				l.getAttribute("href") ===
				`/notes?domain=example.com&view=exact&exact=${encodeURIComponent("https://example.com/blog/1")}`,
		);
		const externalDomainLink = links.find(
			(l) => l.getAttribute("href") === "https://example.com",
		);
		const externalPageLink = links.find(
			(l) => l.getAttribute("href") === "https://example.com/blog/1",
		);

		// ノートスニペットからのコンテキスト付きダイレクト起動リンクの検証
		const domainNoteLink = links.find(
			(l) =>
				l.getAttribute("href") ===
				"/notes?domain=example.com&view=domain&noteId=1",
		);
		const pageNoteLink = links.find(
			(l) =>
				l.getAttribute("href") ===
				`/notes?domain=example.com&view=exact&exact=${encodeURIComponent("https://example.com/blog/1")}&noteId=2`,
		);

		expect(domainLink).toBeDefined();
		expect(pageLink).toBeDefined();
		expect(externalDomainLink).toBeDefined();
		expect(externalPageLink).toBeDefined();
		expect(domainNoteLink).toBeDefined();
		expect(pageNoteLink).toBeDefined();

		// Verify that Open link exists and routes correctly
		const openLink = screen.getByRole("link", { name: /Open/i });
		expect(openLink).toHaveAttribute(
			"href",
			"/notes?domain=example.com&view=domain",
		);

		// Verify title attributes for tooltips
		const domainText = screen.getByText("example.com");
		expect(domainText).toHaveAttribute("title", "example.com");

		const pageLinkEl = screen.getByTitle("https://example.com/blog/1");
		expect(pageLinkEl).toBeInTheDocument();
	});
});
