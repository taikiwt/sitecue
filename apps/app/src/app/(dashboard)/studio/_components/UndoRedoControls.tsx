"use client";

import { Redo2, Undo2 } from "lucide-react";
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
	return (
		<div className="flex items-center gap-1 border-x border-neutral-100 px-4">
			<Button
				variant="ghost"
				size="icon"
				onClick={onUndo}
				disabled={!canUndo}
				title="Undo (Ctrl+Z)"
				className="h-8 w-8"
			>
				<Undo2 size={18} aria-hidden="true" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={onRedo}
				disabled={!canRedo}
				title="Redo (Ctrl+Y)"
				className="h-8 w-8"
			>
				<Redo2 size={18} aria-hidden="true" />
			</Button>
		</div>
	);
}
