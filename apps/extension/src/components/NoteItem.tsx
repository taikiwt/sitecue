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
	X,
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
			className={`bg-base-bg p-4 rounded-xl border border-base-border shadow-sm transition-all group relative flex flex-col ${resolvedClasses}`}
			style={{ contentVisibility: "auto" }}
		>
			{isEditing ? (
				<div className="space-y-2">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-4 text-xs">
							<label className="flex items-center gap-1.5 cursor-pointer text-action hover-safe:text-action-hover">
								<input
									type="radio"
									name={`scope-${note.id}`}
									checked={editScope === "exact"}
									onChange={() => setEditScope("exact")}
									className="accent-action focus:ring-action"
								/>
								<span>Page</span>
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer text-neutral-800 hover-safe:text-black">
								<input
									type="radio"
									name={`scope-${note.id}`}
									checked={editScope === "domain"}
									onChange={() => setEditScope("domain")}
									className="accent-action focus:ring-action"
								/>
								<span>Domain</span>
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer text-neutral-800 hover-safe:text-black">
								<input
									type="radio"
									name={`scope-${note.id}`}
									checked={editScope === "inbox"}
									onChange={() => setEditScope("inbox")}
									className="accent-action focus:ring-action"
								/>
								<span>Inbox</span>
							</label>
						</div>
						<div className="flex bg-base-surface p-1 rounded-full border border-base-border/50 w-fit">
							<button
								type="button"
								onClick={() => setEditType("info")}
								className={`cursor-pointer flex items-center justify-center rounded-full size-7 transition-colors ${editType === "info" ? "bg-note-info text-action-text shadow-sm" : "text-muted-foreground hover-safe:text-note-info"}`}
								title="Info"
							>
								<Info className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => setEditType("alert")}
								className={`cursor-pointer flex items-center justify-center rounded-full size-7 transition-colors ${editType === "alert" ? "bg-note-alert text-action-text shadow-sm" : "text-muted-foreground hover-safe:text-note-alert"}`}
								title="Alert"
							>
								<AlertTriangle className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => setEditType("idea")}
								className={`cursor-pointer flex items-center justify-center rounded-full size-7 transition-colors ${editType === "idea" ? "bg-note-idea text-action-text shadow-sm" : "text-muted-foreground hover-safe:text-note-idea"}`}
								title="Idea"
							>
								<Lightbulb className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
					<TextareaAutosize
						value={editContent}
						onChange={(e) => setEditContent(e.target.value)}
						className="w-full border border-base-border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-action/5 resize-none bg-base-bg"
						minRows={3}
						autoFocus
						onKeyDown={(e) => {
							if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
								e.preventDefault();
								handleUpdate();
							} else {
								handleAutoIndent(e);
							}
						}}
					/>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={cancelEditing}
							className="cursor-pointer flex items-center justify-center rounded-full size-7 text-muted-foreground hover-safe:bg-base-surface transition-colors"
							title="Cancel"
						>
							<X className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={handleUpdate}
							disabled={updating}
							className="cursor-pointer flex items-center justify-center rounded-full size-7 bg-action text-action-text hover-safe:bg-action-hover disabled:opacity-50 transition-colors"
							title="Save"
						>
							{updating ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Check className="w-4 h-4" />
							)}
						</button>
					</div>
				</div>
			) : (
				<div className="flex flex-col flex-1">
					{/* 🚀 2段構成 Sticky ヘッダーコンテナ (背景透過度を98%に高め、境界線を常時固定) */}
					<div className="sticky top-0 z-10 bg-base-bg/98 backdrop-blur-xs pt-1 pb-2 border-b border-base-border/40 transition-colors flex flex-col gap-1.5">
						{/* 1段目：メタデータ、タイプ、Pin/Star（固定アクション） */}
						<div className="flex items-center justify-between w-full">
							{/* 左側：Typeアイコン＋完了/未完了トグル (カプセル) */}
							<button
								type="button"
								onClick={() => onToggleResolved(note.id, note.is_resolved)}
								className={`group/icon relative flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-all ${badgeBgColor} ${badgeTextColor} hover-safe:opacity-80`}
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
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() => onToggleFavorite(note)}
									className={`cursor-pointer size-7 rounded-full flex items-center justify-center transition-all ${note.is_favorite ? "text-action bg-action/5" : "text-muted-foreground hover-safe:bg-base-surface"}`}
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
									className={`cursor-pointer size-7 rounded-full flex items-center justify-center transition-all ${note.is_pinned ? "text-action bg-action/5" : "text-muted-foreground hover-safe:bg-base-surface"}`}
									title={note.is_pinned ? "Unpin note" : "Pin note"}
								>
									<Pin
										className={`w-3.5 h-3.5 ${note.is_pinned ? "fill-current" : ""}`}
									/>
								</button>
							</div>
						</div>

						{/* 2段目：操作アクション群（バリアント競合を排除し、淡色での常時露出へシフト） */}
						<div className="flex items-center justify-between w-full pt-1.5 transition-opacity duration-200 border-t border-base-border/20">
							{/* 左側：並び替え操作（正円サイズロック size-6） */}
							<div className="flex items-center gap-0.5 text-muted-foreground/50">
								{!note.is_pinned ? (
									<>
										<button
											type="button"
											onClick={handleMoveUp}
											disabled={isFirst || isSorting}
											className="cursor-pointer size-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover-safe:text-action hover-safe:bg-base-surface disabled:opacity-30 transition-colors"
											title="Move up"
										>
											<ChevronUp className="w-3.5 h-3.5" />
										</button>
										<button
											type="button"
											onClick={handleMoveDown}
											disabled={isLast || isSorting}
											className="cursor-pointer size-6 rounded-full flex items-center justify-center text-muted-foreground/50 hover-safe:text-action hover-safe:bg-base-surface disabled:opacity-30 transition-colors"
											title="Move down"
										>
											<ChevronDown className="w-3.5 h-3.5" />
										</button>
									</>
								) : (
									<span className="text-[10px] text-muted-foreground/60 font-medium pl-1">
										Pinned
									</span>
								)}
							</div>

							{/* 右側：共通アクション（Copy, Edit, Delete - 正円 size-7、通常時は淡色でノイズカット） */}
							<div className="flex items-center gap-1 text-muted-foreground/50">
								<button
									type="button"
									onClick={handleCopyNote}
									className="cursor-pointer size-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover-safe:text-action hover-safe:bg-base-surface transition-colors"
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
									className="cursor-pointer size-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover-safe:text-action hover-safe:bg-base-surface transition-colors"
									title="Edit"
								>
									<Edit2 className="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onClick={() => onDelete(note.id)}
									className="cursor-pointer size-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover-safe:text-note-alert hover-safe:bg-note-alert/10 transition-colors"
									title="Delete"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>

					{/* 本文エリア (ヘッダー境界線の常時固定化に伴い、mt-3 に微調整して美しい空気感を確保) */}
					<div className="mt-3 flex-1 min-w-0">
						<div
							className={`relative ${isCollapsed ? "max-h-40 overflow-hidden" : ""} w-full`}
						>
							<div
								ref={contentRef}
								className={`text-sm pt-1 pl-1 ${note.is_resolved ? "line-through text-muted-foreground" : "text-action"}`}
							>
								<MarkdownRenderer content={note.content} />
							</div>
							{isCollapsed && (
								<div className="absolute bottom-0 left-0 w-full h-12 bg-linear-to-t from-base-bg to-transparent pointer-events-none" />
							)}
						</div>

						{/* 展開ボタン */}
						{(isCollapsed || (note.is_expanded && isOverflowing)) && (
							<div className="mt-1 flex justify-center relative z-10">
								<button
									type="button"
									onClick={() =>
										onToggleExpansion(note.id, note.is_expanded ?? false)
									}
									className="cursor-pointer text-[10px] text-muted-foreground hover-safe:text-action transition-colors bg-base-surface hover-safe:bg-base-border px-2 py-0.5 rounded-full"
								>
									{isCollapsed ? "Read more" : "Show less"}
								</button>
							</div>
						)}
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
									className="flex items-center gap-1 hover-safe:text-blue-400 hover-safe:underline transition-colors max-w-48 truncate"
									title={`Open ${note.url_pattern}`}
								>
									<span className="truncate hover-safe:text-action">
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
