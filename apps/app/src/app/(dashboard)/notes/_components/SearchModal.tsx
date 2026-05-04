"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { SearchInputBase } from "@/components/ui/search-input-base";
import { useFetchNoteContents, useSearchNotes } from "@/hooks/useNotesQuery";
import { normalizeUrlForGrouping } from "@/utils/url";
import type { Note } from "../types";

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	const router = useRouter();
	const [inputValue, setInputValue] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const { data: results = [], isLoading } = useSearchNotes(searchQuery);
	const { mutate: fetchContents } = useFetchNoteContents();

	const groupedResults = useMemo(() => {
		const domains = new Set<string>();
		const pages = new Set<string>();
		const notes: Note[] = [];

		results.forEach((note) => {
			if (note.url_pattern) {
				const domain = normalizeUrlForGrouping(note.url_pattern).split("/")[0];
				domains.add(domain);
				if (note.scope === "exact") pages.add(note.url_pattern);
			}
			if (note.content?.toLowerCase().includes(searchQuery.toLowerCase())) {
				notes.push(note);
			}
		});
		return { domains: Array.from(domains), pages: Array.from(pages), notes };
	}, [results, searchQuery]);

	// Fetch contents for search results to show snippets
	useEffect(() => {
		if (results.length > 0) {
			const missingIds = results
				.filter((n) => n.content === undefined)
				.map((n) => n.id);
			if (missingIds.length > 0) {
				fetchContents(missingIds);
			}
		}
	}, [results, fetchContents]);

	const handleJump = (note: Note) => {
		const params = new URLSearchParams();
		if (note.scope === "domain") {
			params.set("domain", note.url_pattern);
		} else if (note.scope === "exact") {
			const domain = normalizeUrlForGrouping(note.url_pattern).split("/")[0];
			params.set("domain", domain);
			params.set("exact", note.url_pattern);
		} else {
			params.set("domain", "inbox");
		}
		params.set("noteId", note.id);

		onClose();
		router.push(`/notes?${params.toString()}`);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchQuery(inputValue);
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogOverlay className="z-50 bg-black/20 backdrop-blur-sm" />
			<DialogContent
				className="z-50 w-[95vw] sm:max-w-xl top-[15%] translate-y-0 p-0 overflow-visible border-none shadow-2xl bg-transparent"
				showCloseButton={false}
			>
				{/* モーダルの外側（右上）に配置する閉じるボタン */}
				<div className="absolute -top-12 right-0 md:-right-12 md:top-0">
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-white/70 hover:text-white transition-colors cursor-pointer bg-black/20 hover:bg-black/40 rounded-full"
						aria-label="Close modal"
					>
						<X className="w-6 h-6" aria-hidden="true" />
					</button>
				</div>

				{/* メインコンテナ */}
				<div className="flex flex-col bg-base-bg rounded-xl overflow-hidden max-h-[75vh] md:max-h-[60vh]">
					<div className="px-2 py-2 border-b border-base-border">
						<SearchInputBase
							value={inputValue}
							onChange={setInputValue}
							onClear={() => {
								setInputValue("");
								setSearchQuery(""); // 結果もクリア
							}}
							onSubmit={() => setSearchQuery(inputValue)}
							placeholder="Search notes..."
							className="border-none bg-transparent focus-within:ring-0"
						/>
					</div>

					<div className="overflow-y-auto p-2">
						{isLoading ? (
							<div className="p-4 text-center text-gray-400 animate-pulse">
								Searching...
							</div>
						) : searchQuery && results.length === 0 ? (
							<div className="p-8 text-center text-gray-400">
								No results found for "{searchQuery}"
							</div>
						) : (
							<div className="space-y-4">
								{groupedResults.domains.length > 0 && (
									<div>
										<h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
											Domains
										</h3>
										<div className="space-y-1">
											{groupedResults.domains.map((domain) => (
												<button
													key={domain}
													type="button"
													onClick={() =>
														router.push(
															`/notes?domain=${domain}${searchQuery ? `&q=${searchQuery}` : ""}`,
														)
													}
													className="w-full text-left px-3 py-2 rounded-lg hover-safe:bg-base-surface transition-colors cursor-pointer text-sm"
												>
													{domain}
												</button>
											))}
										</div>
									</div>
								)}

								{groupedResults.pages.length > 0 && (
									<div>
										<h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
											Pages
										</h3>
										<div className="space-y-1">
											{groupedResults.pages.map((page) => (
												<button
													key={page}
													type="button"
													onClick={() => {
														const domain =
															normalizeUrlForGrouping(page).split("/")[0];
														router.push(
															`/notes?domain=${domain}&exact=${page}${searchQuery ? `&q=${searchQuery}` : ""}`,
														);
													}}
													className="w-full text-left px-3 py-2 rounded-lg hover-safe:bg-base-surface transition-colors cursor-pointer text-sm truncate"
												>
													{page}
												</button>
											))}
										</div>
									</div>
								)}

								{groupedResults.notes.length > 0 && (
									<div>
										<h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
											Notes
										</h3>
										<div className="space-y-1">
											{groupedResults.notes.map((note) => (
												<button
													key={note.id}
													type="button"
													onClick={() => handleJump(note)}
													className="w-full text-left px-3 py-2 rounded-lg hover-safe:bg-base-surface transition-colors cursor-pointer group"
												>
													<div className="flex items-center justify-between mb-1">
														<span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
															{note.scope} • {note.note_type}
														</span>
														<span className="text-[10px] text-gray-400">
															{new Date(note.created_at).toLocaleDateString()}
														</span>
													</div>
													<p className="text-sm text-action font-medium line-clamp-2 mb-1">
														{note.content || "No content"}
													</p>
													<p className="text-[10px] text-gray-400 truncate">
														{note.url_pattern}
													</p>
												</button>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					{!searchQuery && (
						<div className="p-4 text-center text-xs text-gray-400 border-t border-base-border">
							Type and press Enter to search your notes across domains
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
