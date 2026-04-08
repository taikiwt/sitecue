"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Draft, DraftPlatform, Note } from "../../../../../types/app.ts";
import NoteEditor from "./NoteEditor";

type NoteType = "info" | "alert" | "idea";

interface DraftEditorProps {
	targetPlatform?: DraftPlatform;
	initialDraft?: Draft;
}

export default function DraftEditor({
	targetPlatform,
	initialDraft,
}: DraftEditorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const supabase = createClient();
	const target = targetPlatform || initialDraft?.target_platform || "generic";
	const activePane = searchParams.get("pane") || "review";

	const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
	const [content, setContent] = useState(initialDraft?.content || "");
	const [title, setTitle] = useState(initialDraft?.title || "");
	const [slug, setSlug] = useState(initialDraft?.metadata?.slug || "");

	// State for Self Review
	const [reviewNotes, setReviewNotes] = useState<Note[]>([]);
	const [isLoadingReview, setIsLoadingReview] = useState(true);

	// State for Global Materials
	const [searchKeyword, setSearchKeyword] = useState("");
	const [searchResults, setSearchResults] = useState<Note[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	// Fetch notes for Self Review (based on draft_id)
	useEffect(() => {
		if (!initialDraft?.id) {
			setIsLoadingReview(false);
			return;
		}

		const fetchReviewNotes = async () => {
			try {
				const { data, error } = await supabase
					.from("sitecue_notes")
					.select("*")
					.eq("draft_id", initialDraft.id)
					.order("created_at", { ascending: false });

				if (error) throw error;
				if (data) {
					setReviewNotes(data as Note[]);
				}
			} catch (error) {
				console.error("Failed to fetch review notes:", error);
			} finally {
				setIsLoadingReview(false);
			}
		};

		fetchReviewNotes();
	}, [supabase, initialDraft?.id]);

	const handleSearch = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!searchKeyword.trim()) return;

		setIsSearching(true);
		try {
			const { data, error } = await supabase
				.from("sitecue_notes")
				.select("*")
				.is("draft_id", null)
				.or(
					`content.ilike.%${searchKeyword}%,url_pattern.ilike.%${searchKeyword}%`,
				)
				.order("created_at", { ascending: false });

			if (error) throw error;
			setSearchResults((data as Note[]) || []);
		} catch (error) {
			console.error("Failed to search materials:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleAddNote = async (content: string, type: NoteType) => {
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) throw new Error("User not authenticated");

			if (initialDraft?.id) {
				// Pattern A: Existing draft -> Save to DB immediately
				const { data, error } = await supabase
					.from("sitecue_notes")
					.insert({
						content,
						note_type: type,
						draft_id: initialDraft.id,
						scope: "draft",
						url_pattern: `sitecue://draft/${initialDraft.id}`,
						user_id: user.id,
					})
					.select()
					.single();

				if (error) throw error;
				if (data) {
					setReviewNotes((prev) => [data as Note, ...prev]);
				}
			} else {
				// Pattern B: New draft -> Keep in memory
				const now = new Date().toISOString();
				const tempNote: Note = {
					id: crypto.randomUUID(),
					content,
					note_type: type,
					draft_id: null,
					scope: "draft",
					url_pattern: "", // Will be filled on sync
					user_id: user.id,
					created_at: now,
					updated_at: now,
					is_expanded: false,
					is_favorite: false,
					is_pinned: false,
					is_resolved: false,
					sort_order: 0,
				};
				setReviewNotes((prev) => [tempNote, ...prev]);
			}
		} catch (error) {
			console.error("Failed to add note:", error);
			throw error;
		}
	};

	const charCount = content.length;

	const handleSave = async () => {
		setStatus("saving");
		try {
			const metadata =
				target === "zenn" ? { slug } : initialDraft?.metadata || {};

			let currentDraftId = initialDraft?.id;

			if (currentDraftId) {
				const { error } = await supabase
					.from("sitecue_drafts")
					.update({
						title,
						content,
						metadata,
						updated_at: new Date().toISOString(),
					})
					.eq("id", currentDraftId);

				if (error) throw error;
			} else {
				const { data, error } = await supabase
					.from("sitecue_drafts")
					.insert({
						title,
						content,
						target_platform: target,
						metadata,
					})
					.select()
					.single();

				if (error) throw error;
				if (data) {
					currentDraftId = data.id;

					// Sync In-Memory notes if any
					const unsavedNotes = reviewNotes.filter((n) => !n.draft_id);
					if (unsavedNotes.length > 0) {
						const notesToInsert = unsavedNotes.map((n) => ({
							content: n.content,
							note_type: n.note_type,
							draft_id: currentDraftId,
							scope: n.scope,
							url_pattern: `sitecue://draft/${currentDraftId}`,
							user_id: n.user_id,
						}));

						const { error: notesError } = await supabase
							.from("sitecue_notes")
							.insert(notesToInsert);

						if (notesError) {
							console.error("Failed to sync notes:", notesError);
							// Don't fail the whole save, but alert user?
						}
					}

					router.push(`/studio/${data.id}`);
				}
			}
			setStatus("idle");
		} catch (error) {
			console.error("Failed to save draft:", error);
			alert("Failed to save the draft. Check the console for details.");
			setStatus("error");
		}
	};

	const updatePane = (pane: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("pane", pane);
		router.replace(`?${params.toString()}`);
	};

	return (
		<div className="flex h-screen overflow-hidden bg-neutral-50 text-neutral-950">
			{/* 左ペイン: メインエディタ */}
			<div className="flex flex-1 flex-col overflow-hidden border-r border-neutral-200 bg-white">
				<header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
					<div className="flex items-center gap-4">
						<Link
							href="/"
							className="text-sm text-neutral-400 transition-colors hover:text-neutral-900"
						>
							← Launchpad
						</Link>
						<div className="h-4 w-px bg-neutral-200" />
						<span className="text-sm font-medium text-neutral-900">
							{target === "x" &&
								(initialDraft ? "Edit Draft for X" : "New Draft for X")}
							{target === "zenn" &&
								(initialDraft ? "Edit Draft for Zenn" : "New Draft for Zenn")}
							{target === "generic" &&
								(initialDraft ? "Edit Note" : "New Note")}
						</span>
					</div>
					<button
						type="button"
						onClick={handleSave}
						disabled={status === "saving"}
						className={`rounded-full bg-neutral-900 px-6 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-500 cursor-pointer ${
							status === "saving" ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{status === "saving" ? "Saving..." : "Save"}
					</button>
				</header>

				<div className="border-b border-neutral-100 bg-neutral-50/50 px-8 py-6">
					{target === "x" && (
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
								Character Count
							</span>
							<span
								className={`text-2xl font-mono font-bold ${charCount > 140 ? "text-red-500" : "text-neutral-900"}`}
							>
								{charCount} / 140
							</span>
						</div>
					)}

					{target === "zenn" && (
						<div className="grid gap-4">
							<input
								type="text"
								placeholder="Enter article title..."
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="w-full bg-transparent text-2xl font-bold placeholder:text-neutral-300 focus:outline-none"
							/>
							<div className="flex items-center gap-2 text-sm text-neutral-400">
								<span>slug:</span>
								<input
									type="text"
									placeholder="example-article-slug"
									value={slug}
									onChange={(e) => setSlug(e.target.value)}
									className="flex-1 bg-transparent font-mono focus:outline-none"
								/>
							</div>
						</div>
					)}

					{target === "generic" && (
						<input
							type="text"
							placeholder="Title (optional)"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full bg-transparent text-2xl font-bold placeholder:text-neutral-300 focus:outline-none"
						/>
					)}
				</div>

				<main className="flex-1 overflow-y-auto px-8 py-10">
					<textarea
						placeholder="Write down your thoughts..."
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className="min-h-full w-full resize-none bg-transparent text-lg leading-relaxed placeholder:text-neutral-300 focus:outline-none"
					/>
				</main>
			</div>

			{/* 右ペイン: コンテキストバー */}
			<aside className="hidden w-96 flex-col overflow-hidden bg-neutral-50 border-l border-neutral-200 md:flex">
				<header className="border-b border-neutral-200 p-2">
					<div className="flex rounded-lg bg-neutral-200/50 p-1">
						<button
							type="button"
							onClick={() => updatePane("review")}
							className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
								activePane === "review"
									? "bg-white text-neutral-900 shadow-sm"
									: "text-neutral-500 hover:text-neutral-700"
							}`}
						>
							SELF REVIEW
						</button>
						<button
							type="button"
							onClick={() => updatePane("materials")}
							className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
								activePane === "materials"
									? "bg-white text-neutral-900 shadow-sm"
									: "text-neutral-500 hover:text-neutral-700"
							}`}
						>
							GLOBAL MATERIALS
						</button>
					</div>
				</header>

				{/* Tab Content */}
				<div className="flex-1 overflow-y-auto">
					{activePane === "review" ? (
						<div className="flex flex-col h-full">
							{/* Note Form */}
							<div className="p-4 border-b border-neutral-200 bg-white/50">
								<NoteEditor onSubmit={handleAddNote} />
							</div>

							{/* Note List */}
							<div className="flex-1 p-4 overflow-y-auto">
								<div className="grid gap-3">
									{isLoadingReview ? (
										[1, 2, 3].map((i) => (
											<div
												key={i}
												className="h-24 animate-pulse rounded-xl border border-neutral-100 bg-neutral-100/50"
											/>
										))
									) : reviewNotes.length === 0 ? (
										<div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-neutral-400">
											<p className="text-sm">No notes for this draft yet.</p>
											<p className="mt-1 text-[10px]">
												Use the form above to capture your thoughts.
											</p>
										</div>
									) : (
										reviewNotes.map((note) => (
											<NoteCard key={note.id} note={note} />
										))
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-col h-full">
							{/* Search Bar */}
							<div className="p-4 border-b border-neutral-200 bg-white/50">
								<form onSubmit={handleSearch} className="relative">
									<input
										type="text"
										placeholder="Search by keyword or domain..."
										value={searchKeyword}
										onChange={(e) => setSearchKeyword(e.target.value)}
										className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-4 pr-10 text-sm focus:border-neutral-400 focus:outline-none"
									/>
									<button
										type="submit"
										className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
									>
										🔍
									</button>
								</form>
							</div>

							{/* Search Results */}
							<div className="flex-1 p-4 overflow-y-auto">
								<div className="grid gap-3">
									{isSearching ? (
										[1, 2, 3].map((i) => (
											<div
												key={i}
												className="h-24 animate-pulse rounded-xl border border-neutral-100 bg-neutral-100/50"
											/>
										))
									) : searchResults.length === 0 ? (
										<div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center text-neutral-400">
											<p className="text-sm">No materials found.</p>
											<p className="mt-1 text-[10px]">
												Enter keywords to search your past notes
												<br />
												and saved pages.
											</p>
										</div>
									) : (
										searchResults.map((note) => (
											<NoteCard key={note.id} note={note} />
										))
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="border-t border-neutral-200 p-4 text-center">
					<p className="text-xs text-neutral-400 italic">
						Click a note to cite it (Coming Soon)
					</p>
				</div>
			</aside>
		</div>
	);
}

function NoteCard({ note }: { note: Note }) {
	return (
		<div className="group cursor-default rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-400">
			<div className="mb-2 flex items-center justify-between">
				<span
					className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
						note.note_type === "info" || !note.note_type
							? "bg-blue-50 text-blue-600"
							: note.note_type === "alert"
								? "bg-red-50 text-red-600"
								: "bg-amber-50 text-amber-600"
					}`}
				>
					{note.note_type || "info"}
				</span>
				<span className="text-[10px] text-neutral-400">
					{note.created_at ? note.created_at.split("T")[0] : ""}
				</span>
			</div>
			<p className="line-clamp-3 text-sm leading-snug text-neutral-600 group-hover:text-neutral-900">
				{note.content}
			</p>
			{note.url_pattern && !note.url_pattern.startsWith("sitecue://") && (
				<p className="mt-2 text-[10px] text-neutral-400 truncate">
					{note.url_pattern}
				</p>
			)}
		</div>
	);
}
