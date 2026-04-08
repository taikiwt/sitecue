"use client";

import type { Draft, Note } from "../types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";
import { createClient } from "@/utils/supabase/client";

type Props = {
	note?: Note;
	draft?: Draft;
};

export function RightPaneDetail({ note, draft }: Props) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [optimisticContent, setOptimisticContent] = useState<string | null>(null);

	// Reset state when note or draft changes
	useEffect(() => {
		setIsEditing(false);
		setOptimisticContent(null);
		setEditContent(note?.content || "");
	}, [note?.id, draft?.id, note?.content]);

	if (!note && !draft) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-8">
				<div className="text-6xl mb-6 animate-pulse" aria-hidden="true">
					👈
				</div>
				<p className="text-lg font-medium text-gray-400">
					左のリストからノートまたはドラフトを選択してください
				</p>
			</div>
		);
	}

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const content = optimisticContent !== null ? optimisticContent : (note ? note.content : draft?.content || "");
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
			alert("ノートの更新に失敗しました。");
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
									className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
										note.note_type === "alert"
											? "bg-red-100 text-red-700"
											: note.note_type === "idea"
												? "bg-yellow-100 text-yellow-700"
												: "bg-blue-100 text-blue-700"
									}`}
								>
									{note.note_type}
								</span>
							) : (
								<span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
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
								className="text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1.5"
							>
								<span aria-hidden="true" className="text-sm">
									✏️
								</span>
								Edit
							</button>
						)}
						{isEditing && (
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={handleCancel}
									className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
									disabled={isSaving}
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSave}
									className="text-xs font-medium px-4 py-1.5 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
									disabled={isSaving}
								>
									{isSaving ? "Saving..." : "Save"}
								</button>
							</div>
						)}
						<div className="flex gap-2 ml-2">
							{note?.is_pinned && (
								<span
									role="img"
									className="text-xl"
									title="Pinned"
									aria-label="Pinned"
								>
									📌
								</span>
							)}
							{note?.is_favorite && (
								<span
									role="img"
									className="text-xl"
									title="Favorite"
									aria-label="Favorite"
								>
									⭐
								</span>
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

				{note && (
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
						<div className="relative">
							<TextareaAutosize
								autoFocus
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								className="w-full bg-white p-6 rounded-xl border-2 border-neutral-900 shadow-sm min-h-50 whitespace-pre-wrap text-gray-800 leading-relaxed focus:outline-none"
								placeholder="What's on your mind?"
							/>
						</div>
					) : (
						<div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm min-h-50 whitespace-pre-wrap text-gray-800 leading-relaxed">
							{content}
						</div>
					)}
				</div>

				<div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400">
					<p>ID: {id}</p>
					<p>Last updated: {formatDate(updatedAt)}</p>
					<p className="mt-1 uppercase tracking-widest font-bold">
						SiteCue Base Camp
					</p>
				</div>
			</div>
		</div>
	);
}
