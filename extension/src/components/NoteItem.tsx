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
import type { Note, NoteScope, NoteType } from "../hooks/useNotes";
import { getScopeUrls } from "../utils/url";
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

	const contentRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (contentRef.current) {
			setIsOverflowing(contentRef.current.scrollHeight > COLLAPSE_THRESHOLD);
		}
	}, []);

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

	let badgeBgColor = "bg-blue-50";
	let badgeTextColor = "text-blue-500";

	if (note.note_type === "alert") {
		badgeBgColor = "bg-rose-50";
		badgeTextColor = "text-rose-500";
	} else if (note.note_type === "idea") {
		badgeBgColor = "bg-amber-50";
		badgeTextColor = "text-amber-500";
	}

	const resolvedClasses = note.is_resolved ? "opacity-60 grayscale-[0.5]" : "";
	const isCollapsed = isOverflowing && !note.is_expanded;

	return (
		<div
			className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group relative flex flex-col ${resolvedClasses}`}
		>
			{isEditing ? (
				<div className="space-y-2">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-4 text-xs">
							<label className="flex items-center gap-1.5 cursor-pointer text-neutral-800 hover:text-black">
								<input
									type="radio"
									name={`scope-${note.id}`}
									checked={editScope === "exact"}
									onChange={() => setEditScope("exact")}
									className="accent-neutral-800 focus:ring-neutral-800"
								/>
								<span>Page</span>
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer text-neutral-800 hover:text-black">
								<input
									type="radio"
									name={`scope-${note.id}`}
									checked={editScope === "domain"}
									onChange={() => setEditScope("domain")}
									className="accent-neutral-800 focus:ring-neutral-800"
								/>
								<span>Domain</span>
							</label>
							<label className="flex items-center gap-1.5 cursor-pointer text-neutral-800 hover:text-black">
								<input
									type="radio"
									name={`scope-${note.id}`}
									checked={editScope === "inbox"}
									onChange={() => setEditScope("inbox")}
									className="accent-neutral-800 focus:ring-neutral-800"
								/>
								<span>Inbox</span>
							</label>
						</div>
						<div className="flex bg-gray-50 p-0.5 rounded-md w-fit">
							<button
								type="button"
								onClick={() => setEditType("info")}
								className={`cursor-pointer p-1 rounded ${editType === "info" ? "bg-blue-400 shadow-sm text-white" : "text-gray-400 hover:text-blue-500"}`}
								title="Info"
							>
								<Info className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => setEditType("alert")}
								className={`cursor-pointer p-1 rounded ${editType === "alert" ? "bg-rose-400 shadow-sm text-white" : "text-gray-400 hover:text-rose-500"}`}
								title="Alert"
							>
								<AlertTriangle className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => setEditType("idea")}
								className={`cursor-pointer p-1 rounded ${editType === "idea" ? "bg-amber-400 shadow-sm text-white" : "text-gray-400 hover:text-amber-500"}`}
								title="Idea"
							>
								<Lightbulb className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
					<TextareaAutosize
						value={editContent}
						onChange={(e) => setEditContent(e.target.value)}
						className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
						minRows={3}
						autoFocus
						onKeyDown={(e) => {
							if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
								e.preventDefault();
								handleUpdate();
							}
						}}
					/>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={cancelEditing}
							className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 rounded"
						>
							<X className="w-4 h-4" />
						</button>
						<button
							type="button"
							onClick={handleUpdate}
							disabled={updating}
							className="cursor-pointer p-1 bg-black text-white rounded hover:bg-neutral-600 disabled:opacity-50"
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
				<div className="flex flex-col flex-1 gap-1">
					{/* 1層目：ヘッダー（メタデータとピン/スター） */}
					<div className="flex items-center justify-between">
						{/* 左側：アイコン統合（Typeアイコン＋完了/未完了トグル） */}
						<div className="flex items-center gap-2">
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
						</div>

						{/* 右側：固定アクション（Info/Star/Pin） */}
						<div className="flex items-center gap-1.5">
							<div
								className="flex items-center mr-0.5 outline-none cursor-default"
								title={`Scope: ${note.scope === "exact" ? "Page" : note.scope === "inbox" ? "Inbox" : "Domain"}\nCreated: ${Intl.DateTimeFormat("sv-SE").format(new Date(note.created_at))}`}
							>
								<Info className="w-3.5 h-3.5 text-neutral-300 hover:text-neutral-500" />
							</div>

							<button
								type="button"
								onClick={() => onToggleFavorite(note)}
								className={`cursor-pointer hover:scale-110 transition-transform ${note.is_favorite ? "text-neutral-800 fill-current" : "text-neutral-300 hover:text-neutral-500"}`}
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
								className={`cursor-pointer hover:scale-110 transition-transform ${note.is_pinned ? "text-neutral-800 fill-current" : "text-neutral-300 hover:text-neutral-500"}`}
								title={note.is_pinned ? "Unpin note" : "Pin note"}
							>
								<Pin
									className={`w-3.5 h-3.5 ${note.is_pinned ? "fill-current" : ""}`}
								/>
							</button>
						</div>
					</div>

					{/* 2層目：本文 */}
					<div className="flex-1 min-w-0">
						<div
							className={`relative ${isCollapsed ? "max-h-40 overflow-hidden" : ""} w-full`}
						>
							<div
								ref={contentRef}
								className={`text-sm mb-0 pt-2 pl-2 ${note.is_resolved ? "line-through text-neutral-400" : "text-neutral-800"}`}
							>
								<MarkdownRenderer content={note.content} />
							</div>
						</div>

						{/* 展開ボタン */}
						{(isCollapsed || (note.is_expanded && isOverflowing)) && (
							<div className="mt-1 flex justify-center">
								<button
									type="button"
									onClick={() =>
										onToggleExpansion(note.id, note.is_expanded ?? false)
									}
									className="cursor-pointer text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors bg-neutral-50 hover:bg-neutral-100 px-2 py-0.5 rounded"
								>
									{isCollapsed ? "Read more" : "Show less"}
								</button>
							</div>
						)}
					</div>

					{/* 3層目：フッター（操作ボタン、ホバー時のみ出現） */}
					<div className="mt-1 pt-1 border-t border-transparent group-hover:border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-200">
						{/* 左側：並び替え（Pinがない時のみ表示） */}
						<div className="flex items-center gap-1">
							{!note.is_pinned ? (
								<>
									<button
										type="button"
										onClick={handleMoveUp}
										disabled={!onMoveUp || isSwapping || isFirst || isSorting}
										className={`transition-colors ${!onMoveUp || isSwapping || isFirst || isSorting ? "text-gray-100 cursor-not-allowed" : "text-gray-400 hover:text-gray-800 cursor-pointer"}`}
										title="Move up"
									>
										<ChevronUp className="w-4 h-4" />
									</button>
									<button
										type="button"
										onClick={handleMoveDown}
										disabled={!onMoveDown || isSwapping || isLast || isSorting}
										className={`transition-colors ${!onMoveDown || isSwapping || isLast || isSorting ? "text-gray-100 cursor-not-allowed" : "text-gray-400 hover:text-gray-800 cursor-pointer"}`}
										title="Move down"
									>
										<ChevronDown className="w-4 h-4" />
									</button>
								</>
							) : (
								<span className="text-[10px] text-neutral-300 ml-1">
									Pinned
								</span>
							)}
						</div>

						{/* 右側：共通アクション */}
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={handleCopyNote}
								className="cursor-pointer text-neutral-300 hover:text-neutral-800 transition-colors"
								title="Copy note"
							>
								{copiedNoteId === note.id ? (
									<Check className="w-3.5 h-3.5 text-green-500" />
								) : (
									<Copy className="w-3.5 h-3.5" />
								)}
							</button>
							<button
								type="button"
								onClick={startEditing}
								className="cursor-pointer text-neutral-300 hover:text-neutral-800 transition-colors"
								title="Edit"
							>
								<Edit2 className="w-3.5 h-3.5" />
							</button>
							<button
								type="button"
								onClick={() => onDelete(note.id)}
								className="cursor-pointer text-neutral-300 hover:text-rose-400 transition-colors"
								title="Delete"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>

					{/* Favoriteリスト時のみのメタデータ（必要なら引き続き表示） */}
					{isFavoriteList && note.scope !== "inbox" && (
						<div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-1">
							<span
								className={`px-1 rounded border ${note.scope === "exact" ? "bg-white border-neutral-200 text-neutral-500" : "bg-neutral-50 border-neutral-200 text-neutral-400"}`}
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
									<span className="truncate">{note.url_pattern}</span>
								</a>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
