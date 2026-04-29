import { act, fireEvent, render, screen } from "@testing-library/react";
import { Check, Copy, Search } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { HoverSwapButton } from "../hover-swap-button";

describe("HoverSwapButton", () => {
	it("should apply success classes when clicked", async () => {
		vi.useFakeTimers();
		render(
			<HoverSwapButton
				defaultIcon={<Search data-testid="default-icon" />}
				hoverIcon={<Copy data-testid="hover-icon" />}
				successIcon={<Check data-testid="success-icon" />}
			/>,
		);

		const button = screen.getByRole("button");

		// Initial state: default icon is visible, others are hidden/translated
		const defaultSpan = screen.getByTestId("default-icon").parentElement;
		const hoverSpan = screen.getByTestId("hover-icon").parentElement;
		const successSpan = screen.getByTestId("success-icon").parentElement;

		expect(defaultSpan?.className).toContain("opacity-100");
		expect(hoverSpan?.className).toContain("opacity-0");
		expect(successSpan?.className).toContain("opacity-0");

		// Click the button
		fireEvent.click(button);

		// Success state: success icon is visible, others are hidden
		expect(defaultSpan?.className).toContain("-translate-y-full opacity-0");
		expect(hoverSpan?.className).toContain("-translate-y-full opacity-0");
		expect(successSpan?.className).toContain("translate-y-0 opacity-100");

		// Fast-forward time
		act(() => {
			vi.advanceTimersByTime(1500);
		});

		// Back to initial state
		expect(defaultSpan?.className).toContain("opacity-100");
		expect(hoverSpan?.className).toContain("opacity-0");
		expect(successSpan?.className).toContain("opacity-0");

		vi.useRealTimers();
	});
});
