"use client";

import type { Template } from "@sitecue/shared";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";
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
import { useCreateTemplate } from "@/hooks/useTemplatesQuery";

interface SaveAsTemplateDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	initialTitle: string;
	initialContent: string;
	onSuccess: (template: Template) => void;
}

export function SaveAsTemplateDialog({
	isOpen,
	onOpenChange,
	initialTitle,
	initialContent,
	onSuccess,
}: SaveAsTemplateDialogProps) {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [boilerplate, setBoilerplate] = useState("");
	const [weavePrompt, setWeavePrompt] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const createTemplateMutation = useCreateTemplate();

	useEffect(() => {
		if (isOpen) {
			setName(initialTitle ? `${initialTitle} Template` : "My Custom Template");
			setBoilerplate(initialContent);
			setWeavePrompt("");
		}
	}, [isOpen, initialTitle, initialContent]);

	const handleSave = async () => {
		if (!name.trim()) return;
		setIsSaving(true);
		try {
			const payload = {
				name: name.trim(),
				boilerplate: boilerplate.trim() || null,
				weave_prompt: weavePrompt.trim() || null,
				max_length: null,
			};

			const data = await createTemplateMutation.mutateAsync(payload);
			onSuccess(data);
		} catch (error) {
			console.error(error);
			alert(t("toast.saveTemplateFailed"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl flex flex-col max-h-[85vh] overflow-hidden p-0">
				<DialogHeader className="p-6 border-b border-base-border">
					<DialogTitle>{t("studio.saveAsTemplate")}</DialogTitle>
					<DialogDescription>
						{t("studio.saveAsTemplateDialogDesc")}
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto p-6 space-y-4">
					<div className="space-y-2">
						<Label htmlFor="template-name">{t("studio.templateName")}</Label>
						<Input
							id="template-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t("studio.templateNamePlaceholder")}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="boilerplate">{t("studio.boilerplateLabel")}</Label>
						<TextareaAutosize
							id="boilerplate"
							minRows={6}
							value={boilerplate}
							onChange={(e) => setBoilerplate(e.target.value)}
							className="w-full rounded-lg border border-base-border bg-transparent p-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-base-border"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="weave-prompt">{t("studio.weavePromptLabel")}</Label>
						<TextareaAutosize
							id="weave-prompt"
							minRows={3}
							value={weavePrompt}
							onChange={(e) => setWeavePrompt(e.target.value)}
							className="w-full rounded-lg border border-base-border bg-base-surface p-3 text-base md:text-sm focus:outline-none font-mono md:text-xs"
							placeholder={t("studio.weavePromptPlaceholder")}
						/>
					</div>
				</div>

				<DialogFooter className="p-4 border-t border-base-border bg-base-surface/50 m-0">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="button"
						variant="default"
						onClick={handleSave}
						disabled={isSaving || !name.trim()}
					>
						{isSaving ? t("common.saving") : t("studio.saveTemplate")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
