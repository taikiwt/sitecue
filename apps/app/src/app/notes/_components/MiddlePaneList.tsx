"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Note } from "../types";

type Props = {
	notes: Note[];
	currentDomain: string | null;
	currentExact: string | null;
	selectedNoteId: string | null;
};

export function MiddlePaneList({
	notes,
	currentDomain,
	currentExact,
	selectedNoteId,
}: Props) {
	const searchParams = useSearchParams();

	const getTitle = () => {
		if (currentExact) {
			try {
				const url = new URL(currentExact);
				return url.pathname + url.search;
			} catch {
				return currentExact;
			}
		}
		if (currentDomain) return currentDomain;
		return "Inbox";
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("ja-JP", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getNoteTypeStyles = (type: string) => {
		switch (type) {
			case "alert":
				return "bg-red-100 text-red-700";
			case "idea":
				return "bg-yellow-100 text-yellow-700";
			default:
				return "bg-blue-100 text-blue-700";
		}
	};

	return (
		<div className="flex flex-col h-full bg-white border-r border-gray-200 w-96">
			<div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
				<h2
					className="text-lg font-bold text-gray-900 truncate"
					title={getTitle()}
				>
					{getTitle()}
				</h2>
				<p className="text-xs text-gray-500 mt-1">{notes.length} notes</p>
			</div>

			<div className="flex-1 overflow-y-auto">
				{notes.length > 0 ? (
					<div className="divide-y divide-gray-100">
						{notes.map((note) => {
							const isActive = selectedNoteId === note.id;
							const params = new URLSearchParams(searchParams.toString());
							params.set("noteId", note.id);

							return (
								<Link
									key={note.id}
									href={`/notes?${params.toString()}`}
									className={`block p-4 transition-colors ${
										isActive ? "bg-indigo-50" : "hover:bg-gray-50"
									}`}
								>
									<div className="flex justify-between items-start mb-1">
										<span
											className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getNoteTypeStyles(
												note.note_type,
											)}`}
										>
											{note.note_type}
										</span>
										<span className="text-[10px] text-gray-400">
											{formatDate(note.created_at)}
										</span>
									</div>
									<p className="text-sm text-gray-900 line-clamp-2 wrap-break-word">
										{note.content}
									</p>
									{note.scope === "exact" && !currentExact && (
										<div className="mt-2 text-[10px] text-gray-400 truncate">
											📍 {new URL(note.url_pattern).pathname}
										</div>
									)}
								</Link>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-64 p-8 text-center">
						<div className="text-4xl mb-4">📭</div>
						<p className="text-gray-500 text-sm">
							No notes found for this category.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
