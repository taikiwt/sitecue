import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnimatedIconButton } from "./animated-icon-button";
import { HoverRevealButton } from "./hover-reveal-button";
import { HoverSwapButton } from "./hover-swap-button";

describe("UI Micro-interaction Buttons", () => {
	it("HoverRevealButton renders icon and reveals text", () => {
		render(
			<HoverRevealButton
				icon={<svg data-testid="icon" aria-hidden="true" />}
				text="Reveal Me"
				onClick={vi.fn()}
			/>,
		);
		expect(screen.getByTestId("icon")).toBeInTheDocument();
		expect(screen.getByText("Reveal Me")).toBeInTheDocument();
	});

	it("HoverSwapButton renders icons and handles click", async () => {
		const handleClick = vi.fn();
		render(
			<HoverSwapButton
				defaultIcon={<span data-testid="default">D</span>}
				hoverIcon={<span data-testid="hover">H</span>}
				onClick={handleClick}
			/>,
		);
		expect(screen.getByTestId("default")).toBeInTheDocument();
		expect(screen.getByTestId("hover")).toBeInTheDocument();

		const button = screen.getByRole("button");
		await userEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("AnimatedIconButton applies active state styling", () => {
		const { rerender } = render(
			<AnimatedIconButton
				icon={<span data-testid="outline">Outline</span>}
				activeIcon={<span data-testid="filled">Filled</span>}
				isActive={false}
			/>,
		);

		const outlineParent = screen.getByTestId("outline").parentElement;
		expect(outlineParent?.className).toContain("opacity-100");

		rerender(
			<AnimatedIconButton
				icon={<span data-testid="outline">Outline</span>}
				activeIcon={<span data-testid="filled">Filled</span>}
				isActive={true}
			/>,
		);
		expect(outlineParent?.className).toContain("opacity-0");
	});
});
