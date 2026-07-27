import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LaunchpadPage from "./page";

vi.mock("@/utils/supabase/server", () => ({
	requireUser: vi.fn().mockResolvedValue({ id: "user-123" }),
}));

vi.mock("./_components/DashboardContainer", () => ({
	DashboardContainer: () => (
		<div data-testid="dashboard-container">Dashboard Content</div>
	),
}));

describe("LaunchpadPage Component", () => {
	it("renders DashboardContainer correctly inside Suspense boundary", async () => {
		const pageNode = await LaunchpadPage();
		render(pageNode);

		expect(
			await screen.findByTestId("dashboard-container"),
		).toBeInTheDocument();
	});
});
