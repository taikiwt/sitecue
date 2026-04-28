"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	ChevronDown,
	ChevronRight,
	FileText,
	Folder,
	FolderOpen,
	Globe,
	Inbox,
	PanelLeftClose,
	PenSquare,
	Plus,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { UserMenu } from "@/app/(dashboard)/_components/UserMenu";
import SearchInput from "@/app/(dashboard)/notes/_components/SearchInput";
import type { DomainGroup, Note } from "@/app/(dashboard)/notes/types";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { useFetchDrafts } from "@/hooks/useDraftsQuery";
import { useFetchNoteContents, useFetchNotes } from "@/hooks/useNotesQuery";
import { groupNotes, useNotesStore } from "@/store/useNotesStore";
import { getSafeUrl, normalizeUrlForGrouping } from "@/utils/url";

interface GlobalSidebarProps {
	onClose?: () => void;
}

export function GlobalSidebar({ onClose }: GlobalSidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const { data: notes = [], isLoading: isNotesLoading } = useFetchNotes();
	const { data: drafts = [], isLoading: isDraftsLoading } = useFetchDrafts();
	const { searchResults } = useNotesStore();

	// 画面遷移（戻る/進むを含む）が発生した際に、Next.jsのフリーズを破り
	// バックグラウンドで最新データを再取得してキャッシュを上書きする
	useEffect(() => {
		if (pathname) {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			queryClient.invalidateQueries({ queryKey: ["drafts"] });
		}
	}, [pathname, queryClient]);

	const groupedNotes = useMemo(() => {
		if (isNotesLoading || isDraftsLoading) return null;
		return groupNotes(notes, drafts);
	}, [notes, drafts, isNotesLoading, isDraftsLoading]);

	const safeGroupedNotes = groupedNotes || {
		inbox: [],
		drafts: [],
		domains: {},
	};

	const _isDataReady = !isNotesLoading && !isDraftsLoading;

	const qParam = searchParams.get("q") || "";
	const tagsParam = searchParams.get("tags") || "";

	// Helper to create href with search state (q, tags) preserved
	const createHref = (domain: string, exactUrl?: string) => {
		const params = new URLSearchParams();
		params.set("domain", domain);
		if (exactUrl) params.set("exact", exactUrl);
		if (qParam) params.set("q", qParam);
		if (tagsParam) params.set("tags", tagsParam);
		return `/notes?${params.toString()}`;
	};

	// Determine active state from URL
	const isNotes = pathname.startsWith("/notes");

	const domainParam = searchParams.get("domain");
	const viewParam = searchParams.get("view");
	const exactParam = searchParams.get("exact");

	const currentDomain = domainParam || (isNotes && !viewParam ? "inbox" : null);
	const currentView =
		viewParam || (domainParam ? "domains" : isNotes ? "inbox" : null);
	const currentExact = exactParam || null;

	const isInboxActive =
		isNotes &&
		(currentView === "inbox" || (currentDomain === "inbox" && !currentExact));
	const isDraftsActive = isNotes && currentView === "drafts";

	// Search implementation (Use q from URL)
	const normalizedQuery = useMemo(
		() => (qParam.trim() ? qParam.toLowerCase() : ""),
		[qParam],
	);
	const isSearchActive = !!qParam || !!tagsParam;

	const filteredDomains = useMemo(() => {
		return Object.entries(safeGroupedNotes.domains).filter(([domain, data]) => {
			if (!isSearchActive) return true;

			// 1. URL・ドメイン名によるマッチ
			if (normalizedQuery) {
				if (domain.toLowerCase().includes(normalizedQuery)) return true;
				if (
					Object.keys(data.pages).some((url) =>
						normalizeUrlForGrouping(url.toLowerCase()).includes(
							normalizedQuery,
						),
					)
				)
					return true;
			}

			// 2. 本文検索結果 (searchResults) によるマッチ
			if (searchResults) {
				const hasMatchingNote = searchResults.some((note) => {
					const noteDomain = normalizeUrlForGrouping(note.url_pattern).split(
						"/",
					)[0];
					return noteDomain === domain;
				});
				if (hasMatchingNote) return true;
			}

			return false;
		});
	}, [safeGroupedNotes, normalizedQuery, searchResults, isSearchActive]);

	// Accordion logic
	const isAnyDomainActive = !!(currentDomain && currentDomain !== "inbox");
	const shouldForceOpenDomains = isSearchActive || isAnyDomainActive;
	const [isDomainsOpen, setIsDomainsOpen] = useState(
		() => shouldForceOpenDomains,
	);
	const effectiveIsDomainsOpen = isDomainsOpen || shouldForceOpenDomains;

	return (
		<div className="flex flex-col h-full w-full bg-base-surface border-r border-base-border overflow-hidden">
			{/* 1. Header Area: Fixed at top */}
			<div className="shrink-0 p-4 border-b border-base-border bg-base-bg">
				<div className="flex items-center justify-between mb-6">
					<Link
						href="/"
						className="flex items-center gap-2 cursor-pointer group w-fit"
					>
						<Image
							src="/logo.svg"
							alt="sitecue logo"
							width={28}
							height={28}
							className="drop-shadow-sm transition-transform group-hover:scale-105"
						/>
						<span className="text-xl font-bold tracking-tight text-action">
							sitecue
						</span>
					</Link>
					{onClose && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="text-neutral-400 hover:text-neutral-900 cursor-pointer hidden md:flex"
							title="Close Sidebar"
						>
							<PanelLeftClose className="w-5 h-5" aria-hidden="true" />
						</Button>
					)}
				</div>

				{/* Search Area */}
				<div className="mb-4">
					<SearchInput />
				</div>

				<Button
					type="button"
					variant="default"
					className="group flex w-full items-center justify-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-medium text-action-text cursor-pointer transition-all hover:bg-primary hover:scale-[1.06] active:scale-[0.96]"
					onClick={() => {
						const currentPath = pathname;
						const params = new URLSearchParams(searchParams.toString());
						params.set("globalNew", "note");
						router.push(`${currentPath}?${params.toString()}`);
					}}
				>
					<Plus
						className="w-4 h-4 transition-transform group-hover:rotate-90"
						aria-hidden="true"
					/>
					New Note
				</Button>
			</div>

			{/* 2. Middle Area: Scrollable List (Always mounted to prevent layout shift/freeze) */}
			<div className="flex-1 overflow-y-auto p-2">
				<div className="space-y-1">
					{/* Inbox */}
					<Link
						href="/notes?domain=inbox"
						className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isInboxActive
								? "bg-base-bg text-action shadow-sm"
								: "text-gray-600 hover:bg-base-bg hover:text-action"
						}`}
					>
						<Inbox className="w-4 h-4" aria-hidden="true" />
						<span>Inbox</span>
						{safeGroupedNotes.inbox.length > 0 && (
							<span className="ml-auto text-xs bg-base-surface text-gray-500 px-1.5 py-0.5 rounded-full border border-base-border">
								{safeGroupedNotes.inbox.length}
							</span>
						)}
					</Link>

					{/* Drafts */}
					<Link
						href="/notes?view=drafts"
						className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isDraftsActive
								? "bg-base-bg text-action shadow-sm"
								: "text-gray-600 hover:bg-base-bg hover:text-action"
						}`}
					>
						<PenSquare className="w-4 h-4" aria-hidden="true" />
						<span>Drafts</span>
						{safeGroupedNotes.drafts.length > 0 && (
							<span className="ml-auto text-xs bg-base-surface text-gray-500 px-1.5 py-0.5 rounded-full border border-base-border">
								{safeGroupedNotes.drafts.length}
							</span>
						)}
					</Link>

					{/* Domains Accordion */}
					<div className="mt-2">
						<button
							type="button"
							onClick={() => setIsDomainsOpen(!isDomainsOpen)}
							className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-base-bg hover:text-action rounded-md transition-colors cursor-pointer group"
						>
							<div className="flex items-center gap-2">
								<Globe className="w-4 h-4" aria-hidden="true" />
								<span>Domains</span>
							</div>
							<div className="flex items-center gap-1">
								<span className="text-xs bg-base-surface text-gray-500 px-1.5 py-0.5 rounded-full border border-base-border">
									{Object.keys(safeGroupedNotes.domains).length}
								</span>
								{effectiveIsDomainsOpen ? (
									<ChevronDown
										className="w-4 h-4 text-gray-400 group-hover:text-action"
										aria-hidden="true"
									/>
								) : (
									<ChevronRight
										className="w-4 h-4 text-gray-400 group-hover:text-action"
										aria-hidden="true"
									/>
								)}
							</div>
						</button>

						{/* DOMAINS Child List */}
						{effectiveIsDomainsOpen && (
							<div className="mt-1 space-y-1">
								{filteredDomains.map(([domain, data]) => (
									<DomainAccordionItem
										key={domain}
										domainName={domain}
										domainData={data}
										normalizedQuery={normalizedQuery}
										currentDomain={currentDomain}
										currentExact={currentExact}
										createHref={createHref}
										searchResults={searchResults}
										isSearchActive={isSearchActive}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* 3. Footer Area: Fixed at bottom */}
			<div className="shrink-0 p-4 border-t border-base-border mt-auto bg-base-surface">
				<UserMenu />
			</div>
		</div>
	);
}

// Subcomponent: DomainAccordionItem (largely unchanged logic, but handles its own prefetching)
function DomainAccordionItem({
	domainName,
	domainData,
	normalizedQuery,
	currentDomain,
	currentExact,
	createHref,
	searchResults,
	isSearchActive,
}: {
	domainName: string;
	domainData: DomainGroup;
	normalizedQuery: string;
	currentDomain: string | null;
	currentExact: string | null;
	createHref: (domain: string, exactUrl?: string) => string;
	searchResults: Note[] | null;
	isSearchActive: boolean;
}) {
	const isUnderThisDomain = currentDomain === domainName;
	const [isOpen, setIsOpen] = useState(false);
	const { mutate: fetchContentForIds } = useFetchNoteContents();

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (open) {
			const ids = [
				...domainData.domainNotes,
				...Object.values(domainData.pages).flat(),
			]
				.filter((n): n is Note => n.content === undefined)
				.map((n) => n.id);

			if (ids.length > 0) {
				fetchContentForIds(ids);
			}
		}
	};

	const effectiveIsOpen = isOpen || isSearchActive || isUnderThisDomain;

	const getPath = (url: string) => {
		const safeUrl = getSafeUrl(url);
		if (safeUrl) {
			return safeUrl.pathname + safeUrl.search + safeUrl.hash;
		}
		return url;
	};

	return (
		<div className="px-2">
			<button
				type="button"
				onClick={() => handleOpenChange(!isOpen)}
				aria-label={`${effectiveIsOpen ? "Close" : "Open"} accordion for ${domainName}`}
				aria-expanded={effectiveIsOpen}
				className={`w-full flex items-center justify-between group px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
					isUnderThisDomain && !currentExact
						? "text-action font-medium"
						: "text-gray-600 hover:bg-base-bg hover:text-action"
				}`}
			>
				<div className="flex items-center gap-2 overflow-hidden">
					{effectiveIsOpen ? (
						<FolderOpen
							className="w-4 h-4 text-gray-400 shrink-0"
							aria-hidden="true"
						/>
					) : (
						<Folder
							className="w-4 h-4 text-gray-400 shrink-0"
							aria-hidden="true"
						/>
					)}
					<span className="truncate" title={domainName}>
						{domainName}
					</span>
				</div>
				{effectiveIsOpen ? (
					<ChevronDown
						className="w-4 h-4 text-gray-400 group-hover:text-action"
						aria-hidden="true"
					/>
				) : (
					<ChevronRight
						className="w-4 h-4 text-gray-400 group-hover:text-action"
						aria-hidden="true"
					/>
				)}
			</button>

			{effectiveIsOpen && (
				<div className="ml-3.5 mt-0.5 space-y-0.5 border-l-2 border-base-border pl-3">
					<Link
						href={createHref(domainName)}
						className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
							isUnderThisDomain && !currentExact
								? "bg-base-bg text-action font-medium shadow-sm"
								: "text-gray-500 hover:bg-base-bg hover:text-action"
						}`}
					>
						<Globe
							className="w-3.5 h-3.5 opacity-60 shrink-0"
							aria-hidden="true"
						/>
						<span className="truncate min-w-0">All notes in {domainName}</span>
					</Link>

					{Object.entries(domainData.pages).map(([url, _notes]) => {
						const isActive = currentExact === url;
						const path = getPath(url);

						if (isSearchActive) {
							const matchesQuery =
								normalizedQuery &&
								(normalizeUrlForGrouping(url.toLowerCase()).includes(
									normalizedQuery,
								) ||
									domainName.toLowerCase().includes(normalizedQuery));
							const matchesContent = searchResults?.some(
								(n) => n.url_pattern === url,
							);

							if (!matchesQuery && !matchesContent) {
								return null;
							}
						}

						return (
							<Link
								key={url}
								href={createHref(domainName, url)}
								className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
									isActive
										? "bg-base-bg text-action font-medium shadow-sm"
										: "text-gray-500 hover:bg-base-bg hover:text-action"
								}`}
								title={url}
							>
								<FileText
									className="w-3.5 h-3.5 opacity-60 shrink-0"
									aria-hidden="true"
								/>
								<span className="truncate min-w-0">{path}</span>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
