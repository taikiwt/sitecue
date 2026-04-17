"use client";

import { ArrowLeft, Check, Copy, MoreHorizontal, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StudioEditor } from "@/components/editor/StudioEditor";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import { createClient } from "@/utils/supabase/client";
import type { Draft, Note, Template } from "../../../../../types/app.ts";
import PaywallModal from "../studio/_components/PaywallModal";
import StudioMaterialsPane from "../studio/_components/StudioMaterialsPane";
import StudioReviewPane from "../studio/_components/StudioReviewPane";
import UndoRedoControls from "../studio/_components/UndoRedoControls";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";

type NoteType = "info" | "alert" | "idea";

interface DraftEditorProps {
	template?: Template | null;
	initialDraft?: Draft;
}

export default function DraftEditor({
	template,
	initialDraft,
}: DraftEditorProps) {
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const router = useRouter();
	const searchParams = useSearchParams();
	const supabase = createClient();
	const activePane = searchParams.get("pane") || "review";
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
		"idle",
	);
	const [activeTemplate, setActiveTemplate] = useState<
		Template | null | undefined
	>(template);
	const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] =
		useState(false);
	const [savedState, setSavedState] = useState({
		content: initialDraft?.content || template?.boilerplate || "",
		title: initialDraft?.title || "",
		slug: initialDraft?.metadata?.slug || "",
	});
	const [content, setContent] = useState(savedState.content);
	const [title, setTitle] = useState(savedState.title);
	const [slug, setSlug] = useState(savedState.slug);
	const [hasUnsavedNotesChanges, setHasUnsavedNotesChanges] = useState(false);

	// State for Self Review
	const [reviewNotes, setReviewNotes] = useState<Note[]>([]);
	const [isLoadingReview, setIsLoadingReview] = useState(true);
	const [deletedNoteIds, setDeletedNoteIds] = useState<string[]>([]);

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
		slug !== savedState.slug ||
		hasUnsavedNotesChanges;

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

			// Always keep in-memory for both New and Existing drafts (In-Memory First Pattern)
			const now = new Date().toISOString();
			const tempNote: Note = {
				id: crypto.randomUUID(),
				content,
				note_type: type,
				draft_id: initialDraft?.id || null, // Preserve draft_id if it exists
				scope: "draft",
				url_pattern: initialDraft?.id
					? `sitecue://draft/${initialDraft.id}`
					: "",
				user_id: user.id,
				created_at: now,
				updated_at: now,
				is_expanded: false,
				is_favorite: false,
				is_pinned: false,
				is_resolved: false,
				sort_order: reviewNotes.length,
			};
			setReviewNotes((prev) => [tempNote, ...prev]);
			setHasUnsavedNotesChanges(true);
		} catch (error) {
			console.error("Failed to add note:", error);
			throw error;
		}
	};

	const handleUpdateNote = (id: string, newContent: string) => {
		setReviewNotes((prev) =>
			prev.map((n) => (n.id === id ? { ...n, content: newContent } : n)),
		);
		setHasUnsavedNotesChanges(true);
	};

	const handleDeleteNote = (id: string) => {
		const noteToDelete = reviewNotes.find((n) => n.id === id);
		// Only track for DB deletion if it's already in the DB (has a draft_id from fetching)
		// Note: We'll assume if it was fetched, it has a draft_id.
		// If it's a newly added note in memory, its draft_id might be null or set but it won't be in the DB yet.
		// Actually, checking if it exists in DB is better by checking if it's NOT a randomUUID we just made.
		// But the prompt suggestion is noteToDelete?.draft_id.
		if (noteToDelete?.draft_id) {
			setDeletedNoteIds((prev) => [...prev, id]);
		}
		setReviewNotes((prev) => prev.filter((n) => n.id !== id));
		setHasUnsavedNotesChanges(true);
	};

	const handleDeleteAllNotes = () => {
		const dbNotesIds = reviewNotes.filter((n) => n.draft_id).map((n) => n.id);
		if (dbNotesIds.length > 0) {
			setDeletedNoteIds((prev) => [...prev, ...dbNotesIds]);
		}
		setReviewNotes([]);
		setHasUnsavedNotesChanges(true);
	};

	const handleReorderNotes = (newOrder: Note[]) => {
		setReviewNotes(newOrder);
		setHasUnsavedNotesChanges(true);
	};

	const handleInsertToEditor = (noteContent: string) => {
		const newContent = content ? `${content}\n\n${noteContent}` : noteContent;
		setContent(newContent);
		pushToHistory(newContent);
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
					template_id: activeTemplate?.id || null,
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
	const maxLength = activeTemplate?.max_length;

	const handleSave = async () => {
		setStatus("saving");
		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) throw new Error("Not authenticated");

			const metadata =
				activeTemplate?.name === "Zenn"
					? { slug }
					: initialDraft?.metadata || {};

			let currentDraftId = initialDraft?.id;

			if (currentDraftId) {
				const { error } = await supabase
					.from("sitecue_drafts")
					.update({
						title,
						content,
						template_id: activeTemplate?.id || null,
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
						template_id: activeTemplate?.id || null,
						metadata,
					})
					.select()
					.single();

				if (error) throw error;
				if (data) {
					currentDraftId = data.id;
				}
			}

			if (currentDraftId) {
				// 1. Handle Deletions
				if (deletedNoteIds.length > 0) {
					const { error: deleteError } = await supabase
						.from("sitecue_notes")
						.delete()
						.in("id", deletedNoteIds);
					if (deleteError)
						console.error("Failed to delete notes:", deleteError);
				}

				// 2. Handle Upserts (Additions & Updates)
				if (reviewNotes.length >= 0) {
					// biome-ignore lint/suspicious/noExplicitAny: Supabase upsert payload
					const notesToUpsert: any[] = reviewNotes.map((n, index) => ({
						id: n.id,
						content: n.content,
						note_type: n.note_type,
						draft_id: currentDraftId,
						scope: n.scope,
						url_pattern: n.draft_id
							? n.url_pattern
							: `sitecue://draft/${currentDraftId}`,
						user_id: user.id,
						sort_order: index,
						is_expanded: n.is_expanded || false,
						is_favorite: n.is_favorite || false,
						is_pinned: n.is_pinned || false,
						is_resolved: n.is_resolved || false,
					}));

					if (notesToUpsert.length > 0) {
						const { error: upsertError } = await supabase
							.from("sitecue_notes")
							.upsert(notesToUpsert);
						if (upsertError)
							console.error("Failed to sync notes:", upsertError);
					}
				}

				setDeletedNoteIds([]);
				setSavedState({ content, title, slug });
				setHasUnsavedNotesChanges(false);

				if (!initialDraft?.id) {
					router.push(`/studio/${currentDraftId}`);
				}
			}

			setStatus("success");
			setTimeout(() => {
				setStatus("idle");
			}, 2000);
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

	const handleTemplateSaved = async (newTemplate: Template) => {
		setActiveTemplate(newTemplate);
		setIsSaveTemplateDialogOpen(false);
		// If draft is already saved in DB, update its template_id immediately
		if (initialDraft?.id) {
			await supabase
				.from("sitecue_drafts")
				.update({ template_id: newTemplate.id })
				.eq("id", initialDraft.id);
		}
	};

	return (
		<div className="flex h-full overflow-hidden bg-base-bg text-action">
			{/* 左ペイン: メインエディタ */}
			<div className="flex flex-1 flex-col overflow-hidden border-r border-base-border bg-base-bg">
				<header
					className={cn(
						"flex items-center justify-between border-b border-neutral-100 px-6 py-4 transition-all duration-300",
						!isSidebarOpen && "md:pl-16",
					)}
				>
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleBack}
							className="text-neutral-400 -ml-2"
							aria-label="Go back"
						>
							<ArrowLeft className="w-5 h-5" aria-hidden="true" />
						</Button>
						<Link
							href="/"
							className="text-xl font-bold tracking-tight text-action transition-colors hover:text-gray-500 cursor-pointer block"
						>
							sitecue
						</Link>
						<div className="h-4 w-px bg-base-border" />
						<span className="text-sm font-medium text-action">
							{activeTemplate
								? `Draft for ${activeTemplate.name}`
								: initialDraft
									? "Edit Draft"
									: "New Blank Canvas"}
						</span>
					</div>

					<div className="flex items-center gap-4">
						<UndoRedoControls
							canUndo={historyIndex > 0}
							canRedo={historyIndex < history.length - 1}
							onUndo={handleUndo}
							onRedo={handleRedo}
						/>

						<Button
							onClick={handleSave}
							disabled={status === "saving" || status === "success"}
							size="sm"
							className="w-24 rounded-full"
							type="button"
						>
							{status === "saving" ? (
								"Saving..."
							) : status === "success" ? (
								<span className="flex items-center gap-1">
									<Check
										className="w-4 h-4 text-note-info"
										aria-hidden="true"
									/>
									Saved
								</span>
							) : (
								"Save"
							)}
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
										<MoreHorizontal className="w-5 h-5" aria-hidden="true" />
									</Button>
								}
							/>
							<PopoverContent align="end" className="w-48 p-2">
								<Button
									type="button"
									variant="ghost"
									className="w-full justify-start text-sm font-medium text-neutral-600 hover:text-action cursor-pointer"
									onClick={() => setIsSaveTemplateDialogOpen(true)}
								>
									Save as Template
								</Button>
							</PopoverContent>
						</Popover>
					</div>
				</header>

				<div className="border-b border-neutral-100 bg-neutral-50/50 px-8 py-6">
					{maxLength && (
						<div className="flex items-center justify-between mb-4">
							<span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
								Character Count
							</span>
							<span
								className={`text-2xl font-mono font-bold ${charCount > maxLength ? "text-note-alert" : "text-action"}`}
							>
								{charCount} / {maxLength}
							</span>
						</div>
					)}

					<div className="grid gap-4">
						<div className="flex items-center gap-2">
							<input
								type="text"
								placeholder={
									activeTemplate?.name === "Zenn"
										? "Enter article title..."
										: "Title (optional)"
								}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="w-full bg-transparent text-2xl font-bold placeholder:text-neutral-300 focus:outline-none"
							/>
							<InlineCopyButton text={title} />
						</div>
						{activeTemplate?.name === "Zenn" && (
							<div className="flex items-center gap-2 text-sm text-neutral-400">
								<span>slug:</span>
								<input
									type="text"
									placeholder="example-article-slug"
									value={slug}
									onChange={(e) => setSlug(e.target.value)}
									className="flex-1 bg-transparent font-mono focus:outline-none"
								/>
								<InlineCopyButton text={slug} />
							</div>
						)}
					</div>
				</div>

				<main className="flex-1 overflow-y-auto px-8 py-10">
					<div className="relative max-w-4xl mx-auto w-full">
						<div className="absolute top-4 right-4 z-10">
							<InlineCopyButton
								text={content}
								className="bg-white/80 backdrop-blur shadow-sm border border-neutral-100"
							/>
						</div>
						<StudioEditor
							value={content}
							onChange={(val) => setContent(val)}
							placeholder="Write down your thoughts..."
							isDirty={isDirty}
						/>
					</div>
				</main>
			</div>
			{/* 右ペイン: コンテキストバー (Desktop only) */}
			{isDesktop && (
				<aside className="w-96 flex-col overflow-hidden bg-base-surface border-l border-base-border flex">
					<header className="border-b border-base-border p-2">
						<div className="flex rounded-lg bg-base-border/50 p-1">
							<button
								type="button"
								onClick={() => updatePane("review")}
								className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
									activePane === "review"
										? "bg-base-bg text-action shadow-sm"
										: "text-gray-500 hover:text-action"
								}`}
							>
								SELF REVIEW
							</button>
							<button
								type="button"
								onClick={() => updatePane("materials")}
								className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
									activePane === "materials"
										? "bg-base-bg text-action shadow-sm"
										: "text-gray-500 hover:text-action"
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
								onUpdateNote={handleUpdateNote}
								onDeleteNote={handleDeleteNote}
								onDeleteAllNotes={handleDeleteAllNotes}
								onReorderNotes={handleReorderNotes}
								onInsertToEditor={handleInsertToEditor}
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

					<div className="border-t border-base-border p-4 text-center bg-base-bg/50">
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
								className="flex h-14 items-center justify-center gap-2 rounded-full bg-action px-6 text-action-text shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
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
													? "bg-base-bg text-action shadow-sm"
													: "text-gray-500 hover:text-action"
											}`}
										>
											SELF REVIEW
										</button>
										<button
											type="button"
											onClick={() => updatePane("materials")}
											className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
												activePane === "materials"
													? "bg-base-bg text-action shadow-sm"
													: "text-gray-500 hover:text-action"
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
											onUpdateNote={handleUpdateNote}
											onDeleteNote={handleDeleteNote}
											onDeleteAllNotes={handleDeleteAllNotes}
											onReorderNotes={handleReorderNotes}
											onInsertToEditor={handleInsertToEditor}
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

			<SaveAsTemplateDialog
				isOpen={isSaveTemplateDialogOpen}
				onOpenChange={setIsSaveTemplateDialogOpen}
				initialTitle={title}
				initialContent={content}
				onSuccess={handleTemplateSaved}
			/>
		</div>
	);
}

const InlineCopyButton = ({
	text,
	className,
}: {
	text: string;
	className?: string;
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={`p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer shrink-0 ${className || ""}`}
			title="Copy to clipboard"
			aria-label="Copy to clipboard"
		>
			{copied ? (
				<Check className="w-4 h-4 text-green-500" aria-hidden="true" />
			) : (
				<Copy className="w-4 h-4" aria-hidden="true" />
			)}
		</button>
	);
};
