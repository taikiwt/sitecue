"use client";

import { fetchDraftsByDate, fetchNotesByDate } from "@sitecue/shared";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import NoteCard from "../../../studio/_components/NoteCard";

interface Props {
	date: string;
	onInsert?: (content: string) => void;
}

export function DiaryMaterialsPane({ date, onInsert }: Props) {
	const { data: materials, isLoading } = useQuery({
		queryKey: ["materials", date],
		queryFn: async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return { notes: [], drafts: [] };

			const [fetchedNotes, fetchedDrafts] = await Promise.all([
				fetchNotesByDate(supabase, user.id, date),
				fetchDraftsByDate(supabase, user.id, date),
			]);
			return { notes: fetchedNotes, drafts: fetchedDrafts };
		},
	});

	const notes = materials?.notes || [];
	const drafts = materials?.drafts || [];

	if (isLoading) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 bg-base-surface h-full">
				<p className="text-sm">Loading materials...</p>
			</div>
		);
	}

	const hasMaterials = notes.length > 0 || drafts.length > 0;

	return (
		<div className="w-full h-full flex flex-col overflow-hidden bg-base-surface">
			{/* 固定ヘッダー */}
			<div className="p-4 border-b border-base-border shrink-0 bg-base-surface/50 h-14 flex items-center">
				<h2 className="text-xs font-bold text-action uppercase tracking-widest font-mono flex items-center gap-2">
					<Calendar className="w-3.5 h-3.5 text-neutral-400" />
					Materials of the Day ({notes.length + drafts.length})
				</h2>
			</div>

			{/* 独立スクロール領域 */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
				{!hasMaterials ? (
					<div className="text-center text-neutral-400 py-16 font-mono text-xs">
						No footprints collected today.
					</div>
				) : (
					<>
						{/* Notes Section */}
						{notes.length > 0 && (
							<div className="space-y-2">
								<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
									Notes ({notes.length})
								</h3>
								<div className="space-y-2">
									{notes.map((note) => (
										<NoteCard
											key={note.id}
											note={note}
											onInsert={onInsert}
											showTimeOnly={true}
										/>
									))}
								</div>
							</div>
						)}

						{/* Drafts Section */}
						{drafts.length > 0 && (
							<div className="space-y-2">
								<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
									Drafts ({drafts.length})
								</h3>
								<div className="space-y-2">
									{drafts.map((draft) => (
										<div
											key={draft.id}
											className="p-3 bg-base-bg border border-base-border rounded-lg space-y-1.5"
										>
											<div className="flex items-center justify-between text-[10px] text-gray-400">
												<span className="flex items-center gap-1">
													<FileText className="w-3 h-3" />
													Draft
												</span>
												<span>
													{new Date(draft.updated_at).toLocaleTimeString(
														"en-US",
														{ hour: "2-digit", minute: "2-digit" },
													)}
												</span>
											</div>
											<h4 className="text-sm font-bold text-action truncate">
												{draft.title || "Untitled Draft"}
											</h4>
											<p className="text-sm text-action line-clamp-3 break-words">
												{draft.content}
											</p>
										</div>
									))}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
