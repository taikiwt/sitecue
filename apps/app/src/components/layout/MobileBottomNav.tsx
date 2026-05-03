"use client";

import { Globe, Inbox, PenSquare, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { CustomLink as Link } from "@/components/ui/custom-link";

interface MobileBottomNavProps {
	onSearchOpen: () => void;
}

export function MobileBottomNav({ onSearchOpen }: MobileBottomNavProps) {
	const searchParams = useSearchParams();
	const isDetailOpen = !!(searchParams.get("noteId") || searchParams.get("draftId"));

	// Hide bottom nav when detail pane is open on mobile
	if (isDetailOpen) return null;

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-surface border-t border-base-border pb-safe">
			<div className="flex justify-around items-center h-16">
				<Link
					href="/notes?domain=inbox"
					className="flex flex-col items-center p-2 text-gray-500 hover-safe:text-action transition-colors"
				>
					<Inbox className="w-6 h-6" aria-hidden="true" />
					<span className="sr-only">Inbox</span>
				</Link>
				<Link
					href="/notes?view=domains"
					className="flex flex-col items-center p-2 text-gray-500 hover-safe:text-action transition-colors"
				>
					<Globe className="w-6 h-6" aria-hidden="true" />
					<span className="sr-only">Domains</span>
				</Link>
				<Link
					href="/notes?view=drafts"
					className="flex flex-col items-center p-2 text-gray-500 hover-safe:text-action transition-colors"
				>
					<PenSquare className="w-6 h-6" aria-hidden="true" />
					<span className="sr-only">Drafts</span>
				</Link>
				<button
					type="button"
					onClick={onSearchOpen}
					className="flex flex-col items-center p-2 text-gray-500 hover-safe:text-action transition-colors cursor-pointer"
					aria-label="Search"
				>
					<Search className="w-6 h-6" aria-hidden="true" />
				</button>
			</div>
		</nav>
	);
}
