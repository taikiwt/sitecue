import {
	ArrowRight,
	BookOpen,
	Calendar,
	FileText,
	Library,
	MessageSquareText,
} from "lucide-react";
import Link from "next/link";
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
		<div className="min-h-screen bg-neutral-50 text-neutral-950 font-sans">
			<header className="border-b border-neutral-200 bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							sitecue base camp
						</h1>
						<div className="mt-2 flex items-center gap-2 text-sm text-neutral-500 font-medium">
							<span>Total Notes: {notesCount ?? 0}</span>
							<span className="text-neutral-300">|</span>
							<span>Total Drafts: {draftsCount ?? 0}</span>
						</div>
					</div>
					<nav className="flex items-center gap-6">
						<Link
							href="/"
							className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
						>
							Home
						</Link>
						<Link
							href="/notes"
							className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
						>
							Notes
						</Link>
						<Link
							href="/settings"
							className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
						>
							Settings
						</Link>
					</nav>
				</div>
			</header>

			<main className="mx-auto max-w-5xl px-6 py-12">
				{/* Pinned Sites */}
				<PinnedSitesManager
					initialSites={(pinnedSites as PinnedSite[]) ?? []}
				/>

				{/* Launchpad Section */}
				<section className="mb-16">
					<div className="mb-8 flex items-center gap-2">
						<span className="text-xl">🚀</span>
						<h2 className="text-lg font-semibold text-neutral-800">
							Quick Start
						</h2>
					</div>
					<div className="grid gap-6 sm:grid-cols-4">
						<Link
							href="/studio/new?target=x"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<MessageSquareText className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-neutral-900">X (Twitter)</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								Save your sudden ideas as drafts for X.
							</p>
						</Link>

						<Link
							href="/studio/new?target=zenn"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<BookOpen className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-neutral-900">Zenn</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								Draft and organize your technical articles for Zenn.
							</p>
						</Link>

						<Link
							href="/studio/new?target=generic"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<FileText className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-neutral-900">Generic Note</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								Free-form notes not limited to any specific platform.
							</p>
						</Link>

						<Link
							href="/notes"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<Library className="w-5 h-5 text-neutral-600" />
							</div>
							<h3 className="mb-1 font-bold text-neutral-900">Manage Notes</h3>
							<p className="text-xs text-neutral-500 line-clamp-2">
								View and organize all your created notes and drafts.
							</p>
						</Link>
					</div>
				</section>

				{/* Recent Drafts Section */}
				<section className="mb-16">
					<div className="mb-8 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-xl">✍️</span>
							<h2 className="text-lg font-semibold text-neutral-800">
								Recent Drafts
							</h2>
						</div>
						<Link
							href="/notes?domain=draft"
							className="text-sm font-medium text-neutral-400 hover:text-neutral-900 transition-colors"
						>
							View all drafts
						</Link>
					</div>

					<div className="grid gap-4">
						{(!recentDrafts || recentDrafts.length === 0) && (
							<div className="py-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-100 bg-neutral-50/50">
								<p className="text-sm text-neutral-400 italic">
									No drafts yet. Start writing something to see them here.
								</p>
							</div>
						)}
						{recentDrafts?.map((draft) => (
							<Link
								key={draft.id}
								href={`/studio/${draft.id}`}
								className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900"
							>
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 transition-colors group-hover:bg-neutral-100">
										{draft.target_platform === "x" ? (
											<MessageSquareText className="w-5 h-5" />
										) : draft.target_platform === "zenn" ? (
											<BookOpen className="w-5 h-5" />
										) : (
											<FileText className="w-5 h-5" />
										)}
									</div>
									<div>
										<h3 className="font-bold text-neutral-900">
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
