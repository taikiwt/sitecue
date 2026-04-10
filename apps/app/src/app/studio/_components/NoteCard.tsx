"use client";

import type { Note } from "../../../../../../types/app.ts";

export default function NoteCard({ note }: { note: Note }) {
	return (
		<div className="group cursor-default rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-400">
			<div className="mb-2 flex items-center justify-between">
				<span
					className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
						note.note_type === "info" || !note.note_type
							? "bg-blue-50 text-blue-600"
							: note.note_type === "alert"
								? "bg-red-50 text-red-600"
								: "bg-amber-50 text-amber-600"
					}`}
				>
					{note.note_type || "info"}
				</span>
				<span className="text-[10px] text-neutral-400">
					{note.created_at ? note.created_at.split("T")[0] : ""}
				</span>
			</div>
			<p className="line-clamp-3 text-sm leading-snug text-neutral-600 group-hover:text-neutral-900">
				{note.content}
			</p>
			{note.url_pattern && !note.url_pattern.startsWith("sitecue://") && (
				<p className="mt-2 text-[10px] text-neutral-400 truncate">
					{note.url_pattern}
				</p>
			)}
		</div>
	);
}
