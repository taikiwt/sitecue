import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t, Tag, styleTags } from "@lezer/highlight";

// カスタムタグの定義
// const listMarkTag = Tag.define();
const allMarkersTag = Tag.define(); // すべての記号

// パレットの定義
const palettes = {
	sitecue: {
		// 薄青緑: #31676f
		// 明るめの青: #4892af
		// 黄/オレンジ: #ffb35c
		// ローズ: #e89895
		// 紫: #9280a8
		heading: "var(--color-action)",
		keyword: "#31676f",
		string: "#10b981",
		constant: "#6366f1",
		class: "#8b5cf6",
		link: "#548ca2",
		list: "#d7827e",
		comment: "#989898", // 記号（#や>）
		background: "#ffffff",
		labelName: "#e89895", // コードブロックの言語名の色
		url: "#9280a8",
		variableName: "#4892af",
		propertyName: "#9280a8",
		allMarkers: "#e89895", // 全ての記号: 青
	},
	zennLike: {
		heading: "var(--color-action)", // 見出しは黒で太字にするのがZenn流
		keyword: "#3b82f6", // 青系をアクセントに（リンクや記号用）
		string: "#10b981", // 緑系を控えめに
		constant: "#6366f1",
		class: "#8b5cf6",
		link: "var(--color-action)",
		list: "#d7827e",
		comment: "var(--color-action)", // 記号（#や>）
		background: "#ffffff",
		labelName: "var(--color-action)",
		url: "var(--color-action)",
		allMarkers: "var(--color-action)", // 全ての記号
	},
};

// ★ ここを書き換えるだけで、すべての色が一括で変わります
const activePalette = palettes.sitecue;

// 2. ViewTheme (箱のスタイル)
const sitecueViewTheme = EditorView.theme({
	"&": {
		color: "var(--foreground)",
		backgroundColor: "transparent",
		fontSize: "16px",
	},
	".cm-content": {
		caretColor: "var(--color-action)", // カーソル色をアクセントカラーに
		// fontFamily: "var(--font-editor)",
		fontFamily: "var(--font-hack), system-ui, sans-serif",
		padding: "16px",
	},
	".cm-scroller": {
		lineHeight: "1.8",
		fontFamily: "inherit",
	},
	// 選択範囲を優しく
	"&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
		// backgroundColor: "var(--color-accent)",
		backgroundColor: "rgba(var(--color-action-rgb), 0.15)",
	},
	// アクティブな行の背景を消す（ノイズ削減）
	".cm-activeLine": {
		backgroundColor: "transparent",
	},
	// カーソルを少し太くして視認性を上げる
	".cm-cursor": {
		borderLeft: "2.5px solid var(--color-action)",
		marginLeft: "-1.25px",
	},
	// プレースホルダーの色を薄く
	".cm-placeholder": {
		color: "#a3a3a3",
		fontStyle: "normal",
	},
});

// 3. HighlightStyle (文字の色)
const sitecueHighlightStyle = HighlightStyle.define([
	// --- 追加部分: リスト記号のスタイル ---
	{ tag: allMarkersTag, color: activePalette.allMarkers, fontWeight: "bold" },

	// 見出し: 色よりも「太さ」と「サイズ」で差をつける
	{
		tag: t.heading1,
		fontSize: "1.5em",
		fontWeight: "bold",
		color: activePalette.heading,
	},
	{
		tag: t.heading2,
		fontSize: "1.3em",
		fontWeight: "bold",
		color: activePalette.heading,
	},
	{
		tag: t.heading3,
		fontSize: "1.1em",
		fontWeight: "bold",
		color: activePalette.heading,
	},
	{
		tag: t.heading4,
		fontSize: "1.0em",
		fontWeight: "bold",
		color: activePalette.heading,
	},

	// 強調
	{ tag: t.strong, fontWeight: "bold", color: "var(--foreground)" },

	// リンク
	{ tag: t.link, color: activePalette.link, textDecoration: "underline" },

	// 引用・リストなどの「記号」を薄くする（メンタルノイズの削減）
	// {
	// 	tag: [t.processingInstruction, t.string, t.inserted, t.punctuation, t.meta],
	// 	color: activePalette.comment,
	// },

	// { tag: t.processingInstruction, color: "#eb6f92" }, // 強調文字の記号
	// { tag: t.string, color: "#eb6f92" }, // "文字列"
	// { tag: t.inserted, color: "#eb6f92" }, // 不明
	// { tag: t.punctuation, color: "#eb6f92" }, // コードの () や ; など
	{ tag: t.meta, color: "#989898" }, // 強調文字の記号

	// インラインコード
	{
		tag: t.monospace,
		backgroundColor: "rgba(0,0,0,0.05)",
		color: "var(--foreground)",
		borderRadius: "4px",
		padding: "0.1em 0.3em",
		fontFamily: "var(--font-mono)",
	},

	// コメント
	{ tag: t.comment, color: activePalette.comment, fontStyle: "italic" },

	// { tag: t.list, color: activePalette.list },
	{ tag: t.keyword, color: activePalette.keyword },
	// { tag: t.lineComment, color: activePalette.list },
	// { tag: t.blockComment, color: activePalette.list },
	{ tag: t.variableName, color: activePalette.variableName },
	{ tag: t.propertyName, color: activePalette.propertyName },
	{ tag: t.labelName, color: activePalette.labelName }, // コードブロックの言語名
	{ tag: t.url, color: activePalette.url }, // リンクのURL
	// { tag: t.atom, color: activePalette.list }, // チェックボックスリストの[]
	// { tag: t.quote, color: activePalette.list }, // 引用文
	// { tag: t.list, color: activePalette.list }, // リスト全体
	{ tag: t.emphasis, fontStyle: "italic" }, // 斜体
	{ tag: t.strikethrough, textDecoration: "line-through", opacity: "0.5" }, // 打ち消し線
]);

// パーサー拡張 (エディタを初期化する際の markdown() 関数に渡す必要がある設定)
export const allMarkersExtension = {
	props: [
		styleTags({
			HeaderMark: allMarkersTag, // # (見出し)
			QuoteMark: allMarkersTag, // > (引用)
			ListMark: allMarkersTag, // - * + (リスト)
			LinkMark: allMarkersTag, // [ ] ( ) (リンク)
			// EmphasisMark: allMarkersTag, // * _ (強調)
			CodeMark: allMarkersTag, // ` (インラインコード)
			// URL: allMarkersTag, // URL自体も記号っぽく扱いたい場合
		}),
	],
};

export const sitecueTheme = [
	sitecueViewTheme,
	syntaxHighlighting(sitecueHighlightStyle),
];
