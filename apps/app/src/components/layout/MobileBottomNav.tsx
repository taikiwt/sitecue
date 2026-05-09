"use client";

import { FileText, Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";

interface MobileBottomNavProps {
	onSearchOpen: () => void;
}

function MobileBottomNavInner({ onSearchOpen }: MobileBottomNavProps) {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const isDetailOpen = !!(
		searchParams.get("noteId") || searchParams.get("draftId")
	);

	const isStudioPage = pathname?.startsWith("/studio");

	// Hide bottom nav when detail pane is open on mobile or on studio page
	if (isDetailOpen || isStudioPage) return null;

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-surface border-t border-base-border pb-safe">
			<div className="flex justify-around items-center h-16">
				{/* Notes */}
				<Link
					href="/notes"
					className="flex flex-col items-center p-2 text-gray-500 hover-safe:text-action transition-colors"
				>
					<FileText className="w-6 h-6" aria-hidden="true" />
					<span className="sr-only">Notes</span>
				</Link>

				{/* Logo (New Note) */}
				<button
					type="button"
					onClick={() => {
						const params = new URLSearchParams(searchParams.toString());
						params.set("globalNew", "note");
						const newUrl = `${pathname}?${params.toString()}`;
						window.history.pushState(null, "", newUrl);
						window.dispatchEvent(new PopStateEvent("popstate"));
					}}
					className="flex flex-col items-center p-2 transition-transform active:scale-95 cursor-pointer"
					aria-label="New Note"
				>
					<Image src="/logo.svg" alt="New Note" width={32} height={32} />
				</button>

				{/* Search */}
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

export function MobileBottomNav(props: MobileBottomNavProps) {
	return (
		<Suspense fallback={null}>
			<MobileBottomNavInner {...props} />
		</Suspense>
	);
}
