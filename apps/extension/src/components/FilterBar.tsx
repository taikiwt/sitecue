import {
  AlertTriangle,
  CheckSquare,
  Info,
  Lightbulb,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
}: FilterBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!searchQuery) setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

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
          className={`cursor-pointer py-1.5 text-xs font-bold rounded-full transition-all text-center ${viewScope === "exact"
            ? "bg-action text-action-text shadow-sm"
            : "text-muted-foreground hover:bg-base-surface"
            }`}
        >
          Page
        </button>
        <button
          type="button"
          onClick={() => setViewScope("domain")}
          className={`cursor-pointer py-1.5 text-xs font-bold rounded-full transition-all text-center ${viewScope === "domain"
            ? "bg-action text-action-text shadow-sm"
            : "text-muted-foreground hover:bg-base-surface"
            }`}
        >
          Domain
        </button>
        <button
          type="button"
          onClick={() => setViewScope("inbox")}
          className={`cursor-pointer py-1.5 text-xs font-bold rounded-full transition-all text-center ${viewScope === "inbox"
            ? "bg-action text-action-text shadow-sm"
            : "text-muted-foreground hover:bg-base-surface"
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
            className={`cursor-pointer py-1 px-2.5 rounded-full text-xs font-medium transition-colors ${filterType === "all"
              ? "bg-action text-action-text shadow-sm"
              : "text-muted-foreground hover:text-action hover:bg-base-surface"
              }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("info")}
            className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${filterType === "info"
              ? "bg-action text-action-text shadow-sm"
              : "text-muted-foreground hover:text-note-info hover:bg-base-surface"
              }`}
            title="Filter by Info"
          >
            <Info className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setFilterType("alert")}
            className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${filterType === "alert"
              ? "bg-action text-action-text shadow-sm"
              : "text-muted-foreground hover:text-note-alert hover:bg-base-surface"
              }`}
            title="Filter by Alert"
          >
            <AlertTriangle className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setFilterType("idea")}
            className={`cursor-pointer flex items-center justify-center rounded-full transition-colors size-7 ${filterType === "idea"
              ? "bg-action text-action-text shadow-sm"
              : "text-muted-foreground hover:text-note-idea hover:bg-base-surface"
              }`}
            title="Filter by Idea"
          >
            <Lightbulb className="size-4" />
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
                className="absolute right-1 cursor-pointer p-1 text-muted-foreground hover:text-action transition-colors shrink-0"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Resolved Toggle: カプセル型へ一元化 */}
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className={`cursor-pointer flex items-center justify-center p-1.5 rounded-full border transition-colors shrink-0 size-7 ${showResolved
              ? "bg-action border-action text-action-text"
              : "bg-base-surface border-base-border text-muted-foreground hover:bg-base-bg"
              }`}
            title="Show/Hide Resolved Notes"
          >
            <CheckSquare className="size-4" />
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
                className={`cursor-pointer whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${selectedTag === tag
                  ? "bg-action text-action-text border-action"
                  : "bg-base-surface text-muted-foreground border-base-border hover:bg-base-bg hover:text-action"
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
