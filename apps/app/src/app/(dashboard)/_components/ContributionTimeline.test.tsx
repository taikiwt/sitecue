// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContributionTimeline } from "./ContributionTimeline";

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
	it("renders captured notes and created drafts grouped by date", () => {
		const mockNotes = [
			{
				id: "n-1",
				content: "Sample Note Content",
				is_resolved: false,
				scope: "domain" as const,
				url_pattern: "github.com",
				created_at: new Date().toISOString(),
				note_type: "info" as const,
			},
		];
		const mockDrafts = [
			{
				id: "d-1",
				title: "Sample Draft Title",
				content: "Draft content",
				created_at: new Date().toISOString(),
			},
		];

		render(<ContributionTimeline notes={mockNotes} drafts={mockDrafts} />);

		expect(screen.getByText("Today")).toBeInTheDocument();
		expect(screen.getByText("Captured Notes")).toBeInTheDocument();
		expect(screen.getByText("Created Drafts")).toBeInTheDocument();
		expect(screen.getByText("Sample Note Content")).toBeInTheDocument();
		expect(screen.getByText("Sample Draft Title")).toBeInTheDocument();
	});
});
