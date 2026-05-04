"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useFetchDrafts } from "@/hooks/useDraftsQuery";
import {
	useFetchNoteContents,
	useFetchNotes,
	useSearchNotes,
} from "@/hooks/useNotesQuery";
import { groupNotes } from "@/store/useNotesStore";
import type { Draft, Note, SearchParams } from "../types";
import { MiddlePaneList } from "./MiddlePaneList";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";
import { RightPaneDetail } from "./RightPaneDetail";

export function NotesContainer() {
	const searchParams = useSearchParams();
	const { data: notes = [], isLoading: isNotesLoading } = useFetchNotes();
	const { data: drafts = [], isLoading: isDraftsLoading } = useFetchDrafts();
	const { mutate: fetchContentForIds } = useFetchNoteContents();

	const groupedNotes = useMemo(() => {
		if (isNotesLoading || isDraftsLoading) return null;
		return groupNotes(notes, drafts);
	}, [notes, drafts, isNotesLoading, isDraftsLoading]);

	const isDataReady = !isNotesLoading && !isDraftsLoading;

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

	// 1. TanStack Queryによる検索の宣言的実行
	const isSearchActive = !!params.q || !!params.tags;
	const {
		// 修正: 初期値をオブジェクト { notes: [], drafts: [] } に変更
		data: searchResults = { notes: [], drafts: [] },
		isLoading: isSearchLoading,
		isFetching: isSearchFetching,
	} = useSearchNotes(params.q, params.tags);
	const isSearching = isSearchLoading || isSearchFetching;

	const { domain, exact } = params;
	const isNewNote = params.new === "note";

	const effectiveView = useMemo(
		() => params.view || (params.domain ? "domains" : null),
		[params.view, params.domain],
	);

	// フィルタリングされた一覧の計算 (既存の page.tsx から移植)
	const filteredItems = useMemo(() => {
		if (isSearchActive) {
			// 修正: notesとdraftsを平坦化
			const flatSearchResults: (Note | Draft)[] = [
				...(searchResults.notes || []),
				...(searchResults.drafts || []),
			];

			// 修正: 二次フィルタリングの適用
			return flatSearchResults.filter((item) => {
				const isNote = "url_pattern" in item;

				if (exact) {
					return isNote && item.url_pattern === exact;
				}
				if (domain && domain !== "inbox") {
					return isNote && item.url_pattern.startsWith(domain);
				}
				return true;
			});
		}

		if (!groupedNotes) return [];

		let items: (Note | Draft)[] = [];
		if (effectiveView === "drafts") {
			items = groupedNotes.drafts;
		} else if (exact === "all") {
			items = groupedNotes.domains[domain || ""]?.domainNotes || [];
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
	}, [
		groupedNotes,
		effectiveView,
		domain,
		exact,
		searchResults,
		isSearchActive,
	]);

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

		// 1. 検索結果（ローカル状態・完全なデータ）を先に評価する
		if (isSearchActive) {
			// 修正: searchResults.notes に対して .find を実行する
			const foundInSearch = searchResults.notes?.find(
				(n) => n.id === params.noteId,
			);
			if (foundInSearch) return foundInSearch;
		}

		// 2. なければ全体データ（Slim Fetchingキャッシュ等）から探す
		return notes.find((n) => n.id === params.noteId);
	}, [notes, searchResults.notes, params.noteId, isSearchActive]);

	const selectedDraft = useMemo(
		() =>
			params.draftId ? drafts.find((d) => d.id === params.draftId) : undefined,
		[drafts, params.draftId],
	);

	if (!isDataReady || !groupedNotes) {
		return null; // Initial loading state (handled by Suspense if we want a better fallback)
	}

	// 5. ローディング中のスケルトンUIコンポーネント (MiddleNode用)
	const MiddleNodeContent =
		isSearchActive && isSearching ? (
			<div
				className="flex flex-col h-full bg-base-bg border-r border-base-border w-96 p-4 gap-4"
				role="status"
				aria-busy="true"
				aria-label="Loading search results"
			>
				<div className="h-6 bg-base-surface border border-base-border rounded w-1/3 animate-pulse" />
				<div className="flex flex-col gap-2 mt-4">
					{[1, 2, 3, 4, 5].map((i) => (
						<div
							key={i}
							className="h-24 bg-base-surface border border-base-border rounded-lg w-full animate-pulse"
						/>
					))}
				</div>
			</div>
		) : (
			<MiddlePaneList
				items={filteredItems}
				groupedNotes={groupedNotes}
				currentView={effectiveView}
				currentDomain={domain ?? null}
				currentExact={exact ?? null}
				selectedNoteId={params.noteId ?? null}
				selectedDraftId={params.draftId ?? null}
			/>
		);

	return (
		<ResponsiveNotesLayout
			selectedNoteId={params.noteId ?? null}
			selectedDraftId={params.draftId ?? null}
			middleNode={MiddleNodeContent}
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
