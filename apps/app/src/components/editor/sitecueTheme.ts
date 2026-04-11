import { EditorView } from "@uiw/react-codemirror";

export const sitecueTheme = EditorView.theme({
	"&": {
		color: "#262626", // text-neutral-800相当
		backgroundColor: "transparent",
	},
	"&.cm-focused": {
		outline: "none", // デフォルトのアウトラインを消去
	},
	".cm-content": {
		caretColor: "#171717", // text-neutral-900相当
		fontFamily: "inherit",
		padding: "0", // 外側のラッパーでpaddingを取るため内部は0
	},
	".cm-content span": {
		textDecoration: "none !important",
		borderBottom: "none !important",
	},
	".cm-cursor, .cm-dropCursor": {
		borderLeftColor: "#171717",
		borderLeftWidth: "2px",
	},
	"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
		{
			backgroundColor: "#e5e5e5", // bg-neutral-200相当の柔らかな選択色
		},
	".cm-activeLine": {
		backgroundColor: "transparent", // アクティブ行のハイライトを消去
	},
	".cm-scroller": {
		fontFamily: "inherit",
		lineHeight: "1.75", // leading-relaxed相当
	},
});
