"use client";

import CodeMirror from "@uiw/react-codemirror";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { type EditorProps, editorExtensions } from "./EditorBase";
import { sitecueTheme } from "./sitecueTheme";

export const NotesEditor = ({
	value,
	onChange,
	placeholder,
	isDirty = false,
}: EditorProps) => {
	useUnsavedChanges(isDirty);

	return (
		<div className="w-full rounded-xl bg-neutral-50/50 focus-within:bg-white focus-within:shadow-sm border border-transparent focus-within:border-neutral-200 transition-all duration-200 p-6">
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={[...editorExtensions, sitecueTheme]}
				placeholder={placeholder}
				basicSetup={{
					lineNumbers: false,
					foldGutter: false,
				}}
				className="text-base"
				theme="light"
			/>
		</div>
	);
};
