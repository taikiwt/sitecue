"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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

	const isDetailOpen = !!(selectedNoteId || selectedDraftId);

	const handleCloseDetail = (open: boolean) => {
		if (!open) {
			const params = new URLSearchParams(searchParams.toString());
			params.delete("noteId");
			params.delete("draftId");
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

			{/* Detail Dialog */}
			<Dialog open={isDetailOpen} onOpenChange={handleCloseDetail}>
				<DialogContent className="p-0 sm:max-w-full h-[90vh] sm:h-screen sm:rounded-none flex flex-col overflow-hidden">
					<DialogHeader className="sr-only">
						<DialogTitle>Detail View</DialogTitle>
						<DialogDescription>
							View and edit note or draft details
						</DialogDescription>
					</DialogHeader>
					<div className="flex-1 overflow-hidden">{rightNode}</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
