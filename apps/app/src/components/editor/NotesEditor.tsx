"use client";

import { keymap } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef } from "react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { type EditorProps, editorExtensions } from "./EditorBase";
import { sitecueTheme } from "./sitecueTheme";

interface NotesEditorProps extends EditorProps {
	onSave?: () => void;
}

export const NotesEditor = ({
	value,
	onChange,
	placeholder,
	isDirty = false,
	onSave,
}: NotesEditorProps) => {
	useUnsavedChanges(isDirty);

	// 最新の onSave 関数を追跡するための ref を作成
	const onSaveRef = useRef(onSave);
	useEffect(() => {
		onSaveRef.current = onSave;
	}, [onSave]);

	// extensions 配列を useMemo で 1回だけ生成して固定する（無限ループを完全防止）
	const extensions = useMemo(
		() => [
			...editorExtensions,
			...(Array.isArray(sitecueTheme) ? sitecueTheme : [sitecueTheme]),
			keymap.of([
				{
					key: "Mod-Enter",
					run: () => {
						if (onSaveRef.current) {
							onSaveRef.current();
						}
						return true; // デフォルトの改行挙動をストップ
					},
				},
			]),
		],
		[],
	); // 依存配列を空にすることで、再描画時にも絶対に再生成させない

	return (
		<div className="w-full rounded-xl bg-base-surface/50 focus-within:bg-base-bg focus-within:shadow-sm border border-transparent focus-within:border-base-border transition-all duration-200 p-6">
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={extensions} // 固定した配列を渡す
				placeholder={placeholder}
				basicSetup={{
					lineNumbers: false,
					foldGutter: false,
				}}
				className="text-base"
				// theme="light"
			/>
		</div>
	);
};
