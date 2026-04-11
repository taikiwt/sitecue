"use client";

import { AlertTriangle, Info, Lightbulb, Send } from "lucide-react";
import { useState } from "react";
import { NotesEditor } from "@/components/editor/NotesEditor";

type NoteType = "info" | "alert" | "idea";

interface NoteEditorProps {
	onSubmit: (content: string, type: NoteType) => Promise<void>;
}

export default function NoteEditor({ onSubmit }: NoteEditorProps) {
	const [content, setContent] = useState("");
	const [noteType, setNoteType] = useState<NoteType>("info");
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!content.trim() || isSaving) return;

		setIsSaving(true);
		try {
			await onSubmit(content.trim(), noteType);
			setContent("");
		} catch (error) {
			console.error("Failed to save note:", error);
			alert("Failed to save the note.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 rounded-lg bg-neutral-100 p-1">
					<button
						type="button"
						onClick={() => setNoteType("info")}
						className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
							noteType === "info"
								? "bg-white text-blue-600 shadow-sm"
								: "text-neutral-400 hover:text-neutral-600"
						}`}
					>
						<Info className="h-3 w-3" />
						Info
					</button>
					<button
						type="button"
						onClick={() => setNoteType("alert")}
						className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
							noteType === "alert"
								? "bg-white text-red-600 shadow-sm"
								: "text-neutral-400 hover:text-neutral-600"
						}`}
					>
						<AlertTriangle className="h-3 w-3" />
						Alert
					</button>
					<button
						type="button"
						onClick={() => setNoteType("idea")}
						className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
							noteType === "idea"
								? "bg-white text-amber-600 shadow-sm"
								: "text-neutral-400 hover:text-neutral-600"
						}`}
					>
						<Lightbulb className="h-3 w-3" />
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
					disabled={!content.trim() || isSaving}
					className="absolute right-2 bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 cursor-pointer"
				>
					<Send className="h-4 w-4" />
				</button>
			</div>
			<p className="text-[10px] text-neutral-400">
				{isSaving ? "Saving..." : "Markdown supported"}
			</p>
		</div>
	);
}
