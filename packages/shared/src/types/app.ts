import type {
	SitecueDraftBase,
	SitecueNoteBase,
	SitecuePinnedSiteBase,
	SitecueTemplateBase,
} from "./database";

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

export type Draft = SitecueDraftBase & {
	sitecue_templates?: Template | null;
};
export type Template = SitecueTemplateBase;
export type PinnedSite = SitecuePinnedSiteBase;

export interface DashboardSnippetNote {
	id: string;
	content: string;
}

export interface DashboardPageActivity {
	page_url: string;
	page_title: string | null;
	page_count: number;
	page_notes: DashboardSnippetNote[];
}

export interface DashboardDomainActivity {
	domain: string;
	total_count: number;
	domain_notes: DashboardSnippetNote[];
	top_pages: DashboardPageActivity[];
}

