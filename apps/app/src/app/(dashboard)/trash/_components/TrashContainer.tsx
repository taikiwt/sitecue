"use client";

import { type Draft, type Note, SHARED_LIMITS } from "@sitecue/shared";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { NoteStatusBadge } from "@/components/ui/note-status-badge";
import { SWRBoundary } from "@/components/ui/swr-boundary";
import {
	useEmptyTrashDrafts,
	useFetchTrashDrafts,
	usePermanentlyDeleteDraft,
	useRestoreDraft,
} from "@/hooks/useDraftsQuery";
import {
	useEmptyTrashNotes,
	useFetchTrashNotes,
	usePermanentlyDeleteNote,
	useRestoreNote,
} from "@/hooks/useNotesQuery";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useUserStore } from "@/store/useUserStore";
import { TrashListSkeleton } from "./TrashSkeletons";

type TrashFilter = "all" | "notes" | "drafts";

type TrashItem =
	| {
			kind: "note";
			id: string;
			deleted_at: string | null;
			data: Note;
	  }
	| {
			kind: "draft";
			id: string;
			deleted_at: string | null;
			data: Draft;
	  };

function getRemainingDays(
	deletedAt: string | null,
	retentionDays: number,
): number {
	if (!deletedAt) return retentionDays;
	const deletedMs = new Date(deletedAt).getTime();
	const expiresMs = deletedMs + retentionDays * 24 * 60 * 60 * 1000;
	const diffDays = Math.ceil((expiresMs - Date.now()) / (24 * 60 * 60 * 1000));
	return Math.max(0, diffDays);
}

function getScopeDisplayLabel(scope: string): string {
	if (scope === "exact") return "Page";
	if (scope === "domain") return "Domain";
	if (scope === "draft") return "Draft";
	return "Inbox";
}

function extractErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message.toLowerCase();
	if (typeof err === "object" && err !== null && "message" in err) {
		return String((err as { message: unknown }).message).toLowerCase();
	}
	return String(err).toLowerCase();
}

