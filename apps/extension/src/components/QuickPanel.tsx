import { SHARED_LIMITS } from "@sitecue/shared";
import {
	Check,
	ChevronDown,
	ChevronRight,
	Copy,
	Eraser,
	Eye,
	FileText,
	Loader2,
	Maximize2,
	Minimize2,
	Send,
	SquareTerminal,
} from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";
import { useAuth } from "../hooks/useAuth";
import { useAutoIndent } from "../hooks/useAutoIndent";
import { useMarkdownAssist } from "../hooks/useMarkdownAssist";
import {
	type QuickNoteViewMode,
	type QuickPanelTab,
	useQuickStorage,
} from "../hooks/useQuickStorage";
import MarkdownRenderer from "./MarkdownRenderer";
import { Button } from "./ui/button";

export type { QuickNoteViewMode, QuickPanelTab };

interface QuickPanelProps {
	currentDomain: string | null;
	userPlan: "free" | "pro" | "guest";
	onAddNote: (
		content: string,
		scope: "exact" | "domain" | "inbox",
		type: "info" | "alert" | "idea",
	) => Promise<boolean>;
	onAppendDiary: (content: string) => Promise<boolean>;
	isMaximized: boolean;
	onToggleMaximize: () => void;
}

export default function QuickPanel({
	currentDomain,
	userPlan,
	onAddNote,
	onAppendDiary,
	isMaximized,
	onToggleMaximize,
}: QuickPanelProps) {
	const { t } = useTranslation();
	const { authStatus } = useAuth();
	const userId = authStatus.userId || "guest";

	const {
		activeSection,
		updateActiveSection,
		noteText,
		handleNoteTextChange,
		flushNoteStorage,
		codeText,
		handleCodeTextChange,
		flushCodeStorage,
		noteViewMode,
		toggleNoteViewMode,
	} = useQuickStorage(userId);

	const [noteCopied, setNoteCopied] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [isSliding, setIsSliding] = useState(false);
	const [codeCopied, setCodeCopied] = useState(false);
	const noteScrollContainerRef = useRef<HTMLDivElement>(null);
	const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

	const isPro = userPlan === "pro";
	const maxNoteLength = isPro
		? SHARED_LIMITS.NOTE_LENGTH.PRO
		: SHARED_LIMITS.NOTE_LENGTH.FREE;
	const maxDiaryLength = isPro
		? SHARED_LIMITS.DIARY_LENGTH.PRO
		: SHARED_LIMITS.DIARY_LENGTH.FREE;

	const isNoteOverLimit = noteText.length > maxNoteLength;
	const isDiaryOverLimit = noteText.length > maxDiaryLength;

	const { onKeyDown: onNoteKeyDown, onPaste: onNotePaste } =
		useMarkdownAssist();
	const { onKeyDown: onCommandKeyDown } = useAutoIndent();

	const toggleSection = (section: Exclude<QuickPanelTab, "none">) => {
		const nextTab: QuickPanelTab = activeSection === section ? "none" : section;
		updateActiveSection(nextTab);
		if (nextTab === "none" && isMaximized) {
			onToggleMaximize();
		}
	};

	const handleCopyNote = async () => {
		if (!noteText) return;
		await navigator.clipboard.writeText(noteText);
		setNoteCopied(true);
		setTimeout(() => setNoteCopied(false), 2000);
	};

	const handleCopyCode = async () => {
		if (!codeText) return;
		await navigator.clipboard.writeText(codeText);
		setCodeCopied(true);
		setTimeout(() => setCodeCopied(false), 2000);
	};

	const handleSaveAsNote = async () => {
		if (!noteText.trim() || submitting || isNoteOverLimit) return;
		setSubmitting(true);
		const textToSave = noteText.trim();

		setIsSliding(true);
		await new Promise((resolve) => setTimeout(resolve, 300));

		handleNoteTextChange("");
		setIsSliding(false);

		const success = await onAddNote(textToSave, "inbox", "info");
		setSubmitting(false);

		if (!success) {
			handleNoteTextChange(textToSave);
			toast.error(t("toast.sendTextFailed"));
		}
	};

	const handleSaveToDiary = async () => {
		if (!noteText.trim() || submitting || isDiaryOverLimit) return;
		setSubmitting(true);
		const textToSave = noteText.trim();

		setIsSliding(true);
		await new Promise((resolve) => setTimeout(resolve, 300));

		handleNoteTextChange("");
		setIsSliding(false);

		const success = await onAppendDiary(textToSave);
		setSubmitting(false);

		if (!success) {
			handleNoteTextChange(textToSave);
			toast.error(t("toast.sendTextFailed"));
		}
	};

	return (
		<div
			className={`${
				isMaximized
					? "flex-1 min-h-0 m-0 rounded-none bg-base-bg flex flex-col font-sans"
					: "mx-2.5 mt-2.5 rounded-2xl bg-base-bg border border-base-border shadow-2xs flex flex-col min-h-0 font-sans"
			} ${!currentDomain ? "hidden" : ""}`}
		>
			{/* 1段目：タブ＆器の操作バー（通常時・最大化時ともに常時表示） */}
			<div
				className={`flex items-center justify-between px-3 py-2 text-xs font-semibold select-none shrink-0 ${
					activeSection !== "none" ? "border-b border-base-border/30" : ""
				}`}
			>
				<div className="flex items-center gap-1.5 min-w-0">
					{/* Note（主役） */}
					<button
						type="button"
						onClick={() => toggleSection("note")}
						title={t("quick.tabNoteTooltip")}
						className={`cursor-pointer flex items-center gap-1.5 rounded-full px-3 py-1 shrink-0 ${
							activeSection === "note"
								? "bg-action text-action-text shadow-2xs"
								: "bg-transparent text-muted-foreground hover:text-action hover:bg-muted"
						}`}
					>
						<FileText aria-hidden="true" className="w-3.5 h-3.5" />
						<span>{t("quick.tabNote")}</span>
						{activeSection === "note" ? (
							<ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
						) : (
							<ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
						)}
					</button>

					{/* Command（サブ） */}
					<button
						type="button"
						onClick={() => toggleSection("command")}
						title={t("quick.tabCommandTooltip")}
						className={`cursor-pointer flex items-center gap-1.5 rounded-full px-2.5 py-1 shrink-0 ${
							activeSection === "command"
								? "bg-action text-action-text shadow-2xs"
								: "bg-transparent text-muted-foreground hover:text-action hover:bg-muted"
						}`}
					>
						<SquareTerminal aria-hidden="true" className="w-3.5 h-3.5" />
						<span>{t("quick.tabCommand")}</span>
						{activeSection === "command" ? (
							<ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
						) : (
							<ChevronRight aria-hidden="true" className="w-3.5 h-3.5" />
						)}
					</button>
				</div>

				{/* 右側（器の操作・右端統一） */}
				{activeSection !== "none" && (
					<div className="flex items-center gap-1 shrink-0">
						{activeSection === "note" && (
							<Button
								icon={<Eye className="size-4" aria-hidden="true" />}
								size="sm"
								variant="ghost"
								onClick={toggleNoteViewMode}
								title={
									noteViewMode === "preview"
										? t("quick.exitPreview")
										: t("quick.preview")
								}
								aria-label={
									noteViewMode === "preview"
										? t("quick.exitPreview")
										: t("quick.preview")
								}
								aria-pressed={noteViewMode === "preview"}
								className={`size-7 p-0 rounded-full ${
									noteViewMode === "preview"
										? "bg-action text-action-text hover:opacity-90"
										: ""
								}`}
							/>
						)}
						<Button
							icon={
								isMaximized ? (
									<Minimize2 aria-hidden="true" className="size-4" />
								) : (
									<Maximize2 aria-hidden="true" className="size-4" />
								)
							}
							size="sm"
							variant="ghost"
							onClick={onToggleMaximize}
							title={
								isMaximized ? t("quick.exitFullView") : t("quick.maximizePanel")
							}
							aria-label={
								isMaximized ? t("quick.exitFullView") : t("quick.maximizePanel")
							}
							aria-pressed={isMaximized}
							className={`size-7 p-0 rounded-full ${
								isMaximized ? "bg-action text-action-text hover:opacity-90" : ""
							}`}
						/>
					</div>
				)}
			</div>

			{/* --- Note 画面 --- */}
			{activeSection === "note" && (
				<div
					className={`flex flex-col min-h-0 ${isMaximized ? "flex-1" : "pb-2.5"}`}
				>
					{/* テキスト操作バー */}
					<div className="shrink-0 border-b border-base-border/30 px-3 py-2 flex items-center justify-between gap-2">
						<div className="flex items-center gap-1">
							<Button
								disabled={!noteText}
								icon={<Eraser className="size-4" aria-hidden="true" />}
								size="sm"
								variant="ghost"
								onClick={() => handleNoteTextChange("")}
								title={t("quick.clear")}
								className="size-7 p-0 rounded-full"
							/>
							<Button
								disabled={!noteText}
								icon={
									noteCopied ? (
										<Check
											className="size-4 text-note-info"
											aria-hidden="true"
										/>
									) : (
										<Copy className="size-4" aria-hidden="true" />
									)
								}
								size="sm"
								variant="ghost"
								onClick={handleCopyNote}
								title={t("quick.copy")}
								className="size-7 p-0 rounded-full"
							/>
						</div>

						<div className="flex items-center gap-1.5">
							<Button
								disabled={!noteText.trim() || submitting || isNoteOverLimit}
								icon={
									submitting ? (
										<Loader2
											className="w-3.5 h-3.5 animate-spin"
											aria-hidden="true"
										/>
									) : (
										<Send className="w-3.5 h-3.5" aria-hidden="true" />
									)
								}
								onClick={handleSaveAsNote}
								size="xs"
								variant="outline"
								title={
									isNoteOverLimit
										? t("quick.exceedsNoteLimit", {
												max: maxNoteLength.toLocaleString(),
											})
										: t("quick.saveToInbox")
								}
								className="text-muted-foreground hover:text-action"
							>
								{t("quick.noteBtn")}
							</Button>
							<Button
								disabled={!noteText.trim() || submitting || isDiaryOverLimit}
								icon={
									submitting ? (
										<Loader2
											className="w-3.5 h-3.5 animate-spin"
											aria-hidden="true"
										/>
									) : (
										<Send className="w-3.5 h-3.5" aria-hidden="true" />
									)
								}
								onClick={handleSaveToDiary}
								size="xs"
								variant="outline"
								title={
									isDiaryOverLimit
										? t("quick.exceedsDiaryLimit", {
												max: maxDiaryLength.toLocaleString(),
											})
										: t("quick.appendToDiary")
								}
								className="text-muted-foreground hover:text-action"
							>
								{t("quick.diaryBtn")}
							</Button>
						</div>
					</div>

					{/* エディタ / プレビュー領域 */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: focus delegation to inner textarea */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: focus delegation to inner textarea */}
					<div
						ref={noteScrollContainerRef}
						onClick={() => {
							if (noteViewMode === "edit") {
								noteTextareaRef.current?.focus();
							}
						}}
						className={
							isMaximized
								? "w-full min-w-0 px-3 pt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] overscroll-contain cursor-text"
								: "w-full min-w-0 px-3 pt-2 max-h-[30vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-auto cursor-text"
						}
					>
						<div
							className={
								isSliding
									? "transition-all duration-300 ease-out translate-x-full opacity-0 pointer-events-none"
									: "w-full min-w-0 max-w-full"
							}
						>
							{noteViewMode === "preview" ? (
								<div className="p-1 min-h-[4rem] min-w-0 max-w-full overflow-x-hidden cursor-auto">
									{noteText.trim() ? (
										<MarkdownRenderer content={noteText} />
									) : (
										<span className="text-xs text-muted-foreground italic">
											{t("quick.nothingToPreview")}
										</span>
									)}
								</div>
							) : (
								<TextareaAutosize
									ref={noteTextareaRef}
									onChange={(e) => handleNoteTextChange(e.target.value)}
									onBlur={flushNoteStorage}
									onScroll={(e) => {
										if (e.currentTarget.scrollTop !== 0) {
											e.currentTarget.scrollTop = 0;
										}
									}}
									value={noteText}
									placeholder={t("quick.placeholderNote")}
									className="w-full resize-none overflow-hidden border-none p-0 pb-2 text-sm bg-base-bg text-action focus:outline-none focus:ring-0 placeholder:text-muted-foreground font-['Hack'] font-mono leading-[1.6]"
									minRows={isMaximized ? 15 : 2}
									onKeyDown={(e) => {
										if (e.nativeEvent.isComposing) return;
										if (
											e.key === "Enter" &&
											!e.ctrlKey &&
											!e.metaKey &&
											!e.altKey &&
											!e.shiftKey
										) {
											const textarea = e.currentTarget;
											const isNearEnd =
												textarea.selectionStart >= textarea.value.length - 1;
											if (isNearEnd) {
												requestAnimationFrame(() => {
													if (noteScrollContainerRef.current) {
														noteScrollContainerRef.current.scrollTop =
															noteScrollContainerRef.current.scrollHeight;
													}
												});
											}
										}
										onNoteKeyDown(e);
									}}
									onPaste={(e) => {
										onNotePaste(e);
										const target = e.currentTarget;
										setTimeout(() => {
											target.scrollTop = 0;
											target.dispatchEvent(
												new Event("input", { bubbles: true }),
											);
										}, 0);
									}}
								/>
							)}
						</div>
					</div>
				</div>
			)}

			{/* --- Command 専用ターミナル画面（インセット型ダークコンソール） --- */}
			{activeSection === "command" && (
				<div
					className={`mx-2.5 mb-2.5 rounded-xl bg-neutral-900 text-neutral-100 flex flex-col min-h-0 ${
						isMaximized ? "flex-1 mt-2.5" : "mt-2"
					}`}
				>
					<div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between shrink-0">
						<div className="flex items-center gap-1">
							<Button
								disabled={!codeText}
								icon={<Eraser className="size-4" aria-hidden="true" />}
								size="sm"
								variant="ghost"
								onClick={() => handleCodeTextChange("")}
								title={t("quick.clearCommand")}
								className="size-7 p-0 rounded-full text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
							/>
							<Button
								disabled={!codeText}
								icon={
									codeCopied ? (
										<Check
											className="size-4 text-note-info"
											aria-hidden="true"
										/>
									) : (
										<Copy className="size-4" aria-hidden="true" />
									)
								}
								size="sm"
								variant="ghost"
								onClick={handleCopyCode}
								title={t("quick.copyCode")}
								className="size-7 p-0 rounded-full text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
							/>
						</div>
						<div className="text-[10px] font-['Hack'] font-mono text-neutral-400 uppercase tracking-wider px-1">
							COMMAND / CODE
						</div>
					</div>

					<div
						className={
							isMaximized
								? "px-3 py-2 flex-1 min-h-0 overflow-y-auto overscroll-contain"
								: "px-3 py-2 max-h-[30vh] overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-auto"
						}
					>
						<TextareaAutosize
							onChange={(e) => handleCodeTextChange(e.target.value)}
							onBlur={flushCodeStorage}
							value={codeText}
							placeholder="$ docker run -it --rm ..."
							className={`w-full resize-none overflow-hidden border-none p-0 text-xs bg-neutral-900 text-neutral-100 focus:outline-none focus:ring-0 placeholder:text-neutral-500 font-['Hack'] font-mono leading-[1.6] ${
								isMaximized ? "min-h-full" : ""
							}`}
							minRows={isMaximized ? 10 : 3}
							spellCheck={false}
							onKeyDown={onCommandKeyDown}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
