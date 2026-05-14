import { normalizeUrlForGrouping } from "@sitecue/shared";
import { create } from "zustand";
import type { Draft, GroupedNotes, Note } from "@/app/(dashboard)/notes/types";

interface NotesState {
	_initialized?: boolean;
}

export function groupNotes(notes: Note[], drafts: Draft[]): GroupedNotes {
	const grouped: GroupedNotes = {
		inbox: [],
		drafts: drafts,
		domains: {},
	};

	notes.forEach((note) => {
		// scope === 'draft' は一時的なコメントなので除外
		if (note.scope === "draft") return;

		// 🚨 修正: url_pattern が何であれ、scope が 'inbox' の場合は Domains に含めない
		if (note.scope === "inbox") {
			grouped.inbox.push(note);
			return;
		}

		// 正規化したドメイン名（基底ドメイン）をキーにする
		const normalized = normalizeUrlForGrouping(note.url_pattern);
		const domain = normalized.split("/")[0];

		// セーフティ: もし url_pattern が何らかの理由で 'inbox' になっていても、
		// scope が 'inbox' でない場合は Domains 扱いになるが、
		// キーが 'inbox' になるのを防ぎたい場合はここで弾く。
		// しかし基本は scope === 'inbox' が正義。
		// 🚨 修正: domainが空文字（""）の場合、または "inbox" の場合はドメインとして扱わない
		// これにより url_pattern が空の不正データが Domains 一覧に出現するのを防ぐ
		if (!domain || domain === "inbox") return;

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
	});

	return grouped;
}

export const useNotesStore = create<NotesState>((_set, _get) => ({}));
