"use client";

import {
	AlertTriangle,
	ArrowLeft,
	Check,
	Info,
	Lightbulb,
	Pencil,
	Trash2,
	X,
} from "lucide-react";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import type { Note } from "../../../../../../types/app.ts";

interface NoteCardProps {
	note: Note;
	onUpdate?: (id: string, content: string) => void;
	onDelete?: (id: string) => void;
	onInsert?: (content: string) => void;
}

export default function NoteCard({
	note,
	onUpdate,
	onDelete,
	onInsert,
}: NoteCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(note.content);

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

	return (
		<div className="group cursor-default rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-400">
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide w-fit",
							note.note_type === "alert"
								? "bg-note-alert/5 text-note-alert"
								: note.note_type === "idea"
									? "bg-note-idea/5 text-note-idea"
									: "bg-note-info/5 text-note-info",
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
					<span className="text-[10px] text-neutral-400">
						{note.created_at ? note.created_at.split("T")[0] : ""}
					</span>
				</div>

				{!isEditing && (
					<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						{onInsert && (
							<button
								type="button"
								onClick={() => onInsert(note.content)}
								className="p-1 text-neutral-400 hover:text-action hover:bg-neutral-100 rounded-md transition-colors"
								title="Insert to Editor"
							>
								<ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
							</button>
						)}
						{onUpdate && (
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="p-1 text-neutral-400 hover:text-action hover:bg-neutral-100 rounded-md transition-colors"
								title="Edit Note"
							>
								<Pencil className="w-3.5 h-3.5" aria-hidden="true" />
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={() => onDelete(note.id)}
								className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
				<p className="whitespace-pre-wrap break-words text-sm leading-snug text-neutral-600 group-hover:text-neutral-900">
					{note.content}
				</p>
			)}

			{note.url_pattern && !note.url_pattern.startsWith("sitecue://") && (
				<p className="mt-2 text-[10px] text-neutral-400 truncate">
					{note.url_pattern}
				</p>
			)}
		</div>
	);
}
