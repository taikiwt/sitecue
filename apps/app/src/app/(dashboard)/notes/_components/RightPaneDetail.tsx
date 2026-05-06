"use client";

import {
	Clipboard,
	ClipboardCopy,
	MoreHorizontal,
	MousePointerClick,
	Pencil,
	Pin,
	PinOff,
	Star,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { NotesEditor } from "@/components/editor/NotesEditor";
import MarkdownRenderer from "@/components/MarkdownRenderer";
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
import { AnimatedIconButton } from "@/components/ui/animated-icon-button";
import { Button } from "@/components/ui/button";

import { HoverRevealButton } from "@/components/ui/hover-reveal-button";
import { HoverSwapButton } from "@/components/ui/hover-swap-button";
import { InlineCopyButton } from "@/components/ui/inline-copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoteStatusBadge } from "@/components/ui/note-status-badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	useCreateNote,
	useDeleteNote,
	useUpdateNote,
} from "@/hooks/useNotesQuery";
import { cn } from "@/lib/utils";

import { useUserStore } from "@/store/useUserStore";
import { extractTags } from "@/utils/tags";
import { normalizeUrlForGrouping } from "@/utils/url";
import type { Draft, Note } from "../types";

type Props = {
	note?: Note;
	draft?: Draft;
	isNewNote?: boolean;
};

