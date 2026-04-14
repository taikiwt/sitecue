import {
	ArrowRight,
	BookOpen,
	Calendar,
	FileText,
	Library,
	MessageSquareText,
	Plus,
} from "lucide-react";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import type { PinnedSite } from "../../../../types/app";
import { PinnedSitesManager } from "./_components/PinnedSitesManager";
import { UserMenu } from "./_components/UserMenu";

export default async function LaunchpadPage() {
	const supabase = await createClient();

	const [
		{ count: notesCount },
		{ count: draftsCount },
		{ data: recentDrafts },
		{ data: pinnedSites },
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
	]);

	return (
		<div className="min-h-screen bg-base-bg text-action font-sans">
			<main className="mx-auto max-w-4xl px-6 py-12">
				{/* ① Top Navigation */}
				<div className="flex items-center justify-between mb-12">
					<Link
						href="/"
						className="flex items-center gap-2 cursor-pointer group"
					>
						<Image
							src="/logo.svg"
							alt="sitecue logo"
							width={28}
							height={28}
							className="drop-shadow-sm transition-transform group-hover:scale-105"
						/>
						<span className="text-xl font-bold tracking-tight text-action">
							sitecue
						</span>
					</Link>
					<UserMenu />
				</div>

				{/* ② Welcome & Activity Area */}
				<div className="mb-20">
					<h1 className="text-2xl font-light tracking-tight text-neutral-600 mb-8">
						Cultivate your thoughts right from here.
					</h1>
					<div className="flex items-center gap-6 text-sm text-neutral-500">
						<div className="flex items-center gap-3">
							<span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
								Total Notes
							</span>
							<span className="text-xl font-light text-action">
								{notesCount || 0}
							</span>
						</div>
						<div className="w-px h-6 bg-base-border" />
						<div className="flex items-center gap-3">
							<span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
								Total Drafts
							</span>
							<span className="text-xl font-light text-action">
								{draftsCount || 0}
							</span>
						</div>
					</div>
				</div>

				{/* Pinned Sites */}
				<PinnedSitesManager
					initialSites={(pinnedSites as PinnedSite[]) ?? []}
				/>

				{/* Launchpad Section */}
				<section className="mb-20">
					<div className="mb-8 flex items-center gap-3">
						<span className="text-2xl">🚀</span>
						<h2 className="text-2xl font-light tracking-tight text-neutral-800">
							Quick Start
						</h2>
						<Link
							href="/?globalNew=note"
							className={cn(
								buttonVariants({ variant: "default", size: "sm" }),
								"ml-auto w-max",
							)}
						>
							<Plus className="w-4 h-4" />
							New Note
						</Link>
					</div>
					<div className="grid gap-8 sm:grid-cols-3">
						<Link
							href="/studio/new?target=x"
							className="group relative flex flex-col items-start rounded-xl border border-base-border bg-base-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-base-border/50 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-base-bg transition-colors group-hover:bg-base-surface">
								<MessageSquareText className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-action">Short Post</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								Save your sudden ideas as drafts for X.
							</p>
						</Link>

						<Link
							href="/studio/new?target=zenn"
							className="group relative flex flex-col items-start rounded-xl border border-base-border bg-base-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-base-border/50 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-base-bg transition-colors group-hover:bg-base-surface">
								<BookOpen className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-action">Article</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								Draft and organize your technical articles for Zenn.
							</p>
						</Link>

						<Link
							href="/studio/new?target=generic"
							className="group relative flex flex-col items-start rounded-xl border border-base-border bg-base-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-base-border/50 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-base-bg transition-colors group-hover:bg-base-surface">
								<FileText className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-action">Blank Canvas</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								Free-form notes not limited to any specific platform.
							</p>
						</Link>
					</div>
				</section>

				{/* Your Library Section */}
				<section className="mb-20">
					<div className="mb-8 flex items-center gap-3">
						<span className="text-2xl">📚</span>
						<h2 className="text-2xl font-light tracking-tight text-neutral-800">
							Your Library
						</h2>
					</div>
					<div className="grid gap-8 sm:grid-cols-3">
						<Link
							href="/notes"
							className="group relative flex flex-col items-start rounded-xl border border-base-border bg-base-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-base-border/50 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-base-bg transition-colors group-hover:bg-base-surface">
								<Library className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-action">Manage Notes</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								View and organize all your created notes and drafts.
							</p>
						</Link>
					</div>
				</section>

				{/* Recent Drafts Section */}
				<section className="mb-20">
					<div className="mb-8 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<span className="text-2xl">✍️</span>
							<h2 className="text-2xl font-light tracking-tight text-neutral-800">
								Recent Drafts
							</h2>
						</div>
						<Link
							href="/notes?view=drafts"
							className="text-sm font-medium text-neutral-400 hover:text-action transition-colors"
						>
							View all drafts
						</Link>
					</div>

					<div className="grid gap-4">
						{(!recentDrafts || recentDrafts.length === 0) && (
							<div className="py-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-base-border bg-base-bg/50">
								<p className="text-sm text-neutral-400 italic">
									No drafts yet. Start writing something to see them here.
								</p>
							</div>
						)}
						{recentDrafts?.map((draft) => (
							<Link
								key={draft.id}
								href={`/studio/${draft.id}`}
								className="group flex items-center justify-between rounded-xl border border-base-border bg-base-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-base-border/50 cursor-pointer"
							>
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-base-bg text-neutral-600 transition-colors group-hover:bg-base-surface">
										{draft.target_platform === "x" ? (
											<MessageSquareText className="w-5 h-5" />
										) : draft.target_platform === "zenn" ? (
											<BookOpen className="w-5 h-5" />
										) : (
											<FileText className="w-5 h-5" />
										)}
									</div>
									<div>
										<h3 className="font-bold text-action">
											{draft.title || "Untitled Draft"}
										</h3>
										<div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
											<span className="capitalize">
												{draft.target_platform}
											</span>
											<span>•</span>
											<span className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												{new Date(draft.updated_at).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
								<ArrowRight className="w-5 h-5 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-neutral-900" />
							</Link>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}
