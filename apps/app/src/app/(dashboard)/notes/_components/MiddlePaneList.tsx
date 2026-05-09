"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	AlertTriangle,
	Archive,
	ArrowLeft,
	Check,
	ChevronRight,
	ClipboardCopy,
	Copy,
	FileJson,
	FileText,
	Globe,
	Inbox,
	Info,
	Lightbulb,
	ListChecks,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatedIconButton } from "@/components/ui/animated-icon-button";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { FilterBadge } from "@/components/ui/filter-badge";
import { HoverSwapButton } from "@/components/ui/hover-swap-button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateNote } from "@/hooks/useNotesQuery";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import { createClient } from "@/utils/supabase/client";
import { getSafeUrl } from "@/utils/url";
import type { Draft, GroupedNotes, Note } from "../types";
import { NoteItem, SortableNoteItem } from "./NoteItem";

type Props = {
	items: (Note | Draft)[];
	groupedNotes: GroupedNotes;
	currentView: string | null;
	currentDomain: string | null;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
};

export function MiddlePaneList(props: Props) {
	const {
		items,
		groupedNotes,
		currentView,
		currentDomain,
		currentExact,
		selectedNoteId,
		selectedDraftId,
	} = props;
	const _isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const supabase = createClient();

	const currentQuery = searchParams.get("q") || "";
	const [inputValue, setInputValue] = useState(currentQuery);
	// 🚨 追加: 自分が最後にURLへプッシュした値を記録する
	const lastPushedQueryRef = useRef(currentQuery);

	// 1. URLの変化をローカルの状態に同期（外部からの変更、例えばタブ切り替え時のクリア用）
	useEffect(() => {
		// 🚨 重要: URLの値が「自分が直前に送った値」と異なる場合のみ同期する
		// これにより、入力中に自分の送った古いURL値で上書きされるのを防ぎます
		if (currentQuery !== lastPushedQueryRef.current) {
			setInputValue(currentQuery);
			lastPushedQueryRef.current = currentQuery;
		}
	}, [currentQuery]);

	// 2. ローカルの入力をURLに同期（デバウンス処理）
	useEffect(() => {
		const timer = setTimeout(() => {
			if (inputValue !== currentQuery) {
				// 🚨 URLを更新する前に「これは自分が送った値である」と記録する
				lastPushedQueryRef.current = inputValue;

				const params = new URLSearchParams(searchParams.toString());
				if (inputValue) params.set("q", inputValue);
				else params.delete("q");

				// Use replace to avoid polluting history with every keystroke
				router.replace(`${pathname}?${params.toString()}`);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [inputValue, currentQuery, pathname, searchParams, router]);

	const updateView = (newView: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("view", newView);
		// ビューの切り替え時は、コンテキストが混ざるのを防ぐため他の主要パラメータをリセットする
		params.delete("domain");
		params.delete("exact");
		params.delete("noteId");
		params.delete("draftId");
		params.delete("q"); // 検索も基本リセット推奨の仕様に合わせる

		router.push(`${pathname}?${params.toString()}`);
	};

	const updateParams = (key: string, value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value) params.set(key, value);
		else params.delete(key);
		router.push(`${pathname}?${params.toString()}`);
	};

	const handleBack = () => {
		const params = new URLSearchParams(searchParams.toString());
		if (currentExact) {
			// ページ一覧（または全ノート表示）からドメインルートに戻る
			params.delete("exact");
		} else if (currentDomain) {
			// ドメインルートからドメイン一覧に戻る
			params.delete("domain");
			params.set("view", "domains");
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	const [localItems, setLocalItems] = useState<(Note | Draft)[]>(items);
	const [prevItems, setPrevItems] = useState<(Note | Draft)[]>(items);

	if (items !== prevItems) {
		const validItems = items.filter((item) => item?.id);
		const uniqueItems = validItems.filter(
			(item, index, self) => index === self.findIndex((t) => t.id === item.id),
		);
		setPrevItems(items);
		setLocalItems(uniqueItems);
	}

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isDeletingBulk, setIsDeletingBulk] = useState(false);
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [showResolved, setShowResolved] = useState(false);
	const [filterType, setFilterType] = useState<
		"all" | "info" | "alert" | "idea"
	>("all");

	const [isCopyPopoverOpen, setIsCopyPopoverOpen] = useState(false);
	const [copiedType, setCopiedType] = useState<"text" | "json" | null>(null);

	const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

	const { mutate: updateNote } = useUpdateNote();

	const handleTodoToggle = (
		e: React.MouseEvent,
		noteId: string,
		currentResolved: boolean,
	) => {
		e.preventDefault();
		e.stopPropagation();
		updateNote({ id: noteId, updates: { is_resolved: !currentResolved } });
	};

	useEffect(() => {
		return () => {
			if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset state when navigation context changes
	useEffect(() => {
		setIsSelectMode(false);
		setSelectedIds(new Set());
		setFilterType("all");
	}, [currentView, currentDomain, currentExact]);

	const displayItems = localItems.filter((item) => {
		const isNote = "note_type" in item;
		if (isNote && item.is_resolved && !showResolved) return false;

		if (filterType !== "all") {
			if (!isNote || item.note_type !== filterType) return false;
		}

		return true;
	});

	const handleCopyAsText = async () => {
		// 未完了のノートのみを抽出
		const itemsToCopy = displayItems.filter(
			(item): item is Note => "note_type" in item && !item.is_resolved,
		);
		const text = itemsToCopy.map((item) => item.content).join("\n\n---\n\n");
		await navigator.clipboard.writeText(text);
		setCopiedType("text");

		if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
		copyTimerRef.current = setTimeout(() => {
			setIsCopyPopoverOpen(false);
			setCopiedType(null);
		}, 1000);
	};

	const handleCopyAsJson = async () => {
		// 未完了のノートのみを抽出し、AI連携用にデータを軽量化（type, contentのみ）
		const simplifiedItems = displayItems
			.filter((item): item is Note => "note_type" in item && !item.is_resolved)
			.map((note) => ({
				type: note.note_type,
				content: note.content,
			}));

		const json = JSON.stringify(simplifiedItems, null, 2);
		await navigator.clipboard.writeText(json);
		setCopiedType("json");

		if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
		copyTimerRef.current = setTimeout(() => {
			setIsCopyPopoverOpen(false);
			setCopiedType(null);
		}, 1000);
	};

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	const isSearchActive = !!searchParams.get("q") || !!searchParams.get("tags");
	const isSelected =
		!!currentView || !!currentDomain || !!currentExact || isSearchActive;

	const isShowingNotesList =
		currentView === "inbox" || (currentView === "domains" && !!currentExact);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = localItems.findIndex((item) => item.id === active.id);
		const newIndex = localItems.findIndex((item) => item.id === over.id);

		const updatedItems = arrayMove(localItems, oldIndex, newIndex);
		setLocalItems(updatedItems);

		let newOrder: number;

		if (newIndex === 0) {
			newOrder = (updatedItems[1] as Note).sort_order - 1;
		} else if (newIndex === updatedItems.length - 1) {
			newOrder = (updatedItems[newIndex - 1] as Note).sort_order + 1;
		} else {
			const prevOrder = (updatedItems[newIndex - 1] as Note).sort_order;
			const nextOrder = (updatedItems[newIndex + 1] as Note).sort_order;
			newOrder = (prevOrder + nextOrder) / 2;
		}

		const { error } = await supabase
			.from("sitecue_notes")
			.update({ sort_order: newOrder })
			.eq("id", active.id);

		if (error) {
			console.error("Failed to update sort order:", error);
			setLocalItems(items);
		} else {
			router.refresh();
		}
	};

	const handleDeleteSelected = async () => {
		if (selectedIds.size === 0) return;
		setIsDeletingBulk(true);
		try {
			const { error } = await supabase
				.from("sitecue_notes")
				.delete()
				.in("id", Array.from(selectedIds));

			if (error) throw error;

			setSelectedIds(new Set());
			router.refresh();
		} catch (err) {
			console.error("Failed to delete selected notes:", err);
			alert("Failed to delete selected notes.");
		} finally {
			setIsDeletingBulk(false);
		}
	};

	const toggleSelect = (id: string, checked: boolean) => {
		const newSelected = new Set(selectedIds);
		if (checked) {
			newSelected.add(id);
		} else {
			newSelected.delete(id);
		}
		setSelectedIds(newSelected);
	};

	return (
		<div className="flex flex-col h-full bg-base-bg md:border-r md:border-base-border md:w-96">
			{/* Header Controls (Blueprint) */}
			<div className="flex-shrink-0 p-4 space-y-3 border-b border-base-border">
				{/* Tabs & Top Actions */}
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-2">
						{/* 🚨 修正: ドリルダウン中のみ戻るボタンを表示 */}
						{currentDomain && currentDomain !== "inbox" && (
							<button
								type="button"
								onClick={handleBack}
								className="p-1.5 text-gray-400 hover:text-action rounded-md hover:bg-base-surface transition-colors animate-in fade-in zoom-in duration-200 cursor-pointer"
								title="Go back"
							>
								<ArrowLeft className="size-4" aria-hidden="true" />
							</button>
						)}

						{["inbox", "domains", "drafts"].map((view) => (
							<button
								key={view}
								type="button"
								onClick={() => updateView(view)}
								className={cn(
									"px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
									currentView === view ||
										(currentView === null && view === "inbox")
										? "bg-action text-action-text"
										: "text-base-content hover:bg-base-surface",
								)}
							>
								{view.charAt(0).toUpperCase() + view.slice(1)}
							</button>
						))}
					</div>
					{/* Action Buttons (Moved from internal header) */}
					{isSelected && (currentView !== "domains" || !!currentExact) && (
						<div className="flex items-center gap-1">
							<Link
								href={`/notes?domain=${currentDomain || "inbox"}${currentExact ? `&exact=${encodeURIComponent(currentExact)}` : ""}&new=note`}
								className="p-1.5 text-gray-400 hover:text-action rounded-md hover:bg-base-surface transition-colors"
								title="New Note here"
							>
								<Plus className="size-4" />
							</Link>
							<AnimatedIconButton
								type="button"
								onClick={() => {
									setIsSelectMode(!isSelectMode);
									if (!isSelectMode === false) setSelectedIds(new Set());
								}}
								isActive={isSelectMode}
								icon={<ListChecks className="size-4" aria-hidden="true" />}
								activeIcon={
									<ListChecks className="size-4" aria-hidden="true" />
								}
								className={cn(
									"cursor-pointer",
									isSelectMode
										? "text-neutral-900 bg-neutral-100"
										: "text-gray-400 hover:text-action",
								)}
								title="Select Mode"
							/>
							<Popover
								open={isCopyPopoverOpen}
								onOpenChange={setIsCopyPopoverOpen}
							>
								<PopoverTrigger
									render={
										<HoverSwapButton
											type="button"
											defaultIcon={
												<Copy className="size-4" aria-hidden="true" />
											}
											hoverIcon={
												<ClipboardCopy className="size-4" aria-hidden="true" />
											}
											disableSuccessState={true}
											className={cn(
												"transition-colors cursor-pointer",
												copiedType !== null
													? "text-note-info"
													: "text-gray-400 hover:text-action",
											)}
											title="Bulk Copy"
										/>
									}
								/>
								<PopoverContent className="w-48 p-2" align="end">
									<div className="flex flex-col gap-1">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleCopyAsText}
											className="flex items-center justify-start gap-2 w-full px-2 py-1.5 font-medium rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer"
										>
											{copiedType === "text" ? (
												<Check
													className="w-3.5 h-3.5 text-note-info"
													aria-hidden="true"
												/>
											) : (
												<FileText className="w-3.5 h-3.5" aria-hidden="true" />
											)}
											{copiedType === "text" ? "Copied!" : "as Text"}
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleCopyAsJson}
											className="flex items-center justify-start gap-2 w-full px-2 py-1.5 font-medium rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer"
										>
											{copiedType === "json" ? (
												<Check
													className="w-3.5 h-3.5 text-note-info"
													aria-hidden="true"
												/>
											) : (
												<FileJson className="w-3.5 h-3.5" aria-hidden="true" />
											)}
											{copiedType === "json" ? "Copied!" : "as JSON"}
										</Button>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					)}
				</div>

				{/* Search & Filters */}
				<div className="space-y-3">
					<div className="relative flex items-center">
						<Search
							className="absolute left-3 w-4 h-4 text-base-content opacity-50"
							aria-hidden="true"
						/>
						<input
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									updateParams("q", inputValue);
								}
							}}
							placeholder="Search notes..."
							className="w-full pl-9 pr-8 py-2 text-sm bg-base-surface border border-transparent focus:border-action rounded-md outline-none transition-colors"
						/>
						{inputValue && (
							<button
								type="button"
								onClick={() => {
									setInputValue("");
									updateParams("q", "");
								}}
								className="absolute right-2 p-1 text-base-content opacity-50 hover:opacity-100 hover:text-action transition-all cursor-pointer"
								aria-label="Clear search"
							>
								<X className="w-3.5 h-3.5" aria-hidden="true" />
							</button>
						)}
					</div>

					{/* Note Filters (Moved from internal header) */}
					{isSelected && currentView !== "drafts" && isShowingNotesList && (
						<div className="flex items-center justify-between w-full">
							<div className="flex items-center gap-0.5 bg-base-surface border border-base-border w-fit p-0.5 rounded-lg animate-in fade-in duration-200">
								<FilterBadge
									isActive={filterType === "all"}
									onClick={() => setFilterType("all")}
								>
									All
								</FilterBadge>
								<FilterBadge
									isActive={filterType === "info"}
									onClick={() => setFilterType("info")}
									icon={<Info className="w-3.5 h-3.5" aria-hidden="true" />}
									aria-label="Info"
								/>
								<FilterBadge
									isActive={filterType === "alert"}
									onClick={() => setFilterType("alert")}
									icon={
										<AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
									}
									aria-label="Alert"
								/>
								<FilterBadge
									isActive={filterType === "idea"}
									onClick={() => setFilterType("idea")}
									icon={
										<Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
									}
									aria-label="Idea"
								/>
							</div>
							<Button
								type="button"
								variant={showResolved ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setShowResolved(!showResolved)}
								className="transition-colors cursor-pointer text-xs font-bold text-gray-500 hover:text-action"
								title="Show Resolved Notes"
							>
								<Archive className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
								Resolved
							</Button>
						</div>
					)}
				</div>

				{/* Bulk Selection Bar */}
				{selectedIds.size > 0 && (
					<div className="flex items-center justify-between pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
						<span className="text-xs font-semibold text-action">
							{selectedIds.size} selected
						</span>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setSelectedIds(new Set())}
								className="text-gray-500 hover:text-action font-medium cursor-pointer"
								disabled={isDeletingBulk}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={handleDeleteSelected}
								className="flex items-center gap-1.5 font-bold cursor-pointer"
								disabled={isDeletingBulk}
							>
								<Trash2 className="w-3 h-3" aria-hidden="true" />
								{isDeletingBulk ? "Deleting..." : "Delete"}
							</Button>
						</div>
					</div>
				)}
			</div>

			<div className="flex-1 overflow-y-auto divide-y divide-base-border">
				{/* 1. Root Domains View */}
				{currentView === "domains" && !currentDomain ? (
					Object.entries(groupedNotes.domains)
						.filter(([domain]) => domain !== "inbox")
						.filter(
							([domain]) =>
								!currentQuery ||
								domain.toLowerCase().includes(currentQuery.toLowerCase()),
						)
						.map(([domain, data]) => (
							<Link
								key={domain}
								href={`/notes?domain=${domain}`}
								className="flex items-center justify-between p-4 hover-safe:bg-base-surface transition-colors group"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-base-surface rounded-lg group-hover-safe:bg-base-bg border border-base-border transition-colors">
										<Globe className="w-5 h-5 text-gray-400 group-hover-safe:text-action" />
									</div>
									<div className="flex flex-col">
										<span className="text-sm font-medium text-action truncate w-48">
											{domain}
										</span>
										<span className="text-xs text-gray-400">
											{data.domainNotes.length +
												Object.values(data.pages).flat().length}{" "}
											notes
										</span>
									</div>
								</div>
								<ChevronRight className="w-4 h-4 text-gray-300" />
							</Link>
						))
				) : currentDomain && currentDomain !== "inbox" && !currentExact ? (
					/* 2. Domain Pages View */
					<>
						{!currentQuery && (
							<Link
								href={`/notes?domain=${currentDomain}&exact=all`}
								className="flex items-center justify-between p-4 hover-safe:bg-base-surface transition-colors group"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-base-surface rounded-lg group-hover-safe:bg-base-bg border border-base-border transition-colors">
										<Globe className="w-5 h-5 text-note-info" />
									</div>
									<span className="text-sm font-medium text-action">
										Domain Notes
									</span>
								</div>
								<ChevronRight className="w-4 h-4 text-gray-300" />
							</Link>
						)}
						{Object.entries(groupedNotes.domains[currentDomain]?.pages || {})
							.filter(([url]) => {
								if (!currentQuery) return true;
								const safeUrl = getSafeUrl(url);
								const searchablePath = safeUrl
									? safeUrl.pathname + safeUrl.search
									: url;

								return searchablePath
									.toLowerCase()
									.includes(currentQuery.toLowerCase());
							})
							.map(([url, notes]) => {
								const safeUrl = getSafeUrl(url);
								const path = safeUrl ? safeUrl.pathname + safeUrl.search : url;
								return (
									<Link
										key={url}
										href={`/notes?domain=${currentDomain}&exact=${encodeURIComponent(url)}`}
										className="flex items-center justify-between p-4 hover-safe:bg-base-surface transition-colors group"
									>
										<div className="flex items-center gap-3 overflow-hidden">
											<div className="p-2 bg-base-surface rounded-lg group-hover-safe:bg-base-bg border border-base-border transition-colors shrink-0">
												<FileText className="w-5 h-5 text-gray-400 group-hover-safe:text-action" />
											</div>
											<div className="flex flex-col min-w-0">
												<span
													className="text-sm font-medium text-action truncate"
													title={url}
												>
													{path}
												</span>
												<span className="text-xs text-gray-400">
													{notes.length} notes
												</span>
											</div>
										</div>
										<ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
									</Link>
								);
							})}
					</>
				) : (
					/* 3. Note List View */
					<div className="flex flex-col h-full">
						{!isSelected ? (
							<div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
								<Inbox
									className="w-10 h-10 mb-4 text-gray-300"
									aria-hidden="true"
								/>
								<p className="text-sm font-medium">
									Please select a category from the list
								</p>
								<p className="text-xs mt-2">
									Select Inbox, Drafts, or a Domain
									<br />
									to see the list of items
								</p>
							</div>
						) : displayItems.length > 0 ? (
							<div className="divide-y divide-base-border">
								{currentView === "drafts" ? (
									displayItems.map((item) => (
										<NoteItem
											key={item.id}
											item={item}
											currentExact={currentExact}
											selectedNoteId={selectedNoteId}
											selectedDraftId={selectedDraftId}
											searchParams={searchParams}
											selectable={false}
											onTodoToggle={handleTodoToggle}
										/>
									))
								) : (
									<DndContext
										id="notes-dnd-context"
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragEnd={handleDragEnd}
									>
										<SortableContext
											items={displayItems.map((item) => item.id)}
											strategy={verticalListSortingStrategy}
										>
											{displayItems.map((item) => (
												<SortableNoteItem
													key={item.id}
													item={item}
													currentView={currentView}
													isSearchActive={isSearchActive}
													currentExact={currentExact}
													selectedNoteId={selectedNoteId}
													selectedDraftId={selectedDraftId}
													searchParams={searchParams}
													selectable={currentView !== "drafts" && isSelectMode}
													isSelected={selectedIds.has(item.id)}
													onSelectChange={toggleSelect}
													onTodoToggle={handleTodoToggle}
												/>
											))}
										</SortableContext>
									</DndContext>
								)}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-64 p-8 text-center text-gray-400">
								<Inbox
									className="w-12 h-12 mb-4 text-base-border"
									aria-hidden="true"
								/>
								<p className="text-sm">
									No {currentView === "drafts" ? "drafts" : "notes"} found for
									this category.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
