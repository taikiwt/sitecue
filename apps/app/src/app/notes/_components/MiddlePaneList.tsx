"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSafeUrl } from "@/utils/url";
import type { Draft, Note } from "../types";

type Props = {
	items: (Note | Draft)[];
	currentView: string | null;
	currentDomain: string | null;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
};

export function MiddlePaneList({
	items,
	currentView,
	currentDomain,
	currentExact,
	selectedNoteId,
	selectedDraftId,
}: Props) {
	const searchParams = useSearchParams();

	const isSelected = !!currentView || !!currentDomain || !!currentExact;

	const getTitle = () => {
		if (currentView === "drafts") return "Drafts";
		if (currentExact) {
			const safeUrl = getSafeUrl(currentExact);
			if (safeUrl) {
				return safeUrl.pathname + safeUrl.search;
			}
			return currentExact;
		}
		if (currentDomain === "inbox") return "Inbox";
		if (currentDomain) return currentDomain;
		return "Notes";
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
				<p className="text-xs text-gray-500 mt-1">
					{isSelected
						? `${items.length} ${currentView === "drafts" ? "drafts" : "notes"}`
						: "Waiting for selection"}
				</p>
			</div>

			<div className="flex-1 overflow-y-auto">
				{!isSelected ? (
					<div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
						<div className="text-4xl mb-4">👈</div>
						<p className="text-sm font-medium">
							左のリストからカテゴリを選択してください
						</p>
						<p className="text-xs mt-2">
							Inbox、Drafts、ドメインを選択すると
							<br />
							一覧が表示されます
						</p>
					</div>
				) : items.length > 0 ? (
					<div className="divide-y divide-gray-100">
						{items.map((item) => {
							const isNote = "note_type" in item;
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

							return (
								<Link
									key={item.id}
									href={`/notes?${params.toString()}`}
									className={`block p-4 transition-colors ${
										isActive ? "bg-neutral-100" : "hover:bg-gray-50"
									}`}
								>
									<div className="flex justify-between items-start mb-1">
										<span
											className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
												isNote
													? getNoteTypeStyles(item.note_type)
													: "bg-purple-100 text-purple-700"
											}`}
										>
											{isNote
												? item.note_type
												: item.target_platform || "draft"}
										</span>
										<span className="text-[10px] text-gray-400">
											{formatDate(isNote ? item.created_at : item.updated_at)}
										</span>
									</div>
									<h3 className="text-sm font-bold text-gray-900 truncate mb-0.5">
										{isNote ? "" : item.title || "Untitled Draft"}
									</h3>
									<p className="text-sm text-gray-900 line-clamp-2 wrap-break-word">
										{isNote ? item.content : item.content}
									</p>
									{isNote && item.scope === "exact" && !currentExact && (
										<div className="mt-2 text-[10px] text-gray-400 truncate">
											📍{" "}
											{getSafeUrl(item.url_pattern)?.pathname ??
												item.url_pattern}
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
							No {currentView === "drafts" ? "drafts" : "notes"} found for this
							category.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
