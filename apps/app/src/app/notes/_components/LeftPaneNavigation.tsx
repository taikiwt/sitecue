"use client";

import Link from "next/link";
import { useState } from "react";
import type { GroupedNotes } from "../types";

type Props = {
	groupedNotes: GroupedNotes;
	currentDomain: string | null;
	currentExact: string | null;
};

export function LeftPaneNavigation({
	groupedNotes,
	currentDomain,
	currentExact,
}: Props) {
	const isInboxActive = !currentDomain && !currentExact;

	// アコーディオンの開閉状態（ドメイン名がキー）
	// 初期状態として、現在選択されているドメインがあればそれを開いておく
	const [openDomains, setOpenDomains] = useState<Record<string, boolean>>(
		() => {
			if (currentDomain) {
				return { [currentDomain]: true };
			}
			return {};
		},
	);

	const toggleDomain = (domain: string) => {
		setOpenDomains((prev) => ({
			...prev,
			[domain]: !prev[domain],
		}));
	};

	const getPath = (url: string) => {
		try {
			const parsed = new URL(url);
			return parsed.pathname + parsed.search + parsed.hash;
		} catch (_e) {
			return url;
		}
	};

	return (
		<div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 w-72 overflow-y-auto">
			<div className="p-4 border-b border-gray-200 bg-white">
				<Link href="/" className="text-xl font-bold flex items-center gap-2">
					<span className="text-indigo-600">SiteCue</span>
				</Link>
			</div>

			<nav className="flex-1 py-4">
				{/* Inbox */}
				<div className="px-2 mb-4">
					<Link
						href="/notes"
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

				<div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
					Domains
				</div>

				{/* Domains Accordion */}
				<div className="space-y-1">
					{Object.entries(groupedNotes.domains).map(([domain, data]) => {
						const isOpen = openDomains[domain];
						const isDomainActive = currentDomain === domain && !currentExact;

						return (
							<div key={domain} className="px-2">
								{/* Domain Header */}
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => toggleDomain(domain)}
										className="p-1 text-gray-400 hover:text-gray-600 transition-transform"
										style={{
											transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
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
									</button>
									<Link
										href={`/notes?domain=${encodeURIComponent(domain)}`}
										className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
											isDomainActive
												? "bg-indigo-50 text-indigo-700 font-medium"
												: "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
										}`}
									>
										<span className="truncate" title={domain}>
											{domain}
										</span>
									</Link>
								</div>

								{/* Exact Pages */}
								{isOpen && (
									<div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-2">
										{Object.entries(data.exactPages).map(([url, _notes]) => {
											const isActive = currentExact === url;
											const path = getPath(url);

											return (
												<Link
													key={url}
													href={`/notes?domain=${encodeURIComponent(
														domain,
													)}&exact=${encodeURIComponent(url)}`}
													className={`block px-2 py-1 text-xs rounded transition-colors truncate ${
														isActive
															? "bg-white text-indigo-600 font-medium shadow-sm"
															: "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
													}`}
													title={url}
												>
													{path}
												</Link>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
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
