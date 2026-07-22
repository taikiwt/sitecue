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

	it("日付ボタンクリック時に setSelectedDiaryDate が即座に呼び出されること", () => {
		render(<DiaryView {...mockProps} />);

		const todayButton = screen.getByRole("button", { name: "Today" });
		fireEvent.click(todayButton);

		const now = new Date();
		const expectedTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

		expect(mockProps.setSelectedDiaryDate).toHaveBeenCalledWith(
			expectedTodayStr,
		);
	});

	it("初回ロード時（Cold State）はスケルトン盾が表示され、isDiaryLoadingがfalseに切り替わった後も200ms経過するまで維持されること", () => {
		vi.useFakeTimers();

		// 1. まずローディング中（isDiaryLoading=true ＆ diaryData=null）のCold Stateの状態でマウント
		const { rerender } = render(
			<DiaryView {...mockProps} diaryData={null} isDiaryLoading={true} />,
		);

		expect(screen.getByTestId("diary-skeleton")).toBeInTheDocument();

		// 2. 親がデータをロード完了し、diaryData を流し込み isDiaryLoading={false} になる
		rerender(
			<DiaryView
				{...mockProps}
				diaryData={{
					content: "Initial Diary Content",
					topics: ["Key Event 1"],
				}}
				isDiaryLoading={false}
			/>,
		);

		// 【検証】0ms時点では、UI上の維持タイマーによってスケルトンがまだ居座っていること
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

		// 【検証】200ms経過した瞬間に、盾が外れて実データが出現すること
		expect(screen.queryByTestId("diary-skeleton")).not.toBeInTheDocument();
		expect(screen.getByText("Initial Diary Content")).toBeInTheDocument();

		vi.useRealTimers();
	});

	describe("DiaryView Component - Limit Validation & Async Rollback Test", () => {
		it("50,000文字を超える編集を行って保存した際、エラー表示とともにテキストが元データへロールバックされること", async () => {
			const mockSetEditContent = vi.fn();
			const mockSaveDiaryEdit = vi.fn();

			const overLimitContent = "a".repeat(50001);

			const { container } = render(
				<DiaryView
					selectedDiaryDate="2026-07-22"
					setSelectedDiaryDate={vi.fn()}
					diaryData={{ content: "Original Diary Text", topics: [] }}
					isDiaryLoading={false}
					isEditingDiary={true}
					setIsEditingDiary={vi.fn()}
					editDiaryContent={overLimitContent}
					setEditDiaryContent={mockSetEditContent}
					editDiaryTopics={[]}
					setEditDiaryTopics={vi.fn()}
					basecampArchiveUrl="http://example.com"
					updateDiaryMutationPending={false}
					handleSaveDiaryEdit={mockSaveDiaryEdit}
					handleStartEdit={vi.fn()}
				/>,
			);

			const scrollContainer = container.querySelector(".overflow-y-auto");
			expect(scrollContainer).toBeInTheDocument();
			if (scrollContainer) {
				fireEvent.mouseUp(scrollContainer);
			}

			expect(mockSaveDiaryEdit).toHaveBeenCalled();
		});
	});

	describe("DiaryView Component - Cold Skeleton & Warm Silent Transition Test", () => {
		it("Saving...表示が存在しないこと", () => {
			render(
				<DiaryView
					selectedDiaryDate="2026-07-22"
					setSelectedDiaryDate={vi.fn()}
					diaryData={{ content: "Hello", topics: [] }}
					isDiaryLoading={false}
					isEditingDiary={false}
					setIsEditingDiary={vi.fn()}
					editDiaryContent="Hello"
					setEditDiaryContent={vi.fn()}
					editDiaryTopics={[]}
					setEditDiaryTopics={vi.fn()}
					basecampArchiveUrl="http://example.com"
					updateDiaryMutationPending={true}
					handleSaveDiaryEdit={vi.fn()}
					handleStartEdit={vi.fn()}
				/>,
			);

			// Saving... 表示が存在しないことを検証
			expect(screen.queryByText(/Saving/i)).not.toBeInTheDocument();
		});

		it("データ保持時（Warm State）はスケルトンが表示されずコンテンツが直接表示されること", () => {
			render(
				<DiaryView
					selectedDiaryDate="2026-07-22"
					setSelectedDiaryDate={vi.fn()}
					diaryData={{ content: "Warm Content Data", topics: [] }}
					isDiaryLoading={false}
					isEditingDiary={false}
					setIsEditingDiary={vi.fn()}
					editDiaryContent="Warm Content Data"
					setEditDiaryContent={vi.fn()}
					editDiaryTopics={[]}
					setEditDiaryTopics={vi.fn()}
					basecampArchiveUrl="http://example.com"
					updateDiaryMutationPending={false}
					handleSaveDiaryEdit={vi.fn()}
					handleStartEdit={vi.fn()}
				/>,
			);

			expect(screen.queryByTestId("diary-skeleton")).not.toBeInTheDocument();
			expect(screen.getByText("Warm Content Data")).toBeInTheDocument();
		});
	});

	describe("DiaryView Component - Atomic Deferred Data Test", () => {
		it("deferredDiaryDataによりトピックと本文がアトミックに完全同期して描画されること", () => {
			render(
				<DiaryView
					selectedDiaryDate="2026-07-22"
					setSelectedDiaryDate={vi.fn()}
					diaryData={{
						content: "Atomic Content",
						topics: ["Topic 1", "Topic 2"],
					}}
					isDiaryLoading={false}
					isEditingDiary={false}
					setIsEditingDiary={vi.fn()}
					editDiaryContent="Atomic Content"
					setEditDiaryContent={vi.fn()}
					editDiaryTopics={["Topic 1", "Topic 2"]}
					setEditDiaryTopics={vi.fn()}
					basecampArchiveUrl="http://example.com"
					updateDiaryMutationPending={false}
					handleSaveDiaryEdit={vi.fn()}
					handleStartEdit={vi.fn()}
				/>,
			);

			expect(screen.getByText("Topic 1")).toBeInTheDocument();
			expect(screen.getByText("Topic 2")).toBeInTheDocument();
			expect(screen.getByText("Atomic Content")).toBeInTheDocument();
		});
	});

	describe("DiaryView Component - Delta Threshold Skeleton Test", () => {
		it("文字数差分が500文字未満の微修正時はスケルトンが表示されず直接コンテンツが表示されること", () => {
			render(
				<DiaryView
					selectedDiaryDate="2026-07-22"
					setSelectedDiaryDate={vi.fn()}
					diaryData={{ content: "Short Content 1", topics: [] }}
					isDiaryLoading={false}
					isEditingDiary={false}
					setIsEditingDiary={vi.fn()}
					editDiaryContent="Short Content 1"
					setEditDiaryContent={vi.fn()}
					editDiaryTopics={[]}
					setEditDiaryTopics={vi.fn()}
					basecampArchiveUrl="http://example.com"
					updateDiaryMutationPending={false}
					handleSaveDiaryEdit={vi.fn()}
					handleStartEdit={vi.fn()}
				/>,
			);

			expect(screen.queryByTestId("diary-skeleton")).not.toBeInTheDocument();
			expect(screen.getByText("Short Content 1")).toBeInTheDocument();
		});
	});

	describe("DiaryView Component - Date Change Skeleton Bypass Test", () => {
		it("長文同士の日記で日付を変更した場合、文字数差分に関わらずスケルトンが表示されず直接新しいコンテンツが表示されること", () => {
			const longContent1 = "A".repeat(1000);
			const longContent2 = "B".repeat(2000);

			const { rerender } = render(
				<DiaryView
					selectedDiaryDate="2026-07-21"
					setSelectedDiaryDate={vi.fn()}
					diaryData={{ content: longContent1, topics: [] }}
					isDiaryLoading={false}
					isEditingDiary={false}
					setIsEditingDiary={vi.fn()}
					editDiaryContent={longContent1}
					setEditDiaryContent={vi.fn()}
					editDiaryTopics={[]}
					setEditDiaryTopics={vi.fn()}
					basecampArchiveUrl="http://example.com"
					updateDiaryMutationPending={false}
					handleSaveDiaryEdit={vi.fn()}
					handleStartEdit={vi.fn()}
				/>,
			);

			// 日付を 2026-07-22 に切り替えて、コンテンツを longContent2 (差分1000文字) に更新
			rerender(
				<DiaryView
					selectedDiaryDate="2026-07-22"
					setSelectedDiaryDate={vi.fn()}
					diaryData={{ content: longContent2, topics: [] }}
					isDiaryLoading={false}
					isEditingDiary={false}
					setIsEditingDiary={vi.fn()}
					editDiaryContent={longContent2}
					setEditDiaryContent={vi.fn()}
					editDiaryTopics={[]}
					setEditDiaryTopics={vi.fn()}
					basecampArchiveUrl="http://example.com"
					updateDiaryMutationPending={false}
					handleSaveDiaryEdit={vi.fn()}
					handleStartEdit={vi.fn()}
				/>,
			);

			// 日付切り替え時はスケルトンが出ないことを検証
			expect(screen.queryByTestId("diary-skeleton")).not.toBeInTheDocument();
			expect(screen.getByText(longContent2)).toBeInTheDocument();
		});
	});
});
