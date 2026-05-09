import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock, PenSquare } from "lucide-react";

export function PinnedSitesSkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden mb-8 md:mb-16">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
        </div>
    );
}

export function StatsOverviewSkeleton() {
    return (
        <div>
            <div className="mb-4 md:mb-8 flex items-center gap-2">
                <Activity className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                <h1 className="text-xl font-light text-action tracking-tight">Overview</h1>
            </div>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-base-border pb-2 h-9">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-8" />
                </div>
                <div className="flex items-center justify-between border-b border-base-border pb-2 h-9">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-8" />
                </div>
            </div>
        </div>
    );
}

export function RecentDraftsSkeleton() {
    return (
        <div>
            <div className="mb-4 md:mb-6 flex items-center justify-between h-6">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                    <h2 className="text-lg text-action tracking-tight">Recent Drafts</h2>
                </div>
                <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex flex-col">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-base-border/50 -mx-3 px-3 h-[45px]">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-20 ml-4" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function TemplateSelectorSkeleton() {
    return (
        <>
            <div className="mb-6 md:mb-8 flex items-center justify-between h-7">
                <div className="flex items-center gap-2">
                    <PenSquare className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                    <h2 className="text-xl text-action font-light tracking-tight">Start a Draft</h2>
                </div>
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
                <Skeleton className="h-[108px] rounded-xl" />
                <Skeleton className="h-[108px] rounded-xl" />
                <Skeleton className="h-[108px] rounded-xl" />
            </div>
        </>
    );
}
