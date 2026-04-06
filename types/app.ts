import type { Database } from "./supabase";

export type NoteScope = "exact" | "domain" | "inbox";

export type Note = Omit<
	Database["public"]["Tables"]["sitecue_notes"]["Row"],
	"scope"
> & {
	scope: NoteScope;
};

export type DraftPlatform = "x" | "zenn" | "generic";

export type Draft = Omit<
	Database["public"]["Tables"]["sitecue_drafts"]["Row"],
	"target_platform"
> & {
	target_platform: DraftPlatform;
	metadata: {
		slug?: string;
		[key: string]: unknown;
	} | null;
};
