"use client";

import type { Note } from "@sitecue/shared";
import { SWRBoundary } from "@/components/ui/swr-boundary";
import NoteCard from "./NoteCard";
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
		<div className="flex h-full flex-col bg-neutral-50/10 min-w-0 w-full overflow-hidden">
			{/* 1. Search Bar: 固定上部ヘッダー (shrink-0) */}
			<div className="p-4 border-b border-neutral-200 bg-white/50 z-10 backdrop-blur-md shrink-0">
				<StudioSearchInput
					searchKeyword={searchKeyword}
					onSearchKeywordChange={onSearchKeywordChange}
					onSearch={() => onSearch()}
				/>
			</div>

			{/* 2. Search Results: 独立スクロール領域 (flex-1 overflow-y-auto min-h-0) */}
			<div className="flex-1 p-4 overflow-y-auto pb-safe w-full min-w-0 min-h-0">
				<SWRBoundary
					data={searchResults}
					isLoading={isSearching}
					fallback={
						<div className="grid grid-cols-[minmax(0,1fr)] gap-3 w-full min-w-0 overflow-hidden">
							{["skel-1", "skel-2", "skel-3"].map((skelKey) => (
								<div
									key={skelKey}
									className="h-24 animate-pulse rounded-xl border border-neutral-100 bg-neutral-100/50"
								/>
							))}
						</div>
					}
				>
					{(notes) => (
						<div className="grid grid-cols-[minmax(0,1fr)] gap-3 w-full min-w-0">
							{notes.length === 0 ? (
								<div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-neutral-400">
									<p className="text-sm font-medium">No materials found.</p>
									<p className="mt-1 text-[10px]">
										Enter keywords to search your past notes
										<br />
										and saved pages.
									</p>
								</div>
							) : (
								notes.map((note) => (
									<div key={note.id} className="min-w-0 w-full">
										<NoteCard note={note} />
									</div>
								))
							)}
						</div>
					)}
				</SWRBoundary>
			</div>
		</div>
	);
}
