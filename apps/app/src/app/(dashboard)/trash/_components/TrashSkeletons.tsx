"use client";

import { ArrowLeft } from "lucide-react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";

const TRASH_SKELETON_KEYS = [
	"trash-skel-1",
	"trash-skel-2",
	"trash-skel-3",
	"trash-skel-4",
];

export function TrashListSkeleton() {
	return (
		<div className="space-y-3" data-testid="trash-list-skeleton">
			{TRASH_SKELETON_KEYS.map((key) => (
				<div
					key={key}
					className="rounded-2xl border border-base-border bg-base-surface p-4 space-y-3"
				>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-5 w-14 rounded-full" />
							<Skeleton className="h-4 w-32 rounded-md" />
						</div>
						<Skeleton className="h-4 w-24 rounded-md" />
					</div>
					<div className="space-y-1.5">
						<Skeleton className="h-4 w-full rounded-md" />
						<Skeleton className="h-4 w-2/3 rounded-md" />
					</div>
					<div className="flex items-center justify-end gap-2 pt-1">
						<Skeleton className="h-7 w-20 rounded-full" />
						<Skeleton className="h-7 w-28 rounded-full" />
					</div>
				</div>
			))}
		</div>
	);
}

export function TrashPageSkeleton() {
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);

	return (
		<div className="flex flex-col h-screen overflow-hidden bg-base-bg text-action">
			<header
				className={cn(
					"shrink-0 border-b border-base-border bg-base-bg px-4 py-4 md:px-8 transition-all duration-300",
					!isSidebarOpen && "md:pl-16",
				)}
			>
				<div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<Link
							href="/"
							className="inline-flex items-center justify-center size-8 rounded-full hover-safe:bg-muted hover-safe:text-action transition-colors shrink-0"
							aria-label="Go back to Launchpad"
						>
							<ArrowLeft className="size-4 text-action" aria-hidden="true" />
						</Link>
						<div className="min-w-0">
							<h1 className="font-bold text-lg text-action leading-tight">
								Trash
							</h1>
							<p className="text-xs text-neutral-400">
								Free: 7 days / Pro: 30 days
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
				<div className="mx-auto max-w-4xl">
					<TrashListSkeleton />
				</div>
			</main>
		</div>
	);
}
