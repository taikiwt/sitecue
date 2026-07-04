import {
	AlertTriangle,
	Check,
	CheckSquare,
	Copy,
	Info,
	Lightbulb,
	Search,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Note } from "../hooks/useNotes";

interface FilterBarProps {
	filterType: "all" | "info" | "alert" | "idea";
	setFilterType: (type: "all" | "info" | "alert" | "idea") => void;
	showResolved: boolean;
	setShowResolved: (show: boolean) => void;
	viewScope: "exact" | "domain" | "inbox";
	setViewScope: (scope: "exact" | "domain" | "inbox") => void;
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filteredNotes: Note[];
	selectedTag: string | null;
	setSelectedTag: (tag: string | null) => void;
	availableTags: string[];
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
	filteredNotes,
	selectedTag,
	setSelectedTag,
	availableTags,
}: FilterBarProps) {
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch {
			// clipboard write failed silently
		}
	};

	const handleCopyText = async () => {
		const text = filteredNotes.map((n) => n.content ?? "").join("\n\n");
		await copyToClipboard(text);
		setIsCopyMenuOpen(false);
	};

	const handleCopyJson = async () => {
		const json = filteredNotes.map((n) => ({
			type: n.note_type || "info",
			content: n.content,
		}));
		await copyToClipboard(JSON.stringify(json, null, 2));
		setIsCopyMenuOpen(false);
	};

	// Close search and menu when pressing Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (!searchQuery) setIsSearchOpen(false);
				inputRef.current?.blur();
				setIsCopyMenuOpen(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [searchQuery]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsCopyMenuOpen(false);
			}
		};
		if (isCopyMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isCopyMenuOpen]);

	useEffect(() => {
		if (isSearchOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isSearchOpen]);

	return (
		<div className="bg-base-surface border-b border-base-border px-3 py-2 flex flex-col gap-2.5 z-20 w-full min-w-0">
			{/* Scope Tabs: カプセル背景の中に綺麗に整列 */}
			<div className="grid grid-cols-3 gap-1 bg-base-bg p-1 rounded-full border border-base-border/50">
				<button
					type="button"
					onClick={() => setViewScope("exact")}
					className={`cursor-pointer py-1.5 text-xs font-bold rounded-full transition-all text-center ${
						viewScope === "exact"
							? "bg-action text-action-text shadow-sm"
							: "text-muted-foreground hover-safe:bg-base-surface/50"
					}`}
				>
					Page
				</button>
				<button
					type="button"
					onClick={() => setViewScope("domain")}
					className={`cursor-pointer py-1.5 text-xs font-bold rounded-full transition-all text-center ${
						viewScope === "domain"
							? "bg-action text-action-text shadow-sm"
							: "text-muted-foreground hover-safe:bg-base-surface/50"
					}`}
				>
					Domain
				</button>
				<button
					type="button"
					onClick={() => setViewScope("inbox")}
					className={`cursor-pointer py-1.5 text-xs font-bold rounded-full transition-all text-center ${
						viewScope === "inbox"
							? "bg-action text-action-text shadow-sm"
							: "text-muted-foreground hover-safe:bg-base-surface/50"
					}`}
				>
					Inbox
				</button>
			</div>

			<div className="flex items-center justify-between gap-2 w-full">
				{/* Note Type Filter: rounded-full に統一 */}
				<div className="flex bg-base-bg p-1 rounded-full border border-base-border/50 shrink-0">
					<button
						type="button"
						onClick={() => setFilterType("all")}
						className={`cursor-pointer py-1 px-2.5 rounded-full text-xs font-medium transition-colors ${
							filterType === "all"
								? "bg-action text-action-text shadow-sm"
								: "text-muted-foreground hover-safe:text-action"
						}`}
					>
						All
					</button>
					<button
						type="button"
						onClick={() => setFilterType("info")}
						className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${
							filterType === "info"
								? "bg-action text-action-text shadow-sm"
								: "text-muted-foreground hover-safe:text-note-info"
						}`}
						title="Filter by Info"
					>
						<Info className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={() => setFilterType("alert")}
						className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${
							filterType === "alert"
								? "bg-action text-action-text shadow-sm"
								: "text-muted-foreground hover-safe:text-note-alert"
						}`}
						title="Filter by Alert"
					>
						<AlertTriangle className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={() => setFilterType("idea")}
						className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${
							filterType === "idea"
								? "bg-action text-action-text shadow-sm"
								: "text-muted-foreground hover-safe:text-note-idea"
						}`}
						title="Filter by Idea"
					>
						<Lightbulb className="w-3.5 h-3.5" />
					</button>
				</div>

				{/* 右側の検索窓とResolvedトグルもすべて rounded-full (カプセル) で統一 */}
				<div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
					{/* 検索窓コンテナ */}
					<div className="relative flex items-center bg-base-bg border border-base-border/50 rounded-full px-2 py-0.5 flex-1 max-w-[140px]">
						<Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
						<input
							ref={inputRef}
							type="text"
							placeholder="Search..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full min-w-0 text-xs pl-1 bg-transparent border-none focus:outline-none placeholder:text-muted-foreground text-action"
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
								className="absolute right-1 cursor-pointer p-0.5 text-muted-foreground hover-safe:text-action transition-colors shrink-0"
								title="Clear search"
							>
								<X className="w-3 h-3" />
							</button>
						)}
					</div>

					{/* Copy All Dropdown */}
					<div className="relative" ref={menuRef}>
						<button
							type="button"
							onClick={() => setIsCopyMenuOpen(!isCopyMenuOpen)}
							className={`cursor-pointer flex items-center justify-center rounded-full transition-colors shrink-0 size-7 ${
								isCopied
									? "text-note-info bg-note-info/10"
									: isCopyMenuOpen
										? "text-action bg-base-bg"
										: "text-muted-foreground hover-safe:text-action hover-safe:bg-base-bg"
							}`}
							title={isCopied ? "Copied!" : "Copy options"}
							aria-label={isCopied ? "Copied!" : "Open copy options menu"}
						>
							{isCopied ? (
								<Check className="w-3.5 h-3.5" />
							) : (
								<Copy className="w-3.5 h-3.5" />
							)}
						</button>

						{isCopyMenuOpen && (
							<div className="absolute right-0 top-full mt-1 bg-base-surface border border-base-border rounded shadow-md z-20 py-1 min-w-[120px]">
								<button
									type="button"
									onClick={handleCopyText}
									className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover-safe:bg-base-bg transition-colors"
								>
									Copy as Text
								</button>
								<button
									type="button"
									onClick={handleCopyJson}
									className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover-safe:bg-base-bg transition-colors"
								>
									Copy as JSON
								</button>
							</div>
						)}
					</div>

					{/* Resolved Toggle: カプセル型へ一元化 */}
					<button
						type="button"
						onClick={() => setShowResolved(!showResolved)}
						className={`cursor-pointer flex items-center justify-center p-1.5 rounded-full border transition-colors shrink-0 size-7 ${
							showResolved
								? "bg-action border-action text-action-text"
								: "bg-base-surface border-base-border text-muted-foreground hover-safe:bg-base-bg"
						}`}
						title="Show/Hide Resolved Notes"
					>
						<CheckSquare className="w-3.5 h-3.5" />
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
								onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
								className={`cursor-pointer whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
									selectedTag === tag
										? "bg-action text-action-text border-action"
										: "bg-base-surface text-muted-foreground border-base-border hover-safe:border-action hover-safe:text-action"
								}`}
							>
								#{tag}
							</button>
						))}
					</div>
					{/* 💡 Fade Mask */}
					<div
						className="absolute right-0 top-0 bottom-1 w-12 bg-linear-to-r from-transparent to-base-surface pointer-events-none"
						aria-hidden="true"
					/>
				</div>
			)}
		</div>
	);
}
