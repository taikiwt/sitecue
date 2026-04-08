import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LeftPaneNavigation } from "./_components/LeftPaneNavigation";
import { MiddlePaneList } from "./_components/MiddlePaneList";
import { RightPaneDetail } from "./_components/RightPaneDetail";
import type { GroupedNotes, Note } from "./types";

type SearchParams = {
	domain?: string;
	exact?: string;
	noteId?: string;
};

function groupNotes(notes: Note[]): GroupedNotes {
	const grouped: GroupedNotes = {
		inbox: [],
		domains: {},
	};

	for (const note of notes) {
		if (note.scope === "inbox") {
			grouped.inbox.push(note);
			continue;
		}

		let domain = "";
		try {
			// url_pattern が完全な URL であることを想定
			domain = new URL(note.url_pattern).hostname;
		} catch {
			// URL 形式でない場合はそのままドメインとして扱う
			domain = note.url_pattern;
		}

		if (!grouped.domains[domain]) {
			grouped.domains[domain] = { domainNotes: [], exactPages: {} };
		}

		if (note.scope === "domain") {
			grouped.domains[domain].domainNotes.push(note);
		} else if (note.scope === "exact") {
			if (!grouped.domains[domain].exactPages[note.url_pattern]) {
				grouped.domains[domain].exactPages[note.url_pattern] = [];
			}
			grouped.domains[domain].exactPages[note.url_pattern].push(note);
		}
	}

	return grouped;
}

export default async function Dashboard(props: {
	searchParams: Promise<SearchParams>;
}) {
	const searchParams = await props.searchParams;
	const { domain, exact, noteId } = searchParams;

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const { data: notesRaw } = await supabase
		.from("sitecue_notes")
		.select("*")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	const notes = (notesRaw as Note[]) || [];
	const groupedNotes = groupNotes(notes);

	// フィルタリングされたノート一覧の取得
	let filteredNotes: Note[] = [];
	if (exact) {
		filteredNotes = groupedNotes.domains[domain || ""]?.exactPages[exact] || [];
	} else if (domain) {
		// ドメイン全体のノート（scope=domain）と、その下の各ページのノート（scope=exact）を合算
		const domainData = groupedNotes.domains[domain];
		if (domainData) {
			filteredNotes = [
				...domainData.domainNotes,
				...Object.values(domainData.exactPages).flat(),
			];
			// 最後に作成日時順にソートし直す
			filteredNotes.sort(
				(a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
			);
		}
	} else {
		filteredNotes = groupedNotes.inbox;
	}

	// 選択されたノートの取得
	const selectedNote = notes.find((n) => n.id === noteId);

	return (
		<div className="flex h-screen overflow-hidden bg-white font-sans text-gray-900">
			{/* Left Plane: Navigation */}
			<LeftPaneNavigation
				groupedNotes={groupedNotes}
				currentDomain={domain ?? null}
				currentExact={exact ?? null}
			/>

			{/* Middle Pane: Note List */}
			<MiddlePaneList
				notes={filteredNotes}
				currentDomain={domain ?? null}
				currentExact={exact ?? null}
				selectedNoteId={noteId ?? null}
			/>

			{/* Right Pane: Note Detail */}
			<RightPaneDetail note={selectedNote} />
		</div>
	);
}
