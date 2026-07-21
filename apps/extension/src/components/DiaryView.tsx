import { Loader2, X } from "lucide-react";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useMarkdownAssist } from "../hooks/useMarkdownAssist";
import MarkdownRenderer from "./MarkdownRenderer";

const SKELETON_HOLD_DURATION = 200; // 最低表示維持時間（200ms）

interface DiaryViewProps {
	selectedDiaryDate: string;
	setSelectedDiaryDate: (date: string) => void;
	diaryData: { content?: string; topics?: string[] } | null | undefined;
	isDiaryLoading: boolean;
	isEditingDiary: boolean;
	setIsEditingDiary: (editing: boolean) => void;
	editDiaryContent: string;
	setEditDiaryContent: (content: string) => void;
	editDiaryTopics: string[];
	setEditDiaryTopics: (topics: string[]) => void;
	basecampArchiveUrl: string;
	updateDiaryMutationPending: boolean;
	handleSaveDiaryEdit: () => Promise<void>;
	handleStartEdit: () => void;
}

export default function DiaryView({
	selectedDiaryDate,
	setSelectedDiaryDate,
	diaryData,
	isDiaryLoading,
	isEditingDiary,
	setIsEditingDiary,
	editDiaryContent,
	setEditDiaryContent,
	editDiaryTopics,
	setEditDiaryTopics,
	basecampArchiveUrl,
	updateDiaryMutationPending,
	handleSaveDiaryEdit,
	handleStartEdit,
}: DiaryViewProps) {
	const [newTopic, setNewTopic] = useState("");
	const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(
		null,
	);
	const [editingTopicText, setEditingTopicText] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { onKeyDown, onPaste } = useMarkdownAssist();

	// 💡 カプセルボタンUI着色（selectedDiaryDate: 0ms）と重いコンテンツ描画を Concurrent 非同期分離
	const deferredSelectedDiaryDate = useDeferredValue(selectedDiaryDate);

	// 💡 フリッカーを防止するためのインメモリ遅延フラグを配備
	const [stableLoading, setStableLoading] = useState(isDiaryLoading);

	useEffect(() => {
		if (isDiaryLoading) {
			// ローディング開始時は最速でスケルトンを展開（CLSを防御）
			setStableLoading(true);
		} else {
			// データが着信した（falseになった）時は、最低200msの猶予を持たせてから解除
			const timer = setTimeout(() => {
				setStableLoading(false);
			}, SKELETON_HOLD_DURATION);

			return () => clearTimeout(timer);
		}
	}, [isDiaryLoading]);

	// マウス押し下げ時の座標
	const startCoords = useRef({ x: 0, y: 0 });

	const handleMouseDown = (e: React.MouseEvent) => {
		startCoords.current = { x: e.clientX, y: e.clientY };
	};

	// 境界判定 ＆ ドラッグ座標差分検知付きのシングルクリック編集モード移行
	const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
		if (isEditingDiary) return;

		const dx = Math.abs(e.clientX - startCoords.current.x);
		const dy = Math.abs(e.clientY - startCoords.current.y);

		// 5px以上マウスが動いていた場合は「テキストのドラッグ選択」とみなしてガード
		if (dx > 5 || dy > 5) {
			return;
		}

		const target = e.target as HTMLElement;
		if (
			target.closest("a") ||
			target.closest("button") ||
			target.closest("input") ||
			target.closest(".copy-button") ||
			target.closest(".task-list-item-checkbox")
		) {
			return; // リンクやチェックボックス等のインタラクティブ要素は除外
		}

		handleStartEdit();
		setTimeout(() => {
			textareaRef.current?.focus();
		}, 50);
	};

	// 編集モード中のヘッダーやパディング余白のクリック復帰処理
	const handleOuterMouseUp = (_e: React.MouseEvent) => {
		if (isEditingDiary) {
			handleSaveDiaryEdit();
		}
	};

	// エディタ領域内クリックによる不必要な閲覧復帰を防ぐための伝播ブロック
	const stopPropagation = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	const handleAddTopic = () => {
		const val = newTopic.trim();
		if (!val || editDiaryTopics.includes(val)) return;
		const updated = [...editDiaryTopics, val];
		setEditDiaryTopics(updated);
		setNewTopic("");
	};

	const handleRemoveTopic = (index: number) => {
		const updated = editDiaryTopics.filter((_, i) => i !== index);
		setEditDiaryTopics(updated);
	};

	const handleSaveTopicEdit = (index: number) => {
		const val = editingTopicText.trim();
		const updated = [...editDiaryTopics];
		if (!val) {
			updated.splice(index, 1);
		} else {
			updated[index] = val;
		}
		setEditDiaryTopics(updated);
		setEditingTopicIndex(null);
	};

	return (
		<div className="flex flex-col h-full w-full space-y-3 min-h-0">
			{/* 3日間日付カプセル */}
			<div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none shrink-0 items-center">
				{Array.from({ length: 3 }).map((_, i) => {
					const d = new Date();
					d.setDate(d.getDate() - i);
					const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
					return (
						<button
							key={dateStr}
							type="button"
							onClick={() => {
								if (isEditingDiary) {
									handleSaveDiaryEdit(); // 別の日に切り替えた際も現在の変更をセーブ
								}
								setSelectedDiaryDate(dateStr);
								setIsEditingDiary(false);
							}}
							className={`cursor-pointer px-3.5 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
								selectedDiaryDate === dateStr
									? "bg-action text-action-text"
									: "bg-base-bg text-muted-foreground hover:bg-base-border/40"
							}`}
						>
							{i === 0 ? "Today" : dateStr.substring(5)}
						</button>
					);
				})}
				<a
					href={basecampArchiveUrl}
					target="_blank"
					rel="noreferrer"
					className="px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap bg-base-bg text-muted-foreground hover:text-action flex items-center gap-1 border border-dashed border-base-border/60"
				>
					<span>... Basecamp ↗</span>
				</a>
			</div>

			{/* 純白の手帳カード */}
			<div className="bg-white text-neutral-900 rounded-xl border border-base-border/60 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 cursor-default text-left">
				{/* 固定ヘッダー（編集モード時はクリック/MouseUpで閲覧モードに復帰可能、日付表示部は cursor-pointer 化） */}
				{/* biome-ignore lint/a11y/useSemanticElements: interactive div as header trigger */}
				<div
					onMouseUp={isEditingDiary ? handleOuterMouseUp : undefined}
					className={`sticky top-0 z-10 bg-white px-3 py-2 border-b border-neutral-100 flex justify-between items-center shrink-0`}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" && isEditingDiary) {
							handleOuterMouseUp(e as unknown as React.MouseEvent);
						}
					}}
				>
					<span className="text-xs font-bold text-neutral-500 font-mono tracking-wide">
						{deferredSelectedDiaryDate}
					</span>
					{updateDiaryMutationPending && (
						<div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
							<Loader2 className="w-3 h-3 animate-spin text-action" />
							<span>Saving...</span>
						</div>
					)}
				</div>

				{/* スクロール隔離インナーコンテナ：余白を p-6 に広げる */}
				<div
					onMouseUp={isEditingDiary ? handleOuterMouseUp : undefined}
					className="flex-1 overflow-y-auto p-5 flex flex-col min-h-0 [overflow-wrap:anywhere] break-words"
					role="document"
				>
					{stableLoading ? (
						/* 美しいシマー付きスケルトン盾で骨組みを隠蔽し、レイアウトシフト（CLS）を防止 */
						<div
							className="flex flex-col gap-4 w-full animate-pulse"
							data-testid="diary-skeleton"
						>
							<div className="h-12 bg-neutral-100 rounded-xl w-full" />
							<div className="space-y-3 mt-2 flex-1">
								<div className="h-4 bg-neutral-100 rounded w-full" />
								<div className="h-4 bg-neutral-100 rounded w-11/12" />
								<div className="h-4 bg-neutral-100 rounded w-full" />
								<div className="h-4 bg-neutral-100 rounded w-4/5" />
							</div>
						</div>
					) : isEditingDiary ? (
						// 編集モード中のコンテンツ（stopPropagationで余白クリックバブリングを防ぐ）
						// biome-ignore lint/a11y/noStaticElementInteractions: stops click-out propagation
						<div
							onMouseDown={stopPropagation}
							onMouseUp={stopPropagation}
							className="flex flex-col gap-3 min-h-full"
						>
							<div className="relative flex flex-col gap-2 w-full border border-neutral-200 bg-neutral-50/60 p-3 rounded-xl mb-1 text-neutral-900 shrink-0">
								<span className="text-[10px] font-bold font-['Hack'] text-neutral-400 uppercase tracking-wider">
									Key Events ({editDiaryTopics.length}/10)
								</span>
								<div className="flex flex-col gap-1.5 w-full">
									{editDiaryTopics.map((topic, index) => (
										<div key={topic} className="flex items-center gap-2 w-full">
											{editingTopicIndex === index ? (
												<input
													type="text"
													value={editingTopicText}
													onChange={(e) => setEditingTopicText(e.target.value)}
													onBlur={() => handleSaveTopicEdit(index)}
													onKeyDown={(e) => {
														if (e.nativeEvent.isComposing) return;
														if (e.key === "Enter") {
															e.preventDefault();
															handleSaveTopicEdit(index);
														}
														if (e.key === "Escape") setEditingTopicIndex(null);
													}}
													className=													"flex-1 text-xs px-2.5 py-1 rounded-full border border-neutral-200 bg-white text-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-['Hack'] tracking-[-0.02em]"
													// biome-ignore lint/a11y/noAutofocus: autoFocus required on editing topic
													autoFocus
												/>
											) : (
												<button
													type="button"
													onClick={() => {
														setEditingTopicIndex(index);
														setEditingTopicText(topic);
													}}
													className="flex-1 text-left text-xs px-3 py-1 rounded-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 transition-colors truncate font-['Hack'] tracking-[-0.02em]"
												>
													{topic}
												</button>
											)}
											<button
												type="button"
												onClick={() => handleRemoveTopic(index)}
												className="p-1 rounded-full hover:bg-neutral-100 text-muted-foreground hover:text-note-alert transition-colors cursor-pointer"
												title="Remove topic"
											>
												<X aria-hidden="true" className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
								{editDiaryTopics.length < 10 && (
									<div className="flex gap-2 items-center mt-1">
										<input
											type="text"
											placeholder="Add a key event..."
											value={newTopic}
											onChange={(e) => setNewTopic(e.target.value)}
											onKeyDown={(e) => {
												if (e.nativeEvent.isComposing) return;
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddTopic();
												}
											}}
											className=											"flex-1 text-xs px-2.5 py-1 rounded-full border border-neutral-200 bg-white text-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-['Hack'] tracking-[-0.02em]"
										/>
										<button
											type="button"
											onClick={handleAddTopic}
											disabled={!newTopic.trim()}
											className="cursor-pointer px-2.5 py-1 rounded-full bg-action text-action-text font-bold text-xs hover:bg-action-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
										>
											Add
										</button>
									</div>
								)}
							</div>

							<TextareaAutosize
								ref={textareaRef}
								value={editDiaryContent}
								onChange={(e) => setEditDiaryContent(e.target.value)}
								placeholder="Write down your thoughts... (Markdown supported)"
								className="w-full flex-1 resize-none border-none rounded-xl p-2 text-sm bg-transparent text-neutral-800 antialiased min-h-[200px] font-['Hack'] leading-[1.6] trahking-[0.02em] focus:outline-none focus:ring-0"
								onKeyDown={onKeyDown}
								onPaste={onPaste}
							/>
						</div>
					) : (
						// 閲覧モード中のコンテンツ（これ自体をクリックするとドラッグ判定後に編集起動）
						// biome-ignore lint/a11y/noStaticElementInteractions: handles drag-safe single clicks on contents
						<div
							onMouseDown={handleMouseDown}
							onMouseUp={handleMouseUp}
							className="flex flex-col gap-3 flex-1"
						>
							{diaryData?.topics && diaryData.topics.length > 0 && (
								<div className="flex flex-col gap-1.5 w-full border-b border-neutral-100 pb-3 mb-1 shrink-0">
									{diaryData.topics.map((topic) => (
										<div
											key={topic}
											className=											"w-full text-xs bg-base-surface border border-base-border rounded-full px-3 py-2 text-left font-['Hack'] tracking-[-0.02em]"
										>
											{topic}
										</div>
									))}
								</div>
							)}

							<div className=							"prose prose-sm max-w-none text-neutral-900 flex-1 font-['Hack'] tracking-[-0.02em]">
								{diaryData?.content ? (
									<MarkdownRenderer content={diaryData.content} />
								) : (
									<div className="text-xs text-neutral-400 italic">
										No logs written for this day.
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
