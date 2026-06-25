"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FileText, Home, Search, Library, LibraryBig } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { UserMenu } from "@/app/(dashboard)/_components/UserMenu";
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
		<div className="flex flex-col h-full w-full bg-transparent items-center justify-between py-6 px-2 select-none">
			{/* 🏝️ 島1（最上部）：ホームエリア */}
			<div className="w-full bg-base-surface rounded-full flex flex-col items-center p-2 shrink-0 gap-4">
				<Link
					className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors"
					href="/"
					onClick={onClose}
					title="Home"
				>
					<Home aria-hidden="true" className="w-5 h-5" />
				</Link>
			</div>

			{/* 🏝️ 島2（中央・メインアクションエリア）：まとまり（質量）を表現 */}
			<div className="w-full bg-base-surface rounded-full flex flex-col items-center p-2 gap-4 shrink-0">
				{/* sitecue（新規作成）アイコン */}
				<button
					type="button"
					onClick={() => {
						const params = new URLSearchParams(searchParams.toString());
						params.set("globalNew", "note");
						router.push(`${pathname}?${params.toString()}`);
						onClose?.();
					}}
					className="group cursor-pointer appearance-none bg-transparent border-none p-0 w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-95"
					title="New Note"
				>
					<Image
						alt="sitecue logo"
						className=" w-full h-full object-contain hover:scale-105 transition-all duration-300"
						height={40}
						src="/logo.svg"
						width={40}
					/>
				</button>

				<button
					type="button"
					onClick={onSearchOpen}
					className="flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors cursor-pointer"
					title="Search"
				>
					<Search aria-hidden="true" className="w-5 h-5" />
				</button>

				<nav className="flex flex-col items-center w-full">
					<Link
						href="/notes"
						onClick={onClose}
						className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
							isNotes
								? "bg-base-bg text-action scale-105"
								: "text-gray-500 hover-safe:text-action hover-safe:bg-base-bg"
						}`}
						title="Notes"
					>
						<Library aria-hidden="true" className="w-5 h-5" />
					</Link>
				</nav>
			</div>

			{/* 🏝️ 島3（最下部）：ユーザーエリア。Popover見切れ防止のため overflow-hidden は絶対禁止 */}
			<div className="w-full bg-base-surface rounded-full flex flex-col items-center p-2 shadow-sm shrink-0 relative gap-4">
				<div className="w-10 h-10 flex items-center justify-center">
					<UserMenu />
				</div>
			</div>
		</div>
	);
}
