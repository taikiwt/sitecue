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

// basicSetup のオブジェクトをコンポーネントの外に出し、参照を完全に固定する
const basicSetupConfig = {
	lineNumbers: false,
	foldGutter: false,
};

export const NotesEditor = ({
	value,
	onChange,
	placeholder,
	isDirty = false,
	onSave,
}: NotesEditorProps) => {
	useUnsavedChanges(isDirty);

	const onSaveRef = useRef(onSave);
	useEffect(() => {
		onSaveRef.current = onSave;
	}, [onSave]);

	// extensions 配列を useMemo で 1回だけ生成して固定する（無限ループを完全防止）
	// ※絶対にここに文字数制限等の動的な拡張を追加しないこと
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
						return true;
					},
				},
			]),
		],
		[], // 依存配列を空にすることで、再描画時にも絶対に再生成させない
	);

	return (
		<div className="w-full rounded-xl bg-base-surface/50 focus-within:bg-base-bg focus-within:shadow-sm border border-transparent focus-within:border-base-border transition-all duration-200 p-2 md:p-6">
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={extensions}
				placeholder={placeholder}
				basicSetup={basicSetupConfig}
				className="text-base"
			/>
		</div>
	);
};
