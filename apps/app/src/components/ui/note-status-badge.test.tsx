import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NoteStatusBadge } from "./note-status-badge";

describe("NoteStatusBadge", () => {
	it("Unresolved状態で正しくレンダリングされ、クリック時にバブリングを遮断してonClickが発火すること", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(
			<NoteStatusBadge isResolved={false} onClick={handleClick} type="info" />,
		);

		const button = screen.getByRole("button", { name: /info/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("title", "Type: Info (Click to toggle)");

		await user.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("onClick無しのUnresolved状態で title が Mark as resolved になること", () => {
		render(<NoteStatusBadge isResolved={false} type="info" />);
		const button = screen.getByRole("button", { name: /info/i });
		expect(button).toHaveAttribute("title", "Mark as resolved");
	});

	it("onClick無しのResolved状態で title が Mark as unresolved になること", () => {
		render(<NoteStatusBadge isResolved={true} type="alert" />);
		const button = screen.getByRole("button", { name: /alert/i });
		expect(button).toHaveAttribute("title", "Mark as unresolved");
	});
});
