import {
	AlertTriangle,
	CheckSquare,
	Info,
	Lightbulb,
	Maximize2,
	Minimize2,
	Search,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface FilterBarProps {
	filterType: "all" | "info" | "alert" | "idea";
	setFilterType: (type: "all" | "info" | "alert" | "idea") => void;
	showResolved: boolean;
	setShowResolved: (show: boolean) => void;
	viewScope: "exact" | "domain" | "inbox";
	setViewScope: (scope: "exact" | "domain" | "inbox") => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	selectedTag: string | null;
	setSelectedTag: (tag: string | null) => void;
	availableTags: string[];
	isMaximized: boolean;
	onToggleMaximize: () => void;
}

export default function FilterBar({
	filterType,
	setFilterType,
	showResolved,
	setShowResolved,
	viewScope,
	setViewScope,
	searchQuery,
	setSearchQuery,
	selectedTag,
	setSelectedTag,
	availableTags,
	isMaximized,
	onToggleMaximize,
}: FilterBarProps) {
	const { t } = useTranslation();
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const hasActiveFilter =
		filterType !== "all" ||
		showResolved ||
		searchQuery.trim().length > 0 ||
		selectedTag !== null;

	return (
		<div className="bg-base-surface px-2.5 pt-2.5 pb-1.5 flex flex-col gap-2 z-20 w-full min-w-0 shrink-0">
			{/* 1行目: スコープタブ (3等分) ＋ フィルタトグル ＆ 最大化 */}
			<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
				<div className="grid grid-cols-3 gap-1 bg-base-bg p-0.5 rounded-full border border-base-border/50">
					<button
						type="button"
						onClick={() => setViewScope("exact")}
						className={`cursor-pointer py-1.5 px-1 text-xs font-bold whitespace-nowrap rounded-full transition-all text-center ${
							viewScope === "exact"
								? "bg-action text-action-text shadow-sm"
								: "text-muted-foreground hover:bg-base-surface"
						}`}
					>
						{t("filter.page")}
					</button>
					<button
						type="button"
						onClick={() => setViewScope("domain")}
						className={`cursor-pointer py-1.5 px-1 text-xs font-bold whitespace-nowrap rounded-full transition-all text-center ${
							viewScope === "domain"
								? "bg-action text-action-text shadow-sm"
								: "text-muted-foreground hover:bg-base-surface"
						}`}
					>
						{t("filter.domain")}
					</button>
					<button
						type="button"
						onClick={() => setViewScope("inbox")}
						className={`cursor-pointer py-1.5 px-1 text-xs font-bold whitespace-nowrap rounded-full transition-all text-center ${
							viewScope === "inbox"
								? "bg-action text-action-text shadow-sm"
								: "text-muted-foreground hover:bg-base-surface"
						}`}
					>
						{t("filter.inbox")}
					</button>
				</div>

				<div className="flex items-center gap-1.5 shrink-0">
					<button
						type="button"
						onClick={() => setIsFilterOpen((prev) => !prev)}
						aria-expanded={isFilterOpen}
						title={t("filter.toggleFilters")}
						aria-label={t("filter.toggleFilters")}
						className={`relative cursor-pointer flex items-center justify-center size-7 p-0 rounded-full transition-colors ${
							isFilterOpen || hasActiveFilter
								? "bg-action text-action-text shadow-xs"
								: "bg-base-bg border border-base-border/60 text-muted-foreground hover:text-action"
						}`}
					>
						<SlidersHorizontal className="size-3.5" aria-hidden="true" />
						{hasActiveFilter && !isFilterOpen && (
							<span
								className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-note-info ring-2 ring-base-surface"
								aria-hidden="true"
							/>
						)}
					</button>

					<button
						type="button"
						onClick={onToggleMaximize}
						title={
							isMaximized
								? t("sidepanel.exitFullView")
								: t("sidepanel.maximizeNotes")
						}
						aria-label={
							isMaximized
								? t("sidepanel.exitFullView")
								: t("sidepanel.maximizeNotes")
						}
						className={`cursor-pointer flex items-center justify-center size-7 p-0 rounded-full transition-colors ${
							isMaximized
								? "bg-action text-action-text"
								: "bg-base-bg border border-base-border/60 text-muted-foreground hover:text-action"
						}`}
					>
						{isMaximized ? (
							<Minimize2 className="size-3.5" aria-hidden="true" />
						) : (
							<Maximize2 className="size-3.5" aria-hidden="true" />
						)}
					</button>
				</div>
			</div>

			{/* 2行目以降: 折りたたみ式フィルタ＆検索パネル */}
			{isFilterOpen && (
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-2 w-full">
						{/* Note Type Filter */}
						<div className="flex bg-base-bg p-1 rounded-full border border-base-border/50 shrink-0">
							<button
								type="button"
								onClick={() => setFilterType("all")}
								className={`cursor-pointer py-1 px-2.5 rounded-full text-xs font-medium transition-colors ${
									filterType === "all"
										? "bg-action text-action-text shadow-sm"
										: "text-muted-foreground hover:text-action hover:bg-base-surface"
								}`}
							>
								{t("filter.all")}
							</button>
							<button
								type="button"
								onClick={() => setFilterType("info")}
								className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${
									filterType === "info"
										? "bg-note-info text-action-text shadow-sm"
										: "text-muted-foreground hover:text-note-info hover:bg-base-surface"
								}`}
								title={t("filter.tooltipInfo")}
							>
								<Info className="size-4" aria-hidden="true" />
							</button>
							<button
								type="button"
								onClick={() => setFilterType("alert")}
								className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${
									filterType === "alert"
										? "bg-note-alert text-action-text shadow-sm"
										: "text-muted-foreground hover:text-note-alert hover:bg-base-surface"
								}`}
								title={t("filter.tooltipAlert")}
							>
								<AlertTriangle className="size-4" aria-hidden="true" />
							</button>
							<button
								type="button"
								onClick={() => setFilterType("idea")}
								className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${
									filterType === "idea"
										? "bg-note-idea text-action-text shadow-sm"
										: "text-muted-foreground hover:text-note-idea hover:bg-base-surface"
								}`}
								title={t("filter.tooltipIdea")}
							>
								<Lightbulb className="size-4" aria-hidden="true" />
							</button>
						</div>

						{/* 検索窓とResolvedトグル */}
						<div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
							<div className="relative flex items-center bg-base-bg border border-base-border/50 rounded-full px-2.5 py-1 h-7 flex-1 max-w-[140px]">
								<Search
									className="w-3.5 h-3.5 text-muted-foreground shrink-0"
									aria-hidden="true"
								/>
								<input
									ref={inputRef}
									type="text"
									placeholder={t("filter.searchPlaceholder")}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full min-w-0 text-xs pl-1.5 bg-transparent border-none focus:outline-none placeholder:text-muted-foreground text-action h-full"
								/>
								{searchQuery && (
									<button
										type="button"
										onMouseDown={(e) => {
											e.preventDefault();
										}}
										onClick={() => {
											setSearchQuery("");
											inputRef.current?.focus();
										}}
										className="absolute right-1 cursor-pointer p-1 text-muted-foreground hover:text-action transition-colors shrink-0"
										title={t("filter.clearSearch")}
									>
										<X className="w-3 h-3" aria-hidden="true" />
									</button>
								)}
							</div>

							<button
								type="button"
								onClick={() => setShowResolved(!showResolved)}
								className={`cursor-pointer flex items-center justify-center p-1.5 rounded-full border transition-colors shrink-0 size-7 ${
									showResolved
										? "bg-action border-action text-action-text"
										: "bg-base-surface border-base-border text-muted-foreground hover:bg-base-bg"
								}`}
								title={t("filter.toggleResolved")}
							>
								<CheckSquare className="size-4" aria-hidden="true" />
							</button>
						</div>
					</div>

					{/* Tag Pills */}
					{availableTags.length > 0 && (
						<div className="relative w-full min-w-0 shrink-0 overflow-hidden">
							<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide pr-12">
								{availableTags.map((tag) => (
									<button
										key={tag}
										type="button"
										onClick={() =>
											setSelectedTag(selectedTag === tag ? null : tag)
										}
										className={`cursor-pointer whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
											selectedTag === tag
												? "bg-action text-action-text border-action"
												: "bg-base-surface text-muted-foreground border-base-border hover:bg-base-bg hover:text-action"
										}`}
									>
										#{tag}
									</button>
								))}
							</div>
							<div
								className="absolute right-0 top-0 bottom-1 w-12 bg-linear-to-r from-transparent to-base-surface pointer-events-none"
								aria-hidden="true"
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
