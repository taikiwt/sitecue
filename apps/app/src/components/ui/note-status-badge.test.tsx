import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NoteStatusBadge } from "./note-status-badge";

describe("NoteStatusBadge", () => {
	it("renders correctly with unresolved state", () => {
		render(<NoteStatusBadge type="info" isResolved={false} />);
		const button = screen.getByRole("button", { name: /info/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("title", "Mark as resolved");
		expect(button).toHaveClass("text-note-info");
	});

	it("renders correctly with resolved state", () => {
		render(<NoteStatusBadge type="alert" isResolved={true} />);
		const button = screen.getByRole("button", { name: /alert/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute("title", "Mark as unresolved");
		expect(button).toHaveClass("text-note-alert");
	});

	it("calls onClick handler when clicked", async () => {
		const handleClick = vi.fn();
		const user = userEvent.setup();
		render(
			<NoteStatusBadge type="idea" isResolved={false} onClick={handleClick} />,
		);

		const button = screen.getByRole("button", { name: /idea/i });
		await user.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});
});
