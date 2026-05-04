"use client";

import { FileText, PenSquare, Plus } from "lucide-react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { UserMenu } from "@/app/(dashboard)/_components/UserMenu";
import { SearchModal } from "@/app/(dashboard)/notes/_components/SearchModal";
import PaywallModal from "@/app/(dashboard)/studio/_components/PaywallModal";
import { GlobalNewNoteDialog } from "@/components/dialogs/GlobalNewNoteDialog";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useUserStore } from "@/store/useUserStore";
import { GlobalSidebar } from "./GlobalSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

function MobileFABInner() {
	const searchParams = useSearchParams();

	// FABの Shallow Routing
	const handleOpenGlobalNew = (type: "note" | "draft") => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("globalNew", type);
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.pushState(null, "", newUrl);
		// App Router環境で再レンダリングを促すため、popstateを発火させるかrouterを併用する場合があるが
		// 設計図に従い pushState を使用
		window.dispatchEvent(new PopStateEvent("popstate"));
	};

	return (
		<div className="md:hidden fixed bottom-20 right-4 z-40">
			<Popover>
				<PopoverTrigger
					render={
						<Button
							size="icon"
							className="h-14 w-14 rounded-full shadow-xl bg-action text-action-text hover-safe:bg-action-hover cursor-pointer transition-transform active:scale-95"
						>
							<Plus className="w-6 h-6" aria-hidden="true" />
						</Button>
					}
				/>
				<PopoverContent
					side="top"
					align="end"
					sideOffset={12}
					className="w-48 p-2 flex flex-col gap-1 z-50"
				>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => handleOpenGlobalNew("note")}
						className="flex items-center justify-start gap-2 w-full cursor-pointer text-gray-600 hover:text-action"
					>
						<FileText className="w-4 h-4" aria-hidden="true" />
						New Note
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => handleOpenGlobalNew("draft")}
						className="flex items-center justify-start gap-2 w-full cursor-pointer text-gray-600 hover:text-action"
					>
						<PenSquare className="w-4 h-4" aria-hidden="true" />
						New Draft
					</Button>
				</PopoverContent>
			</Popover>
		</div>
	);
}

export function AppShell({ children }: { children: React.ReactNode }) {
	const _pathname = usePathname();
	const _isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const _setIsSidebarOpen = useLayoutStore((state) => state.setIsSidebarOpen);
	const isMobileHeaderVisible = useLayoutStore(
		(state) => state.isMobileHeaderVisible,
	);
	const setIsMobileHeaderVisible = useLayoutStore(
		(state) => state.setIsMobileHeaderVisible,
	);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
	const { isPaywallOpen, paywallType, closePaywall, plan } = useUserStore();

	// Global scroll monitoring (centralized)
	useEffect(() => {
		// 各スクロールコンテナの直前の位置を個別に記憶する
		const scrollPositions = new WeakMap<EventTarget, number>();
		let ticking = false;

		const handleGlobalScroll = (e: Event) => {
			const target = e.target;
			if (!(target instanceof HTMLElement) && target !== document) return;

			// テキストエリアや小さなコードブロックなど、メインレイアウト以外のスクロールを無視
			if (target instanceof HTMLElement && target.clientHeight < 300) return;

			const currentScrollY =
				target === document
					? window.scrollY
					: (target as HTMLElement).scrollTop;

			const lastScrollY = scrollPositions.get(target) || 0;

			if (!ticking) {
				window.requestAnimationFrame(() => {
					const delta = currentScrollY - lastScrollY;

					// レイアウトシフトによる微小なスクロール（ガタつき）を無視するため、
					// スクロール量のしきい値（delta > 10 / delta < -10）を設ける
					if (currentScrollY > 50 && delta > 10) {
						setIsMobileHeaderVisible(false);
					} else if (currentScrollY <= 50 || delta < -10) {
						setIsMobileHeaderVisible(true);
					}

					scrollPositions.set(target, currentScrollY);
					ticking = false;
				});
				ticking = true;
			}
		};

		// Capture phase listener to catch scroll events from any container
		window.addEventListener("scroll", handleGlobalScroll, true);

		return () => {
			window.removeEventListener("scroll", handleGlobalScroll, true);
		};
	}, [setIsMobileHeaderVisible]);

	return (
		<div className="flex h-screen w-full overflow-hidden bg-base-bg text-action">
			{/* PC Sidebar (Persistent Rail UI) */}
			<aside className="hidden md:flex flex-col w-16 bg-base-surface border-r border-base-border shrink-0">
				<Suspense fallback={null}>
					<GlobalSidebar onSearchOpen={() => setIsSearchModalOpen(true)} />
				</Suspense>
			</aside>

			{/* Mobile Menu */}
			<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
				<SheetContent side="left" className="p-0 w-72">
					<SheetHeader className="sr-only">
						<SheetTitle>Navigation Menu</SheetTitle>
						<SheetDescription>
							Access your inbox, drafts, and domains
						</SheetDescription>
					</SheetHeader>
					<Suspense fallback={null}>
						<GlobalSidebar onSearchOpen={() => setIsSearchModalOpen(true)} />
					</Suspense>
				</SheetContent>
			</Sheet>

			<main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
				{/* Mobile Toggle Header */}
				<header
					className={cn(
						"md:hidden h-14 flex items-center justify-between px-4 shrink-0 bg-base-bg border-b border-base-border z-20 transition-all duration-300",
						!isMobileHeaderVisible && "-mt-14",
					)}
				>
					<Link href="/" className="flex items-center">
						<Image src="/logo.svg" alt="sitecue" width={28} height={28} />
					</Link>
					<div className="w-10 h-10">
						<Suspense fallback={null}>
							<UserMenu />
						</Suspense>
					</div>
				</header>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto relative flex flex-col">
					{children}
				</div>
			</main>

			{/* Global Dialog */}
			<Suspense fallback={null}>
				<GlobalNewNoteDialog />
			</Suspense>

			<SearchModal
				isOpen={isSearchModalOpen}
				onClose={() => setIsSearchModalOpen(false)}
			/>

			{/* FAB (Mobile Only) */}
			<Suspense fallback={null}>
				<MobileFABInner />
			</Suspense>

			<MobileBottomNav onSearchOpen={() => setIsSearchModalOpen(true)} />

			<PaywallModal
				isOpen={isPaywallOpen}
				onClose={closePaywall}
				plan={plan as "free" | "pro"}
				limitType={paywallType}
			/>
		</div>
	);
}
