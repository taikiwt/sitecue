/**
 * Markdownテキストからハッシュタグを抽出する純粋な関数。
 * コードブロック (```...```) およびインラインコード (`...`) 内の文字列は無視する。
 */
export function extractTags(content: string | undefined | null): string[] {
	if (!content) return [];

	// 1. 複数行のコードブロックを削除 (```code```)
	let text = content.replace(/```[\s\S]*?```/g, "");

	// 2. インラインコードを削除 (`code`)
	text = text.replace(/`[^`]*`/g, "");

	// 3. ハッシュタグを抽出 (行頭または空白の直後にある # から始まり、空白や#以外の文字が続く)
	const matches = text.match(/(^|\s)#([^\s#]+)/g);

	if (!matches) return [];

	// 4. '#' や空白を除去し、重複を排除
	const tags = matches.map((m) => m.trim().substring(1));
	return Array.from(new Set(tags));
}
