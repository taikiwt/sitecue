import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DiaryView from "./DiaryView";

describe("DiaryView Auto-save and Drag-safe Padding Focus Interactive Tests", () => {
	const mockProps = {
		selectedDiaryDate: "2026-07-16",
		setSelectedDiaryDate: vi.fn(),
		diaryData: { content: "Initial Diary Content", topics: ["Key Event 1"] },
		isDiaryLoading: false,
		isEditingDiary: false,
		setIsEditingDiary: vi.fn(),
		editDiaryContent: "",
		setEditDiaryContent: vi.fn(),
		editDiaryTopics: [] as string[],
		setEditDiaryTopics: vi.fn(),
		basecampArchiveUrl: "http://example.com",
		updateDiaryMutationPending: false,
		handleSaveDiaryEdit: vi.fn(),
		handleStartEdit: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("閲覧モード中、コンテンツ内部のクリック（同一座標でのMouseDown/Up）で handleStartEdit が正しく起動すること", () => {
		render(<DiaryView {...mockProps} />);

		const topic = screen.getByText("Key Event 1");
		expect(topic).toBeInTheDocument();

		fireEvent.mouseDown(topic, { clientX: 100, clientY: 100 });
		fireEvent.mouseUp(topic, { clientX: 100, clientY: 100 });

		expect(mockProps.handleStartEdit).toHaveBeenCalledTimes(1);
	});

	it("閲覧モード中、パディング余白（p-6コンテナ）をクリックしただけでは handleStartEdit が起動しないこと", () => {
		const { container } = render(<DiaryView {...mockProps} />);

		const scrollContainer = container.querySelector(".overflow-y-auto");
		expect(scrollContainer).toBeInTheDocument();

		if (scrollContainer) {
			fireEvent.mouseDown(scrollContainer, { clientX: 10, clientY: 10 });
			fireEvent.mouseUp(scrollContainer, { clientX: 10, clientY: 10 });
		}

		expect(mockProps.handleStartEdit).not.toHaveBeenCalled();
	});

	it("編集モード中、スクロールコンテナ（p-6余白）をクリックした際に handleSaveDiaryEdit が正しくトリガーされること", () => {
		const editingProps = {
			...mockProps,
			isEditingDiary: true,
			editDiaryContent: "Modified Content",
		};

		const { container } = render(<DiaryView {...editingProps} />);
		const scrollContainer = container.querySelector(".overflow-y-auto");
		expect(scrollContainer).toBeInTheDocument();

		if (scrollContainer) {
			fireEvent.mouseUp(scrollContainer);
		}

		expect(mockProps.handleSaveDiaryEdit).toHaveBeenCalledTimes(1);
	});

	it("編集モード中、エディタ内部でのクリック時は event.stopPropagation によって handleSaveDiaryEdit がガードされること", () => {
		const editingProps = {
			...mockProps,
			isEditingDiary: true,
			editDiaryContent: "Modified Content",
		};

		render(<DiaryView {...editingProps} />);
		const textarea = screen.getByPlaceholderText(
			"Write down your thoughts... (Markdown supported)",
		);
		expect(textarea).toBeInTheDocument();

		fireEvent.mouseDown(textarea);
		fireEvent.mouseUp(textarea);

		expect(mockProps.handleSaveDiaryEdit).not.toHaveBeenCalled();
	});

	it("トピック追加フォームに文字を入力しAddボタンをクリックした際、正しく setEditDiaryTopics がコールされること", () => {
		const editingProps = {
			...mockProps,
			isEditingDiary: true,
			editDiaryTopics: ["Existing Topic"],
		};

		render(<DiaryView {...editingProps} />);

		const input = screen.getByPlaceholderText("Add a key event...");
		const addButton = screen.getByRole("button", { name: "Add" });

		fireEvent.change(input, { target: { value: "New Unique Topic" } });
		fireEvent.click(addButton);

		expect(mockProps.setEditDiaryTopics).toHaveBeenCalledWith([
			"Existing Topic",
			"New Unique Topic",
		]);
	});

	it("isDiaryLoadingがfalseに切り替わっても、200ms経過するまではスケルトン盾が維持されること", () => {
		vi.useFakeTimers();

		// 1. まずローディング中（true）の状態でマウント
		const { rerender } = render(
			<DiaryView {...mockProps} isDiaryLoading={true} />,
		);

		expect(screen.getByTestId("diary-skeleton")).toBeInTheDocument();

		// 2. 親が高速にデータをロード完了し、isDiaryLoading={false} を流し込む
		rerender(<DiaryView {...mockProps} isDiaryLoading={false} />);

		// 【検証】0ms時点では、UI上の遅延フラグによってスケルトンがまだ居座っていること
		expect(screen.getByTestId("diary-skeleton")).toBeInTheDocument();

		// 3. タイマーを150ms進める（まだ200msに満たない）
		act(() => {
			vi.advanceTimersByTime(150);
		});
		expect(screen.getByTestId("diary-skeleton")).toBeInTheDocument();

		// 4. 残り50ms進めて合計200msに到達させる
		act(() => {
			vi.advanceTimersByTime(50);
		});

		// 【検証】200ms経過した瞬間に、盾が外れて実データ（Initial Diary Content）が出現すること
		expect(screen.queryByTestId("diary-skeleton")).not.toBeInTheDocument();
		expect(screen.getByText("Initial Diary Content")).toBeInTheDocument();

		vi.useRealTimers();
	});
});
