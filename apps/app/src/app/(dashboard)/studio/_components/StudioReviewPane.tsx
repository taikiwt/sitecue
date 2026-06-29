"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Note } from "@sitecue/shared";
import { Loader2, Sparkles } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NoteEditor from "../../_components/NoteEditor";
import NoteCard from "./NoteCard";

type NoteType = "info" | "alert" | "idea";

interface StudioReviewPaneProps {
	reviewNotes: Note[];
	isLoadingReview: boolean;
	onAddNote: (content: string, type: NoteType) => Promise<void>;
	onUpdateNote: (id: string, content: string) => void;
	onDeleteNote: (id: string) => void;
	onDeleteAllNotes: () => void;
	onReorderNotes: (newOrder: Note[]) => void;
	onInsertToEditor: (content: string) => void;
	onWeave: () => void;
	isWeaving: boolean;
	onGenerateReview: () => Promise<void>;
	isGeneratingReview: boolean;
}

export default function StudioReviewPane({
	reviewNotes,
	isLoadingReview,
	onAddNote,
	onUpdateNote,
	onDeleteNote,
	onDeleteAllNotes,
	onReorderNotes,
	onInsertToEditor,
	onWeave,
	isWeaving,
	onGenerateReview,
	isGeneratingReview,
}: StudioReviewPaneProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = reviewNotes.findIndex((item) => item.id === active.id);
		const newIndex = reviewNotes.findIndex((item) => item.id === over.id);

		const updatedNotes = arrayMove(reviewNotes, oldIndex, newIndex);
		onReorderNotes(updatedNotes);
	};

	return (
		<div className="relative flex h-full flex-col bg-neutral-50/30">
			<div className="flex-1 overflow-y-auto">
				{/* Note Form */}
				<div className="sticky top-0 z-20 p-4 border-b border-neutral-200 bg-white/80 backdrop-blur-md">
					<div className="flex justify-between items-center mb-3">
						<span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Add Notes
						</span>
						<Button
							type="button"
							/* variant="ghost" を明示して大元のソリッドな背景定義をパージ */
							variant="ghost"
							size="sm"
							onClick={onGenerateReview}
							disabled={isGeneratingReview}
							className={cn(
								"h-7 text-xs font-bold uppercase gap-1.5 rounded-full border-transparent shadow-none cursor-pointer transition-all duration-100 select-none text-action",
								/* 通常時の10%の淡い輝き */
								"bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10",
								/* 大元のグレーホバーを完全に上書きし、20%の滑らかな不透明度とスケールで極上の手触りを実現 */
								"hover-safe:bg-gradient-to-r hover-safe:from-purple-500/20 hover-safe:to-pink-500/20 hover-safe:scale-[1.01]",
								"active:scale-95",
							)}
						>
							{isGeneratingReview ? (
								<Loader2 className="w-3 h-3 animate-spin" />
							) : (
								<Sparkles className="w-3 h-3" />
							)}
							AI Review
						</Button>
					</div>
					<NoteEditor onSubmit={onAddNote} />
				</div>

				{/* Note List */}
				<div className="p-4">
					<div className="flex justify-between items-center mb-3">
						<span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
							Review Notes ({reviewNotes.length})
						</span>
						{reviewNotes.length > 0 && (
							<AlertDialog>
								<AlertDialogTrigger
									render={
										<Button
											variant="ghost"
											size="sm"
											className="text-note-alert hover:bg-note-alert/10 hover:text-note-alert h-6 px-2 text-xs font-bold uppercase"
										>
											Delete All
										</Button>
									}
								/>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete all notes?</AlertDialogTitle>
										<AlertDialogDescription>
											This will remove all comments from this draft. You must
											click "Save" to apply these changes to the server.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={onDeleteAllNotes}
											className="bg-note-alert hover:bg-note-alert/90 text-white font-bold"
										>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>

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
							<DndContext
								id="studio-review-dnd"
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleDragEnd}
							>
								<SortableContext
									items={reviewNotes.map((n) => n.id)}
									strategy={verticalListSortingStrategy}
								>
									<div className="grid gap-3">
										{reviewNotes.map((note) => (
											<SortableNoteCard
												key={note.id}
												note={note}
												onUpdate={onUpdateNote}
												onDelete={onDeleteNote}
												onInsert={onInsertToEditor}
											/>
										))}
									</div>
								</SortableContext>
							</DndContext>
						)}
					</div>
				</div>
			</div>

			{/* Weave Action Bar */}
			<div className="shrink-0 p-4 border-t border-neutral-200/50 bg-white/80 backdrop-blur-md pb-safe">
				<div className="p-1 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-neutral-200/50">
					<Button
						type="button"
						onClick={onWeave}
						disabled={isWeaving}
						className={cn(
							"relative w-full flex items-center justify-center p-3 rounded-full font-bold cursor-pointer transition-all duration-300 active:scale-[0.98]",
							isWeaving
								? "bg-neutral-50 text-neutral-400 cursor-not-allowed"
								: "bg-action shadow-md hover-safe:opacity-90 hover-safe:scale-[1.005]",
						)}
					>
						<div className="flex items-center gap-3 pl-1 select-none">
							{isWeaving ? (
								<Loader2
									className="h-5 w-5 animate-spin text-neutral-400"
									aria-hidden="true"
								/>
							) : (
								/* text-transparentの伝播によるアイコン消失を防ぐため、輝きに馴染むソリッドな有彩色を指定 */
								<Sparkles
									className="h-5 w-5 text-indigo-200 shrink-0"
									aria-hidden="true"
								/>
							)}
							<span
								className={cn(
									"text-sm tracking-tight font-black transition-all",
									isWeaving
										? "text-neutral-400"
										: "bg-gradient-to-r from-purple-200 via-indigo-200 to-blue-200 bg-clip-text text-transparent",
								)}
							>
								{isWeaving ? "WEAVING..." : "WEAVE WITH AI"}
							</span>
						</div>
					</Button>
				</div>
			</div>
		</div>
	);
}

function SortableNoteCard({
	note,
	onUpdate,
	onDelete,
	onInsert,
}: {
	note: Note;
	onUpdate: (id: string, content: string) => void;
	onDelete: (id: string) => void;
	onInsert: (content: string) => void;
}) {
	const {
		setNodeRef,
		transform,
		transition,
		isDragging,
		attributes,
		listeners,
	} = useSortable({
		id: note.id,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		zIndex: isDragging ? 50 : undefined,
		position: "relative" as const,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<NoteCard
				note={note}
				onUpdate={onUpdate}
				onDelete={onDelete}
				onInsert={onInsert}
			/>
		</div>
	);
}
