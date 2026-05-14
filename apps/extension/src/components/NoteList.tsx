import { ChevronDown, ChevronRight, Ghost } from "lucide-react";
import { useState } from "react";
import type { Note, NoteScope, NoteType } from "../hooks/useNotes";
import NoteItem from "./NoteItem";
import NoteSkeleton from "./NoteSkeleton";

interface NoteListProps {
	notes: Note[];
	loading: boolean;
	currentFullUrl: string;
	onUpdate: (
		id: string,
		content: string,
		type: NoteType,
		scope: NoteScope,
	) => Promise<boolean>;
	onDelete: (id: string) => Promise<boolean>;
	onToggleResolved: (
		id: string,
		status: boolean | undefined,
	) => Promise<boolean>;
	onToggleFavorite: (note: Note) => Promise<boolean>;
	onTogglePinned: (note: Note) => Promise<boolean>;
	onUpdateNoteOrder: (id: string, direction: "up" | "down") => Promise<boolean>;
	onToggleExpansion: (id: string, current: boolean) => Promise<boolean>;
}

export default function NoteList({
	notes,
	loading,
	currentFullUrl,
	onUpdate,
	onDelete,
	onToggleResolved,
	onToggleFavorite,
	onTogglePinned,
	onUpdateNoteOrder,
	onToggleExpansion,
}: NoteListProps) {
	const [isSorting, setIsSorting] = useState(false);
	const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

	const favoriteNotes = notes
		.filter((n) => n.is_favorite)
		.sort(
			(a, b) =>
				(a.sort_order || 0) - (b.sort_order || 0) ||
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);

	const currentScopeNotes = notes
		.filter((n) => !n.is_favorite)
		.sort((a, b) => {
			if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
			if ((a.sort_order || 0) !== (b.sort_order || 0))
				return (a.sort_order || 0) - (b.sort_order || 0);
			return (
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
			);
		});

	if (loading && notes.length === 0) {
		return (
			<div className="space-y-3">
				{["skel-1", "skel-2", "skel-3"].map((key) => (
					<NoteSkeleton key={key} />
				))}
			</div>
		);
	}

	if (favoriteNotes.length === 0 && currentScopeNotes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center">
				<div className="bg-base-bg p-4 rounded-full mb-4">
					<Ghost className="w-8 h-8 text-muted-foreground" />
				</div>
				<h3 className="text-sm font-medium text-action mb-1">
					No notes for this page yet
				</h3>
				<p className="text-xs text-muted-foreground mb-4 max-w-50">
					Capture your thoughts for this page.
				</p>
			</div>
		);
	}

	const renderItem = (note: Note, isFavorite: boolean) => {
		// 1. UI上の表示順での最初・最後を判定
		const list = isFavorite ? favoriteNotes : currentScopeNotes;
		const index = list.findIndex((n) => n.id === note.id);
		const pinnedCount = list.filter((n) => n.is_pinned).length;
		const isFirstNormal = !note.is_pinned && index === pinnedCount;
		const isLastNormal = !note.is_pinned && index === list.length - 1;

		// 2. 現在の表示リストから同一ピン状態のグループを抽出（フィルター適用後を基準にする）
		const validGroup = list.filter((n) => n.is_pinned === note.is_pinned);

		const groupIndex = validGroup.findIndex((n) => n.id === note.id);

		// 3. 移動ハンドラー
		const handleMoveUp = async () => {
			if (groupIndex <= 0) return;
			setIsSorting(true);
			try {
				await onUpdateNoteOrder(note.id, "up");
			} finally {
				setIsSorting(false);
			}
		};

		const handleMoveDown = async () => {
			if (groupIndex === -1 || groupIndex >= validGroup.length - 1) return;
			setIsSorting(true);
			try {
				await onUpdateNoteOrder(note.id, "down");
			} finally {
				setIsSorting(false);
			}
		};

		return (
			<NoteItem
				key={note.id}
				note={note}
				currentFullUrl={currentFullUrl}
				isFavoriteList={isFavorite}
				isFirst={isFirstNormal}
				isLast={isLastNormal}
				onMoveUp={handleMoveUp}
				onMoveDown={handleMoveDown}
				onUpdate={onUpdate}
				onDelete={onDelete}
				onToggleResolved={onToggleResolved}
				onToggleFavorite={onToggleFavorite}
				onTogglePinned={onTogglePinned}
				onToggleExpansion={onToggleExpansion}
				isSorting={isSorting}
			/>
		);
	};

	return (
		<>
			{favoriteNotes.length > 0 && (
				<div className="space-y-3">
					<button
						type="button"
						onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
						className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 hover:text-action transition-colors cursor-pointer"
					>
						{isFavoritesOpen ? (
							<ChevronDown className="w-3 h-3" />
						) : (
							<ChevronRight className="w-3 h-3" />
						)}
						<span>FAVORITES ({favoriteNotes.length})</span>
					</button>
					{isFavoritesOpen && (
						<div className="space-y-3">
							{favoriteNotes.map((note) => renderItem(note, true))}
						</div>
					)}
					{currentScopeNotes.length > 0 && (
						<hr className="border-base-border" />
					)}
				</div>
			)}

			{currentScopeNotes.length > 0 && (
				<div className="space-y-3">
					{favoriteNotes.length > 0 && (
						<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
							<span>Current Page</span>
						</div>
					)}
					<div className="space-y-3">
						{currentScopeNotes.map((note) => renderItem(note, false))}
					</div>
				</div>
			)}
		</>
	);
}
