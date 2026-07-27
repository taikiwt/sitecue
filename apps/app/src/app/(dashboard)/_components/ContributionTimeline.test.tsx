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
	it("renders contribution timeline items correctly from notes and drafts props", () => {
		const mockNotes = [
			{
				id: "n-1",
				content: "Sample Note Content",
				is_resolved: false,
				scope: "inbox" as const,
				url_pattern: "inbox",
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
		expect(screen.getByText("(2 activities)")).toBeInTheDocument();
		expect(screen.getByText("Sample Note Content")).toBeInTheDocument();
		expect(screen.getByText("Sample Draft Title")).toBeInTheDocument();
	});
});
