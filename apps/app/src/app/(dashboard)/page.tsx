import { Suspense } from "react";
import { Library, ArrowRight } from "lucide-react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { requireUser } from "@/utils/supabase/server";
import { PinnedSitesManager } from "./_components/PinnedSitesManager";
import { StatsOverviewSection } from "./_components/StatsOverviewSection";
import { RecentDraftsSection } from "./_components/RecentDraftsSection";
import { TemplateSelectorSection } from "./_components/TemplateSelectorSection";
import { PinnedSitesSkeleton, StatsOverviewSkeleton, RecentDraftsSkeleton, TemplateSelectorSkeleton } from "./_components/Skeletons";
import type { PinnedSite } from "../../../../../types/app";

// Server Actionsを利用したServer Component
async function PinnedSitesSection() {
    const { supabase } = await requireUser("/");
    const { data: pinnedSites } = await supabase
        .from("sitecue_pinned_sites")
        .select("*")
        .order("created_at", { ascending: false });
    
    return <PinnedSitesManager initialSites={(pinnedSites as PinnedSite[]) ?? []} />;
}

export default async function LaunchpadPage() {
    // 最速で認証ガードのみ通過させる
    await requireUser("/");

    return (
        <div className="flex-1 bg-base-bg text-action font-sans overflow-y-auto">
            <main className="mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-12">
                <div className="mb-8 md:mb-16">
                    <Suspense fallback={<PinnedSitesSkeleton />}>
                        <PinnedSitesSection />
                    </Suspense>
                </div>

                <div className="mb-8 md:mb-20 grid gap-8 md:gap-12 md:grid-cols-[1fr_2fr] items-start">
                    <div>
                        <Suspense fallback={<StatsOverviewSkeleton />}>
                            <StatsOverviewSection />
                        </Suspense>
                    </div>
                    <div>
                        <Suspense fallback={<RecentDraftsSkeleton />}>
                            <RecentDraftsSection />
                        </Suspense>
                    </div>
                </div>

                <section className="mb-12 md:mb-20">
                    <Suspense fallback={<TemplateSelectorSkeleton />}>
                        <TemplateSelectorSection />
                    </Suspense>
                </section>

                <section className="mb-12">
                    <Link href="/notes" className="group flex w-full items-center justify-between rounded-xl border border-base-border bg-base-surface p-4 cursor-pointer launchpad-transition launchpad-card-manage">
                        <div className="flex items-center gap-3">
                            <Library className="w-5 h-5 text-neutral-500" aria-hidden="true" />
                            <div>
                                <h3 className="text-base text-action">Manage Notes</h3>
                                <p className="text-xs text-neutral-500">
                                    View and organize all your created notes and drafts.
                                </p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </Link>
                </section>
            </main>
        </div>
    );
}
