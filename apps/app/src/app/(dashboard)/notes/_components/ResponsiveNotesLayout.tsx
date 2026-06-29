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
	const isLargeDesktop = useMediaQuery("(min-width: 1024px)");
	const isTabletPortrait = useMediaQuery(
		"(min-width: 768px) and (max-width: 1023px)",
	);
	const router = useRouter();
	const searchParams = useSearchParams();

	const isDetailOpenUrl = !!(
		selectedNoteId ||
		selectedDraftId ||
		selectedDate ||
		searchParams.get("new") === "note"
	);

	const [isDrawerOpen, setIsDrawerOpen] = useState(isDetailOpenUrl);

	useEffect(() => {
		setIsDrawerOpen(isDetailOpenUrl);
	}, [isDetailOpenUrl]);

	const handleCloseDetail = (open: boolean) => {
		if (!open) {
			setIsDrawerOpen(false);
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

	// 1. PC大画面（1024px以上）: 完全3ペイン並列 Flow 配置
	if (isLargeDesktop) {
		return (
			<div className="flex h-full overflow-hidden bg-base-bg font-sans text-action">
				<Fragment key="middle">{middleNode}</Fragment>
				<Fragment key="right">{rightNode}</Fragment>
			</div>
		);
	}

	// 2. iPad縦持ち（768px 〜 1023px）: 中ペイン固定 ＋ 右詳細部分オーバーレイ
	if (isTabletPortrait) {
		return (
			<div className="relative flex h-full overflow-hidden bg-base-bg font-sans text-action">
				{/* Middle List: 常時固定描画 */}
				<div className="w-96 shrink-0 h-full overflow-hidden border-r border-base-border">
					{middleNode}
				</div>

				{/* Tap-to-Close Backdrop: 露出している中ペイン左側部分を優しく防御 */}
				{isDrawerOpen && (
					<div
						className="absolute inset-0 z-20 bg-black/10 transition-opacity duration-300 cursor-pointer"
						onClick={() => handleCloseDetail(false)}
						aria-hidden="true"
					/>
				)}

				{/* Right Detail Pane: 滑らかにスライドインする絶対配置ドロワー */}
				<div
					className={cn(
						"absolute top-0 right-0 z-30 h-full w-[500px] bg-base-bg shadow-2xl border-l border-base-border transform-gpu transition-transform duration-300 ease-in-out flex flex-col",
						isDrawerOpen ? "translate-x-0" : "translate-x-full",
					)}
				>
					<div className="flex-1 overflow-hidden">{rightNode}</div>
				</div>
			</div>
		);
	}

	// 3. モバイル環境（767px以下）: 既存のStack遷移を100%維持
	return (
		<div className="flex flex-col h-full overflow-hidden bg-base-bg font-sans text-action">
			<div
				className={cn(
					"flex-1 overflow-hidden",
					isDrawerOpen && "pointer-events-none",
				)}
				inert={isDrawerOpen ? true : undefined}
				aria-hidden={isDrawerOpen ? "true" : "false"}
			>
				{middleNode}
			</div>

			<div
				className={cn(
					"fixed inset-0 z-30 bg-base-bg transform-gpu transition-transform duration-300 ease-in-out flex flex-col",
					isDrawerOpen ? "translate-x-0" : "translate-x-full",
				)}
				aria-hidden={!isDrawerOpen}
				data-testid="mobile-detail-stack"
			>
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
				<div className="flex-1 overflow-y-auto">{rightNode}</div>
			</div>
		</div>
	);
}
