import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NoteStatusBadge } from "./note-status-badge";

describe("NoteStatusBadge", () => {
	it("renders correctly and handles click event", () => {
		const handleClick = vi.fn();
		render(
			<NoteStatusBadge type="info" isResolved={false} onClick={handleClick} />,
		);

		const button = screen.getByRole("button");
		expect(button).toBeInTheDocument();
		expect(button).toHaveTextContent("info");

		fireEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("renders resolved state correctly", () => {
		const { container } = render(
			<NoteStatusBadge type="idea" isResolved={true} />,
		);

		const button = screen.getByRole("button");
		expect(button).toHaveTextContent("idea");
		// CheckCircle2用のクラス（SVG）が含まれているかなど基本的なレンダー確認
		expect(container.querySelector("svg")).toBeInTheDocument();
	});
});