export function TrashContainer() {
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const { plan, openPaywall } = useUserStore();
	const retentionDays =
		plan === "pro"
			? SHARED_LIMITS.TRASH_RETENTION_DAYS.PRO
			: SHARED_LIMITS.TRASH_RETENTION_DAYS.FREE;

	const { data: trashNotes, isLoading: isNotesLoading } =
		useFetchTrashNotes(retentionDays);
	const { data: trashDrafts, isLoading: isDraftsLoading } =
		useFetchTrashDrafts(retentionDays);

	const restoreNoteMutation = useRestoreNote();
	const permanentlyDeleteNoteMutation = usePermanentlyDeleteNote();
	const emptyTrashNotesMutation = useEmptyTrashNotes();

	const restoreDraftMutation = useRestoreDraft();
	const permanentlyDeleteDraftMutation = usePermanentlyDeleteDraft();
	const emptyTrashDraftsMutation = useEmptyTrashDrafts();

	const [filter, setFilter] = useState<TrashFilter>("all");
	const [deleteTarget, setDeleteTarget] = useState<{
		kind: "note" | "draft";
		id: string;
	} | null>(null);
	const [isEmptyDialogOpen, setIsEmptyDialogOpen] = useState(false);

	const isLoading = isNotesLoading || isDraftsLoading;

	const combinedItems = useMemo<TrashItem[] | undefined>(() => {
		if (!trashNotes && !trashDrafts) return undefined;
		const items: TrashItem[] = [
			...(trashNotes ?? []).map((note) => ({
				kind: "note" as const,
				id: note.id,
				deleted_at: note.deleted_at,
				data: note,
			})),
			...(trashDrafts ?? []).map((draft) => ({
				kind: "draft" as const,
				id: draft.id,
				deleted_at: draft.deleted_at,
				data: draft,
			})),
		];
		items.sort((a, b) => {
			const timeA = a.deleted_at ? new Date(a.deleted_at).getTime() : 0;
			const timeB = b.deleted_at ? new Date(b.deleted_at).getTime() : 0;
			return timeB - timeA;
		});
		return items;
	}, [trashNotes, trashDrafts]);

	const handleRestore = async (item: TrashItem) => {
		try {
			if (item.kind === "note") {
				await restoreNoteMutation.mutateAsync(item.id);
				toast.success("Note restored");
			} else {
				await restoreDraftMutation.mutateAsync(item.id);
				toast.success("Draft restored");
			}
		} catch (err: unknown) {
			const errorMessage = extractErrorMessage(err);
			if (errorMessage.includes("limit reached")) {
				openPaywall(item.kind === "draft" ? "drafts" : "notes");
			} else {
				toast.error(
					item.kind === "draft"
						? "Failed to restore draft."
						: "Failed to restore note.",
				);
			}
		}
	};

	const handleConfirmPermanentDelete = async () => {
		if (!deleteTarget) return;
		try {
			if (deleteTarget.kind === "note") {
				await permanentlyDeleteNoteMutation.mutateAsync(deleteTarget.id);
			} else {
				await permanentlyDeleteDraftMutation.mutateAsync(deleteTarget.id);
			}
			setDeleteTarget(null);
			toast.success("Permanently deleted");
		} catch (err) {
			console.error("Failed to permanently delete item:", err);
			toast.error("Failed to permanently delete item.");
		}
	};

	const handleConfirmEmptyTrash = async () => {
		try {
			await Promise.all([
				emptyTrashNotesMutation.mutateAsync(),
				emptyTrashDraftsMutation.mutateAsync(),
			]);
			setIsEmptyDialogOpen(false);
			toast.success("Trash emptied");
		} catch (err) {
			console.error("Failed to empty trash:", err);
			toast.error("Failed to empty trash.");
		}
	};

	const isRestoring =
		restoreNoteMutation.isPending || restoreDraftMutation.isPending;
	const isPermanentDeleting =
		permanentlyDeleteNoteMutation.isPending ||
		permanentlyDeleteDraftMutation.isPending;
	const isEmptying =
		emptyTrashNotesMutation.isPending || emptyTrashDraftsMutation.isPending;

	const hasItems = (combinedItems?.length ?? 0) > 0;

	const filterOptions: Array<{ value: TrashFilter; label: string }> = [
		{ value: "all", label: "All" },
		{ value: "notes", label: "Notes" },
		{ value: "drafts", label: "Drafts" },
	];

	return (
		<div className="flex flex-col h-screen overflow-hidden bg-base-bg text-action">
			{/* 0ms UI Shell Header */}
			<header
				className={cn(
					"shrink-0 border-b border-base-border bg-base-bg px-4 py-4 md:px-8 transition-all duration-300",
					!isSidebarOpen && "md:pl-16",
				)}
			>
				<div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<Link
							href="/"
							className="inline-flex items-center justify-center size-8 rounded-full hover-safe:bg-muted hover-safe:text-action transition-colors shrink-0"
							aria-label="Go back to Launchpad"
						>
							<ArrowLeft className="size-4 text-action" aria-hidden="true" />
						</Link>
						<div className="min-w-0">
							<h1 className="font-bold text-lg text-action leading-tight">
								Trash
							</h1>
							<p className="text-xs text-neutral-400">
								Free: 7 days / Pro: 30 days
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<fieldset
							className="flex items-center gap-1 border-0 p-0 m-0"
							aria-label="Filter trash items"
						>
							{filterOptions.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => setFilter(option.value)}
									aria-pressed={filter === option.value}
									className={cn(
										"px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
										filter === option.value
											? "bg-action text-action-text"
											: "bg-base-surface text-neutral-600 border border-base-border hover-safe:bg-muted hover-safe:text-action",
									)}
								>
									{option.label}
								</button>
							))}
						</fieldset>

						{hasItems && (
							<Button
								type="button"
								variant="destructive"
								size="sm"
								radius="full"
								onClick={() => setIsEmptyDialogOpen(true)}
								disabled={isEmptying}
								className="shrink-0"
							>
								<Trash2 className="size-3.5" aria-hidden="true" />
								Empty Trash
							</Button>
						)}
					</div>
				</div>
			</header>

			{/* Data Slot with Local Suspense + SWRBoundary */}
			<main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-24 md:pb-8">
				<div className="mx-auto max-w-4xl">
					<Suspense fallback={<TrashListSkeleton />}>
						<SWRBoundary
							data={combinedItems}
							isLoading={isLoading}
							fallback={<TrashListSkeleton />}
						>
							{(items) => {
								const filteredItems = items.filter((item) => {
									if (filter === "notes") return item.kind === "note";
									if (filter === "drafts") return item.kind === "draft";
									return true;
								});

								if (filteredItems.length === 0) {
									return (
										<div className="flex flex-col items-center justify-center py-20 text-center px-4">
											<div className="size-12 rounded-full bg-base-surface border border-base-border flex items-center justify-center mb-4">
												<Trash2
													className="size-5 text-neutral-400"
													aria-hidden="true"
												/>
											</div>
											<p className="text-base font-medium text-action mb-1">
												Trash is empty
											</p>
											<p className="text-xs text-neutral-400">
												Items in Trash are automatically deleted after{" "}
												{retentionDays} days.
											</p>
										</div>
									);
								}

								return (
									<div className="space-y-3">
										{filteredItems.map((item) => {
											const diffDays = getRemainingDays(
												item.deleted_at,
												retentionDays,
											);
											const expiryLabel =
												diffDays === 0
													? "Expires today"
													: `Expires in ${diffDays} ${diffDays === 1 ? "day" : "days"}`;

											return (
												<article
													key={`${item.kind}-${item.id}`}
													className="rounded-2xl border border-base-border bg-base-surface p-4 space-y-3 transition-colors"
												>
													<div className="flex flex-wrap items-center justify-between gap-2">
														<div className="flex flex-wrap items-center gap-2 min-w-0">
															{item.kind === "note" ? (
																<>
																	<NoteStatusBadge
																		type={item.data.note_type}
																		isResolved={item.data.is_resolved}
																	/>
																	<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-base-bg border border-base-border text-neutral-600 shrink-0">
																		{getScopeDisplayLabel(item.data.scope)}
																	</span>
																	{item.data.scope !== "inbox" &&
																		item.data.url_pattern && (
																			<span className="text-xs text-neutral-400 truncate max-w-[220px] sm:max-w-xs">
																				{item.data.url_pattern}
																			</span>
																		)}
																</>
															) : (
																<span className="bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase shrink-0">
																	DRAFT
																</span>
															)}
														</div>
														<span className="text-xs font-medium text-neutral-400 shrink-0">
															{expiryLabel}
														</span>
													</div>

													{item.kind === "note" ? (
														<p className="text-sm text-action/90 whitespace-pre-wrap break-words line-clamp-3">
															{item.data.content || "(Empty note)"}
														</p>
													) : (
														<div className="space-y-1">
															<p className="text-sm font-bold text-action truncate">
																{item.data.title || "Untitled Draft"}
															</p>
															<p className="text-sm text-action/80 whitespace-pre-wrap break-words line-clamp-2">
																{item.data.content || "(Empty draft)"}
															</p>
														</div>
													)}

													<div className="flex flex-wrap items-center justify-end gap-2 pt-1">
														<Button
															type="button"
															variant="outline"
															size="sm"
															radius="full"
															onClick={() => handleRestore(item)}
															disabled={isRestoring}
														>
															<RotateCcw
																className="size-3.5"
																aria-hidden="true"
															/>
															Restore
														</Button>
														<Button
															type="button"
															variant="destructive"
															size="sm"
															radius="full"
															onClick={() =>
																setDeleteTarget({
																	kind: item.kind,
																	id: item.id,
																})
															}
															disabled={isPermanentDeleting}
														>
															<Trash2 className="size-3.5" aria-hidden="true" />
															Delete Forever
														</Button>
													</div>
												</article>
											);
										})}
									</div>
								);
							}}
						</SWRBoundary>
					</Suspense>
				</div>
			</main>

			{/* Single Permanent Delete Confirmation */}
			<AlertDialog
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete permanently?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteTarget?.kind === "draft"
								? "This action cannot be undone. This draft will be permanently deleted from our servers."
								: "This action cannot be undone. This note will be permanently deleted from our servers."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPermanentDeleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleConfirmPermanentDelete();
							}}
							disabled={isPermanentDeleting}
							className="bg-note-alert hover:bg-note-alert/80 text-white"
						>
							{isPermanentDeleting ? "Deleting..." : "Delete Forever"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Empty Trash Confirmation */}
			<AlertDialog open={isEmptyDialogOpen} onOpenChange={setIsEmptyDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Empty Trash?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. All items in Trash will be
							permanently deleted from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isEmptying}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleConfirmEmptyTrash();
							}}
							disabled={isEmptying}
							className="bg-note-alert hover:bg-note-alert/80 text-white"
						>
							{isEmptying ? "Emptying..." : "Empty Trash"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
