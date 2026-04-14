"use client";

import CodeMirror from "@uiw/react-codemirror";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { type EditorProps, editorExtensions } from "./EditorBase";
import { sitecueTheme } from "./sitecueTheme";

export const StudioEditor = ({
	value,
	onChange,
	placeholder,
	isDirty = false,
}: EditorProps) => {
	useUnsavedChanges(isDirty);

	return (
		<div className="w-full rounded-xl bg-base-surface/50 focus-within:bg-base-bg focus-within:shadow-sm border border-transparent focus-within:border-base-border transition-all duration-200 p-6">
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
