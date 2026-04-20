import { create } from "zustand";
import type { Draft, GroupedNotes, Note } from "@/app/notes/types";
import { createClient } from "@/utils/supabase/client";
import { normalizeUrlForGrouping } from "@/utils/url";

interface NotesState {
	notes: Note[];
	drafts: Draft[];
	groupedNotes: GroupedNotes | null;
	isMetadataFetched: boolean;
	fetchMetadata: () => Promise<void>;
	fetchContentForIds: (ids: string[]) => Promise<void>;
	searchResults: Note[] | null;
	setSearchResults: (results: Note[] | null) => void;
}

function groupNotes(notes: Note[], drafts: Draft[]): GroupedNotes {
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

export const useNotesStore = create<NotesState>((set, get) => ({
	notes: [],
	drafts: [],
	groupedNotes: null,
	isMetadataFetched: false,
	searchResults: null,

	setSearchResults: (results) => set({ searchResults: results }),

	fetchMetadata: async () => {
		if (get().isMetadataFetched) return;
		const supabase = createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) return;

		const [notesRes, draftsRes] = await Promise.all([
			// content を除外した Slim Fetching
			supabase
				.from("sitecue_notes")
				.select(
					"id, user_id, url_pattern, scope, note_type, is_pinned, is_resolved, is_favorite, is_expanded, sort_order, created_at, updated_at, draft_id, tags",
				)
				.eq("user_id", user.id)
				.order("is_pinned", { ascending: false })
				.order("sort_order", { ascending: true })
				.order("created_at", { ascending: false }),
			supabase
				.from("sitecue_drafts")
				.select("*")
				.eq("user_id", user.id)
				.order("updated_at", { ascending: false }),
		]);

		const notes = (notesRes.data as Note[]) || [];
		const drafts = (draftsRes.data as Draft[]) || [];
		const groupedNotes = groupNotes(notes, drafts);

		set({ notes, drafts, groupedNotes, isMetadataFetched: true });
	},

	fetchContentForIds: async (ids: string[]) => {
		if (ids.length === 0) return;
		const supabase = createClient();

		const { data } = await supabase
			.from("sitecue_notes")
			.select("id, content")
			.in("id", ids);

		if (!data) return;

		const contentMap = new Map(data.map((n) => [n.id, n.content]));

		const updatedNotes = get().notes.map((note) =>
			contentMap.has(note.id)
				? { ...note, content: contentMap.get(note.id) as string }
				: note,
		);

		set({
			notes: updatedNotes,
			groupedNotes: groupNotes(updatedNotes, get().drafts),
		});
	},
}));
