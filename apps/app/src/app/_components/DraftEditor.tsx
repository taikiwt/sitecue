"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StudioEditor } from "@/components/editor/StudioEditor";
import { CustomLink as Link } from "@/components/ui/custom-link";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createClient } from "@/utils/supabase/client";
import type { Draft, DraftPlatform, Note } from "../../../../../types/app.ts";
import PaywallModal from "../studio/_components/PaywallModal";
import StudioMaterialsPane from "../studio/_components/StudioMaterialsPane";
import StudioReviewPane from "../studio/_components/StudioReviewPane";
import UndoRedoControls from "../studio/_components/UndoRedoControls";

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
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
	const [savedState, setSavedState] = useState({
		content: initialDraft?.content || "",
		title: initialDraft?.title || "",
		slug: initialDraft?.metadata?.slug || "",
	});
	const [content, setContent] = useState(savedState.content);
	const [title, setTitle] = useState(savedState.title);
	const [slug, setSlug] = useState(savedState.slug);

	// State for Self Review
	const [reviewNotes, setReviewNotes] = useState<Note[]>([]);
	const [isLoadingReview, setIsLoadingReview] = useState(true);

	// State for Global Materials
	const [searchKeyword, setSearchKeyword] = useState("");
	const [searchResults, setSearchResults] = useState<Note[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	// State for History (Undo/Redo)
	const [history, setHistory] = useState<string[]>([
		initialDraft?.content || "",
	]);
	const [historyIndex, setHistoryIndex] = useState(0);

	// State for Quota
	const [usageCount, setUsageCount] = useState(0);
	const [plan, setPlan] = useState<"free" | "pro">("free");
	const [showPaywall, setShowPaywall] = useState(false);

	// AISystem State
	const [isWeaving, setIsWeaving] = useState(false);

	const isDirty =
		content !== savedState.content ||
		title !== savedState.title ||
		slug !== savedState.slug;

	const handleBack = () => {
		if (isDirty) {
			const confirmLeave = window.confirm(
				"You have unsaved changes. Are you sure you want to leave?",
			);
			if (!confirmLeave) return;
		}
		router.back();
	};

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

	// Fetch Profile for Quota
	useEffect(() => {
		const fetchProfile = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { data, error } = await supabase
				.from("sitecue_profiles")
				.select("plan, ai_usage_count")
				.eq("id", user.id)
				.single();

			if (!error && data) {
				setPlan((data.plan as "free" | "pro") || "free");
				setUsageCount(data.ai_usage_count || 0);
			}
		};
		fetchProfile();
	}, [supabase]);

	// Push to history logic
	const pushToHistory = useCallback(
		(newContent: string) => {
			if (newContent === history[historyIndex]) return;

			const newHistory = history.slice(0, historyIndex + 1);
			newHistory.push(newContent);
			if (newHistory.length > 20) {
				newHistory.shift();
			}
			setHistory(newHistory);
			setHistoryIndex(newHistory.length - 1);
		},
		[history, historyIndex],
	);

	const handleUndo = useCallback(() => {
		if (historyIndex > 0) {
			const targetIndex = historyIndex - 1;
			setHistoryIndex(targetIndex);
			setContent(history[targetIndex]);
		}
	}, [history, historyIndex]);

	const handleRedo = useCallback(() => {
		if (historyIndex < history.length - 1) {
			const targetIndex = historyIndex + 1;
			setHistoryIndex(targetIndex);
			setContent(history[targetIndex]);
		}
	}, [history, historyIndex]);

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

	const handleWeave = async () => {
		const limit = plan === "pro" ? 100 : 3;
		if (usageCount >= limit) {
			setShowPaywall(true);
			return;
		}

		setIsWeaving(true);
		try {
			// Save current state before weave
			pushToHistory(content);

			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) throw new Error("No session");

			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";
			const response = await fetch(`${apiUrl}/ai/weave`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.access_token}`,
				},
				body: JSON.stringify({
					contexts: reviewNotes,
					format: "markdown",
					draft_content: content,
				}),
			});

			if (response.status === 403) {
				setShowPaywall(true);
				return;
			}

			if (!response.ok) {
				const errData = await response.json();
				throw new Error(errData.error || "Failed to weave");
			}

			const data = await response.json();
			const newContent = data.result;

			setContent(newContent);
			setUsageCount((prev) => prev + 1);

			// Add result to history
			const newHistory = history.slice(0, historyIndex + 1);
			newHistory.push(newContent);
			if (newHistory.length > 20) newHistory.shift();
			setHistory(newHistory);
			setHistoryIndex(newHistory.length - 1);

			// Auto-Consume Review Notes
			const noteIdsToDelete = reviewNotes.map((note) => note.id);
			if (noteIdsToDelete.length > 0) {
				// Fire and forget (physically delete from DB)
				supabase
					.from("sitecue_notes")
					.delete()
					.in("id", noteIdsToDelete)
					.then(({ error }) => {
						if (error) console.error("Failed to delete consumed notes:", error);
					});
			}
			setReviewNotes([]);
		} catch (error) {
			console.error("Weave failed:", error);
			alert("AI Weave failed. Please check the console.");
		} finally {
			setIsWeaving(false);
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
				setSavedState({ content, title, slug });
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

					setSavedState({ content, title, slug });
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
						<button
							type="button"
							onClick={handleBack}
							className="cursor-pointer text-neutral-400 hover:text-neutral-900 transition-colors p-1 -ml-2"
							aria-label="Go back"
						>
							<ArrowLeft className="w-5 h-5" aria-hidden="true" />
						</button>
						<Link
							href="/"
							className="text-xl font-bold tracking-tight text-neutral-900 transition-colors hover:text-neutral-500 cursor-pointer block"
						>
							sitecue
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

					<div className="flex items-center gap-4">
						<UndoRedoControls
							canUndo={historyIndex > 0}
							canRedo={historyIndex < history.length - 1}
							onUndo={handleUndo}
							onRedo={handleRedo}
						/>

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
					</div>
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
					<StudioEditor
						value={content}
						onChange={(val) => setContent(val)}
						placeholder="Write down your thoughts..."
						isDirty={isDirty}
					/>
				</main>
			</div>
			{/* 右ペイン: コンテキストバー (Desktop only) */}
			{isDesktop && (
				<aside className="w-96 flex-col overflow-hidden bg-neutral-50 border-l border-neutral-200 flex">
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
					<div className="flex-1 overflow-hidden">
						{activePane === "review" ? (
							<StudioReviewPane
								reviewNotes={reviewNotes}
								isLoadingReview={isLoadingReview}
								onAddNote={handleAddNote}
								onWeave={handleWeave}
								isWeaving={isWeaving}
								usageCount={usageCount}
								plan={plan}
							/>
						) : (
							<StudioMaterialsPane
								searchKeyword={searchKeyword}
								onSearchKeywordChange={setSearchKeyword}
								onSearch={handleSearch}
								searchResults={searchResults}
								isSearching={isSearching}
							/>
						)}
					</div>

					<div className="border-t border-neutral-200 p-4 text-center bg-white/50">
						<p className="text-[10px] text-neutral-400 font-medium">
							Weave Studio Power User Mode
						</p>
					</div>
				</aside>
			)}

			{/* Floating Mobile Trigger */}
			{!isDesktop && (
				<div className="fixed bottom-6 right-6 z-50">
					<Drawer>
						<DrawerTrigger asChild>
							<button
								type="button"
								className="flex h-14 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
							>
								<Sparkles className="h-5 w-5" aria-hidden="true" />
								<span className="text-sm font-bold">Notes & AI</span>
							</button>
						</DrawerTrigger>
						<DrawerContent className="h-[80vh]">
							<div className="mx-auto w-full max-w-sm">
								<DrawerHeader>
									<DrawerTitle className="sr-only">Weave Studio</DrawerTitle>
									<DrawerDescription className="sr-only">
										Access AI Weave and Materials
									</DrawerDescription>
									<div className="flex rounded-lg bg-neutral-200/50 p-1 mb-4">
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
								</DrawerHeader>
								<div className="h-[calc(80vh-80px)] overflow-hidden">
									{activePane === "review" ? (
										<StudioReviewPane
											reviewNotes={reviewNotes}
											isLoadingReview={isLoadingReview}
											onAddNote={handleAddNote}
											onWeave={handleWeave}
											isWeaving={isWeaving}
											usageCount={usageCount}
											plan={plan}
										/>
									) : (
										<StudioMaterialsPane
											searchKeyword={searchKeyword}
											onSearchKeywordChange={setSearchKeyword}
											onSearch={handleSearch}
											searchResults={searchResults}
											isSearching={isSearching}
										/>
									)}
								</div>
							</div>
						</DrawerContent>
					</Drawer>
				</div>
			)}

			<PaywallModal
				isOpen={showPaywall}
				onClose={() => setShowPaywall(false)}
				limit={plan === "pro" ? 100 : 3}
			/>
		</div>
	);
}

// NoteCard component is now moved to Studio components
