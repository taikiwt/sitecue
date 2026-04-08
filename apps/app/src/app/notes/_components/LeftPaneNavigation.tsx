"use client";

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
					className="text-xl font-bold flex items-center gap-2 mb-4"
				>
					<span className="text-indigo-600">SiteCue</span>
				</Link>

				{/* Search Area */}
				<div className="relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
						🔍
					</span>
					<input
						type="search"
						id="nav-search"
						placeholder="URLやドメインを検索..."
						className="w-full pl-8 pr-3 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm transition-all outline-none"
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
								? "bg-indigo-50 text-indigo-700"
								: "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
						}`}
					>
						<span aria-hidden="true">📥</span>
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
								? "bg-indigo-50 text-indigo-700"
								: "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
						}`}
					>
						<span aria-hidden="true">📝</span>
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
					className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
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
				aria-label={`${domainName} のアコーディオンを${effectiveIsOpen ? "閉じる" : "開く"}`}
				aria-expanded={effectiveIsOpen}
				className={`w-full flex items-center gap-1 group px-2 py-1.5 rounded-md text-sm transition-colors ${
					isUnderThisDomain && !currentExact
						? "bg-indigo-50 text-indigo-700 font-medium"
						: "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
				}`}
			>
				<span
					aria-hidden="true"
					className="p-1 text-gray-400 group-hover:text-gray-600 transition-transform"
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
				<span className="truncate flex-1 text-left" title={domainName}>
					{domainName}
				</span>
			</button>

			{/* Children: Domain Notes & Exact Pages */}
			{effectiveIsOpen && (
				<div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-2">
					{/* Approach B: Domain Scope Notes (Always at top if open) */}
					<Link
						href={`/notes?domain=${encodeURIComponent(domainName)}`}
						className={`block px-2 py-1 text-xs rounded transition-colors truncate ${
							isUnderThisDomain && !currentExact
								? "bg-white text-indigo-600 font-medium shadow-sm"
								: "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
						}`}
					>
						<span aria-hidden="true" className="opacity-60 mr-1">
							🌐
						</span>
						{domainName} 全体のノート
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
								className={`block px-2 py-1 text-xs rounded transition-colors truncate ${
									isActive
										? "bg-white text-indigo-600 font-medium shadow-sm"
										: "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
								}`}
								title={url}
							>
								<span aria-hidden="true" className="opacity-60 mr-1">
									📄
								</span>
								{path}
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
