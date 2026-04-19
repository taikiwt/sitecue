/**
 * Extracts hashtags from Markdown text.
 * Ignores strings inside code blocks (```...```) and inline code (`...`).
 */
export function extractTags(content: string | undefined | null): string[] {
	if (!content) return [];

	// 1. Remove multi-line code blocks (```code```)
	let text = content.replace(/```[\s\S]*?```/g, "");

	// 2. Remove inline code (`code`)
	text = text.replace(/`[^`]*`/g, "");

	// 3. Extract hashtags (starts with # preceded by start of line or whitespace)
	const matches = text.match(/(^|\s)#([^\s#]+)/g);

	if (!matches) return [];

	// 4. Remove '#' and whitespace, and remove duplicates
	const tags = matches.map((m) => m.trim().substring(1));
	return Array.from(new Set(tags));
}
