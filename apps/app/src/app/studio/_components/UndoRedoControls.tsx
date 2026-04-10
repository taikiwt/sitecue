"use client";

import { Redo2, Undo2 } from "lucide-react";

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
			<button
				type="button"
				onClick={onUndo}
				disabled={!canUndo}
				title="Undo (Ctrl+Z)"
				className={`rounded p-1.5 transition-colors ${
					canUndo
						? "text-neutral-600 hover:bg-neutral-100 cursor-pointer"
						: "text-neutral-300 cursor-not-allowed"
				}`}
			>
				<Undo2 size={18} aria-hidden="true" />
			</button>
			<button
				type="button"
				onClick={onRedo}
				disabled={!canRedo}
				title="Redo (Ctrl+Y)"
				className={`rounded p-1.5 transition-colors ${
					canRedo
						? "text-neutral-600 hover:bg-neutral-100 cursor-pointer"
						: "text-neutral-300 cursor-not-allowed"
				}`}
			>
				<Redo2 size={18} aria-hidden="true" />
			</button>
		</div>
	);
}
