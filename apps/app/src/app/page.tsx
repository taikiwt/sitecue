import Link from "next/link";

export default function LaunchpadPage() {
	return (
		<div className="min-h-screen bg-neutral-50 text-neutral-950 font-sans">
			<header className="border-b border-neutral-200 bg-white">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							SiteCue Base Camp
						</h1>
						<p className="mt-2 text-neutral-500">
							あなたの情報の種を、ここから育てましょう。
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
							クイックスタート
						</h2>
					</div>
					<div className="grid gap-6 sm:grid-cols-3">
						<Link
							href="/studio/new?target=x"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 text-2xl transition-colors group-hover:bg-neutral-100">
								🐦
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">X (Twitter)</h3>
							<p className="text-sm text-neutral-500">
								思いついたアイデアをドラフトとして保存します。
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								作成を開始する{" "}
								<span className="ml-1 transition-transform group-hover:translate-x-1">
									→
								</span>
							</div>
						</Link>

						<Link
							href="/studio/new?target=zenn"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 text-2xl transition-colors group-hover:bg-neutral-100">
								📘
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">Zenn</h3>
							<p className="text-sm text-neutral-500">
								技術記事の構成案やメモを執筆します。
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								執筆をはじめる{" "}
								<span className="ml-1 transition-transform group-hover:translate-x-1">
									→
								</span>
							</div>
						</Link>

						<Link
							href="/studio/new?target=generic"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 text-2xl transition-colors group-hover:bg-neutral-100">
								📝
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">汎用ノート</h3>
							<p className="text-sm text-neutral-500">
								プラットフォームを限定しない自由なメモです。
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								ノートを作る{" "}
								<span className="ml-1 transition-transform group-hover:translate-x-1">
									→
								</span>
							</div>
						</Link>

						<Link
							href="/notes"
							className="group relative flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-900 hover:ring-1 hover:ring-neutral-900"
						>
							<div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 text-2xl transition-colors group-hover:bg-neutral-100">
								🗂️
							</div>
							<h3 className="mb-2 font-bold text-neutral-900">ノート管理</h3>
							<p className="text-sm text-neutral-500">
								作成済みのノートや素材を一覧で管理します。
							</p>
							<div className="mt-6 flex items-center text-xs font-semibold text-neutral-400 group-hover:text-neutral-900">
								管理画面へ{" "}
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
						<h2 className="text-lg font-semibold text-neutral-800">活動状況</h2>
					</div>
					<div className="grid gap-6 rounded-2xl border border-neutral-200 bg-white p-10 sm:grid-cols-3">
						<div className="flex flex-col">
							<span className="mb-1 text-sm font-medium text-neutral-400 uppercase tracking-tight">
								総ノート数
							</span>
							<span className="text-4xl font-bold text-neutral-900">--</span>
						</div>
						<div className="flex flex-col">
							<span className="mb-1 text-sm font-medium text-neutral-400 uppercase tracking-tight">
								今週のドラフト
							</span>
							<span className="text-4xl font-bold text-neutral-900">--</span>
						</div>
						<div className="flex flex-col">
							<span className="mb-1 text-sm font-medium text-neutral-400 uppercase tracking-tight">
								公開済みアイテム
							</span>
							<span className="text-4xl font-bold text-neutral-900">--</span>
						</div>
					</div>
					<div className="mt-8 flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-100 py-12">
						<p className="text-sm text-neutral-400 italic">
							活動データが集まると、ここに統計が表示されます。
						</p>
					</div>
				</section>
			</main>
		</div>
	);
}
