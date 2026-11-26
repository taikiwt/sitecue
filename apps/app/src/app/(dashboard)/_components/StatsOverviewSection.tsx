import { SHARED_LIMITS } from "@sitecue/shared";
import { Activity } from "lucide-react";
import { T } from "@/components/i18n/T";
import { requireUser } from "@/utils/supabase/server";
import { ComingSoonButton } from "./ComingSoonButton";

export async function StatsOverviewSection() {
	const { supabase } = await requireUser("/");
	const [{ count: notesCount }, { count: draftsCount }] = await Promise.all([
		supabase
			.from("sitecue_notes")
			.select("*", { count: "exact", head: true })
			.is("deleted_at", null),
		supabase
			.from("sitecue_drafts")
			.select("*", { count: "exact", head: true })
			.is("deleted_at", null),
	]);

	const { NOTES_LIMIT } = SHARED_LIMITS;

	return (
		<div>
			<div className="mb-4 md:mb-8 flex items-center gap-2">
				<Activity className="w-5 h-5 text-neutral-400" aria-hidden="true" />
				<h1 className="text-xl font-light text-action tracking-tight">
					<T k="dashboard.overview" />
				</h1>
			</div>

			{notesCount !== null && notesCount >= NOTES_LIMIT.WARNING_THRESHOLD && (
				<div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
					<div className="flex items-center gap-2 text-amber-800">
						<Activity className="w-4 h-4" aria-hidden="true" />
						<span className="text-sm font-medium">
							<T
								k="dashboard.storageAlmostFull"
								values={{ count: notesCount, max: NOTES_LIMIT.MAX_FREE }}
							/>
						</span>
					</div>
					<ComingSoonButton
						text="Upgrade"
						className="text-xs font-bold text-amber-900 hover:text-amber-700 underline underline-offset-2 cursor-pointer"
					/>
				</div>
			)}
			<div className="flex flex-col gap-4 text-sm text-neutral-500">
				<div className="flex items-center justify-between border-b border-base-border pb-2">
					<span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
						<T k="dashboard.totalNotes" />
					</span>
					<span className="text-xl font-light text-action">
						{notesCount || 0}
					</span>
				</div>
				<div className="flex items-center justify-between border-b border-base-border pb-2">
					<span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
						<T k="dashboard.totalDrafts" />
					</span>
					<span className="text-xl font-light text-action">
						{draftsCount || 0}
					</span>
				</div>
			</div>
		</div>
	);
}
