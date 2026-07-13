"use client";

import type {
	CreateNoteInput,
	Note,
	ViewScope as NoteScope,
} from "@sitecue/shared";
import { CalendarDays, Inbox, PenTool } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { NotesEditor } from "@/components/editor/NotesEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LIMITS } from "@/constants/limits";
import { useAppendDiary } from "@/hooks/useDiariesQuery";
import { useCreateNote } from "@/hooks/useNotesQuery";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/useEditorStore";
import { useLayoutStore } from "@/store/useLayoutStore";
import { useUserStore } from "@/store/useUserStore";

export function GlobalNewNoteDialog() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { globalNewModal, openGlobalNewModal, closeGlobalNewModal } =
		useLayoutStore();
	const isOpen = globalNewModal.isOpen;
	const mode = globalNewModal.mode;

	const setMode = (targetMode: "gate" | "note" | "diary") => {
		useLayoutStore.setState((state) => ({
			globalNewModal: { ...state.globalNewModal, mode: targetMode },
		}));
	};

	const [content, setContent] = useState("");
	const [urlPattern, setUrlPattern] = useState("");
	const [scope, setScope] = useState<NoteScope>("inbox");
	const [_isSaving, _setIsSaving] = useState(false);
	const [noteType, setNoteType] = useState<Note["note_type"]>("info");

	const createNoteMutation = useCreateNote();
	const appendDiaryMutation = useAppendDiary();
	const openPaywall = useUserStore((state) => state.openPaywall);
	const setPendingContent = useEditorStore((state) => state.setPendingContent);

	const charCount = content.length;
	const isNearLimit = charCount >= APP_LIMITS.MAX_NOTE_LENGTH * 0.9;
	const isOverLimit = charCount > APP_LIMITS.MAX_NOTE_LENGTH;

	// 外部からのディープリンク流入時の一度きりのパッシブ同期安全装置
	useEffect(() => {
		const globalNewParam = searchParams.get("globalNew");
		const intentParam = searchParams.get("intent");

		if ((globalNewParam === "note" || globalNewParam === "diary") && !isOpen) {
			let targetMode: "gate" | "note" | "diary" = "gate";
			if (globalNewParam === "diary" || intentParam === "diary") {
				targetMode = "diary";
			} else if (intentParam === "note") {
				targetMode = "note";
			}

			openGlobalNewModal(targetMode);

			let currentExact = searchParams.get("exact");
			let currentDomain = searchParams.get("domain");
			if (currentExact === "all") currentExact = null;
			if (currentDomain === "all") currentDomain = "inbox";

			if (currentExact) {
				setUrlPattern(currentExact);
				setScope("exact");
			} else if (currentDomain && currentDomain !== "inbox") {
				setUrlPattern(currentDomain);
				setScope("domain");
			} else {
				setUrlPattern("");
				setScope("inbox");
			}

			const params = new URLSearchParams(searchParams.toString());
			params.delete("globalNew");
			params.delete("intent");
			const cleanQuery = params.toString();
			router.replace(
				`${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}`,
			);
		}
	}, [searchParams, router, openGlobalNewModal, isOpen]);

	// 起動時の入力クリア・状態リセット（❌歴史ダミープッシュは完全パージ）
	useEffect(() => {
		if (isOpen) {
			setContent("");
			setNoteType("info");
		}
	}, [isOpen]);

	// ❌ window.addEventListener("popstate") によるトリッキーなガード処理は丸ごと削除（パージ）

	const isUrlRequired = scope === "exact" || scope === "domain";
	const isUrlInvalid = isUrlRequired && !urlPattern.trim();
	const isSaveDisabled =
		!content.trim() || (mode === "note" && (isOverLimit || isUrlInvalid));

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			handleCancel();
		}
	};

	const handleCancel = () => {
		// ⚡ただインメモリのクローズフラグをキックするだけ（0ms駆動・チラつき全面根減）
		closeGlobalNewModal();
	};

	const handleSave = async () => {
		if (isSaveDisabled) return;

		const capturedContent = content.trim();
		const capturedScope = scope;
		const capturedNoteType = noteType;
		const capturedUrlPattern = urlPattern.trim();
		const currentMode = mode;

		// ⚡0msクローズ（履歴スタックへの干渉を排除）
		closeGlobalNewModal();

		try {
			if (currentMode === "diary") {
				const d = new Date();
				const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
				await appendDiaryMutation.mutateAsync({
					date: todayStr,
					text: capturedContent,
				});
				toast.success("Logged");
				return;
			}

			const input: CreateNoteInput = {
				content: capturedContent,
				scope: capturedScope,
				note_type: capturedNoteType,
				currentUrl: capturedUrlPattern || "inbox",
			};

			await createNoteMutation.mutateAsync(input);
			toast.success("Saved");
		} catch (err: unknown) {
			console.error("Failed to save via background pipeline:", err);
			const errorMessage =
				err instanceof Error
					? err.message.toLowerCase()
					: typeof err === "object" && err !== null && "message" in err
						? String((err as { message: unknown }).message).toLowerCase()
						: String(err).toLowerCase();

			if (errorMessage.includes("limit reached")) {
				openPaywall("notes");
			} else {
				toast.error(
					`Failed to save. Retain: "${capturedContent.slice(0, 20)}..."`,
				);
			}
		}
	};

	const handlePromoteToStudio = () => {
		setPendingContent(content);
		handleCancel();
		router.push(
			mode === "diary"
				? `/diaries/${new Date().toISOString().split("T")[0]}`
				: "/studio/new",
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				className={cn(
					"bg-base-surface flex flex-col max-h-[85vh] overflow-hidden p-0",
					mode === "gate" ? "sm:max-w-md" : "sm:max-w-2xl",
				)}
			>
				<DialogTitle className="sr-only">Capture Menu</DialogTitle>

				{mode === "gate" && (
					<div className="p-6 space-y-4">
						<h2 className="text-base font-bold text-action text-center uppercase tracking-wide mb-2">
							What would you like to capture?
						</h2>
						<div className="flex flex-col w-full gap-3">
							<button
								type="button"
								onClick={() => setMode("note")}
								className="flex items-center gap-4 w-full p-4 rounded-[2rem] border border-base-border bg-base-bg hover-safe:bg-base-surface text-left cursor-pointer transition-all group px-6"
							>
								<Inbox className="w-5 h-5 text-gray-400 group-hover-safe:text-action shrink-0" />
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-bold text-action">
										Quick Note
									</span>
									<span className="text-xs text-gray-400 truncate">
										Capture an instantaneous text linked to context
									</span>
								</div>
							</button>

							<button
								type="button"
								onClick={() => {
									handleCancel();
									router.push("/studio/new");
								}}
								className="flex items-center gap-4 w-full p-4 rounded-[2rem] border border-base-border bg-base-bg hover-safe:bg-base-surface text-left cursor-pointer transition-all group px-6"
							>
								<PenTool className="w-5 h-5 text-gray-400 group-hover-safe:text-action shrink-0" />
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-bold text-action">
										Blank Draft
									</span>
									<span className="text-xs text-gray-400 truncate">
										Open full-pane studio to author a heavy document
									</span>
								</div>
							</button>

							<button
								type="button"
								onClick={() => setMode("diary")}
								className="flex items-center gap-4 w-full p-4 rounded-[2rem] border border-base-border bg-base-bg hover-safe:bg-base-surface text-left cursor-pointer transition-all group px-6"
							>
								<CalendarDays className="w-5 h-5 text-gray-400 group-hover-safe:text-action shrink-0" />
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-bold text-action">
										Daily Diary
									</span>
									<span className="text-xs text-gray-400 truncate">
										Atomic titleless log appending to today's timeline
									</span>
								</div>
							</button>
						</div>
					</div>
				)}

				{mode === "diary" && (
					<div className="flex flex-col flex-1 p-6 space-y-4">
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono font-bold uppercase text-neutral-400">
								Daily Diary Mode
							</span>
						</div>
						<textarea
							autoFocus
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Write down your thoughts for today... (No title required)"
							className="w-full flex-1 min-h-[320px] p-4 text-base bg-base-bg text-action border border-base-border rounded-xl focus:outline-none focus:ring-1 focus:ring-action resize-none font-sans"
							onKeyDown={(e) => {
								if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
									e.preventDefault();
									handleSave();
								}
							}}
						/>
						<div className="flex items-center justify-between mt-2">
							<Button
								className="text-xs text-neutral-400 hover:text-action p-0 h-auto"
								onClick={handlePromoteToStudio}
								type="button"
								variant="link"
							>
								Edit in Diary Studio
							</Button>
							<div className="flex gap-2">
								<Button onClick={handleCancel} type="button" variant="ghost">
									Cancel
								</Button>
								<Button
									className="min-w-[100px]"
									disabled={!content.trim()}
									onClick={handleSave}
									type="button"
									variant="default"
								>
									Save Diary
								</Button>
							</div>
						</div>
					</div>
				)}

				{mode === "note" && (
					<>
						<div className="p-6 space-y-6 flex-1 overflow-y-auto">
							<div className="flex items-center gap-2">
								<span className="text-xs font-mono font-bold uppercase text-neutral-400">
									Quick Note Mode
								</span>
							</div>

							<div className="space-y-4">
								<div className="space-y-2">
									<Label className="font-xs font-bold uppercase tracking-wider text-gray-400 inline-block mb-4">
										Scope
									</Label>
									<div className="flex gap-2">
										{(["inbox", "domain", "exact"] as const).map((s) => (
											<Button
												key={s}
												type="button"
												variant={scope === s ? "default" : "secondary"}
												size="sm"
												onClick={() => setScope(s)}
												className="capitalize cursor-pointer"
											>
												{s === "exact" ? "Page" : s}
											</Button>
										))}
									</div>
								</div>

								{scope !== "inbox" && (
									<div className="space-y-2">
										<Label
											htmlFor="global-url"
											className="font-xs font-bold uppercase tracking-wider text-gray-400 inline-block mb-4"
										>
											Source URL
										</Label>
										<Input
											id="global-url"
											placeholder="[example.com/page](https://example.com/page)"
											value={urlPattern}
											onChange={(e) => setUrlPattern(e.target.value)}
											className="h-9 w-full"
										/>
									</div>
								)}
							</div>

							<div className="grid items-center gap-2 mb-4">
								<Label className="font-xs font-bold uppercase tracking-wider text-gray-400 inline-block mb-4">
									Note Type
								</Label>
								<div className="flex gap-2">
									{(["info", "alert", "idea"] as const).map((type) => (
										<Button
											key={type}
											type="button"
											variant={noteType === type ? "default" : "secondary"}
											size="sm"
											onClick={() => setNoteType(type as Note["note_type"])}
											className="capitalize cursor-pointer"
										>
											{type}
										</Button>
									))}
								</div>
							</div>

							<div className="space-y-2">
								<Label className="font-xs font-bold uppercase tracking-wider text-gray-400 inline-block mb-4">
									Note
								</Label>
								<NotesEditor
									value={content}
									onChange={setContent}
									placeholder="What's on your mind?"
									isDirty={content.length > 0}
								/>
								{isNearLimit && (
									<div className="flex justify-end">
										<span
											className={cn(
												"text-[10px] font-bold",
												isOverLimit ? "text-note-alert" : "text-note-idea",
											)}
										>
											{charCount.toLocaleString()} /{" "}
											{APP_LIMITS.MAX_NOTE_LENGTH.toLocaleString()}
										</span>
									</div>
								)}
							</div>
						</div>

						<div className="m-0 p-4 bg-base-surface/50 border-t border-base-border flex justify-between w-full">
							<Button
								type="button"
								variant="outline"
								onClick={handlePromoteToStudio}
								className="mr-auto"
							>
								Edit in Studio
							</Button>
							<div className="flex gap-2">
								<Button type="button" variant="ghost" onClick={handleCancel}>
									Cancel
								</Button>
								<Button
									type="button"
									variant="default"
									onClick={handleSave}
									disabled={isSaveDisabled}
									className="min-w-[100px]"
								>
									Save Note
								</Button>
							</div>
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
