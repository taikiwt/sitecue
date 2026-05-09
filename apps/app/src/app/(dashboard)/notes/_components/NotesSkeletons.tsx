import { Skeleton } from "@/components/ui/skeleton";

export function MiddlePaneListSkeleton() {
	return (
		<div className="flex-1 overflow-y-auto px-4 py-2">
			<div className="space-y-4">
				{[
					"note-skel-1",
					"note-skel-2",
					"note-skel-3",
					"note-skel-4",
					"note-skel-5",
					"note-skel-6",
					"note-skel-7",
					"note-skel-8",
					"note-skel-9",
					"note-skel-10",
				].map((id) => (
					<div
						key={id}
						className="flex flex-col gap-2 border-b border-base-border/50 pb-4 h-[80px]"
					>
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-16" />
						</div>
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-4/5" />
					</div>
				))}
			</div>
		</div>
	);
}
