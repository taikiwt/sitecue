"use client";

import type { Note } from "@sitecue/shared";
import {
	AlertTriangle,
	ArrowLeft,
	Check,
	ChevronDown,
	ChevronUp,
	Info,
	Lightbulb,
	Pencil,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

interface NoteCardProps {
	note: Note;
	onUpdate?: (id: string, content: string) => void;
	onDelete?: (id: string) => void;
	onInsert?: (content: string) => void;
	showTimeOnly?: boolean;
}

export default function NoteCard({
	note,
	onUpdate,
	onDelete,
	onInsert,
	showTimeOnly = false,
}: NoteCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(note.content);

	const [isExpanded, setIsExpanded] = useState(false);
	const [hasOverflow, setHasOverflow] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = contentRef.current;
		if (!element || isEditing) return;

		const _content = note.content;

		const checkOverflow = () => {
			const isOverflowing = element.scrollHeight > 76;
			setHasOverflow(isOverflowing);
		};

		checkOverflow();

		const observer = new ResizeObserver(checkOverflow);
		observer.observe(element);
		return () => observer.disconnect();
	}, [note.content, isEditing]);

	const handleSave = () => {
		if (onUpdate) {
			onUpdate(note.id, editContent);
		}
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditContent(note.content);
		setIsEditing(false);
	};

	const timeStr = note.created_at
		? new Date(note.created_at).toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})
		: "";

	return (
		<div className="group cursor-default rounded-xl border border-base-border bg-base-bg p-4 transition-all hover:border-neutral-400 min-w-0 w-full overflow-hidden">
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide w-fit",
							note.note_type === "alert"
								? "bg-note-alert/10 text-note-alert"
								: note.note_type === "idea"
									? "bg-note-idea/10 text-note-idea"
									: "bg-note-info/10 text-note-info",
						)}
					>
						{note.note_type === "alert" ? (
							<AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
						) : note.note_type === "idea" ? (
							<Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
						) : (
							<Info className="w-3.5 h-3.5" aria-hidden="true" />
						)}
						{note.note_type || "info"}
					</span>
					<span className="text-[10px] font-mono text-neutral-400 font-bold">
						{showTimeOnly
							? timeStr
							: note.created_at
								? note.created_at.split("T")[0]
								: ""}
					</span>
				</div>

				{!isEditing && (
					<div className="flex items-center gap-1 opacity-100 pointer-fine:opacity-0 group-hover-safe:opacity-100 transition-opacity">
						{onInsert && (
							<button
								type="button"
								onClick={() => onInsert(note.content)}
								className="p-1 text-neutral-400 hover-safe:text-action hover-safe:bg-neutral-100 rounded-md transition-colors"
								title="Insert to Editor"
							>
								<ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
							</button>
						)}
						{onUpdate && (
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="p-1 text-neutral-400 hover-safe:text-action hover-safe:bg-neutral-100 rounded-md transition-colors"
								title="Edit Note"
							>
								<Pencil className="w-3.5 h-3.5" aria-hidden="true" />
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={() => onDelete(note.id)}
								className="p-1 text-neutral-400 hover-safe:text-red-500 hover-safe:bg-red-50 rounded-md transition-colors"
								title="Delete Note"
							>
								<Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
							</button>
						)}
					</div>
				)}
			</div>

			{isEditing ? (
				<div className="space-y-2">
					<TextareaAutosize
						autoFocus
						value={editContent}
						onChange={(e) => setEditContent(e.target.value)}
						className="w-full resize-none bg-transparent text-sm leading-snug text-neutral-900 border-none focus:ring-0 p-0"
						placeholder="Edit note content..."
					/>
					<div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
						<button
							type="button"
							onClick={handleCancel}
							className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md flex items-center gap-1 text-[10px] font-bold uppercase"
						>
							<X className="w-3 h-3" aria-hidden="true" />
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSave}
							className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1 text-[10px] font-bold uppercase"
						>
							<Check className="w-3 h-3" aria-hidden="true" />
							Save
						</button>
					</div>
				</div>
			) : (
				<div className="min-w-0 w-full overflow-hidden space-y-1.5">
					<div
						ref={contentRef}
						className={cn(
							"min-w-0 w-full overflow-hidden transition-all duration-200",
							!isExpanded && !isEditing && "max-h-[72px]",
						)}
					>
						<MarkdownRenderer
							content={note.content}
							className="text-sm leading-snug text-neutral-600 group-hover:text-neutral-900 [&_p]:[overflow-wrap:anywhere] [&_a]:break-all [&_a]:[overflow-wrap:anywhere] [&_code]:[overflow-wrap:anywhere]"
						/>
					</div>

					{hasOverflow && (
						<div className="flex justify-start pt-0.5">
							<button
								type="button"
								onClick={() => setIsExpanded(!isExpanded)}
								className="text-[10px] font-bold text-neutral-400 hover:text-action flex items-center gap-0.5 uppercase tracking-wider transition-colors cursor-pointer"
							>
								{isExpanded ? (
									<>
										<ChevronUp className="w-3 h-3" aria-hidden="true" /> Show
										less
									</>
								) : (
									<>
										<ChevronDown className="w-3 h-3" aria-hidden="true" /> Read
										more
									</>
								)}
							</button>
						</div>
					)}
				</div>
			)}

			{note.url_pattern && !note.url_pattern.startsWith("sitecue://") && (
				<p className="mt-2 text-[10px] text-neutral-400 truncate">
					{note.url_pattern}
				</p>
			)}
		</div>
	);
}
