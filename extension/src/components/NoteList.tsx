import { Ghost, Loader2 } from "lucide-react";
import { useState } from "react";
import type { Note, NoteScope, NoteType } from "../hooks/useNotes";
import { getScopeUrls } from "../utils/url";
import NoteItem from "./NoteItem";

interface NoteListProps {
	notes: Note[];
	loading: boolean;
	filterType: "all" | "info" | "alert" | "idea";
	showResolved: boolean;
	currentFullUrl: string;
	viewScope: "exact" | "domain" | "inbox";
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
	onUpdateNoteOrder: (id: string, newSortOrder: number) => Promise<boolean>;
	onToggleExpansion: (id: string, current: boolean) => Promise<boolean>;
}

export default function NoteList({
	notes,
	loading,
	filterType,
	showResolved,
	currentFullUrl,
	viewScope,
	onUpdate,
	onDelete,
	onToggleResolved,
	onToggleFavorite,
	onTogglePinned,
	onUpdateNoteOrder,
	onToggleExpansion,
}: NoteListProps) {
	const [isSorting, setIsSorting] = useState(false);

	const filteredNotes = notes.filter((note) => {
		if (filterType !== "all") {
			const type = note.note_type || "info";
			if (type !== filterType) return false;
		}
		if (!showResolved && note.is_resolved) {
			return false;
		}
		return true;
	});

	const favoriteNotes = filteredNotes
		.filter((n) => n.is_favorite)
		.sort(
			(a, b) =>
				(a.sort_order || 0) - (b.sort_order || 0) ||
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);

	const scopeUrls = currentFullUrl
		? getScopeUrls(currentFullUrl)
		: { domain: "", exact: "" };

	const currentScopeNotes = filteredNotes
		.filter((n) => {
			if (n.is_favorite) return false;
			if (viewScope === "inbox") return n.scope === "inbox";
			return (
				(n.scope === "domain" && n.url_pattern === scopeUrls.domain) ||
				(n.scope === "exact" && n.url_pattern === scopeUrls.exact)
			);
		})
		.sort((a, b) => {
			if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
			if ((a.sort_order || 0) !== (b.sort_order || 0))
				return (a.sort_order || 0) - (b.sort_order || 0);
			return (
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
			);
		});

	if (loading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
			</div>
		);
	}

	if (favoriteNotes.length === 0 && currentScopeNotes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-10 text-center">
				<div className="bg-gray-100 p-4 rounded-full mb-4">
					<Ghost className="w-8 h-8 text-gray-400" />
				</div>
				<h3 className="text-sm font-medium text-gray-900 mb-1">
					No notes for this page yet
				</h3>
				<p className="text-xs text-gray-500 mb-4 max-w-50">
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

		// 2. フィルター適用前の「真の並び替え対象グループ」を抽出
		const validGroup = notes
			.filter((n) => {
				if (isFavorite) return n.is_favorite;
				if (n.is_favorite) return false;
				if (n.is_pinned !== note.is_pinned) return false;

				if (viewScope === "inbox") return n.scope === "inbox";
				return (
					(n.scope === "domain" && n.url_pattern === scopeUrls.domain) ||
					(n.scope === "exact" && n.url_pattern === scopeUrls.exact)
				);
			})
			.sort((a, b) => {
				if ((a.sort_order || 0) !== (b.sort_order || 0))
					return (a.sort_order || 0) - (b.sort_order || 0);
				return (
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
				);
			});

		const groupIndex = validGroup.findIndex((n) => n.id === note.id);

		// 3. 移動ハンドラー（一時変数を用いた安全なSwapとガード処理）
		const handleMoveUp = async () => {
			if (groupIndex <= 0) return;
			setIsSorting(true);
			try {
				let newOrder: number;
				if (groupIndex === 1) {
					newOrder = (validGroup[0].sort_order || 0) - 1;
				} else {
					newOrder =
						((validGroup[groupIndex - 2].sort_order || 0) +
							(validGroup[groupIndex - 1].sort_order || 0)) /
						2;
				}
				await onUpdateNoteOrder(note.id, newOrder);
			} finally {
				setIsSorting(false);
			}
		};

		const handleMoveDown = async () => {
			if (groupIndex === -1 || groupIndex >= validGroup.length - 1) return;
			setIsSorting(true);
			try {
				let newOrder: number;
				if (groupIndex === validGroup.length - 2) {
					newOrder = (validGroup[validGroup.length - 1].sort_order || 0) + 1;
				} else {
					newOrder =
						((validGroup[groupIndex + 1].sort_order || 0) +
							(validGroup[groupIndex + 2].sort_order || 0)) /
						2;
				}
				await onUpdateNoteOrder(note.id, newOrder);
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
					<div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1">
						<span>Favorites</span>
					</div>
					<div className="space-y-3">
						{favoriteNotes.map((note) => renderItem(note, true))}
					</div>
					{currentScopeNotes.length > 0 && <hr className="border-gray-200" />}
				</div>
			)}

			{currentScopeNotes.length > 0 && (
				<div className="space-y-3">
					{favoriteNotes.length > 0 && (
						<div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1">
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
