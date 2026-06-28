"use client";

import type { Diary } from "@sitecue/shared";
import {
	ArrowLeft,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
	Panel,
	Group as PanelGroup,
	Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { StudioEditor } from "@/components/editor/StudioEditor";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUpdateDiary } from "@/hooks/useDiariesQuery";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import { DiaryMaterialsPane } from "./DiaryMaterialsPane";

interface Props {
	initialDiary: Diary | null;
	date: string;
}

export function DiaryStudioClient({ initialDiary, date }: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isPanelOpen = searchParams.get("panel") === "materials";

	const togglePanel = () => {
		const params = new URLSearchParams(searchParams.toString());
		if (isPanelOpen) {
			params.delete("panel");
		} else {
			params.set("panel", "materials");
		}
		router.replace(`${window.location.pathname}?${params.toString()}`);
	};

	const _isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const isDesktop = useMediaQuery("(min-width: 768px)");
	const isLargeDesktop = useMediaQuery("(min-width: 1024px)");
	const isTabletPortrait = useMediaQuery(
		"(min-width: 768px) and (max-width: 1023px)",
	);
	const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
	const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
		"idle",
	);

	const [content, setContent] = useState(initialDiary?.content || "");
	const updateDiaryMutation = useUpdateDiary();

	const isDirty = content !== (initialDiary?.content || "");

	const handleSave = async () => {
		setStatus("saving");
		try {
			await updateDiaryMutation.mutateAsync({ date, text: content });
			setStatus("success");
			setTimeout(() => setStatus("idle"), 2000);
		} catch (err) {
			console.error(err);
			setStatus("error");
		}
	};

	const handleBack = () => {
		if (window.history.length > 2) router.back();
		else router.push("/notes?view=diaries");
	};

	const handleInsertMaterial = (text: string) => {
		setContent((prev) => (prev ? `${prev}\n\n${text}` : text));
	};

	const charCount = content.length;

	if (isDesktop && isLargeDesktop) {
		return (
			<div className="flex-1 h-full w-full flex flex-col min-h-0 relative">
				<PanelGroup
					className="flex-1 w-full h-full overflow-hidden bg-base-bg text-action"
					orientation="horizontal"
				>
					<Panel
						className="flex h-full flex-col overflow-hidden border-r border-base-border bg-base-bg min-w-0"
						defaultSize="65%"
						minSize="30%"
					>
						<header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-base-border bg-base-surface/50 h-14">
							<div className="flex items-center gap-3">
								<Button
									className="text-gray-400 hover:text-action cursor-pointer"
									onClick={handleBack}
									size="icon"
									variant="ghost"
								>
									<ArrowLeft className="w-4 h-4" />
								</Button>
								<div className="flex flex-col">
									<h1 className="text-sm font-bold tracking-tight text-action">
										Diary Studio
									</h1>
									<span className="text-[10px] font-mono text-gray-400 font-bold">
										{date}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs font-mono font-bold text-neutral-400 mr-2">
									{charCount.toLocaleString()} chars
								</span>
								<Button
									className="shadow-sm font-bold min-w-[80px] cursor-pointer"
									disabled={status === "saving" || !isDirty}
									onClick={handleSave}
									size="sm"
									variant="default"
								>
									{status === "saving"
										? "Saving..."
										: status === "success"
											? "Saved"
											: "Save Diary"}
								</Button>
							</div>
						</header>

						<div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 md:py-10 bg-base-bg min-w-0">
							<div className="relative max-w-4xl mx-auto w-full flex flex-col gap-6 min-w-0">
								<div className="text-xs font-medium text-neutral-400 uppercase tracking-widest font-mono">
									Canvas: Daily Sandbox
								</div>
								<div className="relative w-full text-base md:text-sm min-w-0">
									<StudioEditor
										onChange={(val) => setContent(val)}
										value={content}
										placeholder="Write down your thoughts for today... (Markdown supported)"
										isDirty={isDirty}
										onGenerateHint={async () => null}
									/>
								</div>
							</div>
						</div>
					</Panel>
					<PanelResizeHandle className="w-1 bg-transparent hover:bg-neutral-200 active:bg-neutral-300 transition-colors cursor-col-resize" />
					<Panel
						className="flex h-full flex-col overflow-hidden bg-base-surface border-l border-base-border"
						defaultSize="35%"
						maxSize="50%"
						minSize="20%"
					>
						<DiaryMaterialsPane date={date} onInsert={handleInsertMaterial} />
					</Panel>
				</PanelGroup>
			</div>
		);
	}

	return (
		<div className="flex-1 h-full w-full flex flex-col min-h-0 relative">
			<div className="flex-grow w-full h-full flex relative overflow-hidden bg-base-bg text-action">
				<div
					className={cn(
						"h-full flex flex-col transition-all duration-300 ease-in-out overflow-hidden min-w-0 bg-base-bg",
						isTabletPortrait && isPanelOpen
							? "w-1/2 border-r border-base-border"
							: "w-full",
					)}
				>
					<header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-base-border bg-base-surface/50 h-14">
						<div className="flex items-center gap-3">
							<Button
								className="text-gray-400 hover:text-action cursor-pointer"
								onClick={handleBack}
								size="icon"
								variant="ghost"
							>
								<ArrowLeft className="w-4 h-4" />
							</Button>
							<div className="flex flex-col">
								<h1 className="text-sm font-bold tracking-tight text-action">
									Diary Studio
								</h1>
								<span className="text-[10px] font-mono text-gray-400 font-bold">
									{date}
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono font-bold text-neutral-400 mr-2">
								{charCount.toLocaleString()} chars
							</span>
							<Button
								className="shadow-sm font-bold min-w-[80px] cursor-pointer"
								disabled={status === "saving" || !isDirty}
								onClick={handleSave}
								size="sm"
								variant="default"
							>
								{status === "saving"
									? "Saving..."
									: status === "success"
										? "Saved"
										: "Save Diary"}
							</Button>
						</div>
					</header>

					<div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 md:py-10 bg-base-bg min-w-0">
						<div className="relative max-w-4xl mx-auto w-full flex flex-col gap-6 min-w-0">
							<div className="text-xs font-medium text-neutral-400 uppercase tracking-widest font-mono">
								Canvas: Daily Sandbox
							</div>
							<div className="relative w-full text-base md:text-sm min-w-0">
								<StudioEditor
									onChange={(val) => setContent(val)}
									value={content}
									placeholder="Write down your thoughts for today... (Markdown supported)"
									isDirty={isDirty}
									onGenerateHint={async () => null}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* 境界線 / エッジ・フローティングノブ: iPad縦持ち環境のみ */}
				{isTabletPortrait && (
					<button
						type="button"
						onClick={togglePanel}
						className={cn(
							"fixed top-1/2 -translate-y-1/2 z-40 bg-base-surface border border-base-border shadow-md text-neutral-400 hover:text-action transition-all duration-300 ease-in-out flex items-center justify-center cursor-pointer",
							isPanelOpen
								? "right-[50%] -mr-4 size-8 rounded-full"
								: "right-0 rounded-l-full h-12 w-6",
						)}
						title={isPanelOpen ? "Close Panel" : "Open Materials"}
					>
						{isPanelOpen ? (
							<ChevronRight className="w-4 h-4" aria-hidden="true" />
						) : (
							<ChevronLeft className="w-4 h-4" aria-hidden="true" />
						)}
					</button>
				)}

				{/* 右側パネル: iPad縦持ちで開いている場合のみ幅50% */}
				{isTabletPortrait && (
					<div
						className={cn(
							"h-full bg-base-surface transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0",
							isPanelOpen ? "w-1/2" : "w-0 opacity-0 pointer-events-none",
						)}
					>
						<div className="flex-1 overflow-hidden">
							<DiaryMaterialsPane date={date} onInsert={handleInsertMaterial} />
						</div>
					</div>
				)}
			</div>

			{/* Floating Mobile Trigger */}
			{!isDesktop && (
				<div className="fixed bottom-6 right-6 z-50">
					<Drawer
						onOpenChange={setIsMobileDrawerOpen}
						open={isMobileDrawerOpen}
					>
						<DrawerTrigger asChild>
							<button
								type="button"
								className="flex h-12 items-center justify-center gap-2 rounded-full bg-action px-5 text-action-text shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
							>
								<CalendarDays aria-hidden="true" className="h-4 w-4" />
								<span className="text-xs font-bold font-mono uppercase tracking-wide">
									Materials
								</span>
							</button>
						</DrawerTrigger>
						<DrawerContent className="!mt-0 !h-[100dvh] !max-h-none rounded-t-2xl rounded-b-none p-0 flex flex-col overflow-hidden bg-base-bg border-none">
							<DrawerHeader className="sr-only">
								<DrawerTitle>Materials Timeline</DrawerTitle>
								<DrawerDescription>
									Review your footprints for today
								</DrawerDescription>
							</DrawerHeader>
							<div className="shrink-0 flex items-center px-4 h-14 border-b border-base-border bg-base-bg">
								<Button
									onClick={() => setIsMobileDrawerOpen(false)}
									type="button"
									variant="ghost"
									className="gap-2 px-2 -ml-2 text-action cursor-pointer text-xs font-bold"
								>
									<ArrowLeft aria-hidden="true" className="w-4 h-4" />
									Editor Workspace
								</Button>
							</div>
							<div className="flex-1 overflow-hidden">
								<DiaryMaterialsPane
									date={date}
									onInsert={handleInsertMaterial}
								/>
							</div>
						</DrawerContent>
					</Drawer>
				</div>
			)}
		</div>
	);
}
