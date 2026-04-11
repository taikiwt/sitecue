"use client";

import {
	AlertTriangle,
	Info,
	Lightbulb,
	MousePointerClick,
	Pencil,
	Pin,
	Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotesEditor } from "@/components/editor/NotesEditor";
import { createClient } from "@/utils/supabase/client";
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
	const [optimisticContent, setOptimisticContent] = useState<string | null>(
		null,
	);

	// Reset state when note or draft changes
	useEffect(() => {
		setIsEditing(false);
		setOptimisticContent(null);
		setEditContent(note?.content || "");
	}, [note?.content]);

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

	return (
		<div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
			<div className="p-8 max-w-3xl mx-auto w-full">
				<div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							{note ? (
								<span
									className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
										note.note_type === "alert"
											? "bg-rose-50 text-rose-500"
											: note.note_type === "idea"
												? "bg-amber-50 text-amber-500"
												: "bg-blue-50 text-blue-500"
									}`}
								>
									{note.note_type === "alert" ? (
										<AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
									) : note.note_type === "idea" ? (
										<Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
									) : (
										<Info className="w-3.5 h-3.5" aria-hidden="true" />
									)}
									{note.note_type}
								</span>
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
							<button
								type="button"
								onClick={handleEdit}
								className="px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-500 transition-colors flex items-center gap-1.5 cursor-pointer"
							>
								<Pencil className="w-3.5 h-3.5" aria-hidden="true" />
								Edit
							</button>
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
									className="px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-500 transition-colors disabled:opacity-50 cursor-pointer"
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

				<div className="prose prose-neutral max-w-none">
					<div className="text-sm text-gray-400 mb-2 uppercase tracking-tight font-medium">
						{note ? "Note Content" : "Draft Content"}
					</div>
					{isEditing ? (
						<div className="relative mt-2">
							<NotesEditor
								value={editContent}
								onChange={(val) => setEditContent(val)}
								placeholder="What's on your mind?"
								isDirty={editContent !== (note?.content || "")}
							/>
						</div>
					) : (
						<div className="prose prose-neutral max-w-none bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm min-h-50 whitespace-pre-wrap text-gray-800 leading-relaxed">
							{content}
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
