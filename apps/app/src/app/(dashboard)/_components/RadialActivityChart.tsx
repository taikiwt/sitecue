import { Edit3, FileText } from "lucide-react";
import { requireUser } from "@/utils/supabase/server";

export async function RadialActivityChart() {
	const { supabase, user } = await requireUser("/");

	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
	const dateStr = sevenDaysAgo.toISOString();

	const [{ data: notes }, { data: drafts }] = await Promise.all([
		supabase
			.from("sitecue_notes")
			.select("id")
			.eq("user_id", user.id)
			.gte("created_at", dateStr),
		supabase
			.from("sitecue_drafts")
			.select("id")
			.eq("user_id", user.id)
			.gte("created_at", dateStr),
	]);

	const noteCount = notes?.length || 0;
	const draftCount = drafts?.length || 0;

	// Targets for the weekly activity progress
	const targetNotes = 20;
	const targetDrafts = 5;

	// Progress percentages capped at 100%
	const notePct = Math.min(100, (noteCount / targetNotes) * 100);
	const draftPct = Math.min(100, (draftCount / targetDrafts) * 100);

	// Concentric circles parameters
	// Outer Ring (Notes): Radius 64. Circumference = 2 * PI * 64 = 402.12
	const r1 = 64;
	const c1 = 2 * Math.PI * r1;
	const offset1 = c1 - (notePct / 100) * c1;

	// Inner Ring (Drafts): Radius 48. Circumference = 2 * PI * 48 = 301.59
	const r2 = 48;
	const c2 = 2 * Math.PI * r2;
	const offset2 = c2 - (draftPct / 100) * c2;

	return (
		<div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl bg-base-surface border border-base-border md:col-span-2">
			<div className="relative w-32 h-32 flex items-center justify-center shrink-0">
				<svg
					className="w-full h-full transform -rotate-90"
					viewBox="0 0 160 160"
					aria-label="Weekly activity circular progress chart"
					role="img"
				>
					{/* Outer Track (Notes) */}
					<circle
						cx="80"
						cy="80"
						r={r1}
						className="stroke-neutral-100 dark:stroke-neutral-800"
						strokeWidth="6"
						fill="transparent"
					/>
					{/* Outer Progress (Notes) */}
					<circle
						cx="80"
						cy="80"
						r={r1}
						stroke="var(--color-note-info)"
						strokeWidth="6"
						fill="transparent"
						strokeDasharray={c1}
						strokeDashoffset={offset1}
						strokeLinecap="round"
						className="transition-all duration-500 ease-out"
					/>

					{/* Inner Track (Drafts) */}
					<circle
						cx="80"
						cy="80"
						r={r2}
						className="stroke-neutral-100 dark:stroke-neutral-800"
						strokeWidth="6"
						fill="transparent"
					/>
					{/* Inner Progress (Drafts) */}
					<circle
						cx="80"
						cy="80"
						r={r2}
						stroke="var(--color-note-idea)"
						strokeWidth="6"
						fill="transparent"
						strokeDasharray={c2}
						strokeDashoffset={offset2}
						strokeLinecap="round"
						className="transition-all duration-500 ease-out"
					/>
				</svg>

				{/* Center Content */}
				<div className="absolute flex flex-col items-center justify-center text-center">
					<span className="text-2xl font-bold tracking-tight text-action">
						{noteCount + draftCount}
					</span>
					<span className="text-[10px] uppercase tracking-wider text-neutral-500 font-mono">
						Activities
					</span>
				</div>
			</div>

			<div className="flex-1 flex flex-col justify-center gap-4 w-full">
				<div>
					<h3 className="text-sm font-bold text-action">Weekly Progress</h3>
					<p className="text-xs text-neutral-500 mt-0.5">
						Your note-taking activity over the last 7 days.
					</p>
				</div>

				<div className="flex flex-col gap-3">
					{/* Notes captured row */}
					<div className="flex items-center justify-between text-xs">
						<div className="flex items-center gap-2">
							<div className="w-2.5 h-2.5 rounded-full bg-note-info shrink-0" />
							<FileText
								className="w-3.5 h-3.5 text-neutral-500"
								aria-hidden="true"
							/>
							<span className="font-medium text-action">Notes Captured</span>
						</div>
						<div className="font-mono text-neutral-600">
							{noteCount}{" "}
							<span className="text-neutral-400">/ {targetNotes}</span>
						</div>
					</div>

					{/* Drafts created row */}
					<div className="flex items-center justify-between text-xs">
						<div className="flex items-center gap-2">
							<div className="w-2.5 h-2.5 rounded-full bg-note-idea shrink-0" />
							<Edit3
								className="w-3.5 h-3.5 text-neutral-500"
								aria-hidden="true"
							/>
							<span className="font-medium text-action">Drafts Created</span>
						</div>
						<div className="font-mono text-neutral-600">
							{draftCount}{" "}
							<span className="text-neutral-400">/ {targetDrafts}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
