"use client";

import {
	ChevronDown,
	ChevronRight,
	FileText,
	Folder,
	FolderOpen,
	Globe,
	Inbox,
	PenSquare,
	Plus,
	Search,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { useNotesStore } from "@/store/useNotesStore";
import { getSafeUrl, normalizeUrlForGrouping } from "@/utils/url";
import { UserMenu } from "../../_components/UserMenu";
import type { DomainGroup, GroupedNotes, Note } from "../types";

type Props = {
	groupedNotes: GroupedNotes;
	currentView: string | null;
	currentDomain: string | null;
	currentExact: string | null;
};

export function LeftPaneNavigation({
	groupedNotes,
	currentView,
	currentDomain,
	currentExact,
}: Props) {
	const isInboxActive =
		currentView === "inbox" || (currentDomain === "inbox" && !currentExact);
	const isDraftsActive = currentView === "drafts";

	const [searchQuery, setSearchQuery] = useState("");

	// 検索フィルタリング
	const normalizedQuery = searchQuery.trim()
		? normalizeUrlForGrouping(searchQuery.toLowerCase())
		: "";

	const filteredDomains = Object.entries(groupedNotes.domains).filter(
		([domain, data]) => {
			if (!normalizedQuery) return true;

			// ドメイン自体にマッチするか
			if (domain.toLowerCase().includes(normalizedQuery)) return true;

			// 各ページにマッチするか
			return Object.keys(data.pages).some((url) =>
				normalizeUrlForGrouping(url.toLowerCase()).includes(normalizedQuery),
			);
		},
	);

	const newNoteParams = new URLSearchParams();
	if (currentView) newNoteParams.set("view", currentView);
	if (currentDomain) newNoteParams.set("domain", currentDomain);
	if (currentExact) newNoteParams.set("exact", currentExact);
	newNoteParams.set("globalNew", "note");
	const newNoteHref = `/notes?${newNoteParams.toString()}`;

	// 親DOMAINSフォルダの開閉・自動展開ロジック
	const isAnyDomainActive = currentDomain && currentDomain !== "inbox";
	const shouldForceOpenDomains = !!normalizedQuery || isAnyDomainActive;
	const [isDomainsOpen, setIsDomainsOpen] = useState(() => shouldForceOpenDomains);
	const effectiveIsDomainsOpen = isDomainsOpen || shouldForceOpenDomains;

	return (
		<div className="flex flex-col h-full bg-base-surface border-r border-base-border w-72 overflow-hidden">
			<div className="p-4 border-b border-base-border bg-base-bg">
				<Link
					href="/"
					className="flex items-center gap-2 mb-8 cursor-pointer group w-fit"
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
					className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-action px-3 py-2 text-sm font-medium text-action-text transition-colors hover:bg-action-hover cursor-pointer"
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

			<div className="p-4 border-t border-base-border bg-base-bg flex items-center justify-between gap-4">
				<Link
					href="/studio"
					className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-action text-action-text rounded-md text-sm font-medium hover:bg-action-hover transition-colors cursor-pointer"
				>
					<span>Studio</span>
				</Link>
				<UserMenu />
			</div>
		</div>
	);
}

type DomainAccordionItemProps = {
	domainName: string;
	domainData: DomainGroup;
	normalizedQuery: string;
	currentDomain: string | null;
	currentExact: string | null;
};

function DomainAccordionItem({
	domainName,
	domainData,
	normalizedQuery,
	currentDomain,
	currentExact,
}: DomainAccordionItemProps) {
	const isUnderThisDomain = currentDomain === domainName;
	const [isOpen, setIsOpen] = useState(false);
	const fetchContentForIds = useNotesStore((state) => state.fetchContentForIds);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (open) {
			// フォルダが開かれた瞬間にプリフェッチ
			const ids = [
				...domainData.domainNotes,
				...Object.values(domainData.pages).flat(),
			]
				.filter((n): n is Note => n.content === undefined) // 未取得のものだけ抽出
				.map((n) => n.id);

			if (ids.length > 0) {
				fetchContentForIds(ids);
			}
		}
	};

	// 検索中、またはこのドメイン配下を選択中の場合は強制展開
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
			{/* Domain Header: Toggles Only */}
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

			{/* Children: Domain Notes & Page Pages */}
			{effectiveIsOpen && (
				<div className="ml-3.5 mt-0.5 space-y-0.5 border-l-2 border-base-border pl-3">
					{/* Approach B: Domain Scope Notes (Always at top if open) */}
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

					{/* Page Pages */}
					{Object.entries(domainData.pages).map(([url, _notes]) => {
						const isActive = currentExact === url;
						const path = getPath(url);

						// 検索中の場合、マッチしないページは非表示にする
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
