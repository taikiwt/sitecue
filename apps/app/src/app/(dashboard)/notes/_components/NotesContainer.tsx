"use client";

import type { Diary } from "@sitecue/shared";
import { getSafeUrl } from "@sitecue/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useFetchDiaries } from "@/hooks/useDiariesQuery";
import { useFetchDrafts } from "@/hooks/useDraftsQuery";
import { useFetchNoteContents, useFetchNotes } from "@/hooks/useNotesQuery";
import { groupNotes } from "@/store/useNotesStore";
import type { Draft, Note, SearchParams } from "../types";
import { MiddlePaneList } from "./MiddlePaneList";
import { ResponsiveNotesLayout } from "./ResponsiveNotesLayout";
import { RightPaneDetail } from "./RightPaneDetail";

const SKELETON_HOLD_MS = 200;

export function NotesContainer() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { data: notes = [], isLoading: isNotesLoading } = useFetchNotes();
	const { data: drafts = [], isLoading: isDraftsLoading } = useFetchDrafts();
	const { data: diaries = [], isLoading: isDiariesLoading } = useFetchDiaries();
	const { mutate: fetchContentForIds } = useFetchNoteContents();

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
			year: searchParams.get("year") || undefined,
			month: searchParams.get("month") || undefined,
			date: searchParams.get("date") || undefined,
		};
	}, [searchParams]);

	const { domain, exact } = params;
	const isNewNote = params.new === "note";

	// 【多層防御の正規化】params.view が exact や domain など旧形式・非正規値の場合は domains へ安全にフォールバック
	const effectiveView = useMemo(() => {
		const rawView = params.view as string | undefined;
		if (
			rawView &&
			["domains", "inbox", "drafts", "diaries"].includes(rawView)
		) {
			return rawView as SearchParams["view"] & string;
		}
		return "domains";
	}, [params.view]);

	// クエリデータの準備完了状態（対象ビューに必要なデータが準備できているか判定）
	const isTabReady = useMemo(() => {
		if (effectiveView === "drafts") return !isDraftsLoading;
		if (effectiveView === "diaries") return !isDiariesLoading;
		return !isNotesLoading && !isDraftsLoading;
	}, [effectiveView, isDraftsLoading, isDiariesLoading, isNotesLoading]);

	// スケルトン表示保護タイマー管理
	const [showSkeleton, setShowSkeleton] = useState(true);

	const groupedNotes = useMemo(() => {
		if (isNotesLoading || isDraftsLoading) return null;
		return groupNotes(notes, drafts);
	}, [notes, drafts, isNotesLoading, isDraftsLoading]);

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

	// フィルタリングされた一覧の計算
	const filteredItems = useMemo(() => {
		if (!isTabReady) return [];

		let items: (Note | Draft | Diary)[] = [];
		if (effectiveView === "drafts") {
			items = drafts;
		} else if (effectiveView === "diaries") {
			items = diaries;
		} else if (!groupedNotes) {
			items = [];
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
			items = [...notes, ...drafts];
		} else {
			items = notes;
		}

		if (!query) return items;

		return items.filter((item) => {
			if ("date" in item) {
				const diary = item as Diary;
				return diary.content?.toLowerCase().includes(query) ?? false;
			}

			if ("url_pattern" in item) {
				const note = item as Note;

				if (effectiveView === "domains" && !domain && !isSearchActive) {
					const safeUrl = getSafeUrl(note.url_pattern);
					const searchableHost = safeUrl ? safeUrl.hostname : note.url_pattern;
					return searchableHost.toLowerCase().includes(query);
				}

				if (effectiveView === "domains" && domain && !exact) {
					const safeUrl = getSafeUrl(note.url_pattern);
					const searchablePath = safeUrl
						? safeUrl.pathname + safeUrl.search
						: note.url_pattern;
					return searchablePath.toLowerCase().includes(query);
				}

				if (note.content === undefined) return true;
				if (!note.content) return false;

				return note.content.toLowerCase().includes(query);
			}

			const draft = item as Draft;
			return draft.content?.toLowerCase().includes(query) ?? false;
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
		diaries,
		isTabReady,
	]);

	// 初回データロード後の 200ms 保護タイマー ＆ 軽量ケース（5件以下）スキップ処理
	useEffect(() => {
		if (!isTabReady) return;

		// 軽量ケース判定: 5件以下かつ文字数が一定以下の場合は0msでスケルトン消去
		const isLightweight =
			filteredItems.length <= 5 &&
			filteredItems.every((item) => {
				const len = "content" in item && item.content ? item.content.length : 0;
				return len < 1000;
			});

		if (isLightweight) {
			setShowSkeleton(false);
			return;
		}

		const timer = setTimeout(() => {
			setShowSkeleton(false);
		}, SKELETON_HOLD_MS);

		return () => clearTimeout(timer);
	}, [isTabReady, filteredItems]);

	// 非同期・ノンブロッキング遅延描画用の用例
	const deferredFilteredItems = useDeferredValue(filteredItems);

	// 本文の遅延取得 (Hydration)
	useEffect(() => {
		if (!isTabReady || deferredFilteredItems.length === 0) return;

		const missingIds = deferredFilteredItems
			.filter(
				(item): item is Note =>
					"url_pattern" in item && item.content === undefined,
			)
			.map((item) => item.id);

		if (missingIds.length > 0) {
			fetchContentForIds(missingIds);
		}
	}, [deferredFilteredItems, isTabReady, fetchContentForIds]);

	const selectedNote = useMemo(() => {
		if (!params.noteId) return undefined;
		return notes.find((n) => n.id === params.noteId);
	}, [notes, params.noteId]);

	const selectedDraft = useMemo(
		() =>
			params.draftId ? drafts.find((d) => d.id === params.draftId) : undefined,
		[drafts, params.draftId],
	);

	const isListLoading = !isTabReady || showSkeleton;

	return (
		<ResponsiveNotesLayout
			selectedNoteId={params.noteId ?? null}
			selectedDraftId={params.draftId ?? null}
			selectedDate={params.date ?? null}
			middleNode={
				<MiddlePaneList
					items={deferredFilteredItems}
					groupedNotes={groupedNotes || { inbox: [], drafts: [], domains: {} }}
					currentView={effectiveView}
					currentDomain={domain ?? null}
					currentExact={exact ?? null}
					selectedNoteId={params.noteId ?? null}
					selectedDraftId={params.draftId ?? null}
					isLoading={isListLoading}
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
