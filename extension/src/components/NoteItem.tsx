import {
	AlertTriangle,
	Check,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	Copy,
	Edit2,
	ExternalLink,
	Info,
	Lightbulb,
	Loader2,
	Pin,
	Square,
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

	let iconBgColor = "bg-blue-400";
	const iconTextColor = "text-white";

	if (note.note_type === "alert") {
		iconBgColor = "bg-rose-400";
	} else if (note.note_type === "idea") {
		iconBgColor = "bg-amber-400";
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
				<div className="flex items-stretch gap-3 flex-1">
					{/* 左側：アイコン＆アクション列 */}
					<div className="flex flex-col items-center min-w-6">
						<div className="flex flex-col items-center gap-2">
							<div className={`shrink-0 ${iconBgColor} p-0.5 rounded`}>
								{note.note_type === "alert" && (
									<AlertTriangle className={`w-4 h-4 ${iconTextColor}`} />
								)}
								{note.note_type === "idea" && (
									<Lightbulb className={`w-4 h-4 ${iconTextColor}`} />
								)}
								{(note.note_type === "info" || !note.note_type) && (
									<Info className={`w-4 h-4 ${iconTextColor}`} />
								)}
							</div>
							<button
								type="button"
								onClick={() => onToggleResolved(note.id, note.is_resolved)}
								className={`cursor-pointer shrink-0 transition-colors ${note.is_resolved ? "text-neutral-500" : "text-neutral-300 hover:text-neutral-400"}`}
								title={
									note.is_resolved ? "Mark as unresolved" : "Mark as resolved"
								}
							>
								{note.is_resolved ? (
									<CheckSquare className="w-5 h-5" />
								) : (
									<Square className="w-5 h-5" />
								)}
							</button>
						</div>

						{/* 左下固定の並び替えボタン（Pinがない時のみ表示） */}
						{!note.is_pinned && (
							<div className="flex flex-col items-center gap-0 mt-auto pt-2">
								<button
									type="button"
									onClick={handleMoveUp}
									disabled={!onMoveUp || isSwapping || isFirst || isSorting}
									className={`transition-colors ${!onMoveUp || isSwapping || isFirst || isSorting ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-gray-800 cursor-pointer"}`}
									title="Move up"
								>
									<ChevronUp className="w-4 h-4" />
								</button>
								<button
									type="button"
									onClick={handleMoveDown}
									disabled={!onMoveDown || isSwapping || isLast || isSorting}
									className={`transition-colors ${!onMoveDown || isSwapping || isLast || isSorting ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-gray-800 cursor-pointer"}`}
									title="Move down"
								>
									<ChevronDown className="w-4 h-4" />
								</button>
							</div>
						)}
					</div>

					{/* 右側：メインコンテンツ列 */}
					<div className="flex-1 min-w-0 flex flex-col relative">
						{/* 右上絶対配置ボタン（背景白で被りを防止） */}
						<div className="absolute -top-1 right-0 flex items-center gap-1.5 bg-white/90 pl-2 pb-1 rounded-bl-md z-10">
							<div
								className="flex items-center mr-1 outline-none"
								title={`Scope: ${note.scope === "exact" ? "Page" : note.scope === "inbox" ? "Inbox" : "Domain"}, Date: ${new Date(note.created_at).toLocaleDateString()}`}
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

						{/* テキストコンテンツ（右側に十分なパディングを確保） */}
						<div
							className={`relative ${isCollapsed ? "max-h-40 overflow-hidden" : ""} pr-14`}
						>
							<div
								ref={contentRef}
								className={`text-sm mb-2 ${note.is_resolved ? "line-through text-neutral-500" : "text-neutral-800"}`}
							>
								<MarkdownRenderer content={note.content} />
							</div>
						</div>

						{/* フッター：Read more / Show less ボタン */}
						{(isCollapsed || (note.is_expanded && isOverflowing)) && (
							<div className="mt-auto pt-2 flex justify-center">
								<button
									type="button"
									onClick={() =>
										onToggleExpansion(note.id, note.is_expanded ?? false)
									}
									className="cursor-pointer text-[11px] text-neutral-500 hover:text-neutral-800 transition-colors font-medium bg-neutral-50 px-3 py-1.5 rounded-full hover:bg-neutral-100"
								>
									{isCollapsed ? "Read more" : "Show less"}
								</button>
							</div>
						)}

						{/* フッター：Favoriteリスト時のみScope等のメタデータを表示 */}
						{isFavoriteList && note.scope !== "inbox" && (
							<div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-3 pt-2 border-t border-gray-50">
								<span
									className={`px-1.5 py-0.5 rounded border ${note.scope === "exact" ? "bg-white border-neutral-200 text-neutral-600" : "bg-neutral-50 border-neutral-200 text-neutral-500"}`}
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
										className="flex items-center gap-1 hover:text-blue-400 hover:underline transition-colors max-w-48 ml-1"
										title={`Open ${note.url_pattern}`}
									>
										<ExternalLink className="w-3 h-3 shrink-0" />
										<span className="truncate">{note.url_pattern}</span>
									</a>
								)}
							</div>
						)}
					</div>

					{/* ホバーメニュー（コピー、編集、削除） */}
					<div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 pl-2 rounded-l-md z-10">
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
			)}
		</div>
	);
}
