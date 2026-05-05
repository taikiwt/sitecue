import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaywallModal from "./PaywallModal";

describe("PaywallModal", () => {
	it("renders AI limit modal for free plan by default", () => {
		render(<PaywallModal isOpen={true} onClose={vi.fn()} plan="free" />);
		expect(screen.getByText("Monthly Generation Limit")).toBeInTheDocument();
		expect(
			screen.getByText(/You've used all your AI generations/),
		).toBeInTheDocument();
	});

	it("renders Note limit modal when limitType is 'notes'", () => {
		render(<PaywallModal isOpen={true} onClose={vi.fn()} limitType="notes" />);
		expect(screen.getByText("Storage Limit Reached")).toBeInTheDocument();
		expect(
			screen.getByText(/You've reached the maximum number of notes/),
		).toBeInTheDocument();
	});
});
