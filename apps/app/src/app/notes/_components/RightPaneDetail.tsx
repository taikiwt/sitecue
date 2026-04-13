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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import type { Draft, Note } from "../types";

type Props = {
	note?: Note;
	draft?: Draft;
	isNewNote?: boolean;
};

export function RightPaneDetail({ note, draft, isNewNote }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
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
			<div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-8">
				<MousePointerClick
					className="w-12 h-12 text-gray-300 mb-6 animate-pulse"
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
				? note.content
				: draft?.content || "";
	const createdAt = note ? note.created_at : draft?.created_at || "";
	const updatedAt = note ? note.updated_at : draft?.updated_at || "";
	const id = note ? note.id : draft?.id || "";

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
			const supabase = createClient();

			if (isNewNote) {
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) throw new Error("User not authenticated");

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

				const { data, error } = await supabase
					.from("sitecue_notes")
					.insert({
						content: newContent,
						scope: targetScope,
						url_pattern: targetUrlPattern,
						note_type: "info",
						user_id: user.id,
						is_expanded: false,
						is_favorite: false,
						is_pinned: false,
						is_resolved: false,
						sort_order: 0,
					})
					.select()
					.single();

				if (error) throw error;

				setOptimisticContent(newContent);
				const params = new URLSearchParams(searchParams.toString());
				params.delete("new");
				params.set("noteId", data.id);
				router.replace(`/notes?${params.toString()}`);
				router.refresh();
			} else if (note) {
				const { error } = await supabase
					.from("sitecue_notes")
					.update({ content: newContent })
					.eq("id", note.id);

				if (error) throw error;
				router.refresh();
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
			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_notes")
				.update(updates)
				.eq("id", note.id);

			if (error) throw error;
			router.refresh();
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
			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_notes")
				.delete()
				.eq("id", note.id);
			if (error) throw error;
			setIsDeleteDialogOpen(false);

			const params = new URLSearchParams(searchParams.toString());
			params.delete("noteId");
			router.replace(`/notes?${params.toString()}`);
			router.refresh();
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

			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_notes")
				.update({
					url_pattern: finalUrl,
					scope: editScope,
				})
				.eq("id", note.id);
			if (error) throw error;
			setIsEditMetaDialogOpen(false);
			router.refresh();
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
		<div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
			<div className="p-8 max-w-3xl mx-auto w-full">
				<div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
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
										currentResolved
											? "bg-green-50 text-green-600 border border-green-200"
											: currentNoteType === "alert"
												? "bg-rose-50 text-rose-500 border border-rose-100"
												: currentNoteType === "idea"
													? "bg-amber-50 text-amber-500 border border-amber-100"
													: "bg-blue-50 text-blue-500 border border-blue-100",
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
									{currentResolved ? "Completed" : currentNoteType}
								</button>
							) : (
								<span className="bg-purple-50 text-purple-500 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
									{draft?.target_platform || "Draft"}
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
								<button
									type="button"
									onClick={handleCopyAll}
									className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-md hover:bg-neutral-50 cursor-pointer"
									title="Copy all content"
								>
									{isCopying ? (
										<Check className="w-4 h-4 text-green-500" />
									) : (
										<Clipboard className="w-4 h-4" />
									)}
								</button>
								<button
									type="button"
									onClick={handleEdit}
									className="px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ml-1"
								>
									<Pencil className="w-3.5 h-3.5" aria-hidden="true" />
									Edit
								</button>

								<Popover>
									<PopoverTrigger
										render={
											<button
												type="button"
												className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-md hover:bg-neutral-50 cursor-pointer"
												aria-label="More options"
											>
												<MoreHorizontal className="w-4 h-4" />
											</button>
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
														<button
															key={type}
															type="button"
															onClick={() =>
																handleUpdateProperty({ note_type: type })
															}
															className={cn(
																"flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
																currentNoteType === type
																	? "bg-neutral-100 text-neutral-900"
																	: "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
															)}
														>
															<div
																className={cn(
																	"w-1.5 h-1.5 rounded-full",
																	type === "alert"
																		? "bg-rose-500"
																		: type === "idea"
																			? "bg-amber-500"
																			: "bg-blue-500",
																)}
															/>
															<span className="capitalize">{type}</span>
															{currentNoteType === type && (
																<Check className="w-3 h-3 ml-auto" />
															)}
														</button>
													))}
												</div>
											</div>

											<div className="pt-2 border-t border-neutral-100">
												<div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 px-2">
													Actions
												</div>
												<div className="flex flex-col gap-1">
													<button
														type="button"
														onClick={() => {
															setEditUrl(note?.url_pattern || "");
															setEditScope(note?.scope || "inbox");
															setIsEditMetaDialogOpen(true);
														}}
														className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"
													>
														Edit Scope/URL
													</button>
													<button
														type="button"
														onClick={() => setIsDeleteDialogOpen(true)}
														className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
													>
														Delete Note
													</button>
												</div>
											</div>
										</div>
									</PopoverContent>
								</Popover>
							</>
						)}
						{isEditing && (
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={handleCancel}
									className="text-sm font-medium px-3 py-1.5 rounded-md text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
									disabled={isSaving}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSave}
									className="px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-500 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
									disabled={isSaving}
								>
									{isSaving ? "Saving..." : "Save"}
								</button>
							</div>
						)}
						<div className="flex gap-1 ml-2">
							{note && (
								<>
									<button
										type="button"
										onClick={() =>
											handleUpdateProperty({ is_pinned: !currentPinned })
										}
										className={cn(
											"p-1.5 rounded-md transition-all active:scale-90 cursor-pointer",
											currentPinned
												? "text-neutral-800 bg-neutral-100"
												: "text-neutral-300 hover:text-neutral-500 hover:bg-neutral-50",
										)}
										title={currentPinned ? "Unpin" : "Pin"}
									>
										<Pin
											className={cn("w-4 h-4", currentPinned && "fill-current")}
											aria-hidden="true"
										/>
									</button>
									<button
										type="button"
										onClick={() =>
											handleUpdateProperty({
												is_favorite: !currentFavorite,
											})
										}
										className={cn(
											"p-1.5 rounded-md transition-all active:scale-90 cursor-pointer",
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
									</button>
								</>
							)}
						</div>
					</div>
				</div>

				{!note && draft?.title && (
					<div className="mb-8">
						<h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
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
								className="text-neutral-600 underline hover:text-neutral-900 break-all text-sm flex-1 bg-neutral-50 p-3 rounded-lg border border-neutral-200 transition-colors"
							>
								{note.url_pattern}
							</a>
							<button
								type="button"
								onClick={() => handleCopyUrl(note.url_pattern)}
								className="p-2.5 text-neutral-400 hover:text-neutral-900 border border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-all active:scale-95 cursor-pointer shadow-sm"
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
							</button>
						</div>
					</div>
				)}

				<div className="space-y-4">
					<div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-1">
						{note ? "Note Content" : "Draft Content"}
					</div>
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

				<div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400">
					<p>ID: {id}</p>
					<p>Last updated: {formatDate(updatedAt)}</p>
					<p className="mt-1 uppercase tracking-widest font-bold">
						sitecue base camp
					</p>
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
							className="bg-red-600 hover:bg-red-700"
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
						<button
							type="button"
							onClick={() => setIsEditMetaDialogOpen(false)}
							className="px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
							disabled={isSaving}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSaveMeta}
							className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 disabled:opacity-50"
							disabled={isSaving}
						>
							{isSaving ? "Saving..." : "Save changes"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
