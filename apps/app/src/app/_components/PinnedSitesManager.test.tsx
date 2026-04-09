/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PinnedSitesManager } from "./PinnedSitesManager";

// Mock server actions to avoid import issues in limited test
vi.mock("../_actions/pinned-sites", () => ({
	addPinnedSite: vi.fn(),
	deletePinnedSite: vi.fn(),
}));

const mockSites = [
	{
		id: "1",
		title: "Google",
		url: "https://google.com",
		user_id: "user1",
		created_at: new Date().toISOString(),
	},
];

describe("PinnedSitesManager (Rendering only)", () => {
	it("renders initial sites correctly", () => {
		render(<PinnedSitesManager initialSites={mockSites} />);
		expect(screen.getByText("Google")).toBeDefined();
		expect(screen.getByText("google.com")).toBeDefined();
	});
});
