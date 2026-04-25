"use client";

import {
	AlertTriangle,
	Check,
	CheckCircle2,
	Clipboard,
	Copy,
	Info,
	Lightbulb,
	MoreHorizontal,
	MousePointerClick,
	Pencil,
	Pin,
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
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { InlineCopyButton } from "@/components/ui/inline-copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useCreateNote,
	useDeleteNote,
	useUpdateNote,
} from "@/hooks/useNotesQuery";
import { cn } from "@/lib/utils";
import { extractTags } from "@/utils/tags";
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
	const [noteType, setNoteType] = useState<Note["note_type"]>("info");
	const [isCopying, setIsCopying] = useState(false);
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
	const [isCopyingUrl, setIsCopyingUrl] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isEditMetaDialogOpen, setIsEditMetaDialogOpen] = useState(false);
	const [editUrl, setEditUrl] = useState(note?.url_pattern || "");
	const [editScope, setEditScope] = useState<Note["scope"]>(
		note?.scope || "inbox",
	);

	// Sync edit states when note changes
	useEffect(() => {
		if (note) {
			setEditUrl(note.url_pattern || "");
			setEditScope(note.scope || "inbox");
		}
	}, [note]);

	// Initialize state for new notes
	useEffect(() => {
		if (isNewNote) {
			setIsEditing(true);
			setEditContent("");
		}
	}, [isNewNote]);

	// Force inbox scope if URL is empty
	useEffect(() => {
		if (editUrl === "" && editScope !== "inbox") {
			setEditScope("inbox");
		}
	}, [editUrl, editScope]);

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

				if (exactParam) {
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
					note_type: noteType,
					tags: extractedTags,
				});

				setOptimisticContent(newContent);
				const params = new URLSearchParams(searchParams.toString());
				params.delete("new");
				params.set("noteId", data.id);
				router.replace(`/notes?${params.toString()}`);
			} else if (note) {
				const extractedTags = extractTags(newContent);
				await updateNoteMutation.mutateAsync({
					id: note.id,
					updates: {
						content: newContent,
						tags: extractedTags,
					},
				});
			}
		} catch (err) {
			console.error("Failed to save note:", err);
			alert("Failed to save the note.");
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
			alert("Failed to delete the note.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleSaveMeta = async () => {
		if (!note) return;
		setIsSaving(true);
		try {
			let finalUrl = editUrl;
			if (editScope === "inbox") {
				finalUrl = "";
			} else if (editScope === "domain" && finalUrl) {
				try {
					const urlObj = new URL(
						finalUrl.startsWith("http") ? finalUrl : `https://${finalUrl}`,
					);
					finalUrl = urlObj.hostname;
				} catch (_e) {
					// invalid URLの場合はそのままにする
				}
			}

			await updateNoteMutation.mutateAsync({
				id: note.id,
				updates: {
					url_pattern: finalUrl,
					scope: editScope,
				},
			});
			setIsEditMetaDialogOpen(false);
		} catch (err) {
			console.error("Failed to save metadata:", err);
			alert("Failed to save metadata.");
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

	const handleCopyUrl = (url: string) => {
		const fullUrl =
			url.startsWith("http://") || url.startsWith("https://")
				? url
				: `https://${url}`;
		navigator.clipboard.writeText(fullUrl);
		setIsCopyingUrl(true);
		setTimeout(() => setIsCopyingUrl(false), 2000);
	};

	return (
		<div className="flex-1 flex flex-col h-full bg-base-bg overflow-y-auto">
			<div className="p-8 max-w-3xl mx-auto w-full">
				<div className="flex items-center justify-between mb-8 pb-4 border-b border-base-border">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							{note ? (
								<button
									type="button"
									onClick={() =>
										handleUpdateProperty({ is_resolved: !currentResolved })
									}
									className={cn(
										"flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all hover:opacity-80 active:scale-95 cursor-pointer",
										currentNoteType === "alert"
											? "bg-note-alert/10 text-note-alert"
											: currentNoteType === "idea"
												? "bg-note-idea/10 text-note-idea"
												: "bg-note-info/10 text-note-info",
									)}
								>
									{currentResolved ? (
										<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
									) : currentNoteType === "alert" ? (
										<AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
									) : currentNoteType === "idea" ? (
										<Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
									) : (
										<Info className="w-3.5 h-3.5" aria-hidden="true" />
									)}
									{currentNoteType}
								</button>
							) : (
								<span className="bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
									NEW
								</span>
							)}
							<span className="text-sm text-gray-400">
								{formatDate(createdAt)}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{note && !isEditing && (
							<>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={handleCopyAll}
									className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
									title="Copy all content"
								>
									{isCopying ? (
										<Check className="w-4 h-4 text-green-500" />
									) : (
										<Clipboard className="w-4 h-4" />
									)}
								</Button>
								<Button
									type="button"
									variant="default"
									size="sm"
									onClick={handleEdit}
									className="flex items-center gap-1.5 cursor-pointer shadow-sm ml-1 bg-action hover:bg-action-hover text-action-text"
								>
									<Pencil className="size-3.5" aria-hidden="true" />
									Edit
								</Button>

								<Popover>
									<PopoverTrigger
										render={
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
												aria-label="More options"
											>
												<MoreHorizontal className="w-4 h-4" />
											</Button>
										}
									/>
									<PopoverContent className="w-48 p-2" align="end">
										<div className="space-y-3">
											<div>
												<div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 px-2">
													Note Type
												</div>
												<div className="flex flex-col gap-1">
													{["info", "idea", "alert"].map((type) => (
														<Button
															key={type}
															type="button"
															variant="ghost"
															size="sm"
															onClick={() =>
																handleUpdateProperty({ note_type: type })
															}
															className={cn(
																"flex items-center justify-start gap-2 w-full px-2 py-1.5 font-medium rounded-lg cursor-pointer",
																currentNoteType === type
																	? "bg-neutral-100 text-neutral-900"
																	: "text-neutral-500 hover:text-neutral-900",
															)}
														>
															<div
																className={cn(
																	"w-1.5 h-1.5 rounded-full",
																	type === "alert"
																		? "bg-note-alert"
																		: type === "idea"
																			? "bg-note-idea"
																			: "bg-note-info",
																)}
															/>
															<span className="capitalize">{type}</span>
															{currentNoteType === type && (
																<Check className="w-3 h-3 ml-auto" />
															)}
														</Button>
													))}
												</div>
											</div>

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
															setEditUrl(note?.url_pattern || "");
															setEditScope(note?.scope || "inbox");
															setIsEditMetaDialogOpen(true);
														}}
														className="flex items-center justify-start gap-2 w-full px-2 py-1.5 font-medium rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer"
													>
														Edit Scope/URL
													</Button>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => setIsDeleteDialogOpen(true)}
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
							<CustomLink
								href={`/studio/${draft.id}`}
								className="flex items-center gap-1.5 px-3 py-1.5 bg-action text-action-text hover:bg-action-hover rounded-md text-sm font-medium shadow-sm transition-colors cursor-pointer"
							>
								<Pencil className="size-3.5" aria-hidden="true" />
								Edit in Studio
							</CustomLink>
						)}
						<div className="flex gap-1 ml-2">
							{note && (
								<>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() =>
											handleUpdateProperty({ is_pinned: !currentPinned })
										}
										className={cn(
											"transition-all active:scale-90 cursor-pointer",
											currentPinned
												? "text-neutral-800 bg-neutral-100"
												: "text-neutral-300 hover:text-neutral-50 hover:bg-neutral-50",
										)}
										title={currentPinned ? "Unpin" : "Pin"}
									>
										<Pin
											className={cn("w-4 h-4", currentPinned && "fill-current")}
											aria-hidden="true"
										/>
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() =>
											handleUpdateProperty({
												is_favorite: !currentFavorite,
											})
										}
										className={cn(
											"transition-all active:scale-90 cursor-pointer",
											currentFavorite
												? "text-amber-400 bg-amber-50"
												: "text-neutral-300 hover:text-amber-400 hover:bg-amber-50",
										)}
										title={
											currentFavorite ? "Remove from Favorites" : "Favorite"
										}
									>
										<Star
											className={cn(
												"w-4 h-4",
												currentFavorite && "fill-current",
											)}
											aria-hidden="true"
										/>
									</Button>
								</>
							)}
						</div>
					</div>
				</div>

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

				{note && note.scope !== "inbox" && (
					<div className="mb-10">
						<div className="text-sm text-gray-400 mb-2 uppercase tracking-tight font-medium">
							Source URL
						</div>
						<div className="flex items-center gap-2 group">
							<a
								href={
									note.url_pattern.startsWith("http")
										? note.url_pattern
										: note.url_pattern.includes("localhost") ||
												note.url_pattern.includes("127.0.0.1")
											? `http://${note.url_pattern}`
											: `https://${note.url_pattern}`
								}
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-600 underline hover:text-action break-all text-sm flex-1 bg-base-surface p-3 rounded-lg border border-base-border transition-colors"
							>
								{note.url_pattern}
							</a>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="size-10 text-gray-400 hover:text-action border border-base-border rounded-lg bg-base-surface hover:bg-base-surface/80 active:scale-95 cursor-pointer shadow-sm"
								onClick={() => handleCopyUrl(note.url_pattern)}
								title="Copy Source URL"
							>
								{isCopyingUrl ? (
									<Check
										className="w-4 h-4 text-green-500"
										aria-hidden="true"
									/>
								) : (
									<Copy className="w-4 h-4" aria-hidden="true" />
								)}
							</Button>
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
						{!note && draft && (
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="text-neutral-400 hover:text-action cursor-pointer"
								onClick={() => {
									if (draft.content) {
										navigator.clipboard.writeText(draft.content);
										toast.success("Copied!");
									}
								}}
								title="Copy Content"
							>
								<Copy className="w-3.5 h-3.5" aria-hidden="true" />
							</Button>
						)}
					</div>
					{isNewNote && (
						<div className="grid items-center gap-2 mb-4">
							<Label className="text-xs font-bold uppercase">Note Type</Label>
							<div className="flex gap-2">
								{(["info", "alert", "idea"] as const).map((type) => (
									<Button
										key={type}
										type="button"
										variant={noteType === type ? "default" : "secondary"}
										size="sm"
										onClick={() => setNoteType(type as Note["note_type"])}
										className="capitalize cursor-pointer"
									>
										{type}
									</Button>
								))}
							</div>
						</div>
					)}
					{isEditing ? (
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
					) : (
						<div className="min-h-[200px] rounded-2xl">
							<MarkdownRenderer content={content} />
						</div>
					)}
				</div>

				<div className="mt-8 pt-4 border-t border-base-border text-xs text-gray-400">
					Last updated: {formatDate(updatedAt)}
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

			<Dialog
				open={isEditMetaDialogOpen}
				onOpenChange={setIsEditMetaDialogOpen}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit Note Scope & URL</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid items-center gap-2">
							<Label htmlFor="url" className="text-xs font-bold uppercase">
								Source URL
							</Label>
							<Input
								id="url"
								value={editUrl}
								onChange={(e) => setEditUrl(e.target.value)}
								placeholder="example.com/page"
								className="col-span-3"
								disabled={isSaving}
							/>
							<p className="text-[10px] text-neutral-400">
								Leave empty to move this note to Inbox.
							</p>
						</div>
						<div className="grid items-center gap-2">
							<Label htmlFor="scope" className="text-xs font-bold uppercase">
								Scope
							</Label>
							<Select
								value={editScope}
								onValueChange={(val: string | null) => {
									if (val) setEditScope(val as Note["scope"]);
								}}
								disabled={isSaving}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select scope" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="exact" disabled={editUrl === ""}>
										Page
									</SelectItem>
									<SelectItem value="domain" disabled={editUrl === ""}>
										Domain
									</SelectItem>
									<SelectItem value="inbox">Inbox</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setIsEditMetaDialogOpen(false)}
							className="text-neutral-500 hover:text-neutral-900 cursor-pointer"
							disabled={isSaving}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="default"
							onClick={handleSaveMeta}
							className="cursor-pointer"
							disabled={isSaving}
						>
							{isSaving ? "Saving..." : "Save changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
