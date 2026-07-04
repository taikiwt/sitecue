import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "./FilterBar";

describe("FilterBar Component", () => {
	const mockProps = {
		filterType: "all" as const,
		setFilterType: vi.fn(),
		showResolved: false,
		setShowResolved: vi.fn(),
		viewScope: "exact" as const,
		setViewScope: vi.fn(),
		searchQuery: "",
		setSearchQuery: vi.fn(),
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
