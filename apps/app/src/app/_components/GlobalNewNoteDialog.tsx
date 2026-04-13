"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import type { Note, NoteScope } from "../../../../../types/app";

export default function GlobalNewNoteDialog() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isOpen = searchParams.get("globalNew") === "note";

	const [content, setContent] = useState("");
	const [urlPattern, setUrlPattern] = useState("");
	const [scope, setScope] = useState<NoteScope>("inbox");
	const [isSaving, setIsSaving] = useState(false);
	const [noteType, setNoteType] = useState<Note["note_type"]>("info");

	// Load initial state from URL parameters
	useEffect(() => {
		if (isOpen) {
			const exact = searchParams.get("exact");
			const domain = searchParams.get("domain");

			if (exact) {
				setUrlPattern(exact);
				setScope("exact");
			} else if (domain && domain !== "inbox") {
				setUrlPattern(domain);
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

	// Force inbox scope if URL is empty
	useEffect(() => {
		if (urlPattern === "" && scope !== "inbox") {
			setScope("inbox");
		}
	}, [urlPattern, scope]);

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
		if (!content.trim()) return;

		setIsSaving(true);
		try {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) throw new Error("User not authenticated");

			let finalUrl = urlPattern;
			if (scope === "inbox") {
				finalUrl = "";
			}

			const { data, error } = await supabase
				.from("sitecue_notes")
				.insert({
					content: content.trim(),
					scope: scope,
					url_pattern: finalUrl,
					note_type: noteType,
					user_id: user.id,
					is_expanded: false,
					is_favorite: false,
					is_pinned: false,
					is_resolved: false,
					sort_order: 0,
				})
				.select()
				.single();

			if (error) throw error;

			const params = new URLSearchParams(searchParams.toString());
			params.delete("globalNew");
			params.set("noteId", data.id);

			if (scope === "domain" && urlPattern) {
				params.set("domain", urlPattern);
				params.delete("exact");
			} else if (scope === "exact" && urlPattern) {
				params.set("exact", urlPattern);
				params.delete("domain");
			} else {
				// inbox or empty urlPattern
				params.set("domain", "inbox");
				params.delete("exact");
			}

			router.push(`/notes?${params.toString()}`);
			router.refresh();
		} catch (err) {
			console.error("Failed to save note:", err);
			alert("Failed to save the note.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden flex flex-col">
				<DialogHeader className="p-6 border-b border-neutral-100">
					<DialogTitle className="text-xl font-bold">New Note</DialogTitle>
					<DialogDescription className="text-neutral-500">
						Capture a quick thought from anywhere.
					</DialogDescription>
				</DialogHeader>

				<div className="p-6 space-y-6 flex-1 overflow-y-auto">
					<div className="grid sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label
								htmlFor="global-url"
								className="text-[10px] font-bold uppercase tracking-wider text-neutral-400"
							>
								Source URL (Optional)
							</Label>
							<Input
								id="global-url"
								placeholder="example.com/page"
								value={urlPattern}
								onChange={(e) => setUrlPattern(e.target.value)}
								disabled={isSaving}
								className="h-9"
							/>
						</div>
						<div className="space-y-2">
							<Label
								htmlFor="global-scope"
								className="text-[10px] font-bold uppercase tracking-wider text-neutral-400"
							>
								Scope
							</Label>
							<Select
								value={scope}
								onValueChange={(val) => setScope(val as NoteScope)}
								disabled={isSaving}
							>
								<SelectTrigger id="global-scope" className="h-9 w-full">
									<SelectValue placeholder="Select scope" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="exact" disabled={!urlPattern}>
										Page
									</SelectItem>
									<SelectItem value="domain" disabled={!urlPattern}>
										Domain
									</SelectItem>
									<SelectItem value="inbox">Inbox</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid items-center gap-2 mb-4">
						<Label className="text-xs font-bold uppercase">Note Type</Label>
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
						<Label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
							Content
						</Label>
						<div className="min-h-[250px] border rounded-lg bg-neutral-50/30 overflow-hidden">
							<NotesEditor
								value={content}
								onChange={setContent}
								placeholder="What's on your mind?"
								isDirty={content.length > 0}
							/>
						</div>
					</div>
				</div>

				<DialogFooter className="p-4 bg-neutral-50/50 border-t border-neutral-100">
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
						disabled={isSaving || !content.trim()}
						className="min-w-[100px]"
					>
						{isSaving ? "Saving..." : "Save Note"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
