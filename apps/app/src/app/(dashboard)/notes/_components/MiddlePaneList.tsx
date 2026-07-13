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
import { type Diary, getSafeUrl } from "@sitecue/shared";
import {
	ArrowLeft,
	Check,
	ChevronRight,
	ClipboardCopy,
	Copy,
	FileJson,
	FileText,
	Globe,
	Inbox,
	ListChecks,
	Plus,
	SquareCheckBig,
	Trash2,
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
import { SearchInputBase } from "@/components/ui/search-input-base";
import { useUpdateNote } from "@/hooks/useNotesQuery";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import { createClient } from "@/utils/supabase/client";
import { DomainFavicon } from "../../_components/DomainFavicon";
import type { Draft, GroupedNotes, Note } from "../types";
import { NoteItem, SortableNoteItem } from "./NoteItem";

const MONTH_MAP: Record<string, string> = {
	"01": "Jan",
	"02": "Feb",
	"03": "Mar",
	"04": "Apr",
	"05": "May",
	"06": "Jun",
	"07": "Jul",
	"08": "Aug",
	"09": "Sep",
	"10": "Oct",
	"11": "Nov",
	"12": "Dec",
};

type Props = {
	items: (Note | Draft | Diary)[];
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
	const diaries = items.filter(
		(item): item is Diary => "date" in item && !("note_type" in item),
	);
	const currentYear = searchParams.get("year");
	const currentMonth = searchParams.get("month");

	const currentQuery = searchParams.get("q") || "";

	const [inputValue, setInputValue] = useState(currentQuery);
	const query = inputValue.toLowerCase().trim();
	const [isSearchExpanded, _setIsSearchExpanded] = useState(!!currentQuery);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// 1. 【パッシブ初期化】外部（SearchModalやURL直打ち）から検索クエリ（q）を持ち込まれた場合のみ、
	// 初回マウント時または外部からの強烈なURL変更時に優しく検索窓へ値を復元してあげる（IME妨害ガード付き）
	useEffect(() => {
		if (
			searchInputRef.current &&
			document.activeElement === searchInputRef.current
		) {
			return;
		}
		const currentQ = searchParams.get("q") || "";
		setInputValue(currentQ);
	}, [searchParams]);

	const prevContextRef = useRef({
		view: currentView,
		domain: currentDomain,
		exact: currentExact,
	});
	// 2. 【ノイズキャンセリング】中ペインの階層コンテキスト（タブビュー、ドメイン、個別ページ）が
	// 切り替わったアクションを検知した際は、古い入力文字が次のリストを不正に消し込むのを防ぐため、
	// 即座に検索窓のローカル文字状態を安全に自動リセット（空文字化）する
	useEffect(() => {
		const prev = prevContextRef.current;
		if (
			prev.view !== currentView ||
			prev.domain !== currentDomain ||
			prev.exact !== currentExact
		) {
			setInputValue("");
		}
		prevContextRef.current = {
			view: currentView,
			domain: currentDomain,
			exact: currentExact,
		};
	}, [currentView, currentDomain, currentExact]);

	const updateView = (newView: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("view", newView);
		// ビューの切り替え時は、コンテキストが混ざるのを防ぐため他の主要パラメータをリセットする
		params.delete("domain");
		params.delete("exact");
		params.delete("noteId");
		params.delete("draftId");
		params.delete("date");
		params.delete("q"); // 検索も基本リセット推奨の仕様に合わせる

		if (newView === "diaries") {
			if (!params.has("year") || !params.has("month")) {
				const now = new Date();
				const yyyy = now.getFullYear().toString();
				const mm = String(now.getMonth() + 1).padStart(2, "0");
				params.set("year", yyyy);
				params.set("month", mm);
			}
		} else {
			params.delete("year");
			params.delete("month");
		}

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
		if (currentView === "diaries") {
			if (currentMonth) {
				params.delete("month");
			} else if (currentYear) {
				params.delete("year");
			}
		} else {
			if (currentExact) {
				// ページ一覧（または全ノート表示）からドメインルートに戻る
				params.delete("exact");
			} else if (currentDomain) {
				// ドメインルートからドメイン一覧に戻る
				params.delete("domain");
				params.set("view", "domains");
			}
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	const [localItems, setLocalItems] = useState<(Note | Draft | Diary)[]>(items);
	const [prevItems, setPrevItems] = useState<(Note | Draft | Diary)[]>(items);

	if (items !== prevItems) {
		const validItems = items.filter(
			(item) => item && ("id" in item || "date" in item),
		);
		const uniqueItems = validItems.filter(
			(item, index, self) =>
				index ===
				self.findIndex((t) => {
					if ("id" in t && "id" in item) return t.id === item.id;
					if ("date" in t && "date" in item) return t.date === item.date;
					return false;
				}),
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

	const { mutateAsync: updateNote } = useUpdateNote();

	const handleTodoToggle = (
		e: React.MouseEvent,
		noteId: string,
		currentResolved: boolean,
	) => {
		e.preventDefault();
		e.stopPropagation();
		void updateNote({ id: noteId, updates: { is_resolved: !currentResolved } });
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

	useEffect(() => {
		if (isSearchExpanded && searchInputRef.current) {
			const timer = setTimeout(() => {
				searchInputRef.current?.focus();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [isSearchExpanded]);

	const displayItems = localItems.filter((item): item is Note | Draft => {
		const isDiary = "date" in item && !("note_type" in item);
		if (isDiary) return false;

		const isNote = "note_type" in item;
		if (isNote && item.is_resolved && !showResolved) return false;

		if (filterType !== "all") {
			if (!isNote || item.note_type !== filterType) return false;
		}

		return true;
	});

	const searchedDisplayItems = displayItems.filter((item) => {
		if (!query) return true;
		const contentMatch =
			"content" in item && item.content?.toLowerCase().includes(query);
		const titleMatch =
			"title" in item && item.title?.toLowerCase().includes(query);
		const tagsMatch =
			"tags" in item && item.tags?.some((t) => t.toLowerCase().includes(query));
		return contentMatch || titleMatch || tagsMatch;
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

	const isSearchActive = !!inputValue || !!searchParams.get("tags");
	const isSelected =
		!!currentView || !!currentDomain || !!currentExact || isSearchActive;

	const _isShowingNotesList =
		currentView === "inbox" || (currentView === "domains" && !!currentExact);

	const isDiariesView = currentView === "diaries";
	const plusHref = isDiariesView
		? "/notes?view=diaries&globalNew=note&intent=diary"
		: `/notes?domain=${currentDomain || "inbox"}${currentExact ? `&exact=${encodeURIComponent(currentExact)}` : ""}&new=note`;
	const plusTitle = isDiariesView ? "New Diary Log" : "New Note here";

	const isRouteDomains = currentView === "domains" && !currentDomain;
	const showActionGroup =
		isSelected &&
		currentView !== "drafts" &&
		currentView !== "diaries" &&
		!isRouteDomains;

	// 2段目のデッドスペースを埋めるためのビュー説明文言（英語）の導出
	const getContextTitle = (): string | null => {
		if (currentView === "domains" && !currentDomain) return "Domain List";
		if (currentView === "drafts") return "Draft List";
		if (currentView === "diaries" && (!currentYear || !currentMonth))
			return "Diary Archive";
		return null;
	};

	const contextTitle = getContextTitle();
	// 2段目に通常の操作要素（フィルターやボタン）が表示されるかどうかの判定
	const hasTier2Controls =
		isSelected &&
		currentView !== "drafts" &&
		currentView !== "diaries" &&
		!isRouteDomains;
	const hasBackButton =
		(currentDomain && currentDomain !== "inbox") ||
		(currentView === "diaries" && (currentYear || currentMonth));

	const [isSorting, setIsSorting] = useState(false);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || isSorting) return;

		// 1. 全件配列（localItems）における正確な物理インデックスを素直に特定
		const oldIndex = localItems.findIndex(
			(item) => "id" in item && item.id === active.id,
		);
		const newIndex = localItems.findIndex(
			(item) => "id" in item && item.id === over.id,
		);

		if (oldIndex === -1 || newIndex === -1) return;
		if (oldIndex === newIndex) return;

		// 2. 💡 余計なソートや表示空間の仮想計算を全廃棄し、全件配列に対して直接生の arrayMove を適用
		// これにより画面上の見た目の動きと全件データ構造が 100% 完全同期する
		const updatedItems = arrayMove(localItems, oldIndex, newIndex);

		// 移動完了した要素の新しい物理インデックスを特定
		const movedIndex = updatedItems.findIndex(
			(item) => "id" in item && item.id === active.id,
		);

		if (movedIndex === -1) return;

		let newOrder: number;
		const OFFSET = 0.0001;
		const EPSILON = 1e-9;

		if (movedIndex === 0) {
			// 配列の先頭に移動した場合
			const nextOrder = (updatedItems[1] as Note)?.sort_order ?? 0;
			newOrder = nextOrder - 1.0;
		} else if (movedIndex === updatedItems.length - 1) {
			// 配列の末尾に移動した場合
			const prevOrder = (updatedItems[movedIndex - 1] as Note)?.sort_order ?? 0;
			newOrder = prevOrder + 1.0;
		} else {
			// 中間に挟まる場合、移動後の物理的な「すぐ上」と「すぐ下」の要素から正確に sort_order を抽出
			const prevOrder = (updatedItems[movedIndex - 1] as Note)?.sort_order ?? 0;
			const nextOrder = (updatedItems[movedIndex + 1] as Note)?.sort_order ?? 0;

			// 同値衝突時の方向性防壁ロジック
			if (Math.abs(prevOrder - nextOrder) < EPSILON) {
				if (oldIndex > newIndex) {
					// 下から上へ引き揚げた時 ➔ 直後の要素のさらに上（小さな値へ）
					newOrder = nextOrder - OFFSET;
				} else {
					// 上から下へ引きずり下ろした時 ➔ 直前の要素의 さらに下（大きな値へ）
					newOrder = prevOrder + OFFSET;
				}
			} else {
				newOrder = (prevOrder + nextOrder) / 2.0;
			}
		}

		// 3. 楽観的UI更新: 移動した要素の sort_order のみをピンポイントで書き換え、そのまま状態を確定
		const targetItem = updatedItems[movedIndex];
		if (targetItem && "sort_order" in targetItem) {
			(targetItem as Note).sort_order = newOrder;
		}
		setLocalItems(updatedItems);

		// 4. ソフトウェアロックの有効化と通信 of 直列解決
		setIsSorting(true);
		try {
			await updateNote({
				id: active.id as string,
				updates: { sort_order: newOrder },
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to update note order:", error);
			setLocalItems(items); // ロールバック
		} finally {
			setIsSorting(false);
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
			{/* Morphing Header Container */}
			<div className="flex-shrink-0 p-4 space-y-3 border-b border-base-border bg-base-bg">
				{/* 1段目：メインナビゲーション（4つ1行・大きめの左寄せカプセル構造） */}
				<div className="flex justify-start w-full items-center h-11">
					<div className="grid grid-cols-4 gap-1 w-full bg-base-surface rounded-full border-none">
						{["domains", "inbox", "drafts", "diaries"].map((view) => (
							<button
								key={view}
								type="button"
								onClick={() => updateView(view)}
								className={cn(
									"px-1 py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer text-center",
									currentView === view ||
										(currentView === null && view === "domains")
										? "bg-action text-action-text shadow-sm"
										: "text-neutral-500 hover:text-action hover:bg-base-bg/60",
								)}
							>
								{view.charAt(0).toUpperCase() + view.slice(1)}
							</button>
						))}
					</div>
				</div>

				{/* 2段目：コントロール操作バー */}
				<div className="flex items-center justify-between w-full min-h-9 gap-2 relative">
					{/* 戻るボタン */}
					<div className="flex items-center min-w-[32px] relative z-10">
						{hasBackButton && (
							<button
								type="button"
								onClick={handleBack}
								className="p-1.5 text-gray-400 hover:text-action rounded-full hover:bg-base-surface transition-colors animate-in fade-in zoom-in duration-200 cursor-pointer border border-base-border bg-base-bg"
								title="Go back"
							>
								<ArrowLeft className="size-4" aria-hidden="true" />
							</button>
						)}
					</div>

					{/* 一体型セグメントフィルター または ビュー説明文言（絶対中央配置化） */}
					<div
						className={cn(
							"flex items-center justify-center",
							hasTier2Controls
								? "flex-1 mx-auto"
								: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full pointer-events-none",
						)}
					>
						{hasTier2Controls ? (
							<div className="flex items-center gap-0.5 bg-base-surface p-2 rounded-full animate-in fade-in duration-200">
								<FilterBadge
									isActive={filterType === "all"}
									onClick={() => setFilterType("all")}
									className="rounded-full px-2.5 py-1 text-xs"
								>
									All
								</FilterBadge>
								<FilterBadge
									isActive={filterType === "info"}
									onClick={() => setFilterType("info")}
									className="rounded-full px-2.5 py-1 text-xs"
								>
									Info
								</FilterBadge>
								<FilterBadge
									isActive={filterType === "alert"}
									onClick={() => setFilterType("alert")}
									className="rounded-full px-2.5 py-1 text-xs"
								>
									Alert
								</FilterBadge>
								<FilterBadge
									isActive={filterType === "idea"}
									onClick={() => setFilterType("idea")}
									className="rounded-full px-2.5 py-1 text-xs"
								>
									Idea
								</FilterBadge>
							</div>
						) : (
							contextTitle && (
								<span className="text-xs font-bold text-gray-400 tracking-wide uppercase animate-in fade-in duration-300  bg-base-surface rounded-full py-1 px-4">
									{contextTitle}
								</span>
							)
						)}
					</div>

					{/* 右端アクション：Resolved トグルのみ（検索ボタンは廃止） */}
					<div className="flex items-center gap-1 justify-end min-w-[32px] relative z-10">
						{isSelected &&
							currentView !== "drafts" &&
							currentView !== "diaries" &&
							!isRouteDomains && (
								<button
									type="button"
									onClick={() => setShowResolved(!showResolved)}
									className={cn(
										"p-1.5 rounded-full border transition-colors cursor-pointer",
										showResolved
											? "bg-action text-action-text border-action"
											: "bg-base-bg text-gray-400 border-base-border hover:text-action hover:bg-base-surface",
									)}
									title="Show Resolved Notes"
								>
									<SquareCheckBig className="w-4 h-4" aria-hidden="true" />
								</button>
							)}
					</div>
				</div>

				{/* 3段目：可変検索窓 ＆ アクションボタン群の「常時1行横並び」エリア */}
				<div className="flex items-center w-full gap-2 animate-in fade-in duration-300">
					{/* 検索窓コンテナ (flex-1 により、右側が消えたら自動的にフル幅へモーフィング) */}
					<div className="flex-1 min-w-0">
						<SearchInputBase
							ref={searchInputRef}
							value={inputValue}
							onChange={setInputValue} // リアルタイムにローカルStateを更新
							onClear={() => {
								setInputValue("");
								// 外部（SearchModal等）から持ち込まれたURLのqが存在する場合のみ、優しくクリアしてあげる
								const params = new URLSearchParams(searchParams.toString());
								if (params.has("q")) {
									params.delete("q");
									router.replace(`${pathname}?${params.toString()}`);
								}
							}}
							onSubmit={() => {
								searchInputRef.current?.blur(); // エンター時は入力を確定させてフォーカスを外すだけ
							}}
							placeholder="Search notes..."
							className="rounded-full text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-border/50"
							autoFocus={false}
						/>
					</div>

					{/* アクションボタン群 */}
					{showActionGroup && (
						<div className="flex items-center gap-1 p-1 rounded-full shrink-0">
							<Link
								href={plusHref}
								className="p-1.5 text-gray-400 hover:text-action rounded-full hover:bg-base-surface transition-colors flex items-center justify-center w-7 h-7"
								title={plusTitle}
							>
								<Plus className="size-4" />
							</Link>

							<AnimatedIconButton
								type="button"
								onClick={() => {
									setIsSelectMode(!isSelectMode);
									if (isSelectMode) setSelectedIds(new Set());
								}}
								isActive={isSelectMode}
								icon={<ListChecks className="size-4" aria-hidden="true" />}
								activeIcon={
									<ListChecks className="size-4" aria-hidden="true" />
								}
								className={cn(
									"cursor-pointer rounded-full p-1 flex items-center justify-center w-7 h-7",
									isSelectMode
										? "text-neutral-900 bg-base-bg shadow-sm"
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
												"transition-colors cursor-pointer rounded-full p-1 flex items-center justify-center w-7 h-7",
												copiedType !== null
													? "text-note-info"
													: "text-gray-400 hover:text-action",
											)}
											title="Bulk Copy"
										/>
									}
								/>
								<PopoverContent className="w-48 p-2 rounded-xl" align="end">
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

				{/* 4段目：一括操作バー（Bulk Actions） */}
				{selectedIds.size > 0 && (
					<div className="flex items-center justify-between pt-1 border-t border-base-border border-dashed animate-in fade-in slide-in-from-top-1 duration-200">
						<span className="text-xs font-semibold text-action">
							{selectedIds.size} selected
						</span>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setSelectedIds(new Set())}
								className="text-gray-500 hover:text-action font-medium cursor-pointer rounded-full px-3"
								disabled={isDeletingBulk}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={handleDeleteSelected}
								className="flex items-center gap-1.5 font-bold cursor-pointer rounded-full px-3"
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
				{/* Diaries View */}
				{currentView === "diaries" ? (
					(() => {
						const years = Array.from(
							new Set(diaries.map((d) => d.date.split("-")[0])),
						).sort((a, b) => b.localeCompare(a));
						const filteredYears = years.filter(
							(year) => !query || year.includes(query),
						);
						if (!currentYear) {
							return filteredYears.length > 0 ? (
								filteredYears.map((year) => (
									<button
										key={year}
										type="button"
										onClick={() => updateParams("year", year)}
										className="w-full flex items-center justify-between p-4 hover-safe:bg-base-surface text-left cursor-pointer transition-colors group"
									>
										<span className="text-sm font-medium text-action">
											{year}
										</span>
										<ChevronRight className="w-4 h-4 text-gray-300 group-hover-safe:text-action" />
									</button>
								))
							) : (
								<div className="flex flex-col items-center justify-center h-64 p-8 text-center text-gray-400">
									<Inbox
										className="w-12 h-12 mb-4 text-base-border"
										aria-hidden="true"
									/>
									<p className="text-sm font-medium">No diaries found</p>
								</div>
							);
						}

						if (currentYear && !currentMonth) {
							const months = Array.from(
								new Set(
									diaries
										.filter((d) => d.date.startsWith(currentYear))
										.map((d) => d.date.split("-")[1]),
								),
							).sort((a, b) => b.localeCompare(a));
							const fullMonths: Record<string, string> = {
								"01": "january",
								"02": "february",
								"03": "march",
								"04": "april",
								"05": "may",
								"06": "june",
								"07": "july",
								"08": "august",
								"09": "september",
								"10": "october",
								"11": "november",
								"12": "december",
							};
							const filteredMonths = months.filter((month) => {
								if (!query) return true;
								const shortEng = (MONTH_MAP[month] || "").toLowerCase();
								const fullEng = fullMonths[month] || "";
								return (
									month.includes(query) ||
									shortEng.includes(query) ||
									fullEng.includes(query)
								);
							});
							return filteredMonths.length > 0 ? (
								filteredMonths.map((month) => (
									<button
										key={month}
										type="button"
										onClick={() => updateParams("month", month)}
										className="w-full flex items-center justify-between p-4 hover-safe:bg-base-surface text-left cursor-pointer transition-colors group"
									>
										<span className="text-sm font-medium text-action">
											{MONTH_MAP[month] || month}
										</span>
										<ChevronRight className="w-4 h-4 text-gray-300 group-hover-safe:text-action" />
									</button>
								))
							) : (
								<div className="flex flex-col items-center justify-center h-64 p-8 text-center text-gray-400">
									<Inbox
										className="w-12 h-12 mb-4 text-base-border"
										aria-hidden="true"
									/>
									<p className="text-sm font-medium">
										No diaries found for this year
									</p>
								</div>
							);
						}

						const filteredDiaries = diaries.filter((d) =>
							d.date.startsWith(`${currentYear}-${currentMonth}`),
						);
						const displayDiaries = filteredDiaries.filter((diary) => {
							if (!query) return true;
							const diaryDate = new Date(diary.date);
							const dayLabel = diaryDate.toLocaleDateString("en-US", {
								day: "numeric",
								weekday: "short",
							}); // 例: "27 Sat"
							const matchStr =
								`${diary.content} ${diary.date} ${dayLabel}`.toLowerCase();
							return matchStr.includes(query);
						});
						return displayDiaries.length > 0 ? (
							displayDiaries.map((diary) => (
								<NoteItem
									key={diary.date}
									item={diary}
									searchParams={searchParams}
									selectedNoteId={selectedNoteId}
									selectedDraftId={selectedDraftId}
									currentExact={currentExact}
									selectable={false}
									onTodoToggle={() => {}}
								/>
							))
						) : (
							<div className="flex flex-col items-center justify-center h-64 p-8 text-center text-gray-400">
								<Inbox
									className="w-12 h-12 mb-4 text-base-border"
									aria-hidden="true"
								/>
								<p className="text-sm font-medium">
									No diaries found for this month
								</p>
							</div>
						);
					})()
				) : currentView === "domains" && !currentDomain ? (
					Object.entries(groupedNotes.domains)
						.filter(([domain]) => domain !== "inbox")
						.filter(
							([domain]) => !query || domain.toLowerCase().includes(query),
						)
						.map(([domain, data]) => (
							<Link
								key={domain}
								href={`/notes?domain=${domain}`}
								className="flex items-center justify-between p-4 hover-safe:bg-base-surface transition-colors group"
							>
								<div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
									<div className="p-2 bg-base-surface rounded-lg group-hover-safe:bg-base-bg border border-base-border transition-colors shrink-0">
										<DomainFavicon domain={domain} sizeClassName="w-5 h-5" />
									</div>
									<div className="flex flex-col min-w-0 flex-1">
										<span
											className="text-sm font-medium text-action truncate block"
											title={domain}
										>
											{domain}
										</span>
										<span className="text-xs text-gray-400 shrink-0">
											{data.domainNotes.length +
												Object.values(data.pages).flat().length}{" "}
											notes
										</span>
									</div>
								</div>
								<ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
							</Link>
						))
				) : currentDomain && currentDomain !== "inbox" && !currentExact ? (
					/* 2. Domain Pages View */
					<>
						{!query && (
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
								if (!query) return true;
								const safeUrl = getSafeUrl(url);
								const searchablePath = safeUrl
									? safeUrl.pathname + safeUrl.search
									: url;

								return searchablePath.toLowerCase().includes(query);
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
						) : searchedDisplayItems.length > 0 ? (
							<div className="divide-y divide-base-border">
								{currentView === "drafts" ? (
									searchedDisplayItems.map((item) => (
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
											items={searchedDisplayItems.map((item) => item.id)}
											strategy={verticalListSortingStrategy}
										>
											{searchedDisplayItems.map((item) => (
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
