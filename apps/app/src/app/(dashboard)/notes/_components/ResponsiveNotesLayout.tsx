"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveNotesLayoutProps {
	middleNode: ReactNode;
	rightNode: ReactNode;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
}

export function ResponsiveNotesLayout({
	middleNode,
	rightNode,
	selectedNoteId,
	selectedDraftId,
}: ResponsiveNotesLayoutProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const router = useRouter();
	const searchParams = useSearchParams();

	const isDetailOpen = !!(
		selectedNoteId ||
		selectedDraftId ||
		searchParams.get("new") === "note"
	);

	const handleCloseDetail = (open: boolean) => {
		if (!open) {
			const params = new URLSearchParams(searchParams.toString());
			params.delete("noteId");
			params.delete("draftId");
			params.delete("new");
			router.push(`/notes?${params.toString()}`);
		}
	};

	if (isDesktop) {
		return (
			<div className="flex h-full overflow-hidden bg-base-bg font-sans text-action">
				<Fragment key="middle">{middleNode}</Fragment>
				<Fragment key="right">{rightNode}</Fragment>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full overflow-hidden bg-base-bg font-sans text-action">
			{/* List Area */}
			<main className="flex-1 overflow-hidden">{middleNode}</main>

			{/* Detail Drawer (Mobile Only) */}
			<Drawer onOpenChange={handleCloseDetail} open={isDetailOpen}>
				<DrawerContent className="!mt-0 !h-[100dvh] !max-h-none rounded-t-2xl rounded-b-none p-0 flex flex-col overflow-hidden bg-base-bg border-none">
					<DrawerHeader className="sr-only">
						<DrawerTitle>Detail View</DrawerTitle>
						<DrawerDescription>
							View and edit note or draft details
						</DrawerDescription>
					</DrawerHeader>

					{/* Mobile Header with Back Button (Placed under the drag handle) */}
					<div className="shrink-0 flex items-center px-4 py-2 border-b border-base-border mt-2">
						<Button
							onClick={() => handleCloseDetail(false)}
							type="button"
							variant="ghost"
							className="gap-2 px-2 -ml-2 text-action hover-safe:bg-base-surface cursor-pointer"
						>
							<ArrowLeft aria-hidden="true" className="w-5 h-5" />
							Notes
						</Button>
					</div>

					{/* Scrollable Content Area */}
					<div className="flex-1 overflow-y-auto">{rightNode}</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
