import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import type { Extension } from "@codemirror/state";
// import { EditorView } from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { Strikethrough } from "@lezer/markdown";
import { allMarkersExtension } from "./sitecueTheme";

/**
 * Common extensions for CodeMirror Markdown editor.
 */
export const editorExtensions: Extension[] = [
	markdown({
		base: markdownLanguage,
		codeLanguages: languages,
		addKeymap: true,
		extensions: [Strikethrough, allMarkersExtension],
	}),
	EditorView.lineWrapping,
];

export interface EditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	isDirty?: boolean; // 未保存状態の判定用
}
