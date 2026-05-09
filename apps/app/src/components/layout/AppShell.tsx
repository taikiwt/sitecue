"use client";

import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { UserMenu } from "@/app/(dashboard)/_components/UserMenu";
import { SearchModal } from "@/app/(dashboard)/notes/_components/SearchModal";
import PaywallModal from "@/app/(dashboard)/studio/_components/PaywallModal";
import { GlobalNewNoteDialog } from "@/components/dialogs/GlobalNewNoteDialog";
import { CustomLink as Link } from "@/components/ui/custom-link";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useUserStore } from "@/store/useUserStore";
import { GlobalSidebar } from "./GlobalSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
	const _pathname = usePathname();
	const _isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const _setIsSidebarOpen = useLayoutStore((state) => state.setIsSidebarOpen);

	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
	const { isPaywallOpen, paywallType, closePaywall, plan } = useUserStore();

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-base-bg text-action">
			{/* h-screen を h-dvh に変更し、動的な高さを確保 */}
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
				{/* Mobile Toggle Header -> 静的ヘッダーに変更 */}
				<header className="md:hidden h-14 flex items-center justify-between px-4 shrink-0 bg-base-bg border-b border-base-border z-20">
					<Link
						href="/"
						className="flex items-center text-lg font-bold tracking-tight text-action"
					>
						sitecue
					</Link>
					<div className="w-10 h-10">
						<Suspense fallback={null}>
							<UserMenu />
						</Suspense>
					</div>
				</header>

				{/* Content Area */}
				<div className="flex-1 overflow-y-auto relative flex flex-col min-w-0">
					{children}
				</div>

				<MobileBottomNav onSearchOpen={() => setIsSearchModalOpen(true)} />
			</main>

			{/* Global Dialog */}
			<Suspense fallback={null}>
				<GlobalNewNoteDialog />
			</Suspense>

			<SearchModal
				isOpen={isSearchModalOpen}
				onClose={() => setIsSearchModalOpen(false)}
			/>

			<PaywallModal
				isOpen={isPaywallOpen}
				onClose={closePaywall}
				plan={plan as "free" | "pro"}
				limitType={paywallType}
			/>
		</div>
	);
}
