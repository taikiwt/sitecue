import type { SitecueNoteBase } from "./database";

export type NoteType = "info" | "alert" | "idea";
export type ViewScope = "exact" | "domain" | "inbox" | "draft";

export interface Note extends Omit<SitecueNoteBase, "note_type" | "scope"> {
	note_type: NoteType;
	scope: ViewScope;
}
