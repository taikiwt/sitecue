"use client";

import type { Note } from "../../../../../../types/app.ts";
import NoteCard from "./NoteCard";

interface StudioMaterialsPaneProps {
	searchKeyword: string;
	onSearchKeywordChange: (value: string) => void;
	onSearch: (e?: React.FormEvent) => Promise<void>;
	searchResults: Note[];
	isSearching: boolean;
}

export default function StudioMaterialsPane({
	searchKeyword,
	onSearchKeywordChange,
	onSearch,
	searchResults,
	isSearching,
}: StudioMaterialsPaneProps) {
	return (
		<div className="flex h-full flex-col bg-neutral-50/10">
			{/* Search Bar */}
			<div className="p-4 border-b border-neutral-200 bg-white/50 sticky top-0 z-10 backdrop-blur-md">
				<form onSubmit={onSearch} className="relative">
					<input
						type="text"
						placeholder="Search global materials..."
						value={searchKeyword}
						onChange={(e) => onSearchKeywordChange(e.target.value)}
						className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-neutral-900 focus:outline-none transition-all shadow-sm"
					/>
					<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
						🔍
					</span>
					<button
						type="submit"
						className="hidden" // Submit via Enter
					>
						Search
					</button>
				</form>
			</div>

			{/* Search Results */}
			<div className="flex-1 p-4 overflow-y-auto">
				<div className="grid gap-3">
					{isSearching ? (
						Array.from({ length: 3 }).map((_, i) => (
							<div
								key={`skeleton-search-${
									// biome-ignore lint/suspicious/noArrayIndexKey: Skeletons are static
									i
								}`}
								className="h-24 animate-pulse rounded-xl border border-neutral-100 bg-neutral-100/50"
							/>
						))
					) : searchResults.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-neutral-400">
							<p className="text-sm font-medium">No materials found.</p>
							<p className="mt-1 text-[10px]">
								Enter keywords to search your past notes
								<br />
								and saved pages.
							</p>
						</div>
					) : (
						searchResults.map((note) => <NoteCard key={note.id} note={note} />)
					)}
				</div>
			</div>
		</div>
	);
}
