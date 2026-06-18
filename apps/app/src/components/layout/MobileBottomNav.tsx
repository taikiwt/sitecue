"use client";

import { FileText, Home, Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";

interface MobileBottomNavProps {
	onSearchOpen: () => void;
}

function MobileBottomNavInner({ onSearchOpen }: MobileBottomNavProps) {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const isDetailOpen = !!(
		searchParams.get("noteId") || searchParams.get("draftId")
	);

	const isStudioPage = pathname?.startsWith("/studio");

	// 詳細ペイン展開時またはスタジオページではボトムナビを隠す
	if (isDetailOpen || isStudioPage) return null;

	return (
		<nav className="md:hidden shrink-0 w-auto mx-4 mb-4 pb-safe z-40 bg-action rounded-full shadow-lg overflow-visible border border-white/5">
			{/* Flexベースの完全シンメトリー構造（中央スペースの最大拡張） */}
			<div className="flex justify-between items-center h-16 px-4">
				{/* 左端エリア：ホームボタン（w-12固定、ボタン自体は w-9 h-9 へと引き算・小ぶり化） */}
				<div className="w-12 flex justify-start items-center">
					<Link
						href="/"
						className="flex items-center justify-center w-9 h-9 rounded-full text-white/60 hover-safe:text-white transition-all active:scale-90"
						aria-label="Home"
					>
						<Home className="w-[18px] h-[18px]" aria-hidden="true" />
					</Link>
				</div>

				{/* 中央エリア：メインアクション（新規作成、検索、一覧）を大ぶりの白いカプセル島として独立化 */}
				<div className="flex-1 flex justify-center items-center">
					<div className="flex items-center justify-between bg-base-surface rounded-full p-0.5 px-2.5 gap-3 shadow-sm w-full max-w-[220px]">
						{/* Notes 一覧（ヒットエリア48pxを完全死守、アイコンも24pxへ拡大） */}
						<Link
							href="/notes"
							className="flex items-center justify-center w-12 h-12 rounded-full text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors"
							aria-label="Notes"
						>
							<FileText className="w-6 h-6" aria-hidden="true" />
						</Link>

						{/* Logo（新規作成：w-12の座布団サイズいっぱいにブルーロゴを完全同期・質量最大化） */}
						<button
							type="button"
							onClick={() => {
								const params = new URLSearchParams(searchParams.toString());
								params.set("globalNew", "note");
								const newUrl = `${pathname}?${params.toString()}`;
								window.history.pushState(null, "", newUrl);
								window.dispatchEvent(new PopStateEvent("popstate"));
							}}
							className="flex items-center justify-center w-12 h-12 rounded-full transition-transform active:scale-95 cursor-pointer bg-transparent p-0.5"
							aria-label="New Note"
						>
							<Image
								src="/logo.svg"
								alt="New Note"
								width={44}
								height={44}
								className="w-full h-full object-contain drop-shadow-sm"
							/>
						</button>

						{/* 検索（ヒットエリア48px、アイコン24px） */}
						<button
							type="button"
							onClick={onSearchOpen}
							className="flex items-center justify-center w-12 h-12 rounded-full text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors cursor-pointer"
							aria-label="Search"
						>
							<Search className="w-6 h-6" aria-hidden="true" />
						</button>
					</div>
				</div>

				{/* 右端エリア：等幅のリズム（シンメトリー）を崩さないための固定プレースホルダー（w-12固定） */}
				<div
					className="w-12 flex justify-end bg-transparent pointer-events-none"
					aria-hidden="true"
				/>
			</div>
		</nav>
	);
}

export function MobileBottomNav(props: MobileBottomNavProps) {
	return (
		<Suspense fallback={null}>
			<MobileBottomNavInner {...props} />
		</Suspense>
	);
}
