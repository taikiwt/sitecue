import { ArrowRight, Clock } from "lucide-react";
import { LocalizedDate, T } from "@/components/i18n/T";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { requireUser } from "@/utils/supabase/server";

export async function RecentDraftsSection() {
	const { supabase } = await requireUser("/");
	const { data: recentDrafts } = await supabase
		.from("sitecue_drafts")
		.select("*")
		.order("updated_at", { ascending: false })
		.limit(5);

	return (
		<div className="w-full min-w-0">
			<div className="mb-4 md:mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Clock className="w-4 h-4 text-neutral-400" aria-hidden="true" />
					<h2 className="text-lg text-action tracking-tight">
						<T k="dashboard.recentDrafts" />
					</h2>
				</div>
				<Link
					href="/notes?view=drafts"
					className="text-xs font-medium text-neutral-400 hover:text-action transition-colors"
				>
					<T k="dashboard.viewAll" />
				</Link>
			</div>
			<div className="flex flex-col w-full min-w-0">
				{(!recentDrafts || recentDrafts.length === 0) && (
					<div className="py-8 text-center border border-dashed border-base-border rounded-xl">
						<p className="text-xs text-neutral-400 italic">
							<T k="dashboard.noDraftsYet" />
						</p>
					</div>
				)}
				{recentDrafts?.map((draft) => (
					<Link
						key={draft.id}
						href={`/studio/${draft.id}`}
						className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 border-b border-base-border/50 last:border-0 md:-mx-3 md:px-3 rounded-lg launchpad-transition launchpad-card-recent"
					>
						<div className="min-w-0">
							<h3 className="text-sm text-action truncate group-hover:text-action-hover">
								{draft.title || <T k="dashboard.untitledDraft" />}
							</h3>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-[10px] text-neutral-400 font-mono">
								<LocalizedDate dateStr={draft.updated_at} />
							</span>
							<ArrowRight
								className="w-3.5 h-3.5 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-neutral-900"
								aria-hidden="true"
							/>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
