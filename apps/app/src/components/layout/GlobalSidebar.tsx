"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FileText, Globe, Inbox, PenSquare, Plus, Search } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { UserMenu } from "@/app/(dashboard)/_components/UserMenu";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

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
	const domainParam = searchParams.get("domain");
	const viewParam = searchParams.get("view");
	const exactParam = searchParams.get("exact");

	const currentDomain = domainParam || (isNotes && !viewParam ? "inbox" : null);
	const currentView =
		viewParam || (domainParam ? "domains" : isNotes ? "inbox" : null);
	const currentExact = exactParam || null;

	const isInboxActive =
		isNotes &&
		(currentView === "inbox" || (currentDomain === "inbox" && !currentExact));
	const isDraftsActive = isNotes && currentView === "drafts";
	const isDomainsActive =
		isNotes &&
		(currentView === "domains" ||
			(!!currentDomain && currentDomain !== "inbox"));

	const handleNewNote = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("globalNew", "note");
		router.push(`${pathname}?${params.toString()}`);
		onClose?.();
	};

	return (
		<div className="flex flex-col h-full w-full bg-base-surface items-center py-4 gap-6">
			{/* Logo */}
			<Link href="/" className="group" onClick={onClose}>
				<Image
					src="/logo.svg"
					alt="sitecue logo"
					width={28}
					height={28}
					className="drop-shadow-sm transition-transform group-hover-safe:scale-110"
				/>
			</Link>

			{/* Primary Actions */}
			<div className="flex flex-col items-center gap-4 w-full px-2">
				<Popover>
					<PopoverTrigger
						render={
							<Button
								variant="ghost"
								size="icon"
								className="rounded-full bg-action text-action-text hover-safe:bg-action-hover hover-safe:scale-110 transition-all cursor-pointer shadow-sm"
								title="Create New"
							>
								<Plus className="w-5 h-5" aria-hidden="true" />
							</Button>
						}
					/>
					<PopoverContent
						side="right"
						align="start"
						sideOffset={16}
						className="w-48 p-2 flex flex-col gap-1 z-50"
					>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => {
								const params = new URLSearchParams(searchParams.toString());
								params.set("globalNew", "note");
								router.push(`${pathname}?${params.toString()}`);
								onClose?.();
							}}
							className="flex items-center justify-start gap-2 w-full cursor-pointer text-gray-600 hover:text-action"
						>
							<FileText className="w-4 h-4" aria-hidden="true" />
							New Note
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => {
								const params = new URLSearchParams(searchParams.toString());
								params.set("globalNew", "draft");
								router.push(`${pathname}?${params.toString()}`);
								onClose?.();
							}}
							className="flex items-center justify-start gap-2 w-full cursor-pointer text-gray-600 hover:text-action"
						>
							<PenSquare className="w-4 h-4" aria-hidden="true" />
							New Draft
						</Button>
					</PopoverContent>
				</Popover>

				<Button
					variant="ghost"
					size="icon"
					onClick={onSearchOpen}
					className="text-gray-500 hover-safe:text-action hover-safe:bg-base-bg transition-colors cursor-pointer"
					title="Search"
				>
					<Search className="w-5 h-5" aria-hidden="true" />
				</Button>
			</div>

			{/* Navigation */}
			<nav className="flex flex-col items-center gap-2 w-full px-2">
				<Link
					href="/notes?domain=inbox"
					onClick={onClose}
					className={`p-3 rounded-xl transition-all ${
						isInboxActive
							? "bg-base-bg text-action shadow-sm scale-105"
							: "text-gray-500 hover-safe:text-action hover-safe:bg-base-bg"
					}`}
					title="Inbox"
				>
					<Inbox className="w-6 h-6" aria-hidden="true" />
				</Link>

				<Link
					href="/notes?view=domains"
					onClick={onClose}
					className={`p-3 rounded-xl transition-all ${
						isDomainsActive
							? "bg-base-bg text-action shadow-sm scale-105"
							: "text-gray-500 hover-safe:text-action hover-safe:bg-base-bg"
					}`}
					title="Domains"
				>
					<Globe className="w-6 h-6" aria-hidden="true" />
				</Link>

				<Link
					href="/notes?view=drafts"
					onClick={onClose}
					className={`p-3 rounded-xl transition-all ${
						isDraftsActive
							? "bg-base-bg text-action shadow-sm scale-105"
							: "text-gray-500 hover-safe:text-action hover-safe:bg-base-bg"
					}`}
					title="Drafts"
				>
					<PenSquare className="w-6 h-6" aria-hidden="true" />
				</Link>
			</nav>

			{/* Footer */}
			<div className="mt-auto flex flex-col items-center gap-4 w-full">
				<UserMenu />
			</div>
		</div>
	);
}
