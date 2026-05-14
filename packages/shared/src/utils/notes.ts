import type { NoteType, ViewScope } from "../types/app";
import { extractTags } from "./tags";
import { normalizeUrl } from "./url";

export interface CreateNoteInput {
	content: string;
	note_type: NoteType;
	scope: ViewScope;
	currentUrl: string; // 閲覧中のフルURLまたはコンテキストURL
}

export interface ResolvedNotePayload {
	url_pattern: string;
	content: string;
	note_type: NoteType;
	scope: ViewScope;
	tags: string[];
}

/**
 * 入力データからDBへ保存するためのペイロードを安全に解決する純粋な関数。
 */
export function resolveNotePayload(
	input: CreateNoteInput,
): ResolvedNotePayload {
	const trimmedContent = input.content.trim();
	const tags = extractTags(trimmedContent);

	let url_pattern: string;
	if (input.scope === "inbox" || input.scope === "draft") {
		url_pattern = input.scope;
	} else {
		// exact または domain の場合は正規化ユーティリティを経由して一意なパターンを算出
		url_pattern = normalizeUrl(input.currentUrl, input.scope);
	}

	return {
		url_pattern,
		content: trimmedContent,
		note_type: input.note_type,
		scope: input.scope,
		tags,
	};
}
