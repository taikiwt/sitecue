"use client";

import {
	FileText,
	Folder,
	FolderOpen,
	Globe,
	Inbox,
	PenSquare,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getSafeUrl, normalizeUrlForGrouping } from "@/utils/url";
import type { DomainGroup, GroupedNotes } from "../types";

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

	return (
		<div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 w-72 overflow-hidden">
			<div className="p-4 border-b border-gray-200 bg-white">
				<Link
					href="/"
					className="text-xl font-bold flex items-center gap-2 mb-4 cursor-pointer"
				>
					<span className="text-neutral-900">sitecue</span>
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
						className="w-full pl-8 pr-3 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 rounded-lg text-sm transition-all outline-none"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<nav className="flex-1 py-4 overflow-y-auto">
				{/* Inbox */}
				<div className="px-2 mb-4">
					<Link
						href="/notes?domain=inbox"
						className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isInboxActive
								? "bg-neutral-100 text-neutral-900"
								: "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
						}`}
					>
						<Inbox className="w-4 h-4" aria-hidden="true" />
						<span>Inbox</span>
						{groupedNotes.inbox.length > 0 && (
							<span className="ml-auto text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
								{groupedNotes.inbox.length}
							</span>
						)}
					</Link>
				</div>

				{/* Drafts */}
				<div className="px-2 mb-4">
					<Link
						href="/notes?view=drafts"
						className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
							isDraftsActive
								? "bg-neutral-100 text-neutral-900"
								: "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
						}`}
					>
						<PenSquare className="w-4 h-4" aria-hidden="true" />
						<span>Drafts</span>
						{groupedNotes.drafts.length > 0 && (
							<span className="ml-auto text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">
								{groupedNotes.drafts.length}
							</span>
						)}
					</Link>
				</div>

				<div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
					Domains
				</div>

				{/* Domains Accordion */}
				<div className="space-y-1">
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
			</nav>

			<div className="p-4 border-t border-gray-200 bg-white">
				<Link
					href="/studio"
					className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-500 transition-colors cursor-pointer"
				>
					<span>Studio</span>
				</Link>
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
	const [isOpen, setIsOpen] = useState(() => isUnderThisDomain);

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
				onClick={() => setIsOpen(!isOpen)}
				aria-label={`${effectiveIsOpen ? "Close" : "Open"} accordion for ${domainName}`}
				aria-expanded={effectiveIsOpen}
				className={`w-full flex items-center gap-1 group px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
					isUnderThisDomain && !currentExact
						? "bg-neutral-100 text-neutral-900 font-medium"
						: "text-gray-600 hover:bg-neutral-200 hover:text-gray-900"
				}`}
			>
				<span
					aria-hidden="true"
					className="p-0.5 text-gray-400 group-hover:text-gray-600 transition-transform"
					style={{
						transform: effectiveIsOpen ? "rotate(90deg)" : "rotate(0deg)",
					}}
				>
					<svg
						className="w-3 h-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="9 5l7 7-7 7"
						/>
					</svg>
				</span>
				{effectiveIsOpen ? (
					<FolderOpen
						className="w-4 h-4 text-gray-400 mr-1"
						aria-hidden="true"
					/>
				) : (
					<Folder className="w-4 h-4 text-gray-400 mr-1" aria-hidden="true" />
				)}
				<span className="truncate flex-1 text-left" title={domainName}>
					{domainName}
				</span>
			</button>

			{/* Children: Domain Notes & Exact Pages */}
			{effectiveIsOpen && (
				<div className="ml-3.5 mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-3">
					{/* Approach B: Domain Scope Notes (Always at top if open) */}
					<Link
						href={`/notes?domain=${encodeURIComponent(domainName)}`}
						className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
							isUnderThisDomain && !currentExact
								? "bg-white text-neutral-900 font-medium shadow-sm"
								: "text-gray-500 hover:bg-neutral-200 hover:text-gray-900"
						}`}
					>
						<Globe
							className="w-3.5 h-3.5 opacity-60 shrink-0"
							aria-hidden="true"
						/>
						<span className="truncate min-w-0">All notes in {domainName}</span>
					</Link>

					{/* Exact Pages */}
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
										? "bg-white text-neutral-900 font-medium shadow-sm"
										: "text-gray-500 hover:bg-neutral-200 hover:text-gray-900"
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
