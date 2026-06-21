"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ResponsiveNotesLayoutProps {
	middleNode: ReactNode;
	rightNode: ReactNode;
	selectedNoteId: string | null;
	selectedDraftId: string | null;
	selectedDate?: string | null;
}

export function ResponsiveNotesLayout({
	middleNode,
	rightNode,
	selectedNoteId,
	selectedDraftId,
	selectedDate,
}: ResponsiveNotesLayoutProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const router = useRouter();
	const searchParams = useSearchParams();

	// URLから導出される本来の開閉状態
	const isDetailOpenUrl = !!(
		selectedNoteId ||
		selectedDraftId ||
		selectedDate ||
		searchParams.get("new") === "note"
	);

	// UI上のDrawer開閉状態（アニメーション制御用ローカルステート）
	const [isDrawerOpen, setIsDrawerOpen] = useState(isDetailOpenUrl);

	// URLの状態が変更されたら、Drawerの開閉状態を同期する
	useEffect(() => {
		setIsDrawerOpen(isDetailOpenUrl);
	}, [isDetailOpenUrl]);

	const handleCloseDetail = (open: boolean) => {
		if (!open) {
			// 1. まずUI側のDrawerを閉じるアニメーションを開始
			setIsDrawerOpen(false);

			// 2. アニメーション完了（約300ms）を待ってからURLコンテキストを更新・遷移
			setTimeout(() => {
				const params = new URLSearchParams(searchParams.toString());

				params.delete("noteId");
				params.delete("draftId");
				params.delete("date");
				params.delete("new");

				router.push(`/notes?${params.toString()}`);
			}, 300);
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
			<main
				className={cn(
					"flex-1 overflow-hidden",
					isDrawerOpen && "pointer-events-none",
				)}
				inert={isDrawerOpen ? true : undefined}
				aria-hidden={isDrawerOpen ? "true" : "false"}
			>
				{middleNode}
			</main>

			{/* Detail Stack (Mobile Only) */}
			<div
				className={cn(
					"fixed inset-0 z-30 bg-base-bg transform-gpu transition-transform duration-300 ease-in-out flex flex-col",
					isDrawerOpen ? "translate-x-0" : "translate-x-full",
				)}
				aria-hidden={!isDrawerOpen}
				data-testid="mobile-detail-stack"
			>
				{/* Mobile Header with Back Button */}
				<div className="shrink-0 flex items-center px-4 py-2 border-b border-base-border pt-safe">
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
			</div>
		</div>
	);
}
