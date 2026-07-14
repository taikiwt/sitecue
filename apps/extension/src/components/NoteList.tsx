import {
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
	onUpdateNoteOrder: (id: string, newOrder: number) => Promise<boolean>;
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
	const [_isSorting, setIsSorting] = useState(false);
	const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
	const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
	const [isEditDirty, setIsEditDirty] = useState(false);
	const [activeDragNote, setActiveDragNote] = useState<Note | null>(null);

	const [activeFavoriteNotes, setActiveFavoriteNotes] = useState<Note[] | null>(
		null,
	);
	const [activePinnedNotes, setActivePinnedNotes] = useState<Note[] | null>(
		null,
	);
	const [activeNormalNotes, setActiveNormalNotes] = useState<Note[] | null>(
		null,
	);

	const handleDragStart = (
		event: DragStartEvent,
		group: "favorites" | "pinned" | "normal",
	) => {
		const note = notes.find((n) => n.id === event.active.id);
		if (note) setActiveDragNote(note);

		if (group === "favorites") {
			setActiveFavoriteNotes(
				notes
					.filter((n) => n.is_favorite)
					.sort(
						(a, b) =>
							(a.sort_order || 0) - (b.sort_order || 0) ||
							new Date(a.created_at).getTime() -
								new Date(b.created_at).getTime(),
					),
			);
		}
		if (group === "pinned") {
			setActivePinnedNotes(
				notes
					.filter((n) => !n.is_favorite && n.is_pinned)
					.sort(
						(a, b) =>
							(a.sort_order || 0) - (b.sort_order || 0) ||
							new Date(a.created_at).getTime() -
								new Date(b.created_at).getTime(),
					),
			);
		}
		if (group === "normal") {
			setActiveNormalNotes(
				notes
					.filter((n) => !n.is_favorite && !n.is_pinned)
					.sort(
						(a, b) =>
							(a.sort_order || 0) - (b.sort_order || 0) ||
							new Date(a.created_at).getTime() -
								new Date(b.created_at).getTime(),
					),
			);
		}
	};

	const createDragOverHandler =
		(group: "favorites" | "pinned" | "normal") => (event: DragOverEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id) return;

			if (group === "favorites" && activeFavoriteNotes) {
				const oldIndex = activeFavoriteNotes.findIndex(
					(n) => n.id === active.id,
				);
				const newIndex = activeFavoriteNotes.findIndex((n) => n.id === over.id);
				if (oldIndex !== -1 && newIndex !== -1) {
					setActiveFavoriteNotes(
						arrayMove(activeFavoriteNotes, oldIndex, newIndex),
					);
				}
			}
			if (group === "pinned" && activePinnedNotes) {
				const oldIndex = activePinnedNotes.findIndex((n) => n.id === active.id);
				const newIndex = activePinnedNotes.findIndex((n) => n.id === over.id);
				if (oldIndex !== -1 && newIndex !== -1) {
					setActivePinnedNotes(
						arrayMove(activePinnedNotes, oldIndex, newIndex),
					);
				}
			}
			if (group === "normal" && activeNormalNotes) {
				const oldIndex = activeNormalNotes.findIndex((n) => n.id === active.id);
				const newIndex = activeNormalNotes.findIndex((n) => n.id === over.id);
				if (oldIndex !== -1 && newIndex !== -1) {
					setActiveNormalNotes(
						arrayMove(activeNormalNotes, oldIndex, newIndex),
					);
				}
			}
		};

	const handleDragCancel = () => {
		setActiveDragNote(null);
		setActiveFavoriteNotes(null);
		setActivePinnedNotes(null);
		setActiveNormalNotes(null);
	};

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	const favoriteNotes =
		activeFavoriteNotes ??
		notes
			.filter((n) => n.is_favorite)
			.sort(
				(a, b) =>
					(a.sort_order || 0) - (b.sort_order || 0) ||
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
			);

	const pinnedNotes =
		activePinnedNotes ??
		notes
			.filter((n) => !n.is_favorite && n.is_pinned)
			.sort(
				(a, b) =>
					(a.sort_order || 0) - (b.sort_order || 0) ||
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
			);

	const normalNotes =
		activeNormalNotes ??
		notes
			.filter((n) => !n.is_favorite && !n.is_pinned)
			.sort(
				(a, b) =>
					(a.sort_order || 0) - (b.sort_order || 0) ||
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
			);

	const handleRequestEdit = (id: string) => {
		if (editingNoteId && editingNoteId !== id && isEditDirty) {
			const confirmLeave = window.confirm(
				"You have unsaved changes in another note. Are you sure you want to discard them and edit this note?",
			);
			if (!confirmLeave) return;
		}
		setEditingNoteId(id);
		setIsEditDirty(false);
	};

	const createDragEndHandler =
		(group: "favorites" | "pinned" | "normal") =>
		async (event: DragEndEvent) => {
			const { active, over } = event;

			// 1. 判定対象とする「すでに移動済みの最新ローカル配列」を決定
			let finalList: Note[] | null = null;
			if (group === "favorites") finalList = activeFavoriteNotes;
			if (group === "pinned") finalList = activePinnedNotes;
			if (group === "normal") finalList = activeNormalNotes;

			// 2. Props由来の「ドラッグ開始前の初期配列」を取得するヘルパー
			const getInitialList = () => {
				return group === "favorites"
					? notes
							.filter((n) => n.is_favorite)
							.sort(
								(a, b) =>
									(a.sort_order || 0) - (b.sort_order || 0) ||
									new Date(a.created_at).getTime() -
										new Date(b.created_at).getTime(),
							)
					: group === "pinned"
						? notes
								.filter((n) => !n.is_favorite && n.is_pinned)
								.sort(
									(a, b) =>
										(a.sort_order || 0) - (b.sort_order || 0) ||
										new Date(a.created_at).getTime() -
											new Date(b.created_at).getTime(),
								)
						: notes
								.filter((n) => !n.is_favorite && !n.is_pinned)
								.sort(
									(a, b) =>
										(a.sort_order || 0) - (b.sort_order || 0) ||
										new Date(a.created_at).getTime() -
											new Date(b.created_at).getTime(),
								);
			};

			const initialList = getInitialList();
			if (!finalList) finalList = initialList;

			// 💡 overがない場合はキャンセルして即時終了
			if (!over) {
				handleDragCancel();
				return;
			}

			// 3. 初期配列内の位置と、入れ替え完了後のローカル配列内の「最終位置」をそれぞれ特定
			const initialIndex = initialList.findIndex((n) => n.id === active.id);
			const finalIndex = finalList.findIndex((n) => n.id === active.id);

			if (initialIndex === -1 || finalIndex === -1) {
				handleDragCancel();
				return;
			}

			// 💡 【大修正：真犯人の駆除】
			// active.id === over.id で判定すると、リアルタイムスライドによりoverが常に自分自身になってしまい、保存処理が蒸発する。
			// そのため、「初期のインデックスと最終的なインデックスが同じかどうか」で真の移動有無を判定する！
			if (initialIndex === finalIndex) {
				handleDragCancel();
				return;
			}

			let newOrder: number;
			const OFFSET = 0.0001;
			const EPSILON = 1e-9;

			// 4. 新しい絶対位置から Fractional Indexing を超精密に計算
			if (finalIndex === 0) {
				const nextOrder = finalList[1]?.sort_order ?? 0;
				newOrder = nextOrder - 1.0;
			} else if (finalIndex === finalList.length - 1) {
				const prevOrder = finalList[finalIndex - 1]?.sort_order ?? 0;
				newOrder = prevOrder + 1.0;
			} else {
				const prevOrder = finalList[finalIndex - 1]?.sort_order ?? 0;
				const nextOrder = finalList[finalIndex + 1]?.sort_order ?? 0;

				if (Math.abs(prevOrder - nextOrder) < EPSILON) {
					// 同値衝突時の防壁ロジック（initialIndex と finalIndex の高低差から移動方向を正確に判定）
					if (initialIndex > finalIndex) {
						// 下から上へ引き揚げた時 ➔ 追い越した直後の要素のさらに上（小さな値へ）
						newOrder = nextOrder - OFFSET;
					} else {
						// 上から下へ引きずり下ろした時 ➔ 追い越した直前の要素のさらに下（大きな値へ）
						newOrder = prevOrder + OFFSET;
					}
				} else {
					newOrder = (prevOrder + nextOrder) / 2.0;
				}
			}

			setIsSorting(true);
			try {
				// バックエンドへの単一更新を貫通させる
				await onUpdateNoteOrder(active.id as string, newOrder);
			} catch (error) {
				console.error("Failed to update note order:", error);
			} finally {
				setIsSorting(false);
				// 後処理とローカルStateのリセットを一元実行
				handleDragCancel();
			}
		};

	const handleDragEndFavorites = createDragEndHandler("favorites");
	const handleDragEndPinned = createDragEndHandler("pinned");
	const handleDragEndNormal = createDragEndHandler("normal");

	if (loading && notes.length === 0) {
		return (
			<div className="space-y-3">
				{["skel-1", "skel-2", "skel-3"].map((key) => (
					<NoteSkeleton key={key} />
				))}
			</div>
		);
	}

	if (
		favoriteNotes.length === 0 &&
		pinnedNotes.length === 0 &&
		normalNotes.length === 0
	) {
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
		return (
			<NoteItem
				key={note.id}
				note={note}
				currentFullUrl={currentFullUrl}
				isFavoriteList={isFavorite}
				isEditing={note.id === editingNoteId}
				onRequestEdit={handleRequestEdit}
				onSetIsEditDirty={setIsEditDirty}
				onUpdate={onUpdate}
				onDelete={onDelete}
				onToggleResolved={onToggleResolved}
				onToggleFavorite={onToggleFavorite}
				onTogglePinned={onTogglePinned}
				onToggleExpansion={onToggleExpansion}
			/>
		);
	};

	return (
		<div className="space-y-4 relative">
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
						<DndContext
							sensors={sensors}
							onDragStart={(e) => handleDragStart(e, "favorites")}
							onDragOver={createDragOverHandler("favorites")}
							onDragEnd={handleDragEndFavorites}
							onDragCancel={handleDragCancel}
						>
							<SortableContext
								items={favoriteNotes.map((n) => n.id)}
								strategy={verticalListSortingStrategy}
							>
								<div className="space-y-3">
									{favoriteNotes.map((note) => renderItem(note, true))}
								</div>
							</SortableContext>
							<DragOverlay dropAnimation={null}>
								{activeDragNote ? (
									<div className="shadow-2xl scale-[1.02] rotate-1 transition-transform pointer-events-none border border-action/30 rounded-xl bg-base-bg">
										<NoteItem
											note={activeDragNote}
											currentFullUrl={currentFullUrl}
											isFavoriteList={activeDragNote.is_favorite}
											isEditing={false}
											onRequestEdit={() => {}}
											onSetIsEditDirty={() => {}}
											onUpdate={async () => false}
											onDelete={async () => false}
											onToggleResolved={async () => false}
											onToggleFavorite={async () => false}
											onTogglePinned={async () => false}
											onToggleExpansion={async () => false}
											isPreview={true}
										/>
									</div>
								) : null}
							</DragOverlay>
						</DndContext>
					)}
					{(pinnedNotes.length > 0 || normalNotes.length > 0) && (
						<hr className="border-base-border" />
					)}
				</div>
			)}

			{pinnedNotes.length > 0 && (
				<div className="space-y-3">
					{favoriteNotes.length > 0 && (
						<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
							<span>Current Page</span>
						</div>
					)}
					<DndContext
						sensors={sensors}
						onDragStart={(e) => handleDragStart(e, "pinned")}
						onDragOver={createDragOverHandler("pinned")}
						onDragEnd={handleDragEndPinned}
						onDragCancel={handleDragCancel}
					>
						<SortableContext
							items={pinnedNotes.map((n) => n.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-3">
								{pinnedNotes.map((note) => renderItem(note, false))}
							</div>
						</SortableContext>
						<DragOverlay dropAnimation={null}>
							{activeDragNote ? (
								<div className="shadow-2xl scale-[1.02] rotate-1 transition-transform pointer-events-none border border-action/30 rounded-xl bg-base-bg">
									<NoteItem
										note={activeDragNote}
										currentFullUrl={currentFullUrl}
										isFavoriteList={activeDragNote.is_favorite}
										isEditing={false}
										onRequestEdit={() => {}}
										onSetIsEditDirty={() => {}}
										onUpdate={async () => false}
										onDelete={async () => false}
										onToggleResolved={async () => false}
										onToggleFavorite={async () => false}
										onTogglePinned={async () => false}
										onToggleExpansion={async () => false}
										isPreview={true}
									/>
								</div>
							) : null}
						</DragOverlay>
					</DndContext>
				</div>
			)}

			{normalNotes.length > 0 && (
				<div className="space-y-3">
					{favoriteNotes.length > 0 && pinnedNotes.length === 0 && (
						<div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
							<span>Current Page</span>
						</div>
					)}
					<DndContext
						sensors={sensors}
						onDragStart={(e) => handleDragStart(e, "normal")}
						onDragOver={createDragOverHandler("normal")}
						onDragEnd={handleDragEndNormal}
						onDragCancel={handleDragCancel}
					>
						<SortableContext
							items={normalNotes.map((n) => n.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="space-y-3">
								{normalNotes.map((note) => renderItem(note, false))}
							</div>
						</SortableContext>
						<DragOverlay dropAnimation={null}>
							{activeDragNote ? (
								<div className="shadow-2xl scale-[1.02] rotate-1 transition-transform pointer-events-none border border-action/30 rounded-xl bg-base-bg">
									<NoteItem
										note={activeDragNote}
										currentFullUrl={currentFullUrl}
										isFavoriteList={activeDragNote.is_favorite}
										isEditing={false}
										onRequestEdit={() => {}}
										onSetIsEditDirty={() => {}}
										onUpdate={async () => false}
										onDelete={async () => false}
										onToggleResolved={async () => false}
										onToggleFavorite={async () => false}
										onTogglePinned={async () => false}
										onToggleExpansion={async () => false}
										isPreview={true}
									/>
								</div>
							) : null}
						</DragOverlay>
					</DndContext>
				</div>
			)}
		</div>
	);
}
