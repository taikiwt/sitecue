"use client";

import type { Note } from "../types";

type Props = {
	note?: Note;
};

export function RightPaneDetail({ note }: Props) {
	if (!note) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-8">
				<div className="text-6xl mb-6 animate-pulse" aria-hidden="true">
					👈
				</div>
				<p className="text-lg font-medium text-gray-400">
					左のリストからノートを選択してください
				</p>
			</div>
		);
	}

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
			<div className="p-8 max-w-3xl mx-auto w-full">
				<div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span
								className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
									note.note_type === "alert"
										? "bg-red-100 text-red-700"
										: note.note_type === "idea"
											? "bg-yellow-100 text-yellow-700"
											: "bg-blue-100 text-blue-700"
								}`}
							>
								{note.note_type}
							</span>
							<span className="text-sm text-gray-400">
								{formatDate(note.created_at)}
							</span>
						</div>
					</div>
					<div className="flex gap-2">
						{note.is_pinned && (
							<span
								role="img"
								className="text-xl"
								title="Pinned"
								aria-label="Pinned"
							>
								📌
							</span>
						)}
						{note.is_favorite && (
							<span
								role="img"
								className="text-xl"
								title="Favorite"
								aria-label="Favorite"
							>
								⭐
							</span>
						)}
					</div>
				</div>

				<div className="mb-10">
					<div className="text-sm text-gray-400 mb-2 uppercase tracking-tight font-medium">
						Source URL
					</div>
					<a
						href={note.url_pattern}
						target="_blank"
						rel="noopener noreferrer"
						className="text-indigo-600 hover:underline break-all text-sm block bg-indigo-50 p-3 rounded-lg border border-indigo-100"
					>
						{note.url_pattern}
					</a>
				</div>

				<div className="prose prose-indigo max-w-none">
					<div className="text-sm text-gray-400 mb-2 uppercase tracking-tight font-medium">
						Note Content
					</div>
					<div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm min-h-50 whitespace-pre-wrap text-gray-800 leading-relaxed">
						{note.content}
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400">
					<p>ID: {note.id}</p>
					<p>Last updated: {formatDate(note.updated_at)}</p>
					<p className="mt-1 uppercase tracking-widest font-bold">
						SiteCue Base Camp
					</p>
				</div>
			</div>
		</div>
	);
}
