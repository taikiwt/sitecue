"use client";

import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";

export function StudioEditorSkeleton({
	hasDraftId = false,
}: {
	hasDraftId?: boolean;
}) {
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-base-bg text-action">
			{/* Header exactly matching DraftEditorHeader */}
			<header
				className={cn(
					"flex items-center justify-between border-b border-neutral-100 px-6 py-4 transition-all duration-300 shrink-0",
					!isSidebarOpen && "md:pl-16",
				)}
			>
				<div className="flex items-center gap-4">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled
						className="text-neutral-500 -ml-2 gap-1.5 cursor-default"
					>
						<ArrowLeft className="w-4 h-4" aria-hidden="true" />
						{hasDraftId ? "Back" : "Cancel"}
					</Button>
				</div>

				<div className="flex items-center gap-4">
					{/* Disabled UndoRedoControls shape */}
					<div className="flex items-center gap-1 border-x border-neutral-100 px-4">
						<Button
							variant="ghost"
							size="icon"
							disabled
							className="h-8 w-8 cursor-default"
						/>
						<Button
							variant="ghost"
							size="icon"
							disabled
							className="h-8 w-8 cursor-default"
						/>
					</div>

					<Button
						disabled
						size="sm"
						className="w-24 rounded-full cursor-default"
						type="button"
					>
						Save
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled
						className="text-neutral-400 cursor-default"
					>
						<MoreHorizontal className="size-5 md:size-4" aria-hidden="true" />
					</Button>
				</div>
			</header>

			{/* Main Canvas Area (Pure Text Shimmer without line numbers) */}
			<div className="flex-1 overflow-y-auto p-6 md:p-12">
				<div className="mx-auto max-w-3xl space-y-6">
					{/* Title Shimmer */}
					<Skeleton className="h-8 w-3/4 rounded-md" />

					{/* Metadata Shimmer */}
					<Skeleton className="h-3 w-1/4 rounded-md" />

					{/* Prose Canvas Lines */}
					<div className="space-y-3 pt-4">
						<Skeleton className="h-4 w-full rounded-md" />
						<Skeleton className="h-4 w-5/6 rounded-md" />
						<Skeleton className="h-4 w-full rounded-md" />
						<Skeleton className="h-4 w-4/5 rounded-md" />
						<Skeleton className="h-4 w-2/3 rounded-md" />
					</div>
				</div>
			</div>
		</div>
	);
}
