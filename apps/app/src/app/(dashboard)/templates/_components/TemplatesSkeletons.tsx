"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";

export function TemplatesPageSkeleton() {
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	return (
		<div className="flex h-screen overflow-hidden bg-base-bg text-action">
			{/* List Pane matching exact shell */}
			<div className="w-full md:w-80 flex flex-col border-r border-base-border bg-base-surface">
				<div className="flex-1 overflow-y-auto">
					<div
						className={cn(
							"p-4 border-b border-base-border flex items-center justify-between sticky top-0 bg-base-surface z-20 transition-all duration-300",
							!isSidebarOpen && "md:pl-16",
						)}
					>
						<div className="flex items-center gap-2">
							<Link
								href="/"
								className="inline-flex items-center justify-center h-7 w-7 rounded-[min(var(--radius-md),12px)] hover-safe:bg-muted hover-safe:text-foreground transition-colors"
								aria-label="Go back to Launchpad"
							>
								<ArrowLeft className="w-4 h-4 text-action" aria-hidden="true" />
							</Link>
							<h1 className="font-bold text-lg">Templates</h1>
						</div>
						<Link
							href="/templates?id=new"
							className="inline-flex items-center justify-center h-7 w-7 rounded-[min(var(--radius-md),12px)] hover-safe:bg-muted transition-colors text-action"
							aria-label="New Template"
						>
							<Plus className="w-4 h-4" aria-hidden="true" />
						</Link>
					</div>

					<div className="px-2 py-4 space-y-2">
						{[
							"tpl-skel-1",
							"tpl-skel-2",
							"tpl-skel-3",
							"tpl-skel-4",
							"tpl-skel-5",
						].map((id) => (
							<div
								key={id}
								className="flex items-center justify-between px-3 py-2 rounded-lg h-9"
							>
								<Skeleton className="h-4 w-2/3 rounded-md" />
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Desktop Editor Pane Skeleton */}
			{isDesktop && (
				<div className="flex-1 flex flex-col overflow-y-auto p-8">
					<div className="max-w-2xl w-full mx-auto space-y-6">
						<div className="flex items-center justify-between mb-8">
							<Skeleton className="h-8 w-1/3 rounded-md" />
							<Skeleton className="h-9 w-28 rounded-md" />
						</div>
						<div className="space-y-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-24 rounded-md" />
								<Skeleton className="h-9 w-full rounded-md" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-32 rounded-md" />
								<Skeleton className="h-9 w-full rounded-md" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-4 w-40 rounded-md" />
								<Skeleton className="h-24 w-full rounded-md" />
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
