"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSearchNotes, useFetchNoteContents } from "@/hooks/useNotesQuery";
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
			<DialogContent className="z-50 sm:max-w-xl top-[20%] translate-y-0 p-0 overflow-hidden border-none shadow-2xl">
				<div className="flex flex-col bg-base-bg rounded-xl overflow-hidden">
					<form
						onSubmit={handleSearch}
						className="flex items-center px-4 py-3 border-b border-base-border w-full"
					>
						<button type="submit" className="p-1 cursor-pointer">
							<Search
								className="w-5 h-5 text-gray-400 mr-2 hover:text-action transition-colors"
								aria-hidden="true"
							/>
						</button>
						<Input
							autoFocus
							placeholder="Search notes..."
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							className="flex-1 border-none focus-visible:ring-0 text-lg p-0 h-auto bg-transparent"
						/>
						<button
							type="button"
							onClick={onClose}
							className="p-1 text-gray-400 hover:text-action transition-colors cursor-pointer"
						>
							<X className="w-5 h-5" aria-hidden="true" />
						</button>
					</form>

					<div className="max-h-[60vh] overflow-y-auto p-2">
						{isLoading ? (
							<div className="p-4 text-center text-gray-400 animate-pulse">
								Searching...
							</div>
						) : searchQuery && results.length === 0 ? (
							<div className="p-8 text-center text-gray-400">
								No results found for "{searchQuery}"
							</div>
						) : (
							<div className="space-y-1">
								{results.map((note) => (
									<button
										key={note.id}
										type="button"
										onClick={() => handleJump(note)}
										className="w-full text-left p-3 rounded-lg hover-safe:bg-base-surface transition-colors cursor-pointer group"
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
