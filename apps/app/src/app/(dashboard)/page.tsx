import { fetchDashboardDomainActivity } from "@sitecue/shared";
import { Activity, CalendarDays, Layers } from "lucide-react";
import { Suspense } from "react";
import { CustomLink } from "@/components/ui/custom-link";
import { requireUser } from "@/utils/supabase/server";
import { AppendDiaryButton } from "./_components/AppendDiaryButton";
import { ContributionTimeline } from "./_components/ContributionTimeline";
import { DomainDashboardCard } from "./_components/DomainDashboardCard";
import { RadialActivityChart } from "./_components/RadialActivityChart";

// Today's Stats card component
async function TodayRecapCard() {
	const { supabase, user } = await requireUser("/");

	// 基準となる Date インスタンスの生成と JST（UTC+9時間）への厳格な物理オフセット補正
	const d = new Date();
	const jstTime = d.getTime() + 9 * 60 * 60 * 1000;
	const jstDate = new Date(jstTime);

	// サーバー環境に左右されない JST 基準の日付プレーン文字列（YYYY-MM-DD）の切り出し
	const year = jstDate.getUTCFullYear();
	const month = String(jstDate.getUTCMonth() + 1).padStart(2, "0");
	const day = String(jstDate.getUTCDate()).padStart(2, "0");
	const todayStr = `${year}-${month}-${day}`;

	// 統計クエリ用の「JSTの今日の始まり（00:00:00+09:00）」のISO文字列を完全固定生成
	const startOfDay = `${todayStr}T00:00:00+09:00`;

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

	// 日めくりカレンダーボックス用のパースも、JST基準の jstDate から安全に組み立てる
	const monthYearStr = jstDate
		.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
			timeZone: "UTC",
		})
		.toUpperCase();
	const dayNumStr = day;
	const weekdayStr = jstDate
		.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
		.toUpperCase();

	const currentYear = year.toString();
	const currentMonth = month;

	return (
		<div className="flex flex-col justify-between items-center p-5 rounded-xl bg-base-surface border border-base-border h-full min-h-[340px] md:min-h-[320px]">
			{/* ヘッダーセクション */}
			<div className="flex justify-between items-start w-full">
				<div>
					<span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">
						Today's Focus
					</span>
				</div>
				{/* 右上のカレンダーアイコン（CustomLink で囲う。カプセルUIの掟に従い rounded-full と hover-safe を適用） */}
				<CustomLink
					href={`/notes?view=diaries&year=${currentYear}&month=${currentMonth}`}
					className="p-1.5 text-neutral-400 hover-safe:text-action hover-safe:bg-neutral-100 rounded-full transition-colors"
					title="View Diaries Timeline"
				>
					<CalendarDays className="w-4 h-4" aria-hidden="true" />
				</CustomLink>
			</div>

			{/* メインレイアウト: カレンダーボックスとライトアップ数値を配置 */}
			<div className="flex flex-col items-center gap-4 my-4 flex-1">
				{/* 1. 日めくりカレンダーボックス（CustomLink に置換） */}
				<CustomLink
					className="relative w-24 h-28 md:w-20 md:h-24 lg:w-28 lg:h-32 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-base-border/60 overflow-hidden flex flex-col items-center select-none shrink-0 hover:scale-102 transition-transform cursor-pointer group/box"
					href={`/diaries/${todayStr}`}
				>
					<div className="w-full bg-action py-1 text-center text-[9px] font-bold tracking-wider text-white font-mono">
						{monthYearStr}
					</div>
					<div className="flex-1 flex items-center justify-center">
						<span className="text-5xl font-black tracking-tighter text-neutral-900 dark:text-neutral-100 font-mono">
							{dayNumStr}
						</span>
					</div>
					<div className="w-full text-center pb-1.5 text-[9px] font-bold tracking-widest text-neutral-400 font-mono">
						{weekdayStr}
					</div>
				</CustomLink>

				{/* 2. 「+ append to today's diary」テキストリンク（Zustandキックのクライアントボタン） */}
				<AppendDiaryButton />

				{/* 修正ポイント3: 勝手に削除された元の実績表示文言（new entries today）を完全に復活 */}
				<div className="flex flex-col justify-center items-center text-center mt-2">
					<div className="flex items-baseline gap-1">
						<span className="text-4xl font-black tracking-tighter text-action drop-shadow-sm font-mono">
							{todayTotal}
						</span>
						<span className="text-xs text-neutral-400 font-bold font-mono">
							new entries today
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// Domain Dashboard Grid Component
async function DomainDashboardGrid() {
	const { supabase, user } = await requireUser("/");
	const activities = await fetchDashboardDomainActivity(supabase, user.id, 6);

	if (activities.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-base-border p-8 text-center text-sm text-neutral-500">
				No active domain tracking detected. Capture notes via Extension to build
				domain activity.
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
			{activities.map((activity) => (
				<DomainDashboardCard key={activity.domain} data={activity} />
			))}
		</div>
	);
}

// Main page component
export default async function LaunchpadPage() {
	await requireUser("/");

	return (
		<div className="flex-1 bg-base-bg text-action font-sans overflow-y-auto">
			<div className="mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col gap-12">
				{/* ① [最上部] ダッシュボード（Radial Chart & 今日のノート等） */}
				<section className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Suspense
						fallback={
							<div className="h-48 bg-base-surface rounded-xl border border-base-border animate-pulse" />
						}
					>
						<TodayRecapCard />
					</Suspense>
					<Suspense
						fallback={
							<div className="h-48 md:col-span-2 bg-base-surface rounded-xl border border-base-border animate-pulse" />
						}
					>
						<RadialActivityChart />
					</Suspense>
				</section>

				{/* ② [中央] Domain Activity 情報コンテナ */}
				<section>
					<div className="flex items-center gap-2 mb-6">
						<Layers className="w-5 h-5 text-neutral-400" aria-hidden="true" />
						<h2 className="text-3xl font-bold tracking-tight text-action">
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
					<div className="flex items-center gap-2 mb-6">
						<Activity className="w-5 h-5 text-neutral-400" aria-hidden="true" />
						<h2 className="text-3xl font-bold tracking-tight text-action">
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
			</div>
		</div>
	);
}
