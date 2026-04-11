"use client";

import CodeMirror from "@uiw/react-codemirror";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { type EditorProps, editorExtensions } from "./EditorBase";

export const NotesEditor = ({
	value,
	onChange,
	placeholder,
	isDirty = false,
}: EditorProps) => {
	useUnsavedChanges(isDirty);

	return (
		<div className="w-full border rounded-md border-neutral-300 focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden bg-white">
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={editorExtensions}
				placeholder={placeholder}
				className="text-base"
				theme="light"
			/>
		</div>
	);
};
