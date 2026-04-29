import { fireEvent, render, screen } from "@testing-library/react";
import toast from "react-hot-toast";
import { describe, expect, it, vi } from "vitest";
import { ComingSoonButton } from "./ComingSoonButton";

vi.mock("react-hot-toast", () => ({
	default: vi.fn(),
}));

describe("ComingSoonButton", () => {
	it("renders text and triggers toast on click", () => {
		render(<ComingSoonButton text="Upgrade" />);
		const button = screen.getByText("Upgrade");

		expect(button).toBeDefined();

		fireEvent.click(button);
		expect(toast).toHaveBeenCalledWith("Coming soon", { icon: "🚀" });
	});
});
