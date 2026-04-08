import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { normalizeUrlForGrouping } from "@/utils/url";
import { LeftPaneNavigation } from "./_components/LeftPaneNavigation";
import { MiddlePaneList } from "./_components/MiddlePaneList";
import { RightPaneDetail } from "./_components/RightPaneDetail";
import type { Draft, GroupedNotes, Note } from "./types";

type SearchParams = {
	view?: "inbox" | "drafts" | "domains";
	domain?: string;
	exact?: string;
	noteId?: string;
	draftId?: string;
};

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

export default async function Dashboard(props: {
	searchParams: Promise<SearchParams>;
}) {
	const searchParams = await props.searchParams;
	const { domain, exact } = searchParams;

	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return redirect("/login");
	}

	const [notesRes, draftsRes] = await Promise.all([
		supabase
			.from("sitecue_notes")
			.select("*")
			.eq("user_id", user.id)
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

	const effectiveView =
		searchParams.view || (searchParams.domain ? "domains" : null);

	// フィルタリングされた一覧の取得
	let filteredItems: (Note | Draft)[] = [];
	if (effectiveView === "drafts") {
		filteredItems = groupedNotes.drafts;
	} else if (exact) {
		filteredItems = groupedNotes.domains[domain || ""]?.pages[exact] || [];
	} else if (effectiveView === "inbox" || domain === "inbox") {
		filteredItems = groupedNotes.inbox;
	} else if (domain) {
		const domainData = groupedNotes.domains[domain];
		if (domainData) {
			filteredItems = [
				...domainData.domainNotes,
				...Object.values(domainData.pages).flat(),
			];
			// 最後に作成日時順にソートし直す
			filteredItems.sort(
				(a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
			);
		}
	}

	// 選択されたノートまたはドラフトの取得
	const selectedNote = searchParams.noteId
		? notes.find((n) => n.id === searchParams.noteId)
		: undefined;
	const selectedDraft = searchParams.draftId
		? drafts.find((d) => d.id === searchParams.draftId)
		: undefined;

	return (
		<div className="flex h-screen overflow-hidden bg-white font-sans text-gray-900">
			{/* Left Plane: Navigation */}
			<LeftPaneNavigation
				groupedNotes={groupedNotes}
				currentView={effectiveView}
				currentDomain={domain ?? null}
				currentExact={exact ?? null}
			/>

			{/* Middle Pane: List */}
			<MiddlePaneList
				items={filteredItems}
				currentView={effectiveView}
				currentDomain={domain ?? null}
				currentExact={exact ?? null}
				selectedNoteId={searchParams.noteId ?? null}
				selectedDraftId={searchParams.draftId ?? null}
			/>

			{/* Right Pane: Detail */}
			<RightPaneDetail note={selectedNote} draft={selectedDraft} />
		</div>
	);
}
