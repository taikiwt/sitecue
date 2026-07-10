import { Check, Loader2, Pencil, X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import MarkdownRenderer from "./MarkdownRenderer";

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
	isSaveDisabled: boolean;
	updateDiaryMutationPending: boolean;
	handleSaveDiaryEdit: () => Promise<void>;
	handleStartEdit: () => void;
	handleAutoIndent: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
	isSaveDisabled,
	updateDiaryMutationPending,
	handleSaveDiaryEdit,
	handleStartEdit,
	handleAutoIndent,
}: DiaryViewProps) {
	const [newTopic, setNewTopic] = useState("");
	const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(
		null,
	);
	const [editingTopicText, setEditingTopicText] = useState("");

	const handleAddTopic = () => {
		const val = newTopic.trim();
		if (!val) return;
		if (editDiaryTopics.length >= 10) {
			toast.error("Maximum 10 topics allowed");
			return;
		}
		if (val.length > 50) {
			toast.error("Topic length cannot exceed 50 characters");
			return;
		}
		if (editDiaryTopics.includes(val)) {
			toast.error("Topic already exists");
			return;
		}
		setEditDiaryTopics([...editDiaryTopics, val]);
		setNewTopic("");
	};

	const handleRemoveTopic = (index: number) => {
		setEditDiaryTopics(editDiaryTopics.filter((_, i) => i !== index));
	};

	const handleStartEditTopic = (index: number) => {
		setEditingTopicIndex(index);
		setEditingTopicText(editDiaryTopics[index]);
	};

	const handleSaveTopicEdit = (index: number) => {
		const val = editingTopicText.trim();
		if (!val) {
			handleRemoveTopic(index);
			setEditingTopicIndex(null);
			return;
		}
		if (val.length > 50) {
			toast.error("Topic length cannot exceed 50 characters");
			return;
		}
		const duplicate = editDiaryTopics.some((t, i) => t === val && i !== index);
		if (duplicate) {
			toast.error("Topic already exists");
			return;
		}
		const updated = [...editDiaryTopics];
		updated[index] = val;
		setEditDiaryTopics(updated);
		setEditingTopicIndex(null);
	};

	return (
		<div className="flex flex-col h-full w-full space-y-3 min-h-0">
			{/* カードの外：完全にフラットに並ぶ3日間日付カプセル（親が固定のため、ここもスクロールされずに上部に残る） */}
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
					title="View this month on Basecamp"
				>
					<span>... Basecamp ↗</span>
				</a>
			</div>

			{/* 昇格した「独立した純白の本文カードUI」：ここでコンテナを完全に閉じる */}
			<div className="bg-white text-neutral-900 rounded-xl border border-base-border/60 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
				{/* 🚀 真のカード内ヘッダーエリア：
				   背景色を純白「bg-white」で統一し、最上部へ「sticky top-0 z-10」で完全不動ロック吸着させる */}
				<div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-neutral-100 flex justify-between items-center shrink-0">
					{/* 衝突を根本排除するプレーンな日付文字列のみの左側配置 */}
					<span className="text-xs font-bold text-neutral-500 font-mono tracking-wide">
						{selectedDiaryDate}
					</span>

					{/* 右側：動的ボタン配置トグル */}
					<div className="flex items-center gap-1.5">
						{!isEditingDiary ? (
							<button
								type="button"
								onClick={handleStartEdit}
								className="cursor-pointer px-2.5 py-1 rounded-full bg-action text-action-text font-bold text-[11px] hover:bg-action-hover shadow-2xs transition-colors flex items-center gap-1"
								title="Edit diary"
							>
								<Pencil className="size-3" />
								<span>Edit</span>
							</button>
						) : (
							<>
								<button
									type="button"
									onClick={() => setIsEditingDiary(false)}
									className="cursor-pointer px-2.5 py-1 rounded-full bg-base-bg text-muted-foreground font-semibold text-[11px] hover:bg-base-border/40"
									title="Cancel editing"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSaveDiaryEdit}
									disabled={isSaveDisabled}
									className="cursor-pointer px-2.5 py-1 rounded-full bg-action text-action-text font-bold text-[11px] hover:bg-action-hover disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition-colors flex items-center gap-0.5"
									title="Save diary"
								>
									{updateDiaryMutationPending ? (
										<Loader2 className="w-3 h-3 animate-spin" />
									) : (
										<Check className="w-3 h-3" />
									)}
									<span>Save</span>
								</button>
							</>
						)}
					</div>
				</div>

				{/* 🌟 縦スクロールの軸をこの「インナーコンテンツ領域」だけに隔離・限定配置する */}
				<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 [overflow-wrap:anywhere] break-words">
					{/* 表示モード時のトピック縦並びスタック */}
					{!isEditingDiary &&
						diaryData?.topics &&
						diaryData.topics.length > 0 && (
							<div className="flex flex-col gap-1.5 w-full border-b border-neutral-100 pb-3 mb-1 shrink-0">
								{diaryData.topics.map((topic: string) => (
									<div
										key={topic}
										className="w-full text-xs bg-base-surface border-base-border rounded-4xl px-3 py-2 text-left"
									>
										{topic}
									</div>
								))}
							</div>
						)}

					{/* トピック編集フォーム (編集モード時のみ露出) */}
					{isEditingDiary && (
						// 🚨 sticky top-[37px] z-10 bg-white などの居残り記述を完全撤去。通常の通常フローブロックへ修正！
						<div className="relative flex flex-col gap-2 w-full border border-neutral-200 bg-neutral-50/60 p-3 rounded-xl mb-1 text-neutral-900 shrink-0">
							<span className="text-[9px] font-bold font-mono text-neutral-400 uppercase tracking-wider">
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
													if (e.nativeEvent.isComposing) return; // IME Guard
													if (e.key === "Enter") {
														e.preventDefault();
														handleSaveTopicEdit(index);
													}
													if (e.key === "Escape") setEditingTopicIndex(null);
												}}
												className="flex-1 text-xs px-2.5 py-1 rounded-full border border-neutral-200 bg-white text-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-400"
												// biome-ignore lint/a11y/noAutofocus: input needs autoFocus when editing topic
												autoFocus
											/>
										) : (
											<button
												type="button"
												onClick={() => handleStartEditTopic(index)}
												className="flex-1 text-left text-xs px-3 py-1 rounded-full border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 transition-colors truncate"
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
											if (e.nativeEvent.isComposing) return; // IME Guard
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddTopic();
											}
										}}
										className="flex-1 text-xs px-2.5 py-1 rounded-full border border-neutral-200 bg-white text-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-400"
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
					)}

					{/* エディタ / レンダラー（カード内でflex-1伸長） */}
					{isEditingDiary ? (
						<TextareaAutosize
							value={editDiaryContent}
							onChange={(e) => setEditDiaryContent(e.target.value)}
							placeholder="Write down your thoughts... (Markdown supported)"
							className="w-full flex-1 resize-none border-none p-0 text-sm focus:outline-none bg-transparent text-neutral-900 focus:ring-0 min-h-[200px]"
							onKeyDown={(e) => {
								if (e.nativeEvent.isComposing) return;
								if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
									e.preventDefault();
									if (!isSaveDisabled) handleSaveDiaryEdit();
								} else {
									handleAutoIndent(e);
								}
							}}
						/>
					) : (
						<div className="prose prose-sm max-w-none text-neutral-900 flex-1">
							{isDiaryLoading ? (
								<div className="text-xs text-neutral-400 animate-pulse">
									Loading diary...
								</div>
							) : diaryData?.content ? (
								<MarkdownRenderer content={diaryData.content} />
							) : (
								<div className="text-xs text-neutral-400 italic">
									No logs written for this day.
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
