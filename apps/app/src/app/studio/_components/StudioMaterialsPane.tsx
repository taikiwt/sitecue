"use client";

import type { Note } from "../../../../../../types/app.ts";
import ReadOnlyNoteCard from "./ReadOnlyNoteCard";
import StudioSearchInput from "./StudioSearchInput";

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
				<StudioSearchInput
					searchKeyword={searchKeyword}
					onSearchKeywordChange={onSearchKeywordChange}
					onSearch={() => onSearch()}
				/>
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
						searchResults.map((note) => (
							<ReadOnlyNoteCard key={note.id} note={note} />
						))
					)}
				</div>
			</div>
		</div>
	);
}
