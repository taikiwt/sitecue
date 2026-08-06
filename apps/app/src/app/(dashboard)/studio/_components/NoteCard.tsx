"use client";

import type { Note, ViewScope as NoteScope, NoteType } from "@sitecue/shared";
import { SHARED_LIMITS } from "@sitecue/shared";
import {
	ArrowLeft,
	Check,
	ChevronDown,
	Copy,
	GripVertical,
	Pencil,
	Trash2,
	X,
} from "lucide-react";
import React, { memo, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { FilterBadge } from "@/components/ui/filter-badge";
import { NoteStatusBadge } from "@/components/ui/note-status-badge";
import { useMarkdownAssist } from "@/hooks/useMarkdownAssist";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

const COLLAPSE_THRESHOLD = 160;

const MemoizedMarkdown = React.memo(
	function MemoizedMarkdown({ content }: { content: string }) {
		return (
			<MarkdownRenderer
				className="prose-headings:text-sm prose-headings:font-bold break-words [overflow-wrap:anywhere] [&_p]:[overflow-wrap:anywhere] [&_a]:break-all [&_a]:[overflow-wrap:anywhere] [&_code]:[overflow-wrap:anywhere]"
				content={content}
			/>
		);
	},
	(prevProps, nextProps) => prevProps.content === nextProps.content,
);

export interface NoteCardProps {
	note: Note;
	onUpdate?: (id: string, content: string) => void;
	onUpdateType?: (id: string, noteType: NoteType) => void;
	onUpdateScope?: (id: string, scope: NoteScope) => void;
	onToggleResolved?: (id: string) => void;
	onDelete?: (id: string) => void;
	onInsert?: (content: string) => void;
	dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
	showTimeOnly?: boolean;
	isDraft?: boolean;
	hideScopeSelect?: boolean;
	rightAction?: React.ReactNode;
}

function NoteCardBase({
	note,
	onUpdate,
	onUpdateType,
	onUpdateScope,
	onToggleResolved,
	onDelete,
	onInsert,
	dragHandleProps,
	showTimeOnly = false,
	isDraft = false,
	hideScopeSelect = false,
	rightAction,
}: NoteCardProps) {
	const planState = useUserStore((state) => state.plan);
	const userPlan = typeof planState === "string" ? planState : "free";
	const maxNoteLength =
		SHARED_LIMITS.NOTE_LENGTH[userPlan.toUpperCase() as "FREE" | "PRO"] ||
		SHARED_LIMITS.NOTE_LENGTH.FREE;

	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(note.content);
	const [editType, setEditType] = useState<NoteType>(
		(note.note_type as NoteType) || "info",
	);
	const [editScope, setEditScope] = useState<NoteScope>(note.scope || "draft");
	const [isCopied, setIsCopied] = useState(false);

	const [isExpanded, setIsExpanded] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(() => {
		return (note.content ?? "").length > 120;
	});

	const isCollapsed = isOverflowing && !isExpanded;
	const contentRef = useRef<HTMLDivElement>(null);
	const cardRef = useRef<HTMLDivElement>(null);
	const prevExpandedRef = useRef(isExpanded);
	const { onKeyDown, onPaste } = useMarkdownAssist();

	const charCount = editContent.length;
	const isOverLimit = charCount > maxNoteLength;

	useEffect(() => {
		if (prevExpandedRef.current && !isExpanded) {
			if (
				cardRef.current &&
				typeof cardRef.current.scrollIntoView === "function"
			) {
				cardRef.current.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			}
		}
		prevExpandedRef.current = isExpanded;
	}, [isExpanded]);

	useEffect(() => {
		const el = contentRef.current;
		if (!el || isEditing) return;
		if (note.content && el.scrollHeight > 0) {
			setIsOverflowing(el.scrollHeight > COLLAPSE_THRESHOLD);
		}
	}, [note.content, isEditing]);

	const handleSave = () => {
		if (isOverLimit || !editContent.trim()) return;
		if (onUpdate) onUpdate(note.id, editContent);
		if (onUpdateType && editType !== note.note_type) {
			onUpdateType(note.id, editType);
		}
		if (onUpdateScope && editScope !== note.scope) {
			onUpdateScope(note.id, editScope);
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditContent(note.content);
		setEditType((note.note_type as NoteType) || "info");
		setEditScope(note.scope || "draft");
		setIsEditing(false);
	};

	const handleBadgeClick = () => {
		if (onToggleResolved) {
			onToggleResolved(note.id);
		} else if (onUpdateType) {
			const types: NoteType[] = ["info", "alert", "idea"];
			const currentIndex = types.indexOf(
				(note.note_type as NoteType) || "info",
			);
			const nextType = types[(currentIndex + 1) % types.length];
			onUpdateType(note.id, nextType);
		}
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(note.content);
		setIsCopied(true);
		toast("Copied to clipboard");
		setTimeout(() => setIsCopied(false), 2000);
	};

	const timeStr = note.created_at
		? new Date(note.created_at).toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			})
		: "";

	return (
		/* 🚨最外殻: Sticky動作を保護するため、overflow-hidden を絶対指定しないこと */
		<div
			ref={cardRef}
			className={cn(
				"group cursor-default rounded-xl border border-base-border bg-base-bg relative flex flex-col transition-all hover:border-neutral-400 min-w-0 w-full overflow-visible",
				note.is_resolved && "opacity-60 bg-neutral-50/50",
			)}
		>
			{isEditing ? (
				<div className="space-y-3 flex flex-col flex-1 min-w-0 relative animate-fadeIn p-3.5">
					<div className="sticky top-0 z-10 bg-base-bg rounded-t-xl flex flex-col gap-0 shrink-0 select-none border-b border-base-border/20 pb-2">
						<div className="flex items-center justify-between w-full min-h-[36px]">
							<span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
								Editing note...
							</span>
							<div className="flex items-center gap-1.5">
								<Button
									type="button"
									onClick={handleCancel}
									radius="full"
									size="xs"
									variant="ghost"
								>
									<X aria-hidden="true" className="w-3.5 h-3.5" />
									Cancel
								</Button>
								<Button
									type="button"
									onClick={handleSave}
									disabled={isOverLimit || !editContent.trim()}
									radius="full"
									size="xs"
									variant="default"
								>
									<Check aria-hidden="true" className="w-3.5 h-3.5" />
									Save
								</Button>
							</div>
						</div>

						<div className="flex items-center justify-between w-full pt-2 border-t border-base-border/30">
							{!hideScopeSelect ? (
								<div className="relative flex items-center shrink-0 px-3 py-1 bg-base-surface rounded-full border border-base-border/50">
									<select
										value={editScope}
										onChange={(e) => setEditScope(e.target.value as NoteScope)}
										className="cursor-pointer appearance-none bg-transparent pr-4 py-0 text-xs font-bold text-neutral-800 focus:outline-none select-none border-none ring-0 focus:ring-0"
									>
										<option value="draft">Draft Note</option>
										<option value="exact">Page Note</option>
										<option value="domain">Domain Note</option>
										<option value="inbox">Inbox Note</option>
									</select>
									<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[9px] select-none">
										▼
									</div>
								</div>
							) : (
								<div />
							)}

							<div className="flex p-0.5 rounded-full bg-base-surface border border-base-border/50 shrink-0">
								<FilterBadge
									isActive={editType === "info"}
									onClick={() => setEditType("info")}
									className="px-2 py-0.5 text-[10px] uppercase"
								>
									Info
								</FilterBadge>
								<FilterBadge
									isActive={editType === "alert"}
									onClick={() => setEditType("alert")}
									className="px-2 py-0.5 text-[10px] uppercase"
								>
									Alert
								</FilterBadge>
								<FilterBadge
									isActive={editType === "idea"}
									onClick={() => setEditType("idea")}
									className="px-2 py-0.5 text-[10px] uppercase"
								>
									Idea
								</FilterBadge>
							</div>
						</div>
					</div>

					<div className="flex-1 min-w-0 w-full pt-1">
						<TextareaAutosize
							autoFocus
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							onKeyDown={(e) => {
								if (e.nativeEvent.isComposing) return;
								if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
									e.preventDefault();
									if (editContent.trim() && !isOverLimit) {
										handleSave();
									}
								} else {
									onKeyDown(e);
								}
							}}
							onPaste={onPaste}
							className="w-full border border-base-border rounded-xl p-2.5 text-sm bg-base-bg text-neutral-800 antialiased font-mono leading-relaxed focus:outline-none focus:ring-0 resize-none"
							placeholder="Edit note content..."
						/>
					</div>

					<div className="flex items-center justify-end text-[10px] font-mono font-bold">
						<span
							className={cn(
								isOverLimit ? "text-note-alert" : "text-neutral-400",
							)}
						>
							{charCount.toLocaleString()} / {maxNoteLength.toLocaleString()}
						</span>
					</div>
				</div>
			) : (
				<div className="flex flex-col flex-1 min-w-0">
					{/* Sticky Header: 親スクロールコンテナに対して確実に吸着動作 */}
					<div className="sticky top-0 z-10 bg-base-bg rounded-t-xl flex flex-col gap-0 select-none border-b border-base-border/20 px-3.5 pt-3 pb-2">
						<div className="flex items-center justify-between w-full min-h-[32px] gap-2">
							<div className="flex items-center gap-1.5 min-w-0">
								{dragHandleProps && (
									<div
										{...dragHandleProps}
										className="cursor-grab active:cursor-grabbing p-0.5 text-neutral-300 hover:text-neutral-600 rounded touch-none shrink-0"
										title="Drag to reorder"
									>
										<GripVertical aria-hidden="true" className="w-4 h-4" />
									</div>
								)}
								{isDraft ? (
									<span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide bg-neutral-100 text-neutral-600 shrink-0">
										Draft
									</span>
								) : (
									<NoteStatusBadge
										type={note.note_type || "info"}
										isResolved={note.is_resolved}
										onClick={
											onToggleResolved || onUpdateType
												? handleBadgeClick
												: undefined
										}
									/>
								)}
								<span className="text-[10px] font-mono text-neutral-400 font-bold truncate">
									{showTimeOnly
										? timeStr
										: note.created_at
											? note.created_at.split("T")[0]
											: ""}
								</span>
							</div>

							<div className="flex items-center gap-1 shrink-0 opacity-100 pointer-fine:opacity-0 group-hover-safe:opacity-100 transition-opacity">
								{rightAction}
								{onInsert && (
									<Button
										type="button"
										onClick={() => onInsert(note.content)}
										radius="full"
										size="icon-sm"
										variant="ghost"
										title="Insert to Editor"
									>
										<ArrowLeft aria-hidden="true" className="w-3.5 h-3.5" />
									</Button>
								)}
								{onUpdate && (
									<Button
										type="button"
										onClick={() => {
											setEditContent(note.content);
											setEditType((note.note_type as NoteType) || "info");
											setEditScope(note.scope || "draft");
											setIsEditing(true);
										}}
										radius="full"
										size="icon-sm"
										variant="ghost"
										title="Edit Note"
									>
										<Pencil aria-hidden="true" className="w-3.5 h-3.5" />
									</Button>
								)}
								<Button
									type="button"
									onClick={handleCopy}
									radius="full"
									size="icon-sm"
									variant="ghost"
									title="Copy note"
								>
									{isCopied ? (
										<Check
											aria-hidden="true"
											className="w-3.5 h-3.5 text-emerald-500"
										/>
									) : (
										<Copy aria-hidden="true" className="w-3.5 h-3.5" />
									)}
								</Button>
								{onDelete && (
									<Button
										type="button"
										onClick={() => onDelete(note.id)}
										radius="full"
										size="icon-sm"
										variant="ghost"
										title="Delete Note"
										className="hover-safe:text-red-500 hover-safe:bg-red-50"
									>
										<Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
									</Button>
								)}
							</div>
						</div>

						{/* Sticky Show less button floating below header */}
						{isOverflowing && isExpanded && (
							<div className="absolute top-11 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setIsExpanded(false);
									}}
									className="cursor-pointer text-[10px] font-bold text-neutral-500 hover:text-action hover:bg-base-surface px-2.5 py-1 rounded-full flex items-center gap-1 transition-all border border-base-border/50 bg-base-bg/90 shadow-sm"
								>
									<ChevronDown
										aria-hidden="true"
										className="w-3.5 h-3.5 shrink-0 rotate-180"
									/>
									<span>Show less</span>
								</button>
							</div>
						)}
					</div>

					{/* Content Area: 本文直近で横膨張を防止（min-w-0 w-full break-words） */}
					<div className="px-3.5 py-2.5 flex-1 min-w-0 w-full overflow-hidden">
						<div
							className={cn(
								"relative w-full min-w-0",
								isCollapsed && "max-h-40 overflow-hidden pb-8",
							)}
						>
							<div
								ref={contentRef}
								className={cn(
									"text-sm leading-relaxed min-w-0 w-full break-words [overflow-wrap:anywhere]",
									note.is_resolved
										? "line-through text-neutral-400"
										: "text-neutral-700 group-hover:text-neutral-900",
								)}
							>
								<MemoizedMarkdown content={note.content} />
							</div>

							{isCollapsed && (
								<>
									<div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-base-bg via-base-bg/80 to-transparent pointer-events-none" />
									<div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setIsExpanded(true);
											}}
											className="cursor-pointer text-[10px] font-bold text-neutral-500 hover:text-action bg-base-bg hover:bg-base-surface px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 transition-colors border border-base-border"
										>
											<ChevronDown
												aria-hidden="true"
												className="w-3.5 h-3.5 shrink-0"
											/>
											<span>Read more</span>
										</button>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{note.url_pattern && !note.url_pattern.startsWith("sitecue://") && (
				<p className="px-3.5 pb-2 text-[10px] text-neutral-400 truncate">
					{note.url_pattern}
				</p>
			)}
		</div>
	);
}

