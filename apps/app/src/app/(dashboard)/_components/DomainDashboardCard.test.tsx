import type { DashboardDomainActivity } from "@sitecue/shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DomainDashboardCard } from "./DomainDashboardCard";

const mockData: DashboardDomainActivity = {
	domain: "example.com",
	total_count: 12,
	domain_notes: [
		{ id: "1", content: "Domain note content", is_resolved: false },
	],
	top_pages: [
		{
			page_url: "https://example.com/blog/1",
			page_title: "React Hooks Guide",
			page_count: 5,
			page_notes: [
				{ id: "2", content: "Page note content", is_resolved: true },
			],
		},
	],
};

describe("DomainDashboardCard", () => {
	it("renders domain and nested page structure with resolved note styling", () => {
		render(<DomainDashboardCard data={mockData} />);

		expect(screen.getByText("example.com")).toBeInTheDocument();
		expect(screen.getByText("12 notes")).toBeInTheDocument();
		expect(screen.getByText("React Hooks Guide")).toBeInTheDocument();

		const activeNote = screen.getByText("Domain note content");
		expect(activeNote).toBeInTheDocument();
		expect(activeNote.className).not.toContain("line-through");
		const domainNoteLink = activeNote.closest("a");
		expect(domainNoteLink?.getAttribute("href")).toBe(
			"/notes?domain=example.com&view=domains&exact=all&noteId=1",
		);

		const resolvedNote = screen.getByText("Page note content");
		expect(resolvedNote).toBeInTheDocument();
		expect(resolvedNote.className).toContain("line-through");
	});

	it("renders local domain with port correctly", () => {
		const mockLocalData: DashboardDomainActivity = {
			domain: "127.0.0.1:3000",
			total_count: 2,
			domain_notes: [
				{ id: "1", content: "Local note content", is_resolved: false },
			],
			top_pages: [],
		};

		render(<DomainDashboardCard data={mockLocalData} />);

		expect(screen.getByText("127.0.0.1:3000")).toBeInTheDocument();
		expect(screen.getByText("2 notes")).toBeInTheDocument();

		const activeNote = screen.getByText("Local note content");
		expect(activeNote).toBeInTheDocument();
	});
});
