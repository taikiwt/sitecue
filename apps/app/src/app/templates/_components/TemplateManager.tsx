"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { createClient } from "@/utils/supabase/client";
import type { Template } from "../../../../../../types/app";

export function TemplateManager({
	initialTemplates,
	selectedId,
}: {
	initialTemplates: Template[];
	selectedId: string | null;
}) {
	const router = useRouter();
	const supabase = createClient();
	const [templates, setTemplates] = useState<Template[]>(initialTemplates);

	// Form State
	const activeTemplate = templates.find((t) => t.id === selectedId);
	const isNew = selectedId === "new";

	const [name, setName] = useState("");
	const [maxLength, setMaxLength] = useState<string>("");
	const [boilerplate, setBoilerplate] = useState("");
	const [weavePrompt, setWeavePrompt] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	// Sync form when selection changes
	useEffect(() => {
		if (activeTemplate) {
			setName(activeTemplate.name);
			setMaxLength(
				activeTemplate.max_length ? activeTemplate.max_length.toString() : "",
			);
			setBoilerplate(activeTemplate.boilerplate || "");
			setWeavePrompt(activeTemplate.weave_prompt || "");
		} else if (isNew) {
			setName("");
			setMaxLength("");
			setBoilerplate("");
			setWeavePrompt("");
		}
	}, [activeTemplate, isNew]);

	const isDirty = activeTemplate
		? name !== activeTemplate.name ||
			maxLength !== (activeTemplate.max_length?.toString() || "") ||
			boilerplate !== (activeTemplate.boilerplate || "") ||
			weavePrompt !== (activeTemplate.weave_prompt || "")
		: isNew
			? name !== "" || boilerplate !== "" || weavePrompt !== ""
			: false;

	useUnsavedChanges(isDirty);

	const handleSave = async () => {
		if (!name.trim()) return;
		setIsSaving(true);

		const payload = {
			name: name.trim(),
			max_length: maxLength ? Number.parseInt(maxLength, 10) : null,
			boilerplate: boilerplate.trim() || null,
			weave_prompt: weavePrompt.trim() || null,
		};

		try {
			if (isNew) {
				// Add Optimistic
				const tempId = crypto.randomUUID();
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (!user) throw new Error("User not found");

				setTemplates((prev) => [
					...prev,
					{
						id: tempId,
						...payload,
						user_id: user.id,
						icon: null,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					} as Template,
				]);

				const { data, error } = await supabase
					.from("sitecue_templates")
					.insert({ ...payload, user_id: user.id })
					.select()
					.single();
				if (error) throw error;

				setTemplates((prev) =>
					prev.map((t) => (t.id === tempId ? (data as Template) : t)),
				);
				router.push(`/templates?id=${data.id}`);
			} else if (activeTemplate) {
				// Update Optimistic
				setTemplates((prev) =>
					prev.map((t) =>
						t.id === activeTemplate.id ? { ...t, ...payload } : t,
					),
				);
				const { error } = await supabase
					.from("sitecue_templates")
					.update(payload)
					.eq("id", activeTemplate.id);
				if (error) throw error;
			}
			router.refresh();
		} catch (err) {
			console.error("Failed to save template:", err);
			alert("Failed to save template.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!window.confirm("Are you sure you want to delete this template?"))
			return;

		// Optimistic delete
		setTemplates((prev) => prev.filter((t) => t.id !== id));
		if (selectedId === id) router.push("/templates");

		const { error } = await supabase
			.from("sitecue_templates")
			.delete()
			.eq("id", id);
		if (error) {
			console.error("Delete failed", error);
			router.refresh(); // Revert on failure
		}
	};

	return (
		<div className="flex h-screen overflow-hidden bg-base-bg text-action">
			{/* Left Pane: List */}
			<div className="w-80 flex flex-col border-r border-base-border bg-base-surface">
				<div className="p-4 border-b border-base-border flex items-center gap-2">
					<Link
						href="/"
						className="inline-flex items-center justify-center h-7 w-7 rounded-[min(var(--radius-md),12px)] hover:bg-muted hover:text-foreground transition-colors"
						aria-label="Go back to Launchpad"
					>
						<ArrowLeft className="w-4 h-4 text-action" aria-hidden="true" />
					</Link>
					<h1 className="font-bold text-lg">Templates</h1>
				</div>
				<div className="p-4">
					<Link
						href="/templates?id=new"
						className="flex items-center justify-center gap-2 w-full bg-action text-action-text py-2 rounded-lg text-sm font-bold hover:bg-action-hover transition-colors"
					>
						<Plus className="w-4 h-4" aria-hidden="true" /> New Template
					</Link>
				</div>
				<div className="flex-1 overflow-y-auto px-2 space-y-1">
					{templates.map((t) => (
						<div
							key={t.id}
							className={`flex items-center justify-between px-3 py-2 rounded-lg group ${selectedId === t.id ? "bg-base-bg shadow-sm" : "hover:bg-base-bg/50"}`}
						>
							<Link
								href={`/templates?id=${t.id}`}
								className="flex-1 truncate text-sm font-medium"
							>
								{t.name}
							</Link>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => handleDelete(t.id)}
								className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-note-alert transition-opacity"
								type="button"
							>
								<Trash2 className="w-3 h-3" aria-hidden="true" />
							</Button>
						</div>
					))}
				</div>
			</div>

			{/* Right Pane: Form */}
			<div className="flex-1 flex flex-col overflow-y-auto p-8">
				{activeTemplate || isNew ? (
					<div className="max-w-2xl w-full mx-auto space-y-6">
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-2xl font-bold">
								{isNew ? "Create Template" : "Edit Template"}
							</h2>
							<Button
								onClick={handleSave}
								disabled={isSaving || !name.trim()}
								type="button"
							>
								{isSaving ? "Saving..." : "Save Template"}
							</Button>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="template-name">Template Name</Label>
								<Input
									id="template-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. X Thread, Daily Report"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="max-length">Max Length (Optional)</Label>
								<Input
									id="max-length"
									type="number"
									value={maxLength}
									onChange={(e) => setMaxLength(e.target.value)}
									placeholder="e.g. 140"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="boilerplate">
									Boilerplate / Initial Text (Optional)
								</Label>
								<TextareaAutosize
									id="boilerplate"
									minRows={4}
									value={boilerplate}
									onChange={(e) => setBoilerplate(e.target.value)}
									className="w-full rounded-lg border border-base-border bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-base-border"
									placeholder="# Target Audience&#10;&#10;# Key Message"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="weave-prompt">
									Weave Prompt (System Prompt for AI) (Optional)
								</Label>
								<TextareaAutosize
									id="weave-prompt"
									minRows={3}
									value={weavePrompt}
									onChange={(e) => setWeavePrompt(e.target.value)}
									className="w-full rounded-lg border border-base-border bg-base-surface p-3 text-sm focus:outline-none font-mono text-xs"
									placeholder="Provide context for the AI when generating from this template."
								/>
							</div>
						</div>
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center text-gray-400">
						Select a template to edit or create a new one.
					</div>
				)}
			</div>
		</div>
	);
}
