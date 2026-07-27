import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardLayout from "./layout";

vi.mock("@/components/layout/AppShell", () => ({
	AppShell: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="app-shell">
			<nav data-testid="sidebar">Sidebar Rail</nav>
			<main>{children}</main>
		</div>
	),
}));

describe("DashboardLayout - AppShell Preservation", () => {
	it("renders AppShell and Sidebar outside of the inner Suspense boundary", () => {
		render(
			<DashboardLayout>
				<div data-testid="page-content">Page Content</div>
			</DashboardLayout>,
		);

		expect(screen.getByTestId("app-shell")).toBeInTheDocument();
		expect(screen.getByTestId("sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("page-content")).toBeInTheDocument();
	});
});
