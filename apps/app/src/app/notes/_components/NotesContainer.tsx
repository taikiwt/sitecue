"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFetchNoteContents, useFetchNotes } from "@/hooks/useNotesQuery";
import { groupNotes, useNotesStore } from "@/store/useNotesStore";
import { createClient } from "@/utils/supabase/client";
import type { Draft, Note, SearchParams } from "../types";
import { MiddlePaneList } from "./MiddlePaneList";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";
import { RightPaneDetail } from "./RightPaneDetail";

export function NotesContainer() {
	const searchParams = useSearchParams();
	const { data: notes = [], isLoading: isNotesLoading } = useFetchNotes();
	const { mutate: fetchContentForIds } = useFetchNoteContents();
	const {
		drafts,
		isMetadataFetched: isDraftsFetched,
		searchResults,
		setSearchResults,
	} = useNotesStore();

	const groupedNotes = useMemo(() => {
		if (isNotesLoading) return null;
		return groupNotes(notes, drafts);
	}, [notes, drafts, isNotesLoading]);

	const isDataReady = !isNotesLoading && isDraftsFetched;

	// Convert searchParams to our SearchParams type
	const params: SearchParams = useMemo(() => {
		return {
			view: searchParams.get("view") as SearchParams["view"],
			domain:
				searchParams.get("domain") ||
				(!searchParams.get("view") && !searchParams.get("q")
					? "inbox"
					: undefined),
			exact: searchParams.get("exact") || undefined,
			noteId: searchParams.get("noteId") || undefined,
			draftId: searchParams.get("draftId") || undefined,
			new: searchParams.get("new") || undefined,
			q: searchParams.get("q") || undefined,
			tags: searchParams.get("tags") || undefined,
		};
	}, [searchParams]);

	const [_isSearching, setIsSearching] = useState(false);

	// Implement database-level search
	useEffect(() => {
		if (!params.q && !params.tags) {
			setSearchResults(null);
			return;
		}

		const fetchSearch = async () => {
			setIsSearching(true);
			try {
				const supabase = createClient();
				let query = supabase.from("sitecue_notes").select("*");

				if (params.q) {
					query = query.ilike("content", `%${params.q}%`);
				}
				if (params.tags) {
					const tagsArray = params.tags.split(",");
					query = query.contains("tags", tagsArray);
				}

				const { data, error } = await query
					.order("is_pinned", { ascending: false })
					.order("created_at", { ascending: false });

				if (error) throw error;
				setSearchResults((data as Note[]) || []);
			} catch (err) {
				console.error("Search failed:", err);
			} finally {
				setIsSearching(false);
			}
		};

		fetchSearch();
	}, [params.q, params.tags, setSearchResults]);

	const { domain, exact } = params;
	const isNewNote = params.new === "note";

	const effectiveView = useMemo(
		() => params.view || (params.domain ? "domains" : null),
		[params.view, params.domain],
	);

	// フィルタリングされた一覧の計算 (既存の page.tsx から移植)
	const filteredItems = useMemo(() => {
		if (searchResults !== null) return searchResults;
		if (!groupedNotes) return [];

		let items: (Note | Draft)[] = [];
		if (effectiveView === "drafts") {
			items = groupedNotes.drafts;
		} else if (exact) {
			items = groupedNotes.domains[domain || ""]?.pages[exact] || [];
		} else if (effectiveView === "inbox" || domain === "inbox") {
			items = groupedNotes.inbox;
		} else if (domain) {
			const domainData = groupedNotes.domains[domain];
			if (domainData) {
				items = [
					...domainData.domainNotes,
					...Object.values(domainData.pages).flat(),
				];
				// ソート
				items.sort((a, b) => {
					const noteA = a as Note;
					const noteB = b as Note;

					if (noteA.is_pinned !== noteB.is_pinned) {
						return noteA.is_pinned ? -1 : 1;
					}
					if (noteA.sort_order !== noteB.sort_order) {
						const orderA = noteA.sort_order ?? Number.MAX_SAFE_INTEGER;
						const orderB = noteB.sort_order ?? Number.MAX_SAFE_INTEGER;
						return orderA - orderB;
					}
					return (
						new Date(noteB.created_at).getTime() -
						new Date(noteA.created_at).getTime()
					);
				});
			}
		}
		return items;
	}, [groupedNotes, effectiveView, domain, exact, searchResults]);

	// フォールバック: 表示されているリストの中に本文(content)がないものがあれば自動取得
	useEffect(() => {
		if (!isDataReady || filteredItems.length === 0) return;

		const missingIds = filteredItems
			.filter(
				(item): item is Note =>
					"url_pattern" in item && item.content === undefined,
			)
			.map((item) => item.id);

		if (missingIds.length > 0) {
			fetchContentForIds(missingIds);
		}
	}, [filteredItems, isDataReady, fetchContentForIds]);

	// 選択されたノートまたはドラフトの取得
	const selectedNote = useMemo(() => {
		if (!params.noteId) return undefined;
		// まず全体データから探す
		const foundInNotes = notes.find((n) => n.id === params.noteId);
		if (foundInNotes) return foundInNotes;
		// なければ検索結果（ローカル状態）から探す
		if (searchResults) {
			return searchResults.find((n) => n.id === params.noteId);
		}
		return undefined;
	}, [notes, searchResults, params.noteId]);
	const selectedDraft = useMemo(
		() =>
			params.draftId ? drafts.find((d) => d.id === params.draftId) : undefined,
		[drafts, params.draftId],
	);

	if (!isDataReady || !groupedNotes) {
		return null; // Initial loading state (handled by Suspense if we want a better fallback)
	}

	return (
		<ResponsiveNotesLayout
			selectedNoteId={params.noteId ?? null}
			selectedDraftId={params.draftId ?? null}
			middleNode={
				<MiddlePaneList
					items={filteredItems}
					currentView={effectiveView}
					currentDomain={domain ?? null}
					currentExact={exact ?? null}
					selectedNoteId={params.noteId ?? null}
					selectedDraftId={params.draftId ?? null}
				/>
			}
			rightNode={
				<RightPaneDetail
					note={selectedNote}
					draft={selectedDraft}
					isNewNote={isNewNote}
				/>
			}
		/>
	);
}
