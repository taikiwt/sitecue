import { BookOpen, FileText, Library, MessageSquareText } from "lucide-react";
import Link from "next/link";

export default function LaunchpadPage() {
	return (
		<div className="min-h-screen bg-neutral-50 text-neutral-950 font-sans">
			<header className="border-b border-neutral-200 bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							sitecue base camp
						</h1>
						<p className="mt-2 text-neutral-500">
							Cultivate your thoughts right from here.
						</p>
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
				{/* Launchpad Section */}
				<section className="mb-16">
					<div className="mb-8 flex items-center gap-2">
						<span className="text-xl">🚀</span>
						<h2 className="text-lg font-semibold text-neutral-800">
							Quick Start
						</h2>
					</div>
					<div className="grid gap-6 sm:grid-cols-3">
						<Link
							href="/studio/new?target=x"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<MessageSquareText className="w-6 h-6 text-neutral-600" />
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">X (Twitter)</h3>
							<p className="text-sm text-neutral-500">
								Save your sudden ideas as drafts for X.
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								Start Creating{" "}
								<span className="ml-1 transition-transform group-hover:translate-x-1">
									→
								</span>
							</div>
						</Link>

						<Link
							href="/studio/new?target=zenn"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<BookOpen className="w-6 h-6 text-neutral-600" />
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">Zenn</h3>
							<p className="text-sm text-neutral-500">
								Draft and organize your technical articles for Zenn.
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								Start Writing{" "}
								<span className="ml-1 transition-transform group-hover:translate-x-1">
									→
								</span>
							</div>
						</Link>

						<Link
							href="/studio/new?target=generic"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<FileText className="w-6 h-6 text-neutral-600" />
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">Generic Note</h3>
							<p className="text-sm text-neutral-500">
								Free-form notes not limited to any specific platform.
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								Create Note{" "}
								<span className="ml-1 transition-transform group-hover:translate-x-1">
									→
								</span>
							</div>
						</Link>

						<Link
							href="/notes"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900 cursor-pointer"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 transition-colors group-hover:bg-neutral-100">
								<Library className="w-6 h-6 text-neutral-600" />
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">Manage Notes</h3>
							<p className="text-sm text-neutral-500">
								View and organize all your created notes and drafts.
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								Go to Dashboard{" "}
								<span className="ml-1 transition-transform group-hover:translate-x-1">
									→
								</span>
							</div>
						</Link>
					</div>
				</section>

				{/* Stats section (Placeholder) */}
				<section>
					<div className="mb-8 flex items-center gap-2">
						<span className="text-xl">📊</span>
						<h2 className="text-lg font-semibold text-neutral-800">Activity</h2>
					</div>
					<div className="grid gap-6 rounded-2xl border border-neutral-200 bg-white p-10 sm:grid-cols-3">
						<div className="flex flex-col">
							<span className="mb-1 text-sm font-medium text-neutral-400 uppercase tracking-tight">
								Total Notes
							</span>
							<span className="text-4xl font-bold text-neutral-900">--</span>
						</div>
						<div className="flex flex-col">
							<span className="mb-1 text-sm font-medium text-neutral-400 uppercase tracking-tight">
								Weekly Drafts
							</span>
							<span className="text-4xl font-bold text-neutral-900">--</span>
						</div>
						<div className="flex flex-col">
							<span className="mb-1 text-sm font-medium text-neutral-400 uppercase tracking-tight">
								Published Items
							</span>
							<span className="text-4xl font-bold text-neutral-900">--</span>
						</div>
					</div>
					<div className="mt-8 flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-100 py-12">
						<p className="text-sm text-neutral-400 italic">
							Statistics will appear here as your activity data grows.
						</p>
					</div>
				</section>
			</main>
		</div>
	);
}
