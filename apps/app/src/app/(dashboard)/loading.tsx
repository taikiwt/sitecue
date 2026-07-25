import { Activity, Layers } from "lucide-react";
import {
	ContributionTimelineSkeleton,
	DomainDashboardGridSkeleton,
	RadialActivityChartSkeleton,
	TodayRecapCardSkeleton,
} from "./_components/Skeletons";

export default function DashboardLoading() {
	return (
		<div className="flex-1 bg-base-bg text-action font-sans overflow-y-auto">
			<div className="mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col gap-12">
				{/* ① [最上部] ダッシュボード */}
				<section className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<TodayRecapCardSkeleton />
					<RadialActivityChartSkeleton />
				</section>

				{/* ② [中央] Domain Activity 情報コンテナ */}
				<section>
					<div className="flex items-center gap-2 mb-6">
						<Layers aria-hidden="true" className="w-5 h-5 text-neutral-400" />
						<h2 className="text-3xl font-bold tracking-tight text-action">
							Domain Activity
						</h2>
					</div>
					<DomainDashboardGridSkeleton />
				</section>

				{/* ③ [下部] Contribution Activity タイムライン */}
				<section className="pb-8">
					<div className="flex items-center gap-2 mb-6">
						<Activity aria-hidden="true" className="w-5 h-5 text-neutral-400" />
						<h2 className="text-3xl font-bold tracking-tight text-action">
							Activity Log
						</h2>
					</div>
					<ContributionTimelineSkeleton />
				</section>
			</div>
		</div>
	);
}
