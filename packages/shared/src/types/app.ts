import type { SitecueDraftBase, SitecueNoteBase } from "./database";

export type NoteType = "info" | "alert" | "idea";
export type ViewScope = "exact" | "domain" | "inbox" | "draft";

/**
 * 一覧取得（Slim Fetching）用のメタデータ型。
 * パフォーマンス最大化のため content を除外。
 */
export interface NoteMetadata
	extends Omit<SitecueNoteBase, "note_type" | "scope" | "content"> {
	note_type: NoteType;
	scope: ViewScope;
}

/**
 * 詳細表示・ハイドレーション完了後の完全なノート型。
 */
export interface Note extends NoteMetadata {
	content: string;
}

export type Draft = SitecueDraftBase;
