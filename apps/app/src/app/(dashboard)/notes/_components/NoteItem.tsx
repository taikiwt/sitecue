"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { NoteStatusBadge } from "@/components/ui/note-status-badge";
import { cn } from "@/lib/utils";
import { getSafeUrl } from "@/utils/url";
import type { Draft, Note } from "../types";

const formatDate = (dateStr: string) => {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export function NoteItem({
	item,
	currentExact,
	selectedNoteId,
	selectedDraftId,
	searchParams,
	isSortable = false,
	dragHandleProps = {},
	selectable = false,
	isSelected = false,
	onSelectChange,
	onTodoToggle,
}: {
	item: Note | Draft;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
	searchParams: URLSearchParams;
	isSortable?: boolean;
	dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
	selectable?: boolean;
	isSelected?: boolean;
	onSelectChange?: (id: string, checked: boolean) => void;
	onTodoToggle?: (e: React.MouseEvent, id: string, resolved: boolean) => void;
}) {
	const [isExiting, setIsExiting] = useState(false);
	const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		return () => {
			if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
		};
	}, []);

	const isNote = "note_type" in item;
	const isResolved = isNote && item.is_resolved;
	const isActive = isNote
		? selectedNoteId === item.id
		: selectedDraftId === item.id;

	const params = new URLSearchParams(searchParams.toString());
	if (isNote) {
		params.set("noteId", item.id);
		params.delete("draftId");
	} else {
		params.set("draftId", item.id);
		params.delete("noteId");
	}

	const handleTodoToggleClick = (e: React.MouseEvent) => {
		if (!isNote || isExiting) return;

		// If toggling to resolved, show animation
		if (!item.is_resolved) {
			setIsExiting(true);
			exitTimerRef.current = setTimeout(() => {
				onTodoToggle?.(e, item.id, item.is_resolved);
				// 【修正】要素がアンマウントされないビュー（完了済みリスト等）のために、必ず状態をリセットする
				setIsExiting(false);
			}, 400);
		} else {
			// Toggling back to unresolved happens immediately
			onTodoToggle?.(e, item.id, item.is_resolved);
		}
	};

	return (
		<div
			data-testid="note-item"
			className={cn(
				"group/card relative flex items-stretch transition-all duration-400 ease-in-out",
				isActive ? "bg-base-surface" : "hover:bg-base-surface/50",
				(isResolved || isExiting) && "opacity-50",
				isExiting && "line-through pointer-events-none",
			)}
		>
			{/* 透明なリンクを絶対配置(absolute)にしてカード全体を覆う */}
			<Link
				href={`/notes?${params.toString()}`}
				className="absolute inset-0 z-0"
				aria-label="View details"
			/>

			{/* ドラッグやチェックボックスはリンクより上の層(z-10)に浮かせる */}
			<div className="flex items-center pl-2 shrink-0 relative z-10 pointer-events-auto">
				{isSortable && isNote && (
					<button
						type="button"
						{...dragHandleProps}
						style={{ touchAction: "none" }}
						className="flex items-center justify-center p-1 text-base-border hover:text-action opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
						aria-label="Drag to reorder"
					>
						<GripVertical className="w-4 h-4" aria-hidden="true" />
					</button>
				)}
				{!isSortable && isNote && <div className="w-6" />}

				{selectable && (
					<div className="flex items-center justify-center px-1">
						<input
							type="checkbox"
							checked={isSelected}
							onChange={(e) => onSelectChange?.(item.id, e.target.checked)}
							onPointerDown={(e) => e.stopPropagation()}
							className="w-4 h-4 cursor-pointer accent-action"
						/>
					</div>
				)}
			</div>

			{/* テキスト領域はクリックを透過させ、TODOボタンだけクリックを受け付ける */}
			<div className="flex-1 block py-4 pr-4 pl-2 pointer-events-none relative z-10">
				<div className="flex justify-between items-start mb-1">
					{isNote ? (
						<NoteStatusBadge
							type={item.note_type ?? "info"}
							isResolved={item.is_resolved || isExiting}
							onClick={(e) => {
								e.preventDefault();
								handleTodoToggleClick(e);
							}}
						/>
					) : (
						<span className="relative z-10 bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
							{!item.title && !item.content ? "NEW" : "DRAFT"}
						</span>
					)}
					<span className="text-[10px] text-gray-400">
						{formatDate(isNote ? item.created_at : item.updated_at)}
					</span>
				</div>
				<h3
					className={cn(
						"text-sm font-bold text-action truncate mb-0.5",
						(isResolved || isExiting) && "line-through",
					)}
				>
					{!isNote && (item.title || "Untitled Draft")}
				</h3>
				<p
					className={cn(
						"text-sm text-action line-clamp-2 wrap-break-word",
						(isResolved || isExiting) && "line-through",
					)}
				>
					{item.content}
				</p>
				{isNote && item.scope === "exact" && !currentExact && (
					<div className="mt-2 text-[10px] text-gray-400 truncate flex items-center gap-1 relative z-10 pointer-events-none">
						<MapPin className="w-3 h-3" aria-hidden="true" />
						{getSafeUrl(item.url_pattern)?.pathname ?? item.url_pattern}
					</div>
				)}
			</div>
		</div>
	);
}

export function SortableNoteItem({
	item,
	currentView,
	isSearchActive,
	currentExact,
	selectedNoteId,
	selectedDraftId,
	searchParams,
	selectable,
	isSelected,
	onSelectChange,
	onTodoToggle,
}: {
	item: Note | Draft;
	currentView: string | null;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
	searchParams: URLSearchParams;
	isSearchActive: boolean;
	selectable?: boolean;
	isSelected?: boolean;
	onSelectChange?: (id: string, checked: boolean) => void;
	onTodoToggle?: (e: React.MouseEvent, id: string, resolved: boolean) => void;
}) {
	const {
		setNodeRef,
		transform,
		transition,
		isDragging,
		attributes,
		listeners,
	} = useSortable({
		id: item.id,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		zIndex: isDragging ? 50 : undefined,
		position: "relative" as const,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<NoteItem
				item={item}
				currentExact={currentExact}
				selectedNoteId={selectedNoteId}
				selectedDraftId={selectedDraftId}
				searchParams={searchParams}
				isSortable={currentView !== "drafts" && !isSearchActive}
				dragHandleProps={{ ...attributes, ...listeners }}
				selectable={selectable}
				isSelected={isSelected}
				onSelectChange={onSelectChange}
				onTodoToggle={onTodoToggle}
			/>
		</div>
	);
}
