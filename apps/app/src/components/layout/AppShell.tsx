"use client";

import { Menu, PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useNotesStore } from "@/store/useNotesStore";
import { GlobalSidebar } from "./GlobalSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const setIsSidebarOpen = useLayoutStore((state) => state.setIsSidebarOpen);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const fetchMetadata = useNotesStore((state) => state.fetchMetadata);
	const pathname = usePathname();

	// Global initial data fetch
	useEffect(() => {
		fetchMetadata();
	}, [fetchMetadata]);

	// Close mobile menu on route change
	useEffect(() => {
		if (pathname) {
			setIsMobileMenuOpen(false);
		}
	}, [pathname]);

	return (
		<div className="flex h-screen w-full overflow-hidden bg-base-bg">
			{/* PC Sidebar */}
			<aside
				className={`hidden md:flex flex-col overflow-hidden transition-all duration-300 ease-in-out bg-base-surface ${
					isSidebarOpen
						? "w-72 border-r border-base-border"
						: "w-0 border-r-0 opacity-0"
				}`}
			>
				<div className="w-72 h-full">
					<Suspense fallback={null}>
						<GlobalSidebar onClose={() => setIsSidebarOpen(false)} />
					</Suspense>
				</div>
			</aside>

			{/* Mobile Sidebar (Sheet / Drawer) */}
			<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
				<SheetContent side="left" className="p-0 w-72">
					<SheetHeader className="sr-only">
						<SheetTitle>Navigation Menu</SheetTitle>
						<SheetDescription>
							Access your inbox, drafts, and domains
						</SheetDescription>
					</SheetHeader>
					<Suspense fallback={null}>
						<GlobalSidebar />
					</Suspense>
				</SheetContent>
			</Sheet>

			{/* Main Content Area */}
			<main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
				{/* PC用 Floating Open Button (アニメーション対応) */}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setIsSidebarOpen(true)}
					title="Open Sidebar"
					className={cn(
						"hidden md:flex absolute top-[14px] left-4 z-50 text-neutral-500 hover:text-neutral-900 transition-all duration-300 cursor-pointer",
						isSidebarOpen
							? "opacity-0 -translate-x-4 pointer-events-none scale-95" // 開いている時は左にズレながら消える
							: "opacity-100 translate-x-0 pointer-events-auto delay-[200ms] scale-100", // 閉じた"後"にフワッと現れる
					)}
				>
					<PanelLeftOpen className="w-5 h-5" aria-hidden="true" />
				</Button>

				{/* Mobile Header */}
				<header className="md:hidden h-12 flex items-center px-4 shrink-0 bg-transparent absolute top-0 left-0 z-10">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsMobileMenuOpen(true)}
						className="text-neutral-500 cursor-pointer"
					>
						<Menu className="w-5 h-5" aria-hidden="true" />
					</Button>
				</header>

				{/* Page Content */}
				<div
					className={`flex-1 overflow-y-auto relative flex flex-col ${isSidebarOpen ? "" : "md:pt-0"} pt-12 md:pt-0`}
				>
					{children}
				</div>
			</main>
		</div>
	);
}
