"use client";

import {
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	Info,
	Lightbulb,
} from "lucide-react";
import { useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import type { Note } from "../../../../../../types/app.ts";

export default function ReadOnlyNoteCard({ note }: { note: Note }) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="rounded-xl border border-neutral-200 bg-white p-4 transition-all">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide w-fit",
							note.note_type === "alert"
								? "bg-neutral-100 text-action"
								: note.note_type === "idea"
									? "bg-neutral-100 text-action"
									: "bg-neutral-100 text-action",
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
			</div>

			<div
				className={cn(
					"relative",
					!isExpanded && "max-h-[160px] overflow-hidden",
				)}
			>
				<MarkdownRenderer content={note.content || ""} className="text-sm" />
				{!isExpanded && (note.content || "").length > 200 && (
					<div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
				)}
			</div>

			{(note.content || "").length > 200 && (
				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase text-neutral-400 hover:text-action transition-colors cursor-pointer"
				>
					{isExpanded ? (
						<>
							Show Less <ChevronUp className="w-3 h-3" aria-hidden="true" />
						</>
					) : (
						<>
							Show More <ChevronDown className="w-3 h-3" aria-hidden="true" />
						</>
					)}
				</button>
			)}

			{note.url_pattern && !note.url_pattern.startsWith("sitecue://") && (
				<p className="mt-3 text-[10px] text-neutral-400 truncate border-t border-neutral-100 pt-2">
					{note.url_pattern}
				</p>
			)}
		</div>
	);
}
