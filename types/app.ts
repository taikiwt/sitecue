import type { Database } from "./supabase";

export type NoteScope = "exact" | "domain" | "inbox" | "draft";

export type Note = Omit<
	Database["public"]["Tables"]["sitecue_notes"]["Row"],
	"scope"
> & {
	scope: NoteScope;
	tags?: string[];
};

export type Template = Database["public"]["Tables"]["sitecue_templates"]["Row"];

export type Draft = Database["public"]["Tables"]["sitecue_drafts"]["Row"] & {
	metadata: {
		slug?: string;
		[key: string]: unknown;
	} | null;
	sitecue_templates?: Template | null;
	tags?: string[];
};

export type PinnedSite =
	Database["public"]["Tables"]["sitecue_pinned_sites"]["Row"];
