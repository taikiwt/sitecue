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
		<div className="bg-base-surface border-b border-base-border px-4 py-2 flex flex-col gap-3 sticky top-0 z-10">
			{/* Scope Tabs */}
			<div className="flex space-x-4 border-b border-base-border">
				<button
					type="button"
					onClick={() => setViewScope("exact")}
					className={`cursor-pointer pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
						viewScope === "exact"
							? "border-action text-action"
							: "border-transparent text-gray-400 hover:text-action hover:border-base-border"
					}`}
				>
					Page
				</button>
				<button
					type="button"
					onClick={() => setViewScope("domain")}
					className={`cursor-pointer pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
						viewScope === "domain"
							? "border-action text-action"
							: "border-transparent text-gray-400 hover:text-action hover:border-base-border"
					}`}
				>
					Domain
				</button>
				<button
					type="button"
					onClick={() => setViewScope("inbox")}
					className={`cursor-pointer pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
						viewScope === "inbox"
							? "border-action text-action"
							: "border-transparent text-gray-400 hover:text-action hover:border-base-border"
					}`}
				>
					Inbox
				</button>
			</div>

			<div className="flex items-center justify-between gap-2 w-full">
				{/* Note Type Filter */}
				<div className="flex bg-action p-1 rounded-lg shrink-0">
					<button
						type="button"
						onClick={() => setFilterType("all")}
						className={`cursor-pointer py-1 px-2 rounded text-xs font-medium transition-colors ${
							filterType === "all"
								? "bg-base-surface text-action shadow-sm"
								: "text-gray-400 hover:text-white"
						}`}
					>
						All
					</button>
					<button
						type="button"
						onClick={() => setFilterType("info")}
						className={`cursor-pointer py-1 px-2 rounded transition-colors ${
							filterType === "info"
								? "bg-base-surface text-action shadow-sm"
								: "text-gray-400 hover:text-white"
						}`}
						title="Info"
					>
						<Info className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={() => setFilterType("alert")}
						className={`cursor-pointer py-1 px-2 rounded transition-colors ${
							filterType === "alert"
								? "bg-base-surface text-action shadow-sm"
								: "text-gray-400 hover:text-white"
						}`}
						title="Alert"
					>
						<AlertTriangle className="w-3.5 h-3.5" />
					</button>
					<button
						type="button"
						onClick={() => setFilterType("idea")}
						className={`cursor-pointer py-1 px-2 rounded transition-colors ${
							filterType === "idea"
								? "bg-base-surface text-action shadow-sm"
								: "text-gray-400 hover:text-white"
						}`}
						title="Idea"
					>
						<Lightbulb className="w-3.5 h-3.5" />
					</button>
				</div>

				<div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
					{/* Search Bar */}
					<div className="relative flex items-center shrink min-w-0">
						<button
							type="button"
							onClick={() => setIsSearchOpen(true)}
							className={`cursor-pointer p-1.5 rounded transition-colors shrink-0 ${
								isSearchOpen || searchQuery
									? "bg-base-bg text-action"
									: "text-gray-400 hover:text-action hover:bg-base-bg"
							}`}
						>
							<Search className="w-3.5 h-3.5" />
						</button>
						<div
							className={`overflow-hidden transition-all duration-200 ease-in-out shrink min-w-0 ${
								isSearchOpen || searchQuery ? "w-32 ml-1" : "w-0 ml-0"
							}`}
						>
							<div className="relative flex items-center w-full min-w-0">
								<input
									ref={inputRef}
									type="text"
									placeholder="Search..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onBlur={() => {
										if (!searchQuery) setIsSearchOpen(false);
									}}
									className="w-full min-w-0 text-xs pl-2 pr-6 py-1 bg-base-bg border-none rounded focus:outline-none focus:ring-1 focus:ring-action/30 placeholder:text-gray-400"
								/>
								{searchQuery && (
									<button
										type="button"
										onMouseDown={(e) => {
											// Prevent input from losing focus when clicking the clear button
											e.preventDefault();
										}}
										onClick={() => {
											setSearchQuery("");
											inputRef.current?.focus();
										}}
										className="absolute right-1 cursor-pointer p-0.5 text-gray-400 hover:text-action transition-colors shrink-0"
										title="Clear search"
									>
										<X className="w-3 h-3" />
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Copy All Dropdown */}
					<div className="relative" ref={menuRef}>
						<button
							type="button"
							onClick={() => setIsCopyMenuOpen(!isCopyMenuOpen)}
							className={`cursor-pointer p-1.5 rounded transition-colors shrink-0 ${
								isCopied
									? "text-note-info bg-note-info/10"
									: isCopyMenuOpen
										? "text-action bg-base-bg"
										: "text-gray-400 hover:text-action hover:bg-base-bg"
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
									className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-base-bg transition-colors"
								>
									Copy as Text
								</button>
								<button
									type="button"
									onClick={handleCopyJson}
									className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-base-bg transition-colors"
								>
									Copy as JSON
								</button>
							</div>
						)}
					</div>

					{/* Resolved Toggle */}
					<button
						type="button"
						onClick={() => setShowResolved(!showResolved)}
						className={`cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors shrink-0 ${
							showResolved
								? "bg-action border-action text-action-text"
								: "bg-base-surface border-dashed border-action text-action hover:text-action-text hover:border-action hover:bg-action"
						}`}
						title="Show/Hide Resolved Notes"
					>
						<CheckSquare className="w-3.5 h-3.5" />
						<span className="hidden sm:inline">Resolved</span>
					</button>
				</div>
			</div>
		</div>
	);
}
