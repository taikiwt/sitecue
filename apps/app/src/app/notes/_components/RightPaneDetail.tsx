"use client";

import {
	AlertTriangle,
	Check,
	CheckCircle2,
	Clipboard,
	Info,
	Lightbulb,
	MoreHorizontal,
	MousePointerClick,
	Pencil,
	Pin,
	Star,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { NotesEditor } from "@/components/editor/NotesEditor";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import type { Draft, Note } from "../types";

type Props = {
	note?: Note;
	draft?: Draft;
};

export function RightPaneDetail({ note, draft }: Props) {
	const router = useRouter();
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

	// Reset state when note or draft changes
	useEffect(() => {
		setIsEditing(false);
		setOptimisticContent(null);
		setOptimisticResolved(null);
		setOptimisticNoteType(null);
		setOptimisticScope(null);
		setEditContent(note?.content || "");
	}, [note?.content, note?.id]);

	if (!note && !draft) {
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
		optimisticNoteType !== null ? optimisticNoteType : note?.note_type || "info";
	const currentScope =
		optimisticScope !== null ? optimisticScope : note?.scope || "inbox";

	const handleEdit = () => {
		setEditContent(note?.content || "");
		setIsEditing(true);
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditContent(note?.content || "");
	};

	const handleSave = async () => {
		if (!note) return;

		setIsSaving(true);
		const newContent = editContent.trim();

		// Optimistic update
		setOptimisticContent(newContent);
		setIsEditing(false);

		try {
			const supabase = createClient();
			const { error } = await supabase
				.from("sitecue_notes")
				.update({ content: newContent })
				.eq("id", note.id);

			if (error) throw error;

			router.refresh();
		} catch (err) {
			console.error("Failed to update note:", err);
			alert("Failed to update the note.");
			setOptimisticContent(null);
			setIsEditing(true);
		} finally {
			setIsSaving(false);
		}
	};

	const handleUpdateProperty = async (updates: Partial<Note>) => {
		if (!note) return;

		// Set optimistic states
		if ("is_resolved" in updates) setOptimisticResolved(updates.is_resolved!);
		if ("note_type" in updates) setOptimisticNoteType(updates.note_type!);
		if ("scope" in updates) setOptimisticScope(updates.scope!);

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
		}
	};

	const handleCopyAll = () => {
		if (!content) return;
		navigator.clipboard.writeText(content);
		setIsCopying(true);
		setTimeout(() => setIsCopying(false), 2000);
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
													Scope
												</div>
												<div className="flex flex-col gap-1">
													{["inbox", "domain", "exact"].map((scope) => (
														<button
															key={scope}
															type="button"
															onClick={() =>
																handleUpdateProperty({
																	scope: scope as Note["scope"],
																})
															}
															className={cn(
																"flex items-center gap-2 w-full px-2 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
																currentScope === scope
																	? "bg-neutral-100 text-neutral-900"
																	: "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900",
															)}
														>
															<span className="capitalize">{scope}</span>
															{currentScope === scope && (
																<Check className="w-3 h-3 ml-auto" />
															)}
														</button>
													))}
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
						<div className="flex gap-2 ml-2">
							{note?.is_pinned && (
								<div title="Pinned">
									<Pin
										className="w-4 h-4 fill-current text-neutral-800"
										aria-label="Pinned"
									/>
								</div>
							)}
							{note?.is_favorite && (
								<div title="Favorite">
									<Star
										className="w-4 h-4 fill-current text-amber-400"
										aria-label="Favorite"
									/>
								</div>
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
							className="text-neutral-600 underline hover:text-neutral-900 break-all text-sm block bg-neutral-50 p-3 rounded-lg border border-neutral-200"
						>
							{note.url_pattern}
						</a>
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
		</div>
	);
}
