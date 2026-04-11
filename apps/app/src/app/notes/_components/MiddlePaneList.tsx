"use client";

import {
	AlertTriangle,
	ArrowLeft,
	Inbox,
	Info,
	Lightbulb,
	MapPin,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { CustomLink as Link } from "@/components/ui/custom-link";
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
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getNoteTypeStyles = (type: string) => {
		switch (type) {
			case "alert":
				return {
					className: "bg-rose-50 text-rose-500",
					Icon: AlertTriangle,
				};
			case "idea":
				return {
					className: "bg-amber-50 text-amber-500",
					Icon: Lightbulb,
				};
			default:
				return {
					className: "bg-blue-50 text-blue-500",
					Icon: Info,
				};
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
						<ArrowLeft
							className="w-10 h-10 mb-4 text-gray-300"
							aria-hidden="true"
						/>
						<p className="text-sm font-medium">
							Please select a category from the list
						</p>
						<p className="text-xs mt-2">
							Select Inbox, Drafts, or a Domain
							<br />
							to see the list of items
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
									className={`block p-4 transition-colors cursor-pointer ${
										isActive ? "bg-neutral-100" : "hover:bg-neutral-100"
									}`}
								>
									<div className="flex justify-between items-start mb-1">
										{isNote ? (
											<span
												className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
													getNoteTypeStyles(item.note_type).className
												}`}
											>
												{(() => {
													const { Icon } = getNoteTypeStyles(item.note_type);
													return (
														<Icon className="w-3.5 h-3.5" aria-hidden="true" />
													);
												})()}
												{item.note_type}
											</span>
										) : (
											<span className="bg-purple-50 text-purple-500 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
												{item.target_platform || "draft"}
											</span>
										)}
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
										<div className="mt-2 text-[10px] text-gray-400 truncate flex items-center gap-1">
											<MapPin className="w-3 h-3" aria-hidden="true" />
											{getSafeUrl(item.url_pattern)?.pathname ??
												item.url_pattern}
										</div>
									)}
								</Link>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-64 p-8 text-center text-gray-400">
						<Inbox
							className="w-12 h-12 mb-4 text-gray-200"
							aria-hidden="true"
						/>
						<p className="text-sm">
							No {currentView === "drafts" ? "drafts" : "notes"} found for this
							category.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
