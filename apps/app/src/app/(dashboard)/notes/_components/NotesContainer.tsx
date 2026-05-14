"use client";

import { getSafeUrl } from "@sitecue/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useFetchDrafts } from "@/hooks/useDraftsQuery";
import { useFetchNoteContents, useFetchNotes } from "@/hooks/useNotesQuery";
import { groupNotes } from "@/store/useNotesStore";
import type { Draft, Note, SearchParams } from "../types";
import { MiddlePaneList } from "./MiddlePaneList";
import { MiddlePaneListSkeleton } from "./NotesSkeletons";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";
import { RightPaneDetail } from "./RightPaneDetail";

export function NotesContainer() {
	const searchParams = useSearchParams();
	const router = useRouter();
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
			domain: searchParams.get("domain") || undefined,
			exact: searchParams.get("exact") || undefined,
			noteId: searchParams.get("noteId") || undefined,
			draftId: searchParams.get("draftId") || undefined,
			new: searchParams.get("new") || undefined,
			q: searchParams.get("q") || undefined,
			tags: searchParams.get("tags") || undefined,
		};
	}, [searchParams]);

	const { domain, exact } = params;
	const isNewNote = params.new === "note";

	const effectiveView = useMemo(() => {
		if (params.view) return params.view;
		if (params.domain && params.domain !== "inbox") return "domains";
		return "inbox";
	}, [params.view, params.domain]);

	// Inbox URLのクリーンアップ (domain=inbox の排除)
	useEffect(() => {
		if (params.domain === "inbox") {
			const newParams = new URLSearchParams(searchParams.toString());
			newParams.delete("domain");
			newParams.set("view", "inbox");
			router.replace(`${window.location.pathname}?${newParams.toString()}`);
		}
	}, [params.domain, searchParams, router]);

	const isSearchActive = !!params.q || !!params.tags;
	const query = params.q?.toLowerCase() || "";

	// フィルタリングされた一覧の計算 (Frontend Search & Late-Binding)
	const filteredItems = useMemo(() => {
		if (!isDataReady || !groupedNotes) return [];

		// 1. View / Domain による一次フィルタリング
		let items: (Note | Draft)[] = [];
		if (effectiveView === "drafts") {
			items = drafts;
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
					if (noteA.is_pinned !== noteB.is_pinned)
						return noteA.is_pinned ? -1 : 1;
					if (noteA.sort_order !== noteB.sort_order) {
						return (noteA.sort_order ?? 0) - (noteB.sort_order ?? 0);
					}
					return (
						new Date(noteB.created_at).getTime() -
						new Date(noteA.created_at).getTime()
					);
				});
			}
		} else if (isSearchActive) {
			// 全件からの検索（ビュー指定がない場合）
			items = [...notes, ...drafts];
		} else {
			// デフォルト（inbox）
			items = groupedNotes.inbox;
		}

		// 2. クイックフィルター (q パラメータによる絞り込み)
		if (!query) return items;

		return items.filter((item) => {
			const isNote = "url_pattern" in item;

			if (isNote) {
				const note = item as Note;

				if (effectiveView === "domains" && !domain) {
					// ドメイン一覧画面での検索
					const safeUrl = getSafeUrl(note.url_pattern);
					const searchableHost = safeUrl ? safeUrl.hostname : note.url_pattern;
					return searchableHost.toLowerCase().includes(query);
				}

				if (effectiveView === "domains" && domain && !exact) {
					// ページ一覧画面での検索
					const safeUrl = getSafeUrl(note.url_pattern);
					const searchablePath = safeUrl
						? safeUrl.pathname + safeUrl.search
						: note.url_pattern;
					return searchablePath.toLowerCase().includes(query);
				}
			}

			// Notes / Drafts の場合
			if (!isNote) {
				// Drafts: タイトル（content）で検索
				return (item as Draft).content?.toLowerCase().includes(query);
			}

			// Slim Fetching対応: 本文が未取得（undefined）の場合は除外せず残す
			// これにより、描画された瞬間に fetchContentForIds が走り、
			// データ取得後に再レンダリング & 再フィルタリングが走る
			const note = item as Note;
			if (note.content === undefined) return true;
			// nullチェック（空のノート）
			if (!note.content) return false;

			return note.content.toLowerCase().includes(query);
		});
	}, [
		groupedNotes,
		effectiveView,
		domain,
		exact,
		isSearchActive,
		query,
		notes,
		drafts,
		isDataReady,
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
		// 全体データ（Slim Fetchingキャッシュ等）から探す
		return notes.find((n) => n.id === params.noteId);
	}, [notes, params.noteId]);

	const selectedDraft = useMemo(
		() =>
			params.draftId ? drafts.find((d) => d.id === params.draftId) : undefined,
		[drafts, params.draftId],
	);

	if (!isDataReady) {
		return (
			<ResponsiveNotesLayout
				selectedNoteId={params.noteId ?? null}
				selectedDraftId={params.draftId ?? null}
				middleNode={<MiddlePaneListSkeleton />}
				rightNode={null}
			/>
		);
	}

	if (!groupedNotes) return null;

	return (
		<ResponsiveNotesLayout
			selectedNoteId={params.noteId ?? null}
			selectedDraftId={params.draftId ?? null}
			middleNode={
				<MiddlePaneList
					items={filteredItems}
					groupedNotes={groupedNotes}
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
