"use client";

import { AlertTriangle, Info, Lightbulb, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { NotesEditor } from "@/components/editor/NotesEditor";
import { APP_LIMITS } from "@/constants/limits";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

type NoteType = "info" | "alert" | "idea";

interface NoteEditorProps {
	onSubmit: (content: string, type: NoteType) => Promise<void>;
}

export default function NoteEditor({ onSubmit }: NoteEditorProps) {
	const openPaywall = useUserStore((state) => state.openPaywall);
	const [content, setContent] = useState("");
	const [noteType, setNoteType] = useState<NoteType>("info");
	const [isSaving, setIsSaving] = useState(false);

	const charCount = content.length;
	const isNearLimit = charCount >= APP_LIMITS.MAX_NOTE_LENGTH * 0.9;
	const isOverLimit = charCount > APP_LIMITS.MAX_NOTE_LENGTH;

	const handleSave = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!content.trim() || isSaving || isOverLimit) return;

		setIsSaving(true);
		try {
			await onSubmit(content.trim(), noteType);
			setContent("");
		} catch (err: unknown) {
			console.error("Failed to save note:", err);
			const errorMessage =
				err instanceof Error
					? err.message.toLowerCase()
					: typeof err === "object" && err !== null && "message" in err
						? String((err as { message: unknown }).message).toLowerCase()
						: String(err).toLowerCase();

			if (errorMessage.includes("limit reached")) {
				openPaywall("notes");
			} else {
				toast.error("Failed to save the note.");
			}
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-base-border bg-base-surface p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 rounded-lg bg-base-bg p-1">
					<button
						type="button"
						onClick={() => setNoteType("info")}
						className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
							noteType === "info"
								? "bg-base-surface text-note-info shadow-sm"
								: "text-gray-400 hover:text-action"
						}`}
					>
						<Info className="h-3 w-3" aria-hidden="true" />
						Info
					</button>
					<button
						type="button"
						onClick={() => setNoteType("alert")}
						className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
							noteType === "alert"
								? "bg-base-surface text-note-alert shadow-sm"
								: "text-gray-400 hover:text-action"
						}`}
					>
						<AlertTriangle className="h-3 w-3" aria-hidden="true" />
						Alert
					</button>
					<button
						type="button"
						onClick={() => setNoteType("idea")}
						className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
							noteType === "idea"
								? "bg-base-surface text-note-idea shadow-sm"
								: "text-gray-400 hover:text-action"
						}`}
					>
						<Lightbulb className="h-3 w-3" aria-hidden="true" />
						Idea
					</button>
				</div>
			</div>

			<div className="relative flex gap-2">
				<NotesEditor
					value={content}
					onChange={(val) => setContent(val)}
					placeholder="Write down your thoughts..."
					isDirty={content.length > 0}
				/>
				<button
					type="button"
					onClick={() => handleSave()}
					disabled={!content.trim() || isSaving || isOverLimit}
					aria-label="Save note"
					className="absolute right-2 bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-action text-action-text shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer"
				>
					<Send className="h-4 w-4" aria-hidden="true" />
				</button>
			</div>
			<div className="flex justify-between items-center">
				<p className="text-[10px] text-gray-400">
					{isSaving ? "Saving..." : "Markdown supported"}
				</p>
				{isNearLimit && (
					<span
						className={cn(
							"text-[10px] font-bold transition-opacity duration-300",
							isOverLimit ? "text-note-alert" : "text-note-idea",
						)}
					>
						{charCount.toLocaleString()} /{" "}
						{APP_LIMITS.MAX_NOTE_LENGTH.toLocaleString()}
					</span>
				)}
			</div>
		</div>
	);
}
