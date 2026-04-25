import {
	Activity,
	ArrowRight,
	Clock,
	Library,
	PenSquare,
	Plus,
} from "lucide-react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { createClient } from "@/utils/supabase/server";
import type { PinnedSite } from "../../../../types/app";
import { PinnedSitesManager } from "./_components/PinnedSitesManager";

export default async function LaunchpadPage() {
	const supabase = await createClient();
	const [
		{ count: notesCount },
		{ count: draftsCount },
		{ data: recentDrafts },
		{ data: pinnedSites },
		{ data: templates },
	] = await Promise.all([
		supabase.from("sitecue_notes").select("*", { count: "exact", head: true }),
		supabase.from("sitecue_drafts").select("*", { count: "exact", head: true }),
		supabase
			.from("sitecue_drafts")
			.select("*")
			.order("updated_at", { ascending: false })
			.limit(5),
		supabase
			.from("sitecue_pinned_sites")
			.select("*")
			.order("created_at", { ascending: false }),
		supabase
			.from("sitecue_templates")
			.select("*")
			.order("created_at", { ascending: true }),
	]);

	return (
		<div className="flex-1 bg-base-bg text-action font-sans">
			<main className="mx-auto max-w-4xl px-6 py-12">
				{/* 1段目: Pinned Sites */}
				<div className="mb-16">
					<PinnedSitesManager
						initialSites={(pinnedSites as PinnedSite[]) ?? []}
					/>
				</div>

				{/* 2段目: 統計 & Recent Drafts (2カラム) */}
				<div className="mb-20 grid gap-12 md:grid-cols-[1fr_2fr] items-start">
					{/* 左: Overview */}
					<div>
						<div className="mb-8 flex items-center gap-2">
							<Activity
								className="w-5 h-5 text-neutral-400"
								aria-hidden="true"
							/>
							<h1 className="text-xl font-light text-action tracking-tight">
								Overview
							</h1>
						</div>
						<div className="flex flex-col gap-4 text-sm text-neutral-500">
							<div className="flex items-center justify-between border-b border-base-border pb-2">
								<span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
									Total Notes
								</span>
								<span className="text-xl font-light text-action">
									{notesCount || 0}
								</span>
							</div>
							<div className="flex items-center justify-between border-b border-base-border pb-2">
								<span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
									Total Drafts
								</span>
								<span className="text-xl font-light text-action">
									{draftsCount || 0}
								</span>
							</div>
						</div>
					</div>

					{/* 右: Recent Drafts */}
					<div>
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Clock
									className="w-4 h-4 text-neutral-400"
									aria-hidden="true"
								/>
								<h2 className="text-lg text-action tracking-tight">
									Recent Drafts
								</h2>
							</div>
							<Link
								href="/notes?view=drafts"
								className="text-xs font-medium text-neutral-400 hover:text-action transition-colors"
							>
								View all
							</Link>
						</div>
						<div className="flex flex-col">
							{(!recentDrafts || recentDrafts.length === 0) && (
								<div className="py-8 text-center border border-dashed border-base-border rounded-xl">
									<p className="text-xs text-neutral-400 italic">
										No drafts yet.
									</p>
								</div>
							)}
							{recentDrafts?.map((draft) => (
								<Link
									key={draft.id}
									href={`/studio/${draft.id}`}
									className="group flex items-center justify-between py-3 border-b border-base-border/50 last:border-0 transition-colors hover:bg-base-surface -mx-3 px-3 rounded-lg"
								>
									<div className="min-w-0 flex-1">
										<h3 className="text-sm text-action truncate group-hover:text-action-hover">
											{draft.title || "Untitled Draft"}
										</h3>
									</div>
									<div className="flex items-center gap-3 shrink-0 ml-4">
										<span className="text-[10px] text-neutral-400 font-mono">
											{new Date(draft.updated_at).toLocaleDateString()}
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
				</div>

				{/* 3段目: Start a Draft */}
				<section className="mb-20">
					<div className="mb-8 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<PenSquare
								className="w-5 h-5 text-neutral-400"
								aria-hidden="true"
							/>
							<h2 className="text-xl text-action font-light tracking-tight">
								Start a Draft
							</h2>
						</div>
						<Link
							href="/templates"
							className="text-xs font-medium text-neutral-400 hover:text-action transition-colors"
						>
							Manage Templates
						</Link>
					</div>
					<div className="grid gap-6 sm:grid-cols-3">
						<Link
							href="/studio/new"
							className="group relative flex flex-col items-start rounded-xl border-2 border-dashed border-base-border bg-transparent p-5 transition-all hover:border-neutral-400 hover:bg-base-surface/50 cursor-pointer"
						>
							<div className="flex items-center gap-2 mb-1">
								<Plus className="w-4 h-4 text-action" aria-hidden="true" />
								<h3 className="text-base text-action group-hover:text-action-hover transition-colors">
									Blank Canvas
								</h3>
							</div>
							<p className="text-xs text-neutral-500 line-clamp-2">
								Free-form notes not limited to any specific template.
							</p>
						</Link>

						{templates?.map((template) => (
							<Link
								key={template.id}
								href={`/studio/new?template_id=${template.id}`}
								className="group relative flex flex-col items-start rounded-xl border border-base-border bg-base-surface p-5 transition-all hover:border-neutral-400 cursor-pointer"
							>
								<h3 className="mb-1 text-base text-action group-hover:text-action-hover transition-colors">
									{template.name}
								</h3>
								{template.max_length && (
									<p className="text-[10px] text-neutral-400 font-mono mb-1">
										Max: {template.max_length}
									</p>
								)}
								<p className="text-xs text-neutral-500 line-clamp-2">
									Use this template for your workflow.
								</p>
							</Link>
						))}
					</div>
				</section>

				{/* 4段目: Your Library */}
				<section className="mb-12">
					<Link
						href="/notes"
						className="group flex w-full items-center justify-between rounded-xl border border-base-border bg-base-surface p-4 transition-all hover:border-neutral-400 cursor-pointer"
					>
						<div className="flex items-center gap-3">
							<Library
								className="w-5 h-5 text-neutral-500"
								aria-hidden="true"
							/>
							<div>
								<h3 className="text-base text-action">Manage Notes</h3>
								<p className="text-xs text-neutral-500">
									View and organize all your created notes and drafts.
								</p>
							</div>
						</div>
						<ArrowRight
							className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform"
							aria-hidden="true"
						/>
					</Link>
				</section>
			</main>
		</div>
	);
}
