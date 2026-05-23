import { fetchTopDomainActivity } from "@sitecue/shared";
import { ArrowRight, Calendar, Clock, Layers } from "lucide-react";
import { Suspense } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { requireUser } from "@/utils/supabase/server";
import { ContributionTimeline } from "./_components/ContributionTimeline";
import { DomainDashboardCard } from "./_components/DomainDashboardCard";
import { RadialActivityChart } from "./_components/RadialActivityChart";

// Today's Stats card component
async function TodayRecapCard() {
	const { supabase, user } = await requireUser("/");

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const startOfDay = today.toISOString();

	const [{ count: todayNotes }, { count: todayDrafts }] = await Promise.all([
		supabase
			.from("sitecue_notes")
			.select("*", { count: "exact", head: true })
			.eq("user_id", user.id)
			.gte("created_at", startOfDay),
		supabase
			.from("sitecue_drafts")
			.select("*", { count: "exact", head: true })
			.eq("user_id", user.id)
			.gte("created_at", startOfDay),
	]);

	const todayTotal = (todayNotes || 0) + (todayDrafts || 0);

	const formattedDate = new Date().toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});

	return (
		<div className="flex flex-col justify-between p-5 rounded-xl bg-base-surface border border-base-border h-full">
			<div className="flex justify-between items-start">
				<div>
					<span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">
						Today's Focus
					</span>
					<h3 className="text-sm font-semibold text-neutral-500 mt-1">
						{formattedDate}
					</h3>
				</div>
				<Calendar className="w-4 h-4 text-neutral-400" aria-hidden="true" />
			</div>

			<div className="my-2">
				<span className="text-5xl font-extrabold tracking-tighter text-action">
					{todayTotal}
				</span>
				<span className="text-xs text-neutral-500 ml-1.5 font-medium">
					new entries today
				</span>
			</div>

			<Link
				href="/notes"
				className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover-safe:text-action transition-colors group/link mt-auto"
			>
				<span>Open inbox</span>
				<ArrowRight
					className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5"
					aria-hidden="true"
				/>
			</Link>
		</div>
	);
}

// Domain Dashboard Grid Component
async function DomainDashboardGrid() {
	const { supabase, user } = await requireUser("/");
	const topDomains = await fetchTopDomainActivity(supabase, user.id, 6);

	if (topDomains.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-base-border p-8 text-center text-sm text-neutral-500">
				No active domain tracking detected. Capture notes via Extension to build
				domain activity.
			</div>
		);
	}

	const domainsWithNotes = await Promise.all(
		topDomains.map(async (d) => {
			const { data: notes } = await supabase
				.from("sitecue_notes")
				.select("id, content")
				.eq("user_id", user.id)
				.eq("scope", "domain")
				.eq("url_pattern", d.domain)
				.order("created_at", { ascending: false })
				.limit(3);
			return {
				domain: d.domain,
				totalCount: d.noteCount,
				recentNotes: notes || [],
			};
		}),
	);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{domainsWithNotes.map((item) => (
				<DomainDashboardCard
					key={item.domain}
					domain={item.domain}
					totalCount={item.totalCount}
					recentNotes={item.recentNotes}
				/>
			))}
		</div>
	);
}

// Main page component
export default async function LaunchpadPage() {
	await requireUser("/");

	return (
		<div className="flex-1 bg-base-bg text-action font-sans overflow-y-auto">
			<main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12 flex flex-col gap-10">
				{/* ① [最上部] ダッシュボード（Radial Chart & 今日のノート等） */}
				<section className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Suspense
						fallback={
							<div className="h-48 md:col-span-2 bg-base-surface rounded-xl border border-base-border animate-pulse" />
						}
					>
						<RadialActivityChart />
					</Suspense>
					<Suspense
						fallback={
							<div className="h-48 bg-base-surface rounded-xl border border-base-border animate-pulse" />
						}
					>
						<TodayRecapCard />
					</Suspense>
				</section>

				{/* ② [中央] Domain Activity 情報コンテナ */}
				<section>
					<div className="flex items-center gap-2 mb-4">
						<Layers className="w-4 h-4 text-neutral-400" aria-hidden="true" />
						<h2 className="text-base font-bold tracking-tight text-action">
							Domain Activity
						</h2>
					</div>
					<Suspense
						fallback={
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								<div className="h-28 bg-base-surface rounded-xl border border-base-border animate-pulse" />
								<div className="h-28 bg-base-surface rounded-xl border border-base-border animate-pulse" />
								<div className="h-28 bg-base-surface rounded-xl border border-base-border animate-pulse" />
							</div>
						}
					>
						<DomainDashboardGrid />
					</Suspense>
				</section>

				{/* ③ [下部] Contribution Activity タイムライン */}
				<section className="pb-8">
					<div className="flex items-center gap-2 mb-5">
						<Clock className="w-4 h-4 text-neutral-400" aria-hidden="true" />
						<h2 className="text-base font-bold tracking-tight text-action">
							Activity Log
						</h2>
					</div>
					<Suspense
						fallback={
							<div className="pl-4 ml-2 flex flex-col gap-4">
								<div className="h-8 w-2/3 bg-base-surface/50 rounded animate-pulse" />
								<div className="h-8 w-1/2 bg-base-surface/50 rounded animate-pulse" />
							</div>
						}
					>
						<ContributionTimeline />
					</Suspense>
				</section>
			</main>
		</div>
	);
}
