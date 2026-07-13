"use client";

import { Home, Library, Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { cn } from "@/lib/utils"; // 👈 💡 この1行を手打ちで追加してください！
import { useLayoutStore } from "@/store/useLayoutStore";

// --- 以下、既存のコードのまま ---

interface MobileBottomNavProps {
	onSearchOpen: () => void;
}

function MobileBottomNavInner({ onSearchOpen }: MobileBottomNavProps) {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const { openGlobalNewModal } = useLayoutStore();

	const isDetailOpen = !!(
		searchParams.get("noteId") || searchParams.get("draftId")
	);

	const isStudioPage = pathname?.startsWith("/studio");
	// Library(Notes)がアクティブかどうかの判定を定義
	const isNotes = pathname?.startsWith("/notes");

	// 詳細ペイン展開時またはスタジオページではボトムナビを隠す
	if (isDetailOpen || isStudioPage) return null;

	return (
		<nav className="md:hidden shrink-0 w-auto mx-4 mb-4 pb-safe z-40 bg-action rounded-full shadow-lg overflow-visible border border-white/5">
			{/* Flexベースの完全シンメトリー構造（中央スペースの最大拡張） */}
			<div className="flex justify-between items-center h-16 px-4">
				{/* 左端エリア：ホームボタン（w-12固定、ボタン自体は w-9 h-9 へと引き算・小ぶり化） */}
				<div className="w-12 flex justify-start items-center">
					{/* 💡 共通Linkのghost駆動へリプレイス。ネイビー背景に合わせてホバー色をホワイト半透明に最適化 */}
					<Link
						href="/"
						variant="ghost"
						size="icon"
						className="size-9 text-white/60 hover-safe:text-white hover-safe:bg-white/10 transition-all active:scale-90"
						aria-label="Home"
					>
						{/* 💡 安全令を回避するため size-[18px] を指定 */}
						<Home className="size-[18px]" aria-hidden="true" />
					</Link>
				</div>

				{/* 中央エリア：メインアクション（新規作成、検索、一覧）を大ぶりの白いカプセル島として独立化 */}
				<div className="flex-1 flex justify-center items-center">
					<div className="w-48 h-13 bg-base-surface rounded-full flex items-center justify-between p-0.5 shrink-0 shadow-sm">
						{/* 1. Notes 一覧（アクティブ時は自動で沈み込み、非アクティブ時は綺麗に馴染みます） */}
						<Link
							href="/notes"
							variant={isNotes ? "secondary" : "ghost"}
							size="icon"
							className={cn(
								"size-12 transition-all",
								isNotes
									? "bg-base-bg text-action scale-105"
									: "text-gray-500 hover-safe:text-action hover-safe:bg-base-bg",
							)}
							aria-label="Notes"
						>
							{/* 💡 強制縮小を回避するため size-6 を明示 */}
							<Library className="size-6" aria-hidden="true" />
						</Link>

						{/* 2. Logo（新規作成：共通Buttonへ統合し、border-none p-0.5 で完全な質量を死守） */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => {
								openGlobalNewModal("gate");
							}}
							className="size-12 border-none p-0.5 transition-transform active:scale-95 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-none focus-visible:border-transparent"
							aria-label="New Note"
						>
							<Image
								src="/logo.svg"
								alt="New Note"
								width={44}
								height={44}
								className="w-full h-full object-contain drop-shadow-sm"
							/>
						</Button>

						{/* 3. 検索（生のbuttonから共通Buttonコンポーネントへ整流化） */}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onSearchOpen}
							className="size-12 text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors"
							aria-label="Search"
						>
							{/* 💡 強制縮小を回避するため size-6 を明示 */}
							<Search className="size-6" aria-hidden="true" />
						</Button>
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
