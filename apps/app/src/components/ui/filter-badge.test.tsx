import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { FilterBadge } from "./filter-badge";

test("renders label and handles click", () => {
	const handleClick = vi.fn();
	render(<FilterBadge onClick={handleClick}>All</FilterBadge>);

	const button = screen.getByRole("button", { name: "All" });
	expect(button).toBeInTheDocument();

	fireEvent.click(button);
	expect(handleClick).toHaveBeenCalledTimes(1);
});

test("applies active styles when isActive is true", () => {
	render(<FilterBadge isActive>ActiveBadge</FilterBadge>);
	const button = screen.getByRole("button", { name: "ActiveBadge" });

	expect(button.className).toContain("bg-action");
	expect(button.className).toContain("text-action-text");
});
