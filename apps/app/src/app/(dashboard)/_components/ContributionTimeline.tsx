import { Edit3, FileText } from "lucide-react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { requireUser } from "@/utils/supabase/server";

export interface ActivityItem {
	id: string;
	title: string;
	content?: string;
	domain?: string;
	noteType?: "info" | "alert" | "idea";
}

export interface ActivityEvent {
	type: "note_captured" | "draft_created";
	label: string;
	items: ActivityItem[];
}

export interface DailyActivity {
	date: string;
	displayDate: string;
	noteCount: number;
	draftCount: number;
	events: ActivityEvent[];
}

function getLocalDateString(date: Date) {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

function getDisplayDate(dateStr: string) {
	const today = getLocalDateString(new Date());
	const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

	if (dateStr === today) return "Today";
	if (dateStr === yesterday) return "Yesterday";

	const dateObj = new Date(dateStr);
	return dateObj.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export async function ContributionTimeline() {
	const { supabase, user } = await requireUser("/");

	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
	const dateStr = sevenDaysAgo.toISOString();

	const [notesResult, draftsResult] = await Promise.all([
		supabase
			.from("sitecue_notes")
			.select("id, content, scope, url_pattern, created_at, note_type")
			.eq("user_id", user.id)
			.gte("created_at", dateStr)
			.order("created_at", { ascending: false }),
		supabase
			.from("sitecue_drafts")
			.select("id, title, content, created_at")
			.eq("user_id", user.id)
			.gte("created_at", dateStr)
			.order("created_at", { ascending: false }),
	]);

	const notes = notesResult.data || [];
	const drafts = draftsResult.data || [];

	if (notes.length === 0 && drafts.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-base-border p-8 text-center text-sm text-neutral-500">
				No recent activities logged in the last 7 days.
			</div>
		);
	}

	const activityMap: Record<
		string,
		{ noteItems: ActivityItem[]; draftItems: ActivityItem[] }
	> = {};

	for (const note of notes) {
		const dateKey = getLocalDateString(new Date(note.created_at));
		if (!activityMap[dateKey]) {
			activityMap[dateKey] = { noteItems: [], draftItems: [] };
		}
		activityMap[dateKey].noteItems.push({
			id: note.id,
			title:
				note.scope === "domain"
					? note.url_pattern || ""
					: note.scope || "inbox",
			content: note.content || "",
			domain:
				note.scope === "domain" ? note.url_pattern || undefined : undefined,
			noteType: note.note_type || undefined,
		});
	}

	for (const draft of drafts) {
		const dateKey = getLocalDateString(new Date(draft.created_at));
		if (!activityMap[dateKey]) {
			activityMap[dateKey] = { noteItems: [], draftItems: [] };
		}
		activityMap[dateKey].draftItems.push({
			id: draft.id,
			title: draft.title || "Untitled Draft",
			content: draft.content || "",
		});
	}

	const dailyActivities: DailyActivity[] = Object.keys(activityMap)
		.sort((a, b) => b.localeCompare(a))
		.map((dateKey) => {
			const { noteItems, draftItems } = activityMap[dateKey];
			const events: ActivityEvent[] = [];

			if (noteItems.length > 0) {
				events.push({
					type: "note_captured",
					label: "Captured Notes",
					items: noteItems,
				});
			}

			if (draftItems.length > 0) {
				events.push({
					type: "draft_created",
					label: "Created Drafts",
					items: draftItems,
				});
			}

			return {
				date: dateKey,
				displayDate: getDisplayDate(dateKey),
				noteCount: noteItems.length,
				draftCount: draftItems.length,
				events,
			};
		});

	return (
		<div className="flex flex-col border-l border-base-border ml-2 pl-4 gap-6">
			{dailyActivities.map((day) => (
				<div key={day.date} className="relative flex flex-col gap-2 group">
					{/* Day dot node */}
					<div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 ring-4 ring-base-bg transition-transform duration-300 group-hover:scale-125" />

					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold text-action">
							{day.displayDate}
						</span>
						<span className="text-[10px] text-neutral-400 font-mono">
							({day.noteCount + day.draftCount} activities)
						</span>
					</div>

					<div className="flex flex-col gap-4 pl-2 border-l border-neutral-100 dark:border-neutral-800">
						{day.events.map((event) => (
							<div key={event.type} className="flex flex-col gap-1.5">
								<div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-neutral-400">
									{event.type === "note_captured" ? (
										<FileText
											className="w-3 h-3 text-neutral-400"
											aria-hidden="true"
										/>
									) : (
										<Edit3
											className="w-3 h-3 text-neutral-400"
											aria-hidden="true"
										/>
									)}
									<span>{event.label}</span>
								</div>

								<div className="flex flex-col gap-1">
									{event.items.map((item) => {
										const href =
											event.type === "draft_created"
												? `/studio?draftId=${item.id}&view=drafts`
												: `/notes?noteId=${item.id}&domain=${item.domain || "inbox"}`;

										let dotColor = "bg-neutral-400";
										if (item.noteType === "idea") dotColor = "bg-note-idea";
										if (item.noteType === "info") dotColor = "bg-note-info";
										if (item.noteType === "alert") dotColor = "bg-note-alert";

										return (
											<Link
												key={item.id}
												href={href}
												className="flex items-center gap-2 text-xs text-neutral-500 hover-safe:text-action transition-colors truncate py-0.5"
											>
												{event.type === "note_captured" && (
													<div
														className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}
													/>
												)}
												<span className="font-semibold text-action shrink-0">
													{item.title}
												</span>
												<span className="text-neutral-400 shrink-0">•</span>
												<span className="truncate">
													{item.content
														? item.content.replace(/[#*`-]/g, "")
														: "No content preview"}
												</span>
											</Link>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
