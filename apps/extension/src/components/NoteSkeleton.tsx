import { Skeleton } from "./ui/Skeleton";

export default function NoteSkeleton() {
	// Fixed keys to avoid Biome noArrayIndexKey error
	const skeletonRows = ["skel-row-1", "skel-row-2", "skel-row-3"];

	return (
		<div
			data-testid="note-skeleton"
			className="bg-base-bg p-4 rounded-lg border border-base-border shadow-sm flex flex-col gap-3 h-[130px]"
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-6 w-20 rounded-full" />
				<div className="flex gap-1.5">
					<Skeleton className="h-4 w-4 rounded-full" />
					<Skeleton className="h-4 w-4 rounded-full" />
					<Skeleton className="h-4 w-4 rounded-full" />
				</div>
			</div>

			{/* Content Rows */}
			<div className="space-y-2 mt-2">
				{skeletonRows.map((key, i) => (
					<Skeleton
						key={key}
						className={`h-3 ${i === 2 ? "w-[60%]" : "w-full"}`}
					/>
				))}
			</div>

			{/* Footer (Invisible placeholder to maintain height) */}
			<div className="mt-auto pt-1 border-t border-transparent flex items-center justify-between">
				<Skeleton className="h-4 w-10" />
				<div className="flex gap-3">
					<Skeleton className="h-3.5 w-3.5" />
					<Skeleton className="h-3.5 w-3.5" />
					<Skeleton className="h-3.5 w-3.5" />
				</div>
			</div>
		</div>
	);
}
