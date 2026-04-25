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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	AlertTriangle,
	Archive,
	ArrowLeft,
	Copy,
	FileJson,
	FileText,
	GripVertical,
	Inbox,
	Info,
	Lightbulb,
	ListChecks,
	MapPin,
	Plus,
	Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { FilterBadge } from "@/components/ui/filter-badge";
import { NoteStatusBadge } from "@/components/ui/note-status-badge";
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
import type { Draft, Note } from "../types";

type Props = {
	items: (Note | Draft)[];
	currentView: string | null;
	currentDomain: string | null;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
};

const formatDate = (dateStr: string) => {
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export function MiddlePaneList(props: Props) {
	const {
		items,
		currentView,
		currentDomain,
		currentExact,
		selectedNoteId,
		selectedDraftId,
	} = props;
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const searchParams = useSearchParams();
	const router = useRouter();
	const supabase = createClient();
	const [localItems, setLocalItems] = useState<(Note | Draft)[]>(items);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isDeletingBulk, setIsDeletingBulk] = useState(false);
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [showResolved, setShowResolved] = useState(false);
	const [filterType, setFilterType] = useState<
		"all" | "info" | "alert" | "idea"
	>("all");

	// ★ 修正箇所：親コンポーネントでフックを1回だけ呼び出す
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
		const validItems = items.filter((item) => item?.id);
		const uniqueItems = validItems.filter(
			(item, index, self) => index === self.findIndex((t) => t.id === item.id),
		);
		setLocalItems(uniqueItems);
	}, [items]);

	useEffect(() => {
		const _unused = { currentView, currentDomain, currentExact };
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
		const text = displayItems.map((item) => item.content).join("\n\n---\n\n");
		await navigator.clipboard.writeText(text);
		toast.success("Copied as Text");
	};

	const handleCopyAsJson = async () => {
		const json = JSON.stringify(displayItems, null, 2);
		await navigator.clipboard.writeText(json);
		toast.success("Copied as JSON");
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

	const getTitle = () => {
		if (isSearchActive && !currentDomain && !currentExact) {
			return "Search Results";
		}
		if (currentView === "drafts") return "Drafts";
		if (currentExact) {
			const safeUrl = getSafeUrl(currentExact);
			if (safeUrl) {
				return safeUrl.pathname + safeUrl.search;
			}
			return currentExact;
		}
		if (currentDomain === "inbox") return "Inbox";
		if (currentDomain) return currentDomain;
		return "Notes";
	};

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
		<div className="flex flex-col h-full bg-base-bg border-r border-base-border w-96">
			<div
				className={cn(
					"p-4 border-b border-base-border sticky top-0 bg-base-bg z-10 transition-all duration-300",
					!isSidebarOpen && "md:pl-16",
				)}
			>
				<div className="flex items-center justify-between">
					<h2
						className="text-lg font-bold text-action truncate"
						title={getTitle()}
					>
						{getTitle()}
					</h2>
					{currentView !== "drafts" && (
						<div className="flex items-center gap-1">
							<Link
								href={`/notes?domain=${currentDomain || "inbox"}${currentExact ? `&exact=${encodeURIComponent(currentExact)}` : ""}&new=note`}
								className="p-1.5 text-gray-400 hover:text-action rounded-md hover:bg-base-surface transition-colors"
								title="New Note here"
							>
								<Plus className="w-4 h-4" />
							</Link>
							<Button
								type="button"
								variant={isSelectMode ? "secondary" : "ghost"}
								size="icon-sm"
								onClick={() => {
									setIsSelectMode(!isSelectMode);
									if (!isSelectMode === false) setSelectedIds(new Set());
								}}
								className="transition-colors cursor-pointer"
								title="Select Mode"
							>
								<ListChecks className="w-4 h-4" aria-hidden="true" />
							</Button>
							<Popover>
								<PopoverTrigger
									render={
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="text-gray-400 hover:text-action cursor-pointer"
											title="Bulk Copy"
										>
											<Copy className="w-4 h-4" />
										</Button>
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
											<FileText className="w-3.5 h-3.5" aria-hidden="true" />
											as Text
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={handleCopyAsJson}
											className="flex items-center justify-start gap-2 w-full px-2 py-1.5 font-medium rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer"
										>
											<FileJson className="w-3.5 h-3.5" aria-hidden="true" />
											as JSON
										</Button>
									</div>
								</PopoverContent>
							</Popover>
						</div>
					)}
				</div>
				{currentView !== "drafts" && (
					<div className="mt-3 flex items-center justify-between w-full">
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
								icon={<Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />}
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
				{selectedIds.size > 0 ? (
					<div className="flex items-center justify-between mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
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
				) : (
					<p className="text-xs text-gray-500 mt-1">
						{isSelected
							? `${displayItems.length} ${currentView === "drafts" ? "drafts" : "notes"}`
							: "Waiting for selection"}
					</p>
				)}
			</div>

			<div className="flex-1 overflow-y-auto">
				{!isSelected ? (
					<div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
						<ArrowLeft
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
							No {currentView === "drafts" ? "drafts" : "notes"} found for this
							category.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

function NoteItem({
	item,
	currentExact,
	selectedNoteId,
	selectedDraftId,
	searchParams,
	isSortable = false,
	dragHandleProps = {},
	selectable = false,
	isSelected = false,
	onSelectChange,
	onTodoToggle,
}: {
	item: Note | Draft;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
	searchParams: URLSearchParams;
	isSortable?: boolean;
	dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
	selectable?: boolean;
	isSelected?: boolean;
	onSelectChange?: (id: string, checked: boolean) => void;
	onTodoToggle?: (e: React.MouseEvent, id: string, resolved: boolean) => void;
}) {
	const isNote = "note_type" in item;
	const isResolved = isNote && item.is_resolved;
	const isActive = isNote
		? selectedNoteId === item.id
		: selectedDraftId === item.id;

	const params = new URLSearchParams(searchParams.toString());
	if (isNote) {
		params.set("noteId", item.id);
		params.delete("draftId");
	} else {
		params.set("draftId", item.id);
		params.delete("noteId");
	}

	return (
		<div
			className={`group/card relative flex items-stretch transition-colors ${
				isActive ? "bg-base-surface" : "hover:bg-base-surface/50"
			} ${isResolved ? "opacity-50" : ""}`}
		>
			{/* 透明なリンクを絶対配置(absolute)にしてカード全体を覆う（HTML規約違反を回避） */}
			<Link
				href={`/notes?${params.toString()}`}
				className="absolute inset-0 z-0"
				aria-label="View details"
			/>

			{/* ドラッグやチェックボックスはリンクより上の層(z-10)に浮かせる */}
			<div className="flex items-center pl-2 shrink-0 relative z-10 pointer-events-auto">
				{isSortable && isNote && (
					<button
						type="button"
						{...dragHandleProps}
						style={{ touchAction: "none" }}
						className="flex items-center justify-center p-1 text-base-border hover:text-action opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
						aria-label="Drag to reorder"
					>
						<GripVertical className="w-4 h-4" aria-hidden="true" />
					</button>
				)}
				{!isSortable && isNote && <div className="w-6" />}

				{selectable && (
					<div className="flex items-center justify-center px-1">
						<input
							type="checkbox"
							checked={isSelected}
							onChange={(e) => onSelectChange?.(item.id, e.target.checked)}
							onPointerDown={(e) => e.stopPropagation()}
							className="w-4 h-4 cursor-pointer accent-action"
						/>
					</div>
				)}
			</div>

			{/* テキスト領域はクリックを透過させ、TODOボタンだけクリックを受け付ける */}
			<div className="flex-1 block py-4 pr-4 pl-2 pointer-events-none relative z-10">
				<div className="flex justify-between items-start mb-1">
					{isNote ? (
						<NoteStatusBadge
							type={item.note_type ?? "info"}
							isResolved={item.is_resolved}
							onClick={(e) => {
								e.preventDefault();
								onTodoToggle?.(e, item.id, item.is_resolved);
							}}
						/>
					) : (
						<span className="relative z-10 bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
							{!item.title && !item.content ? "NEW" : "DRAFT"}
						</span>
					)}
					<span className="text-[10px] text-gray-400">
						{formatDate(isNote ? item.created_at : item.updated_at)}
					</span>
				</div>
				<h3
					className={`text-sm font-bold text-action truncate mb-0.5 ${isResolved ? "line-through" : ""}`}
				>
					{!isNote && (item.title || "Untitled Draft")}
				</h3>
				<p
					className={`text-sm text-action line-clamp-2 wrap-break-word ${isResolved ? "line-through" : ""}`}
				>
					{item.content}
				</p>
				{isNote && item.scope === "exact" && !currentExact && (
					<div className="mt-2 text-[10px] text-gray-400 truncate flex items-center gap-1 relative z-10 pointer-events-none">
						<MapPin className="w-3 h-3" aria-hidden="true" />
						{getSafeUrl(item.url_pattern)?.pathname ?? item.url_pattern}
					</div>
				)}
			</div>
		</div>
	);
}

function SortableNoteItem({
	item,
	currentView,
	isSearchActive,
	currentExact,
	selectedNoteId,
	selectedDraftId,
	searchParams,
	selectable,
	isSelected,
	onSelectChange,
	onTodoToggle,
}: {
	item: Note | Draft;
	currentView: string | null;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
	searchParams: URLSearchParams;
	isSearchActive: boolean;
	selectable?: boolean;
	isSelected?: boolean;
	onSelectChange?: (id: string, checked: boolean) => void;
	onTodoToggle?: (e: React.MouseEvent, id: string, resolved: boolean) => void;
}) {
	const {
		setNodeRef,
		transform,
		transition,
		isDragging,
		attributes,
		listeners,
	} = useSortable({
		id: item.id,
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		zIndex: isDragging ? 50 : undefined,
		position: "relative" as const,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<NoteItem
				item={item}
				currentExact={currentExact}
				selectedNoteId={selectedNoteId}
				selectedDraftId={selectedDraftId}
				searchParams={searchParams}
				isSortable={currentView !== "drafts" && !isSearchActive}
				dragHandleProps={{ ...attributes, ...listeners }}
				selectable={selectable}
				isSelected={isSelected}
				onSelectChange={onSelectChange}
				onTodoToggle={onTodoToggle}
			/>
		</div>
	);
}
