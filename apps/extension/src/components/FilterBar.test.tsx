import { fireEvent, render, screen } from "@testing-library/react";
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
		isMaximized: false,
		onToggleMaximize: vi.fn(),
	};

	it("初期状態ではフィルタパネルが閉じており、フィルタトグルボタン押下で展開すること", () => {
		render(<FilterBar {...mockProps} />);
		expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();

		const toggleBtn = screen.getByTitle("Toggle filters and search");
		fireEvent.click(toggleBtn);

		expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
		expect(screen.getByText("#tag1")).toBeInTheDocument();
	});

	it("検索クエリやフィルタ条件が有効な場合、パネルが閉じていてもフィルタトグルボタンがハイライト（bg-action）され、インジケータドットが表示されること", () => {
		const { rerender } = render(
			<FilterBar {...mockProps} searchQuery="test" />,
		);
		const toggleBtn = screen.getByTitle("Toggle filters and search");
		expect(toggleBtn).toHaveClass("bg-action");
		expect(toggleBtn.querySelector(".bg-note-info")).toBeInTheDocument();

		// トグルを開くとインジケータドットが消え、クリアボタンも確認できること
		fireEvent.click(toggleBtn);
		expect(toggleBtn.querySelector(".bg-note-info")).not.toBeInTheDocument();
		expect(screen.getByTitle("Clear search")).toBeInTheDocument();

		rerender(<FilterBar {...mockProps} searchQuery="" />);
		expect(screen.queryByTitle("Clear search")).not.toBeInTheDocument();
	});

	it("右端の最大化ボタンクリックで onToggleMaximize が呼ばれること", () => {
		const onToggleMaximizeMock = vi.fn();
		render(
			<FilterBar {...mockProps} onToggleMaximize={onToggleMaximizeMock} />,
		);

		const maxBtn = screen.getByTitle("Maximize notes view");
		fireEvent.click(maxBtn);
		expect(onToggleMaximizeMock).toHaveBeenCalledTimes(1);
	});
});
