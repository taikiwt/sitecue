import { create } from "zustand";
import type { Draft, GroupedNotes, Note } from "@/app/notes/types";
import { normalizeUrlForGrouping } from "@/utils/url";

interface NotesState {
	searchResults: Note[] | null;
	setSearchResults: (results: Note[] | null) => void;
}

export function groupNotes(notes: Note[], drafts: Draft[]): GroupedNotes {
	const grouped: GroupedNotes = {
		inbox: [],
		drafts: drafts,
		domains: {},
	};

	for (const note of notes) {
		// scope === 'draft' は一時的なコメントなので除外
		if (note.scope === "draft") continue;

		if (note.scope === "inbox") {
			grouped.inbox.push(note);
			continue;
		}

		// 正規化したドメイン名（基底ドメイン）をキーにする
		const normalized = normalizeUrlForGrouping(note.url_pattern);
		const domain = normalized.split("/")[0];

		if (!grouped.domains[domain]) {
			grouped.domains[domain] = { domainNotes: [], pages: {} };
		}

		if (note.scope === "domain") {
			grouped.domains[domain].domainNotes.push(note);
		} else if (note.scope === "exact") {
			if (!grouped.domains[domain].pages[note.url_pattern]) {
				grouped.domains[domain].pages[note.url_pattern] = [];
			}
			grouped.domains[domain].pages[note.url_pattern].push(note);
		}
	}

	return grouped;
}

export const useNotesStore = create<NotesState>((set, _get) => ({
	searchResults: null,

	setSearchResults: (results) => set({ searchResults: results }),
}));
