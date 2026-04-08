import type { Tables } from "../../../../../types/supabase";

export type Note = Tables<"sitecue_notes">;

export type GroupedNotes = {
	inbox: Note[];
	domains: {
		[domain: string]: {
			domainNotes: Note[];
			exactPages: {
				[exactUrl: string]: Note[];
			};
		};
	};
};
