import type { Tables } from "../../../../../types/supabase";

export type Note = Omit<Tables<"sitecue_notes">, "content"> & {
	content?: string;
};
export type Draft = Tables<"sitecue_drafts">;

export interface DomainGroup {
	domainNotes: Note[]; // scope === 'domain' のノート
	pages: {
		[exactUrlPattern: string]: Note[]; // scope === 'exact' のノート
	};
}

export type GroupedNotes = {
	inbox: Note[];
	drafts: Draft[];
	domains: Record<string, DomainGroup>;
};

export type SearchParams = {
	view?: "inbox" | "drafts" | "domains";
	domain?: string;
	exact?: string;
	noteId?: string;
	draftId?: string;
	new?: string;
	q?: string;
	tags?: string;
};
