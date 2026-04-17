"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useNotesStore } from "@/store/useNotesStore";
import type { Draft, Note, SearchParams } from "../types";
import { LeftPaneNavigation } from "./LeftPaneNavigation";
import { MiddlePaneList } from "./MiddlePaneList";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";
import { RightPaneDetail } from "./RightPaneDetail";

export function NotesContainer() {
	const searchParams = useSearchParams();
	const {
		notes,
		drafts,
		groupedNotes,
		isMetadataFetched,
		fetchMetadata,
		fetchContentForIds,
	} = useNotesStore();

	// Convert searchParams to our SearchParams type
	const params: SearchParams = useMemo(() => {
		return {
			view: searchParams.get("view") as SearchParams["view"],
			domain: searchParams.get("domain") || undefined,
			exact: searchParams.get("exact") || undefined,
			noteId: searchParams.get("noteId") || undefined,
			draftId: searchParams.get("draftId") || undefined,
			new: searchParams.get("new") || undefined,
		};
	}, [searchParams]);

	// 初回メタデータ取得
	useEffect(() => {
		fetchMetadata();
	}, [fetchMetadata]);

	const { domain, exact } = params;
	const isNewNote = params.new === "note";

	const effectiveView = useMemo(
		() => params.view || (params.domain ? "domains" : null),
		[params.view, params.domain],
	);

	// フィルタリングされた一覧の計算 (既存の page.tsx から移植)
	const filteredItems = useMemo(() => {
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
	}, [groupedNotes, effectiveView, domain, exact]);

	// フォールバック: 表示されているリストの中に本文(content)がないものがあれば自動取得
	useEffect(() => {
		if (!isMetadataFetched || filteredItems.length === 0) return;

		const missingIds = filteredItems
			.filter(
				(item): item is Note =>
					"url_pattern" in item && item.content === undefined,
			)
			.map((item) => item.id);

		if (missingIds.length > 0) {
			fetchContentForIds(missingIds);
		}
	}, [filteredItems, isMetadataFetched, fetchContentForIds]);

	// 選択されたノートまたはドラフトの取得
	const selectedNote = useMemo(
		() =>
			params.noteId ? notes.find((n) => n.id === params.noteId) : undefined,
		[notes, params.noteId],
	);
	const selectedDraft = useMemo(
		() =>
			params.draftId ? drafts.find((d) => d.id === params.draftId) : undefined,
		[drafts, params.draftId],
	);

	if (!isMetadataFetched || !groupedNotes) {
		return null; // Initial loading state (handled by Suspense if we want a better fallback)
	}

	return (
		<ResponsiveNotesLayout
			selectedNoteId={params.noteId ?? null}
			selectedDraftId={params.draftId ?? null}
			leftNode={
				<LeftPaneNavigation
					groupedNotes={groupedNotes}
					currentView={effectiveView}
					currentDomain={domain ?? null}
					currentExact={exact ?? null}
				/>
			}
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
