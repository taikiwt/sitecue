"use client";

import { Redo2, Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface UndoRedoControlsProps {
	canUndo: boolean;
	canRedo: boolean;
	onUndo: () => void;
	onRedo: () => void;
}

export default function UndoRedoControls({
	canUndo,
	canRedo,
	onUndo,
	onRedo,
}: UndoRedoControlsProps) {
	const { t } = useTranslation();
	return (
		<div className="flex items-center gap-1 border-x border-neutral-100 px-4">
			<Button
				variant="ghost"
				size="icon"
				onClick={onUndo}
				disabled={!canUndo}
				title={t("studio.undo")}
				className="h-8 w-8"
			>
				<Undo2 size={18} aria-hidden="true" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={onRedo}
				disabled={!canRedo}
				title={t("studio.redo")}
				className="h-8 w-8"
			>
				<Redo2 size={18} aria-hidden="true" />
			</Button>
		</div>
	);
}
