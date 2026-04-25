import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// 1. パレットの定義
const palettes = {
	github: {
		keyword: "#cf222e",
		string: "#0a3069",
		constant: "#0550ae",
		class: "#953800",
		comment: "#6e7781",
		link: "#0969da",
		heading: "#0550ae",
	},
	sitecue: {
		keyword: "#be185d", // sitecue独自の落ち着いた赤
		string: "#845309", // 落ち着いたオレンジ
		constant: "#059669", // 落ち着いた緑
		class: "#7c3aed", // 落ち着いた紫
		comment: "#a3a3a3",
		link: "var(--color-action)",
		heading: "var(--color-action)",
	},
	minimal: {
		keyword: "#171717",
		string: "#404040",
		constant: "#404040",
		class: "#171717",
		comment: "#a3a3a3",
		link: "#171717",
		heading: "#171717",
	},
};

// ★ ここを書き換えるだけで、すべての色が一括で変わります
const activePalette = palettes.github;

// 2. ViewTheme (箱のスタイル)
const sitecueViewTheme = EditorView.theme({
	"&": {
		color: "var(--foreground)",
		backgroundColor: "transparent",
	},
	".cm-content": {
		caretColor: "var(--foreground)",
		fontFamily: "var(--font-sans)",
	},
	".cm-scroller": {
		lineHeight: "1.75",
		fontFamily: "inherit",
	},
	"&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
		backgroundColor: "var(--color-accent)",
	},
	".cm-cursor": {
		borderLeft: "2px solid var(--foreground)",
	},
});

// 3. HighlightStyle (文字の色)
const sitecueHighlightStyle = HighlightStyle.define([
	{ tag: t.heading, color: activePalette.heading, fontWeight: "bold" },
	{ tag: t.strong, fontWeight: "bold" },
	{ tag: t.emphasis, fontStyle: "italic" },
	{ tag: t.link, color: activePalette.link, textDecoration: "underline" },
	{ tag: t.url, color: activePalette.comment },
	{
		tag: t.monospace,
		backgroundColor: "var(--color-base-surface)",
		color: "var(--foreground)",
		borderRadius: "6px",
		padding: "0.2em 0.4em",
	},
	{ tag: [t.keyword, t.modifier, t.operator], color: activePalette.keyword },
	{ tag: [t.string, t.regexp], color: activePalette.string },
	{
		tag: [t.number, t.bool, t.null, t.constant(t.variableName)],
		color: activePalette.constant,
	},
	{
		tag: [t.className, t.typeName, t.definition(t.typeName)],
		color: activePalette.class,
	},
	{ tag: t.comment, color: activePalette.comment, fontStyle: "italic" },
	{
		tag: [t.punctuation, t.meta],
		color: activePalette.comment,
		opacity: "0.5",
	},
]);

export const sitecueTheme = [
	sitecueViewTheme,
	syntaxHighlighting(sitecueHighlightStyle),
];
