import { getScopeUrls } from "@sitecue/shared";
import {
	AlertTriangle,
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	Edit2,
	Info,
	Lightbulb,
	Loader2,
	Pin,
	RotateCcw,
	Star,
	Trash2,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import { useAutoIndent } from "../hooks/useAutoIndent";
import type { Note, NoteScope, NoteType } from "../hooks/useNotes";
import MarkdownRenderer from "./MarkdownRenderer";

const COLLAPSE_THRESHOLD = 160;

interface NoteItemProps {
	note: Note;
	currentFullUrl: string;
	onUpdate: (
		id: string,
		content: string,
		type: NoteType,
		scope: NoteScope,
	) => Promise<boolean>;
	onDelete: (id: string) => Promise<boolean>;
	onToggleResolved: (
		id: string,
		status: boolean | undefined,
	) => Promise<boolean>;
	onToggleFavorite: (note: Note) => Promise<boolean>;
	onTogglePinned: (note: Note) => Promise<boolean>;
	onMoveUp?: () => Promise<void>;
	onMoveDown?: () => Promise<void>;
	onToggleExpansion: (id: string, current: boolean) => Promise<boolean>;
	isFavoriteList?: boolean;
	isFirst?: boolean;
	isLast?: boolean;
	isSorting?: boolean;
}

export default function NoteItem({
	note,
	currentFullUrl,
	onUpdate,
	onDelete,
	onToggleResolved,
	onToggleFavorite,
	onTogglePinned,
	onMoveUp,
	onMoveDown,
	onToggleExpansion,
	isFavoriteList = false,
	isFirst = false,
	isLast = false,
	isSorting = false,
}: NoteItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState("");
	const [editType, setEditType] = useState<NoteType>("info");
	const [editScope, setEditScope] = useState<NoteScope>(note.scope);
	const [updating, setUpdating] = useState(false);
	const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const [isSwapping, setIsSwapping] = useState(false);
	const handleAutoIndent = useAutoIndent();

	// 変更検知（無変更保存ガード用防壁）
	const isUnchanged =
		editContent === note.content &&
		editScope === note.scope &&
		editType === (note.note_type || "info");

	const contentRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Needed to recalculate height on content change
	useLayoutEffect(() => {
		if (contentRef.current) {
			setIsOverflowing(contentRef.current.scrollHeight > COLLAPSE_THRESHOLD);
		}
	}, [note.content]);

	const startEditing = () => {
		setIsEditing(true);
		setEditContent(note.content);
		setEditType(note.note_type || "info");
		setEditScope(note.scope);
	};

	const cancelEditing = () => {
		setIsEditing(false);
		setEditContent("");
		setEditType("info");
		setEditScope(note.scope);
	};

	const handleUpdate = async () => {
		if (!editContent.trim()) return;
		setUpdating(true);
		const success = await onUpdate(note.id, editContent, editType, editScope);
		if (success) {
			setIsEditing(false);
		}
		setUpdating(false);
	};

	const handleCopyNote = () => {
		navigator.clipboard.writeText(note.content);
		setCopiedNoteId(note.id);
		toast("Copied to clipboard");
		setTimeout(() => setCopiedNoteId(null), 2000);
	};

	const handleMoveUp = async () => {
		if (!onMoveUp || isSwapping || isFirst) return;
		setIsSwapping(true);
		await onMoveUp();
		setIsSwapping(false);
	};

	const handleMoveDown = async () => {
		if (!onMoveDown || isSwapping || isLast) return;
		setIsSwapping(true);
		await onMoveDown();
		setIsSwapping(false);
	};

	let badgeBgColor = "bg-note-info/5";
	let badgeTextColor = "text-note-info";

	if (note.note_type === "alert") {
		badgeBgColor = "bg-note-alert/5";
		badgeTextColor = "text-note-alert";
	} else if (note.note_type === "idea") {
		badgeBgColor = "bg-note-idea/5";
		badgeTextColor = "text-note-idea";
	}

	const resolvedClasses = note.is_resolved ? "opacity-60 grayscale-[0.5]" : "";
	const isCollapsed = isOverflowing && !note.is_expanded;

	return (
		<div
			className={`bg-base-bg p-2 rounded-xl border border-base-border transition-all group relative flex flex-col ${resolvedClasses}`}
			style={{ contentVisibility: "auto" }}
		>
			{isEditing ? (
				<div className="space-y-3 flex flex-col flex-1 min-w-0 relative animate-fadeIn">
					{/* 🚀 2段構成 Sticky 編集ヘッダーコンテナ */}
					<div className="sticky top-0 z-10 bg-base-bg py-1 mb-1 flex flex-col gap-1 shrink-0">
						{/* 1段目：決定アクション（右端集約・テキストカプセル化・DiaryViewリスペクト） */}
						<div className="flex items-center justify-end w-full">
							{/* 左側：不動ロック配置のコンテキストラベル */}
							{/*<span className="text-xs text-muted-foreground tracking-wide select-none pl-0.5">
								Edit Note
							</span>*/}

							{/* 右側：コンパクトに集約された決定ボタングループ */}
							<div className="flex items-center gap-1.5">
								<button
									type="button"
									onClick={cancelEditing}
									className="cursor-pointer px-2.5 py-1 rounded-full bg-base-bg text-muted-foreground font-bold text-xs hover:bg-base-border/40 transition-colors shrink-0"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleUpdate}
									disabled={updating || isUnchanged}
									className="cursor-pointer px-3 py-1 rounded-full bg-action text-action-text font-bold text-xs hover:bg-action-hover disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0 shadow-2xs flex items-center gap-1"
								>
									{updating && (
										<Loader2 className="w-3 h-3 animate-spin shrink-0" />
									)}
									<span>Save</span>
								</button>
							</div>
						</div>

						{/* 2段目：属性変更（NoteInput.tsx の完全ミラーリング） */}
						<div className="flex items-center justify-between w-full pt-2 border-t border-base-border/30">
							{/* 左側：ScopeセレクトUI（枠線なし・太字ネイティブセレクト + ▼矢印） */}
							<div className="relative flex items-center shrink-0 px-4 py-2 bg-base-surface rounded-full">
								<select
									value={editScope}
									onChange={(e) => setEditScope(e.target.value as NoteScope)}
									className="cursor-pointer appearance-none bg-transparent pr-4 py-0 text-xs font-bold text-neutral-800 focus:outline-none select-none border-none ring-0 focus:ring-0"
								>
									<option value="exact">Page Note</option>
									<option value="domain">Domain Note</option>
									<option value="inbox">Inbox Note</option>
								</select>
								<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px] select-none">
									▼
								</div>
							</div>

							{/* 右側：Typeインラインカプセル（NoteInputと完全対称） */}
							<div className="flex p-1 rounded-full bg-base-surface border border-base-border/50 shrink-0 scale-85 origin-right">
								<button
									type="button"
									onClick={() => setEditType("info")}
									className={`cursor-pointer flex items-center justify-center rounded-full size-6 transition-colors ${
										editType === "info"
											? "bg-note-info text-action-text shadow-2xs"
											: "text-muted-foreground hover:text-note-info"
									}`}
									title="Info"
								>
									<Info className="size-4" />
								</button>
								<button
									type="button"
									onClick={() => setEditType("alert")}
									className={`cursor-pointer flex items-center justify-center rounded-full size-6 transition-colors ml-0.5 ${
										editType === "alert"
											? "bg-note-alert text-action-text shadow-2xs"
											: "text-muted-foreground hover:text-note-alert"
									}`}
									title="Alert"
								>
									<AlertTriangle className="size-4" />
								</button>
								<button
									type="button"
									onClick={() => setEditType("idea")}
									className={`cursor-pointer flex items-center justify-center rounded-full size-6 transition-colors ml-0.5 ${
										editType === "idea"
											? "bg-note-idea text-action-text shadow-2xs"
											: "text-muted-foreground hover:text-note-idea"
									}`}
									title="Idea"
								>
									<Lightbulb className="size-4" />
								</button>
							</div>
						</div>
					</div>

					{/* 🚀 高さ制限完全パージ型・流動伸長エディタエリア（stickyヘッダーのポテンシャルをフル解放） */}
					<div className="flex-1 min-w-0 w-full px-1">
						<TextareaAutosize
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className="w-full border border-base-border rounded-xl p-2.5 text-sm focus:outline-none resize-none bg-base-bg text-neutral-900"
							autoFocus
							onKeyDown={(e) => {
								if (e.nativeEvent.isComposing) return; // IME Guard
								if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
									e.preventDefault();
									if (editContent.trim() && !isUnchanged) {
										handleUpdate();
									}
								} else {
									handleAutoIndent(e);
								}
							}}
						/>
					</div>
				</div>
			) : (
				<div className="flex flex-col flex-1">
					{/* 🚀 2段構成 Sticky ヘッダーコンテナ (完全不透明 bg-base-bg/100 化と下部境界線の常時明瞭化 border-b border-base-border/50) */}
					<div className="sticky top-0 z-10 pt-1 bg-base-bg transition-colors flex flex-col gap-0">
						{/* 1段目：メタデータ、タイプ、Pin/Star（固定アクション） */}
						<div className="flex items-center justify-between w-full p-0">
							{/* 左側：Typeアイコン＋完了/未完了トグル (カプセル) */}
							<button
								type="button"
								onClick={() => onToggleResolved(note.id, note.is_resolved)}
								className={`group/icon relative flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-all ${badgeBgColor} ${badgeTextColor} hover:opacity-80`}
								title={
									note.is_resolved ? "Mark as unresolved" : "Mark as resolved"
								}
							>
								{/* アイコン部分 (通常時とホバー時で透過度を切り替え) */}
								<div className="relative w-3.5 h-3.5 shrink-0">
									<div className="absolute inset-0 transition-opacity group-hover/icon:opacity-0">
										{note.note_type === "alert" && (
											<AlertTriangle
												className="w-3.5 h-3.5"
												aria-hidden="true"
											/>
										)}
										{note.note_type === "idea" && (
											<Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
										)}
										{(note.note_type === "info" || !note.note_type) && (
											<Info className="w-3.5 h-3.5" aria-hidden="true" />
										)}
									</div>
									<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/icon:opacity-100">
										{note.is_resolved ? (
											<RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
										) : (
											<Check className="w-3.5 h-3.5" aria-hidden="true" />
										)}
									</div>
								</div>

								{/* テキスト部分 */}
								<span
									className={`text-[11px] font-bold tracking-wide uppercase ${note.is_resolved ? "line-through opacity-70" : ""}`}
								>
									{note.note_type || "info"}
								</span>
							</button>

							{/* 右側：固定アクション（正円絶対死守ルール適用 size-7） */}
							<div className="flex items-center gap-0.5">
								<button
									type="button"
									onClick={() => onToggleFavorite(note)}
									className={`cursor-pointer size-6 rounded-full flex items-center justify-center transition-all ${note.is_favorite ? "text-action bg-action/5" : "text-muted-foreground hover:bg-base-surface"}`}
									title={
										note.is_favorite
											? "Remove from favorites"
											: "Add to favorites"
									}
								>
									<Star
										className={`w-3.5 h-3.5 ${note.is_favorite ? "fill-current" : ""}`}
									/>
								</button>
								<button
									type="button"
									onClick={() => onTogglePinned(note)}
									className={`cursor-pointer size-6 rounded-full flex items-center justify-center transition-all ${note.is_pinned ? "text-action bg-action/5" : "text-muted-foreground hover:bg-base-surface"}`}
									title={note.is_pinned ? "Unpin note" : "Pin note"}
								>
									<Pin
										className={`w-3.5 h-3.5 ${note.is_pinned ? "fill-current" : ""}`}
									/>
								</button>
							</div>
						</div>

						{/* 🚀 2段目：並び替え、中央展開トグル、操作群の grid シンメトリー統合構造 */}
						<div className="grid grid-cols-[1fr_auto_1fr] items-center w-full pt-0.5 pb-2 mt-0.5 transition-opacity duration-200 border-t border-base-border/20">
							{/* 左側：並び替え操作（justify-startを指定） */}
							<div className="flex items-center gap-0 text-muted-foreground/50 justify-start">
								{!note.is_pinned ? (
									<>
										<button
											type="button"
											onClick={handleMoveUp}
											disabled={isFirst || isSorting}
											className="hover:enabled:cursor-pointer size-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:enabled:text-action hover:enabled:bg-base-surface disabled:opacity-30 transition-colors"
											title="Move up"
										>
											<ChevronUp className="size-4" />
										</button>
										<button
											type="button"
											onClick={handleMoveDown}
											disabled={isLast || isSorting}
											className="hover:enabled:cursor-pointer size-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover:enabled:text-action hover:enabled:bg-base-surface disabled:opacity-30 transition-colors"
											title="Move down"
										>
											<ChevronDown className="size-4" />
										</button>
									</>
								) : (
									<span className="text-[10px] text-muted-foreground/60 font-medium pl-1">
										Pinned
									</span>
								)}
							</div>

							{/* 🚀 中央：動的矢印アイコン付き「Read more / Show less」カプセルボタン */}
							<div className="flex justify-center">
								{isOverflowing && (
									<button
										type="button"
										onClick={() =>
											onToggleExpansion(note.id, note.is_expanded ?? false)
										}
										className="cursor-pointer text-[10px] font-bold text-muted-foreground hover:text-action bg-base-surface hover:bg-base-border px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 transition-colors"
									>
										{note.is_expanded ? (
											<>
												<ChevronUp
													className="w-3.5 h-3.5 shrink-0"
													aria-hidden="true"
												/>
												<span>Show less</span>
											</>
										) : (
											<>
												<ChevronDown
													className="w-3.5 h-3.5 shrink-0"
													aria-hidden="true"
												/>
												<span>Read more</span>
											</>
										)}
									</button>
								)}
							</div>

							{/* 右側：共通アクション（justify-endを指定） */}
							<div className="flex items-center gap-0.5 text-muted-foreground/50 justify-end">
								<button
									type="button"
									onClick={handleCopyNote}
									className="cursor-pointer size-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-action hover:bg-base-surface transition-colors"
									title="Copy note"
								>
									{copiedNoteId === note.id ? (
										<Check className="w-3.5 h-3.5 text-note-info" />
									) : (
										<Copy className="w-3.5 h-3.5" />
									)}
								</button>
								<button
									type="button"
									onClick={startEditing}
									className="cursor-pointer size-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-action hover:bg-base-surface transition-colors"
									title="Edit"
								>
									<Edit2 className="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onClick={() => onDelete(note.id)}
									className="cursor-pointer size-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-note-alert hover:bg-note-alert/10 transition-colors"
									title="Delete"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>

					{/* 本文エリア */}
					<div className="mt-0 flex-1 min-w-0">
						<div
							className={`relative ${isCollapsed ? "max-h-40 overflow-hidden" : ""} w-full`}
						>
							<div
								ref={contentRef}
								className={`text-sm px-4 py-2 ${note.is_resolved ? "line-through text-muted-foreground" : "text-action"}`}
							>
								<MarkdownRenderer content={note.content} />
							</div>
							{isCollapsed && (
								<div className="absolute bottom-0 left-0 w-full h-12 bg-linear-to-t from-base-bg to-transparent pointer-events-none" />
							)}
						</div>
					</div>

					{/* Favoriteリスト時のみのメタデータ（必要なら引き続き表示） */}
					{isFavoriteList && note.scope !== "inbox" && (
						<div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-1">
							<span
								className={`px-2 py-0.5 rounded-full border ${note.scope === "exact" ? "bg-base-bg border-base-border text-gray-500" : "bg-base-surface border-base-border text-muted-foreground"}`}
							>
								{note.scope === "exact" ? "Page" : "Domain"}
							</span>
							{note.url_pattern !==
								(note.scope === "domain"
									? getScopeUrls(currentFullUrl).domain
									: getScopeUrls(currentFullUrl).exact) && (
								<a
									href={`https://${note.url_pattern}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1 hover:text-blue-400 hover:underline transition-colors max-w-48 truncate"
									title={`Open ${note.url_pattern}`}
								>
									<span className="truncate hover:text-action">
										{note.url_pattern}
									</span>
								</a>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
