"use client";

import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	Panel,
	Group as PanelGroup,
	Separator as PanelResizeHandle,
} from "react-resizable-panels";
import TextareaAutosize from "react-textarea-autosize";
import { StudioEditor } from "@/components/editor/StudioEditor";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { InlineCopyButton } from "@/components/ui/inline-copy-button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useDraftHistory } from "@/hooks/useDraftHistory";
import {
	useCreateDraft,
	useDeleteDraft,
	useUpdateDraft,
} from "@/hooks/useDraftsQuery";
import { useDeleteNotes, useUpsertNotes } from "@/hooks/useNotesQuery";
import { useStudioAI } from "@/hooks/useStudioAI";
import { useLayoutStore } from "@/store/useLayoutStore";
import { createClient } from "@/utils/supabase/client";
import { extractTags } from "@/utils/tags";
import type { Draft, Note, Template } from "../../../../../types/app.ts";
import { DraftEditorHeader } from "../studio/_components/DraftEditorHeader";
import PaywallModal from "../studio/_components/PaywallModal";
import StudioMaterialsPane from "../studio/_components/StudioMaterialsPane";
import StudioReviewPane from "../studio/_components/StudioReviewPane";

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

	// State for Quota
	const [plan, setPlan] = useState<"free" | "pro">("free");
	const [showPaywall, setShowPaywall] = useState(false);

	// Custom Hooks
	const {
		historyIndex,
		historyLength,
		pushToHistory,
		handleUndo: undoHistory,
		handleRedo: redoHistory,
	} = useDraftHistory(initialDraft?.content || template?.boilerplate || "");

	const {
		isWeaving,
		isGeneratingReview,
		generateWeave,
		generateReview,
		generateHint,
	} = useStudioAI();

	const createDraftMutation = useCreateDraft();
	const updateDraftMutation = useUpdateDraft();
	const deleteDraftMutation = useDeleteDraft();
	const upsertNotesMutation = useUpsertNotes();
	const deleteNotesMutation = useDeleteNotes();

	const isDirty =
		content !== savedState.content ||
		title !== savedState.title ||
		slug !== savedState.slug ||
		hasUnsavedNotesChanges;

	const handleDeleteDraft = async () => {
		if (!initialDraft?.id) return;
		if (!window.confirm("Are you sure you want to delete this draft?")) return;
		try {
			await deleteDraftMutation.mutateAsync(initialDraft.id);
			router.push("/");
			router.refresh();
		} catch (err) {
			console.error("Failed to delete draft:", err);
			alert("Failed to delete draft.");
		}
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
			}
		};
		fetchProfile();
	}, [supabase]);

	const handleUndo = useCallback(() => {
		const previousContent = undoHistory();
		if (previousContent !== null) setContent(previousContent);
	}, [undoHistory]);

	const handleRedo = useCallback(() => {
		const previousContent = redoHistory();
		if (previousContent !== null) setContent(previousContent);
	}, [redoHistory]);

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
		if (isWeaving) return;

		// Save current state before weave
		pushToHistory(content);

		const {
			newContent,
			planError,
			plan: errorPlan,
			error,
		} = await generateWeave(content, reviewNotes, activeTemplate);

		if (planError) {
			if (errorPlan) setPlan(errorPlan as "free" | "pro");
			setShowPaywall(true);
			return;
		}

		if (error) {
			return;
		}

		if (newContent) {
			setContent(newContent);
			pushToHistory(newContent);

			// Auto-Consume Review Notes
			const noteIdsToDelete = reviewNotes.map((note) => note.id);
			if (noteIdsToDelete.length > 0) {
				deleteNotesMutation.mutate(noteIdsToDelete);
			}
			setReviewNotes([]);
		}
	};

	const handleGenerateReview = async () => {
		if (isGeneratingReview) return;

		const {
			newNotes,
			planError,
			plan: errorPlan,
			error,
		} = await generateReview(content, initialDraft?.id);

		if (planError) {
			if (errorPlan) setPlan(errorPlan as "free" | "pro");
			setShowPaywall(true);
			return;
		}

		if (error) {
			return;
		}

		if (newNotes) {
			setReviewNotes((prev) => [...newNotes, ...prev]);
			setHasUnsavedNotesChanges(true);
		}
	};

	const handleGenerateHint = async (
		contextText: string,
		isExplicit: boolean = false,
	): Promise<string | null> => {
		return generateHint(contextText, isExplicit);
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

			const extractedTags = extractTags(content);
			let currentDraftId = initialDraft?.id;

			if (currentDraftId) {
				await updateDraftMutation.mutateAsync({
					id: currentDraftId,
					updates: {
						title,
						content,
						template_id: activeTemplate?.id || null,
						metadata,
						tags: extractedTags,
						updated_at: new Date().toISOString(),
					},
				});
			} else {
				const data = await createDraftMutation.mutateAsync({
					title,
					content,
					template_id: activeTemplate?.id || null,
					metadata,
					tags: extractedTags,
				});
				currentDraftId = data.id;
			}

			if (currentDraftId) {
				// 1. Handle Deletions
				if (deletedNoteIds.length > 0) {
					await deleteNotesMutation.mutateAsync(deletedNoteIds);
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
						await upsertNotesMutation.mutateAsync(notesToUpsert);
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
			await updateDraftMutation.mutateAsync({
				id: initialDraft.id,
				updates: { template_id: newTemplate.id },
			});
		}
	};

	return (
		<div className="flex-1 h-full w-full flex flex-col min-h-0 relative">
			<PanelGroup
				orientation="horizontal"
				className="flex-1 w-full h-full overflow-hidden bg-base-bg text-action"
			>
				{/* 左ペイン: メインエディタ */}
				<Panel
					defaultSize="65%"
					minSize="30%"
					className="flex h-full flex-col overflow-hidden border-r border-base-border bg-base-bg"
				>
					<DraftEditorHeader
						isSidebarOpen={isSidebarOpen}
						canUndo={historyIndex > 0}
						canRedo={historyIndex < historyLength - 1}
						onUndo={handleUndo}
						onRedo={handleRedo}
						onSave={handleSave}
						status={status}
						hasDraftId={!!initialDraft?.id}
						onSaveAsTemplate={() => setIsSaveTemplateDialogOpen(true)}
						onDeleteDraft={handleDeleteDraft}
					/>

					<main className="flex-1 overflow-y-auto px-8 py-10">
						<div className="relative max-w-4xl mx-auto w-full flex flex-col gap-8">
							{/* Metadata & Title Area */}
							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium text-neutral-500 uppercase tracking-widest">
										{activeTemplate
											? `Template: ${activeTemplate.name}`
											: "Blank Canvas"}
									</span>
									{maxLength && (
										<span
											className={`text-sm font-mono font-bold ${charCount > maxLength ? "text-note-alert" : "text-neutral-400"}`}
										>
											{charCount} / {maxLength}
										</span>
									)}
								</div>
								<div className="grid gap-4">
									<div className="flex items-start gap-2 group/title">
										<TextareaAutosize
											placeholder={
												activeTemplate?.name === "Zenn"
													? "Enter article title..."
													: "Title (optional)"
											}
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											className="w-full bg-transparent text-3xl md:text-4xl font-extrabold placeholder:text-neutral-300 focus:outline-none resize-none leading-tight"
										/>
										<InlineCopyButton
											text={title}
											className="mt-2 opacity-100 md:opacity-0 md:group-hover/title:opacity-100 transition-opacity"
										/>
									</div>
									{activeTemplate?.name === "Zenn" && (
										<div className="flex items-center gap-2 text-sm text-neutral-400 group/slug">
											<span>slug:</span>
											<input
												type="text"
												placeholder="example-article-slug"
												value={slug}
												onChange={(e) => setSlug(e.target.value)}
												className="flex-1 bg-transparent font-mono focus:outline-none"
											/>
											<InlineCopyButton
												text={slug}
												className="opacity-100 md:opacity-0 md:group-hover/slug:opacity-100 transition-opacity"
											/>
										</div>
									)}
								</div>
							</div>

							{/* Editor Area */}
							<div className="relative w-full">
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
									onGenerateHint={handleGenerateHint}
								/>
							</div>
						</div>
					</main>
				</Panel>
				{/* 右ペイン: コンテキストバー (Desktop only) */}
				{isDesktop && (
					<PanelResizeHandle className="w-1 bg-transparent hover:bg-neutral-200 active:bg-neutral-300 transition-colors cursor-col-resize" />
				)}
				{isDesktop && (
					<Panel
						defaultSize="35%"
						minSize="20%"
						maxSize="50%"
						className="flex h-full flex-col overflow-hidden bg-base-surface border-l border-base-border"
					>
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
									onGenerateReview={handleGenerateReview}
									isGeneratingReview={isGeneratingReview}
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
					</Panel>
				)}
			</PanelGroup>

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
											onGenerateReview={handleGenerateReview}
											isGeneratingReview={isGeneratingReview}
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
				plan={plan}
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
