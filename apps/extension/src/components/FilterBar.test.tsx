import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Note } from "../hooks/useNotes";
import FilterBar from "./FilterBar";

describe("FilterBar Component", () => {
	const mockNotes: Note[] = [
		{
			id: "1",
			content: "Note 1",
			note_type: "info",
			scope: "exact",
			url_pattern: "example.com",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
			sort_order: 1,
			created_at: new Date().toISOString(),
		},
		{
			id: "2",
			content: "Note 2",
			note_type: "alert",
			scope: "exact",
			url_pattern: "example.com",
			is_resolved: false,
			is_pinned: false,
			is_favorite: false,
			sort_order: 2,
			created_at: new Date().toISOString(),
		},
	] as unknown as Note[];

	const mockProps = {
		filterType: "all" as const,
		setFilterType: vi.fn(),
		showResolved: false,
		setShowResolved: vi.fn(),
		viewScope: "exact" as const,
		setViewScope: vi.fn(),
		searchQuery: "",
		setSearchQuery: vi.fn(),
		filteredNotes: mockNotes,
		selectedTag: null,
		setSelectedTag: vi.fn(),
		availableTags: ["tag1", "tag2"],
	};

	it("検索クエリがある場合、クリアボタンが表示されること", () => {
		const { rerender } = render(
			<FilterBar {...mockProps} searchQuery="test" />,
		);
		expect(screen.getByTitle("Clear search")).toBeInTheDocument();

		rerender(<FilterBar {...mockProps} searchQuery="" />);
		expect(screen.queryByTitle("Clear search")).not.toBeInTheDocument();
	});

	it("コピーボタンをクリックしてメニューからTextコピーができること", async () => {
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: writeTextMock },
			configurable: true,
		});

		render(<FilterBar {...mockProps} />);

		const copyButton = screen.getByLabelText("Open copy options menu");
		fireEvent.click(copyButton);

		const copyTextButton = screen.getByText("Copy as Text");
		fireEvent.click(copyTextButton);

		expect(writeTextMock).toHaveBeenCalledWith("Note 1\n\nNote 2");
	});

	it("タグのフェードマスクが正しくレンダリングされること", () => {
		render(<FilterBar {...mockProps} />);

		expect(screen.getByText("#tag1")).toBeInTheDocument();
		// Mask要素がaria-hidden="true"で存在すること
		const mask = document.querySelector(
			'div[aria-hidden="true"].pointer-events-none',
		);
		expect(mask).toBeInTheDocument();
		expect(mask?.className).toContain("to-base-surface");
	});
});
