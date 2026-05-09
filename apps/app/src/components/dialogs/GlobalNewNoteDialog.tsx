"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { NotesEditor } from "@/components/editor/NotesEditor";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LIMITS } from "@/constants/limits";
import { useCreateNote } from "@/hooks/useNotesQuery";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/useEditorStore";
import { useUserStore } from "@/store/useUserStore";
import { normalizeUrlForGrouping } from "@/utils/url";
import type { Note, NoteScope } from "../../../../../types/app";

export function GlobalNewNoteDialog() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isOpen = searchParams.get("globalNew") === "note";

	const [content, setContent] = useState("");
	const [urlPattern, setUrlPattern] = useState("");
	const [scope, setScope] = useState<NoteScope>("inbox");
	const [isSaving, setIsSaving] = useState(false);
	const [noteType, setNoteType] = useState<Note["note_type"]>("info");
	const createNoteMutation = useCreateNote();
	const openPaywall = useUserStore((state) => state.openPaywall);
	const setPendingContent = useEditorStore((state) => state.setPendingContent);

	const charCount = content.length;
	const isNearLimit = charCount >= APP_LIMITS.MAX_NOTE_LENGTH * 0.9;
	const isOverLimit = charCount > APP_LIMITS.MAX_NOTE_LENGTH;

	// Load initial state from URL parameters
	useEffect(() => {
		if (isOpen) {
			let currentExact = searchParams.get("exact");
			let currentDomain = searchParams.get("domain");

			// "all" という不正なカテゴリ値を安全にサニタイズ
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
			setContent("");
		}
	}, [isOpen, searchParams]);

	// Reset state when modal opens to prevent flickering during close transition
	useEffect(() => {
		if (isOpen) {
			setNoteType("info");
		}
	}, [isOpen]);

	const isUrlRequired = scope === "exact" || scope === "domain";
	const isUrlInvalid = isUrlRequired && !urlPattern.trim();
	const isSaveDisabled =
		isSaving || !content.trim() || isOverLimit || isUrlInvalid;

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			handleCancel();
		}
	};

	const handleCancel = () => {
		const params = new URLSearchParams(searchParams.toString());
		params.delete("globalNew");
		router.replace(`${window.location.pathname}?${params.toString()}`);
	};

	const handleSave = async () => {
		if (isSaveDisabled) return;

		setIsSaving(true);
		try {
			let finalUrl = urlPattern.trim();
			if (scope === "inbox") {
				finalUrl = "inbox";
			} else if (finalUrl) {
				const normalizedFullUrl = normalizeUrlForGrouping(finalUrl);
				if (scope === "domain") {
					// ドメインスコープの場合はドメイン名のみを抽出
					finalUrl = normalizedFullUrl.split("/")[0];
				} else if (scope === "exact") {
					// exactの場合は正規化されたフルURLをそのまま使用
					finalUrl = normalizedFullUrl;
				}
			}

			await createNoteMutation.mutateAsync({
				content: content.trim(),
				scope: scope,
				url_pattern: finalUrl,
				note_type: noteType,
			});

			toast.success("Note saved successfully.");
			handleCancel();
		} catch (err: unknown) {
			console.error("Failed to save note:", err);
			const errorMessage =
				err instanceof Error
					? err.message.toLowerCase()
					: typeof err === "object" && err !== null && "message" in err
						? String((err as { message: unknown }).message).toLowerCase()
						: String(err).toLowerCase();

			if (errorMessage.includes("limit reached")) {
				// モーダルの衝突を防ぐため、Paywallを開く前に現在のダイアログを閉じる
				handleCancel();
				openPaywall("notes");
			} else {
				toast.error("Failed to save the note.");
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handlePromoteToStudio = () => {
		setPendingContent(content);
		handleCancel();
		router.push("/studio/new");
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl bg-base-surface p-0 overflow-hidden flex flex-col max-h-[85vh]">
				<DialogHeader className="p-6 border-b border-base-border">
					<DialogTitle className="text-xl font-bold">New Note</DialogTitle>
					<DialogDescription className="text-gray-500">
						Capture a quick thought from anywhere.
					</DialogDescription>
				</DialogHeader>

				<div className="p-6 space-y-6 flex-1 overflow-y-auto">
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
										disabled={isSaving}
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
									placeholder="example.com/page"
									value={urlPattern}
									onChange={(e) => setUrlPattern(e.target.value)}
									disabled={isSaving}
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

				<DialogFooter className="m-0 p-4 bg-base-surface/50 border-t border-base-border flex justify-between w-full">
					<Button
						type="button"
						variant="outline"
						onClick={handlePromoteToStudio}
						disabled={isSaving}
						className="mr-auto"
					>
						Edit in Studio
					</Button>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={handleCancel}
							disabled={isSaving}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="default"
							onClick={handleSave}
							disabled={isSaveDisabled}
							className="min-w-[100px]"
						>
							{isSaving ? "Saving..." : "Save Note"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
