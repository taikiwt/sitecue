import { AlertTriangle, Info, Lightbulb, Send } from "lucide-react";
import { useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useAutoIndent } from "../hooks/useAutoIndent";
import type { NoteScope, NoteType } from "../hooks/useNotes";

interface NoteInputProps {
	userPlan: "free" | "pro";
	totalNoteCount: number;
	maxFreeNotes: number;
	onAddNote: (
		content: string,
		scope: NoteScope,
		type: NoteType,
	) => Promise<boolean>;
}

export default function NoteInput({
	userPlan,
	totalNoteCount,
	maxFreeNotes,
	onAddNote,
}: NoteInputProps) {
	const [selectedScope, setSelectedScope] = useState<NoteScope>("exact");
	const [selectedType, setSelectedType] = useState<NoteType>("info");
	const [newNote, setNewNote] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const handleAutoIndent = useAutoIndent();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const content = newNote.trim();
		if (!content) return;

		// 即座に入力欄をクリアしてUXを向上（オプティミスティック更新）
		setNewNote("");

		const success = await onAddNote(content, selectedScope, selectedType);
		if (!success) {
			// 失敗時は入力をロールバック
			setNewNote(content);
		}
	};

	return (
		<div className="p-4 bg-base-surface border-t border-base-border space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4 text-xs">
					<label className="flex items-center gap-1.5 cursor-pointer text-action hover:text-action-hover">
						<input
							type="radio"
							name="scope"
							checked={selectedScope === "exact"}
							onChange={() => setSelectedScope("exact")}
							className="accent-action focus:ring-action"
						/>
						<span>Page</span>
					</label>
					<label className="flex items-center gap-1.5 cursor-pointer text-neutral-800 hover:text-black">
						<input
							type="radio"
							name="scope"
							checked={selectedScope === "domain"}
							onChange={() => setSelectedScope("domain")}
							className="accent-action focus:ring-action"
						/>
						<span>Domain</span>
					</label>
					<label className="flex items-center gap-1.5 cursor-pointer text-neutral-800 hover:text-black">
						<input
							type="radio"
							name="scope"
							checked={selectedScope === "inbox"}
							onChange={() => setSelectedScope("inbox")}
							className="accent-action focus:ring-action"
						/>
						<span>Inbox</span>
					</label>
				</div>

				<div className="flex items-center gap-3">
					{userPlan === "free" && (
						<span className="text-[10px] text-gray-400 font-medium">
							{totalNoteCount} / {maxFreeNotes}
						</span>
					)}

					<div className="flex bg-base-surface p-0.5 rounded-md">
						<button
							type="button"
							onClick={() => setSelectedType("info")}
							className={`cursor-pointer p-1 rounded ${selectedType === "info" ? "bg-action shadow-sm text-action-text" : "text-gray-400 hover:text-action"}`}
							title="Info"
						>
							<Info className="w-4 h-4" strokeWidth={2} />
						</button>
						<button
							type="button"
							onClick={() => setSelectedType("alert")}
							className={`cursor-pointer p-1 rounded ${selectedType === "alert" ? "bg-action shadow-sm text-action-text" : "text-gray-400 hover:text-action"}`}
							title="Alert"
						>
							<AlertTriangle className="w-4 h-4" strokeWidth={2} />
						</button>
						<button
							type="button"
							onClick={() => setSelectedType("idea")}
							className={`cursor-pointer p-1 rounded ${selectedType === "idea" ? "bg-action shadow-sm text-action-text" : "text-gray-400 hover:text-action"}`}
							title="Idea"
						>
							<Lightbulb className="w-4 h-4" strokeWidth={2} />
						</button>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="flex gap-2 items-center">
				{userPlan === "free" && totalNoteCount >= maxFreeNotes ? (
					<div className="w-full bg-note-idea/10 border border-note-idea/20 rounded-lg p-3 text-sm text-note-idea flex items-start gap-3">
						<AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
						<div>
							<div className="font-bold mb-1">FREE Plan Limit Reached</div>
							<p className="text-xs opacity-90">
								You have reached the {maxFreeNotes} note limit. Please delete
								some existing notes to create new ones.
							</p>
						</div>
					</div>
				) : (
					<>
						<TextareaAutosize
							ref={textareaRef}
							value={newNote}
							onChange={(e) => setNewNote(e.target.value)}
							placeholder={`Add a cue to ${selectedScope === "inbox" ? "Inbox" : selectedScope === "domain" ? "this domain" : "this page"}...`}
							className="flex-1 resize-none border-4 border-action rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-action/5 transition-all max-h-50"
							minRows={1}
							onKeyDown={(e) => {
								if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
									e.preventDefault();
									handleSubmit(e);
								} else {
									handleAutoIndent(e);
								}
							}}
						/>
						<button
							disabled={!newNote.trim()}
							type="submit"
							className="cursor-pointer bg-action text-action-text p-2 rounded-md hover:bg-action-hover disabled:cursor-not-allowed transition-colors"
							title="Add Note"
						>
							<Send className="w-4 h-4" />
						</button>
					</>
				)}
			</form>
		</div>
	);
}
