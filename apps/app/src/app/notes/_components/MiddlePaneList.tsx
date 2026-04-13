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
	ArrowLeft,
	CheckSquare,
	GripVertical,
	Inbox,
	Info,
	Lightbulb,
	MapPin,
	Plus,
	Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";
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

const getNoteTypeStyles = (type: string | null) => {
	switch (type) {
		case "alert":
			return {
				className: "bg-rose-50 text-rose-500",
				Icon: AlertTriangle,
			};
		case "idea":
			return {
				className: "bg-amber-50 text-amber-500",
				Icon: Lightbulb,
			};
		default:
			return {
				className: "bg-blue-50 text-blue-500",
				Icon: Info,
			};
	}
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
	const searchParams = useSearchParams();
	const router = useRouter();
	const supabase = createClient();
	const [localItems, setLocalItems] = useState<(Note | Draft)[]>(items);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isDeletingBulk, setIsDeletingBulk] = useState(false);
	const [isSelectMode, setIsSelectMode] = useState(false);

	useEffect(() => {
		// Ensure items have an id and are unique to prevent key warnings and dnd-kit crashes
		const validItems = items.filter((item) => item?.id);
		const uniqueItems = validItems.filter(
			(item, index, self) => index === self.findIndex((t) => t.id === item.id),
		);
		setLocalItems(uniqueItems);
	}, [items]);

	// Reset Select Mode and selection state when category changes
	useEffect(() => {
		const _unused = { currentView, currentDomain, currentExact };
		setIsSelectMode(false);
		setSelectedIds(new Set());
	}, [currentView, currentDomain, currentExact]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	const isSelected = !!currentView || !!currentDomain || !!currentExact;

	const getTitle = () => {
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

		// Fractional Indexing Calculation
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
			setLocalItems(items); // Revert on error
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
		<div className="flex flex-col h-full bg-white border-r border-gray-200 w-96">
			<div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
				<div className="flex items-center justify-between">
					<h2
						className="text-lg font-bold text-gray-900 truncate"
						title={getTitle()}
					>
						{getTitle()}
					</h2>
					<div className="flex items-center gap-1">
						<Link
							href={`/notes?domain=${currentDomain || "inbox"}${currentExact ? `&exact=${encodeURIComponent(currentExact)}` : ""}&new=note`}
							className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors"
							title="New Note here"
						>
							<Plus className="w-4 h-4" />
						</Link>
						<button
							type="button"
							onClick={() => {
								setIsSelectMode(!isSelectMode);
								if (!isSelectMode === false) setSelectedIds(new Set());
							}}
							className={`p-1.5 rounded-md transition-colors cursor-pointer ${isSelectMode ? "bg-neutral-200 text-neutral-900" : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"}`}
							title="Select Mode"
						>
							<CheckSquare className="w-4 h-4" />
						</button>
					</div>
				</div>
				{selectedIds.size > 0 ? (
					<div className="flex items-center justify-between mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
						<span className="text-xs font-semibold text-neutral-900">
							{selectedIds.size} selected
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setSelectedIds(new Set())}
								className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition-colors cursor-pointer"
								disabled={isDeletingBulk}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDeleteSelected}
								className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
								disabled={isDeletingBulk}
							>
								<Trash2 className="w-3 h-3" aria-hidden="true" />
								{isDeletingBulk ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				) : (
					<p className="text-xs text-gray-500 mt-1">
						{isSelected
							? `${items.length} ${currentView === "drafts" ? "drafts" : "notes"}`
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
				) : items.length > 0 ? (
					<div className="divide-y divide-gray-100">
						{currentView === "drafts" ? (
							localItems.map((item) => (
								<NoteItem
									key={item.id}
									item={item}
									currentExact={currentExact}
									selectedNoteId={selectedNoteId}
									selectedDraftId={selectedDraftId}
									searchParams={searchParams}
									selectable={false}
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
									items={localItems.map((item) => item.id)}
									strategy={verticalListSortingStrategy}
								>
									{localItems.map((item) => (
										<SortableNoteItem
											key={item.id}
											item={item}
											currentView={currentView}
											currentExact={currentExact}
											selectedNoteId={selectedNoteId}
											selectedDraftId={selectedDraftId}
											searchParams={searchParams}
											selectable={currentView !== "drafts" && isSelectMode}
											isSelected={selectedIds.has(item.id)}
											onSelectChange={toggleSelect}
										/>
									))}
								</SortableContext>
							</DndContext>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-64 p-8 text-center text-gray-400">
						<Inbox
							className="w-12 h-12 mb-4 text-gray-200"
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
}) {
	const isNote = "note_type" in item;
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
			className={`group relative flex items-stretch transition-colors ${
				isActive ? "bg-neutral-100" : "hover:bg-neutral-50"
			}`}
		>
			{/* Left Action Area (DnD & Checkbox) */}
			<div className="flex items-center pl-2 shrink-0">
				{isSortable && isNote && (
					<button
						type="button"
						{...dragHandleProps}
						style={{ touchAction: "none" }}
						className="flex items-center justify-center p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
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
							className="w-4 h-4 cursor-pointer accent-neutral-900"
						/>
					</div>
				)}
			</div>

			<Link
				href={`/notes?${params.toString()}`}
				className="flex-1 block py-4 pr-4 pl-2"
			>
				<div className="flex justify-between items-start mb-1">
					{isNote ? (
						<span
							className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
								getNoteTypeStyles(item.note_type).className
							}`}
						>
							{(() => {
								const { Icon } = getNoteTypeStyles(item.note_type);
								return <Icon className="w-3.5 h-3.5" aria-hidden="true" />;
							})()}
							{item.note_type}
						</span>
					) : (
						<span className="bg-purple-50 text-purple-500 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">
							{item.target_platform || "draft"}
						</span>
					)}
					<span className="text-[10px] text-gray-400">
						{formatDate(isNote ? item.created_at : item.updated_at)}
					</span>
				</div>
				<h3 className="text-sm font-bold text-gray-900 truncate mb-0.5">
					{!isNote && (item.title || "Untitled Draft")}
				</h3>
				<p className="text-sm text-gray-900 line-clamp-2 wrap-break-word">
					{item.content}
				</p>
				{isNote && item.scope === "exact" && !currentExact && (
					<div className="mt-2 text-[10px] text-gray-400 truncate flex items-center gap-1">
						<MapPin className="w-3 h-3" aria-hidden="true" />
						{getSafeUrl(item.url_pattern)?.pathname ?? item.url_pattern}
					</div>
				)}
			</Link>
		</div>
	);
}

function SortableNoteItem({
	item,
	currentView,
	currentExact,
	selectedNoteId,
	selectedDraftId,
	searchParams,
	selectable,
	isSelected,
	onSelectChange,
}: {
	item: Note | Draft;
	currentView: string | null;
	currentExact: string | null;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
	searchParams: URLSearchParams;
	selectable?: boolean;
	isSelected?: boolean;
	onSelectChange?: (id: string, checked: boolean) => void;
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
				isSortable={currentView !== "drafts"}
				dragHandleProps={{ ...attributes, ...listeners }}
				selectable={selectable}
				isSelected={isSelected}
				onSelectChange={onSelectChange}
			/>
		</div>
	);
}
