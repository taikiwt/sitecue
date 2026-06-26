"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Home, Library, Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { UserMenu } from "@/app/(dashboard)/_components/UserMenu";
import { Button } from "@/components/ui/button"; // 👈 追加
import { CustomLink as Link } from "@/components/ui/custom-link";

interface GlobalSidebarProps {
	onSearchOpen: () => void;
	onClose?: () => void;
}

export function GlobalSidebar({ onSearchOpen, onClose }: GlobalSidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (pathname) {
			queryClient.invalidateQueries({ queryKey: ["notes"] });
			queryClient.invalidateQueries({ queryKey: ["drafts"] });
		}
	}, [pathname, queryClient]);

	const isNotes = pathname.startsWith("/notes");

	return (
		<div className="flex flex-col h-full w-18 bg-action rounded-full items-center justify-between py-4 px-2 select-none">
			{/* 🏝️ 島1（最上部）：ホームエリア */}
			<div className="w-14 bg-base-surface rounded-full flex flex-col items-center p-2 shrink-0 gap-4">
				{/* バリアントとサイズ駆動に移行。size-10 でサイドバーの物理サイズを維持 */}
				<Link
					variant="ghost"
					size="icon"
					className="size-10 text-gray-500 hover-safe:text-action hover-safe:bg-base-hover"
					href="/"
					onClick={onClose}
					title="Home"
				>
					<Home aria-hidden="true" className="size-5" />
				</Link>
			</div>

			{/* 🏝️ 島2（中央・メインアクションエリア）：まとまり（質量）を表現 */}
			<div className="w-14 bg-base-surface rounded-full flex flex-col items-center p-2 gap-4 shrink-0">
				{/* sitecue（新規作成）アイコン: 共通Buttonのghost+iconでリセットクラスをパージ */}
				<Button
					variant="ghost"
					size="icon"
					onClick={() => {
						const params = new URLSearchParams(searchParams.toString());
						params.set("globalNew", "note");
						router.push(`${pathname}?${params.toString()}`);
						onClose?.();
					}}
					className="size-10 p-0 transition-transform active:scale-95"
					title="New Note"
				>
					<Image
						alt="sitecue logo"
						className="w-full h-full object-contain hover:scale-105 transition-all duration-300"
						height={40}
						src="/logo.svg"
						width={40}
					/>
				</Button>

				{/* 生ボタンから共通Buttonコンポーネントへリプレイス */}
				<Button
					variant="ghost"
					size="icon"
					onClick={onSearchOpen}
					className="size-10 text-gray-500 hover-safe:text-action hover-safe:bg-base-hover"
					title="Search"
				>
					<Search aria-hidden="true" className="size-5" />
				</Button>

				<nav className="flex flex-col items-center w-full">
					{/* アクティブ/非アクティブの見た目をバリアントと最小限のトグルクラスで制御 */}
					<Link
						href="/notes"
						onClick={onClose}
						variant={isNotes ? "secondary" : "ghost"}
						size="icon"
						className={`size-10 transition-all ${
							isNotes
								? "bg-base-bg text-action scale-105 hover-safe:bg-base-hover"
								: "text-gray-500 hover-safe:text-action hover-safe:bg-base-hover"
						}`}
						title="Notes"
					>
						<Library aria-hidden="true" className="size-5" />
					</Link>
				</nav>
			</div>

			{/* 🏝️ 島3（最下部）：ユーザーエリア。Popover見切れ防止のため overflow-hidden は絶対禁止 */}
			<div className="w-14 bg-base-surface rounded-full flex flex-col items-center p-2 shrink-0 relative gap-4">
				<div className="w-10 h-10 flex items-center justify-center">
					<UserMenu />
				</div>
			</div>
		</div>
	);
}