function arePropsEqual(prevProps: NoteCardProps, nextProps: NoteCardProps) {
	const prevNote = prevProps.note;
	const nextNote = nextProps.note;

	const isNoteEqual =
		prevNote === nextNote ||
		(prevNote.id === nextNote.id &&
			prevNote.content === nextNote.content &&
			prevNote.is_expanded === nextNote.is_expanded &&
			prevNote.is_favorite === nextNote.is_favorite &&
			prevNote.is_pinned === nextNote.is_pinned &&
			prevNote.is_resolved === nextNote.is_resolved &&
			prevNote.note_type === nextNote.note_type &&
			prevNote.scope === nextNote.scope);

	return (
		isNoteEqual &&
		prevProps.showTimeOnly === nextProps.showTimeOnly &&
		prevProps.isDraft === nextProps.isDraft &&
		prevProps.hideScopeSelect === nextProps.hideScopeSelect &&
		prevProps.onUpdate === nextProps.onUpdate &&
		prevProps.onUpdateType === nextProps.onUpdateType &&
		prevProps.onUpdateScope === nextProps.onUpdateScope &&
		prevProps.onToggleResolved === nextProps.onToggleResolved &&
		prevProps.onDelete === nextProps.onDelete &&
		prevProps.onInsert === nextProps.onInsert &&
		prevProps.dragHandleProps === nextProps.dragHandleProps
	);
}

export const NoteCard = memo(NoteCardBase, arePropsEqual);
export default NoteCard;
