"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FileText, Home, Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { UserMenu } from "@/app/(dashboard)/_components/UserMenu";
import { CustomLink as Link } from "@/components/ui/custom-link";

interface GlobalSidebarProps {
	onSearchOpen: () => void;
	onClose?: () => void; // For mobile sheet if needed
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
		<div className="flex flex-col h-full w-full bg-base-surface items-center py-4 gap-6">
			{/* Logo (New Note Action) */}
			<button
				type="button"
				onClick={() => {
					const params = new URLSearchParams(searchParams.toString());
					params.set("globalNew", "note");
					router.push(`${pathname}?${params.toString()}`);
					onClose?.();
				}}
				className="group cursor-pointer appearance-none bg-transparent border-none p-0"
				title="New Note"
			>
				<Image
					src="/logo.svg"
					alt="sitecue logo"
					width={28}
					height={28}
					className="drop-shadow-sm transition-transform group-hover-safe:scale-110"
				/>
			</button>

			{/* Primary Actions */}
			<div className="flex flex-col items-center gap-4 w-full px-2">
				<Link
					href="/"
					onClick={onClose}
					className="flex items-center justify-center p-3 rounded-xl text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors"
					title="Home"
				>
					<Home className="w-6 h-6" aria-hidden="true" />
				</Link>

				<button
					type="button"
					onClick={onSearchOpen}
					className="flex items-center justify-center p-3 rounded-xl text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors cursor-pointer"
					title="Search"
				>
					<Search className="w-6 h-6" aria-hidden="true" />
				</button>
			</div>

			{/* Navigation */}
			<nav className="flex flex-col items-center gap-2 w-full px-2">
				<Link
					href="/notes"
					onClick={onClose}
					className={`p-3 rounded-xl transition-all flex items-center justify-center ${
						isNotes
							? "bg-base-bg text-action shadow-sm scale-105"
							: "text-gray-500 hover-safe:text-action hover-safe:bg-base-bg"
					}`}
					title="Notes"
				>
					<FileText className="w-6 h-6" aria-hidden="true" />
				</Link>
			</nav>

			{/* Footer */}
			<div className="mt-auto flex flex-col items-center gap-4 w-full">
				<UserMenu />
			</div>
		</div>
	);
}