export function RightPaneDetail({ note, draft, isNewNote }: Props) {
	const createNoteMutation = useCreateNote();
	const updateNoteMutation = useUpdateNote();
	const deleteNoteMutation = useDeleteNote();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const [_isCopying, setIsCopying] = useState(false);
	const [optimisticContent, setOptimisticContent] = useState<string | null>(
		null,
	);
	const [optimisticResolved, setOptimisticResolved] = useState<boolean | null>(
		null,
	);
	const [optimisticNoteType, setOptimisticNoteType] = useState<string | null>(
		null,
	);
	const [optimisticScope, setOptimisticScope] = useState<string | null>(null);
	const [optimisticPinned, setOptimisticPinned] = useState<boolean | null>(
		null,
	);
	const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(
		null,
	);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
	const [editUrl, setEditUrl] = useState(note?.url_pattern || "");
	const [editScope, setEditScope] = useState<Note["scope"]>(
		note?.scope || "inbox",
	);
	const [editNoteType, setEditNoteType] = useState<Note["note_type"]>(
		note?.note_type || "info",
	);
	const openPaywall = useUserStore((state) => state.openPaywall);

	// Sync edit states when note changes
	useEffect(() => {
		if (note) {
			setEditUrl(note.url_pattern || "");
			setEditScope(note.scope || "inbox");
			setEditNoteType(note.note_type || "info");
		}
	}, [note]);

	// Initialize state for new notes
	useEffect(() => {
		if (isNewNote) {
			setIsEditing(true);
			setEditContent("");

			let currentExact = searchParams.get("exact");
			let currentDomain = searchParams.get("domain");

			if (currentExact === "all") currentExact = null;
			if (currentDomain === "all") currentDomain = "inbox";

			if (currentExact) {
				setEditUrl(currentExact);
				setEditScope("exact");
			} else if (currentDomain && currentDomain !== "inbox") {
				setEditUrl(currentDomain);
				setEditScope("domain");
			} else {
				setEditUrl("");
				setEditScope("inbox");
			}
		}
	}, [isNewNote, searchParams]);

	// Reset state when note or draft changes
	useEffect(() => {
		setIsEditing(false);
		setOptimisticContent(null);
		setOptimisticResolved(null);
		setOptimisticNoteType(null);
		setOptimisticScope(null);
		setOptimisticPinned(null);
		setOptimisticFavorite(null);
		setEditContent(note?.content || "");
		if (isNewNote) {
			setIsEditing(true);
			setEditContent("");
		}
	}, [note?.content, isNewNote]);

	if (!note && !draft && !isNewNote) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center bg-base-bg text-gray-400 p-8">
				<MousePointerClick
					className="w-12 h-12 text-base-border mb-6 animate-pulse"
					aria-hidden="true"
				/>
				<p className="text-lg font-medium">
					Please select a note or draft from the list
				</p>
			</div>
		);
	}

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const content =
		optimisticContent !== null
			? optimisticContent
			: note
				? (note.content ?? "")
				: draft?.content || "";
	const createdAt = note ? note.created_at : draft?.created_at || "";
	const updatedAt = note ? note.updated_at : draft?.updated_at || "";
	const _id = note ? note.id : draft?.id || "";

	const currentResolved =
		optimisticResolved !== null
			? optimisticResolved
			: note?.is_resolved || false;
	const currentNoteType =
		optimisticNoteType !== null
			? optimisticNoteType
			: note?.note_type || "info";
	const _currentScope =
		optimisticScope !== null ? optimisticScope : note?.scope || "inbox";
	const currentPinned =
		optimisticPinned !== null ? optimisticPinned : note?.is_pinned || false;
	const currentFavorite =
		optimisticFavorite !== null
			? optimisticFavorite
			: note?.is_favorite || false;

	const handleEdit = () => {
		setEditContent(note?.content || "");
		setIsEditing(true);
	};

	const handleCancel = () => {
		if (isNewNote) {
			const params = new URLSearchParams(searchParams.toString());
			params.delete("new");
			router.replace(`/notes?${params.toString()}`);
		} else {
			setIsEditing(false);
			setEditContent(note?.content || "");
		}
	};

	const handleSave = async () => {
		if (!note && !isNewNote) return;

		setIsSaving(true);
		const newContent = editContent.trim();

		// Optimistic update
		if (note) {
			setOptimisticContent(newContent);
		}
		setIsEditing(false);

		try {
			if (isNewNote) {
				const exactParam = searchParams.get("exact");
				const domainParam = searchParams.get("domain");

				let targetScope: Note["scope"] = "inbox";
				let targetUrlPattern = "";

				// 🚨 exactParam が "all" の場合は弾き、domain へフォールバックさせる
				if (exactParam && exactParam !== "all") {
					targetScope = "exact";
					targetUrlPattern = exactParam;
				} else if (domainParam && domainParam !== "inbox") {
					targetScope = "domain";
					targetUrlPattern = domainParam;
				}

				const extractedTags = extractTags(newContent);

				const data = await createNoteMutation.mutateAsync({
					content: newContent,
					scope: targetScope,
					url_pattern: targetUrlPattern,
					note_type: editNoteType,
					tags: extractedTags,
				});

				setOptimisticContent(newContent);
				const params = new URLSearchParams(searchParams.toString());
				params.delete("new");
				params.set("noteId", data.id);
				router.replace(`/notes?${params.toString()}`);
			} else if (note) {
				let finalUrl = editUrl.trim();
				if (editScope === "inbox") {
					finalUrl = "";
				} else if (finalUrl) {
					// 共通ユーティリティで https:// や www. 等を除去
					const normalizedFullUrl = normalizeUrlForGrouping(finalUrl);

					if (editScope === "domain") {
						finalUrl = normalizedFullUrl.split("/")[0];
					} else if (editScope === "exact") {
						finalUrl = normalizedFullUrl;
					}
				}

				const extractedTags = extractTags(newContent);
				await updateNoteMutation.mutateAsync({
					id: note.id,
					updates: {
						content: newContent,
						tags: extractedTags,
						url_pattern: finalUrl,
						scope: editScope,
						note_type: editNoteType,
					},
				});
				setOptimisticNoteType(editNoteType);
				setOptimisticScope(editScope);
			}
		} catch (err: unknown) {
			console.error("Failed to save note:", err);
			const errorMessage =
				err instanceof Error
					? err.message.toLowerCase()
					: typeof err === "object" && err !== null && "message" in err
						? String((err as { message: unknown }).message).toLowerCase()
						: String(err).toLowerCase();

			if (errorMessage.includes("limit reached")) {
				openPaywall(errorMessage.includes("draft") ? "drafts" : "notes");
			} else {
				toast.error("Failed to save the note.");
			}
			setOptimisticContent(null);
			setIsEditing(true);
		} finally {
			setIsSaving(false);
		}
	};

	const handleUpdateProperty = async (updates: Partial<Note>) => {
		if (!note) return;

		// Set optimistic states
		if (updates.is_resolved !== undefined)
			setOptimisticResolved(updates.is_resolved);
		if (updates.note_type !== undefined)
			setOptimisticNoteType(updates.note_type);
		if (updates.scope !== undefined) setOptimisticScope(updates.scope);
		if (updates.is_pinned !== undefined) setOptimisticPinned(updates.is_pinned);
		if (updates.is_favorite !== undefined)
			setOptimisticFavorite(updates.is_favorite);

		try {
			await updateNoteMutation.mutateAsync({
				id: note.id,
				updates,
			});
		} catch (err) {
			console.error("Failed to update note property:", err);
			// Reset optimistic state on error
			if ("is_resolved" in updates) setOptimisticResolved(null);
			if ("note_type" in updates) setOptimisticNoteType(null);
			if ("scope" in updates) setOptimisticScope(null);
			if ("is_pinned" in updates) setOptimisticPinned(null);
			if ("is_favorite" in updates) setOptimisticFavorite(null);
		}
	};

	const handleDeleteNote = async () => {
		if (!note) return;
		setIsSaving(true);
		try {
			await deleteNoteMutation.mutateAsync(note.id);
			setIsDeleteDialogOpen(false);

			const params = new URLSearchParams(searchParams.toString());
			params.delete("noteId");
			router.replace(`/notes?${params.toString()}`);
		} catch (err) {
			console.error("Failed to delete note:", err);
			toast.error("Failed to delete the note.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCopyAll = () => {
		if (!content) return;
		navigator.clipboard.writeText(content);
		setIsCopying(true);
		setTimeout(() => setIsCopying(false), 2000);
	};

	return (
		<div className="flex-1 flex flex-col h-full bg-base-bg overflow-hidden">
			{/* 1. Header (Fixed) */}
			<div className="shrink-0 z-10 bg-base-bg pt-6 md:pt-8 px-4 md:px-8">
				<div className="max-w-3xl mx-auto w-full flex items-center justify-between pb-4 border-b border-base-border">
					{/* Left: Badge and Date */}
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2 group/meta">
							{note ? (
								<NoteStatusBadge
									type={currentNoteType}
									isResolved={currentResolved}
									onClick={() =>
										handleUpdateProperty({ is_resolved: !currentResolved })
									}
								/>
							) : (
								<span className="relative z-10 bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
									{isNewNote ? "NEW" : "DRAFT"}
								</span>
							)}

							<span className="hidden md:inline text-sm text-gray-400">
								{formatDate(createdAt)}
							</span>
						</div>
					</div>

					{/* Right: Action Buttons */}
					<div className="flex items-center gap-2">
						{note && !isEditing && (
							<>
								<HoverRevealButton
									type="button"
									onClick={handleEdit}
									icon={<Pencil className="size-4" aria-hidden="true" />}
									text="Edit"
									className="cursor-pointer shadow-sm ml-1 bg-action hover-safe:bg-action! text-action-text hover-safe:text-action-text!"
								/>
								<HoverSwapButton
									type="button"
									onClick={handleCopyAll}
									defaultIcon={
										<Clipboard
											className="size-5 md:size-4"
											aria-hidden="true"
										/>
									}
									hoverIcon={
										<ClipboardCopy
											className="size-5 md:size-4"
											aria-hidden="true"
										/>
									}
									className={cn(
										"text-neutral-400 hover:text-neutral-900 cursor-pointer",
									)}
									title="Copy all content"
								/>

								<Popover open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
									<PopoverTrigger
										render={
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
												aria-label="More options"
											>
												<MoreHorizontal
													className="size-5 md:size-4"
													aria-hidden="true"
												/>
											</Button>
										}
									/>
									<PopoverContent className="w-48 p-2" align="end">
										<div className="space-y-3">
											<div className="pt-2 border-t border-neutral-100">
												<div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 px-2">
													Actions
												</div>
												<div className="flex flex-col gap-1">
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => {
															setIsMoreMenuOpen(false);
															setTimeout(() => {
																setIsDeleteDialogOpen(true);
															}, 150);
														}}
														className="flex items-center justify-start gap-2 w-full px-2 py-1.5 font-medium rounded-lg text-note-alert hover:bg-note-alert/10 cursor-pointer"
													>
														Delete Note
													</Button>
												</div>
											</div>
										</div>
									</PopoverContent>
								</Popover>
							</>
						)}
						{isEditing && (
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleCancel}
									className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
									disabled={isSaving}
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="default"
									size="sm"
									onClick={handleSave}
									className="disabled:opacity-50 cursor-pointer shadow-sm"
									disabled={isSaving}
								>
									{isSaving ? "Saving..." : "Save"}
								</Button>
							</div>
						)}

						{!note && draft && (
							<HoverRevealButton
								href={`/studio/${draft.id}`}
								icon={<Pencil aria-hidden="true" />}
								text="Edit in Studio"
								className="cursor-pointer shadow-sm ml-1 bg-action hover-safe:bg-action! text-action-text hover-safe:text-action-text!"
							/>
						)}
						<div className="flex gap-1 ml-2">
							{note && (
								<>
									<AnimatedIconButton
										type="button"
										onClick={() =>
											handleUpdateProperty({ is_pinned: !currentPinned })
										}
										isActive={currentPinned}
										icon={
											<Pin className="size-5 md:size-4" aria-hidden="true" />
										}
										activeIcon={
											<PinOff className="size-5 md:size-4" aria-hidden="true" />
										}
										className={cn(
											"cursor-pointer",
											currentPinned
												? "text-neutral-800 bg-neutral-100"
												: "text-neutral-300 hover:text-neutral-900",
										)}
										title={currentPinned ? "Unpin" : "Pin"}
									/>
									<AnimatedIconButton
										type="button"
										onClick={() =>
											handleUpdateProperty({
												is_favorite: !currentFavorite,
											})
										}
										isActive={currentFavorite}
										icon={
											<Star className="size-5 md:size-4" aria-hidden="true" />
										}
										activeIcon={
											<Star
												className="size-5 md:size-4"
												aria-hidden="true"
												fill="currentColor"
											/>
										}
										className={cn(
											"cursor-pointer",
											currentFavorite
												? "text-amber-400 bg-amber-50"
												: "text-neutral-300 hover:text-amber-400",
										)}
										title={
											currentFavorite ? "Remove from Favorites" : "Favorite"
										}
									/>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* 2. Content Area (Scrollable) */}
			<div className="flex-1 overflow-y-auto">
				<div className="px-4 py-8 pb-28 md:px-8 max-w-3xl mx-auto w-full">
					{!note && draft?.title && (
						<div className="mb-8 flex flex-col gap-2">
							<div className="flex items-center justify-between px-1">
								<div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
									Draft Title
								</div>
								<InlineCopyButton text={draft.title} />
							</div>
							<h1 className="text-3xl font-extrabold text-action tracking-tight px-1">
								{draft.title}
							</h1>
						</div>
					)}

					{isEditing ? (
						<div className="space-y-6">
							{/* Metadata Editing Area */}
							<div className="bg-base-surface p-4 rounded-xl border border-base-border space-y-4">
								<div className="grid items-center gap-2 mb-4">
									<Label className="text-xs font-bold uppercase text-neutral-500">
										Note Type
									</Label>
									<div className="flex gap-2">
										{(["info", "alert", "idea"] as const).map((type) => (
											<Button
												key={type}
												type="button"
												variant={
													editNoteType === type ? "default" : "secondary"
												}
												size="sm"
												onClick={() =>
													setEditNoteType(type as Note["note_type"])
												}
												className="capitalize cursor-pointer"
											>
												{type}
											</Button>
										))}
									</div>
								</div>

								<div className="grid items-center gap-2 mb-1">
									<Label className="text-xs font-bold uppercase text-neutral-500">
										Scope & URL
									</Label>
								</div>
								<div className="flex flex-col gap-3">
									<div className="flex flex-wrap gap-2">
										<Button
											type="button"
											variant={editScope === "inbox" ? "default" : "secondary"}
											size="sm"
											onClick={() => setEditScope("inbox")}
											className="cursor-pointer"
										>
											Inbox
										</Button>
										<Button
											type="button"
											variant={editScope === "domain" ? "default" : "secondary"}
											size="sm"
											onClick={() => setEditScope("domain")}
											className="cursor-pointer"
										>
											Domain
										</Button>
										<Button
											type="button"
											variant={editScope === "exact" ? "default" : "secondary"}
											size="sm"
											onClick={() => setEditScope("exact")}
											className="cursor-pointer"
										>
											Page
										</Button>
									</div>
									{editScope !== "inbox" && (
										<Input
											value={editUrl}
											onChange={(e) => setEditUrl(e.target.value)}
											className="w-full"
											placeholder={
												editScope === "domain" ? "example.com" : "https://..."
											}
										/>
									)}
								</div>
							</div>

							{/* Content Editing Area */}
							<div className="relative">
								{(() => {
									const baseContent =
										optimisticContent !== null
											? optimisticContent
											: note?.content || "";
									return (
										<NotesEditor
											value={editContent}
											onChange={(val) => setEditContent(val)}
											placeholder="What's on your mind?"
											isDirty={editContent !== baseContent}
											onSave={handleSave}
										/>
									);
								})()}
							</div>
						</div>
					) : (
						<>
							{note && note.scope !== "inbox" && (
								<div className="mb-10">
									<div className="text-sm text-gray-400 mb-2 uppercase tracking-tight font-medium">
										Source URL
									</div>
									<div className="flex items-center gap-2 group">
										{(() => {
											const formattedUrl = note.url_pattern.startsWith("http")
												? note.url_pattern
												: note.url_pattern.includes("localhost") ||
														note.url_pattern.includes("127.0.0.1")
													? `http://${note.url_pattern}`
													: `https://${note.url_pattern}`;
											return (
												<>
													<a
														href={formattedUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-gray-600 underline hover:text-action break-all text-sm flex-1 bg-base-surface p-3 rounded-lg border border-base-border transition-colors"
													>
														{note.url_pattern}
													</a>
													<InlineCopyButton
														text={formattedUrl}
														className="text-neutral-400 hover:text-action"
													/>
												</>
											);
										})()}
									</div>
								</div>
							)}

							<div
								className={cn(
									"space-y-4",
									currentResolved && "opacity-50 transition-opacity",
								)}
							>
								<div className="flex items-center justify-between px-1">
									<div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
										{note ? "Note Content" : "Draft Content"}
									</div>
									{content && (
										<InlineCopyButton
											text={content}
											className="text-neutral-400 hover:text-action"
										/>
									)}
								</div>
								<div className="min-h-50 rounded-2xl">
									<MarkdownRenderer content={content} />
								</div>
							</div>
						</>
					)}
					<div className="mt-8 pt-4 border-t border-base-border text-xs text-neutral-400">
						<dl className="grid grid-cols-[100px_1fr] gap-y-2">
							<dt className="font-medium">Created</dt>
							<dd>{formatDate(createdAt)}</dd>

							<dt className="font-medium">Last updated</dt>
							<dd>{formatDate(updatedAt)}</dd>
						</dl>
					</div>
				</div>
			</div>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your
							note and remove it from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleDeleteNote();
							}}
							className="bg-note-alert hover:bg-note-alert/80 text-white"
							disabled={isSaving}
						>
							{isSaving ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
