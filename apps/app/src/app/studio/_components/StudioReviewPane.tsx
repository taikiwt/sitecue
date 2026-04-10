"use client";

import { Loader2, Sparkles } from "lucide-react";
import type { Note } from "../../../../../../types/app.ts";
import NoteEditor from "../../_components/NoteEditor";
import NoteCard from "./NoteCard";

type NoteType = "info" | "alert" | "idea";

interface StudioReviewPaneProps {
	reviewNotes: Note[];
	isLoadingReview: boolean;
	onAddNote: (content: string, type: NoteType) => Promise<void>;
	onWeave: () => void;
	isWeaving: boolean;
	usageCount: number;
	plan: "free" | "pro";
}

export default function StudioReviewPane({
	reviewNotes,
	isLoadingReview,
	onAddNote,
	onWeave,
	isWeaving,
	usageCount,
	plan,
}: StudioReviewPaneProps) {
	const limit = plan === "pro" ? 100 : 3;
	const isLimitReached = usageCount >= limit;

	return (
		<div className="relative flex h-full flex-col bg-neutral-50/30">
			<div className="flex-1 overflow-y-auto pb-28">
				{/* Note Form */}
				<div className="sticky top-0 z-10 p-4 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
					<NoteEditor onSubmit={onAddNote} />
				</div>

				{/* Note List */}
				<div className="p-4">
					<div className="grid gap-3">
						{isLoadingReview ? (
							Array.from({ length: 3 }).map((_, i) => (
								<div
									key={`skeleton-${
										// biome-ignore lint/suspicious/noArrayIndexKey: Skeletons are static
										i
									}`}
									className="h-24 animate-pulse rounded-xl border border-neutral-100 bg-neutral-100/50"
								/>
							))
						) : reviewNotes.length === 0 ? (
							<div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-neutral-400">
								<p className="text-sm font-medium">
									No notes for this draft yet.
								</p>
								<p className="mt-1 text-[10px]">
									Use the form above to capture your thoughts.
								</p>
							</div>
						) : (
							reviewNotes.map((note) => <NoteCard key={note.id} note={note} />)
						)}
					</div>
				</div>
			</div>

			{/* Weave Action Bar */}
			<div className="absolute bottom-4 left-4 right-4">
				<div className="p-1 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-neutral-200/50 backdrop-blur-md">
					<button
						type="button"
						onClick={onWeave}
						disabled={isWeaving}
						className={`relative w-full flex items-center justify-between p-3 rounded-[14px] transition-all duration-300 ${
							isWeaving
								? "bg-neutral-50 text-neutral-400 cursor-not-allowed"
								: isLimitReached
									? "bg-neutral-100 text-neutral-500 hover:bg-neutral-800 hover:text-white cursor-pointer"
									: "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-[1.01] active:scale-[0.99] cursor-pointer font-bold"
						}`}
					>
						<div className="flex items-center gap-3 pl-1">
							{isWeaving ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Sparkles
									className={`h-5 w-5 ${!isLimitReached ? "text-amber-400" : ""}`}
								/>
							)}
							<span className="text-sm tracking-tight">
								{isWeaving ? "WEAVING..." : "WEAVE WITH AI"}
							</span>
						</div>

						<div
							className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase transition-colors ${
								isWeaving || isLimitReached
									? "bg-neutral-200 text-neutral-500"
									: "bg-white/10 text-white/70"
							}`}
						>
							{usageCount} / {limit} USES
						</div>
					</button>
					{isLimitReached && (
						<p className="mt-2 text-[10px] text-center text-red-500 font-bold animate-pulse">
							MONTHLY LIMIT REACHED
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
