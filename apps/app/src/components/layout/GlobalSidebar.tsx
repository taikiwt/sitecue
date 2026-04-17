"use client";

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
	Search,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { UserMenu } from "@/app/_components/UserMenu";
import type { DomainGroup, Note } from "@/app/notes/types";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { useNotesStore } from "@/store/useNotesStore";
import { getSafeUrl, normalizeUrlForGrouping } from "@/utils/url";

interface GlobalSidebarProps {
	onClose?: () => void;
}

export function GlobalSidebar({ onClose }: GlobalSidebarProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { groupedNotes } = useNotesStore();

	const [searchQuery, setSearchQuery] = useState("");

	// Determine active state from URL
	const _isLaunchpad = pathname === "/";
	const isStudio = pathname.startsWith("/studio");
	const isNotes = pathname.startsWith("/notes");
	const isTemplates = pathname.startsWith("/templates");

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

	// Search implementation (copied from LeftPaneNavigation)
	const normalizedQuery = useMemo(
		() =>
			searchQuery.trim()
				? normalizeUrlForGrouping(searchQuery.toLowerCase())
				: "",
		[searchQuery],
	);

	const filteredDomains = useMemo(() => {
		if (!groupedNotes) return [];
		return Object.entries(groupedNotes.domains).filter(([domain, data]) => {
			if (!normalizedQuery) return true;
			if (domain.toLowerCase().includes(normalizedQuery)) return true;
			return Object.keys(data.pages).some((url) =>
				normalizeUrlForGrouping(url.toLowerCase()).includes(normalizedQuery),
			);
		});
	}, [groupedNotes, normalizedQuery]);

	const newNoteParams = new URLSearchParams();
	if (currentView) newNoteParams.set("view", currentView);
	if (currentDomain) newNoteParams.set("domain", currentDomain);
	if (currentExact) newNoteParams.set("exact", currentExact);
	newNoteParams.set("globalNew", "note");
	const newNoteHref = `/notes?${newNoteParams.toString()}`;

	// Accordion logic
	const isAnyDomainActive = !!(currentDomain && currentDomain !== "inbox");
	const shouldForceOpenDomains = !!normalizedQuery || isAnyDomainActive;
	const [isDomainsOpen, setIsDomainsOpen] = useState(
		() => shouldForceOpenDomains,
	);
	const effectiveIsDomainsOpen = isDomainsOpen || shouldForceOpenDomains;

	if (!groupedNotes) return null;

	return (
		<div className="flex flex-col h-full bg-base-surface w-full overflow-hidden border-r border-base-border">
			<div className="p-4 border-b border-base-border bg-base-bg">
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
				<div className="relative">
					<Search
						className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
						aria-hidden="true"
					/>
					<input
						type="search"
						id="nav-search"
						placeholder="Search URL or domain..."
						className="w-full pl-8 pr-3 py-2 bg-base-bg border-transparent focus:bg-base-bg focus:border-base-border focus:ring-2 focus:ring-base-border rounded-lg text-sm transition-all outline-none"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<Link
					href={newNoteHref}
					className="flex w-full items-center justify-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-medium text-action-text transition-colors hover:bg-action-hover cursor-pointer"
				>
					<Plus className="w-4 h-4" aria-hidden="true" />
					New Note
				</Link>
			</div>

			<nav className="flex-1 flex flex-col py-4 overflow-hidden">
				{/* Fixed Area: Inbox and Drafts */}
				<div className="shrink-0 px-2 space-y-1 mb-2">
					{/* Inbox */}
					<Link
						href="/notes?domain=inbox"
						className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isInboxActive
								? "bg-base-bg text-action shadow-sm"
								: "text-gray-600 hover:bg-base-bg/50 hover:text-action"
						}`}
					>
						<Inbox className="w-4 h-4" aria-hidden="true" />
						<span>Inbox</span>
						{groupedNotes.inbox.length > 0 && (
							<span className="ml-auto text-xs bg-base-surface text-gray-500 px-1.5 py-0.5 rounded-full border border-base-border">
								{groupedNotes.inbox.length}
							</span>
						)}
					</Link>

					{/* Drafts */}
					<Link
						href="/notes?view=drafts"
						className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isDraftsActive
								? "bg-base-bg text-action shadow-sm"
								: "text-gray-600 hover:bg-base-bg/50 hover:text-action"
						}`}
					>
						<PenSquare className="w-4 h-4" aria-hidden="true" />
						<span>Drafts</span>
						{groupedNotes.drafts.length > 0 && (
							<span className="ml-auto text-xs bg-base-surface text-gray-500 px-1.5 py-0.5 rounded-full border border-base-border">
								{groupedNotes.drafts.length}
							</span>
						)}
					</Link>
				</div>

				{/* Independent Scroll Area: DOMAINS Accordion */}
				<div className="flex flex-col flex-1 overflow-hidden px-2">
					<button
						type="button"
						onClick={() => setIsDomainsOpen(!isDomainsOpen)}
						className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-base-bg/50 hover:text-action rounded-md transition-colors cursor-pointer group"
					>
						<div className="flex items-center gap-2">
							<Globe className="w-4 h-4" aria-hidden="true" />
							<span>Domains</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="text-xs bg-base-surface text-gray-500 px-1.5 py-0.5 rounded-full border border-base-border">
								{Object.keys(groupedNotes.domains).length}
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
						<div className="flex-1 overflow-y-auto mt-1 pr-1 space-y-1">
							{filteredDomains.map(([domain, data]) => (
								<DomainAccordionItem
									key={domain}
									domainName={domain}
									domainData={data}
									normalizedQuery={normalizedQuery}
									currentDomain={currentDomain}
									currentExact={currentExact}
								/>
							))}
						</div>
					)}
				</div>
			</nav>

			<div className="p-4 border-t border-base-border bg-base-bg flex flex-col gap-2">
				<Link
					href="/studio"
					className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
						isStudio
							? "bg-action text-action-text hover:bg-action-hover"
							: "bg-base-surface text-neutral-600 border border-base-border hover:bg-base-bg"
					}`}
				>
					<span>Studio</span>
				</Link>
				<div className="flex items-center justify-between">
					<Link
						href="/templates"
						className={`text-xs px-2 py-1 rounded transition-colors ${
							isTemplates
								? "text-action font-bold"
								: "text-neutral-500 hover:text-action"
						}`}
					>
						Templates
					</Link>
					<UserMenu />
				</div>
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
}: {
	domainName: string;
	domainData: DomainGroup;
	normalizedQuery: string;
	currentDomain: string | null;
	currentExact: string | null;
}) {
	const isUnderThisDomain = currentDomain === domainName;
	const [isOpen, setIsOpen] = useState(false);
	const fetchContentForIds = useNotesStore((state) => state.fetchContentForIds);

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

	const effectiveIsOpen = isOpen || !!normalizedQuery || isUnderThisDomain;

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
						? "bg-base-bg text-action font-medium shadow-sm"
						: "text-gray-600 hover:bg-base-bg/50 hover:text-action"
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
						href={`/notes?domain=${encodeURIComponent(domainName)}`}
						className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
							isUnderThisDomain && !currentExact
								? "bg-base-bg text-action font-medium shadow-sm"
								: "text-gray-500 hover:bg-base-bg/50 hover:text-action"
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

						if (
							normalizedQuery &&
							!normalizeUrlForGrouping(url.toLowerCase()).includes(
								normalizedQuery,
							) &&
							!domainName.toLowerCase().includes(normalizedQuery)
						) {
							return null;
						}

						return (
							<Link
								key={url}
								href={`/notes?domain=${encodeURIComponent(
									domainName,
								)}&exact=${encodeURIComponent(url)}`}
								className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
									isActive
										? "bg-base-bg text-action font-medium shadow-sm"
										: "text-gray-500 hover:bg-base-bg/50 hover:text-action"
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
