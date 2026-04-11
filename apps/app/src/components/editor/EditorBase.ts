import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";

/**
 * Common extensions for CodeMirror Markdown editor.
 */
export const editorExtensions = [
	markdown({
		base: markdownLanguage,
		codeLanguages: languages,
		addKeymap: true,
	}),
];

export interface EditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	isDirty?: boolean; // 未保存状態の判定用
}
