"use client";

import { Menu } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveNotesLayoutProps {
	leftNode: ReactNode;
	middleNode: ReactNode;
	rightNode: ReactNode;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
}

export function ResponsiveNotesLayout({
	leftNode,
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
			<div className="flex h-screen overflow-hidden bg-base-bg font-sans text-action">
				<Fragment key="left">{leftNode}</Fragment>
				<Fragment key="middle">{middleNode}</Fragment>
				<Fragment key="right">{rightNode}</Fragment>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen overflow-hidden bg-base-bg font-sans text-action">
			{/* Mobile Header */}
			<header className="flex items-center justify-between px-4 py-3 border-b border-base-border bg-base-surface">
				<div className="flex items-center gap-3">
					<Sheet>
						<SheetTrigger
							render={
								<Button variant="ghost" size="icon" className="cursor-pointer">
									<Menu className="h-5 w-5" />
									<span className="sr-only">Toggle menu</span>
								</Button>
							}
						/>
						<SheetContent side="left" className="p-0 w-72">
							<SheetHeader className="sr-only">
								<SheetTitle>Navigation Menu</SheetTitle>
								<SheetDescription>
									Access your inbox, drafts, and domains
								</SheetDescription>
							</SheetHeader>
							{leftNode}
						</SheetContent>
					</Sheet>
					<h1 className="font-bold text-lg tracking-tight">sitecue</h1>
				</div>
			</header>

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
